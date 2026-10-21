import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('owner reader renders only text and replies through authenticated site endpoint',async()=>{const script=await readFile(new URL('./owner-inbox.mjs',import.meta.url),'utf8');assert.doesNotMatch(script,/innerHTML|insertAdjacentHTML|document\.write|owner-inbox-token/);assert.match(script,/text\.textContent=message\.content/);assert.match(script,/url\.origin!==\x27https:\/\/fjord-flow-chat\.laurkent123\.workers\.dev\x27/);assert.match(script,/ensureVerified/);assert.match(script,/credentials:'omit'/);assert.match(script,/owner-cabinet-reply/);});
test('private owner page prevents indexing/referrer sharing and retains theme',async()=>{const html=await readFile(new URL('./owner-inbox.html',import.meta.url),'utf8');assert.match(html,/noindex,nofollow,noarchive/);assert.match(html,/name="referrer" content="no-referrer"/);assert.match(html,/fjord-theme\.css/);assert.match(html,/ТЕСТОВОЕ ОБРАЩЕНИЕ/);});

async function fixture({ticket='',denied=false}={}){
 class Element{
  constructor(){this.children=[];this.listeners={};this.dataset={};this.value='';this.hidden=false;this.disabled=false;this.attributes={};}
  append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}get childElementCount(){return this.children.length;}
  setAttribute(key,value){this.attributes[key]=value;}removeAttribute(key){delete this.attributes[key];delete this[key];}
  addEventListener(name,callback){this.listeners[name]=callback;}emit(name){return this.listeners[name]?.({});}
  querySelector(){return null;}showModal(){this.open=true;}close(){this.open=false;}
 }
 const ids=['readerStatus','readerLogin','readerLogout','readerTicket','readerAuth','readerWorkspace','readerList','readerSearch','readerMore','readerSelection','readerFacts','readerMessages','readerTopic','readerMail','readerContactHistory','readerCount','readerEmpty','readerResetFilter','readerFilter','readerTicketTitle','readerTest','readerAuthClose'];
 ids.push('readerReplyForm','readerReply','readerReplySend','readerReplyStatus');
 const nodes=Object.fromEntries(ids.map(id=>[id,new Element()])),events={},calls=[];
 const first={id:'a'.repeat(64),email:'visitor@example.test',display_name:'Тестовый посетитель',summary:'Прогулка у фьорда',status:'queued',created_at:1792408168,message_count:2,phone:null,email_verified:null};
 const second={id:'b'.repeat(64),email:'',display_name:'',summary:'Куда поехать?',status:'queued',created_at:1792408000,message_count:1};
 let token='fixture-token',loginCalls=0,detailResult=null;
 const location={href:'https://dimkanaprikole.github.io/fjord-flow/owner-inbox.html'+(ticket?'?ticket='+ticket:'')};
 const context={document:{querySelector:selector=>nodes[selector.slice(1)],createElement:()=>new Element()},location,history:{replaceState(_state,_title,url){location.href=String(url);}},window:{addEventListener:(name,callback)=>events[name]=callback},URL,AbortController,console,
  getVisitorToken:async()=>token,ensureVerified:async()=>{loginCalls++;return {idToken:token};},signOutVisitor:async()=>{token=null;},
  fetch:async(url,options={})=>{calls.push({url:String(url),options});if(String(url)==='./chat-config.json')return {ok:true,json:async()=>({endpoint:'https://fjord-flow-chat.laurkent123.workers.dev',firebaseApiKey:'public-fixture'})};
   if(denied)return {ok:false,status:403};const parsed=new URL(url);if(parsed.pathname==='/owner-cabinet-reply')return {ok:true,json:async()=>({recorded:true})};if(parsed.searchParams.has('ticket'))return detailResult?detailResult():{ok:true,json:async()=>({ticket:{...first,messages:[{role:'user',content:'<img src=x onerror=alert(1)>'},{role:'assistant',content:'Тестовый ответ'}]}})};
   return {ok:true,json:async()=>({scope:'consented_tickets',tickets:parsed.searchParams.has('cursor')?[second]:[first],next_cursor:parsed.searchParams.has('cursor')?null:'1792408168.'+first.id})};
  }};
 const code=(await readFile(new URL('./owner-inbox.mjs',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'').replace(/void open\(\);\s*$/,'');
 vm.createContext(context);vm.runInContext(code,context);
 return {context,nodes,calls,first,second,location,loginCalls:()=>loginCalls,setDetail(fn){detailResult=fn;},flush:async()=>{for(let i=0;i<30;i++)await Promise.resolve();}};
}

test('verified owner opens a private paginated list with search, without another login',async()=>{
 const h=await fixture();await h.context.open();assert.equal(h.loginCalls(),0);assert.equal(h.nodes.readerWorkspace.hidden,false);assert.equal(h.nodes.readerList.children.length,1);
 const firstRequest=h.calls.find(call=>call.url.includes('/owner-request'));assert.equal(new URL(firstRequest.url).searchParams.get('list'),'1');assert.equal(firstRequest.options.headers.Authorization,'Bearer fixture-token');assert.equal(firstRequest.options.credentials,'omit');
 await h.context.loadList(true);assert.equal(h.nodes.readerList.children.length,2);assert.equal(h.nodes.readerMore.hidden,true);
 h.nodes.readerSearch.value='visitor@example.test';h.nodes.readerSearch.emit('input');assert.equal(h.nodes.readerList.children.length,1);
 h.nodes.readerSearch.value='несуществующий';h.nodes.readerSearch.emit('input');assert.equal(h.nodes.readerList.children.length,0);assert.equal(h.nodes.readerEmpty.hidden,false);
});

test('owner explicitly submits one bounded reply to the selected ticket without email',async()=>{
 const h=await fixture({ticket:'a'.repeat(64)});await h.context.open();
 h.nodes.readerReply.value='Проверенный ответ';
 await h.nodes.readerReplyForm.listeners.submit({preventDefault(){}});
 const calls=h.calls.filter(call=>call.url.includes('/owner-cabinet-reply'));
 assert.equal(calls.length,1);assert.equal(calls[0].options.headers.Authorization,'Bearer fixture-token');
 assert.deepEqual(JSON.parse(calls[0].options.body),{ticket_id:'a'.repeat(64),answer:'Проверенный ответ'});
 assert.equal(h.nodes.readerReply.disabled,true);
});

test('existing ticket links render text safely and only supplied contacts',async()=>{
 const h=await fixture({ticket:'a'.repeat(64)});await h.context.open();assert.equal(h.nodes.readerTicket.hidden,false);assert.equal(h.nodes.readerMail.hidden,false);assert.equal(h.nodes.readerMail.href,'mailto:visitor%40example.test');
 assert.equal(h.nodes.readerMessages.children[0].children[1].textContent,'<img src=x onerror=alert(1)>');
 const labels=h.nodes.readerFacts.children.map(node=>node.textContent);assert.equal(labels.includes('Телефон'),false);assert.equal(labels.some(text=>text?.includes('подтвержд')),false,'historical email must not be presented as verified');
 h.nodes.readerContactHistory.emit('click');await h.flush();const filtered=h.calls.find(call=>new URL(call.url,'https://example.test').searchParams.has('email'));assert.equal(new URL(filtered.url).searchParams.get('email'),'visitor@example.test');
});

test('non-owner access leaves no contact list or transcript in the page',async()=>{
 const h=await fixture({denied:true});await h.context.open();assert.equal(h.nodes.readerWorkspace.hidden,true);assert.equal(h.nodes.readerList.children.length,0);assert.equal(h.nodes.readerMessages.children.length,0);assert.equal(h.nodes.readerLogout.hidden,false,'wrong account can sign out without seeing private data');assert.match(h.nodes.readerStatus.textContent,/только аккаунту владельца/);
});

test('late detail response cannot reveal private content after logout',async()=>{
 const h=await fixture();await h.context.open();let finish;
 h.setDetail(()=>new Promise(resolve=>{finish=resolve;}));const pending=h.context.showTicket(h.first.id);await h.flush();await h.nodes.readerLogout.emit('click');
 finish({ok:true,json:async()=>({ticket:{...h.first,messages:[{role:'user',content:'Late private text'}]}})});await pending;
 assert.equal(h.nodes.readerWorkspace.hidden,true);assert.equal(h.nodes.readerTicket.hidden,true);assert.equal(h.nodes.readerMessages.children.length,0);assert.equal(h.nodes.readerList.children.length,0);
});
