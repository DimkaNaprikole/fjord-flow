/* A small, automatically growing overview of the local catalogue. No location permission. */
(() => {
  'use strict';
  const categories = ['cafe', 'cabin', 'sauna', 'rest'];
  const validPoint = p => !!p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
  const filterPlaces = (rows, category = 'all') => Array.isArray(rows) ? rows.filter(p => validPoint(p) && categories.includes(p.category) && (category === 'all' || p.category === category)) : [];
  function safeURL(value) {
    try {const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;} catch {return null;}
  }
  const routePoints = route => Array.isArray(route?.points) ? route.points.filter(validPoint) : [];
  if (typeof window === 'undefined') {if (typeof module !== 'undefined') module.exports = {validPoint, filterPlaces, safeURL, routePoints}; return;}
  const texts = {
    nb: ['Hele Norge, nærmere', 'Finn stoppene på kartet', 'Se kafeer, hytter, badstuer og fine pauser i vår egen katalog. Nye katalogsteder vises automatisk her.', 'Alle', 'Kafeer', 'Hytter', 'Badstuer', 'Fine pauser', 'Alle ruter', 'Vis hele utvalget', 'Åpne i katalogen', 'Nettsted', 'Laster kartet…', 'Kartet kunne ikke lastes.', 'Prøv igjen', 'Ingen steder i dette utvalget.', 'Stiplede linjer viser skjematiske forbindelser, ikke kjøreveier. Åpne ruten for veibeskrivelse.', 'steder', 'Velg rute', 'Kart over steder i Norge'],
    en: ['All Norway, closer', 'Find your stops on the map', 'Explore cafés, cabins, saunas and worthwhile breaks in our own catalogue. New catalogue places appear here automatically.', 'All', 'Cafés', 'Cabins', 'Saunas', 'Places to unwind', 'All routes', 'Show all places', 'Open in catalogue', 'Website', 'Loading map…', 'The map could not be loaded.', 'Try again', 'No places in this selection.', 'Dashed lines are schematic connections, not driving roads. Open the route for directions.', 'places', 'Choose route', 'Map of places in Norway'],
    uk: ['Уся Норвегія — ближче', 'Знайдіть зупинки на карті', 'Кав’ярні, будиночки, сауни й гарні зупинки з нашого каталогу. Нові місця автоматично з’являються тут.', 'Усі', 'Кав’ярні', 'Будиночки', 'Сауни', 'Місця відпочинку', 'Усі маршрути', 'Показати всі місця', 'Відкрити в каталозі', 'Сайт', 'Завантажуємо карту…', 'Не вдалося завантажити карту.', 'Спробувати ще', 'У цьому виборі немає місць.', 'Пунктир — схематичні зв’язки, а не автомобільні дороги. Для навігації відкрийте маршрут.', 'місць', 'Оберіть маршрут', 'Карта місць у Норвегії'],
    sv: ['Hela Norge, närmare', 'Hitta stoppen på kartan', 'Utforska kaféer, stugor, bastur och fina pauser i vår egen katalog. Nya katalogplatser visas automatiskt här.', 'Alla', 'Kaféer', 'Stugor', 'Bastur', 'Fina pauser', 'Alla rutter', 'Visa alla platser', 'Öppna i katalogen', 'Webbplats', 'Laddar kartan…', 'Kartan kunde inte laddas.', 'Försök igen', 'Inga platser i detta urval.', 'Streckade linjer visar schematiska förbindelser, inte bilvägar. Öppna rutten för vägbeskrivning.', 'platser', 'Välj rutt', 'Karta över platser i Norge'],
    da: ['Hele Norge, tættere på', 'Find stoppene på kortet', 'Udforsk caféer, hytter, saunaer og fine pauser i vores eget katalog. Nye katalogsteder vises automatisk her.', 'Alle', 'Caféer', 'Hytter', 'Saunaer', 'Fine pauser', 'Alle ruter', 'Vis alle steder', 'Åbn i kataloget', 'Hjemmeside', 'Indlæser kort…', 'Kortet kunne ikke indlæses.', 'Prøv igen', 'Ingen steder i dette udvalg.', 'Stiplede linjer viser skematiske forbindelser, ikke bilveje. Åbn ruten for vejvisning.', 'steder', 'Vælg rute', 'Kort over steder i Norge']
  };
  const colors = {cafe:'#f6bf75', cabin:'#89d4bb', sauna:'#f19f91', rest:'#90c9ed'};
  const lang = () => texts[window.FjordI18n?.language || document.documentElement.lang] ? (window.FjordI18n?.language || document.documentElement.lang) : 'nb';
  const t = () => texts[lang()];
  const localized = v => typeof v === 'string' ? v : v?.[lang()] || v?.nb || v?.en || '';
  const el = (tag, cls, text) => {const e = document.createElement(tag); if(cls)e.className=cls; if(text)e.textContent=text; return e;};
  const section = el('section', 'norway-overview'); section.id = 'norwayOverview';
  const eyebrow=el('p','norway-overview__eyebrow'), title=el('h2'), intro=el('p','norway-overview__intro'); title.id='norwayOverviewTitle'; section.setAttribute('aria-labelledby',title.id);
  const controls=el('div','norway-overview__controls'), filters=el('div','norway-overview__filters'), select=el('select'), allButton=el('button'), routeButton=el('button'), status=el('p','norway-overview__status'), canvas=el('div','norway-overview__canvas'), note=el('p','norway-overview__note');
  status.setAttribute('role','status'); canvas.id='norwayOverviewCanvas'; canvas.setAttribute('role','region');
  const providerControls=el('div','norway-overview__providers'), googleButton=el('button','','Google Maps · 3D'), flatButton=el('button','','2D'), fullButton=el('button','','⛶');
  const googleCanvas=el('div','norway-overview__canvas norway-overview__google'), details=el('div','norway-overview__details');
  const standardCanvas=el('div','norway-overview__canvas norway-overview__standard'),standardButton=el('button','','Google Maps'),locationButton=el('button','','◎'),typeControls=el('div','norway-overview__providers');
  standardCanvas.id='norwayStandardCanvas';standardCanvas.hidden=true;typeControls.hidden=true;
  googleCanvas.id='norwayGoogleCanvas';googleCanvas.hidden=true;details.hidden=true;
  // Let the page scroll over the map; keep click-and-drag panning.
  [standardCanvas,googleCanvas].forEach(host=>host.addEventListener('wheel',event=>event.stopImmediatePropagation(),{capture:true,passive:true}));
  const googleConfig=window.FjordGoogleMapConfig || {};providerControls.hidden=googleConfig.enabled!==true;
  for(const button of [googleButton,flatButton,fullButton])button.type='button';
  standardButton.type='button';locationButton.type='button';
  providerControls.append(standardButton,googleButton,locationButton);
  controls.append(filters,select,routeButton,allButton); section.append(eyebrow,title,intro,controls,providerControls,typeControls,status,canvas,standardCanvas,googleCanvas,details,note);
  const footer=document.querySelector('footer'); if(footer)footer.before(section); else document.querySelector('main')?.append(section);
  let rows=[], category='all', routeKey='', loaded=false, loading=false;
  let googleMap=null, googleActive=false, googleLoading=false, googleGeneration=0;
  let standardMap=null,standardActive=false,standardLoading=false,mapType='hybrid',standardGeneration=0;
  const ui={nb:['Kart','Satellitt','Terreng','Min posisjon','Vis meg på kartet','Kunne ikke finne posisjonen. Prøv Chrome eller velg en rute.','Zoom med + / −. Dra kartet for å flytte. Musehjulet ruller siden.'],en:['Map','Satellite','Terrain','My location','Show me on the map','Location unavailable. Try Chrome or choose a route.','Zoom with + / −. Drag to move the map. The mouse wheel scrolls the page.'],uk:['Карта','Супутник','Рельєф','Де я','Показати мене на карті','Не вдалося визначити місце. Спробуйте Chrome або оберіть маршрут.','Масштаб — кнопками + / −. Перетягуйте карту мишею. Колесо прокручує сторінку.'],sv:['Karta','Satellit','Terräng','Min position','Visa mig på kartan','Positionen kunde inte hittas. Prova Chrome eller välj en rutt.','Zooma med + / −. Dra för att flytta kartan. Mushjulet rullar sidan.'],da:['Kort','Satellit','Terræn','Min position','Vis mig på kortet','Positionen kunne ikke findes. Prøv Chrome eller vælg en rute.','Zoom med + / −. Træk for at flytte kortet. Musehjulet ruller siden.']};
  const googleCopy={nb:['Fullskjerm','Google 3D kunne ikke åpnes. Vanlig kart er fortsatt tilgjengelig.','Satellitt og 3D. Velg en markør for foto og informasjon.'],en:['Full screen','Google 3D could not open. The standard map is still available.','Satellite and 3D. Select a marker for photographs and details.'],uk:['На весь екран','Не вдалося відкрити Google 3D. Звичайна карта залишається доступною.','Супутник і 3D. Оберіть позначку для фото й інформації.'],sv:['Helskärm','Google 3D kunde inte öppnas. Den vanliga kartan finns kvar.','Satellit och 3D. Välj en markör för bilder och information.'],da:['Fuld skærm','Google 3D kunne ikke åbnes. Det almindelige kort er stadig tilgængeligt.','Satellit og 3D. Vælg en markør for billeder og oplysninger.']};
  const routes=()=>window.FjordTripTools?.localRoutes || {};
  function labels() {
    const a=t(); eyebrow.textContent=a[0];title.textContent=a[1];intro.textContent=a[2];note.textContent=a[16];canvas.setAttribute('aria-label',a[19]);select.setAttribute('aria-label',a[18]);allButton.textContent=a[9];allButton.type='button';routeButton.type='button';routeButton.textContent=({nb:'Åpne ruten',en:'Open route',uk:'Відкрити маршрут',sv:'Öppna rutten',da:'Åbn ruten'})[lang()];routeButton.hidden=!routeKey;
    fullButton.textContent='⛶ '+googleCopy[lang()][0];googleCanvas.setAttribute('aria-label','Google Maps 3D');googleCanvas.setAttribute('role','region');
    googleButton.setAttribute('aria-pressed',String(googleActive));flatButton.setAttribute('aria-pressed',String(!googleActive));if(googleActive)note.textContent=googleCopy[lang()][2];
    standardButton.setAttribute('aria-pressed',String(standardActive));flatButton.setAttribute('aria-pressed',String(!googleActive&&!standardActive));locationButton.textContent='◎ '+ui[lang()][3];locationButton.title=ui[lang()][4];
    typeControls.hidden=!standardActive;typeControls.replaceChildren();['roadmap','hybrid','terrain'].forEach((type,i)=>{const b=el('button','',ui[lang()][i]);b.type='button';b.setAttribute('aria-pressed',String(mapType===type));b.addEventListener('click',()=>{mapType=type;standardMap?.setType(type);labels();});typeControls.append(b);});
    if(googleActive){typeControls.hidden=false;typeControls.replaceChildren();[1,-1].forEach(direction=>{const b=el('button','',direction>0?'+':'−');b.type='button';b.setAttribute('aria-label',direction>0?'Zoom in':'Zoom out');b.addEventListener('click',()=>googleMap?.zoom(direction));typeControls.append(b);});}
    if(!googleActive)note.textContent=ui[lang()][6];
    filters.replaceChildren(); ['all',...categories].forEach((key,i)=>{const b=el('button','',a[i+3]);b.type='button';b.setAttribute('aria-pressed',String(category===key)); if(key!=='all')b.style.setProperty('--map-category',colors[key]); b.addEventListener('click',()=>{category=key;labels();if(loaded)draw(true);});filters.append(b);});
    select.replaceChildren(); const first=el('option','',a[8]);first.value='';select.append(first);
    Object.entries(routes()).filter(([,r])=>routePoints(r).length>1).forEach(([key,r])=>{const option=el('option','',localized(r.title)||r.label||key);option.value=key;select.append(option);});select.value=routeKey;
    if(loaded)draw(false); else if(!loading)status.textContent=a[12];
  }
  function popup(p) {
    const box=el('div','norway-overview__popup');
    if(/^\.\/images\/[a-z0-9_./% -]+$/i.test(p.image || '') && !p.image.includes('..')) {const img=el('img');img.src=p.image;img.alt=p.photoAlt||p.name;img.loading='lazy';box.append(img);if(p.photoCaption){const credit=el('small','norway-overview__credit',localized(p.photoCaption));box.append(credit);}}
    const credit=p.gallery?.find(g=>g.src===p.image)||p.gallery?.[0];
    if(credit){const caption=el('small','norway-overview__credit',[credit.credit,credit.license].filter(Boolean).join(' · ')),source=safeURL(credit.source);if(source){const a=el('a','',caption.textContent+' ↗');a.href=source;a.target='_blank';a.rel='noopener noreferrer';caption.replaceChildren(a);}box.append(caption);}
    box.append(el('strong','',p.name),el('p','',[p.town,t()[4+categories.indexOf(p.category)]].filter(Boolean).join(' · ')));
    if(p.coordinateLabel)box.append(el('p','norway-overview__access',p.coordinateLabel));
    const open=el('button','',t()[10]);open.type='button';open.addEventListener('click',()=>{details.hidden=true;window.dispatchEvent(new CustomEvent(p.destinationId?'fjord:open-place':'fjord:catalogue-select',{detail:{id:p.destinationId||p.id}}));});box.append(open);
    const drive=el('a','',({nb:'Kjør hit',en:'Directions',uk:'Прокласти маршрут',sv:'Vägbeskrivning',da:'Rutevejledning'})[lang()]+' ↗');drive.href=safeURL(p.directionsUrl)||'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(p.routeQuery||p.latitude+','+p.longitude);drive.target='_blank';drive.rel='noopener noreferrer';box.append(drive);
    const website=safeURL(p.website);if(website){const link=el('a','',t()[11]+' ↗');link.href=website;link.target='_blank';link.rel='noopener noreferrer';box.append(link);}
    return box;
  }
  function draw(fit) {
    if(standardActive&&standardMap){const route=routes()[routeKey],count=standardMap.render(rows,route,category,fit);status.textContent=count+' '+t()[17]+(route?' · '+localized(route.title):'');return;}
    if(googleActive && googleMap){const route=routes()[routeKey],count=googleMap.render(rows,route,category);status.textContent=count+' '+t()[17]+(route?' · '+localized(route.title):'');return;}

  }
  function flatView(error=false){
    standardGeneration++;googleGeneration++;googleActive=false;googleCanvas.hidden=true;canvas.hidden=true;details.hidden=true;
    standardActive=Boolean(standardMap);standardCanvas.hidden=!standardActive;
    labels();
    if(standardActive){standardMap.resize();draw(true);}
    if(error){status.textContent=t()[13]+' ';const retry=el('button','',t()[14]);retry.type='button';retry.onclick=()=>standardButton.click();status.append(retry);}
  }
  googleButton.addEventListener('click',async()=>{
    if(googleConfig.enabled!==true||googleLoading)return;
    if(!loaded){await load();if(!loaded)return;}
    standardGeneration++;standardActive=false;standardCanvas.hidden=true;
    const generation=++googleGeneration;googleLoading=true;googleButton.disabled=true;status.textContent=t()[12];
    try{
      googleCanvas.hidden=false;
      if(!googleMap){const created=await window.FjordGoogleNorwayMap.create(googleCanvas,{enabled:true,userActivated:true,apiKey:googleConfig.apiKey,language:lang(),onPlaceClick:p=>{details.replaceChildren(popup(p));details.hidden=false;},onError:()=>{googleMap?.destroy();googleMap=null;flatView(true);}});if(generation!==googleGeneration){created.destroy();return;}googleMap=created;}
      if(generation!==googleGeneration)return;googleActive=true;canvas.hidden=true;details.hidden=true;labels();draw(true);
    }catch{googleMap?.destroy();googleMap=null;flatView(true);}
    finally{googleLoading=false;googleButton.disabled=false;}
  });
  flatButton.addEventListener('click',()=>flatView());
  standardButton.addEventListener('click',async()=>{
    if(googleConfig.enabled!==true||standardLoading)return;
    if(!loaded){await load();if(!loaded)return;}
    const generation=++standardGeneration;googleGeneration++;googleActive=false;googleCanvas.hidden=true;standardCanvas.hidden=false;standardLoading=true;standardButton.disabled=true;status.textContent=t()[12];
    try{if(!standardMap)standardMap=await window.FjordGoogleStandardMap.create(standardCanvas,{...googleConfig,userActivated:true,scrollwheel:false,language:lang(),buildInfo:popup});if(generation!==standardGeneration)return;standardActive=true;canvas.hidden=true;details.hidden=true;standardMap.resize();labels();draw(true);}
    catch{flatView(true);}finally{standardLoading=false;standardButton.disabled=false;}
  });
  locationButton.addEventListener('click',async()=>{
    if(!standardActive){standardButton.click();}
    locationButton.disabled=true;
    try{if(!window.FjordBrowserGeolocation)throw Error('Location unavailable');const p=await window.FjordBrowserGeolocation.locate({userInitiated:true}).promise;if(!standardMap)throw Error('Map unavailable');standardMap.locate({latitude:p.coords.latitude,longitude:p.coords.longitude});}
    catch{status.textContent=ui[lang()][5];}finally{locationButton.disabled=false;}
  });
  async function load() {
    if(loading||loaded)return; loading=true;status.textContent=t()[12];
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch('./norway-catalog.json?v=9',{signal:controller.signal});if(!response.ok)throw Error('Catalogue '+response.status);
      const data=await response.json();if(!Array.isArray(data))throw Error('Invalid catalogue');rows=data;
      try{const extra=await fetch('./map-attractions.json?v=1',{signal:controller.signal});if(extra.ok){const attractions=await extra.json();if(Array.isArray(attractions))rows=rows.concat(attractions.filter(validPoint));}}catch{/* Catalogue remains available if attraction data cannot load. */}
      loaded=true; canvas.hidden=true; labels();draw(true);
    } catch {status.textContent=t()[13]+' ';const retry=el('button','',t()[14]);retry.type='button';retry.addEventListener('click',load);status.append(retry);}
    finally{clearTimeout(timeout);loading=false;}
  }
  routeButton.addEventListener('click',()=>{const trigger=[...document.querySelectorAll('[data-roadtrip]')].find(b=>b.dataset.roadtrip===routeKey);trigger?.click();});
  select.addEventListener('change',()=>{routeKey=select.value;routeButton.hidden=!routeKey;draw(true);});allButton.addEventListener('click',()=>{category='all';routeKey='';labels();if(loaded)draw(true);else load();});
  window.addEventListener('fjordlanguagechange',labels);labels();
  async function loadDefault(){await load();if(loaded&&googleConfig.enabled===true&&!standardActive&&!standardLoading&&!googleActive)standardButton.click();}
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();loadDefault();}},{rootMargin:'100px'});observer.observe(section);} else load();
})();
