import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=await readFile(new URL('./gmail-auth.mjs',import.meta.url),'utf8');
const {createGmailAuthorizer}=await import('data:text/javascript;base64,'+Buffer.from(source.replace(/^import[^\n]+\n/,'')).toString('base64'));
function setup(options={}){
 const calls={scopes:[],signouts:0,popups:0,verify:[]};
 class Provider{addScope(s){calls.scopes.push(s)}setCustomParameters(p){calls.parameters=p}static credentialFromResult(){return {accessToken:'opaque-access-value-for-fixture'}}}
 const profile={uid:'owner-uid',email:'laurkent123@gmail.com'};
 const context={auth:{},sdk:{GoogleAuthProvider:Provider,signOut:async()=>{calls.signouts++},signInWithPopup:async()=>{calls.popups++;if(options.wait)await options.wait;return {user:{...profile,emailVerified:true,getIdToken:async()=> 'verified-id-token',...options.user}}}}};
 const api=createGmailAuthorizer({load:async()=>context,verify:async(key,token)=>{calls.verify.push(token);if(options.denied)throw Object.assign(Error(),{code:'ownerOnly'});return profile;}});
 return {api,calls};
}
test('server owner denial prevents any Google authorization',async()=>{const {api,calls}=setup({denied:true});await assert.rejects(api.authorize('public-key'),{code:'ownerOnly'});assert.equal(calls.popups,0);});
test('a stalled Google SDK cannot leave connection busy forever',async()=>{const api=createGmailAuthorizer({load:()=>new Promise(()=>{}),verify:async()=>({uid:'owner',email:'laurkent123@gmail.com'}),sdkTimeoutMs:5});await assert.rejects(api.authorize('key'),{code:'authUnavailable'});await assert.rejects(api.authorize('key'),{code:'authUnavailable'});});
test('read permission is separate from send and site identity is reverified',async()=>{const {api,calls}=setup();const result=await api.authorize('public-key');assert.equal(result.email,'laurkent123@gmail.com');assert.deepEqual(calls.scopes,['https://www.googleapis.com/auth/gmail.readonly']);assert.deepEqual(calls.verify,[undefined,'verified-id-token']);assert.equal(calls.signouts,1);assert.equal(calls.parameters.login_hint,result.email);assert.equal(calls.parameters.prompt,undefined);});
test('send permission is requested only explicitly',async()=>{const {api,calls}=setup();await api.authorize('public-key',{send:true});assert.equal(calls.scopes.length,2);assert.equal(calls.scopes[1],'https://www.googleapis.com/auth/gmail.send');});
test('wrong Google identity never yields its access token',async()=>{const {api,calls}=setup({user:{uid:'someone-else'}});await assert.rejects(api.authorize('public-key'),{code:'wrongAccount'});assert.equal(calls.signouts,1);assert.equal(calls.verify.length,1);});
test('disconnect invalidates pending popup and keeps the site login separate',async()=>{let finish;const wait=new Promise(r=>finish=r);const {api}=setup({wait});const pending=api.authorize('public-key');await new Promise(r=>setImmediate(r));await api.disconnect();finish();await assert.rejects(pending,{code:'stale'});assert.doesNotMatch(source,/sessionStorage|localStorage|saveSocialVisitor|signOutVisitor\(/);});
