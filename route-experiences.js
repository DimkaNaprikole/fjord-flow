/* Regional ideas, not claims that an attraction lies on the current road route. */
(() => {
 'use strict';
 const labels={
 en:['Make room for a little adventure','Experiences along the way','Explore real attractions by region. These are regional suggestions, not automatically selected stops on your current route. Check the operator’s current opening hours and terms.','All regions','Eastern Norway','Hardanger','Fjord country','Sunnmøre','Official information','Directions','Season','Illustration · not a photograph of the attraction.','Loading experiences…','Experiences could not be loaded. Please try again.','Try again','No experiences match this region yet.','Cafés','Cabins & saunas','Drone filming','Filter by region','experiences','Address'],
 nb:['Gjør plass til et lite eventyr','Opplevelser underveis','Utforsk ekte attraksjoner etter region. Dette er regionale forslag, ikke automatisk valgte stopp langs din nåværende rute. Sjekk gjeldende åpningstider og vilkår hos arrangøren.','Alle regioner','Østlandet','Hardanger','Fjordlandet','Sunnmøre','Offisiell informasjon','Veibeskrivelse','Sesong','Illustrasjon · ikke et fotografi av attraksjonen.','Laster opplevelser…','Kunne ikke laste opplevelsene. Prøv igjen.','Prøv igjen','Ingen opplevelser i denne regionen ennå.','Kafeer','Hytter og badstuer','Dronefilming','Filtrer etter region','opplevelser','Adresse'],
 uk:['Залиште місце для пригод','Враження дорогою','Відкривайте справжні пам’ятки за регіонами. Це регіональні пропозиції, а не автоматично підібрані зупинки на вашому поточному маршруті. Години роботи й умови перевіряйте в організатора.','Усі регіони','Східна Норвегія','Гардангер','Край фіордів','Суннмере','Офіційна інформація','Як дістатися','Сезон','Ілюстрація · це не фотографія пам’ятки.','Завантажуємо враження…','Не вдалося завантажити добірку. Спробуйте ще раз.','Спробувати знову','У цьому регіоні поки немає пропозицій.','Кав’ярні','Будиночки й сауни','Зйомка дроном','Фільтрувати за регіоном','місць','Адреса'],
 sv:['Gör plats för lite äventyr','Upplevelser längs vägen','Upptäck riktiga sevärdheter efter region. Det här är regionala förslag, inte automatiskt valda stopp längs din nuvarande rutt. Kontrollera aktuella öppettider och villkor hos arrangören.','Alla regioner','Östra Norge','Hardanger','Fjordlandet','Sunnmøre','Officiell information','Vägbeskrivning','Säsong','Illustration · inte ett fotografi av sevärdheten.','Laddar upplevelser…','Upplevelserna kunde inte laddas. Försök igen.','Försök igen','Inga upplevelser i den här regionen ännu.','Kaféer','Stugor och bastur','Drönarfilmning','Filtrera efter region','upplevelser','Adress'],
 da:['Giv plads til et lille eventyr','Oplevelser undervejs','Udforsk virkelige attraktioner efter region. Dette er regionale forslag, ikke automatisk valgte stop på din aktuelle rute. Tjek aktuelle åbningstider og vilkår hos arrangøren.','Alle regioner','Østnorge','Hardanger','Fjordlandet','Sunnmøre','Officiel information','Rutevejledning','Sæson','Illustration · ikke et fotografi af attraktionen.','Indlæser oplevelser…','Oplevelserne kunne ikke indlæses. Prøv igen.','Prøv igen','Ingen oplevelser i denne region endnu.','Caféer','Hytter og saunaer','Droneoptagelser','Filtrer efter region','oplevelser','Adresse']
 };
 const categories={en:{park:'Park',culture:'Culture',adventure:'Adventure',landmark:'Landmark',sauna:'Sauna'},nb:{park:'Park',culture:'Kultur',adventure:'Eventyr',landmark:'Severdighet',sauna:'Badstue'},uk:{park:'Парк',culture:'Культура',adventure:'Пригоди',landmark:'Пам’ятка',sauna:'Сауна'},sv:{park:'Park',culture:'Kultur',adventure:'Äventyr',landmark:'Sevärdhet',sauna:'Bastu'},da:{park:'Park',culture:'Kultur',adventure:'Eventyr',landmark:'Seværdighed',sauna:'Sauna'}};
 const extraRegions={en:['Southern coast','Arctic Norway'],nb:['Sørlandet','Nord-Norge'],uk:['Південне узбережжя','Північна Норвегія'],sv:['Sydkusten','Nordnorge'],da:['Sydkysten','Nordnorge']};
 const extraCategories={en:['Aquarium','Zoo','Museum','Nature'],nb:['Akvarium','Dyrepark','Museum','Natur'],uk:['Океанаріум','Зоопарк','Музей','Природа'],sv:['Akvarium','Djurpark','Museum','Natur'],da:['Akvarium','Dyrepark','Museum','Natur']};
 for(const code of Object.keys(categories))['aquarium','zoo','museum','nature'].forEach((key,i)=>categories[code][key]=extraCategories[code][i]);
 let venues=[],filter='all',phase='loading',pending=false,loadPromise;
 const $=id=>document.getElementById(id),lang=()=>labels[window.FjordI18n?.language]?window.FjordI18n.language:labels[document.documentElement.lang]?document.documentElement.lang:'nb',t=i=>labels[lang()][i],text=value=>typeof value==='string'?value:value?.[lang()]||value?.en||value?.nb||'';
 const el=(tag,content,cls)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;};
 function url(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
 function imageURL(value){if(!value)return '';try{const u=new URL(value,document.baseURI);if(u.origin===location.origin&&u.pathname.includes('experience-'))u.searchParams.set('v','3');return u.protocol==='https:'||u.origin===location.origin?u.href:'';}catch{return '';}}
 function external(label,href,cls){const a=el('a',label+' ↗',cls);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;}
 function illustration(kind){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 480 210');svg.setAttribute('aria-hidden','true');const shape=(tag,attrs)=>{const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);};shape('rect',{width:480,height:210,fill:'#e4e9d9'});shape('circle',{cx:368,cy:49,r:25,fill:'#f6d493'});shape('path',{d:'M0 161 98 76l98 82 96-108 130 114 58-44v90H0Z',fill:'#b4c8bb'});shape('path',{d:'M0 186q111-42 226-4t254-11v39H0Z',fill:'#719b8d'});shape('circle',{cx:241,cy:105,r:57,fill:'#fffcf0',opacity:.93});const icons={park:'M241 61v91m-22-60 22-31 22 31h-12l23 29h-66l23-29Zm-28 57h101',culture:'m202 87 39-23 39 23Zm5 8v42m23-42v42m23-42v42m22-42v42m-68 9h81',adventure:'m204 143 35-76 36 76Zm35-76-12 38 12-5 11 9m-23 34 13-24 13 24',landmark:'M219 143V85h44v58m-38-58V68h31v17m-46 58h63m-44-43h4m12 0h4m-22 17h4m12 0h4',sauna:'M205 142V99h72v43Zm5-43 31-23 31 23m-56 10h15v17h-15m30-5h19m-19 10h19m-36-61q-8-8 0-17m17 17q-8-8 0-17'};shape('path',{d:icons[kind]||icons.landmark,fill:'none',stroke:'#28564c','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});return svg;}
 function appendPhotoCredit(container,place){const c=place.photoCredit;if(!c)return;const caption=el('figcaption');caption.append(document.createTextNode(c.authorPlain+' · '));if(url(c.licenseUrl))caption.append(external(c.license,url(c.licenseUrl)));if(url(c.commonsPage))caption.append(document.createTextNode(' · '),external('Wikimedia Commons',url(c.commonsPage)));caption.append(document.createTextNode(' · thumbnail'));container.append(caption);}
 const moreLabels={en:['Details & opening','Enlarge photo','Close photo'],nb:['Detaljer og åpning','Forstørr bildet','Lukk bildet'],uk:['Подробиці й сезон','Збільшити фото','Закрити фото'],sv:['Detaljer och öppettider','Förstora bilden','Stäng bilden'],da:['Detaljer og åbning','Forstør billedet','Luk billedet']};
 const flipLabels={en:['About this place','Back to photo'],nb:['Om stedet','Til bildet'],uk:['Про місце','До фотографії'],sv:['Om platsen','Till bilden'],da:['Om stedet','Til billedet']};
 const fineHover=matchMedia('(hover: hover) and (pointer: fine)');
 let lastScroll=0;window.addEventListener('scroll',()=>{lastScroll=performance.now();},{passive:true});
 function foldCard(article,figure,body,v,src){
  if(!src)return;
  article.classList.add('experience-flip');article.dataset.experienceId=v.id;
  article.style.setProperty('--experience-photo',`url("${src}")`);
  const caption=el('div',undefined,'experience-front-caption');
  caption.append(el('small',v.area||'Norge'),el('strong',v.name));figure.append(caption);
  const toggle=el('button',flipLabels[lang()][0]+' ↻','experience-flip-toggle');toggle.type='button';toggle.setAttribute('aria-expanded','false');
  let dwell=0,returnTimer=0;
  const side=open=>{
   clearTimeout(dwell);clearTimeout(returnTimer);
   article.classList.toggle('experience-flipped',open);body.inert=!open;figure.inert=open;
   toggle.setAttribute('aria-expanded',String(open));toggle.textContent=flipLabels[lang()][open?1:0]+(open?' ↶':' ↻');
  };
  body.inert=true;
  toggle.onclick=()=>side(!article.classList.contains('experience-flipped'));
  article.addEventListener('pointerenter',event=>{
   if(!fineHover.matches||event.pointerType==='touch')return;
   clearTimeout(returnTimer);clearTimeout(dwell);
   dwell=setTimeout(()=>{if(article.isConnected&&article.matches(':hover')&&performance.now()-lastScroll>250&&!document.querySelector('dialog[open]'))side(true);},2000);
  });
  article.addEventListener('pointerleave',()=>{clearTimeout(dwell);if(fineHover.matches&&!article.matches(':focus-within'))returnTimer=setTimeout(()=>side(false),280);});
  article.addEventListener('focusout',()=>setTimeout(()=>{if(!article.matches(':focus-within,:hover'))side(false);},0));
  article.append(toggle);
 }
 function showPhoto(v){
  let dialog=$('experiencePhotoDialog');
  if(!dialog){dialog=el('dialog');dialog.id='experiencePhotoDialog';document.body.append(dialog);dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});}
  dialog.replaceChildren();const close=el('button','×','experience-photo-close');close.type='button';close.setAttribute('aria-label',moreLabels[lang()][2]);close.onclick=()=>dialog.close();
  const title=el('h2',v.name),figure=el('figure'),image=el('img');image.src=imageURL(v.image);image.alt=v.name;figure.append(image);appendPhotoCredit(figure,v);dialog.append(close,title,figure,el('p',text(v.description)));dialog.showModal();window.FjordPlaceMaps?.show(dialog,[v]);
 }
 function card(v){
  const article=el('article',undefined,'experience-card'),figure=el('figure',undefined,'experience-visual'),src=imageURL(v.image);
  if(src){const button=el('button',undefined,'experience-photo-button'),img=el('img');button.type='button';button.setAttribute('aria-label',moreLabels[lang()][1]+' · '+v.name);button.onclick=()=>showPhoto(v);img.src=src;img.alt=v.name;img.loading='lazy';img.decoding='async';button.append(img,el('span','↗','experience-photo-expand'));figure.append(button);article.append(figure);}
  else article.classList.add('experience-no-photo');
  const body=el('div',undefined,'experience-body'),kicker=el('p',undefined,'experience-area'),area=el('span',v.area||'Norge');area.translate=false;kicker.append(area,document.createTextNode(' · '+(categories[lang()][v.category]||categories[lang()].landmark)));
  const title=el('h3',v.name);title.translate=false;body.append(kicker,title,el('p',text(v.description),'experience-description'));
  const details=el('details',undefined,'experience-details');details.append(el('summary',moreLabels[lang()][0]));
  const season=text(v.season);if(season){const p=el('p',undefined,'experience-season');p.append(el('strong',t(10)+' · '),document.createTextNode(season));details.append(p);}
  if(v.address){const address=el('p',undefined,'experience-address');address.append(el('span',t(21)+': '));const literal=el('span',v.address);literal.translate=false;address.append(literal);details.append(address);}
  if(v.photoCredit){const credits=el('figure',undefined,'experience-credit');appendPhotoCredit(credits,v);details.append(credits);}body.append(details);
  const actions=el('div',undefined,'experience-actions');actions.append(external(t(8),url(v.website),'experience-official'));
  const maps=new URL('https://www.google.com/maps/dir/');
  if(Number.isFinite(v.latitude)&&Number.isFinite(v.longitude)&&Math.abs(v.latitude)<=90&&Math.abs(v.longitude)<=180)maps.search=new URLSearchParams({api:'1',destination:v.latitude+','+v.longitude}).toString();
  else if(v.address)maps.search=new URLSearchParams({api:'1',destination:v.name+', '+v.address}).toString();
  if(maps.search)actions.append(external(t(9),maps.href,'experience-directions'));body.append(actions);article.append(body);foldCard(article,figure,body,v,src);return article;
 }

 function render(){const section=$('routeExperiences');if(!section)return;section.replaceChildren();const head=el('div',undefined,'experiences-heading');const title=el('h2',t(1));title.id='routeExperiencesTitle';head.append(el('p',t(0),'experiences-eyebrow'),title,el('p',t(2),'experiences-intro'));section.append(head);const nav=el('nav',undefined,'experience-filters');nav.setAttribute('aria-label',t(19));const keys=['all','east','hardanger','fjord','sunnmore','coast','arctic'];keys.forEach((key,i)=>{const b=el('button',i<5?t(i+3):extraRegions[lang()][i-5]);b.type='button';b.dataset.experienceRegion=key;b.setAttribute('aria-pressed',String(filter===key));b.onclick=()=>{filter=key;render();$('routeExperiences').querySelector('[data-experience-region="'+key+'"]').focus({preventScroll:true});};nav.append(b);});section.append(nav);if(phase==='ready'){const list=venues.filter(v=>imageURL(v.image)&&(filter==='all'||v.routes?.includes(filter)));section.append(el('p',list.length+' '+t(20),'experience-count'));if(list.length){const grid=el('div',undefined,'experiences-grid');list.forEach(v=>grid.append(card(v)));section.append(grid);}else section.append(el('p',t(15),'experiences-status'));}else{const message=el('p',phase==='error'?t(13):t(12),'experiences-status');message.setAttribute('role','status');section.append(message);if(phase==='error'){const retry=el('button',t(14),'experience-retry');retry.type='button';retry.onclick=()=>{loadPromise=load();};section.append(retry);}}const jumps=el('nav',undefined,'experience-jumps');['cafeNearby','staysSauna','droneExperience'].forEach((id,i)=>{const a=el('a',t(i+16)+' →');a.href='#'+id;jumps.append(a);});head.append(jumps);}
 function mount(){const cafe=$('cafeStops');if(!cafe)return;let section=$('routeExperiences');if(!section){section=el('section',undefined,'route-experiences');section.id='routeExperiences';section.dataset.i18nIgnore='';section.setAttribute('aria-labelledby','routeExperiencesTitle');cafe.before(section);render();}else if(section.nextElementSibling!==cafe)cafe.before(section);}
 async function load(){
  if(pending)return;pending=true;phase='loading';render();
  const controller=new AbortController();let timer;
  try{
   // Bound the entire download, including a response body that never finishes.
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Experiences request timed out'));},8000);});
   const download=(async()=>{const response=await fetch('./route-experiences.json?v=4',{credentials:'same-origin',signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);return response.json();})();
   const data=await Promise.race([download,timeout]);
   if(!Array.isArray(data))throw Error('Expected attraction array');
   venues=data.filter(v=>v&&typeof v.id==='string'&&typeof v.name==='string'&&url(v.website));phase='ready';
   window.dispatchEvent(new CustomEvent('fjordexperiencesready',{detail:{places:venues}}));
  }catch(error){phase='error';console.info('FJORD / FLOW regional experiences unavailable:',error.message);}
  finally{clearTimeout(timer);pending=false;render();}
  // A failed optional list must not masquerade as a successful empty list:
  // the itinerary can open its base stops and show the existing retry hint.
  return phase==='ready'?venues:null;
 }
 new MutationObserver(mount).observe(document.body,{subtree:true,childList:true});window.addEventListener('fjordlanguagechange',()=>{mount();render();});mount();loadPromise=load();window.FjordExperiences={appendPhotoCredit,load:()=>pending?loadPromise:phase==='ready'?Promise.resolve(venues):(loadPromise=load()),get places(){return venues;}};
})();
