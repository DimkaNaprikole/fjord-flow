import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisitorSessionStore,VISITOR_SESSION_KEY,REMEMBER_MAX_AGE_MS} from './visitor-session.mjs';

const PREFERENCE_KEY='fjord-afonya-remember';
class FakeStorage{
  constructor(map=new Map()){this.map=map;this.blockRead=false;this.blockWrite=false;this.blockRemove=false}
  getItem(key){if(this.blockRead)throw Error('Blocked');return this.map.get(key)??null}
  setItem(key,value){if(this.blockWrite)throw Error('Quota exceeded');this.map.set(key,String(value))}
  removeItem(key){if(this.blockRemove)throw Error('Blocked');this.map.delete(key)}
}
class FakeBrowser extends EventTarget{
  constructor({local=new FakeStorage(),session=new FakeStorage()}={}){super();this.localStorage=local;this.sessionStorage=session;this.CustomEvent=CustomEvent;this.Event=Event;this.changes=[];this.addEventListener('fjord:auth-changed',event=>this.changes.push(event.detail?.revision))}
  storageEvent(key){const event=new Event('storage');event.key=key;this.dispatchEvent(event)}
}
function fixture(options={}){
  let time=options.time??1_800_000_000_000;const host=options.host||new FakeBrowser();
  return {host,store:createVisitorSessionStore({host,now:()=>time}),advance(ms){time+=ms},get now(){return time}};
}
const visitor=(email='cat@example.test',extra={})=>({email,idToken:'access-'+email,refreshToken:'refresh-'+email,emailVerified:true,expiresAt:1_800_003_500_000,...extra});

test('default login ends with the browser session; remembering survives a new browser session',()=>{
  const first=fixture();first.store.writeVisitorSession(visitor(),{newSignIn:true});
  assert.ok(first.host.sessionStorage.getItem(VISITOR_SESSION_KEY));assert.equal(first.host.localStorage.getItem(VISITOR_SESSION_KEY),null);
  const restarted=fixture({host:new FakeBrowser({local:first.host.localStorage})});assert.equal(restarted.store.readVisitorSession(),null);
  first.store.setRememberPreference(true);
  const rememberedRestart=fixture({host:new FakeBrowser({local:first.host.localStorage})});
  assert.equal(rememberedRestart.store.readVisitorSession().email,'cat@example.test');assert.equal(rememberedRestart.store.getRememberPreference(),true);
});

test('remember preference migrates the current login both ways without keeping a second credential copy',()=>{
  const f=fixture();const original=f.store.writeVisitorSession(visitor(),{newSignIn:true});f.advance(4*24*60*60*1000);
  const persistent=f.store.setRememberPreference(true);assert.equal(persistent.sessionExpiresAt,original.sessionExpiresAt);
  assert.equal(f.host.sessionStorage.getItem(VISITOR_SESSION_KEY),null);assert.ok(f.host.localStorage.getItem(VISITOR_SESSION_KEY));
  f.advance(24*60*60*1000);const session=f.store.setRememberPreference(false);assert.equal(session.sessionExpiresAt,original.sessionExpiresAt);
  assert.equal(f.host.localStorage.getItem(VISITOR_SESSION_KEY),null);assert.equal(f.host.localStorage.getItem(PREFERENCE_KEY),null);assert.ok(f.host.sessionStorage.getItem(VISITOR_SESSION_KEY));
});

test('token refresh keeps an absolute thirty-day limit, while a deliberate new login starts a new window',()=>{
  const f=fixture();const first=f.store.writeVisitorSession(visitor(),{remember:true,newSignIn:true});f.advance(29*24*60*60*1000);
  const revision=f.store.getSessionRevision();const refreshed=f.store.writeVisitorSession({...first,idToken:'new-token',expiresAt:f.now+3600000},{expectedRevision:revision});
  assert.equal(refreshed.sessionStartedAt,first.sessionStartedAt);assert.equal(refreshed.sessionExpiresAt,first.sessionStartedAt+REMEMBER_MAX_AGE_MS);
  assert.equal(f.host.sessionStorage.getItem(VISITOR_SESSION_KEY),null,'Refresh stays in the existing persistent store');
  const signedIn=f.store.writeVisitorSession(visitor(),{remember:true,newSignIn:true});assert.equal(signedIn.sessionStartedAt,f.now);assert.equal(signedIn.sessionExpiresAt,f.now+REMEMBER_MAX_AGE_MS);
});

test('expired or unbounded persistent credentials are removed before any token can be restored',()=>{
  const f=fixture();f.store.writeVisitorSession(visitor(),{remember:true,newSignIn:true});const revision=f.store.getSessionRevision();f.advance(REMEMBER_MAX_AGE_MS);
  assert.equal(f.store.readVisitorSession(),null);assert.equal(f.host.localStorage.getItem(VISITOR_SESSION_KEY),null);assert.ok(f.store.getSessionRevision()>revision);
  f.host.localStorage.setItem(VISITOR_SESSION_KEY,JSON.stringify(visitor()));f.host.localStorage.setItem(PREFERENCE_KEY,'1');assert.equal(f.store.readVisitorSession(),null);
  assert.equal(f.host.localStorage.getItem(VISITOR_SESSION_KEY),null);
});

