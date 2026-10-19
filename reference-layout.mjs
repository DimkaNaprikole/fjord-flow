/* Selected boards: a curated photographic view. Original controls/data stay in DOM. */
import {waterfallVisits} from './waterfall-visits.mjs';
const lang=()=>window.FjordI18n?.language||document.documentElement.lang||'nb';
const languages=['nb','en','uk','sv','da'];
const tr=(...s)=>s[languages.indexOf(lang())]||s[0];
const copy={
 routes:()=>tr('RUTER','ROUTES','МАРШРУТИ','RUTTER','RUTER'),
 routeIntro:()=>tr('Utrolige veier, fjorder og landskap som er verdt å se.','Remarkable roads, fjords and landscapes worth seeing.','Неймовірні дороги, фіорди та краєвиди, які варто побачити.','Fantastiska vägar, fjordar och landskap att upptäcka.','Fantastiske veje, fjorde og landskaber at opleve.'),
 places:()=>tr('STEDER','PLACES','МІСЦЯ','PLATSER','STEDER'),
 placesIntro:()=>tr('Oppdag noen av Norges flotteste steder.','Discover memorable places across Norway.','Відкрийте найвідоміші локації Норвегії.','Upptäck Norges fina platser.','Oplev Norges smukke steder.'),
 waterfalls:()=>tr('FOSSEFALL','WATERFALLS','ВОДОСПАДИ','VATTENFALL','VANDFALD'),
 waterIntro:()=>tr('Ta en pause ved vannet.','Stop beside the water.','Зупиніться біля води.','Stanna vid vattnet.','Stop ved vandet.'),
 buaIntro:()=>tr('Lån utstyr til nye eventyr.','Borrow equipment for new adventures.','Позичайте спорядження для нових пригод.','Låna utrustning till nya äventyr.','Lån udstyr til nye eventyr.'),
 experiences:()=>tr('OPPLEVELSER UNDERVEIS','EXPERIENCES ALONG THE WAY','ВРАЖЕННЯ ДОРОГОЮ','UPPLEVELSER LÄNGS VÄGEN','OPLEVELSER UNDERVEJS'),
 cafes:()=>tr('KAFFEPAUSER','COFFEE STOPS','КАВОВІ ПАУЗИ','KAFFEPAUSER','KAFFEPAUSER'),
 cafeIntro:()=>tr('Koselige kafeer og utsikter det er verdt å bli ved.','Welcoming cafes and views worth lingering over.','Затишні кав’ярні з неймовірними краєвидами Норвегії.','Mysiga kaféer och utsikter att dröja vid.','Hyggelige caféer og udsigter at blive ved.'),
 stays:()=>tr('HYTTER OG BADSTUER','CABINS & SAUNAS','БУДИНОЧКИ ТА САУНИ','STUGOR OCH BASTUR','HYTTER OG SAUNAER'),
 stayIntro:()=>tr('Ro ved vannet og mellom fjellene.','Find a quiet moment by the water and mountains.','Відпочинок у гармонії з природою, біля води та в горах.','Lugn vid vattnet och mellan bergen.','Ro ved vandet og mellem bjergene.'),
 film:()=>tr('DIN REISE. DIN FILM.','YOUR JOURNEY. YOUR FILM.','ВАША ПОДОРОЖ. ВАШ ФІЛЬМ.','DIN RESA. DIN FILM.','DIN REJSE. DIN FILM.'),
 around:()=>tr('ALT RUNDT DEG','AROUND YOU','УСЕ НАВКОЛО','ALLT OMKRING DIG','ALT OMKRING DIG'),
 shops:()=>tr('KJØPESENTRE OG BUTIKKER','SHOPPING CENTRES & SHOPS','ТОРГОВІ ЦЕНТРИ ТА МАГАЗИНИ','KÖPCENTRUM OCH BUTIKER','INDKØBSCENTRE OG BUTIKKER'),
 cams:()=>tr('WEBKAMERAER','WEBCAMS','ВЕБКАМЕРИ','WEBBKAMEROR','WEBKAMERAER'),
 news:()=>tr('DET SKJER NÆR DEG','WHAT’S ON NEAR YOU','АФІША ПОРУЧ','DET HÄNDER NÄRA DIG','DET SKER NÆR DIG'),
 community:()=>tr('FACEBOOK OG REISEJOURNAL','FACEBOOK & TRAVEL JOURNAL','FACEBOOK І ЩОДЕННИК','FACEBOOK OCH RESEDAGBOK','FACEBOOK OG REJSEDAGBOG'),
 services:()=>tr('TJENESTER FOR REISEN','TRAVEL SERVICES','СЕРВІСИ ДЛЯ ПОДОРОЖЕЙ','TJÄNSTER FÖR RESAN','TJENESTER TIL REJSEN'),
 road:()=>tr('PÅ VEIEN','ON THE ROAD','У ДОРОЗІ','PÅ VÄGEN','PÅ VEJEN'),
 map:()=>tr('NORGE PÅ KARTET','NORWAY ON THE MAP','КАРТА НОРВЕГІЇ','NORGE PÅ KARTAN','NORGE PÅ KORTET'),
 photo:()=>tr('Foto','Photos','Фото','Foto','Foto'),info:()=>tr('Informasjon','Information','Інформація','Information','Information'),
 more:()=>tr('Les mer','Details','Детальніше','Läs mer','Læs mere'),open:()=>tr('Åpne tjenesten','Open service','Відкрити сервіс','Öppna tjänsten','Åbn tjenesten'),
 choose:()=>tr('Velg en rute','Choose a route','Обрати маршрут','Välj en rutt','Vælg en rute'),
 nearby:()=>tr('Finn i nærheten','Find nearby','Знайти поруч','Hitta nära','Find i nærheden')
};
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const image=(src,alt='')=>{const e=el('img');e.src=src;e.alt=alt;e.loading='lazy';return e;};
const action=(text,fn)=>{const b=el('button','ref-link',text);b.type='button';b.onclick=fn;return b;};
const link=(text,url)=>{const a=el('a','ref-link',text);a.href=url;if(!url.startsWith('#')){a.target='_blank';a.rel='noopener noreferrer';}return a;};
const local=x=>typeof x==='object'?(x?.[lang()]||x?.nb||''):x||'';
const src=x=>typeof x?.image==='object'?x.image.url:x?.image||x?.gallery?.[0]?.src||'';
const openPlace=id=>window.dispatchEvent(new CustomEvent('fjord:open-place',{detail:{id}}));
const originals=new Map(),transported=new Map();
let state,catalogue,shops,experiences,apps;
const extraServices=await fetch('./official-services.json?v=4').then(r=>r.json());
const serviceArtwork=await fetch('./service-artwork.json?v=4').then(r=>r.json());
const [stateResult,catResult,shopResult,expResult,appResult]=await Promise.allSettled([
 fetch('./demo-data/state.json').then(r=>r.json()),fetch('./norway-catalog.json').then(r=>r.json()),
 fetch('./shopping-centres.json').then(r=>r.json()),fetch('./route-experiences.json?v=20261019-photo').then(r=>r.json()),fetch('./travel-apps.json').then(r=>r.json())
]);
if([stateResult,catResult,shopResult,expResult,appResult].some(r=>r.status!=='fulfilled'))throw Error('Reference layout source unavailable');
state=stateResult.value.destinations;catalogue=catResult.value;shops=shopResult.value;experiences=expResult.value;apps=appResult.value.apps;
// Reuse photographs only from the same catalogue object, retaining their source.
experiences=experiences.map(x=>{
 x={...x,visitInfo:{text:Object.fromEntries(languages.map(l=>[l,[x.description?.[l],x.season?.[l]].filter(Boolean).join('\n\n')])),source:x.website,checked:x.checked,expanded:true}};
 if(src(x))return x;const match=catalogue.find(c=>c.id===x.id);if(!match||!src(match))return x;
 return {...x,image:src(match),gallery:match.gallery,imageSource:match.imageSource};
});
function title(panel,key,intro,photo){
 const hero=el('div','ref-hero');if(photo)hero.append(image(photo));const text=el('div','ref-heading');text.append(el('h2','ref-title',copy[key]?.()||key));if(intro)text.append(el('p','ref-intro',intro));hero.append(text);panel.append(hero);return hero;
}
let sceneDisposers=[];
function automaticScene(panel,key,intro,items){
 const hero=title(panel,key,intro);hero.classList.add('ref-auto-scene');hero.setAttribute('aria-label',copy[key]());
 const stage=el('div','ref-scene-stage');hero.prepend(stage);let current=0,visible=false;
 let information,weather,weatherShell;
 const renderInformation=x=>{
  if(!information)return;information.replaceChildren();
  if(['experiences','cafes','stays','services'].includes(key)){
   information.append(el('h3','',x.name));if(x.area||x.address)information.append(el('p','ref-visit-location',x.address||x.area));
   if(local(x.description))information.append(el('p','',local(x.description)));
   if(local(x.season)){information.append(el('h4','',tr('Før besøket','Before you visit','Перед відвідуванням','Inför besöket','Før besøget')),el('p','',local(x.season)));}
   if(key==='cafes'||key==='stays'){
    information.append(el('h4','',tr('Åpningstider','Opening hours','Години роботи','Öppettider','Åbningstider')));
    const h=x.openingHours||{};
    let hours=local(x.hoursNote);
    if(!hours&&Array.isArray(h.weekly))hours=h.weekly.map((periods,i)=>new Intl.DateTimeFormat(lang(),{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,9,12+i)))+': '+(periods.length?periods.map(p=>p.join('–')).join(', '):tr('Stengt','Closed','Зачинено','Stängt','Lukket'))).join(' · ');
    information.append(el('p','ref-cafe-hours',hours||tr('Bekreft tidene på stedets nettside.','Confirm hours on the venue website.','Уточнюйте години на сайті закладу.','Bekräfta tider på platsens webbplats.','Bekræft tider på stedets hjemmeside.')));
   }
   if(x.phone){const phone=el('a','ref-link',tr('Ring','Call','Зателефонувати','Ring','Ring')+' '+x.phone);phone.href='tel:'+x.phone;information.append(phone);}if(key!=='services')information.append(action(copy.info()+' ›',x.open));
   if(x.website)information.append(link(tr('Offisiell nettside','Official website','Офіційний сайт','Officiell webbplats','Officiel hjemmeside')+' ↗',x.website));
   if(key==='services')information.append(el('p','',local(x.details)));const checked=x.openingHours?.checked||x.checked;if(checked)information.append(el('small','ref-visit-checked',tr('Opplysninger sjekket: ','Information checked: ','Відомості перевірено: ','Uppgifter kontrollerade: ','Oplysninger kontrolleret: ')+checked));
   return;
  }
  const v=waterfallVisits[x.id],i=Math.max(0,languages.indexOf(lang()));if(!v)return;
  information.append(el('h3','',x.name),el('p','ref-visit-location',[x.municipality,x.region].filter(Boolean).join(' · ')));
  for(const [heading,text]of [[tr('Parkering og adkomst','Parking and access','Парковка та під’їзд','Parkering och tillfart','Parkering og adgang'),v.parking[i]],[tr('Til fots / med tog','On foot / by train','Пішки / потягом','Till fots / med tåg','Til fods / med tog'),v.walk[i]]]){information.append(el('h4','',heading),el('p','',text));}
  const url=v.train||'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(v.route)+'&travelmode=driving';
  information.append(link(v.train?tr('Flåmsbana · planlegg turen','Flåm Railway · plan your trip','Flåmsbana · планувати поїздку','Flåmsbana · planera resan','Flåmsbana · planlæg turen'):tr('Veien til parkeringen','Directions to parking','Під’їзд до парковки','Vägen till parkeringen','Rute til parkeringen'),url));
  information.append(link(tr('Kilde','Source','Джерело','Källa','Kilde')+' · 19.10.2026',v.source));
 };
 const updateInformation=x=>{renderInformation(x);if(weatherShell&&information)information.append(weatherShell);weather?.update();};
 if(key==='waterfalls'){hero.classList.add('ref-waterfall-scene');information=el('aside','ref-visit-info');hero.append(information);updateInformation(items[0]);}
 if(['experiences','cafes','stays','services'].includes(key)){hero.classList.add('ref-experience-scene');information=el('aside','ref-visit-info');hero.append(information);updateInformation(items[0]);}
 const slides=items.map((x,i)=>{
  const slide=el('div','ref-scene-slide');slide.classList.toggle('is-active',i===0);slide.inert=i!==0;slide.setAttribute('aria-hidden',String(i!==0));
  const button=el('button','ref-scene-target');button.type='button';button.setAttribute('aria-label',copy.info()+' · '+x.name);button.onclick=x.open||(()=>openPlace(x.id));
  const photo=x.image?image(x.image,x.name):null;if(photo)photo.loading=['experiences','stays','services'].includes(key)&&i>1?'lazy':'eager';if(x.image)button.append(photo);else button.append(el('span','ref-service-wordmark',x.name));button.append(el('span','ref-scene-name',x.name));slide.append(button);
  if(x.imageSource){const credit=link([x.imageCredit,x.imageLicense].filter(Boolean).join(' · '),x.imageSource);credit.className='ref-scene-credit';slide.append(credit);}
  stage.append(slide);return slide;
 });
 hero.dataset.activePlace=items[0]?.id||'';
 if(key!=='services'){weatherShell=el('div','ref-scene-weather');(information||hero).append(weatherShell);weather=window.FjordExplorerWeather?.attach(weatherShell,()=>items[current]?.id,items);if(weather)sceneDisposers.push(()=>weather.dispose());}
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{threshold:.2});observer.observe(hero);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let tiltFrame=0,lastPointer;
 const finePointer=matchMedia('(min-width:751px) and (hover:hover) and (pointer:fine)');
 const resetDepth=()=>{cancelAnimationFrame(tiltFrame);tiltFrame=0;lastPointer=null;for(const name of ['--wf-rx','--wf-ry','--wf-px','--wf-py','--wf-light'])stage.style.removeProperty(name);};
 const moveDepth=event=>{
  if(key!=='waterfalls'||event.pointerType!=='mouse'||!finePointer.matches||reduced.matches)return;
  lastPointer={x:event.clientX,y:event.clientY};if(tiltFrame)return;
  tiltFrame=requestAnimationFrame(()=>{tiltFrame=0;if(!lastPointer)return;const box=stage.getBoundingClientRect();if(!box.width||!box.height)return;
   const x=Math.max(-1,Math.min(1,(lastPointer.x-box.left)/box.width*2-1)),y=Math.max(-1,Math.min(1,(lastPointer.y-box.top)/box.height*2-1));
   stage.style.setProperty('--wf-rx',(-y*2.6).toFixed(2)+'deg');stage.style.setProperty('--wf-ry',(x*3.2).toFixed(2)+'deg');
   stage.style.setProperty('--wf-px',(-x*5).toFixed(2)+'px');stage.style.setProperty('--wf-py',(-y*4).toFixed(2)+'px');stage.style.setProperty('--wf-light',((x+1)*50).toFixed(1)+'%');
  });
 };
 if(key==='waterfalls'){hero.classList.add('ref-waterfall-depth');stage.addEventListener('pointermove',moveDepth);stage.addEventListener('pointerleave',resetDepth);stage.addEventListener('pointercancel',resetDepth);stage.addEventListener('focusin',resetDepth);reduced.addEventListener('change',resetDepth);finePointer.addEventListener('change',resetDepth);}
 const timer=setInterval(()=>{
  if(items.length<2||!visible||document.hidden||reduced.matches||hero.querySelector(':focus-visible')||document.querySelector('dialog[open]'))return;
  const next=(current+1)%slides.length;
  const nextImage=slides[next].querySelector('img');if(nextImage&&(!nextImage.complete||!nextImage.naturalWidth)){nextImage.loading='eager';return;}
  slides[current].classList.remove('is-active');slides[current].inert=true;slides[current].setAttribute('aria-hidden','true');
  current=next;slides[current].classList.add('is-active');slides[current].inert=false;slides[current].setAttribute('aria-hidden','false');hero.dataset.activePlace=items[current].id;updateInformation(items[current]);
  if(['experiences','stays','services'].includes(key)){const upcoming=slides[(current+1)%slides.length].querySelector('img');if(upcoming)upcoming.loading='eager';}
 },4000);
 sceneDisposers.push(()=>{clearInterval(timer);observer.disconnect();resetDepth();stage.removeEventListener('pointermove',moveDepth);stage.removeEventListener('pointerleave',resetDepth);stage.removeEventListener('pointercancel',resetDepth);stage.removeEventListener('focusin',resetDepth);reduced.removeEventListener('change',resetDepth);finePointer.removeEventListener('change',resetDepth);});return hero;
}
function tile({name,photo,onPhoto,onInfo,url,caption,plain=false}){
 const card=el('article','ref-card'+(plain?' ref-card-plain':''));const trigger=onPhoto||onInfo;const visual=el(trigger?'button':'div','ref-photo');if(trigger){visual.type='button';visual.onclick=trigger;visual.setAttribute('aria-label',copy.photo()+' · '+name);}if(photo)visual.append(image(photo,name));else{visual.classList.add('ref-photo-unavailable');visual.append(el('span','',tr('Informasjon om stedet','Place information','Інформація про місце','Information om platsen','Information om stedet')));visual.setAttribute('aria-label',copy.info()+' · '+name);}const body=el('div','ref-card-body');body.append(el('h3','',name));if(caption)body.append(el('p','',caption));const actions=el('div','ref-actions');if(onPhoto)actions.append(action(copy.photo(),onPhoto));if(onInfo)actions.append(action(copy.info(),onInfo));else if(url)actions.append(link(copy.more()+' ›',url));body.append(actions);card.append(visual,body);return card;
}
function grid(panel,items,plain=false){const g=el('div','ref-grid');for(const item of items)g.append(tile({...item,plain}));panel.append(g);return g;}
function carousel(panel,items,plain=false){
 const g=grid(panel,items,plain);g.classList.add('ref-carousel');g.setAttribute('role','region');g.setAttribute('aria-label',tr('Bla gjennom alle kortene','Browse all cards','Гортайте всі картки','Bläddra bland alla kort','Gennemse alle kort'));let visible=false,pressed=false;
 const count=el('p','ref-carousel-count',tr('I utvalget: ','In this collection: ','У добірці: ','I urvalet: ','I udvalget: ')+items.length);panel.insertBefore(count,g);
 const observe=new IntersectionObserver(([e])=>{visible=e.isIntersecting;},{threshold:.2});observe.observe(g);
 const down=()=>{pressed=true},up=()=>{pressed=false};g.addEventListener('pointerdown',down);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);g.addEventListener('pointerleave',up);
 const timer=setInterval(()=>{
  if(!visible||pressed||document.hidden||matchMedia('(prefers-reduced-motion:reduce)').matches||g.querySelector(':focus-visible')||document.querySelector('dialog[open]')||g.scrollWidth<=g.clientWidth+2)return;
  const step=g.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(g).columnGap||18),end=g.scrollLeft+g.clientWidth>=g.scrollWidth-3;
  g.scrollTo({left:end?0:Math.min(g.scrollLeft+step,g.scrollWidth-g.clientWidth),behavior:end?'instant':'smooth'});
 },4500);
 sceneDisposers.push(()=>{clearInterval(timer);observe.disconnect();g.removeEventListener('pointerdown',down);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);g.removeEventListener('pointerleave',up);});return g;
}
function venue(x){return{name:x.name,photo:src(x),onPhoto:()=>window.FjordStayGallery?.open(x),onInfo:()=>window.FjordStayGallery?.open(x)};}
function preserve(root){if(!originals.has(root)||originals.get(root).every(e=>!e.isConnected))originals.set(root,[...root.children].filter(e=>!e.classList.contains('hero-artwork')));}
function take(root,selector){const key=root.id+selector,old=transported.get(key);if(old?.isConnected)return old;const e=originalQuery(root,selector)[0];if(e)transported.set(key,e);return e;}
function originalQuery(root,selector){return originals.get(root)?.flatMap(e=>[...(e.matches(selector)?[e]:[]),...e.querySelectorAll(selector)])||[];}
function mount(id,render){const root=document.getElementById(id);if(!root)return;preserve(root);let panel=root.querySelector(':scope>.ref-panel');if(!panel){panel=el('div','ref-panel');panel.dataset.i18nIgnore='';root.append(panel);}root.classList.add('ref-chapter');panel.replaceChildren();render(panel,root);}
function renderAll(){
 for(const dispose of sceneDisposers)dispose();sceneDisposers=[];
 const waterfall=document.querySelector('.waterfall-story');if(waterfall&&!waterfall.id)waterfall.id='waterfallChapter';
 mount('scenicRoutes',(p,r)=>{
  automaticScene(p,'routes',copy.routeIntro(),['atlantic','trollstigen','naeroyfjord'].map(id=>state.find(x=>x.id===id)).filter(Boolean));
  const routeButtons=originalQuery(r,'.roadtrip-presets [data-roadtrip]');
  const fallback={hadeland:catalogue.find(x=>x.id==='granavolden')?.image||'./images/cafes/granavolden-facade-2016.jpg',hardanger:state.find(x=>x.id==='voringfossen')?.image,fjord:state.find(x=>x.id==='naeroyfjord')?.image,sunnmore:state.find(x=>x.id==='trollstigen')?.image,family:src(experiences.find(x=>x.id==='kistefos')),osterdalen:state.find(x=>x.id==='roros')?.image};
  carousel(p,routeButtons.map(button=>{const route=window.FjordTripTools?.localRoutes?.[button.dataset.roadtrip];return{name:local(route?.title)||button.querySelector('b')?.textContent||button.dataset.roadtrip,caption:local(route?.summary)||button.querySelector('small')?.textContent,photo:route?.photos?.[0]?.image||fallback[button.dataset.roadtrip],onPhoto:()=>button.click(),onInfo:()=>button.click()};}));
  p.append(action(copy.choose()+' ›',()=>r.classList.toggle('ref-expanded')));
 });
 mount('collection',p=>{automaticScene(p,'places',copy.placesIntro(),['trolltunga','geiranger','bergen','lofoten'].map(id=>state.find(x=>x.id===id)).filter(Boolean));carousel(p,state.map(x=>({name:x.name,photo:x.image,onPhoto:()=>openPlace(x.id),onInfo:()=>openPlace(x.id)})));});
 mount('waterfallChapter',p=>{automaticScene(p,'waterfalls',copy.waterIntro(),['steinsdalsfossen','voringfossen','kjosfossen'].map(id=>state.find(x=>x.id===id)).filter(Boolean));});
 mount('buaEquipment',(p,r)=>{
  title(p,'BUA',copy.buaIntro(),'./images/bua-gear-illustration.webp');
  const controls=el('div','ref-bua-controls');const picker=take(r,'select');if(picker)controls.append(picker);
  const map=take(r,'.bua-map-wrap');if(map)controls.append(map);
  controls.append(action(copy.nearby()+' ›',()=>originalQuery(r,'.bua-map-tools button')[0]?.click()));p.append(controls);
  const credit=el('small','ref-credit',tr('Illustrasjon av turutstyr','Equipment illustration','Ілюстрація спорядження','Illustration av utrustning','Illustration af udstyr'));p.append(credit);
 });
 mount('routeExperiences',p=>{
  const priority=['dovrefjell-wild-reindeer-centre','kistefos','loen-skylift'];const ordered=[...priority.map(id=>experiences.find(x=>x.id===id)).filter(Boolean),...experiences.filter(x=>!priority.includes(x.id))];
  automaticScene(p,'experiences',tr('Oppdag natur, kultur og familieopplevelser.','Explore nature, culture and family attractions.','Природа, культура й розваги Норвегії.','Upptäck natur, kultur och familjeupplevelser.','Oplev natur, kultur og familieattraktioner.'),ordered.filter(x=>src(x)).map(x=>({...x,image:src(x),imageCredit:x.photoCredit?.authorPlain||x.gallery?.[0]?.credit,imageLicense:x.photoCredit?.license||x.gallery?.[0]?.license,imageSource:x.photoCredit?.commonsPage||x.imageSource,open:()=>window.FjordStayGallery?.open(x)})));
  carousel(p,experiences.map(venue),true);
 });
 mount('cafeStops',p=>{const cafes=catalogue.filter(x=>x.category==='cafe');automaticScene(p,'cafes',copy.cafeIntro(),cafes.slice(0,6).map(x=>({...x,image:src(x),imageCredit:x.gallery?.[0]?.credit,imageLicense:x.gallery?.[0]?.license,imageSource:x.gallery?.[0]?.source,open:()=>window.FjordStayGallery?.open(x)})));carousel(p,cafes.map(venue));});
 mount('staysSauna',p=>{const stays=catalogue.filter(x=>['stay','cabin','sauna'].includes(x.category));automaticScene(p,'stays',copy.stayIntro(),stays.filter(x=>src(x)).map(x=>({...x,image:src(x),imageCredit:x.gallery?.[0]?.credit,imageSource:x.gallery?.[0]?.source,open:()=>window.FjordStayGallery?.open(x)})));carousel(p,stays.map(venue));});
 mount('droneExperience',(p,r)=>{title(p,'film',local(originalQuery(r,'.drone-experience-body>p:not(.eyebrow)')[0]?.textContent),'./images/geiranger.jpg');const a=originalQuery(r,'.drone-experience-body>a')[0];if(a)p.append(link(a.textContent,a.href));
 const hero=p.querySelector('.ref-hero'),video=el('video','ref-drone-film');video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';video.poster='./images/hero-lofoten.jpg';video.setAttribute('aria-label',tr('Lofoten fra luften','Lofoten aerial film','Лофотени з повітря','Lofoten från luften','Lofoten fra luften'));hero.prepend(video);
 let visible=false;const reduced=matchMedia('(prefers-reduced-motion:reduce)');const sync=()=>{if(!visible||document.hidden||reduced.matches||navigator.connection?.saveData){video.pause();return;}if(!video.getAttribute('src'))video.src='https://upload.wikimedia.org/wikipedia/commons/transcoded/3/30/LOFOTEN_ISLANDS_-_NORWAY_-_4K_FILM.webm/LOFOTEN_ISLANDS_-_NORWAY_-_4K_FILM.webm.720p.vp9.webm';video.play().catch(()=>{});};
 video.addEventListener('loadedmetadata',()=>{video.currentTime=60});const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.15});observer.observe(video);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sceneDisposers.push(()=>{observer.disconnect();video.pause();video.removeAttribute('src');video.load();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);});
 p.append(link('Danny Rest · Lofoten · CC BY 3.0 ↗','https://commons.wikimedia.org/wiki/File:LOFOTEN_ISLANDS_-_NORWAY_-_4K_FILM.webm'),link('CC BY 3.0 ↗','https://creativecommons.org/licenses/by/3.0/'));const footer=el('div','ref-film-footer');for(const child of [...p.children])if(child.classList.contains('ref-link'))footer.append(child);footer.append(el('small','',tr('Lydløst, beskåret bakgrunnsutsnitt.','Muted, cropped background preview.','Без звуку; кадрування для фонового перегляду.','Ljudlös, beskuren bakgrundsvideo.','Lydløst, beskåret baggrundsudsnit.')));p.append(footer);
});
 mount('norwayCatalogue',p=>{title(p,'around',copy.placesIntro(),'./images/hero-lofoten.jpg');const entries=[
  [tr('Kafeer','Cafes','Кав’ярні','Kaféer','Caféer'),src(catalogue.find(x=>x.category==='cafe')),'cafeStops'],
  [tr('Butikker','Shops','Магазини','Butiker','Butikker'),src(shops[0]),'shoppingCentres'],
  [tr('Parker','Parks','Парки','Parker','Parker'),src(experiences[0]),'routeExperiences'],
  [tr('Hytter','Cabins','Будиночки','Stugor','Hytter'),src(catalogue.find(x=>x.category==='cabin')),'staysSauna'],
  [tr('Lån utstyr','Borrow equipment','Прокат спорядження','Låna utrustning','Lån udstyr'),'./images/bua-gear-illustration.webp','buaEquipment'],
  [tr('Utsiktspunkter','Viewpoints','Оглядові майданчики','Utsiktsplatser','Udsigtspunkter'),state.find(x=>x.id==='trolltunga')?.image,'collection']
 ];grid(p,entries.map(([name,photo,id])=>({name,photo,onPhoto:()=>{location.hash=id;},onInfo:()=>{location.hash=id;}})));
  const free=el('section','ref-finn-free');free.id='finnFree';free.append(el('h3','','FINN · Gis bort'),el('p','',tr('Ting som gis bort. Velg område eller kartområde på FINN.','Items offered for free. Choose an area or map area on FINN.','Речі, які віддають безкоштовно. На FINN виберіть район або область на карті.','Saker som skänks bort. Välj område eller kartområde på FINN.','Ting, der gives væk. Vælg område eller kortområde på FINN.')),link(tr('Se gratis ting på FINN','Browse free items on FINN','Дивитися безкоштовні речі на FINN','Se gratis saker på FINN','Se gratis ting på FINN')+' ↗','https://www.finn.no/recommerce/forsale/search?trade_type=2'));p.append(free);
 });
 mount('shoppingCentres',(p,r)=>{title(p,'shops','',shops[0]?.image?.url);grid(p,shops.slice(0,3).map((x,i)=>({name:x.name,photo:src(x),caption:x.address,onInfo:()=>originalQuery(r,'.shopping-card-open')[i]?.click()})),true);});
 mount('norwayWebcams',(p,r)=>{title(p,'cams',tr('Se været og landskapet før turen.','See the weather and scenery before your trip.','Подивіться на погоду й краєвиди перед поїздкою.','Se vädret och landskapet före resan.','Se vejret og landskabet før turen.'),'./images/hero-bergen.jpg');const cards=originalQuery(r,'.webcam-card');grid(p,cards.slice(0,3).map(c=>({name:c.querySelector('h3')?.textContent||'',photo:c.querySelector('img')?.src,caption:c.querySelector('.webcam-photo-note')?.textContent,url:[...c.querySelectorAll('a[href^="http"]')].at(-1)?.href})),true);});
 mount('municipalNews',(p,r)=>{title(p,'news','', './images/hero-bergen.jpg');for(const selector of ['.news-filters','.news-agenda-period','.news-location','.news-grid','.news-empty','.municipal-facebook','.news-sources','.news-policy']){const node=take(r,selector);if(node)p.append(node);}});
 mount('community',(p,r)=>{title(p,'community','', './images/hero-lofoten.jpg');p.append(link(tr('Facebook-gruppen vår','Our Facebook group','Наша група у Facebook','Vår Facebookgrupp','Vores Facebookgruppe')+' ›','https://www.facebook.com/groups/1579898770109095/'));const stories=document.querySelector('#travelStories');if(stories){preserve(stories);const cards=originalQuery(stories,'.discovery-story-card');grid(p,cards.map((c,i)=>({name:c.querySelector('h3')?.textContent||'',photo:state.find(x=>x.id===['bergen','flam','geiranger'][i])?.image||c.querySelector('img')?.src,onInfo:()=>c.querySelector('button')?.click()})),true);}});
 mount('travelServices',p=>{
 const emergency=el('section','ref-emergency');emergency.setAttribute('aria-label',tr('Nødnumre i Norge','Emergency numbers in Norway','Екстрені номери в Норвегії','Nödnummer i Norge','Alarmnumre i Norge'));
 emergency.append(el('h3','',tr('Nødnumre i Norge','Emergency numbers in Norway','Екстрені номери в Норвегії','Nödnummer i Norge','Alarmnumre i Norge')));
 const numbers=el('div','ref-emergency-numbers');for(const [n,label] of [['113',tr('Ambulanse','Ambulance','Швидка допомога','Ambulans','Ambulance')],['110',tr('Brann','Fire','Пожежні','Brandkår','Brandvæsen')],['112',tr('Politi','Police','Поліція','Polis','Politi')],['116117',tr('Legevakt · ikke livstruende','Urgent care · not life-threatening','Чергова медична служба · без загрози життю','Legevakt · inte livshotande','Lægevagt · ikke livstruende')]]){const a=el('a','',label+' · '+(n==='116117'?'116 117':n));a.href='tel:'+n;numbers.append(a);}emergency.append(numbers);
 const sources=el('div','ref-emergency-sources');sources.append(link('Helsenorge ↗','https://www.helsenorge.no/hjelpetilbud-i-kommunene/legevakt/'),link('DSB ↗','https://www.dsb.no/brannsikkerhet/nodmelding/110-sentralene/'),link('Politiet ↗','https://www.politiet.no/kontakt-politiet/ring-politiet'));emergency.append(sources);p.append(emergency);

 const servicePriority=['medical-emergency','fire-emergency','viking','redgo','naf','gjensidige','if-insurance','tryg','fremtind'];
 const services=[...apps,...extraServices].sort((a,b)=>(servicePriority.includes(a.id)?servicePriority.indexOf(a.id):-1+100)-(servicePriority.includes(b.id)?servicePriority.indexOf(b.id):-1+100)).map(x=>({...x,...serviceArtwork.find(a=>a.id===x.id),website:x.url,details:x.details||tr('Åpne den offisielle tjenesten for aktuelle muligheter, vilkår og tilgjengelighet. Personlige tjenester håndteres hos leverandøren.','Open the official service for current options, terms and availability. Personal services are handled by the provider.','Відкрийте офіційний сервіс, щоб перевірити актуальні можливості, умови й доступність. Особисті послуги надаються безпосередньо на сайті оператора.','Öppna den officiella tjänsten för aktuella alternativ, villkor och tillgänglighet. Personliga tjänster hanteras hos leverantören.','Åbn den officielle tjeneste for aktuelle muligheder, vilkår og tilgængelighed. Personlige tjenester håndteres hos udbyderen.'),open:()=>window.open(x.url,'_blank','noopener,noreferrer')}));
 const hero=automaticScene(p,'services',tr('Nyttige tjenester for reisen og hverdagen.','Useful services for travel and daily life.','Корисні сервіси для подорожей і повсякденного життя.','Nyttiga tjänster för resan och vardagen.','Nyttige tjenester til rejsen og hverdagen.'),services);hero.classList.add('ref-service-scene');
 });
 mount('travelUpdates',(p,r)=>{title(p,'road');const g=el('div','ref-utility-grid'),weather=el('article','ref-app');weather.append(el('h3','',tr('Vær','Weather','Погода','Väder','Vejr')));const current=document.querySelector('#homePanel .explorer-weather-row');if(current)weather.append(current.cloneNode(true));weather.append(link(copy.more()+' ›','https://open-meteo.com/'));g.append(weather);for(const old of originalQuery(r,'.travel-update-card')){const card=el('article','ref-app');card.append(image(!!old.querySelector('a[href*="norges-bank"]')?'./images/ui/coins.svg':'./images/ui/fuel.svg'),el('h3','',old.querySelector('h3')?.textContent||''));const a=old.querySelector('a');if(a)card.append(link(a.textContent,a.href));g.append(card);}const roads=el('article','ref-app');roads.append(image('./images/ui/car-front.svg'),el('h3','',tr('Veier','Roads','Дороги','Vägar','Veje')),link(copy.more()+' ›','https://www.vegvesen.no/trafikk'));g.append(roads);p.append(g);});
 mount('norwayOverview',(p,r)=>{title(p,'map',copy.placesIntro());for(const e of originalQuery(r,'.map-showcase,.norway-overview__controls,.norway-overview__providers,.norway-overview__canvas,.norway-overview__status'))p.append(e);});
 const main=document.getElementById('journeys');for(const id of ['travelUpdates','travelServices']){const section=document.getElementById(id);if(section&&section.parentNode===main)main.append(section);}
 const credits=document.querySelector('#creditsList');if(credits&&!credits.querySelector('.ref-photo-credits')){const group=el('div','ref-photo-credits');group.append(el('h3','','FJORD FLOW · Photo sources'));const used=new Set([...document.querySelectorAll('.ref-panel img')].map(i=>new URL(i.src,document.baseURI).pathname));const records=[...state.flatMap(x=>[{...x,src:x.image,credit:x.imageCredit,license:x.imageLicense,source:x.imageSource},...(x.gallery||[]).map(y=>({...y,src:y.image,credit:y.imageCredit,license:y.imageLicense,source:y.imageSource}))]),...catalogue.flatMap(x=>x.gallery||[]),...shops.flatMap(x=>x.gallery||[]),...experiences.map(x=>({src:src(x),credit:x.photoCredit?.authorPlain,license:x.photoCredit?.license,source:x.photoCredit?.commonsPage})),...Object.values(window.FjordTripTools?.localRoutes||{}).flatMap(r=>(r.photos||[]).map(x=>({...x,src:x.image,credit:x.author})))];const seen=new Set();for(const x of records){if(!x.src||!used.has(new URL(x.src,document.baseURI).pathname)||seen.has(x.src))continue;seen.add(x.src);const p=el('p','',(x.credit||'')+' · '+(x.license||''));if(x.source)p.append(' · ',link('Source',x.source));group.append(p);}group.append(el('p','','BUA equipment image: AI-generated illustration, not a photograph of a BUA location. Service icons: official providers; Coop icon represents Coopay. Lucide utility icons: ISC licence.'));credits.append(group);}
 document.body.classList.add('reference-layout');window.dispatchEvent(new Event('fjord:sections-changed'));
}
renderAll();
requestAnimationFrame(()=>requestAnimationFrame(()=>{const target=document.getElementById(location.hash.slice(1));target?.scrollIntoView({block:'start',behavior:'instant'});}));
window.addEventListener('fjordlanguagechange',renderAll);
let frame=0;
new MutationObserver(records=>{if(records.every(r=>r.target.closest?.('.ref-panel')||[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType!==1||n.classList.contains('hero-artwork')||n.classList.contains('ref-panel'))))return;if(!frame)frame=requestAnimationFrame(()=>{frame=0;if([...document.querySelectorAll('.ref-chapter')].some(r=>!r.querySelector(':scope>.ref-panel')))renderAll();});}).observe(document.getElementById('journeys'),{childList:true,subtree:true});
