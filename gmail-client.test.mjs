import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GmailClient } from './gmail-client.mjs';

const EMAIL = 'pilot@example.com';
const DRAFT = { to: 'friend@example.no', subject: 'Привет, Øivind 🐈', body: 'Добрый день!\nСпасибо за помощь.' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const code = expected => error => error?.code === expected;
async function setup(handler = () => json({})) {
  const calls = [];
  const client = new GmailClient({ fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return url.endsWith('/profile') ? json({ emailAddress: EMAIL.toUpperCase() }) : handler(url, options);
  } });
  await client.connect({ accessToken: 'test-token-never-persist', email: EMAIL });
  return { client, calls };
}

test('connect matches verified mailbox case-insensitively and no persistence API exists', async () => {
  const { client, calls } = await setup();
  assert.equal(client.connected, true);
  assert.equal(client.email.toLowerCase(), EMAIL);
  assert.deepEqual(Object.keys(client), []);
  assert.equal(JSON.stringify(client), '{}');
  assert.equal(calls[0].options.credentials, 'omit');
  assert.equal(calls[0].options.redirect, 'error');
  const source = await readFile(new URL('./gmail-client.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB)\b/);
});
test('wrong connected Google mailbox clears credentials and rejects without exposing it', async () => {
  const client = new GmailClient({ fetchImpl: async () => json({ emailAddress: 'someone@example.com' }) });
  await assert.rejects(client.connect({ accessToken: 'token', email: EMAIL }), code('accountMismatch'));
  assert.equal(client.connected, false);
  await assert.rejects(client.listMessages(), code('authExpired'));
});
test('query is bounded and encoded into fixed Gmail endpoint', async () => {
  const { client, calls } = await setup(() => json({ messages: [{ id: 'abc123', threadId: 'thread1' }, { id: '../escape', threadId: 'bad' }], nextPageToken: 'page2', resultSizeEstimate: 2 }));
  const result = await client.listMessages({ q: 'from:friend@example.no subject:"cats & fjords"', maxResults: 20, pageToken: 'next&not=parameter' });
  const url = new URL(calls[1].url);
  assert.equal(url.origin, 'https://gmail.googleapis.com');
  assert.equal(url.searchParams.get('q'), 'from:friend@example.no subject:"cats & fjords"');
  assert.equal(url.searchParams.get('pageToken'), 'next&not=parameter');
  assert.equal(result.messages.length, 1);
  await assert.rejects(client.listMessages({ q: 'a'.repeat(301) }), code('invalidQuery'));
  await assert.rejects(client.listMessages({ maxResults: 21 }), code('invalidQuery'));
  await assert.rejects(client.getMessage('https://evil.test'), code('invalidId'));
  assert.equal(calls.length, 2);
});
test('reads plain UTF8 MIME only, ignores HTML, attachments and remote resources', async () => {
  const body64 = Buffer.from('Только обычный текст 🐈').toString('base64url');
  const { client, calls } = await setup(() => json({ threadId: 'thread1', snippet: 'preview', payload: {
    headers: [{ name: 'Subject', value: 'Cats\r\nignored' }], mimeType: 'multipart/mixed', parts: [
      { mimeType: 'text/html', body: { data: Buffer.from('<img src="https://tracker.test/pixel"><script>bad()</script>').toString('base64url') } },
      { mimeType: 'text/plain', filename: 'private.txt', body: { data: Buffer.from('attachment secret').toString('base64url') } },
      { mimeType: 'multipart/alternative', parts: [{ mimeType: 'text/plain', body: { data: body64 } }] },
    ],
  } }));
  const message = await client.getMessage('abc123');
  assert.equal(message.text, 'Только обычный текст 🐈');
  assert.equal(message.subject, 'Cats  ignored');
  assert.equal(calls.length, 2);
});
test('HTML-only messages use snippet rather than HTML execution or image loading', async () => {
  const { client } = await setup(() => json({ snippet: 'Safe preview', payload: { mimeType: 'text/html', body: { data: Buffer.from('<script>alert(1)</script>').toString('base64url') } } }));
  assert.equal((await client.getMessage('abc123')).text, 'Safe preview');
});
test('bounded recursion and output protect against excessive MIME trees', async () => {
  let payload = { mimeType: 'text/plain', body: { data: Buffer.from('too deep').toString('base64url') } };
  for (let i = 0; i < 20; i++) payload = { mimeType: 'multipart/mixed', parts: [payload] };
  const { client } = await setup(() => json({ snippet: 'fallback', payload }));
  assert.equal((await client.getMessage('abc123')).text, 'fallback');
});
test('header injection, multiple recipients and unsupported attachments are rejected', async () => {
  const { client, calls } = await setup();
  assert.throws(() => client.authorizeSend({ ...DRAFT, subject: 'Hello\r\nBcc: other@example.com' }), code('invalidSubject'));
  assert.throws(() => client.authorizeSend({ ...DRAFT, to: 'a@example.com,b@example.com' }), code('invalidRecipient'));
  assert.throws(() => client.authorizeSend({ ...DRAFT, to: 'friend@example.no\r\nBcc: a@example.com' }), code('invalidRecipient'));
  assert.throws(() => client.authorizeSend({ ...DRAFT, attachments: ['file'] }), code('invalidDraft'));
  assert.equal(calls.length, 1);
});
test('send requires original exact snapshot, rejects edits and consumes every authorization once', async () => {
  const { client, calls } = await setup(() => json({ id: 'sent123', threadId: 'thread1' }));
  await assert.rejects(client.send({ ...DRAFT }, DRAFT), code('authorizationRequired'));
  const changed = client.authorizeSend(DRAFT);
  assert.equal(Object.isFrozen(changed), true);
  await assert.rejects(client.send(changed, { ...DRAFT, body: 'changed' }), code('authorizationChanged'));
  await assert.rejects(client.send(changed, DRAFT), code('authorizationRequired'));
  const snapshot = client.authorizeSend(DRAFT);
  assert.deepEqual(await client.send(snapshot, DRAFT), { id: 'sent123', threadId: 'thread1' });
  await assert.rejects(client.send(snapshot, DRAFT), code('authorizationRequired'));
  assert.equal(calls.length, 2);
  const raw = JSON.parse(calls[1].options.body).raw;
  const mime = Buffer.from(raw, 'base64url').toString('utf8');
  assert.match(mime, /^From: PILOT@EXAMPLE.COM\r\nTo: friend@example.no\r\nSubject: =\?UTF-8\?B\?/i);
  assert.match(mime, /Content-Type: text\/plain; charset=UTF-8/);
  const encodedWords = [...mime.split('MIME-Version:')[0].matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)];
  assert.equal(encodedWords.map(m => Buffer.from(m[1], 'base64').toString('utf8')).join(''), DRAFT.subject);
  assert.equal(Buffer.from(mime.split('\r\n\r\n')[1], 'base64').toString('utf8'), DRAFT.body.replace(/\n/g, '\r\n'));
});
test('ambiguous send never retries or permits reuse, raw remote errors stay hidden', async () => {
  const { client, calls } = await setup(() => { throw new Error('token secret server details'); });
  const snapshot = client.authorizeSend(DRAFT);
  await assert.rejects(client.send(snapshot, DRAFT), error => error.code === 'unknownSend' && !error.message.includes('secret'));
  await assert.rejects(client.send(snapshot, DRAFT), code('authorizationRequired'));
  assert.equal(calls.length, 2);
});
test('controlled errors distinguish disabled API, permissions and expiry', async () => {
  for (const [status, errorBody, expected] of [
    [403, { error: { status: 'SERVICE_DISABLED', message: 'private token' } }, 'apiDisabled'],
    [403, { error: { status: 'PERMISSION_DENIED' } }, 'permission'],
    [401, { error: { message: 'private token' } }, 'authExpired'],
  ]) {
    const { client } = await setup(() => json(errorBody, status));
    await assert.rejects(client.listMessages(), error => error.code === expected && !error.message.includes('private'));
    if (status === 401) assert.equal(client.connected, false);
  }
});
test('logout aborts fetch and suppresses a late response even if transport ignores abort', async () => {
  let resolve, requestSignal;
  const { client } = await setup((_url, options) => { requestSignal = options.signal; return new Promise(done => { resolve = done; }); });
  const pending = client.listMessages();
  const snapshot = client.authorizeSend(DRAFT);
  client.disconnect();
  assert.equal(requestSignal.aborted, true);
  assert.equal(client.email, '');
  resolve(json({ messages: [{ id: 'abc', threadId: 'def' }] }));
  await assert.rejects(pending, code('disconnected'));
  await assert.rejects(client.send(snapshot, DRAFT), code('authorizationRequired'));
});
test('concurrent send duplicate is rejected before network, disconnect preserves unknown outcome', async () => {
  let resolve;
  const { client, calls } = await setup(() => new Promise(done => { resolve = done; }));
  const snapshot = client.authorizeSend(DRAFT);
  const pending = client.send(snapshot, DRAFT);
  await assert.rejects(client.send(snapshot, DRAFT), code('authorizationRequired'));
  client.disconnect();
  resolve(json({ id: 'possiblySent' }));
  await assert.rejects(pending, code('unknownSend'));
  assert.equal(calls.length, 2);
});
