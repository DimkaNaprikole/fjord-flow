// Gmail pilot: credentials live only in this instance, never in browser storage.
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const MAX_RESPONSE = 2_000_000;
const MAX_TEXT = 60_000;
const ID = /^[A-Za-z0-9_-]{1,160}$/;
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export class GmailClientError extends Error {
  constructor(code) { super(code); this.name = 'GmailClientError'; this.code = code; }
}
const fail = code => { throw new GmailClientError(code); };
const cleanText = (value, limit = MAX_TEXT) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, limit);
const emailAddress = value => {
  if (typeof value !== 'string' || value.length > 254 || !EMAIL.test(value)) fail('invalidRecipient');
  return value;
};
const validId = value => {
  if (typeof value !== 'string' || !ID.test(value)) fail('invalidId');
  return value;
};
const draftValue = draft => {
  if (!draft || typeof draft !== 'object' || Object.keys(draft).some(key => !['to', 'subject', 'body'].includes(key)) || typeof draft.subject !== 'string' || typeof draft.body !== 'string') fail('invalidDraft');
  const to = emailAddress(draft.to);
  if (draft.subject.length > 300 || /[\r\n\u0000-\u001f\u007f]/.test(draft.subject)) fail('invalidSubject');
  if (!draft.body.trim() || draft.body.length > 20_000 || /[\u0000]/.test(draft.body)) fail('invalidBody');
  return { to, subject: draft.subject, body: draft.body };
};
const sameDraft = (a, b) => a.to === b.to && a.subject === b.subject && a.body === b.body;
function encode64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function decodeBody(data) {
  if (typeof data !== 'string' || data.length > 1_000_000 || !/^[A-Za-z0-9_-]*={0,2}$/.test(data)) return '';
  try {
    const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    return cleanText(new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0))));
  } catch { return ''; }
}
function encodedSubject(text) {
  const words = [];
  let chunk = '';
  for (const char of text) {
    if (new TextEncoder().encode(chunk + char).length > 36) { words.push(`=?UTF-8?B?${encode64(chunk)}?=`); chunk = ''; }
    chunk += char;
  }
  if (chunk) words.push(`=?UTF-8?B?${encode64(chunk)}?=`);
  return words.join('\r\n ');
}
function extractPlain(payload) {
  const texts = [];
  let visited = 0, length = 0;
  function walk(part, depth) {
    if (!part || depth > 10 || ++visited > 100 || length >= MAX_TEXT) return;
    // HTML and attachment payloads are deliberately not rendered or downloaded.
    if (part.mimeType === 'text/plain' && !part.filename && !part.body?.attachmentId) {
      const value = decodeBody(part.body?.data).slice(0, MAX_TEXT - length);
      if (value) { texts.push(value); length += value.length; }
    }
    if (Array.isArray(part.parts)) for (const child of part.parts.slice(0, 100)) walk(child, depth + 1);
  }
  walk(payload, 0);
  return texts.join('\n').slice(0, MAX_TEXT);
}
function metadata(payload, name) {
  if (!Array.isArray(payload?.headers)) return '';
  const header = payload.headers.slice(0, 200).find(h => String(h?.name).toLowerCase() === name);
  return cleanText(header?.value, 1000).replace(/[\r\n]/g, ' ');
}

