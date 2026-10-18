import {validateDocument,emptyDocument} from './site-editor-schema.mjs?v=7';
import {mountCatalogueEditor} from './catalogue-editor-admin.mjs?v=6';
import {getVisitorToken,ensureVerified} from './afonya-auth.js';

const $=id=>document.getElementById(id);
const OWNER='laurkent123@gmail.com';
const nonce=crypto.randomUUID();
const frame=$('sitePreview');
const panels=['catalogue','library','history'];
let documentValue=emptyDocument(),savedJSON=JSON.stringify(documentValue),draftVersion=0,publishedRevision=0;
let authorized=false,busy=false,config=null,previewReady=false,changeAccount=false,catalogueEditor,previewTimer;
const create=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const dirty=()=>JSON.stringify(documentValue)!==savedJSON;
const hasUnsaved=()=>dirty()||Boolean(catalogueEditor?.hasUnapplied());
function status(message,kind=''){ $('status').textContent=message;$('status').dataset.kind=kind; }
function controls(){
  $('save').disabled=busy||!authorized;$('publish').disabled=busy||!authorized;$('login').disabled=busy;
  document.querySelector('.editor-controls').inert=busy;
}
function changed(){
  status('Есть изменения в черновике. Они ещё не сохранены.');
  clearTimeout(previewTimer);previewTimer=setTimeout(sendPreview,100);
}
function sendPreview(){
  if(!previewReady)return;
  let clean;
  try{clean=validateDocument(documentValue);}
  catch{status('Проверьте заполненные ссылки и значения. Последний корректный черновик остаётся в предпросмотре; изменения не сохранены.','error');return;}
  $('previewStatus').textContent='Обновляем предпросмотр черновика…';
  frame.contentWindow.postMessage({type:'fjord-editor:apply',nonce,document:clean,language:$('previewLanguage').value,pageId:'catalogue'},location.origin);
}
function openPreview(){
  previewReady=false;$('previewStatus').textContent='Загружаем предпросмотр…';
  frame.src='./index.html?editorPreview='+encodeURIComponent(nonce)+'&editorBuild=8&reload='+Date.now();
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.nonce!==nonce)return;
  if(event.data.type==='fjord-editor:ready'){previewReady=true;sendPreview();}
  if(event.data.type==='fjord-editor:applied')$('previewStatus').textContent='Предпросмотр черновика обновлён. Здесь можно проверить карточки и фотографии.';
});
function renderAll({resetForm=false}={}){
  controls();catalogueEditor?.refresh({resetForm});sendPreview();
}
function renderHistory(history=[]){
  const host=$('historyList');host.replaceChildren();
  if(!history.length){host.textContent='Опубликованных версий пока нет.';return;}
  for(const item of history){
    const row=create('div'),label=create('div','Версия '+item.revision),date=create('small',item.createdAt?new Date(item.createdAt).toLocaleString('ru-RU'):'');
    row.className='history-item';label.append(date);
    const button=create('button',Number(item.revision)===publishedRevision?'Текущая':'Восстановить');
    button.type='button';button.disabled=Number(item.revision)===publishedRevision;
    button.addEventListener('click',()=>void rollback(item.revision));row.append(label,button);host.append(row);
  }
}
async function api(path,{method='GET',body,auth=true}={}){
  if(!config)throw new Error('Настройки сервера ещё не загружены. Изменения не сохранены.');
  const headers={};if(body!==undefined)headers['Content-Type']='application/json';
  if(auth){
    const token=await getVisitorToken(config.firebaseApiKey);
    if(!token){authorized=false;controls();throw new Error('Войдите подтверждённым аккаунтом владельца. Изменения не сохранены.');}
    headers.Authorization='Bearer '+token;
  }
  const response=await fetch(config.endpoint.replace(/\/$/,'')+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const value=await response.json().catch(()=>({}));
  if(!response.ok){
    if(response.status===401||response.status===403){
      authorized=false;changeAccount=response.status===403;$('login').textContent=changeAccount?'Войти другим аккаунтом':'Войти владельцу';controls();
      throw new Error(response.status===403?'Доступ только для подтверждённого '+OWNER+'. Черновик не сохранён.':'Вход устарел. Войдите снова; черновик не сохранён.');
    }
    if(response.status===409)throw new Error('Версия изменилась в другом окне. Ваши правки остались здесь; сохраните нужный текст перед перезагрузкой админки.');
    throw new Error(response.status===400?'Проверьте значения и ссылки. Изменения не сохранены.':'Сервер временно недоступен. Изменения не сохранены.');
  }
  return value;
}
async function loadOwner({keepPreview=false}={}){
  const state=await api('/cms/admin/state');authorized=true;changeAccount=false;
  publishedRevision=Number(state.published?.revision||0);draftVersion=Number(state.draft?.version||0);
  if(!dirty()&&!keepPreview){
    documentValue=validateDocument(state.draft?.document||state.published?.document||emptyDocument());savedJSON=JSON.stringify(documentValue);renderAll();
  }
  catalogueEditor?.refresh();$('identity').textContent=OWNER;$('login').textContent='Проверить вход';renderHistory(state.history);controls();
  status(hasUnsaved()?'Владелец вошёл. Изменения ещё не сохранены.':state.draft&&!keepPreview?`Открыт сохранённый черновик. На сайте опубликована версия ${publishedRevision||'исходная'}.`:`Вход владельца подтверждён. Публикация: ${publishedRevision||'исходный сайт'}.`,'success');
}
async function signIn(){
  if(!config){status('Сервер ещё недоступен. Предпросмотр доступен.','error');return;}
  if(changeAccount)sessionStorage.removeItem('fjord-afonya-visitor');
  const dialog=$('authDialog');dialog.showModal();
  try{
    const result=await ensureVerified(dialog,config.firebaseApiKey,'ru',{heading:'Вход владельца — '+OWNER});
    if(!result)return;if(dialog.open)dialog.close();await loadOwner();
  }catch(error){status(error.message||'Не удалось проверить вход. Предпросмотр доступен, публикация не выполнена.','error');}
}
async function saveDraft(){
  if(catalogueEditor?.hasUnapplied())throw new Error('Сначала нажмите «Применить в черновик» в форме места.');
  // Keep the complete document, including previously published page and style settings.
  const clean=validateDocument(documentValue);
  const result=await api('/cms/admin/draft',{method:'PUT',body:{document:clean,expectedDraftVersion:draftVersion}}),draft=result.draft||result;
  draftVersion=Number(draft.version);documentValue=validateDocument(draft.document||clean);savedJSON=JSON.stringify(documentValue);
  status('Черновик сохранён. Публичный сайт ещё не изменён.','success');
}
async function run(action){
  if(busy)return;busy=true;controls();
  try{await action();}
  catch(error){
    const message=error.message||'Не удалось выполнить действие.';
    status(error.name==='TimeoutError'?'Сервер не ответил вовремя. Сохранение не подтверждено.':message.startsWith('invalid_')?'Проверьте поля и ссылки. Изменения не сохранены.':message,'error');
  }finally{busy=false;controls();}
}
async function publish(){
  await run(async()=>{
    await saveDraft();status('Публикуем сохранённый черновик…');
    const result=await api('/cms/admin/publish',{method:'POST',body:{expectedDraftVersion:draftVersion,expectedPublishedRevision:publishedRevision}}),published=result.published||result;
    publishedRevision=Number(published.revision);await loadOwner();
    status('Опубликована версия '+publishedRevision+'. Новые посетители увидят изменения при открытии сайта.','success');
  });
}
async function rollback(revision){
  if(!confirm('Опубликовать содержимое версии '+revision+'? Текущая публикация останется в истории.'))return;
  if(hasUnsaved()&&!confirm('Есть несохранённые правки. Отменить их и восстановить выбранную версию?'))return;
  await run(async()=>{
    const result=await api('/cms/admin/rollback',{method:'POST',body:{revision:Number(revision),expectedPublishedRevision:publishedRevision}}),published=result.published||result;
    documentValue=validateDocument(published.document);savedJSON=JSON.stringify(documentValue);publishedRevision=Number(published.revision);
    renderAll({resetForm:true});await loadOwner({keepPreview:true});
    status('Версия '+revision+' восстановлена новой публикацией '+publishedRevision+'. Она показана в предпросмотре. Прежний черновик сохранён на сервере отдельно до следующего сохранения.','success');
  });
}
for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>{
  for(const peer of document.querySelectorAll('[data-tab]'))peer.setAttribute('aria-pressed',String(peer===button));
  for(const name of panels)$(name+'Panel').hidden=name!==button.dataset.tab;
  catalogueEditor?.open(button.dataset.tab);
};
function setPreviewDevice(mobile){
  frame.classList.toggle('mobile',mobile);$('desktop').setAttribute('aria-pressed',String(!mobile));$('mobile').setAttribute('aria-pressed',String(mobile));
}
$('desktop').onclick=()=>setPreviewDevice(false);$('mobile').onclick=()=>setPreviewDevice(true);
$('previewLanguage').onchange=sendPreview;$('reloadPreview').onclick=openPreview;
$('login').onclick=()=>void signIn();$('closeAuth').onclick=()=>$('authDialog').close();
$('save').onclick=()=>void run(saveDraft);$('publish').onclick=()=>void publish();
window.addEventListener('beforeunload',event=>{if(hasUnsaved()){event.preventDefault();event.returnValue='';}});
catalogueEditor=mountCatalogueEditor({getDocument:()=>documentValue,changed:()=>{validateDocument(documentValue);changed();},api,isAuthorized:()=>authorized,status});
renderAll();openPreview();
try{
  const response=await fetch('./chat-config.json',{cache:'no-store'});if(!response.ok)throw new Error();config=await response.json();
  const endpoint=new URL(config.endpoint);if(endpoint.protocol!=='https:'||endpoint.hostname!=='fjord-flow-chat.laurkent123.workers.dev')throw new Error();
  const state=await api('/cms/public',{auth:false});publishedRevision=Number(state.revision||0);
  if(state.document&&!dirty()){documentValue=validateDocument(state.document);savedJSON=JSON.stringify(documentValue);renderAll();}
  status('Каталог готов. Войдите владельцем для сохранения и публикации.');
  if(await getVisitorToken(config.firebaseApiKey))await loadOwner();
}catch(error){
  status(changeAccount?'Вы вошли как посетитель. Для сохранения и публикации войдите подтверждённым аккаунтом '+OWNER+'. Предпросмотр доступен.':'Предпросмотр доступен. Подключение к админке или вход пока не подтверждены; изменения не сохранены.','error');
}
