import {ensureVerified,getVisitorToken,signOutVisitor} from './afonya-auth.js?v=cms-auth-20261023-r3';
const select=id=>document.querySelector('#'+id),status=select('readerStatus'),login=select('readerLogin'),logout=select('readerLogout'),article=select('readerTicket'),dialog=select('readerAuth'),workspace=select('readerWorkspace'),list=select('readerList'),search=select('readerSearch'),more=select('readerMore');
const ID=/^[a-f0-9]{64}$/,EMAIL=/^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;
let settings,rows=[],nextCursor=null,selected=null,contactEmail='',authenticated=false,generation=0,detailGeneration=0,pendingList=false;
const requests=new Set();
const errors={401:'Войдите снова: срок авторизации истёк.',403:'Личный кабинет доступен только аккаунту владельца.',404:'Обращение не найдено или срок хранения закончился.',400:'Некорректная ссылка на обращение.'};
const clean=value=>typeof value==='string'?value.trim():'';
const safeEmail=value=>clean(value).length<=254&&EMAIL.test(clean(value))?clean(value):'';
const created=value=>Number.isSafeInteger(value)?new Date(value*1000).toLocaleString('ru-RU',{timeZone:'Europe/Oslo',dateStyle:'medium',timeStyle:'short'}):'';
const stateLabel=value=>({queued:'Ожидает ответа',answered:'Ответ подготовлен',service_test:'Тест'})[value]||'Сохранено';
const make=(tag,text,className)=>{const element=document.createElement(tag);if(text)element.textContent=text;if(className)element.className=className;return element;};
function clearTicket(){selected=null;article.hidden=true;select('readerSelection').hidden=false;select('readerFacts').replaceChildren();select('readerMessages').replaceChildren();select('readerTopic').textContent='';select('readerMail').hidden=true;select('readerMail').removeAttribute('href');select('readerContactHistory').hidden=true;}
function clear(){generation++;detailGeneration++;for(const request of requests)request.abort();requests.clear();rows=[];nextCursor=null;authenticated=false;pendingList=false;workspace.hidden=true;logout.hidden=true;list.replaceChildren();search.value='';clearTicket();}
async function config(){if(!settings){const response=await fetch('./chat-config.json',{cache:'no-store'});if(!response.ok)throw Error('config');const data=await response.json(),url=new URL(data.endpoint);if(url.origin!=='https://fjord-flow-chat.laurkent123.workers.dev'||!data.firebaseApiKey)throw Error('config');settings=data;}return settings;}
async function request(params){
 const data=await config(),token=await getVisitorToken(data.firebaseApiKey);if(!token)throw Object.assign(Error('authentication'),{status:401});
 const controller=new AbortController();requests.add(controller);
 try{const url=new URL('/owner-request',data.endpoint);for(const [key,value]of Object.entries(params))if(value)url.searchParams.set(key,value);const response=await fetch(url,{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});if(!response.ok)throw Object.assign(Error('request'),{status:response.status});return await response.json();}
 finally{requests.delete(controller);}
}
function failure(error){if(error?.name==='AbortError')return;if(error?.status===401||error?.status===403){clear();login.textContent='Войти и открыть';if(error.status===403)logout.hidden=false;}status.textContent=errors[error?.status]||'Не удалось открыть обращения. Проверьте соединение и повторите.';}
function renderList(){
 const query=search.value.trim().toLocaleLowerCase('ru-RU'),visible=rows.filter(value=>[value.display_name,value.email,value.phone,value.summary].some(text=>clean(text).toLocaleLowerCase('ru-RU').includes(query)));
 list.replaceChildren();
 for(const value of visible){const card=make('button',null,'owner-ticket-card');card.type='button';card.dataset.ticket=value.id;card.setAttribute('aria-pressed',String(selected?.id===value.id));const who=clean(value.display_name)||safeEmail(value.email)||'Посетитель без имени';card.append(make('strong',who,'owner-ticket-name'));
  if(clean(value.display_name)&&safeEmail(value.email))card.append(make('span',value.email,'owner-ticket-contact'));if(clean(value.phone))card.append(make('span',value.phone,'owner-ticket-contact'));
  card.append(make('span',clean(value.summary)||'Без темы','owner-ticket-summary'));const meta=[created(value.created_at),stateLabel(value.status)];if(Number.isSafeInteger(value.message_count))meta.push('Сообщений: '+value.message_count);card.append(make('small',meta.filter(Boolean).join(' · '),'owner-ticket-meta'));card.addEventListener('click',()=>void showTicket(value.id));list.append(card);
 }
 select('readerCount').textContent=query?'Найдено: '+visible.length+' из '+rows.length:'Загружено обращений: '+rows.length;
 const empty=select('readerEmpty');empty.hidden=visible.length>0;empty.textContent=query?'В загруженных обращениях совпадений нет.':'Обращений пока нет.';
 more.hidden=!nextCursor;more.disabled=pendingList;select('readerResetFilter').hidden=!contactEmail;select('readerFilter').hidden=!contactEmail;select('readerFilter').textContent=contactEmail?'Обращения с email: '+contactEmail:'';
}
function renderTicket(value){
 if(select('readerReplyForm')){select('readerReplyForm').hidden=value.status==='answered';select('readerReply').value='';select('readerReply').disabled=false;select('readerReplySend').disabled=false;select('readerReplyStatus').textContent='';}
 selected=value;const facts=select('readerFacts');facts.replaceChildren();select('readerTicketTitle').textContent=clean(value.display_name)||'Обращение посетителя';
 const lastUser=[...(value.messages||[])].reverse().find(message=>message?.role==='user'&&clean(message.content));select('readerTopic').textContent=clean(value.summary)||clean(lastUser?.content).slice(0,240)||'Без темы';
 const fields=[['Имя',clean(value.display_name)||'Не указано'],['Email',safeEmail(value.email)||'Не указан']];if(clean(value.phone))fields.push(['Телефон',clean(value.phone)]);if(clean(value.family_name))fields.push(['Фамилия',clean(value.family_name)]);fields.push(['Получено',created(value.created_at)?created(value.created_at)+' (Норвегия)':'Не указано'],['Статус',stateLabel(value.status)]);
 for(const [label,text]of fields){const dt=make('dt',label),dd=make('dd',text);facts.append(dt,dd);}
 const messages=select('readerMessages');messages.replaceChildren();
 for(const message of value.messages||[]){if(!['user','assistant'].includes(message.role)||typeof message.content!=='string')continue;const section=make('section',null,'owner-message'),role=make('strong',message.role==='user'?'Посетитель':'Osiris'),text=make('p');text.textContent=message.content;section.append(role,text);messages.append(section);}
 if(!messages.childElementCount)messages.append(make('p','Текст переписки отсутствует.'));
 const email=safeEmail(value.email),mail=select('readerMail');mail.hidden=!email;if(email)mail.href='mailto:'+encodeURIComponent(email);else mail.removeAttribute('href');select('readerContactHistory').hidden=!email;
 select('readerTest').hidden=value.service_test!==true;select('readerSelection').hidden=true;article.hidden=false;renderList();
}
async function loadList(append=false){
 if(pendingList)return;pendingList=true;more.disabled=true;const run=generation;
 try{const result=await request({list:'1',limit:'30',email:contactEmail,cursor:append?nextCursor:''});if(run!==generation)return;if(!Array.isArray(result.tickets))throw Error('response');const incoming=result.tickets.filter(value=>value&&ID.test(value.id)&&value.service_test!==true);rows=[...new Map([...(append?rows:[]),...incoming].map(value=>[value.id,value])).values()];nextCursor=typeof result.next_cursor==='string'?result.next_cursor:null;authenticated=true;workspace.hidden=false;logout.hidden=false;login.textContent='Обновить';renderList();status.textContent='Доступ подтверждён. Личный кабинет Osiris.';}
 catch(error){if(run===generation)failure(error);}finally{if(run===generation){pendingList=false;more.disabled=false;}}
}
async function showTicket(id,{updateURL=true}={}){
 if(!ID.test(id||'')){status.textContent=errors[400];return;}
 const run=generation,detail=++detailGeneration;clearTicket();status.textContent='Открываем историю разговора…';
 try{const result=await request({ticket:id});if(run!==generation||detail!==detailGeneration)return;if(result.ticket?.id!==id)throw Error('response');renderTicket(result.ticket);if(updateURL){const url=new URL(location.href);url.searchParams.set('ticket',id);history.replaceState(null,'',url);}status.textContent='Доступ подтверждён. Личное обращение.';}
 catch(error){if(run===generation&&detail===detailGeneration)failure(error);}
}
async function open(interactive=false){
 login.disabled=true;const run=++generation;for(const controller of requests)controller.abort();requests.clear();pendingList=false;status.textContent='Проверяем доступ…';
 try{const data=await config();let token=await getVisitorToken(data.firebaseApiKey);
  if(interactive&&!token){dialog.querySelector('.fjord-ai-auth')?.remove();dialog.showModal();const visitor=await ensureVerified(dialog,data.firebaseApiKey,'ru',{mode:'login'});if(!visitor||run!==generation){if(run===generation)status.textContent='Вход отменён.';return;}token=visitor.idToken;dialog.close();}
  if(run!==generation)return;if(!token){clear();status.textContent='Войдите в аккаунт владельца, чтобы открыть обращения.';return;}
  await loadList();if(run!==generation||!authenticated)return;const ticket=new URL(location.href).searchParams.get('ticket');if(ticket)await showTicket(ticket,{updateURL:false});
 }catch(error){if(run===generation)failure(error);}finally{login.disabled=false;}
}
login.addEventListener('click',()=>void open(true));
logout.addEventListener('click',async()=>{clear();login.textContent='Войти и открыть';status.textContent='Вы вышли. Контакты и переписка скрыты.';try{await signOutVisitor();}catch{status.textContent='Сведения скрыты. Не удалось завершить выход — повторите вход и выход.';}});
select('readerAuthClose').addEventListener('click',()=>dialog.close());search.addEventListener('input',renderList);more.addEventListener('click',()=>void loadList(true));
select('readerContactHistory').addEventListener('click',()=>{contactEmail=safeEmail(selected?.email);search.value='';void loadList();});
select('readerResetFilter').addEventListener('click',()=>{contactEmail='';search.value='';void loadList();});
window.addEventListener('fjord:auth-changed',()=>{void getVisitorToken(settings?.firebaseApiKey).then(token=>{if(!token){clear();status.textContent='Войдите в аккаунт владельца, чтобы открыть обращения.';}}).catch(()=>{});});
void open();
select('readerReplyForm')?.addEventListener('submit',async event=>{
 event.preventDefault();const ticket=selected?.id,answer=select('readerReply').value.trim(),run=generation;
 if(!ticket||!answer||answer.length>2000||!authenticated)return;
 const button=select('readerReplySend');button.disabled=true;select('readerReplyStatus').textContent='Сохраняем ответ…';
 try{const data=await config(),token=await getVisitorToken(data.firebaseApiKey);if(!token)throw Object.assign(Error('auth'),{status:401});const response=await fetch(new URL('/owner-cabinet-reply',data.endpoint),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({ticket_id:ticket,answer}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});if(!response.ok)throw Object.assign(Error('reply'),{status:response.status});const result=await response.json();if(run!==generation||selected?.id!==ticket)return;select('readerReplyStatus').textContent=result.already_answered?'Ответ уже был сохранён ранее.':'Ответ сохранён. Посетитель сможет получить его в чате сайта; это не email.';button.disabled=true;select('readerReply').disabled=true;}
 catch(error){if(run!==generation)return;select('readerReplyStatus').textContent='Не удалось сохранить ответ. Проверьте вход и повторите.';button.disabled=false;if(error.status===401||error.status===403)failure(error);}
});
