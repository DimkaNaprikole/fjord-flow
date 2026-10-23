import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const source=await fs.readFile(new URL('./afonya-auth.js',import.meta.url),'utf8');const portableSource=source.replace("'./visitor-session.mjs?v=cms-auth-20261023-r3'",JSON.stringify(new URL('./visitor-session.mjs?v=cms-auth-20261023-r3',import.meta.url).href));const auth=await import('data:text/javascript;base64,'+Buffer.from(portableSource).toString('base64'));
function setup(profile){const map=new Map(),local=new Map();globalThis.localStorage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)};globalThis.sessionStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};globalThis.window={dispatchEvent:()=>{}};globalThis.fetch=async()=>({ok:true,json:async()=>({users:[profile]})});return map;}
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
 assert.match(source,/ensureVerified\(dialog,apiKey,language='en',options=\{\}\)/);assert.match(source,/heading\.textContent=options\.heading\|\|m\[register\?1:0\]/);
 assert.match(source,/config\?\.signInProviders\|\|\[\]/);assert.match(source,/if\(!providers\.length\|\|!isActive\(\)\)return/);
});

class AuthElement{
 constructor(tag){this.tag=tag;this.children=[];this.events=new Map();this.attrs={};this.value='';this.open=true;this.classList={add(){},remove(){}};}
 append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n)}}
 insertBefore(n,before){n.parent=this;const i=this.children.indexOf(before);if(i<0)this.children.push(n);else this.children.splice(i,0,n)}
 setAttribute(k,v){this.attrs[k]=v} addEventListener(k,fn){if(!this.events.has(k))this.events.set(k,new Set());this.events.get(k).add(fn)} removeEventListener(k,fn){this.events.get(k)?.delete(fn)}
 querySelector(){return null} reportValidity(){return true}focus(){}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this)}
 after(n){this.parent?.insertBefore(n,this.parent.children[this.parent.children.indexOf(this)+1])}
 close(){this.open=false;for(const fn of [...this.events.get('close')||[]])fn()}
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function gateFixture(language='en',options={}){
 setup({});globalThis.document={createElement:tag=>new AuthElement(tag)};const calls=[];
 globalThis.fetch=async(url,requestOptions={})=>{if(url.startsWith('./chat-config'))return {ok:true,json:async()=>({signInProviders:options.providers||[]})};const route=url.match(/accounts:([^?]+)/)?.[1];calls.push({route,body:JSON.parse(requestOptions.body||'{}')});const data=route==='lookup'?{users:[{email:'test@example.test',emailVerified:false}]}:{idToken:'mock-token',email:'test@example.test',refreshToken:'mock-refresh'};return{ok:true,json:async()=>data};};
 const dialog=new AuthElement('dialog'),promise=auth.ensureVerified(dialog,'public-key',language,options);await flush();const gate=dialog.children.find(n=>n.className==='fjord-ai-auth'),form=gate.children.find(n=>n.tag==='form'),modes=gate.children.find(n=>n.className==='fjord-auth-modes'),buttons=form.children.find(n=>n.className==='fjord-ai-auth-buttons');const inputs=form.children.filter(n=>n.tag==='label').map(n=>n.children.find(x=>x.tag==='input'));
 return{dialog,promise,gate,form,modes,buttons,email:inputs[0],password:inputs[1],calls};
}
test('login and registration are distinct modes with labelled fields and correct autocomplete',async()=>{
 const f=await gateFixture('en');assert.equal(f.password.autocomplete,'current-password');assert.equal(f.buttons.children[0].hidden,true);assert.equal(f.buttons.children[1].hidden,false);assert.equal(f.buttons.children.at(-1).hidden,false);assert.equal(f.email.attrs['aria-label'],'Email');
 f.password.value='do-not-carry-over';f.modes.children[1].onclick();assert.equal(f.password.value,'');assert.equal(f.password.autocomplete,'new-password');assert.equal(f.buttons.children[0].hidden,false);assert.equal(f.buttons.children[1].hidden,true);assert.equal(f.buttons.children.at(-1).hidden,true);assert.equal(f.modes.children[1].attrs['aria-pressed'],'true');assert.equal(f.calls.length,0);f.dialog.close();await f.promise;
});
test('registration submit keeps real password signup plus verification, never email OTP',async()=>{
 const f=await gateFixture('en',{mode:'register'});f.email.value='test@example.test';f.password.value='mock-password';for(const fn of f.form.events.get('submit'))fn({preventDefault(){}});await flush();assert.deepEqual(f.calls.map(c=>c.route),['signUp','lookup','sendOobCode']);assert.equal(f.calls[0].body.password,'mock-password');assert.equal(f.calls[2].body.requestType,'VERIFY_EMAIL');assert.equal(f.password.value,'');f.dialog.close();await f.promise;
});
test('login mode, owner custom heading and all five site languages have real mode controls',async()=>{
 for(const language of ['nb','en','uk','sv','da']){const f=await gateFixture(language,{mode:'register',heading:'Owner-specific heading'});assert.equal(f.gate.children[0].textContent,'Owner-specific heading');assert.ok(f.modes.children.every(b=>b.textContent));f.modes.children[0].onclick();f.email.value='test@example.test';f.password.value='mock-password';for(const fn of f.form.events.get('submit'))fn({preventDefault(){}});await flush();assert.deepEqual(f.calls.map(c=>c.route),['signInWithPassword','lookup']);assert.equal(f.buttons.children[2].hidden,false);f.dialog.close();await f.promise;}
});

