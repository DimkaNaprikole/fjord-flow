import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const source=await fs.readFile(new URL('./afonya-auth.js',import.meta.url),'utf8');const auth=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function setup(profile){const map=new Map();globalThis.sessionStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};globalThis.window={dispatchEvent:()=>{}};globalThis.fetch=async()=>({ok:true,json:async()=>({users:[profile]})});return map;}
test('only server-verified email and matching identity become a signed-in profile',async()=>{setup({localId:'visitor-1',email:'test@example.com',emailVerified:true});const user={uid:'visitor-1',refreshToken:'refresh',getIdToken:async()=>'token'};await auth.saveSocialVisitor('public-api-key',user);assert.equal(auth.getStoredVisitor().email,'test@example.com');await auth.signOutVisitor();assert.equal(auth.getStoredVisitor(),null);});
test('missing email, disabled accounts and mismatched users never create a session',async()=>{for(const profile of[{localId:'visitor-1',emailVerified:true},{localId:'visitor-1',email:'test@example.com',emailVerified:true,disabled:true},{localId:'other',email:'test@example.com',emailVerified:true}]){setup(profile);await assert.rejects(auth.saveSocialVisitor('key',{uid:'visitor-1',getIdToken:async()=>'token'}),/SOCIAL_EMAIL_REQUIRED/);assert.equal(auth.getStoredVisitor(),null);}});
test('Facebook email is not considered verified until Firebase confirms it',async()=>{setup({localId:'visitor-1',email:'test@example.com',emailVerified:false});const visitor=await auth.saveSocialVisitor('key',{uid:'visitor-1',getIdToken:async()=>'token'});assert.equal(visitor.emailVerified,false);assert.equal(auth.getStoredVisitor(),null);});
test('provider conflicts require original login rather than unsafe automatic linking',()=>{assert.equal(auth.socialErrorIndex('auth/account-exists-with-different-credential'),5);assert.equal(auth.socialErrorIndex('auth/popup-blocked'),3);assert.equal(auth.socialErrorIndex('auth/popup-closed-by-user'),4);});

test('existing verified email session is checked once and becomes the shared site profile',async()=>{
 const store=setup({email:'existing@example.test',emailVerified:true});
 store.set('fjord-afonya-visitor',JSON.stringify({idToken:'existing-token',email:'existing@example.test',expiresAt:Date.now()+3600000}));
 const listeners=new Set(),dialog={open:true,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
 let calls=0;globalThis.fetch=async(url,options)=>{calls++;assert.match(url,/accounts:lookup/);assert.equal(JSON.parse(options.body).idToken,'existing-token');return {ok:true,json:async()=>({users:[{email:'existing@example.test',emailVerified:true}]})};};
 const first=auth.ensureVerified(dialog,'public-key','ru',{heading:'Owner-only heading'}),second=auth.ensureVerified(dialog,'public-key','ru');
 assert.equal(first,second);assert.equal((await first).email,'existing@example.test');assert.equal(calls,1);assert.equal(auth.getStoredVisitor().emailVerified,true);assert.equal(listeners.size,0);
});

test('password reset keeps the shared session and never changes its credentials',async()=>{
 const store=setup({});store.set('fjord-afonya-visitor',JSON.stringify({email:'existing@example.test',idToken:'token',emailVerified:true}));const before=store.get('fjord-afonya-visitor');
 globalThis.fetch=async(url,options)=>{assert.match(url,/accounts:sendOobCode/);assert.deepEqual(JSON.parse(options.body),{requestType:'PASSWORD_RESET',email:'existing@example.test'});return {ok:true,json:async()=>({})};};
 await auth.requestPasswordReset('public-key',' existing@example.test ');assert.equal(store.get('fjord-afonya-visitor'),before);
});

test('owner custom heading and explicitly configured social provider gates remain supported',()=>{
 assert.match(source,/ensureVerified\(dialog,apiKey,language='en',options=\{\}\)/);assert.match(source,/heading\.textContent=options\.heading\|\|w\[0\]/);
 assert.match(source,/config\?\.signInProviders\|\|\[\]/);assert.match(source,/if\(!providers\.length\|\|!isActive\(\)\)return/);
});
