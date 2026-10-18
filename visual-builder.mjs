import {PAGES,BLOCKS,BUTTONS,SECTIONS,MEDIA_FIELDS} from './site-editor-schema.mjs?v=4';

export function reorderIDs(ids,sourceId,targetId){
 if(!ids.includes(sourceId)||!ids.includes(targetId)||sourceId===targetId)return [...ids];
 const index=ids.indexOf(targetId),order=ids.filter(id=>id!==sourceId);order.splice(index,0,sourceId);return order;
}

// Runs only in the nonce-protected editor iframe. No credentials enter this module.
export function mountVisualBuilder({reply,getDocument}){
 let enabled=false,selected=null,dragged=null;
 const editor=document.createElement('dialog');editor.id='builderTextEditor';editor.setAttribute('aria-label','Редактировать текст');document.body.append(editor);
 const css=document.createElement('style');css.textContent=`
 html[data-builder=true] [data-builder-target]{cursor:pointer!important}
 html[data-builder=true] [data-builder-target]:hover:not(:has([data-builder-target]:hover)){outline:2px dashed #8ce5cd!important;outline-offset:3px}
 html[data-builder=true] [data-builder-selected]{outline:3px solid #f8d87b!important;outline-offset:4px}
 html[data-builder=true] [data-builder-drag]::after{content:' ⠿';font-size:16px;color:#d1f7eb;cursor:grab}
 html[data-builder=true] [data-builder-drop]{outline:3px solid #8ce5cd!important}
 #visualBuilderNotice{position:fixed;left:12px;bottom:12px;z-index:2147483000;max-width:min(500px,calc(100vw - 24px));background:#102f3d;color:#edf6f4;border:1px solid #8ce5cd;padding:10px 14px;border-radius:12px;box-shadow:0 3px 18px #0006;font:12px/1.5 system-ui;pointer-events:none}
 #visualBuilderNotice[hidden]{display:none}
 .builder-section-tools{display:none!important}html[data-builder=true] .builder-section-tools{display:flex!important;gap:6px;align-items:center;position:relative;z-index:30;width:fit-content;max-width:100%;margin:8px 12px;padding:6px;border:1px solid #8ce5cd;border-radius:10px;background:#102f3d;color:#edf6f4;font:12px/1.4 system-ui}
 .builder-section-tools button{background:#255563!important;color:#edf6f4!important;border:1px solid #8bb7b7!important;border-radius:7px!important;padding:7px 10px!important;font:12px/1.4 system-ui!important;min-width:32px;cursor:pointer}.builder-section-tools [draggable]{cursor:grab}.builder-section-tools button:focus-visible{outline:3px solid #f8d87b}
 html[data-builder=true] [data-builder-text]:hover{outline:2px dashed #8ce5cd;outline-offset:3px}
 #builderTextEditor{position:fixed;inset:auto 12px 70px auto;margin:0;max-width:calc(100vw - 24px);width:420px;background:#102f3d;color:#edf6f4;border:1px solid #8ce5cd;border-radius:14px;padding:18px;z-index:2147483001;box-shadow:0 8px 28px #0008;font:14px/1.5 system-ui}
 #builderTextEditor textarea{display:block;box-sizing:border-box;width:100%;min-height:130px;padding:10px;background:#0c2934;color:#edf6f4;border:1px solid #8bb7b7;border-radius:8px;font:16px/1.5 system-ui;resize:vertical}#builderTextEditor button{background:#255563;color:#edf6f4;border:1px solid #8bb7b7;border-radius:8px;padding:8px 12px;margin:12px 6px 0 0;font:14px system-ui}#builderTextEditor p{margin:0 0 12px}
 `;document.head.append(css);
 const notice=document.createElement('div');notice.id='visualBuilderNotice';notice.hidden=true;notice.setAttribute('role','status');document.body.append(notice);
 const mediaTargets=()=>MEDIA_FIELDS.map(item=>({...item,group:'media',root:item.selector||({header:'body > header',hero:'.hero',waterfall:'.waterfall-story',cafes:'#cafeStops'})[item.id]})).filter(item=>item.root);
 const targets=()=>[...BUTTONS.map(item=>({...item,group:'buttons',root:item.selector})),...mediaTargets(),...BLOCKS.map(item=>({...item,group:'blocks'})),...PAGES.map(item=>({...item,group:'pages'}))];
 const sectionOrder=()=>[...getDocument().sectionOrder,...SECTIONS.map(s=>s.id).filter(id=>!getDocument().sectionOrder.includes(id))];
 function sectionMove(id,step){const order=sectionOrder(),i=order.indexOf(id),j=i+step;if(i<0||j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];reply({type:'fjord-editor:reorder',group:'sectionOrder',order});}
 function editText(item,group,field,target){
  selected?.removeAttribute('data-builder-selected');selected=target;selected.dataset.builderSelected='true';editor.replaceChildren();
  const label=document.createElement('label');label.textContent=(field==='title'?'Заголовок':'Описание')+' · '+(document.documentElement.lang||'nb');
  const input=document.createElement('textarea');input.setAttribute('aria-label','Текст раздела');input.maxLength=field==='title'?240:1800;input.value=(target.innerText||target.textContent).trim();label.append(input);editor.append(label);
  const hint=document.createElement('p');hint.textContent='Изменение сначала попадёт в предпросмотр. Для сайта сохраните и опубликуйте.';editor.append(hint);
  for(const [name,save]of [['Применить текст',true],['Отмена',false]]){const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=()=>{if(save)reply({type:'fjord-editor:text',group,id:item.id,field,value:input.value});editor.close();};editor.append(button);}
  if(!editor.open)editor.show();input.focus();
 }
 const navControls=()=>[...document.querySelectorAll('body > header > nav > a,body > header > nav > button')];
 const navID=node=>PAGES.find(page=>node.getAttribute('href')===page.root)?.id||'home';
 const headerID=node=>node.id==='headerSignIn'?'signIn':node.id==='headerRegister'?'register':null;
 function refresh(){
  for(const [group,items]of [['pages',PAGES],['blocks',BLOCKS]])for(const item of items)for(const field of ['title','intro']){const n=item[field]&&document.querySelector(item[field]);if(n)n.dataset.builderText=group+':'+item.id+':'+field;}
  for(const item of SECTIONS){const root=document.querySelector(item.root);if(!root)continue;root.dataset.builderSection=item.id;let tools=[...root.children].find(n=>n.classList.contains('builder-section-tools'));if(!tools){tools=document.createElement('div');tools.className='builder-section-tools';tools.dataset.i18nIgnore='';for(const [text,step]of [['⠿ '+item.name,0],['↑',-1],['↓',1]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',step?(step<0?'Выше: ':'Ниже: ')+item.name:'Перетащить раздел: '+item.name);if(step)b.onclick=()=>sectionMove(item.id,step);else{b.dataset.builderSectionHandle=item.id;b.draggable=true;b.onclick=()=>reply({type:'fjord-editor:select',group:'sections',id:item.id});}tools.append(b);}root.prepend(tools);}}
  for(const target of targets()){const node=document.querySelector(target.root);if(node&&node.dataset.builderTarget!==target.group+':'+target.id)node.dataset.builderTarget=target.group+':'+target.id;}
  for(const node of [...navControls(),...document.querySelectorAll('#headerSignIn,#headerRegister')]){node.dataset.builderDrag='true';if(node.draggable!==enabled)node.draggable=enabled;}
 }
 function selection(node){
  for(const item of targets()){const target=document.querySelector(item.root);if(target&&(target===node||target.contains(node)))return {item,target};}
  return null;
 }
 function selectTarget(found){
  selected?.removeAttribute('data-builder-selected');selected=found.target;selected.dataset.builderSelected='true';
  notice.textContent=found.item.name+' · Настройки открыты слева. Значок ⠿ — перетаскивание кнопки; Shift + ← / → — с клавиатуры.';
  reply({type:'fjord-editor:select',group:found.item.group,id:found.item.id,label:found.target.textContent.trim().slice(0,240)});
 }
 function dragInfo(node,drop=false){const section=node.closest(drop?'[data-builder-section]':'[data-builder-section-handle]');if(section)return {control:section,group:'sectionOrder',id:section.dataset.builderSectionHandle||section.dataset.builderSection};const control=node.closest('[data-builder-drag]');if(!control)return null;const header=headerID(control);return {control,group:header?'headerButtonOrder':'navOrder',id:header||navID(control)};}
 function move(source,target){
  if(!source||!target||source.group!==target.group||source.id===target.id)return;
  const base=source.group==='sectionOrder'?sectionOrder():source.group==='navOrder'?navControls().map(navID):[...document.querySelectorAll('#headerSignIn,#headerRegister')].sort((a,b)=>Number(a.style.order||0)-Number(b.style.order||0)).map(headerID);
  const order=reorderIDs(base,source.id,target.id);
  reply({type:'fjord-editor:reorder',group:source.group,order});notice.textContent='Порядок изменён в предпросмотре. Сохраните черновик, затем опубликуйте.';
 }
 window.addEventListener('click',event=>{if(!enabled||editor.contains(event.target)||event.target.closest('.builder-section-tools'))return;
  const text=event.target.closest('[data-builder-text]');if(text){const[group,id,field]=text.dataset.builderText.split(':'),item=(group==='pages'?PAGES:BLOCKS).find(i=>i.id===id);event.preventDefault();event.stopImmediatePropagation();editText(item,group,field,text);return;}
  const place=event.target.closest('[data-cms-place-id]');if(place&&event.target.closest('img')){event.preventDefault();event.stopImmediatePropagation();reply({type:'fjord-editor:place',id:place.dataset.cmsPlaceId});return;}
  const found=selection(event.target);if(!found)return;event.preventDefault();event.stopImmediatePropagation();selectTarget(found);},true);
 document.addEventListener('dragstart',event=>{if(!enabled)return;dragged=dragInfo(event.target);if(!dragged)return;event.stopPropagation();event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragged.id);},true);
 document.addEventListener('dragover',event=>{if(!enabled||!dragged)return;const target=dragInfo(event.target,dragged.group==='sectionOrder');if(!target||target.group!==dragged.group)return;event.preventDefault();event.dataTransfer.dropEffect='move';target.control.dataset.builderDrop='true';if(event.clientY<70)window.scrollBy(0,-18);else if(event.clientY>innerHeight-70)window.scrollBy(0,18);},true);
 document.addEventListener('dragleave',event=>event.target.closest?.('[data-builder-drop]')?.removeAttribute('data-builder-drop'),true);
 document.addEventListener('drop',event=>{if(!enabled||!dragged)return;event.preventDefault();event.stopImmediatePropagation();move(dragged,dragInfo(event.target,dragged.group==='sectionOrder'));dragged=null;document.querySelectorAll('[data-builder-drop]').forEach(node=>node.removeAttribute('data-builder-drop'));},true);
 document.addEventListener('dragend',()=>{dragged=null;document.querySelectorAll('[data-builder-drop]').forEach(node=>node.removeAttribute('data-builder-drop'));},true);
 window.addEventListener('keydown',event=>{if(!enabled)return;if(event.key==='Escape'){selected?.removeAttribute('data-builder-selected');selected=null;notice.textContent='Конструктор: нажмите на кнопку, заголовок или фото. Перетаскивайте кнопки за ⠿.';return;}if(!event.shiftKey||!['ArrowLeft','ArrowRight'].includes(event.key))return;const source=dragInfo(event.target);if(!source)return;event.preventDefault();event.stopImmediatePropagation();const peers=source.group==='navOrder'?navControls():[...document.querySelectorAll('#headerSignIn,#headerRegister')].sort((a,b)=>Number(a.style.order||0)-Number(b.style.order||0)),i=peers.indexOf(source.control),j=i+(event.key==='ArrowLeft'?-1:1);if(j<0||j>=peers.length)return;const target=dragInfo(peers[j]);if(j>i){const base=source.group==='navOrder'?peers.map(navID):peers.map(headerID);[base[i],base[j]]=[base[j],base[i]];reply({type:'fjord-editor:reorder',group:source.group,order:base});}else move(source,target);},true);
 return {refresh,setEnabled(value){enabled=value;document.documentElement.dataset.builder=String(value);notice.hidden=!value;notice.textContent='Конструктор: нажмите на кнопку, заголовок или фото. Перетаскивайте кнопки за ⠿. Для обычного просмотра выключите конструктор.';if(!value){editor.close();selected?.removeAttribute('data-builder-selected');selected=null;}refresh();}};
}
