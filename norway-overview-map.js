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
  controls.append(filters,select,routeButton,allButton); section.append(eyebrow,title,intro,controls,status,canvas,note);
  const footer=document.querySelector('footer'); if(footer)footer.before(section); else document.querySelector('main')?.append(section);
  let rows=[], category='all', routeKey='', map=null, markers=null, lines=null, loaded=false, loading=false;
  const routes=()=>window.FjordTripTools?.localRoutes || {};
  function labels() {
    const a=t(); eyebrow.textContent=a[0];title.textContent=a[1];intro.textContent=a[2];note.textContent=a[16];canvas.setAttribute('aria-label',a[19]);select.setAttribute('aria-label',a[18]);allButton.textContent=a[9];allButton.type='button';routeButton.type='button';routeButton.textContent=({nb:'Åpne ruten',en:'Open route',uk:'Відкрити маршрут',sv:'Öppna rutten',da:'Åbn ruten'})[lang()];routeButton.hidden=!routeKey;
    filters.replaceChildren(); ['all',...categories].forEach((key,i)=>{const b=el('button','',a[i+3]);b.type='button';b.setAttribute('aria-pressed',String(category===key)); if(key!=='all')b.style.setProperty('--map-category',colors[key]); b.addEventListener('click',()=>{category=key;labels();if(loaded)draw(true);});filters.append(b);});
    select.replaceChildren(); const first=el('option','',a[8]);first.value='';select.append(first);
    Object.entries(routes()).filter(([,r])=>routePoints(r).length>1).forEach(([key,r])=>{const option=el('option','',localized(r.title)||r.label||key);option.value=key;select.append(option);});select.value=routeKey;
    if(loaded)draw(false); else if(!loading)status.textContent=a[12];
  }
  function popup(p) {
    const box=el('div','norway-overview__popup');
    if(/^\.\/images\/[a-z0-9_./% -]+$/i.test(p.image || '') && !p.image.includes('..')) {const img=el('img');img.src=p.image;img.alt=p.photoAlt||p.name;img.loading='lazy';box.append(img);if(p.photoCaption){const credit=el('small','norway-overview__credit',p.photoCaption);box.append(credit);}}
    const credit=p.gallery?.find(g=>g.src===p.image)||p.gallery?.[0];
    if(credit){const caption=el('small','norway-overview__credit',[credit.credit,credit.license].filter(Boolean).join(' · ')),source=safeURL(credit.source);if(source){const a=el('a','',caption.textContent+' ↗');a.href=source;a.target='_blank';a.rel='noopener noreferrer';caption.replaceChildren(a);}box.append(caption);}
    box.append(el('strong','',p.name),el('p','',[p.town,t()[4+categories.indexOf(p.category)]].filter(Boolean).join(' · ')));
    const open=el('button','',t()[10]);open.type='button';open.addEventListener('click',()=>{map.closePopup();window.dispatchEvent(new CustomEvent('fjord:catalogue-select',{detail:{id:p.id}}));});box.append(open);
    const website=safeURL(p.website);if(website){const link=el('a','',t()[11]+' ↗');link.href=website;link.target='_blank';link.rel='noopener noreferrer';box.append(link);}
    return box;
  }
  function draw(fit) {
    if(!map)return; markers.clearLayers();lines.clearLayers();
    const visible=filterPlaces(rows,category); visible.forEach(p=>{
      const icon=window.L.divIcon({className:'norway-overview__pin',html:'<span style="background:'+colors[p.category]+'"></span>',iconSize:[22,22],iconAnchor:[11,11]});
      const marker=window.L.marker([p.latitude,p.longitude],{icon,keyboard:true,title:p.name,alt:p.name,riseOnHover:true}).bindPopup(()=>popup(p),{maxWidth:270});marker.addTo(markers);
    });
    let focus=[];
    const route=routes()[routeKey];
    if(route){focus=routePoints(route).map(p=>[p.latitude,p.longitude]);if(focus.length>1)window.L.polyline(focus,{color:'#d7ecf1',weight:3,opacity:.9,dashArray:'6 9',interactive:false}).addTo(lines);}
    status.textContent=visible.length ? visible.length+' '+t()[17]+(route?' · '+localized(route.title):'') : t()[15];
    if(fit){const points=focus.length?focus:visible.map(p=>[p.latitude,p.longitude]);if(points.length)map.fitBounds(points,{padding:[30,30],maxZoom:12});else map.setView([65,14],4);}
  }
  async function load() {
    if(loading||loaded)return; loading=true;status.textContent=t()[12];
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),12000);
    try {
      if(!window.L)throw Error('Leaflet unavailable');
      const response=await fetch('./norway-catalog.json?v=8',{signal:controller.signal});if(!response.ok)throw Error('Catalogue '+response.status);
      const data=await response.json();if(!Array.isArray(data))throw Error('Invalid catalogue');rows=data;
      if(!map){map=window.L.map(canvas,{scrollWheelZoom:false});window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);markers=window.L.layerGroup().addTo(map);lines=window.L.layerGroup().addTo(map);}
      loaded=true; labels();map.invalidateSize();draw(true);
    } catch {status.textContent=t()[13]+' ';const retry=el('button','',t()[14]);retry.type='button';retry.addEventListener('click',load);status.append(retry);}
    finally{clearTimeout(timeout);loading=false;}
  }
  routeButton.addEventListener('click',()=>{const trigger=[...document.querySelectorAll('[data-roadtrip]')].find(b=>b.dataset.roadtrip===routeKey);trigger?.click();});
  select.addEventListener('change',()=>{routeKey=select.value;routeButton.hidden=!routeKey;draw(true);});allButton.addEventListener('click',()=>{category='all';routeKey='';labels();if(loaded)draw(true);else load();});
  window.addEventListener('fjordlanguagechange',labels);labels();
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}},{rootMargin:'250px'});observer.observe(section);} else load();
})();
