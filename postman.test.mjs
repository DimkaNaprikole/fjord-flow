import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COPY,isOwner,requestOwner,errorKey,mountPostman} from './postman.mjs';
const ENDPOINT='https://fjord-flow-chat.laurkent123.workers.dev';
const profile={role:'owner',profile:{uid:'owner-id',email:'laurkent123@gmail.com',preferences:{language:'ru'}}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({owner=profile,deferred=null,sendError=null}={}){
 const ids=['postmanLanguage','postmanStatus','postmanWorkspace','postmanGate','postmanLogin','postmanConnect','postmanDisconnect','postmanEnableSend','postmanMail','postmanCompose','postmanSend','postmanReview','postmanReviewText','postmanIdentity','postmanResults','postmanMessage','postmanSubject','postmanFrom','postmanTo','postmanDate','postmanText','postmanRecipient','postmanDraftSubject','postmanBody','postmanQuery','postmanMore','postmanSearchForm','postmanUnread','postmanComposeForm','postmanAuthDialog','postmanAuthClose'];
 const nodes=Object.fromEntries(ids.map(id=>[id,{hidden:false,disabled:false,value:'',textContent:'',listeners:{},setAttribute(){},replaceChildren(){this.children=[];},append(node){(this.children||=[]).push(node);},addEventListener(name,fn){this.listeners[name]=fn;},reportValidity(){return true;}}]));
 const doc={documentElement:{lang:''},getElementById:id=>nodes[id],querySelectorAll:()=>[],createElement:()=>({append(){}})};
 const host=new EventTarget();host.location={href:'https://site.invalid/postman.html?lang=ru'};host.localStorage={getItem:()=>null};
 let session={email:'laurkent123@gmail.com'},authorizeCalls=0,sends=0;
 host.fetch=async url=>({ok:true,json:async()=>url==='./chat-config.json'?{firebaseApiKey:'public',endpoint:ENDPOINT}:deferred?await deferred:owner});
 const client={disconnect(){},async connect(){},authorizeSend:draft=>Object.freeze({...draft}),async send(snapshot,draft){sends++;assert.deepEqual(snapshot,draft);if(sendError)throw {code:sendError};await tick();return{id:'sent'};},async listMessages(){return{messages:[]};}};
 const ui=mountPostman(doc,host,{auth:{getStoredVisitor:()=>session,getVisitorToken:async()=>session?'site-token':'',ensureVerified:async()=>{}},client,authorize:async()=>{authorizeCalls++;return{accessToken:'gmail-token',uid:'owner-id',email:'laurkent123@gmail.com'};},release:()=>{}});
 return{nodes,host,ui,logout(){session=null;host.dispatchEvent(new Event('fjord:auth-changed'));},get sends(){return sends;},get authorizeCalls(){return authorizeCalls;}};
}
test('all labels/errors exist in six languages and public shell hides workspace',async()=>{
 const html=await readFile(new URL('./postman.html',import.meta.url),'utf8');for(const lang of ['nb','en','ru','uk','sv','da'])for(const key of [...Object.keys(COPY.en),...Array.from(html.matchAll(/data-copy="([^"]+)"/g),m=>m[1])])assert.ok(COPY[lang][key],`${lang}/${key}`);
 assert.match(html,/<div id="postmanWorkspace" hidden>/);assert.match(html,/noindex,nofollow,noarchive/);assert.match(html,/maxlength="300"/);
});
test('owner requires server role, exact verified owner email and uid',async()=>{
 assert.equal(isOwner(profile),true);for(const value of [{...profile,role:'user'},{role:'owner',profile:{uid:'x',email:'other@example.org'}},{role:'owner',profile:{email:'laurkent123@gmail.com'}}])assert.equal(isOwner(value),false);
 await assert.rejects(requestOwner('site-token',async()=>({ok:true,json:async()=>({...profile,role:'user'})})),e=>e.code==='ownerOnly');
 const f=fixture({owner:{...profile,role:'user'}});await f.ui.ready;assert.equal(f.nodes.postmanWorkspace.hidden,true);await f.nodes.postmanConnect.onclick();assert.equal(f.authorizeCalls,0);f.ui.dispose();
});
test('late profile after logout cannot expose owner controls',async()=>{
 let resolve;const deferred=new Promise(r=>resolve=r),f=fixture({deferred});await tick();f.logout();resolve(profile);await f.ui.ready;assert.equal(f.nodes.postmanWorkspace.hidden,true);assert.equal(f.nodes.postmanIdentity.textContent,'');f.ui.dispose();
});
async function readyToSend(f){await f.ui.ready;f.nodes.postmanConnect.onclick();await tick();f.nodes.postmanEnableSend.onclick();await tick();f.nodes.postmanRecipient.value='recipient@example.org';f.nodes.postmanDraftSubject.value='Subject';f.nodes.postmanBody.value='Reviewed body';f.nodes.postmanComposeForm.onsubmit({preventDefault(){}});}
test('review invalidates on edit and a double send click produces one request',async()=>{
 const f=fixture();await readyToSend(f);assert.equal(f.nodes.postmanReview.hidden,false);f.nodes.postmanBody.value='Changed';f.nodes.postmanBody.listeners.input();assert.equal(f.nodes.postmanReview.hidden,true);await f.nodes.postmanSend.onclick();await tick();assert.equal(f.sends,0);
 f.nodes.postmanComposeForm.onsubmit({preventDefault(){}});f.nodes.postmanSend.onclick();f.nodes.postmanSend.onclick();await tick();await tick();assert.equal(f.sends,1);assert.equal(f.nodes.postmanBody.value,'');f.ui.dispose();
});
test('unknown delivery disables draft resubmission and asks to check Sent',async()=>{
 assert.equal(errorKey({code:'unknownSend'}),'unknown');assert.equal(errorKey({code:'accountMismatch'}),'wrongAccount');assert.equal(errorKey({code:'authorizationRequired'}),'reviewChanged');
 const f=fixture({sendError:'unknownSend'});await readyToSend(f);f.nodes.postmanSend.onclick();await tick();assert.equal(f.sends,1);assert.equal(f.nodes.postmanCompose.disabled,true);assert.equal(f.nodes.postmanStatus.textContent,COPY.ru.unknown);f.nodes.postmanComposeForm.onsubmit({preventDefault(){}});f.nodes.postmanSend.onclick();await tick();assert.equal(f.sends,1);f.ui.dispose();
});
test('pagehide clears mailbox content, draft and identity',async()=>{
 const f=fixture();await readyToSend(f);f.nodes.postmanText.textContent='Private mail';f.host.dispatchEvent(new Event('pagehide'));assert.equal(f.nodes.postmanText.textContent,'');assert.equal(f.nodes.postmanBody.value,'');assert.equal(f.nodes.postmanIdentity.textContent,'');assert.equal(f.nodes.postmanWorkspace.hidden,true);f.ui.dispose();
});
