/* Catalogue photographs above the map; manual category selection stops category rotation. */
(() => {
 'use strict';
 const order=['cafe','cabin','sauna','rest','equipment','shopping'];
 function imageURL(record){
  const value=typeof record?.image==='object'?record.image?.url:record?.image;
  if(typeof value!=='string')return record?.category==='equipment'?'./images/bua-gear-illustration.webp':null;
  if(/^(?:\.\/)?images\/[\w./% -]+$/i.test(value)&&!value.includes('..'))return value;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
 }
 function createCycle(getRows,initial='cafe'){
  let category=initial,manual=false,turns=0;const positions={};
  const records=key=>getRows().filter(p=>p.category===key&&imageURL(p));
  const available=()=>order.filter(key=>records(key).length);
  return {
   get category(){return category;},get manual(){return manual;},
   current(){const list=records(category);return list.length?list[(positions[category]||0)%list.length]:null;},
   select(key,lock=true){if(!order.includes(key))return;category=key;turns=0;if(lock)manual=true;},
   resume(){manual=false;turns=0;},lock(){manual=true;},
   next(){const keys=available();if(!keys.length)return null;
    if(!keys.includes(category))category=keys[0];
    const list=records(category);positions[category]=((positions[category]||0)+1)%list.length;turns++;
    if(!manual&&turns>=Math.min(3,list.length)){category=keys[(keys.indexOf(category)+1)%keys.length];turns=0;}
    return this.current();
   }
  };
 }
 if(typeof module!=='undefined')module.exports={createCycle,imageURL};
 if(typeof window==='undefined')return;
 function mount(section,options){
  const copy={nb:['Foto','Informasjon','Nettsted','Pause lysbildene','Fortsett automatisk visning','Illustrasjon av turutstyr'],en:['Photos','Information','Website','Pause slideshow','Resume automatic slideshow','Outdoor equipment illustration'],uk:['Фото','Інформація','Сайт','Призупинити показ','Продовжити автоматичний показ','Ілюстрація спорядження'],sv:['Foto','Information','Webbplats','Pausa bildspelet','Fortsätt automatiskt bildspel','Illustration av friluftsutrustning'],da:['Foto','Information','Hjemmeside','Sæt billedvisning på pause','Fortsæt automatisk billedvisning','Illustration af friluftsudstyr']};
  const language=()=>window.FjordI18n?.language||document.documentElement.lang||'nb';
  const words=()=>copy[language()]||copy.nb;
  const localized=v=>typeof v==='string'?v:v?.[language()]||v?.nb||v?.en||'';
  const node=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n;};
  const host=node('div','map-showcase'),photo=node('img','map-showcase__photo'),shade=node('div','map-showcase__shade'),content=node('div','map-showcase__content');
  const category=node('p','map-showcase__category'),name=node('h3','map-showcase__name'),description=node('p','map-showcase__description'),links=node('div','map-showcase__links'),credit=node('a','map-showcase__credit'),pause=node('button','map-showcase__pause');
  const photos=node('button',''),info=node('button',''),website=node('a','');
  host.dataset.i18nIgnore='';photo.alt='';photo.decoding='async';photos.type=info.type=pause.type='button';credit.target=website.target='_blank';credit.rel=website.rel='noopener noreferrer';
  links.append(photos,info,website);content.append(category,name,description,links);host.append(photo,shade,content,credit,pause);
  section.querySelector('.norway-overview__controls').before(host);
  const cycle=createCycle(options.rows);let paused=false,visible=false,displayed=null,lastSource='',failed=new Set();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
  function paint(){
   const p=cycle.current();host.hidden=!p;if(!p)return;displayed=p;
   const src=imageURL(p);if(src!==lastSource){lastSource=src;photo.src=src;host.dataset.placeId=p.id;}
   photo.alt=localized(p.photoAlt)||localized(p.image?.alt)||localized(p.name);category.textContent=options.categoryLabel(cycle.category);name.textContent=localized(p.name);
   description.textContent=[p.town||p.municipality||p.region,localized(p.description)].filter(Boolean).join(' · ');description.hidden=!description.textContent;
   photos.textContent=words()[0];info.textContent=words()[1];website.textContent=words()[2]+' ↗';const site=safeLink(p.website);website.hidden=!site;if(site)website.href=site;else website.removeAttribute('href');
   const g=p.gallery?.find(g=>g.src===src)||p.gallery?.[0];const source=safeLink(p.image?.source||p.imageSource||g?.source);
   credit.textContent=p.category==='equipment'?words()[5]:[p.image?.credit||p.imageCredit||g?.credit,p.image?.license||p.imageLicense||g?.license].filter(Boolean).join(' · ')||localized(p.photoCaption);
   credit.hidden=!credit.textContent;if(source)credit.href=source;else credit.removeAttribute('href');
   pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?words()[4]:words()[3]);pause.setAttribute('aria-pressed',String(paused));host.dataset.category=cycle.category;host.dataset.categoryMode=cycle.manual?'manual':'auto';
  }
  function open(){if(!displayed)return;cycle.lock();options.open(displayed);paint();}
  photos.onclick=info.onclick=open;
  pause.onclick=()=>{paused=!paused;if(!paused)cycle.resume();paint();};
  photo.onerror=()=>{if(failed.has(lastSource))return;failed.add(lastSource);photo.style.visibility='hidden';};photo.onload=()=>{photo.style.visibility='';if(!reduced.matches)photo.animate?.([{opacity:.5},{opacity:1}],{duration:600,easing:'ease-out'});};
  const timer=setInterval(()=>{
   if(paused||!visible||document.hidden||reduced.matches||document.querySelector('dialog[open]')||host.querySelector(':focus-visible'))return;
   const previous=cycle.category;cycle.next();if(previous!==cycle.category)options.onCategory(cycle.category);paint();
  },4000);
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);},{threshold:.12});observer.observe(host);
  return {sync(key){if(key!==cycle.category)cycle.select(key,false);paint();},select(key){cycle.select(key);paint();},refresh:paint,lock(){cycle.lock();paint();},destroy(){clearInterval(timer);observer.disconnect();host.remove();}};
 }
 window.FjordMapShowcase={mount};
})();
