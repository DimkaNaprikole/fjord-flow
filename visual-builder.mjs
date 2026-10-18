import {PAGES,BLOCKS,BUTTONS} from './site-editor-schema.mjs?v=3';

export function reorderIDs(ids,sourceId,targetId){
 if(!ids.includes(sourceId)||!ids.includes(targetId)||sourceId===targetId)return [...ids];
 const index=ids.indexOf(targetId),order=ids.filter(id=>id!==sourceId);order.splice(index,0,sourceId);return order;
}

// Runs only in the nonce-protected editor iframe. No credentials enter this module.
export function mountVisualBuilder({reply,getDocument}){
 let enabled=false,selected=null,dragged=null;
 const css=document.createElement('style');css.textContent=`
 html[data-builder=true] [data-builder-target]{cursor:pointer!important}
 html[data-builder=true] [data-builder-target]:hover:not(:has([data-builder-target]:hover)){outline:2px dashed #8ce5cd!important;outline-offset:3px}
 html[data-builder=true] [data-builder-selected]{outline:3px solid #f8d87b!important;outline-offset:4px}
 html[data-builder=true] [data-builder-drag]::after{content:' ⠿';font-size:16px;color:#d1f7eb;cursor:grab}
 html[data-builder=true] [data-builder-drop]{outline:3px solid #8ce5cd!important}
 #visualBuilderNotice{position:fixed;left:12px;bottom:12px;z-index:2147483000;max-width:min(500px,calc(100vw - 24px));background:#102f3d;color:#edf6f4;border:1px solid #8ce5cd;padding:10px 14px;border-radius:12px;box-shadow:0 3px 18px #0006;font:12px/1.5 system-ui;pointer-events:none}
 #visualBuilderNotice[hidden]{display:none}
 `;document.head.append(css);
 const notice=document.createElement('div');notice.id='visualBuilderNotice';notice.hidden=true;notice.setAttribute('role','status');document.body.append(notice);
 const targets=()=>[...BUTTONS.map(item=>({...item,group:'buttons',root:item.selector})),...[{id:'header',name:'Фон шапки',root:'body > header'},{id:'waterfall',name:'Фото водопада',root:'.waterfall-story > img'}].map(item=>({...item,group:'media'})),...BLOCKS.map(item=>({...item,group:'blocks'})),...PAGES.map(item=>({...item,group:'pages'}))];
 const navControls=()=>[...document.querySelectorAll('body > header > nav > a,body > header > nav > button')];
 const navID=node=>PAGES.find(page=>node.getAttribute('href')===page.root)?.id||'home';
 const headerID=node=>node.id==='headerSignIn'?'signIn':node.id==='headerRegister'?'register':null;
 function refresh(){
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
 function dragInfo(node){const control=node.closest('[data-builder-drag]');if(!control)return null;const header=headerID(control);return {control,group:header?'headerButtonOrder':'navOrder',id:header||navID(control)};}
 function move(source,target){
  if(!source||!target||source.group!==target.group||source.id===target.id)return;
  const base=source.group==='navOrder'?navControls().map(navID):[...document.querySelectorAll('#headerSignIn,#headerRegister')].sort((a,b)=>Number(a.style.order||0)-Number(b.style.order||0)).map(headerID);
  const order=reorderIDs(base,source.id,target.id);
  reply({type:'fjord-editor:reorder',group:source.group,order});notice.textContent='Порядок изменён в предпросмотре. Сохраните черновик, затем опубликуйте.';
 }
 window.addEventListener('click',event=>{if(!enabled)return;const found=selection(event.target);if(!found)return;event.preventDefault();event.stopImmediatePropagation();selectTarget(found);},true);
 document.addEventListener('dragstart',event=>{if(!enabled)return;dragged=dragInfo(event.target);if(!dragged)return;event.stopPropagation();event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragged.id);},true);
 document.addEventListener('dragover',event=>{if(!enabled||!dragged)return;const target=dragInfo(event.target);if(!target||target.group!==dragged.group)return;event.preventDefault();event.dataTransfer.dropEffect='move';target.control.dataset.builderDrop='true';},true);
 document.addEventListener('dragleave',event=>event.target.closest?.('[data-builder-drop]')?.removeAttribute('data-builder-drop'),true);
 document.addEventListener('drop',event=>{if(!enabled||!dragged)return;event.preventDefault();event.stopImmediatePropagation();move(dragged,dragInfo(event.target));dragged=null;document.querySelectorAll('[data-builder-drop]').forEach(node=>node.removeAttribute('data-builder-drop'));},true);
 document.addEventListener('dragend',()=>{dragged=null;document.querySelectorAll('[data-builder-drop]').forEach(node=>node.removeAttribute('data-builder-drop'));},true);
 window.addEventListener('keydown',event=>{if(!enabled)return;if(event.key==='Escape'){selected?.removeAttribute('data-builder-selected');selected=null;notice.textContent='Конструктор: нажмите на кнопку, заголовок или фото. Перетаскивайте кнопки за ⠿.';return;}if(!event.shiftKey||!['ArrowLeft','ArrowRight'].includes(event.key))return;const source=dragInfo(event.target);if(!source)return;event.preventDefault();event.stopImmediatePropagation();const peers=source.group==='navOrder'?navControls():[...document.querySelectorAll('#headerSignIn,#headerRegister')].sort((a,b)=>Number(a.style.order||0)-Number(b.style.order||0)),i=peers.indexOf(source.control),j=i+(event.key==='ArrowLeft'?-1:1);if(j<0||j>=peers.length)return;const target=dragInfo(peers[j]);if(j>i){const base=source.group==='navOrder'?peers.map(navID):peers.map(headerID);[base[i],base[j]]=[base[j],base[i]];reply({type:'fjord-editor:reorder',group:source.group,order:base});}else move(source,target);},true);
 return {refresh,setEnabled(value){enabled=value;document.documentElement.dataset.builder=String(value);notice.hidden=!value;notice.textContent='Конструктор: нажмите на кнопку, заголовок или фото. Перетаскивайте кнопки за ⠿. Для обычного просмотра выключите конструктор.';if(!value){selected?.removeAttribute('data-builder-selected');selected=null;}refresh();}};
}