test('legacy unverified email remains available for verification but passwords and arbitrary data never enter storage',()=>{
  const f=fixture();f.host.sessionStorage.setItem(VISITOR_SESSION_KEY,JSON.stringify(visitor('unverified@example.test',{emailVerified:false})));
  assert.equal(f.store.readVisitorSession().emailVerified,false);
  const saved=f.store.writeVisitorSession({...f.store.readVisitorSession(),password:'private-password',gmailToken:'private-gmail-token',profile:{password:'also-private'}},{remember:true});
  assert.equal(saved.emailVerified,false);assert.ok(saved.sessionExpiresAt);const raw=f.host.localStorage.getItem(VISITOR_SESSION_KEY);assert.doesNotMatch(raw,/private-password|private-gmail-token|also-private|profile/);
});

test('corrupt and malformed records fail closed, including invalid or extended persistence windows',()=>{
  for(const raw of ['{broken','[]','null',JSON.stringify({email:'cat@example.test'}),JSON.stringify({...visitor(),sessionStartedAt:1_800_000_000_000}),JSON.stringify({...visitor(),sessionStartedAt:1_800_000_000_000,sessionExpiresAt:1_800_000_000_000+REMEMBER_MAX_AGE_MS+1})]){
    const f=fixture();f.host.localStorage.setItem(PREFERENCE_KEY,'1');f.host.localStorage.setItem(VISITOR_SESSION_KEY,raw);assert.equal(f.store.readVisitorSession(),null);assert.equal(f.host.localStorage.getItem(VISITOR_SESSION_KEY),null);
  }
});

test('logout clears both credential stores, the remembered preference and the current identity',()=>{
  const f=fixture();f.store.writeVisitorSession(visitor(),{remember:true,newSignIn:true});f.host.sessionStorage.setItem(VISITOR_SESSION_KEY,JSON.stringify(visitor('stale@example.test')));
  const revision=f.store.getSessionRevision();f.store.clearVisitorSession();
  assert.equal(f.store.readVisitorSession(),null);assert.equal(f.store.getRememberPreference(),false);assert.equal(f.host.sessionStorage.getItem(VISITOR_SESSION_KEY),null);assert.equal(f.host.localStorage.getItem(VISITOR_SESSION_KEY),null);assert.equal(f.host.localStorage.getItem(PREFERENCE_KEY),null);assert.ok(f.store.getSessionRevision()>revision);
});

test('persistent storage failure reports an explicit error and preserves the working session',()=>{
  const f=fixture();const previous=f.store.writeVisitorSession(visitor(),{newSignIn:true});const revision=f.store.getSessionRevision();f.host.localStorage.blockWrite=true;
  assert.throws(()=>f.store.setRememberPreference(true),error=>error.code==='PERSISTENCE_UNAVAILABLE');assert.deepEqual(f.store.readVisitorSession(),previous);assert.equal(f.store.getRememberPreference(),false);assert.equal(f.store.getSessionRevision(),revision);
  assert.throws(()=>f.store.writeVisitorSession(visitor('next@example.test'),{remember:true,newSignIn:true}),error=>error.code==='PERSISTENCE_UNAVAILABLE');assert.deepEqual(f.store.readVisitorSession(),previous);
});

test('partial migration failure rolls back credentials and the persistent preference atomically',()=>{
  const f=fixture();const previous=f.store.writeVisitorSession(visitor(),{newSignIn:true});f.host.sessionStorage.blockRemove=true;
  assert.throws(()=>f.store.setRememberPreference(true),error=>error.code==='SESSION_STORAGE_UNAVAILABLE');assert.deepEqual(f.store.readVisitorSession(),previous);assert.equal(f.host.localStorage.getItem(VISITOR_SESSION_KEY),null);assert.equal(f.host.localStorage.getItem(PREFERENCE_KEY),null);
});

test('blocked storage can be read safely and session-only login does not require localStorage',()=>{
  const f=fixture();f.host.localStorage.blockRead=true;f.host.localStorage.blockWrite=true;
  assert.equal(f.store.readVisitorSession(),null);assert.equal(f.store.getRememberPreference(),false);assert.equal(f.store.writeVisitorSession(visitor(),{newSignIn:true}).email,'cat@example.test');
  assert.throws(()=>f.store.setRememberPreference(true),error=>error.code==='PERSISTENCE_UNAVAILABLE');assert.equal(f.store.readVisitorSession().email,'cat@example.test');
  const blocked=fixture();blocked.host.sessionStorage.blockWrite=true;assert.throws(()=>blocked.store.writeVisitorSession(visitor()),error=>error.code==='SESSION_STORAGE_UNAVAILABLE');assert.equal(blocked.store.readVisitorSession(),null);
});