test('127 preview directs Google login to the authorized public site without a closing popup',async()=>{
 const f=await gateFixture('en',{providers:['google.com']});
 globalThis.location={hostname:'127.0.0.1'};
 try{const social=f.gate.children.find(n=>n.className==='fjord-social-buttons');assert.ok(social);await social.children[0].onclick();const message=f.form.children.find(n=>n.tag==='p');const find=n=>n.tag==='a'?n:n.children?.map(find).find(Boolean);const link=find(f.gate);assert.equal(link.href,'https://dimkanaprikole.github.io/fjord-flow/');assert.equal(f.calls.length,0);}finally{delete globalThis.location;f.dialog.close();await f.promise;}
});


test('remember checkbox is explicit, localizes its lifetime and never persists a password',async()=>{
 const f=await gateFixture('en');const label=f.form.children.find(n=>n.className==='fjord-auth-remember'),remember=label.children[0];assert.equal(remember.type,'checkbox');assert.equal(remember.checked,false);assert.match(label.children[1].textContent,/30 days/);remember.checked=true;f.email.value='test@example.test';f.password.value='must-not-be-saved';for(const fn of f.form.events.get('submit'))fn({preventDefault(){}});await flush();const raw=globalThis.localStorage.getItem('fjord-afonya-visitor');assert.ok(raw);assert.doesNotMatch(raw,/must-not-be-saved|password/);assert.equal(globalThis.sessionStorage.getItem('fjord-afonya-visitor'),null);assert.equal(globalThis.localStorage.getItem('fjord-afonya-remember'),'1');f.dialog.close();await f.promise;
});


test('closing a password-login dialog during lookup prevents late verified sign-in',async()=>{
 const f=await gateFixture('en');let completeLookup;const original=globalThis.fetch;globalThis.fetch=(url,options)=>url.includes('accounts:lookup')?new Promise(resolve=>{completeLookup=()=>resolve({ok:true,json:async()=>({users:[{email:'test@example.test',emailVerified:true}]})})}):original(url,options);f.email.value='test@example.test';f.password.value='mock-password';for(const fn of f.form.events.get('submit'))fn({preventDefault(){}});await flush();assert.ok(completeLookup);f.dialog.close();assert.equal(await f.promise,null);completeLookup();await flush();assert.equal(auth.getStoredVisitor(),null);
});

test('password-login verification rejects disabled or different-email profiles',async()=>{
 for(const profile of [{email:'test@example.test',emailVerified:true,disabled:true},{email:'someone-else@example.test',emailVerified:true}]){const f=await gateFixture('en');const original=globalThis.fetch;globalThis.fetch=(url,options)=>url.includes('accounts:lookup')?Promise.resolve({ok:true,json:async()=>({users:[profile]})}):original(url,options);f.email.value='test@example.test';f.password.value='mock-password';for(const fn of f.form.events.get('submit'))fn({preventDefault(){}});await flush();assert.equal(auth.getStoredVisitor(),null);f.dialog.close();await f.promise;}
});
