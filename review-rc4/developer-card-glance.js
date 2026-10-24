/* Occasional business-card preview. Only place it in a genuinely free viewport area. */
(() => {
 'use strict';
 function freeSpots(viewport,size,obstacles,avoid=null){
  const margin=18,pad=14,spots=[];
  if(size.width>viewport.width-2*margin||size.height>viewport.height-130)return spots;
  const xs=[margin,Math.round((viewport.width-size.width)/2),viewport.width-margin-size.width-(viewport.width>=600?36:12)];
  for(let y=100;y+size.height<=viewport.height-margin;y+=52)for(const x of new Set(xs)){
   const box={left:x,top:y,right:x+size.width,bottom:y+size.height};
   if((!avoid||!(box.left<avoid.right+pad&&box.right>avoid.left-pad&&box.top<avoid.bottom+pad&&box.bottom>avoid.top-pad))&&!obstacles.some(r=>box.left<r.right+pad&&box.right>r.left-pad&&box.top<r.bottom+pad&&box.bottom>r.top-pad))spots.push(box);
  }
  return spots;
 }
 function pickCard(cards,random=Math.random){return Array.isArray(cards)&&cards.length?cards[Math.min(cards.length-1,Math.floor(random()*cards.length))]:null;}
 if(typeof module!=='undefined')module.exports={freeSpots,pickCard};
 if(typeof window==='undefined')return;

 const privatePreview=location.hostname==='127.0.0.1'&&window.parent!==window&&new URL(document.referrer||location.href).origin==='http://127.0.0.1:8803';
 if(privatePreview){
  const report=()=>{if(document.hidden)return;const selectors='header,nav,button,a,input,select,textarea,summary,h1,h2,h3,h4,p,li,label,figcaption,iframe,canvas,[role="button"],.ref-visit-info,.explorer-weather,.ref-scene-stage,.ref-card,.developer-card,.fjord-ai-chat,.advertising-showcase';const boxes=[...document.querySelectorAll(selectors)].filter(n=>!n.closest('.hero-artwork,.solidarity-art-pair,.portal-art-rail,.nordic-backdrop,.explorer-visual,.landscape,.scenery-frame')&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}).filter(r=>r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight);window.parent.postMessage({type:'fjord-card-obstacles',boxes,width:innerWidth,height:innerHeight},'http://127.0.0.1:8803');};
  report();setInterval(report,250);window.addEventListener('scroll',report,{passive:true});return;
 }
 const pool=Array.isArray(window.FjordAdvertisingCards)?window.FjordAdvertisingCards:[];if(!pool.length)return;
 let selected=pool[0];
 const copy={nb:['Nettsider og programvare på bestilling','Se visittkortet','Lukk visittkortet','E-post'],en:['Custom websites and software','View business card','Close business card','Email'],uk:['Сайти та програми на замовлення','Переглянути візитку','Закрити візитку','Email'],sv:['Webbplatser och programvara på beställning','Visa visitkortet','Stäng visitkortet','E-post'],da:['Hjemmesider og software på bestilling','Se visitkortet','Luk visitkortet','E-mail']};
 let dismissed=false;try{dismissed=sessionStorage.getItem('fjord-developer-card-dismissed')==='1';}catch{}
 if(dismissed)return;
 const card=document.createElement('aside');card.className='developer-glance';card.dataset.i18nIgnore='';card.hidden=true;
 const brand=document.createElement('p');brand.className='developer-glance__brand';brand.textContent=selected.brand;
 const title=document.createElement('a');title.className='developer-glance__title';title.href='./developer-card.html';title.target='_blank';title.rel='noopener noreferrer';
 const more=document.createElement('a');more.className='developer-glance__more';more.href=title.href;more.target='_blank';more.rel=title.rel;
 const links=document.createElement('nav');links.className='developer-glance__links';
 const contact=(label,href)=>{const a=document.createElement('a');a.textContent=label;a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const email=contact('Email','https://mail.google.com/mail/?view=cm&fs=1&to=laurkent123%40gmail.com');links.append(contact('Messenger','https://m.me/100032941041934'),email);
 const close=document.createElement('button');close.type='button';close.className='developer-glance__close';close.textContent='×';
 const directEmail=document.createElement('a');directEmail.className='developer-glance__email';directEmail.target='_blank';directEmail.rel='noopener noreferrer';card.append(brand,directEmail,title,more,links,close);document.body.append(card);
 const words=()=>copy[window.FjordI18n?.language||document.documentElement.lang]||copy.nb;
 function labels(){const w=words(),lang=window.FjordI18n?.language||document.documentElement.lang;const messenger=selected.contacts?.find(c=>c.label==='Messenger'),emailContact=selected.contacts?.find(c=>c.label==='Email');brand.replaceChildren();if(messenger){brand.append(contact(selected.brand.replace(/ Digital$/,''),messenger.href),document.createTextNode(' Digital'));}else brand.textContent=selected.brand;directEmail.hidden=!emailContact;if(emailContact){directEmail.href=emailContact.href;directEmail.textContent='laurkent123@gmail.com';}title.textContent=selected.headlines[lang]||selected.headlines.nb;title.href=selected.href;more.href=selected.href;more.textContent=w[1]+' ↗';close.setAttribute('aria-label',w[2]);card.setAttribute('aria-label',w[1]);card.dataset.cardId=selected.id;links.setAttribute('aria-label',selected.brand);links.replaceChildren(...(selected.contacts||[]).map(c=>contact(c.label==='Email'?w[3]:c.label,c.href)));}

 labels();
 let timer,hideTimer,shows=0,lastFocus,nextAllowed=0,relocating=false,avoidSpot=null,relocateUntil=0,exposureEnds=0;
 const randomDelay=(min,max)=>min+Math.random()*(max-min);
 function schedule(delay){clearTimeout(timer);if(delay===undefined)delay=relocating?1800:randomDelay(20000,30000);if(!dismissed&&(shows<5||relocating))timer=setTimeout(attempt,relocating?delay:Math.max(delay,nextAllowed-Date.now()));}
 function hide(){clearTimeout(hideTimer);if(card.contains(document.activeElement)&&lastFocus?.isConnected)lastFocus.focus({preventScroll:true});card.hidden=true;}
 function cancelAndWait(){if(!card.hidden){const r=card.getBoundingClientRect();avoidSpot={left:r.left,right:r.right,top:r.top,bottom:r.bottom};relocating=true;relocateUntil=Date.now()+20000;hide();}schedule(1800);}
 function occupied(){
  const selectors='body>header,nav,button,a,input,select,textarea,summary,h1,h2,h3,h4,p,li,label,figcaption,img,iframe,canvas,[role="button"],[role="textbox"],.ref-visit-info,.explorer-weather,.ref-scene-stage,.ref-card,.stay-card,.card,.google-place-map,.norway-overview__canvas,.developer-card,.fjord-ai-chat,.advertising-showcase';
  return [...document.querySelectorAll(selectors)].filter(n=>!card.contains(n)&&n!==card&&!n.closest('.hero-artwork,.solidarity-art-pair,.portal-art-rail,.nordic-backdrop,.explorer-visual,.landscape,.scenery-frame')&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth);
 }
 function attempt(){
  if(dismissed||(shows>=5&&!relocating))return;
  if(relocating&&Date.now()>relocateUntil){relocating=false;avoidSpot=null;schedule();return;}
  const active=document.activeElement;
  if(document.hidden||innerWidth<360||document.querySelector('dialog[open]')||active?.matches('input,textarea,select,[contenteditable=true]')||String(window.getSelection?.()||'')){schedule();return;}
  const full=document.querySelector('#contact');if(full){const r=full.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0){schedule();return;}}
  if(!relocating)selected=pickCard(pool);labels();card.style.visibility='hidden';card.hidden=false;
  const size={width:card.offsetWidth,height:card.offsetHeight},spots=freeSpots({width:innerWidth,height:innerHeight},size,occupied(),relocating?avoidSpot:null);
  if(!spots.length){card.hidden=true;card.style.visibility='';schedule(3000);return;}
  const spot=spots[Math.floor(Math.random()*spots.length)];card.style.left=spot.left+'px';card.style.top=spot.top+'px';card.style.visibility='';lastFocus=active;if(!relocating){shows++;nextAllowed=Date.now()+60000;exposureEnds=Date.now()+12000;}relocating=false;avoidSpot=null;
  const expire=()=>{if(card.contains(document.activeElement)||card.matches(':hover')){hideTimer=setTimeout(expire,4000);return;}hide();schedule(45000);};hideTimer=setTimeout(expire,Math.max(2000,exposureEnds-Date.now()));
 }
 close.onclick=()=>{dismissed=true;clearTimeout(timer);hide();try{sessionStorage.setItem('fjord-developer-card-dismissed','1');}catch{}};
 card.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close.click();}});
 window.addEventListener('scroll',cancelAndWait,{passive:true});window.addEventListener('resize',cancelAndWait,{passive:true});
 window.addEventListener('fjord:sections-changed',cancelAndWait);window.addEventListener('fjordlanguagechange',()=>{hide();labels();schedule();});
 document.addEventListener('visibilitychange',cancelAndWait);
 // Dynamic content (carousel captions, widgets, menus) can occupy an earlier empty area.
 let checking=false;
 const observer=new MutationObserver(()=>{if(card.hidden||checking)return;checking=true;requestAnimationFrame(()=>{checking=false;if(card.hidden)return;if(document.querySelector('dialog[open]')){hide();schedule(45000);return;}const r=card.getBoundingClientRect();if(occupied().some(o=>r.left<o.right+14&&r.right>o.left-14&&r.top<o.bottom+14&&r.bottom>o.top-14)){cancelAndWait();}});});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','aria-expanded','open'],characterData:true});
 schedule(randomDelay(12000,18000));
})();
