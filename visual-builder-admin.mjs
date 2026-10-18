import {renderElementInspector} from './element-inspector-admin.mjs?v=1';
import {PAGES,BLOCKS,BUTTONS,SECTIONS,MEDIA_FIELDS,BUTTON_STYLE_FIELDS,LANGUAGES,safeButtonHref,ELEMENTS,elementDescriptor} from './site-editor-schema.mjs?v=5';

export function mountVisualBuilderAdmin({frame,nonce,getDocument,changed,selectContent,selectMedia,selectPlace,onOrder,language,loadAssets}){
 let enabled=false,selected=null,breakpoint="desktop",inspector=null;
 const toolbar=document.querySelector('.preview-toolbar > div'),toggle=document.createElement('button');toggle.type='button';toggle.id='visualBuilderToggle';toggle.textContent='Конструктор';toggle.setAttribute('aria-pressed','false');toolbar.prepend(toggle);
 const panel=document.createElement('section');panel.id='visualBuilderPanel';panel.className='editor-panel visual-builder-panel';panel.hidden=true;document.querySelector('.editor-tabs').after(panel);
 const controls=document.querySelector('.editor-controls');
 document.querySelector('.editor-tabs').addEventListener('click',()=>{delete controls.dataset.builderSelection;panel.hidden=true;selected=null;});
 function message(){frame.contentWindow.postMessage({type:'fjord-editor:builder',nonce,enabled,breakpoint},location.origin);}
 toggle.onclick=()=>{enabled=!enabled;toggle.setAttribute('aria-pressed',String(enabled));panel.hidden=!enabled;if(!enabled)delete controls.dataset.builderSelection;else if(selected)controls.dataset.builderSelection=selected.group;if(enabled&&!selected){panel.replaceChildren(node('h2','Конструктор сайта'),node('p','Нажмите текст для редактирования. Нажмите фото для замены. Разделы перетаскивайте за ⠿ или переставляйте стрелками ↑ / ↓.','hint'));sectionList();elementPicker();picker();}message();};
 const devices=document.createElement('div');devices.className='builder-devices';const tablet=document.createElement('button');tablet.type='button';tablet.id='tablet';tablet.textContent='Планшет';document.getElementById('mobile').before(tablet);
 const fit=document.createElement('input');fit.type='checkbox';fit.checked=true;const fitLabel=document.createElement('label');fitLabel.textContent='Вместить';fitLabel.append(fit);devices.append(fitLabel);const stage=frame.parentElement;function fitFrame(){const width=Number(widthControl.value)||1280;frame.style.zoom=fit.checked?String(Math.min(1,Math.max(320,stage.clientWidth-16)/width)):'1';stage.style.overflowX=fit.checked?'hidden':'auto';}fit.onchange=fitFrame;new ResizeObserver(fitFrame).observe(stage);
 const widthControl=document.createElement('input');widthControl.type='range';widthControl.min='320';widthControl.max='1440';widthControl.value='1280';widthControl.setAttribute('aria-label','Ширина адаптивного предпросмотра');const widthLabel=document.createElement('span');devices.append(widthControl,widthLabel);document.querySelector('.preview-toolbar').after(devices);
 function resize(width,mode){breakpoint=mode;frame.classList.remove('mobile');frame.style.width=width+'px';frame.style.maxWidth='none';frame.parentElement.style.overflowX='auto';widthControl.value=String(width);fitFrame();widthLabel.textContent=width+' px · '+({desktop:'Компьютер',tablet:'Планшет',mobile:'Телефон'})[mode];for(const id of ['desktop','tablet','mobile'])document.getElementById(id).setAttribute('aria-pressed',String(id===mode));message();if(selected?.group==='elements')render(selected);}
 document.getElementById('desktop').onclick=()=>resize(1280,'desktop');tablet.onclick=()=>resize(820,'tablet');document.getElementById('mobile').onclick=()=>resize(390,'mobile');widthControl.oninput=()=>{const width=Number(widthControl.value);resize(width,width<=680?'mobile':width<=1000?'tablet':'desktop');};resize(1280,'desktop');
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 function field(title,input){const label=node('label',title);label.append(input);panel.append(label);return input;}
 function sectionList(){
  const details=node('details'),summary=node('summary','Порядок разделов · перетаскивание ↑ ↓');details.append(summary);const list=node('ol',undefined,'builder-section-list');details.append(list);panel.append(details);
  const ids=[...getDocument().sectionOrder,...SECTIONS.map(s=>s.id).filter(id=>!getDocument().sectionOrder.includes(id))];let dragged=null;
  const change=order=>{getDocument().sectionOrder=order;changed();render(selected||{group:'sections',id:order[0],name:'Разделы главной'});panel.querySelector('details').open=true;};
  ids.forEach((id,i)=>{const item=SECTIONS.find(s=>s.id===id),row=node('li');row.draggable=true;row.dataset.sectionId=id;row.tabIndex=0;row.setAttribute('aria-label','Раздел: '+item.name);const name=node('span','⠿ '+item.name);row.append(name);
   for(const[step,label]of [[-1,'↑'],[1,'↓']]){const b=node('button',label);b.type='button';b.setAttribute('aria-label',(step<0?'Выше: ':'Ниже: ')+item.name);b.disabled=i+step<0||i+step>=ids.length;b.onclick=()=>{const order=[...ids];[order[i],order[i+step]]=[order[i+step],order[i]];change(order);};row.append(b);}
   row.ondragstart=e=>{dragged=id;e.dataTransfer.setData('text/plain',id);e.dataTransfer.effectAllowed='move';};row.ondragover=e=>{if(dragged)e.preventDefault();};row.ondrop=e=>{e.preventDefault();if(!dragged||dragged===id)return;const order=ids.filter(v=>v!==dragged);order.splice(ids.indexOf(id),0,dragged);change(order);dragged=null;};
   row.onkeydown=e=>{if(!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const j=i+(e.key==='ArrowUp'?-1:1);if(j<0||j>=ids.length)return;const order=[...ids];[order[i],order[j]]=[order[j],order[i]];change(order);panel.querySelector('[data-section-id="'+id+'"]').focus();};list.append(row);
  });
  const reset=node('button','Вернуть исходный порядок разделов');reset.type='button';reset.onclick=()=>change([]);details.append(reset);
 }
 function elementPicker(){const select=node('select');select.append(new Option('Выберите элемент…',''));for(const item of ELEMENTS)select.append(new Option(item.name,item.id));if(selected?.id?.startsWith('place_'))select.append(new Option(selected.name,selected.id));select.value=selected?.group==='elements'?selected.id:'';field('Элемент сайта',select);select.onchange=()=>{const item=elementDescriptor(select.value);if(item){render({group:'elements',id:item.id,name:item.name});frame.contentWindow.postMessage({type:'fjord-editor:focus',nonce,id:item.id},location.origin);}};}
 function picker(){const select=node('select'),empty=node('option','Нажмите элемент справа или выберите кнопку');empty.value='';select.append(empty);for(const item of BUTTONS){const option=node('option',item.name);option.value=item.id;select.append(option);}select.value=selected?.group==='buttons'?selected.id:'';field('Выбрать кнопку',select);select.onchange=()=>{const button=BUTTONS.find(item=>item.id===select.value);if(button)render({group:'buttons',id:button.id,name:button.name});};}
 function render(selection){
  selected=selection;panel.hidden=!enabled;controls.dataset.builderSelection=selection.group;panel.replaceChildren(node('h2','Выбрано: '+selection.name));inspector=null;
  if(selection.group==='elements'){elementPicker();const host=node('div',undefined,'element-inspector');panel.append(host);const descriptor=elementDescriptor(selection.id);inspector=renderElementInspector({host,descriptor,getDocument,changed,language,setLanguage:lang=>{const source=document.getElementById('language');source.value=lang;source.dispatchEvent(new Event('change'));},loadAssets,breakpoint});return;}
  sectionList();picker();
  if(selection.group!=='buttons'){panel.append(node('p','Настройки этого элемента открыты ниже. Изменения пока видны только в предпросмотре.','hint'));return;}
  const button=BUTTONS.find(item=>item.id===selection.id),value=getDocument().buttons[selection.id]||{},lang=language();
  const languageSelect=node('select');for(const id of LANGUAGES){const option=node('option',({nb:'Норвежский',en:'English',uk:'Українська',sv:'Svenska',da:'Dansk'})[id]);option.value=id;languageSelect.append(option);}languageSelect.value=lang;field('Язык надписи',languageSelect);languageSelect.onchange=()=>{const source=document.getElementById('language');source.value=languageSelect.value;source.dispatchEvent(new Event('change'));};
  panel.append(node('p','Действие: '+button.action+'.','hint'));
  const labelInput=node('input');labelInput.maxLength=120;labelInput.value=value.label?.[lang]||'';labelInput.placeholder=selection.label||button.name;field('Надпись · '+lang,labelInput);
  const record=()=>getDocument().buttons[selection.id]??={};
  labelInput.oninput=()=>{const item=record();item.label??={};if(labelInput.value.trim())item.label[lang]=labelInput.value;else delete item.label[lang];changed();};
  for(const [key,meta]of Object.entries(BUTTON_STYLE_FIELDS)){const input=node('input');input.type='number';input.min=meta.min;input.max=meta.max;input.placeholder='Исходное оформление';input.value=value[key]??'';field(meta.name,input);input.oninput=()=>{if(input.value===''){delete record()[key];changed();}else if(input.checkValidity()){record()[key]=Number(input.value);changed();}};}
  const contrast=node('p',undefined,'hint');
  const checkContrast=()=>{const theme=getDocument().theme,item=getDocument().buttons[selection.id]||{},lum=hex=>{const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;},a=lum(item.background||theme.action||'#255563'),b=lum(item.color||theme.ink||'#edf6f4'),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);contrast.textContent=ratio<4.5?'Низкий контраст: сделайте фон темнее или текст светлее.':'Контраст текста и кнопки: '+ratio.toFixed(1)+':1';};
  for(const [key,title]of [['background','Фон кнопки'],['color','Цвет текста']]){const input=node('input');input.type='color';input.value=value[key]||(key==='color'?'#edf6f4':'#255563');field(title,input);input.oninput=()=>{record()[key]=input.value;checkContrast();changed();};}panel.append(contrast);checkContrast();
  if(button.link){const input=node('input');input.type='text';input.maxLength=1000;input.placeholder='#norwayCatalogue или https://…';input.value=value.href||'';field('Куда ведёт кнопка',input);input.oninput=()=>{input.setCustomValidity(input.value&&!safeButtonHref(input.value)?'Используйте существующий раздел #… или ссылку HTTPS.':'');if(!input.checkValidity())return;if(input.value)record().href=input.value;else delete record().href;changed();};}
  else panel.append(node('p','Вход, регистрация и переключение вкладок сохраняют своё действие. Здесь меняется только оформление и надпись.','hint'));
  const actions=node('div',undefined,'catalogue-actions'),reset=node('button','Сбросить настройки кнопки');reset.type='button';reset.onclick=()=>{delete getDocument().buttons[selection.id];render(selection);changed();};actions.append(reset);
  const orderGroup=selection.id.startsWith('nav_')?'navOrder':['signIn','register'].includes(selection.id)?'headerButtonOrder':null;
  if(orderGroup){const allowed=orderGroup==='navOrder'?PAGES.map(p=>p.id):['signIn','register'],current=getDocument()[orderGroup],ids=[...current,...allowed.filter(id=>!current.includes(id))],id=selection.id.startsWith('nav_')?selection.id.slice(4):selection.id,index=ids.indexOf(id);for(const [step,label]of [[-1,'← Левее'],[1,'Правее →']]){const move=node('button',label);move.type='button';move.disabled=index+step<0||index+step>=ids.length;move.onclick=()=>{const order=[...ids];[order[index],order[index+step]]=[order[index+step],order[index]];getDocument()[orderGroup]=order;onOrder();render(selection);changed();};actions.append(move);}panel.append(node('p','Порядок: перетащите за ⠿ в предпросмотре или используйте «Левее / Правее». Кнопки сохраняют адаптивную сетку на телефоне.','hint'));}
  if(selection.id.startsWith('nav_')){const edit=node('button','Тексты и видимость раздела');edit.type='button';edit.onclick=()=>selectContent('pages',selection.id.slice(4));actions.append(edit);}
  panel.append(actions,node('p','Пустое поле возвращает исходное значение. Для сохранения нажмите «Сохранить черновик», затем «Опубликовать».','hint'));
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.nonce!==nonce)return;
  const data=event.data;if(data.type==='fjord-editor:ready'){message();return;}if(!enabled)return;
  if(data.type==='fjord-editor:text'){
   const item=(data.group==='pages'?PAGES:data.group==='blocks'?BLOCKS:[]).find(i=>i.id===data.id);if(!item||!['title','intro'].includes(data.field)||!item[data.field]||typeof data.value!=='string'||data.value.length>(data.field==='title'?240:1800))return;
   const record=getDocument()[data.group][data.id]??={};record[data.field]??={};if(data.value.trim())record[data.field][language()]=data.value;else delete record[data.field][language()];selectContent(data.group,data.id,data.field);changed();
  }
  if(data.type==='fjord-editor:place'&&typeof data.id==='string'&&data.id.length<150)selectPlace?.(data.id);
  if(data.type==='fjord-editor:move'){
   if(!elementDescriptor(data.id)||!['desktop','tablet','mobile'].includes(data.breakpoint)||!Number.isFinite(data.x)||!Number.isFinite(data.y)||Math.abs(data.x)>160||Math.abs(data.y)>160)return;
   const base=getDocument().elements[data.id]??={};const target=data.breakpoint==='desktop'?base:(base[data.breakpoint]??={});target.offsetX=Math.round(data.x);target.offsetY=Math.round(data.y);changed();inspector?.sync?.();return;
  }
  if(data.type==='fjord-editor:select'){
   if(data.group==='elements'){const item=elementDescriptor(data.id);if(item)render({group:'elements',id:item.id,name:item.name});return;}
   const list=data.group==='buttons'?BUTTONS:data.group==='pages'?PAGES:data.group==='blocks'?BLOCKS:data.group==='sections'?SECTIONS:[],item=list.find(item=>item.id===data.id);
   if(item){render({group:data.group,id:item.id,name:item.name,label:typeof data.label==='string'?data.label.slice(0,240):''});if(['pages','blocks'].includes(data.group))selectContent(data.group,item.id);if(data.group==='sections')panel.querySelector('details').open=true;}
   else if(data.group==='media'&&MEDIA_FIELDS.some(m=>m.id===data.id)){render({group:'media',id:data.id,name:'Фото оформления'});selectMedia(data.id);}
  }
  if(data.type==='fjord-editor:reorder'){
   const allowed=data.group==='navOrder'?PAGES.map(p=>p.id):data.group==='headerButtonOrder'?['signIn','register']:data.group==='sectionOrder'?SECTIONS.map(s=>s.id):null;
   if(!allowed||!Array.isArray(data.order)||data.order.length!==allowed.length||new Set(data.order).size!==allowed.length||data.order.some(id=>!allowed.includes(id)))return;
   getDocument()[data.group]=[...data.order];onOrder();if(data.group==='sectionOrder'&&!panel.hidden){const open=panel.querySelector('details')?.open;render(selected||{group:'sections',id:data.order[0],name:'Разделы главной'});panel.querySelector('details').open=!!open;}changed();
  }
 });
 return {refresh(){if(selected&&['buttons','elements'].includes(selected.group))render(selected);}};
}