test('an old token refresh cannot restore an account after logout or replace a newer account',()=>{
  const f=fixture();const old=f.store.writeVisitorSession(visitor('old@example.test'),{newSignIn:true});const revision=f.store.getSessionRevision();f.store.clearVisitorSession();
  assert.throws(()=>f.store.writeVisitorSession({...old,idToken:'late-token'},{expectedRevision:revision}),error=>error.code==='STALE_SESSION');assert.equal(f.store.readVisitorSession(),null);
  const newer=f.store.writeVisitorSession(visitor('new@example.test'),{newSignIn:true});assert.throws(()=>f.store.writeVisitorSession(old),error=>error.code==='STALE_SESSION');assert.deepEqual(f.store.readVisitorSession(),newer);
  assert.throws(()=>f.store.writeVisitorSession(old,{newSignIn:true,expectedRevision:revision}),error=>error.code==='STALE_SESSION');assert.deepEqual(f.store.readVisitorSession(),newer);
});

test('a token for a different Firebase subject cannot replace the current account even with the same email',()=>{
  const f=fixture();const token=uid=>'header.'+Buffer.from(JSON.stringify({sub:uid})).toString('base64url')+'.signature';
  f.store.writeVisitorSession(visitor('same@example.test',{idToken:token('CaseSensitiveUid')}),{newSignIn:true});
  assert.throws(()=>f.store.writeVisitorSession(visitor('same@example.test',{idToken:token('casesensitiveuid')})),error=>error.code==='STALE_SESSION');
  assert.equal(f.store.readVisitorSession().idToken,token('CaseSensitiveUid'));
});

test('cross-tab account changes and logout beat a stale session copy and invalidate pending requests',()=>{
  const first=fixture();first.store.writeVisitorSession(visitor('old@example.test'),{newSignIn:true});const revision=first.store.getSessionRevision();
  const second=fixture({host:new FakeBrowser({local:first.host.localStorage})});second.store.writeVisitorSession(visitor('new@example.test'),{remember:true,newSignIn:true});
  first.host.storageEvent(VISITOR_SESSION_KEY);assert.equal(first.store.readVisitorSession().email,'new@example.test');assert.equal(first.host.sessionStorage.getItem(VISITOR_SESSION_KEY),null);assert.ok(first.store.getSessionRevision()>revision);
  assert.throws(()=>first.store.writeVisitorSession(visitor('old@example.test'),{expectedRevision:revision}),error=>error.code==='STALE_SESSION');
  second.store.clearVisitorSession();first.host.storageEvent(VISITOR_SESSION_KEY);assert.equal(first.store.readVisitorSession(),null);assert.ok(first.host.changes.length>=3);
});

test('silent verification-stage writes still advance revision and the confirmed write announces once',()=>{
  const f=fixture();const before=f.store.getSessionRevision();f.store.writeVisitorSession(visitor('cat@example.test',{emailVerified:false}),{newSignIn:true,remember:true,notify:false});
  assert.equal(f.host.changes.length,0);assert.ok(f.store.getSessionRevision()>before);f.store.writeVisitorSession({...f.store.readVisitorSession(),emailVerified:true});assert.equal(f.host.changes.length,1);
  const revision=f.store.getSessionRevision();f.host.storageEvent('unrelated-key');assert.equal(f.store.getSessionRevision(),revision);f.host.storageEvent(PREFERENCE_KEY);assert.equal(f.host.changes.length,2);assert.ok(f.store.getSessionRevision()>revision);
});

test('failed logout reports persistent cleanup failure while keeping the current page signed out',()=>{
  const f=fixture();f.store.writeVisitorSession(visitor(),{remember:true,newSignIn:true});f.host.localStorage.blockRemove=true;
  assert.throws(()=>f.store.clearVisitorSession(),error=>error.code==='PERSISTENCE_UNAVAILABLE');assert.equal(f.store.readVisitorSession(),null);
});

test('blocked session cleanup also reports failure instead of claiming a durable logout',()=>{
  const f=fixture();f.store.writeVisitorSession(visitor(),{newSignIn:true});f.host.sessionStorage.blockRead=true;
  assert.throws(()=>f.store.clearVisitorSession(),error=>error.code==='SESSION_STORAGE_UNAVAILABLE');assert.equal(f.store.readVisitorSession(),null);
});


test('same-tab iframe session storage refresh does not delete shared login; iframe logout clears consumers',()=>{
 const f=fixture();const first=f.store.writeVisitorSession(visitor(),{newSignIn:true});
 f.host.sessionStorage.setItem(VISITOR_SESSION_KEY,JSON.stringify({...first,idToken:'iframe-refresh'}));
 const dispatch=()=>{const e=new Event('storage');e.key=VISITOR_SESSION_KEY;e.storageArea=f.host.sessionStorage;f.host.dispatchEvent(e)};
 dispatch();assert.equal(f.store.readVisitorSession().idToken,'iframe-refresh');
 assert.ok(f.host.sessionStorage.getItem(VISITOR_SESSION_KEY));
 f.host.sessionStorage.removeItem(VISITOR_SESSION_KEY);dispatch();assert.equal(f.store.readVisitorSession(),null);
});