export class GmailClient {
  #fetch; #token = ''; #email = ''; #epoch = 0; #expiresAt = 0;
  #controllers = new Set(); #authorizations = new WeakMap();
  constructor({ fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl required');
    this.#fetch = fetchImpl.bind(globalThis);
  }
  get connected() { return Boolean(this.#token && this.#email && Date.now() < this.#expiresAt); }
  get email() { return this.connected ? this.#email : ''; }
  disconnect() {
    this.#epoch++;
    this.#token = ''; this.#email = ''; this.#expiresAt = 0;
    this.#authorizations = new WeakMap();
    for (const controller of this.#controllers) controller.abort();
    this.#controllers.clear();
  }
  async connect({ accessToken, email, expiresAt = Date.now() + 55 * 60_000 } = {}) {
    this.disconnect();
    emailAddress(email);
    if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 8192 || /[\s\u0000-\u001f\u007f]/.test(accessToken)) fail('authExpired');
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) fail('authExpired');
    this.#token = accessToken; this.#expiresAt = expiresAt;
    const epoch = this.#epoch;
    try {
      const result = await this.#request('/profile', {}, { allowPending: true });
      if (typeof result.emailAddress !== 'string' || result.emailAddress.toLowerCase() !== email.toLowerCase()) fail('accountMismatch');
      this.#email = result.emailAddress;
      return { emailAddress: this.#email };
    } catch (error) {
      if (epoch === this.#epoch) this.disconnect();
      throw error;
    }
  }
  async listMessages({ q = '', maxResults = 10, pageToken = '' } = {}) {
    if (typeof q !== 'string' || q.length > 300 || /[\u0000-\u001f\u007f]/.test(q)) fail('invalidQuery');
    if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 20) fail('invalidQuery');
    if (typeof pageToken !== 'string' || pageToken.length > 2048 || /[\u0000-\u001f\u007f]/.test(pageToken)) fail('invalidQuery');
    const query = new URLSearchParams({ maxResults: String(maxResults) });
    if (q) query.set('q', q);
    if (pageToken) query.set('pageToken', pageToken);
    const result = await this.#request(`/messages?${query}`);
    const messages = Array.isArray(result.messages) ? result.messages.slice(0, maxResults).filter(m => ID.test(m?.id ?? '') && ID.test(m?.threadId ?? '')).map(m => ({ id: m.id, threadId: m.threadId })) : [];
    return {
      messages,
      nextPageToken: typeof result.nextPageToken === 'string' && result.nextPageToken.length <= 2048 ? result.nextPageToken : '',
      resultSizeEstimate: Number.isSafeInteger(result.resultSizeEstimate) && result.resultSizeEstimate >= 0 ? result.resultSizeEstimate : 0,
    };
  }
  async getMessage(id) {
    validId(id);
    const result = await this.#request(`/messages/${id}?format=full`);
    const snippet = cleanText(result.snippet, 1000);
    return {
      id, threadId: ID.test(result.threadId ?? '') ? result.threadId : '',
      from: metadata(result.payload, 'from'), to: metadata(result.payload, 'to'),
      subject: metadata(result.payload, 'subject'), date: metadata(result.payload, 'date'),
      snippet, text: extractPlain(result.payload) || snippet,
    };
  }
  authorizeSend(draft) {
    if (!this.connected) fail('authExpired');
    const snapshot = Object.freeze(draftValue(draft));
    this.#authorizations.set(snapshot, { epoch: this.#epoch, expiresAt: Date.now() + 120_000, consumed: false });
    return snapshot;
  }
  async send(snapshot, currentDraft) {
    const authorization = snapshot && this.#authorizations.get(snapshot);
    if (!authorization || authorization.consumed || authorization.epoch !== this.#epoch || authorization.expiresAt <= Date.now()) fail('authorizationRequired');
    // Consumed even on validation failure: a changed draft must be reviewed again.
    authorization.consumed = true;
    const draft = draftValue(currentDraft);
    if (!sameDraft(snapshot, draft)) fail('authorizationChanged');
    if (!this.connected) fail('authExpired');
    // RFC 2047 subject + MIME base64 body preserve Unicode without header injection.
    const subject = encodedSubject(draft.subject);
    const body = encode64(draft.body.replace(/\r?\n/g, '\r\n')).match(/.{1,76}/g)?.join('\r\n') || '';
    const mime = `From: ${this.#email}\r\nTo: ${draft.to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${body}\r\n`;
    const raw = encode64(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = await this.#request('/messages/send', { method: 'POST', body: JSON.stringify({ raw }) }, { sending: true });
    if (!ID.test(result.id ?? '')) fail('unknownSend');
    return { id: result.id, threadId: ID.test(result.threadId ?? '') ? result.threadId : '' };
  }
  async #request(path, options = {}, { allowPending = false, sending = false } = {}) {
    if (!this.#token || Date.now() >= this.#expiresAt || (!allowPending && !this.#email)) {
      this.disconnect(); fail('authExpired');
    }
    // Every path is constructed by this class; no caller URL or redirect is accepted.
    const epoch = this.#epoch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    this.#controllers.add(controller);
    try {
      let response;
      try {
        response = await this.#fetch(API + path, {
          ...options, headers: { Authorization: `Bearer ${this.#token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
          signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
        });
      } catch {
        if (epoch !== this.#epoch) fail(sending ? 'unknownSend' : 'disconnected');
        fail(sending ? 'unknownSend' : 'network');
      }
      if (epoch !== this.#epoch) fail(sending ? 'unknownSend' : 'disconnected');
      if (response.status === 401) { this.disconnect(); fail('authExpired'); }
      if (!response.ok) {
        if (response.status === 403) {
          // Read only a bounded error for classification; never expose its payload.
          const details = await readBounded(response).catch(() => '');
          if (epoch !== this.#epoch) fail(sending ? 'unknownSend' : 'disconnected');
          if (/accessNotConfigured|SERVICE_DISABLED|apiDisabled/.test(details)) fail('apiDisabled');
          fail('permission');
        }
        if (sending && response.status >= 500) fail('unknownSend');
        fail(response.status === 429 ? 'rateLimit' : 'requestFailed');
      }
      let data;
      try { data = JSON.parse(await readBounded(response)); }
      catch { fail(sending ? 'unknownSend' : 'invalidResponse'); }
      if (epoch !== this.#epoch) fail(sending ? 'unknownSend' : 'disconnected');
      if (!data || typeof data !== 'object' || Array.isArray(data)) fail(sending ? 'unknownSend' : 'invalidResponse');
      return data;
    } finally { clearTimeout(timeout); this.#controllers.delete(controller); }
  }
}

async function readBounded(response) {
  if (Number(response.headers?.get?.('content-length')) > MAX_RESPONSE) fail('invalidResponse');
  if (!response.body?.getReader) {
    const text = await response.text();
    if (text.length > MAX_RESPONSE) fail('invalidResponse');
    return text;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '', bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE) { await reader.cancel(); fail('invalidResponse'); }
      result += decoder.decode(value, { stream: true });
    }
    return result + decoder.decode();
  } finally { reader.releaseLock(); }
}
