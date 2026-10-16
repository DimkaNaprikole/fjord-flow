/* A complete route, rather than only its final destination. */
(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'itineraryDialog';
  dialog.setAttribute('aria-labelledby', 'itineraryTitle');
  dialog.innerHTML = `<header class="itinerary-header"><div><p class="eyebrow">YOUR JOURNEY, STOP BY STOP</p><h2 id="itineraryTitle"></h2><p id="itineraryOrder" data-i18n-ignore></p></div><button id="itineraryClose" type="button" aria-label="Close itinerary">×</button></header>
    <div class="itinerary-layout"><section class="itinerary-map-panel"><div id="itineraryMap" aria-label="Map of the whole itinerary"></div><p id="itineraryStatus" role="status"></p><p class="itinerary-notice">Driving estimates exclude visits, hikes, ferries and current road conditions. Check seasonal mountain-road closures before travelling.</p><a id="itineraryNavigation" class="button" target="_blank" rel="noopener noreferrer">Open full route in Google Maps ↗</a><button id="itineraryFit" class="text-link" type="button">Show the whole route</button></section><section><h3>All stops along the way</h3><ol id="itineraryStops"></ol></section></div>`;
  document.body.append(dialog);
  let map, layer, routeLine, activePoints = [], requestId = 0, controller, activeKey, activeButton, experiences = [];
  const chosen = new Set();
  const languages = ['en','nb','uk','sv','da'];
  const extraText = new Map([
    'Optional experiences|Valgfrie opplevelser|Додаткові враження|Valfria upplevelser|Valgfrie oplevelser',
    'Update route|Oppdater rute|Оновити маршрут|Uppdatera rutt|Opdater rute',
    'Choose optional stops, then update the route.|Velg valgfrie stopp og oppdater ruten.|Виберіть додаткові зупинки й оновіть маршрут.|Välj valfria stopp och uppdatera rutten.|Vælg valgfrie stop og opdater ruten.',
    'Official information ↗|Offisiell informasjon ↗|Офіційна інформація ↗|Officiell information ↗|Officiel information ↗',
    'Plan access separately; see the operator.|Planlegg adkomsten separat; se arrangørens informasjon.|Доступ сплануйте окремо за інформацією організатора.|Planera tillträdet separat; se arrangörens information.|Planlæg adgangen separat; se arrangørens information.',
    'No extra stops for this route.|Ingen ekstra stopp for denne ruten.|Немає додаткових зупинок для цього маршруту.|Inga extra stopp för denna rutt.|Ingen ekstra stop til denne rute.',
    'Experience information unavailable. Open the route again to retry.|Opplevelsesinformasjon utilgjengelig. Åpne ruten igjen for å prøve på nytt.|Інформація недоступна. Відкрийте маршрут знову.|Upplevelseinformation saknas. Öppna rutten igen.|Oplevelsesinformation mangler. Åbn ruten igen.',
    'Selections changed — update the route.|Valgene er endret — oppdater ruten.|Вибір змінено — оновіть маршрут.|Valen har ändrats — uppdatera rutten.|Valgene er ændret — opdater ruten.',
    'Family discoveries — several days|Familieopplevelser — flere dager|Сімейні пригоди — кілька днів|Familjeupplevelser — flera dagar|Familieoplevelser — flere dage',
    'Through Østerdalen|Gjennom Østerdalen|Через Østerdalen|Genom Østerdalen|Gennem Østerdalen',
    'Driving only; visits and waiting are extra.|Kun kjøring; besøk og venting kommer i tillegg.|Лише їзда; відвідування й очікування додатково.|Endast körning; besök och väntan tillkommer.|Kun kørsel; besøg og ventetid kommer oveni.',
    'Required route coordinates are unavailable. No route was calculated.|Nødvendige rutekoordinater mangler. Ingen rute ble beregnet.|Відсутні необхідні координати. Маршрут не обчислено.|Nödvändiga koordinater saknas. Ingen rutt beräknades.|Nødvendige koordinater mangler. Ingen rute blev beregnet.',
    'Navigation leg|Navigasjonsetappe|Етап навігації|Navigeringsetapp|Navigationsetape'
  ].map(row => {const values=row.split('|');return [values[0],values];}));
  const language = () => window.FjordI18n?.language || 'en';
  const et = source => extraText.get(source)?.[Math.max(0,languages.indexOf(language()))] || source;
  const localized = value => typeof value === 'object' && value ? value[language()] || value.en || value.nb || '' : value || '';
  const valid = p => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude)<=90 && Math.abs(p.longitude)<=180;
  const customRoutes = {
    family:{origin:'oslo',required:['kistefos','hunderfossen'],title:'Family discoveries — several days'},
    osterdalen:{origin:'oslo',required:['storelgen'],destination:'roros',title:'Through Østerdalen'}
  };
  const extraPanel = document.createElement('section');extraPanel.className='itinerary-extras';extraPanel.dataset.i18nIgnore='';
  extraPanel.innerHTML='<h3 id="itineraryExtrasTitle"></h3><p id="itineraryExtrasHint"></p><div id="itineraryChoices"></div><button id="itineraryUpdate" class="button" type="button"></button><p id="itineraryExtrasError" role="status"></p>';
  dialog.querySelector('.itinerary-header').after(extraPanel);
  const legLinks=document.createElement('div');legLinks.id='itineraryLegs';legLinks.dataset.i18nIgnore='';document.getElementById('itineraryNavigation').after(legLinks);
  const official = p => {try{const u=new URL(p.website);return u.protocol==='https:'?u.href:null;}catch{return null;}};
  const node = (tag,value,cls) => {const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e;};
  function extraChoices(key,failed=false){
    document.getElementById('itineraryExtrasTitle').textContent=et('Optional experiences');
    document.getElementById('itineraryExtrasHint').textContent=et('Choose optional stops, then update the route.');
    document.getElementById('itineraryUpdate').textContent=et('Update route');
    document.getElementById('itineraryExtrasError').textContent=failed?et('Experience information unavailable. Open the route again to retry.'):'';
    const box=document.getElementById('itineraryChoices');box.replaceChildren();
    const route=customRoutes[key]?'east':key, required=customRoutes[key]?.required||[];
    const items=experiences.filter(p=>Array.isArray(p.routes)&&p.routes.includes(route)&&!required.includes(p.id));
    if(!items.length)box.append(node('p',et('No extra stops for this route.')));
    for(const p of items){const label=node('label',undefined,'itinerary-choice'),check=node('input');check.type='checkbox';check.value=p.id;check.checked=chosen.has(p.id);check.disabled=!valid(p);const copy=node('span');copy.append(node('b',localized(p.name)),node('small',localized(p.area)||localized(p.address)),node('small',localized(p.season)));if(!valid(p))copy.append(node('small',et('Plan access separately; see the operator.')));const url=official(p);if(url){const a=node('a',et('Official information ↗'));a.href=url;a.target='_blank';a.rel='noopener noreferrer';copy.append(a);}label.append(check,copy);box.append(label);check.onchange=()=>{check.checked?chosen.add(p.id):chosen.delete(p.id);requestId++;controller?.abort();document.getElementById('itineraryNavigation').removeAttribute('href');legLinks.replaceChildren();if(routeLine){layer.removeLayer(routeLine);routeLine=null;}document.getElementById('itineraryStatus').textContent=et('Selections changed — update the route.');};}
  }
  function withExtras(base){
    const result=[...base];
    // Project each optional point onto the nearest segment; base stops retain their order.
    const distance=(p,a,b)=>{const scale=Math.cos(p.latitude*Math.PI/180),ax=(a.longitude-p.longitude)*scale,ay=a.latitude-p.latitude,bx=(b.longitude-p.longitude)*scale,by=b.latitude-p.latitude,dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));return Math.hypot(ax+t*dx,ay+t*dy);};
    for(const p of experiences.filter(p=>chosen.has(p.id)&&valid(p))){if(result.some(q=>q.id===p.id))continue;let index=p.insertAfter?result.findIndex(q=>q.id===p.insertAfter):-1;if(index<0){let best=Infinity;for(let i=0;i<result.length-1;i++){const d=distance(p,result[i],result[i+1]);if(d<best){best=d;index=i;}}}result.splice(index+1,0,p);}return result;
  }
  async function directRoute(points,signal){
    const url='https://router.project-osrm.org/route/v1/driving/'+points.map(p=>`${p.longitude},${p.latitude}`).join(';')+'?overview=full&geometries=geojson&steps=false';
    const response=await fetch(url,{signal});if(!response.ok)throw Error('Routing unavailable');const raw=await response.json(),route=raw.routes?.[0];
    if(raw.code!=='Ok'||!route||raw.waypoints?.length!==points.length||raw.waypoints.some(p=>!Number.isFinite(p.distance)||p.distance>2000))throw Error('Road access not verified');
    return {geometry:route.geometry?.coordinates,total_distance_km:route.distance/1000,total_duration_minutes:route.duration/60};
  }
  const cache = new Map();
  const text = source => window.FjordI18n?.t(source) || source;
  const coords = p => [p.latitude, p.longitude];
  const query = p => p.extra ? coords(p).join(',') : p.routeQuery || coords(p).join(',');
  const find = id => data.destinations.find(p => p.id === id);
  const fit = () => {
    if (!map || !dialog.open || !activePoints.length) return;
    map.invalidateSize();
    const bounds = L.latLngBounds(activePoints.map(coords));
    if (routeLine) bounds.extend(routeLine.getBounds());
    map.fitBounds(bounds, {padding: [35, 35], maxZoom: 11, animate: false});
  };
  document.getElementById('itineraryClose').onclick = () => dialog.close();
  document.getElementById('itineraryFit').onclick = fit;
  dialog.addEventListener('close', () => { requestId++; controller?.abort(); });
  function stopCards(points, markers) {
    const list = document.getElementById('itineraryStops');
    list.replaceChildren();
    points.forEach((p, i) => {
      const item = document.createElement('li');
      item.id = `itinerary-stop-${i}`;
      if(p.extra){
        item.dataset.i18nIgnore='';const title=node('div',undefined,'itinerary-stop-title');title.append(node('span',String(i+1).padStart(2,'0')),node('h4',localized(p.name)));const locate=node('button','⌖','stop-on-map');locate.type='button';locate.onclick=()=>{map.setView(coords(p),11);markers[i].openPopup();};title.append(locate);const illustration=node('figure',undefined,'itinerary-experience-photo');if(p.image){const image=node('img');image.src=safeURL(p.image);image.alt=localized(p.name);image.loading='lazy';illustration.append(image);window.FjordExperiences?.appendPhotoCredit?.(illustration,p);}else{illustration.className='itinerary-illustration';illustration.textContent='✦';illustration.setAttribute('aria-hidden','true');}item.append(title,illustration,node('p',localized(p.description)),node('small',localized(p.season),'itinerary-access'));const url=official(p);if(url){const a=node('a',et('Official information ↗'),'itinerary-official');a.href=url;a.target='_blank';a.rel='noopener noreferrer';item.append(a);}list.append(item);return;
      }
      const photos = [...new Set([p.image, ...(p.gallery || []).map(g => g.image)])].filter(Boolean).slice(0, 3);
      item.innerHTML = `<div class="itinerary-stop-title"><span data-i18n-ignore>${String(i + 1).padStart(2, '0')}</span><div><small>${i === 0 ? 'Starting point' : i === points.length - 1 ? 'Final stop' : 'Along the way'}</small><h4 data-i18n-ignore>${esc(p.name)}</h4></div><button type="button" class="stop-on-map" aria-label="Show on map">⌖</button></div><button type="button" class="itinerary-main-photo" aria-label="View photo journal"><img src="${esc(safeURL(photos[0]))}" alt="${esc(p.name)}" loading="lazy"><span>View photo journal ↗</span></button><div class="itinerary-thumbnails">${photos.slice(1).map(src => `<img src="${esc(safeURL(src))}" alt="${esc(p.name)}" loading="lazy">`).join('')}</div><p>${esc(p.description || '')}</p><small class="itinerary-access">${esc(p.routeLabel || p.name)}</small>`;
      item.querySelector('.itinerary-main-photo').onclick = () => openGallery(p.id);
      item.querySelector('.stop-on-map').onclick = () => {
        map.setView(coords(p), 11); markers[i].openPopup();
        document.getElementById('itineraryMap').scrollIntoView({block: 'nearest', behavior: 'smooth'});
      };
      list.append(item);
    });
  }
  async function openItinerary(key, button) {
    if(key!==activeKey){chosen.clear();}activeKey=key;activeButton=button;
    const token = ++requestId;controller?.abort();controller=new AbortController();const localController=controller,signal=localController.signal;
    let failed=false;try{const loaded=await window.FjordExperiences.load();if(!Array.isArray(loaded))throw Error();experiences=loaded.map(p=>({...p,latitude:p.latitude??p.lat,longitude:p.longitude??p.lon,extra:true}));}catch{experiences=[];failed=true;}
    if(token!==requestId)return;
    extraChoices(key,failed);
    const config = roadTrips[key];
    const custom=customRoutes[key];
    const origin = find(custom?.origin || (key === 'sunnmore' ? 'rampestreken' : 'bergen'));
    const base=custom?[origin,...custom.required.map(id=>experiences.find(p=>p.id===id)),...(custom.destination?[find(custom.destination)]:[])]:[origin,...config.stops.map(find),find(config.destination)];
    if(base.some(p=>!valid(p))){document.getElementById('itineraryTitle').textContent=custom?et(custom.title):button.querySelector('b').textContent;document.getElementById('itineraryOrder').textContent='';document.getElementById('itineraryStops').replaceChildren();document.getElementById('itineraryStatus').textContent=et('Required route coordinates are unavailable. No route was calculated.');document.getElementById('itineraryNavigation').removeAttribute('href');legLinks.replaceChildren();activePoints=[];layer?.clearLayers();routeLine=null;if(!dialog.open)dialog.showModal();return;}
    const points=withExtras(base);
    // Åndalsnes is represented by the catalogue's Rampestreken road access.
    activePoints = points;
    document.getElementById('itineraryTitle').textContent = custom?et(custom.title):button.querySelector('b').textContent;
    document.getElementById('itineraryTitle').setAttribute('data-i18n-ignore','');
    document.getElementById('itineraryOrder').textContent = points.map(p => localized(p.name)).join(' → ');
    document.getElementById('itineraryStatus').removeAttribute('data-i18n-ignore');
    document.getElementById('itineraryStatus').textContent = 'Calculating the road route…';
    if (!map) {
      map = L.map('itineraryMap', {scrollWheelZoom: false});
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
      }).addTo(map);
      layer = L.layerGroup().addTo(map);
      new ResizeObserver(fit).observe(document.getElementById('itineraryMap'));
    }
    layer.clearLayers(); routeLine = null;
    const markers = points.map((p, i) => {
      const marker = L.marker(coords(p), {icon: L.divIcon({className: 'itinerary-pin', html: `<span>${i + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15]})}).addTo(layer);
      const popup = document.createElement('div');
      const name = document.createElement('b'); name.textContent = `${i + 1}. ${localized(p.name)}`;
      const action = document.createElement('button'); action.type = 'button'; action.textContent = text('View this stop');
      action.onclick = () => document.getElementById(`itinerary-stop-${i}`).scrollIntoView({block: 'nearest', behavior: 'smooth'});
      popup.append(name, document.createElement('br'), action); marker.bindPopup(popup);
      return marker;
    });
    stopCards(points, markers);
    const navigation = new URL('https://www.google.com/maps/dir/');
    navigation.searchParams.set('api', '1'); navigation.searchParams.set('travelmode', 'driving');
    navigation.searchParams.set('origin', query(points[0]));
    navigation.searchParams.set('destination', query(points[points.length - 1]));
    navigation.searchParams.set('waypoints', points.slice(1, -1).map(query).join('|'));
    document.getElementById('itineraryNavigation').href = navigation.href;
    legLinks.replaceChildren();if(points.length>5){for(let i=0;i<points.length-1;i+=4){const chunk=points.slice(i,i+5),url=new URL(navigation.href);url.searchParams.set('origin',query(chunk[0]));url.searchParams.set('destination',query(chunk.at(-1)));url.searchParams.set('waypoints',chunk.slice(1,-1).map(query).join('|'));const link=node('a',`${et('Navigation leg')} ${Math.floor(i/4)+1}: ${localized(chunk[0].name)} → ${localized(chunk.at(-1).name)} ↗`);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';legLinks.append(link);}}
    if(!dialog.open)dialog.showModal(); dialog.scrollTop = 0;
    window.FjordI18n?.apply(); requestAnimationFrame(fit);
    try {
      const cacheKey=JSON.stringify(points.map(p=>[p.id,p.latitude,p.longitude]));
      let result = cache.get(cacheKey);
      if (!result) {
        const timeout=setTimeout(()=>localController.abort(),25000);
        try{result = custom||chosen.size?await directRoute(points,signal):await api('route', {origin: coords(points[0]).join(','), destination: config.destination, stops: config.stops, max_detour_minutes: 90}, {signal});}finally{clearTimeout(timeout);}
        if(token!==requestId||!dialog.open)return;
        if(!Array.isArray(result.geometry)||result.geometry.length<2||result.geometry.some(p=>!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90))throw Error('Missing road geometry');
        cache.set(cacheKey, result);
      }
      if (token !== requestId || !dialog.open) return;
      if (!result.geometry?.length) throw Error('Missing road geometry');
      routeLine = L.polyline(result.geometry.map(p => [p[1], p[0]]), {color: '#bb1238', weight: 5, opacity: .9}).addTo(layer);
      const distance = Math.round(result.total_distance_km ?? result.distance_km);
      const minutes = Math.round(result.total_duration_minutes ?? result.duration_minutes);
      if(!Number.isFinite(distance)||!Number.isFinite(minutes))throw Error('Missing estimates');
      document.getElementById('itineraryStatus').setAttribute('data-i18n-ignore','');
      document.getElementById('itineraryStatus').textContent = `${distance} km · ${Math.floor(minutes / 60)} h ${minutes % 60} min · ${et('Driving only; visits and waiting are extra.')}`;
      fit();
    } catch {
      if (token !== requestId || !dialog.open) return;
      if(routeLine){layer.removeLayer(routeLine);routeLine=null;}
      document.getElementById('itineraryStatus').removeAttribute('data-i18n-ignore');
      document.getElementById('itineraryStatus').textContent = 'Road calculation is unavailable. All stops are shown; open Google Maps for directions.';
      window.FjordI18n?.apply();
    }
  }
  document.querySelectorAll('[data-roadtrip]').forEach(button => {
    button.onclick = () => openItinerary(button.dataset.roadtrip, button);
  });
  document.getElementById('itineraryUpdate').onclick=()=>openItinerary(activeKey,activeButton);
  const customButtons=[];
  for(const [key,config] of Object.entries(customRoutes)){const button=node('button');button.type='button';button.dataset.roadtrip=key;button.dataset.i18nIgnore='';button.append(node('span',key==='family'?'04 / INNLANDET':'05 / ØSTERDALEN'),node('b',et(config.title)),node('small',key==='family'?'Oslo · Kistefos · Hunderfossen':'Oslo · Storelgen · Røros'));button.onclick=()=>openItinerary(key,button);document.querySelector('.roadtrip-presets')?.append(button);customButtons.push([button,config]);}
  window.addEventListener('fjord:language',()=>{customButtons.forEach(([b,c])=>b.querySelector('b').textContent=et(c.title));if(dialog.open&&activeKey)openItinerary(activeKey,activeButton);});
})();
