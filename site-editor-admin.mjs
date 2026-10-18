import {PAGES,BLOCKS,LANGUAGES,THEME_FIELDS,MEDIA_FIELDS,validateDocument,emptyDocument} from './site-editor-schema.mjs?v=6';
import {mountVisualBuilderAdmin} from './visual-builder-admin.mjs?v=4';
import {mountCatalogueEditor} from './catalogue-editor-admin.mjs?v=5';
import {getVisitorToken,ensureVerified} from './afonya-auth.js';

const $=id=>document.getElementById(id);
const OWNER='laurkent123@gmail.com';
const nonce=crypto.randomUUID();
const frame=$('sitePreview');
let documentValue=emptyDocument(),savedJSON=JSON.stringify(documentValue),draftVersion=0,publishedRevision=0,authorized=false,busy=false,config=null,previewReady=false,inspected={},changeAccount=false;
let catalogueEditor,visualBuilder;
let chosen={group:'pages',id:'home'},previewTimer,inspectSequence=0;
const create=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
const dirty=()=>JSON.stringify(documentValue)!==savedJSON;
function status(message,kind=''){ $('status').textContent=message;$('status').dataset.kind=kind; }
function controls(){ $('save').disabled=busy||!authorized;$('publish').disabled=busy||!authorized;$('login').disabled=busy;document.querySelector('.editor-controls').inert=busy; }
function changed(){status('Есть изменения в предпросмотре. Они ещё не сохранены.');checkContrast();clearTimeout(previewTimer);previewTimer=setTimeout(sendPreview,100);}
function checkContrast(){
  const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(part=>parseInt(part,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  const ink=luminance(documentValue.theme.ink||THEME_FIELDS.ink.default),poor=[];
  for(const [key,label]of [['action','кнопках'],['panel','фоне разделов'],['card','карточках']]){const bg=luminance(documentValue.theme[key]||THEME_FIELDS[key].default);if((Math.max(ink,bg)+.05)/(Math.min(ink,bg)+.05)<4.5)poor.push(label);}
  $('contrastWarning').hidden=!poor.length;$('contrastWarning').textContent=poor.length?'Текст плохо читается на '+poor.join(', ')+'. Сделайте фон темнее или текст светлее.':'';
}
function previewPage(){return chosen.group==='blocks'?'home':chosen.id;}
function sendPreview(){if(!previewReady)return;let clean;try{clean=validateDocument(documentValue);}catch{status('Проверьте заполненные ссылки и значения. Последние корректные настройки остаются в предпросмотре; изменения не сохранены.','error');return;}frame.contentWindow.postMessage({type:'fjord-editor:apply',nonce,document:clean,language:$('language').value,pageId:previewPage(),blockId:chosen.group==='blocks'?chosen.id:undefined},location.origin);}
function inspect(){if(previewReady)frame.contentWindow.postMessage({type:'fjord-editor:inspect',nonce,requestId:String(++inspectSequence)},location.origin);}
function openPreview(){previewReady=false;frame.src='./index.html?editorPreview='+encodeURIComponent(nonce)+'&editorBuild=7&reload='+Date.now();}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.nonce!==nonce)return;
  if(event.data.type==='fjord-editor:ready'){previewReady=true;sendPreview();setTimeout(inspect,200);setTimeout(inspect,2000);setTimeout(inspect,5000);}
  if(event.data.type==='fjord-editor:applied')setTimeout(inspect,100);
  if(event.data.type==='fjord-editor:inspected'&&event.data.values&&typeof event.data.values==='object'){
    inspected=event.data.values;const value=inspected[chosen.group]?.[chosen.id]||{};
    for(const field of ['title','intro']){const input=$('content-'+field);if(input)input.placeholder=typeof value[field]==='string'?value[field]:'Исходный текст сайта';}
  }
});

