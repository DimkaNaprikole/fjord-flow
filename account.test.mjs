import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COPY,COPY_KEYS,normalizeProfile,validPhotoFile,profileRequest,mountAccount} from './account.mjs';

test('all account labels and errors are complete in the six site languages',async()=>{
 const html=await readFile(new URL('./account.html',import.meta.url),'utf8');
 const keys=[...COPY_KEYS,...Array.from(html.matchAll(/data-copy="([^"]+)"/g),match=>match[1]),'deleteConfirm','historyDeleted'];
 for(const lang of ['nb','en','uk','sv','da','ru'])for(const key of keys)assert.ok(typeof COPY[lang][key]==='string'&&COPY[lang][key].trim(),`${lang}: ${key}`);
 assert.match(html,/<form id="profileForm" hidden/);
 assert.match(html,/<input id="profileEmail"[^>]*readonly/);
});

test('remote and executable avatars never enter the rendered profile',()=>{
 for(const avatar of ['https://tracker.invalid/photo.png','data:image/svg+xml;base64,PHN2Zz4=','javascript:alert(1)','data:image/jpeg;base64,AAA=\" onerror=alert(1)'])assert.equal(normalizeProfile({avatar_data_url:avatar}).avatar_data_url,'');
 assert.equal(normalizeProfile({avatar_data_url:'data:image/png;base64,aGVsbG8='}).avatar_data_url,'data:image/png;base64,aGVsbG8=');
 assert.equal(normalizeProfile({avatar_data_url:'data:image/jpeg;base64,'+'A'.repeat(220000)}).avatar_data_url,'');
});

test('profile defaults fail closed for chat history and unsupported preferences',()=>{
 assert.deepEqual(normalizeProfile({preferences:{save_history:'true',language:'zz',voice:'external'}}).preferences,{save_history:false,language:'auto',voice:'default'});
 assert.equal(normalizeProfile({first_name:'Я'.repeat(90)}).first_name.length,80);
 assert.equal(normalizeProfile({profile:{first_name:'Дима',preferences:{save_history:true,language:'ru',voice:'marin'}}}).preferences.voice,'marin');
});

test('photo selection rejects SVG, empty, and oversized files',()=>{
 assert.equal(validPhotoFile({type:'image/png',size:500}),true);
 assert.equal(validPhotoFile({type:'image/svg+xml',size:500}),false);
 assert.equal(validPhotoFile({type:'image/jpeg',size:0}),false);
 assert.equal(validPhotoFile({type:'image/webp',size:5*1024*1024+1}),false);
});

test('profile transport requires a bearer token and never uses cookies or URL credentials',async()=>{
 let called=false;
 await assert.rejects(profileRequest('https://api.invalid','',undefined,{fetcher:async()=>{called=true;}}),error=>error.status===401);
 assert.equal(called,false);
 const profile={first_name:'Дима',preferences:{save_history:false}};
 const result=await profileRequest('https://api.invalid/','private-token',profile,{fetcher:async(url,options)=>{
  assert.equal(url,'https://api.invalid/account-profile');assert.equal(options.method,'PUT');assert.equal(options.headers.Authorization,'Bearer private-token');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.deepEqual(JSON.parse(options.body),profile);
  return {ok:true,json:async()=>({profile:{first_name:'Дима'},role:'user'})};
 }});
 assert.equal(result.role,'user');
 await assert.rejects(profileRequest('https://api.invalid','token',undefined,{fetcher:async()=>({ok:false,status:403})}),error=>error.status===403);
 await assert.rejects(profileRequest('https://api.invalid','token',undefined,{fetcher:async()=>({ok:true,json:async()=>({ok:true})})}),/PROFILE_RESPONSE_INVALID/);
});

function fixture(){
 const ids=['profileForm','accountLanguage','profileStatus','profileAvatar','profileAvatarEmpty','profilePhoto','profileEmail','accountSignedOut','accountAdmin','accountLogout','accountLogin','profileFirstName','profileLastName','profilePatronymic','profileReplyLanguage','profileVoice','profileHistory','profileAuthDialog','profileAuthClose','profileRemovePhoto','profileDeleteHistory'];
 const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',checked:false,hidden:false,disabled:false,textContent:'',removeAttribute(name){delete this[name];},setAttribute(name,value){this[name]=value;}}]));
 const controls=ids.filter(id=>/^profile(?:Photo|Email|First|Last|Patronymic|Reply|Voice|History|Remove|Delete)/.test(id)).map(id=>nodes[id]);
 nodes.profileForm.querySelectorAll=()=>controls;nodes.profileForm.reset=()=>{for(const node of controls){node.value='';node.checked=false;}};
 const doc={documentElement:{lang:''},getElementById:id=>nodes[id],querySelectorAll:()=>[]};
 const host=new EventTarget();host.location={href:'https://site.invalid/account.html?lang=ru'};host.localStorage={getItem:()=>null};host.CustomEvent=CustomEvent;host.Event=Event;
 return {nodes,doc,host};
}

test('a profile response arriving after logout cannot redisplay private data or admin entry',async()=>{
 const {nodes,doc,host}=fixture();let session={idToken:'token',email:'visitor@example.invalid',emailVerified:true,expiresAt:Date.now()+3600000};
 const oldSession=globalThis.sessionStorage,oldFetch=globalThis.fetch;
 let resolveProfile,requested=false;
 globalThis.sessionStorage={getItem:()=>session?JSON.stringify(session):null};
 host.fetch=async()=>({ok:true,json:async()=>({firebaseApiKey:'test-public-key',endpoint:'https://api.invalid'})});
 globalThis.fetch=async()=>{requested=true;return new Promise(resolve=>{resolveProfile=()=>resolve({ok:true,json:async()=>({profile:{email:'visitor@example.invalid',first_name:'Private name',avatar_data_url:'data:image/png;base64,aGVsbG8='},role:'owner'})});});};
 try{
  const ui=mountAccount(doc,host);await new Promise(resolve=>setImmediate(resolve));assert.equal(requested,true);
  session=null;host.dispatchEvent(new Event('fjord:auth-changed'));resolveProfile();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(nodes.profileForm.hidden,true);assert.equal(nodes.accountAdmin.hidden,true);assert.equal(nodes.profileFirstName.value,'');assert.equal(nodes.profileEmail.value,'');assert.equal(nodes.profileAvatar.hidden,true);ui.destroy();
 }finally{globalThis.sessionStorage=oldSession;globalThis.fetch=oldFetch;}
});
