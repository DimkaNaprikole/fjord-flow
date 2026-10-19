/* Shared information windows. Move existing nodes so their controls keep working. */
(() => {
 'use strict';
 const selector='#newsDialog,#shoppingDialog,#stayGallery,#galleryDialog,#experiencePhotoDialog,#discoveryStoryDialog';
 const labels={
  nb:['Kilder og mer','Planlegg ruten','Overnatting og leiebil','Anmeldelser','Butikker','Google Maps'],
  en:['Sources and more','Plan your route','Stays and car rental','Reviews','Shops','Google Maps'],
  uk:['Джерела та додаткове','Побудувати маршрут','Проживання та оренда авто','Відгуки','Магазини','Google Maps'],
  sv:['Källor och mer','Planera rutten','Boende och hyrbil','Omdömen','Butiker','Google Maps'],
  da:['Kilder og mere','Planlæg ruten','Overnatning og billeje','Anmeldelser','Butikker','Google Maps']
 };
 const words=()=>labels[window.FjordI18n?.language||document.documentElement.lang]||labels.nb;
 function fold(nodes,key){
  nodes=nodes.filter(n=>n?.isConnected&&!n.closest('.ff-info-extra'));
  if(!nodes.length)return;
  const box=document.createElement('details');box.className='ff-info-extra';box.dataset.infoLabel=key;
  const summary=document.createElement('summary');summary.textContent=words()[key];box.append(summary);
  nodes[0].before(box);box.append(...nodes);return box;
 }
 function tidy(dialog){
  dialog.classList.add('ff-information-dialog');
  if(dialog.id==='galleryDialog'){
   fold([dialog.querySelector('.route-planner')],1);
   const info=dialog.querySelector('#destinationDetails');
   if(info){fold([info.querySelector('.stay-links'),info.querySelector('.external-note')],2);fold([info.querySelector('.destination-reviews')],3);}
   fold([dialog.querySelector('#galleryCaption')],0);
  }
  if(dialog.id==='shoppingDialog'){
   const stores=dialog.querySelector('.shopping-stores');
   if(stores&&!stores.closest('.ff-info-extra'))fold([stores.previousElementSibling?.matches('h3')?stores.previousElementSibling:null,stores],4);
   const credits=fold([dialog.querySelector('.shopping-hero figcaption')],0);if(credits)dialog.querySelector('.shopping-dialog-body')?.append(credits);
  }
  if(dialog.id==='stayGallery')fold([...dialog.querySelectorAll('.stay-gallery-meta>.stay-gallery-source')],0);
  if(dialog.id==='experiencePhotoDialog')fold([dialog.querySelector('figcaption')],0);
  fold([...dialog.querySelectorAll(':scope>.google-place-map')],5);
 }
 const pending=new Set();let scheduled=false;
 function queue(dialog){
  if(!dialog?.matches(selector)||!dialog.open)return;
  pending.add(dialog);if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;for(const d of pending){if(d.open)tidy(d);}pending.clear();});
 }
 new MutationObserver(records=>{
  for(const r of records){const node=r.target.nodeType===1?r.target:r.target.parentElement;queue(node?.closest('dialog'));}
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 window.addEventListener('fjordlanguagechange',()=>{
  document.querySelectorAll('.ff-info-extra').forEach(d=>{d.firstElementChild.textContent=words()[Number(d.dataset.infoLabel)];});
 });
 document.querySelectorAll(selector).forEach(queue);
})();