function renderContent(){
  const descriptors=chosen.group==='pages'?PAGES:BLOCKS,descriptor=descriptors.find(item=>item.id===chosen.id);
  const host=$('contentFields');host.replaceChildren();
  const item=documentValue[chosen.group][chosen.id]||{},language=$('language').value;
  const visible=create('label',undefined,'check'),check=document.createElement('input');check.type='checkbox';check.checked=item.enabled!==false;check.disabled=chosen.id==='home';visible.append(check,create('span','Показывать на сайте'));host.append(visible);
  check.addEventListener('change',()=>{const record=documentValue[chosen.group][chosen.id]??={};record.enabled=check.checked;changed();});
  for(const field of ['title','intro']){
    if(field==='intro'&&!descriptor.intro)continue;
    const label=create('label',field==='title'?'Заголовок':'Описание'),input=document.createElement(field==='title'?'input':'textarea');input.id='content-'+field;input.maxLength=field==='title'?240:1800;input.value=item[field]?.[language]||'';input.placeholder=inspected[chosen.group]?.[chosen.id]?.[field]||'Исходный текст сайта';label.append(input);host.append(label);
    input.addEventListener('input',()=>{const record=documentValue[chosen.group][chosen.id]??={};record[field]??={};if(input.value.trim())record[field][language]=input.value;else delete record[field][language];changed();});
  }
  sendPreview();setTimeout(inspect,150);
}
function renderOrder(){
  const ids=[...documentValue.navOrder,...PAGES.map(p=>p.id).filter(id=>!documentValue.navOrder.includes(id))];
  const list=$('navOrder');list.replaceChildren();ids.forEach((id,index)=>{
    const li=create('li'),name=create('span',PAGES.find(p=>p.id===id).name);li.append(name);
    for(const [step,label]of [[-1,'↑'],[1,'↓']]){const button=create('button',label);button.type='button';button.setAttribute('aria-label',(step===-1?'Выше: ':'Ниже: ')+name.textContent);button.disabled=index+step<0||index+step>=ids.length;button.addEventListener('click',()=>{[ids[index],ids[index+step]]=[ids[index+step],ids[index]];documentValue.navOrder=ids;renderOrder();changed();});li.append(button);}
    list.append(li);
  });
}
function renderTheme(){
  const host=$('themeFields');host.replaceChildren();
  for(const [key,field]of Object.entries(THEME_FIELDS)){
    const row=create('div',undefined,'theme-field'),label=create('label',field.label),input=document.createElement(field.type==='select'?'select':'input');
    if(field.type==='select')for(const option of field.options){const node=create('option',option);node.value=option;input.append(node);}
    else {input.type=field.type;if(field.type==='number'){input.min=field.min;input.max=field.max;input.step=field.step;}}
    input.value=documentValue.theme[key]??field.default;
    input.addEventListener('input',()=>{if(!input.checkValidity())return;documentValue.theme[key]=field.type==='number'?Number(input.value):input.value;changed();});
    const reset=create('button','Сброс','reset');reset.type='button';reset.setAttribute('aria-label','Сбросить: '+field.label);reset.onclick=()=>{delete documentValue.theme[key];renderTheme();changed();};label.append(input);row.append(label,reset);host.append(row);
  }
}
function renderMedia(){
  const host=$('mediaFields');host.replaceChildren();
  for(const media of MEDIA_FIELDS){const section=create('section',undefined,'media-group');section.dataset.mediaId=media.id;section.append(create('h3',media.name));
    const thumb=create('img');thumb.alt='Предпросмотр выбранной фотографии';thumb.hidden=!documentValue.media[media.id]?.src;if(!thumb.hidden)thumb.src=documentValue.media[media.id].src;section.append(thumb);
    for(const [field,title]of [['src','Ссылка на изображение'],['alt','Что изображено'],['credit','Автор / лицензия'],['source','Ссылка на источник']]){
      const label=create('label',title),input=document.createElement('input');input.type='text';input.maxLength=1000;input.value=documentValue.media[media.id]?.[field]||'';input.placeholder=field==='src'?'images/… или https://…':'';label.append(input);section.append(label);
      input.addEventListener('input',()=>{const record=documentValue.media[media.id]??={src:''};record[field]=input.value.trim();if(field==='src'&&!record.src){delete documentValue.media[media.id];for(const peer of section.querySelectorAll('input'))if(peer!==input)peer.value='';}changed();});
    }
    const choose=create('button','Выбрать из фотобиблиотеки');choose.type='button';const picker=create('select');picker.hidden=true;picker.setAttribute('aria-label','Фото для '+media.name);
    choose.onclick=async()=>{choose.disabled=true;try{const assets=await catalogueEditor.loadLibrary();picker.replaceChildren(new Option('Выберите фотографию…',''),...assets.map(asset=>new Option(asset.name||asset.id,asset.url)));picker.hidden=false;if(!assets.length)status('Библиотека пуста. Загрузите фото во вкладке «Фотобиблиотека».');}catch{status('Для фотобиблиотеки нужен вход владельца.','error');}finally{choose.disabled=false;}};
    picker.onchange=()=>{if(!picker.value)return;const input=section.querySelector('input');input.value=picker.value;input.dispatchEvent(new Event('input'));thumb.src=picker.value;thumb.hidden=false;};
    section.append(choose,picker,create('p','Нажмите фото на сайте, затем укажите ссылку или выберите загруженный файл. При замене проверьте автора и источник.','hint'));host.append(section);
  }
}
function renderAll({resetForm=false}={}){renderContent();renderOrder();renderTheme();renderMedia();checkContrast();controls();catalogueEditor?.refresh({resetForm});visualBuilder?.refresh();}
function renderHistory(history=[]){
  const host=$('historyList');host.replaceChildren();if(!history.length){host.textContent='Опубликованных версий пока нет.';return;}
  for(const item of history){const row=create('div',undefined,'history-item'),label=create('div','Версия '+item.revision),date=create('small',item.createdAt?new Date(item.createdAt).toLocaleString('ru-RU'):'');label.append(date);const button=create('button',Number(item.revision)===publishedRevision?'Текущая':'Восстановить');button.type='button';button.disabled=Number(item.revision)===publishedRevision;button.addEventListener('click',()=>rollback(item.revision));row.append(label,button);host.append(row);}
}
async function api(path,{method='GET',body,auth=true}={}){
  if(!config)throw new Error('Настройки сервера ещё не загружены. Изменения не сохранены.');
  const headers={};if(body!==undefined)headers['Content-Type']='application/json';
  if(auth){const token=await getVisitorToken(config.firebaseApiKey);if(!token){authorized=false;controls();throw new Error('Войдите подтверждённым аккаунтом владельца. Изменения не сохранены.');}headers.Authorization='Bearer '+token;}
  const response=await fetch(config.endpoint.replace(/\/$/,'')+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const value=await response.json().catch(()=>({}));
  if(!response.ok){
    if(response.status===401||response.status===403){authorized=false;changeAccount=response.status===403;$('login').textContent=changeAccount?'Войти другим аккаунтом':'Войти владельцу';controls();throw new Error(response.status===403?'Доступ только для подтверждённого '+OWNER+'. Черновик не сохранён.':'Вход устарел. Войдите снова; черновик не сохранён.');}
    if(response.status===409)throw new Error('Версия изменилась в другом окне. Ваши правки остались в предпросмотре; перезагрузите редактор после сохранения нужного текста.');
    throw new Error(response.status===400?'Проверьте значения и ссылки. Изменения не сохранены.':'Сервер временно недоступен. Изменения не сохранены.');
  }return value;
}
async function loadOwner({keepPreview=false}={}){
  const state=await api('/cms/admin/state');authorized=true;changeAccount=false;publishedRevision=Number(state.published?.revision||0);draftVersion=Number(state.draft?.version||0);
  if(!dirty()&&!keepPreview){documentValue=validateDocument(state.draft?.document||state.published?.document||emptyDocument());savedJSON=JSON.stringify(documentValue);renderAll();}
  catalogueEditor?.refresh();$('identity').textContent=OWNER;$('login').textContent='Проверить вход';renderHistory(state.history);controls();
  status(dirty()?'Владелец вошёл. Изменения в предпросмотре ещё не сохранены.':state.draft&&!keepPreview?`Открыт сохранённый черновик. На сайте опубликована версия ${publishedRevision||'исходная'}.`:`Вход владельца подтверждён. Публикация: ${publishedRevision||'исходный сайт'}.`,'success');
}
async function signIn(){
  if(!config){status('Сервер ещё недоступен. Можно работать с предпросмотром.','error');return;}
  if(changeAccount)sessionStorage.removeItem('fjord-afonya-visitor');
  const dialog=$('authDialog');dialog.showModal();
  try{const result=await ensureVerified(dialog,config.firebaseApiKey,'ru',{heading:'Вход владельца — '+OWNER});if(!result)return;if(dialog.open)dialog.close();await loadOwner();}catch(error){status(error.message||'Не удалось проверить вход. Предпросмотр доступен, публикация не выполнена.','error');}
}
async function saveDraft(){
  if(catalogueEditor?.hasUnapplied())throw new Error('Сначала нажмите «Применить в черновик» в форме места.');
  const clean=validateDocument(documentValue);
  const result=await api('/cms/admin/draft',{method:'PUT',body:{document:clean,expectedDraftVersion:draftVersion}}),draft=result.draft||result;
  draftVersion=Number(draft.version);documentValue=validateDocument(draft.document||clean);savedJSON=JSON.stringify(documentValue);status('Черновик сохранён. Публичный сайт ещё не изменён.','success');
}
async function run(action){if(busy)return;busy=true;controls();try{await action();}catch(error){status(error.name==='TimeoutError'?'Сервер не ответил вовремя. Сохранение не подтверждено.':error.message.startsWith('invalid_')?'Проверьте поля: используются только безопасные ссылки, допустимые цвета и размеры. Изменения не сохранены.':error.message||'Не удалось выполнить действие.','error');}finally{busy=false;controls();}}
async function publish(){await run(async()=>{
  await saveDraft();status('Публикуем сохранённый черновик…');
  const result=await api('/cms/admin/publish',{method:'POST',body:{expectedDraftVersion:draftVersion,expectedPublishedRevision:publishedRevision}}),published=result.published||result;
  publishedRevision=Number(published.revision);await loadOwner();status('Опубликована версия '+publishedRevision+'. Новые посетители увидят изменения при открытии сайта.','success');
});}
async function rollback(revision){
  if(!confirm('Опубликовать содержимое версии '+revision+'? Текущая публикация останется в истории.'))return;
  if((dirty()||catalogueEditor?.hasUnapplied())&&!confirm('В предпросмотре есть несохранённые правки. Отменить их и восстановить выбранную версию?'))return;
  await run(async()=>{const result=await api('/cms/admin/rollback',{method:'POST',body:{revision:Number(revision),expectedPublishedRevision:publishedRevision}}),published=result.published||result;documentValue=validateDocument(published.document);savedJSON=JSON.stringify(documentValue);publishedRevision=Number(published.revision);renderAll({resetForm:true});await loadOwner({keepPreview:true});status('Версия '+revision+' восстановлена новой публикацией '+publishedRevision+'. Она показана в предпросмотре. Прежний черновик сохранён на сервере отдельно до следующего сохранения.','success');});
}

for(const [group,heading,descriptors]of [['pages','Страницы',PAGES],['blocks','Блоки главной',BLOCKS]]){const options=create('optgroup');options.label=heading;for(const descriptor of descriptors){const option=create('option',descriptor.name);option.value=group+':'+descriptor.id;options.append(option);}$('contentTarget').append(options);}
$('contentTarget').onchange=()=>{const[group,id]=$('contentTarget').value.split(':');chosen={group,id};inspected={};renderContent();};
$('language').onchange=()=>{inspected={};renderContent();visualBuilder?.refresh();};
for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>{if(button.dataset.tab==='media')for(const group of document.querySelectorAll('[data-media-id]'))group.hidden=false;for(const peer of document.querySelectorAll('[data-tab]'))peer.setAttribute('aria-pressed',String(peer===button));for(const name of ['content','theme','media','catalogue','library','history'])$(name+'Panel').hidden=name!==button.dataset.tab;catalogueEditor?.open(button.dataset.tab);};
$('desktop').onclick=()=>{frame.classList.remove('mobile');$('desktop').setAttribute('aria-pressed','true');$('mobile').setAttribute('aria-pressed','false');};
$('mobile').onclick=()=>{frame.classList.add('mobile');$('mobile').setAttribute('aria-pressed','true');$('desktop').setAttribute('aria-pressed','false');};
$('reloadPreview').onclick=openPreview;$('login').onclick=()=>void signIn();$('closeAuth').onclick=()=>$('authDialog').close();$('save').onclick=()=>void run(saveDraft);$('publish').onclick=()=>void publish();
$('resetTheme').onclick=()=>{documentValue.theme={};renderTheme();changed();};
window.addEventListener('beforeunload',event=>{if(dirty()||catalogueEditor?.hasUnapplied()){event.preventDefault();event.returnValue='';}});
catalogueEditor=mountCatalogueEditor({getDocument:()=>documentValue,changed:(catalogueChanged=false)=>{validateDocument(documentValue);if(catalogueChanged){chosen={group:'pages',id:'catalogue'};$('contentTarget').value='pages:catalogue';renderContent();}changed();},api,isAuthorized:()=>authorized,status});
visualBuilder=mountVisualBuilderAdmin({frame,nonce,loadAssets:()=>catalogueEditor.loadLibrary(),getDocument:()=>documentValue,changed,language:()=>$('language').value,onOrder:renderOrder,selectContent:(group,id,field)=>{chosen={group,id};$('contentTarget').value=group+':'+id;document.querySelector('[data-tab=content]').click();renderContent();$('contentFields').scrollIntoView({block:'nearest',behavior:'smooth'});if(field)$('content-'+field)?.focus();},selectPlace:id=>{document.querySelector('[data-tab=catalogue]').click();catalogueEditor.selectPlace(id);},selectMedia:id=>{document.querySelector('[data-tab=media]').click();for(const group of document.querySelectorAll('[data-media-id]'))group.hidden=group.dataset.mediaId!==id;document.querySelector('[data-media-id="'+id+'"] input')?.focus();}});
renderAll();openPreview();
try{
  const response=await fetch('./chat-config.json',{cache:'no-store'});if(!response.ok)throw new Error();config=await response.json();
  const endpoint=new URL(config.endpoint);if(endpoint.protocol!=='https:'||endpoint.hostname!=='fjord-flow-chat.laurkent123.workers.dev')throw new Error();
  const state=await api('/cms/public',{auth:false});publishedRevision=Number(state.revision||0);if(state.document&&!dirty()){documentValue=validateDocument(state.document);savedJSON=JSON.stringify(documentValue);renderAll();}
  status('Предпросмотр готов. Войдите владельцем для сохранения и публикации.');
  if(await getVisitorToken(config.firebaseApiKey))await loadOwner();
}catch(error){status(changeAccount?'Вы вошли как посетитель. Для сохранения и публикации войдите подтверждённым аккаунтом '+OWNER+'. Предпросмотр доступен.':'Предпросмотр доступен. Подключение к редактору или вход пока не подтверждены; изменения не сохранены.','error');}
