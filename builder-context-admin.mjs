import {renderElementInspector} from './element-inspector-admin.mjs?v=3';
import {elementDescriptor} from './site-editor-schema.mjs?v=7';

export function contextActions(item){
 const actions=[];
 if(item?.field||item?.kind==='button')actions.push(['content','Изменить текст / надпись','content','Текст и надпись']);
 if(item?.kind==='photo')actions.push(['photo','Заменить фото / кадрирование','content','Фотография / фоновое изображение']);
 if(item?.group==='catalogue')actions.push(['place','Данные места, часы и галерея']);
 if(item){actions.push(['font','Шрифт и цвет текста','style','Оформление текста'],['border','Границы, рамки и углы','style','Рамка и углы'],['background','Фон и прозрачность','style','Фон и прозрачность'],['layout','Размеры, отступы и положение','advanced','Положение и размеры'],['all','Все настройки объекта','style']);}
 return actions;
}

export function mountBuilderContext({frame,getDocument,changed,language,setLanguage,loadAssets,selectPlace,getBreakpoint}){
 const popup=document.createElement('dialog');popup.id='builderContextPopup';popup.setAttribute('aria-label','Настройки объекта');document.body.append(popup);
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const close=()=>{if(popup.open)popup.close();};
 popup.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
 document.addEventListener('pointerdown',e=>{if(popup.open&&!popup.contains(e.target))close();});
 function open(data){
  const item=elementDescriptor(data.id);popup.replaceChildren();
  const top=node('div'),title=node('strong',item?.name||'Этот объект'),dismiss=node('button','×');top.className='builder-context-top';dismiss.type='button';dismiss.setAttribute('aria-label','Закрыть настройки объекта');dismiss.onclick=close;top.append(title,dismiss);popup.append(top);
  const host=node('div');popup.append(host);
  if(!item){host.append(node('p','Для этого служебного элемента нет отдельного редактора. Нажмите правой кнопкой на текст, фотографию, кнопку или фон раздела.'));}
  else {
   const menu=node('div');menu.setAttribute('role','menu');menu.setAttribute('aria-label','Действия с объектом');host.append(menu);
   menu.onkeydown=e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const items=[...menu.querySelectorAll('button')],index=items.indexOf(document.activeElement);e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();};
   for(const [id,label,tab,section]of contextActions(item)){
    const button=node('button',label);button.type='button';button.setAttribute('role','menuitem');button.onclick=()=>{
     if(id==='place'){close();selectPlace?.(item.itemId);return;}
     menu.remove();const back=node('button','← Действия с объектом');back.type='button';back.onclick=()=>open(data);host.append(back);
     const inspector=node('div');inspector.className='element-inspector';host.append(inspector);
     renderElementInspector({host:inspector,descriptor:item,getDocument,changed,language,setLanguage,loadAssets,breakpoint:getBreakpoint(),selection:data,onEditPlace:id=>{close();selectPlace?.(id);}});
     inspector.querySelector('[data-inspector-tab="'+tab+'"]').click();
     if(section){const details=[...inspector.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent===section);if(details){details.open=true;details.scrollIntoView({block:'nearest'});}}
    };menu.append(button);
   }
   const hint=node('p','Изменения сначала видны в предпросмотре. Затем сохраните черновик и опубликуйте.');hint.className='hint';host.append(hint);
  }
  const rect=frame.getBoundingClientRect(),scale=rect.width/(parseFloat(frame.style.width)||frame.clientWidth||1),width=Math.min(380,innerWidth-24);
  popup.style.width=width+'px';popup.style.left=Math.max(8,Math.min(innerWidth-width-16,rect.left+(Number(data.x)||0)*scale))+'px';popup.style.top=Math.max(8,Math.min(innerHeight-Math.min(600,innerHeight-24)-12,rect.top+(Number(data.y)||0)*scale))+'px';
  if(!popup.open)popup.show();dismiss.focus();
 }
 return {open,close};
}
