/* Static route contacts. */
(() => {
 'use strict';
 const entries=[
  ['hardanger','Kinsarvik Camping','https://www.kinsarvikcamping.no/overnatting/heng'],
  ['fjord','FjordSauna','https://www.fjordsauna.com/contact'],
  ['sunnmore','Loen Skylift','https://www.loenskylift.no/kome-hit'],
  ['family','Kistefos','https://www.kistefosmuseum.no/besok-oss'],
  ['osterdalen','Røros','https://www.google.com/maps/search/?api=1&query=R%C3%B8ros%2C%20Norway']
 ];
 const words={en:['Contact','Pause the eagle','Resume the eagle','Explore route contacts','Static view','Map'],nb:['Kontakt','Sett ørnen på pause','La ørnen fly videre','Utforsk kontaktene langs rutene','Statisk visning','Kart'],uk:['Контакти','Призупинити політ орла','Продовжити політ орла','Контакти вздовж маршрутів','Без анімації','Карта'],sv:['Kontakt','Pausa örnen','Låt örnen flyga vidare','Utforska kontakter längs rutterna','Stillbildsläge','Karta'],da:['Kontakt','Sæt ørnen på pause','Lad ørnen flyve videre','Udforsk kontakter langs ruterne','Statisk visning','Kort']};
 const lang=()=>words[window.FjordI18n?.language]?window.FjordI18n.language:words[document.documentElement.lang]?document.documentElement.lang:'nb';

 let root,layer,resize,observer,pending=0;
 const links=new Map();
 function layout(){
  pending=0;if(!root?.isConnected)return;
  const bounds=root.getBoundingClientRect(),w=words[lang()];
  layer.setAttribute('aria-label',w[3]);
  for(const [key,name,href] of entries){
   const header=root.querySelector(`[data-roadtrip="${key}"] .route-scenery`);
   if(!header)continue;
   let link=links.get(key);
   if(!link){
    link=document.createElement('a');link.className='eagle-contact';
    link.href=href;link.target='_blank';link.rel='noopener noreferrer';
    link.dataset.routeContact=key;
    for(const [tag,cls,text] of [['span','eagle-contact-label',''],['strong','',name],['span','eagle-contact-arrow','↗']]){
     const child=document.createElement(tag);child.className=cls;child.textContent=text;link.append(child);
    }
    links.set(key,link);layer.append(link);resize.observe(header);
   }
   link.querySelector('.eagle-contact-label').textContent=key==='osterdalen'?w[5]:w[0];
   const rect=header.getBoundingClientRect();
   link.style.left=(rect.left-bounds.left-root.clientLeft+12)+'px';
   link.style.top=(rect.top-bounds.top-root.clientTop+12)+'px';
   link.style.maxWidth=Math.max(110,rect.width-24)+'px';
  }
 }
 function schedule(){if(!pending)pending=requestAnimationFrame(layout);}
 function mount(){
  const section=document.querySelector('.roadtrip-collection');if(!section||section===root)return;
  resize?.disconnect();observer?.disconnect();links.clear();root=section;
  root.classList.add('has-route-contacts');
  layer=document.createElement('nav');layer.className='eagle-contact-layer';layer.dataset.i18nIgnore='';root.append(layer);
  resize=new ResizeObserver(schedule);resize.observe(root);
  observer=new MutationObserver(records=>{if(records.some(r=>!layer.contains(r.target)))schedule();});
  observer.observe(root,{childList:true,subtree:true});schedule();
 }
 new MutationObserver(()=>{if(!root?.isConnected)mount();}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('resize',schedule);window.addEventListener('fjordlanguagechange',schedule);mount();
})();
