import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('./afonya-auth.js',import.meta.url),'utf8');
const SESSION_KEY='fjord-afonya-visitor',PREFERENCE_KEY='fjord-afonya-remember';
const originalGlobals={window:globalThis.window,fetch:globalThis.fetch};
let sequence=0;
class FakeStorage{
  constructor(map=new Map()){this.map=map;}
  getItem(key){return this.map.get(key)??null;}
  setItem(key,value){this.map.set(key,String(value));}
  removeItem(key){this.map.delete(key);}
}
class FakeBrowser extends EventTarget{
  constructor(local=new FakeStorage()){super();this.localStorage=local;this.sessionStorage=new FakeStorage();this.Event=Event;this.CustomEvent=CustomEvent;}
}
const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const visitor=(email='cat@example.test',extra={})=>({email,idToken:'access-'+email,refreshToken:'refresh-'+email,emailVerified:true,expiresAt:Date.now()-1000,...extra});
const renewed={id_token:'renewed-access',refresh_token:'rotated-refresh',expires_in:'3600'};

async function fixture(t,{local}={}){
  const browser=new FakeBrowser(local);
  globalThis.window=browser;
  globalThis.fetch=async()=>{throw Error('Unexpected HTTP request in an offline integration test');};
  const storeURL=new URL('./visitor-session.mjs?refresh-integration='+ ++sequence,import.meta.url).href;
  const store=await import(storeURL);
  const patched=source.replace(/(['"])\.\/visitor-session\.mjs[^'"]*\1/,JSON.stringify(storeURL));
  assert.notEqual(patched,source,'The actual auth module must use this fixture’s actual session module');
  const auth=await import('data:text/javascript;base64,'+Buffer.from(patched+'\n// isolated auth fixture '+sequence).toString('base64'));
  t.after(()=>{if(originalGlobals.window===undefined)delete globalThis.window;else globalThis.window=originalGlobals.window;globalThis.fetch=originalGlobals.fetch;});
  return{browser,store,auth,save(record=visitor(),options={}){return store.writeVisitorSession(record,{newSignIn:true,...options});}};
}

test('remembered login restores from the real local store after the browser session closes',async t=>{
  const first=await fixture(t),saved=first.save(visitor('remembered@example.test',{expiresAt:Date.now()+3600000}),{remember:true});
  assert.equal(first.browser.sessionStorage.getItem(SESSION_KEY),null);
  const restarted=await fixture(t,{local:first.browser.localStorage});
  assert.equal(restarted.auth.getStoredVisitor().email,saved.email);
  assert.equal(await restarted.auth.getVisitorToken('public-test-key'),saved.idToken);
  assert.equal(restarted.auth.getStoredVisitor().sessionExpiresAt,saved.sessionExpiresAt);
  assert.equal(restarted.browser.sessionStorage.getItem(SESSION_KEY),null);
});

test('concurrent refresh requests make one HTTP request and retain the absolute remembered deadline',async t=>{
  const f=await fixture(t),saved=f.save(visitor(),{remember:true}),pending=deferred();let calls=0;
  globalThis.fetch=(url,options)=>{calls++;assert.match(url,/^https:\/\/securetoken\.googleapis\.com\/v1\/token\?/);assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.equal(options.body.get('refresh_token'),saved.refreshToken);return pending.promise;};
  const requests=[f.auth.getVisitorToken('public-test-key'),f.auth.getVisitorToken('public-test-key'),f.auth.getVisitorToken('public-test-key')];
  assert.equal(calls,1);pending.resolve(response(200,renewed));
  assert.deepEqual(await Promise.all(requests),Array(3).fill(renewed.id_token));
  const next=f.auth.getStoredVisitor();assert.equal(next.refreshToken,renewed.refresh_token);assert.equal(next.sessionStartedAt,saved.sessionStartedAt);assert.equal(next.sessionExpiresAt,saved.sessionExpiresAt);
  assert.equal(f.browser.sessionStorage.getItem(SESSION_KEY),null);assert.equal(f.browser.localStorage.getItem(PREFERENCE_KEY),'1');
});

test('a refresh response arriving after logout cannot resurrect the old login',async t=>{
  const f=await fixture(t);f.save(visitor(),{remember:true});const pending=deferred();globalThis.fetch=()=>pending.promise;
  const request=f.auth.getVisitorToken('public-test-key');await f.auth.signOutVisitor();pending.resolve(response(200,renewed));
  assert.equal(await request,'');assert.equal(f.auth.getStoredVisitor(),null);assert.equal(f.browser.localStorage.getItem(SESSION_KEY),null);assert.equal(f.browser.sessionStorage.getItem(SESSION_KEY),null);
});

for(const result of [response(200,renewed),response(400,{error:{message:'INVALID_REFRESH_TOKEN'}})]){
  test('a late '+result.status+' response for an old account cannot replace or clear the new account',async t=>{
    const f=await fixture(t);f.save(visitor('old@example.test'),{remember:true});const pending=deferred();globalThis.fetch=()=>pending.promise;
    const request=f.auth.getVisitorToken('public-test-key');const newer=f.save(visitor('new@example.test',{expiresAt:Date.now()+3600000}),{remember:true});pending.resolve(result);
    assert.equal(await request,'');assert.deepEqual(f.auth.getStoredVisitor(),newer);assert.equal(await f.auth.getVisitorToken('public-test-key'),newer.idToken);
  });
}

test('an invalid refresh token clears the persisted login and preference',async t=>{
  const f=await fixture(t);f.save(visitor(),{remember:true});globalThis.fetch=async()=>response(400,{error:{message:'INVALID_REFRESH_TOKEN'}});
  assert.equal(await f.auth.getVisitorToken('public-test-key'),'');assert.equal(f.auth.getStoredVisitor(),null);assert.equal(f.browser.localStorage.getItem(SESSION_KEY),null);assert.equal(f.browser.localStorage.getItem(PREFERENCE_KEY),null);
});

for(const kind of ['HTTP 503','network failure']){
  test(kind+' keeps the remembered credentials for retry but never returns an expired access token',async t=>{
    const f=await fixture(t);f.save(visitor(),{remember:true});const before=f.browser.localStorage.getItem(SESSION_KEY);
    globalThis.fetch=async()=>{if(kind==='network failure')throw new TypeError('Offline fixture');return response(503,{error:{message:'BACKEND_UNAVAILABLE'}});};
    await assert.rejects(f.auth.getVisitorToken('public-test-key'));
    assert.equal(f.browser.localStorage.getItem(SESSION_KEY),before);assert.equal(f.browser.localStorage.getItem(PREFERENCE_KEY),'1');
    globalThis.fetch=async()=>response(200,renewed);assert.equal(await f.auth.getVisitorToken('public-test-key'),renewed.id_token,'The same credentials remain usable after recovery');
  });
}

test('provider lookup uses the current verified identity and preserves all linked sign-in methods',async t=>{
  const f=await fixture(t),saved=f.save(visitor('verified@example.test',{expiresAt:Date.now()+3600000}));
  globalThis.fetch=async(url,options)=>{assert.match(url,/accounts:lookup\?/);assert.deepEqual(JSON.parse(options.body),{idToken:saved.idToken});return response(200,{users:[{email:saved.email,emailVerified:true,providerUserInfo:[{providerId:'google.com'},{providerId:'password'},{providerId:'google.com'}]}]});};
  assert.deepEqual(await f.auth.getVisitorSignInMethods('public-test-key'),['google.com','password']);
});

for(const profile of [{email:'another@example.test',emailVerified:true},{email:'verified@example.test',emailVerified:false},{email:'verified@example.test',emailVerified:true,disabled:true}]){
  test('provider lookup rejects '+(profile.disabled?'disabled profile':!profile.emailVerified?'unverified profile':'another email identity'),async t=>{
    const f=await fixture(t);f.save(visitor('verified@example.test',{expiresAt:Date.now()+3600000}));globalThis.fetch=async()=>response(200,{users:[profile]});
    await assert.rejects(f.auth.getVisitorSignInMethods('public-test-key'),/AUTH_REQUIRED/);
  });
}

test('provider lookup cannot return old-account methods after an account switch',async t=>{
  const f=await fixture(t),old=f.save(visitor('old@example.test',{expiresAt:Date.now()+3600000})),pending=deferred(),started=deferred();
  globalThis.fetch=()=>{started.resolve();return pending.promise;};const request=f.auth.getVisitorSignInMethods('public-test-key');await started.promise;
  const newer=f.save(visitor('new@example.test',{expiresAt:Date.now()+3600000}));pending.resolve(response(200,{users:[{email:old.email,emailVerified:true,providerUserInfo:[{providerId:'password'}]}]}));
  await assert.rejects(request,/STALE_SESSION/);assert.deepEqual(f.auth.getStoredVisitor(),newer);
});

test('real session persistence strips passwords and unrelated private data before auth refresh',async t=>{
  const f=await fixture(t);f.save(visitor('private@example.test',{password:'synthetic-password-not-to-store',gmailToken:'synthetic-gmail-private',profile:{password:'nested-private'}}),{remember:true});
  globalThis.fetch=async()=>response(200,{...renewed,password:'unexpected-server-password'});await f.auth.getVisitorToken('public-test-key');
  for(const storage of [f.browser.sessionStorage,f.browser.localStorage])for(const value of storage.map.values())assert.doesNotMatch(value,/synthetic-password|synthetic-gmail|nested-private|unexpected-server-password|"password"|"gmailToken"/);
});
