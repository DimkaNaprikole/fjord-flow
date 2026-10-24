/* A complete route, rather than only its final destination. */
(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'itineraryDialog';
  dialog.setAttribute('aria-labelledby', 'itineraryTitle');
  dialog.innerHTML = `<header class="itinerary-header"><div><p class="eyebrow">YOUR JOURNEY, STOP BY STOP</p><h2 id="itineraryTitle"></h2><p id="itineraryOrder" data-i18n-ignore></p></div><button id="itineraryClose" type="button" aria-label="Close itinerary">×</button></header>
    <div class="itinerary-layout"><section class="itinerary-map-panel"><div id="itineraryMap" aria-label="Map of the whole itinerary"></div><p id="itineraryStatus" role="status"></p><p class="itinerary-notice">Driving estimates exclude visits, hikes, ferries and current road conditions. Check seasonal mountain-road closures before travelling.</p><a id="itineraryNavigation" class="button" target="_blank" rel="noopener noreferrer">Open full route in Google Maps ↗</a><button id="itineraryFit" class="text-link" type="button">Show the whole route</button></section><section><h3>All stops along the way</h3><ol id="itineraryStops"></ol></section></div>`;
  document.body.append(dialog);
  let map, mapLoading, infoWindow, routeLine, mapIsFallback=false, fallbackGeometry=[], markers = [], activePoints = [], requestId = 0, controller, activeKey, activeButton, experiences = [];
  const chosen = new Set(), excludedStops = new Set();
  const languages = ['en','nb','uk','sv','da'];
  const extraText = new Map([
    'Route stops|Rutestopp|Зупинки маршруту|Ruttstopp|Rutestop',
    'Choose your stops. The start and finish stay fixed; update the route after changes.|Velg stoppene dine. Start og mål er faste; oppdater ruten etter endringer.|Виберіть зупинки. Початок і фініш незмінні; після змін оновіть маршрут.|Välj dina stopp. Start och mål är fasta; uppdatera rutten efter ändringar.|Vælg dine stop. Start og mål er faste; opdater ruten efter ændringer.',
    'Select all stops|Velg alle stopp|Вибрати всі зупинки|Välj alla stopp|Vælg alle stop',
    'Start and finish only|Bare start og mål|Лише початок і фініш|Bara start och mål|Kun start og mål',
    'Fixed starting point|Fast startpunkt|Незмінний початок|Fast startpunkt|Fast startpunkt',
    'Fixed final stop|Fast sluttpunkt|Незмінний фініш|Fast slutpunkt|Fast slutpunkt',
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
    'Google map unavailable. The stops and Google Maps navigation links are still available.|Google-kartet er utilgjengelig. Stoppene og navigasjonslenkene til Google Maps er fortsatt tilgjengelige.|Карта Google недоступна. Зупинки та посилання на навігацію Google Maps залишаються доступними.|Google-kartan är inte tillgänglig. Stoppen och navigeringslänkarna till Google Maps är fortfarande tillgängliga.|Google-kortet er utilgængeligt. Stoppene og navigationslinkene til Google Maps er stadig tilgængelige.',
    'Navigation leg|Navigasjonsetappe|Етап навігації|Navigeringsetapp|Navigationsetape',
    'Open driving directions in Google Maps; parking entrances are resolved there. Map markers show approximate visit areas, not vehicle entrances.|Åpne kjøreveiledning i Google Maps; parkeringsinnkjørslene finnes der. Kartmarkørene viser omtrentlige besøksområder, ikke bilinnkjørsler.|Відкрийте автомобільну навігацію в Google Maps: в’їзди на парковки визначаються там. Позначки на карті показують приблизні місця огляду, а не в’їзди для авто.|Öppna vägbeskrivningen i Google Maps; parkeringsinfarter hittas där. Kartmarkörerna visar ungefärliga besöksområden, inte bilinfarter.|Åbn kørselsvejledning i Google Maps; parkeringsindkørslerne findes der. Kortmarkørerne viser omtrentlige besøgsområder, ikke bilindkørsler.'
  ].map(row => {const values=row.split('|');return [values[0],values];}));
  const language = () => window.FjordI18n?.language || 'en';
  const et = source => extraText.get(source)?.[Math.max(0,languages.indexOf(language()))] || source;
  const localized = value => typeof value === 'object' && value ? value[language()] || value.en || value.nb || '' : value || '';
  const valid = p => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude)<=90 && Math.abs(p.longitude)<=180;
  const customRoutes = {
    hadeland:{local:true,title:'A day close to Gran'},
    family:{origin:'oslo',required:['kistefos','hunderfossen'],title:'Family discoveries — several days'},
    osterdalen:{origin:'oslo',required:['storelgen'],destination:'roros',title:'Through Østerdalen'}
  };
  for(const [key,route] of Object.entries(window.FjordTripTools?.localRoutes||{}))customRoutes[key]={local:true,title:localized(route.title)};
  const extraPanel = document.createElement('section');extraPanel.className='itinerary-extras';extraPanel.dataset.i18nIgnore='';
  extraPanel.innerHTML='<div class="itinerary-base-picker"><h3 id="itineraryBaseTitle"></h3><p id="itineraryBaseHint"></p><div class="itinerary-selection-actions"><button id="itinerarySelectAll" class="text-link" type="button"></button><button id="itinerarySelectNone" class="text-link" type="button"></button></div><div id="itineraryBaseChoices"></div></div><h3 id="itineraryExtrasTitle"></h3><p id="itineraryExtrasHint"></p><div id="itineraryChoices"></div><button id="itineraryUpdate" class="button" type="button"></button><p id="itineraryExtrasError" role="status"></p>';
  dialog.querySelector('.itinerary-header').after(extraPanel);
  const legLinks=document.createElement('div');legLinks.id='itineraryLegs';legLinks.dataset.i18nIgnore='';document.getElementById('itineraryNavigation').after(legLinks);
  const official = p => {try{const u=new URL(p.website);return u.protocol==='https:'?u.href:null;}catch{return null;}};
  const node = (tag,value,cls) => {const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e;};
  function selectionChanged(){
    requestId++;controller?.abort();
    document.getElementById('itineraryNavigation').removeAttribute('href');
    legLinks.replaceChildren();
    if(routeLine){routeLine.setMap(null);routeLine=null;}
    document.getElementById('itineraryStatus').setAttribute('data-i18n-ignore','');
    document.getElementById('itineraryStatus').textContent=et('Selections changed — update the route.');
    document.getElementById('itineraryUpdate').classList.add('needs-update');
  }
  function baseChoices(base){
    document.getElementById('itineraryBaseTitle').textContent=et('Route stops');
    document.getElementById('itineraryBaseHint').textContent=et('Choose your stops. The start and finish stay fixed; update the route after changes.');
    document.getElementById('itinerarySelectAll').textContent=et('Select all stops');
    document.getElementById('itinerarySelectNone').textContent=et('Start and finish only');
    const box=document.getElementById('itineraryBaseChoices');box.replaceChildren();
    base.forEach((p,i)=>{
      if(!p)return;
      const fixed=i===0||i===base.length-1,label=node('label',undefined,'itinerary-choice itinerary-base-choice'),check=node('input');
      check.type='checkbox';check.value=p.id;check.checked=fixed||!excludedStops.has(p.id);check.disabled=fixed;check.dataset.baseStop=p.id;
      const copy=node('span');copy.append(node('b',localized(p.name)));
      if(fixed)copy.append(node('small',et(i===0?'Fixed starting point':'Fixed final stop')));
      label.append(check);
      if(p.image){const img=node('img');img.src=safeURL(p.image);img.alt='';img.loading='lazy';label.append(img);}
      label.append(copy);box.append(label);
      check.onchange=()=>{check.checked?excludedStops.delete(p.id):excludedStops.add(p.id);selectionChanged();};
    });
    document.getElementById('itinerarySelectAll').onclick=()=>{excludedStops.clear();baseChoices(base);selectionChanged();};
    document.getElementById('itinerarySelectNone').onclick=()=>{base.slice(1,-1).forEach(p=>{if(p)excludedStops.add(p.id);});chosen.clear();baseChoices(base);dialog.querySelectorAll('#itineraryChoices input').forEach(input=>{input.checked=false;});selectionChanged();};
  }
  function extraChoices(key,failed=false){
    document.getElementById('itineraryExtrasTitle').textContent=et('Optional experiences');
    document.getElementById('itineraryExtrasHint').textContent=et('Choose optional stops, then update the route.');
    document.getElementById('itineraryUpdate').textContent=et('Update route');
    document.getElementById('itineraryExtrasError').textContent=failed?et('Experience information unavailable. Open the route again to retry.'):'';
    const box=document.getElementById('itineraryChoices');box.replaceChildren();
    const route=customRoutes[key]?'east':key, required=customRoutes[key]?.required||[];
    const localRoute=window.FjordTripTools?.localRoutes?.[key];
    const items=experiences.filter(p=>localRoute?(localRoute.optionalExperienceIds|| (key==='hadeland'?['kistefos']:[])).includes(p.id):Array.isArray(p.routes)&&p.routes.includes(route)&&!required.includes(p.id));
    if(!items.length)box.append(node('p',et('No extra stops for this route.')));
    for(const p of items){const label=node('label',undefined,'itinerary-choice'),check=node('input');check.type='checkbox';check.value=p.id;check.checked=chosen.has(p.id);check.disabled=!valid(p);const copy=node('span');copy.append(node('b',localized(p.name)),node('small',localized(p.area)||localized(p.address)),node('small',localized(p.season)));if(!valid(p))copy.append(node('small',et('Plan access separately; see the operator.')));const url=official(p);if(url){const a=node('a',et('Official information ↗'));a.href=url;a.target='_blank';a.rel='noopener noreferrer';copy.append(a);}label.append(check,copy);box.append(label);check.onchange=()=>{check.checked?chosen.add(p.id):chosen.delete(p.id);selectionChanged();};}
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
  const query = p => p.routeQuery || coords(p).join(',');
  const find = id => data.destinations.find(p => p.id === id);
  const position = p => ({lat:p.latitude,lng:p.longitude});
  function clearMap(){markers.forEach(marker=>{marker.map=null;});markers=[];infoWindow?.close();if(routeLine){routeLine.setMap(null);routeLine=null;}fallbackGeometry=[];if(mapIsFallback)map.setPath([]);}
  const fit = () => {
    if (!map || !dialog.open || !activePoints.length) return;
    if(mapIsFallback){map.resize();map.render(activePoints.map((p,i)=>({...p,category:'rest',name:`${i+1}. ${localized(p.name)}`})),null,'rest',true);map.setPath(fallbackGeometry);return;}
    const bounds = new google.maps.LatLngBounds();
    activePoints.forEach(p=>bounds.extend(position(p)));
    routeLine?.getPath().forEach(p=>bounds.extend(p));
    map.fitBounds(bounds,35);
    // A single point or a very short route must not zoom into an individual roof.
    google.maps.event.addListenerOnce(map,'idle',()=>{if(map.getZoom()>14)map.setZoom(14);});
  };
  let mapLocationControl,visitorMarker;
  async function ensureMap(){
    if(map)return map;if(mapLoading)return mapLoading;
    mapLoading=(async()=>{
      const useFallback=async()=>{
        if(!window.FjordLeafletMap?.create)throw Error('MAP_FALLBACK_UNAVAILABLE');
        mapLocationControl?.destroy();visitorMarker?.setMap(null);const canvas=document.getElementById('itineraryMap');canvas.replaceChildren();
        map=await window.FjordLeafletMap.create(canvas,{language:language(),scrollwheel:true,buildInfo:p=>{const box=node('div');box.append(node('strong',localized(p.name)));return box;}});mapIsFallback=true;
        new ResizeObserver(()=>{if(dialog.open)fit();}).observe(canvas);return map;
      };
      if(window.FjordGoogleMapConfig?.provider!=='google'&&(window.FjordLeafletMap?.preferred?.()||['localhost','127.0.0.1','[::1]'].includes(window.location?.hostname)))return useFallback();
      try{
      const config=window.FjordGoogleMapConfig;
      if(!config?.enabled||!window.FjordGoogleNorwayMap?.loadAPI)throw Error('GOOGLE_MAPS_NOT_ENABLED');
      await window.FjordGoogleNorwayMap.loadAPI({...config,userActivated:true,language:language()});
      const [{Map,InfoWindow}]=await Promise.all([google.maps.importLibrary('maps'),google.maps.importLibrary('marker')]);
      map=new Map(document.getElementById('itineraryMap'),{center:{lat:60.37,lng:10.56},zoom:9,mapId:'DEMO_MAP_ID',mapTypeId:'roadmap',gestureHandling:'greedy',scrollwheel:true,zoomControl:true,cameraControl:true,mapTypeControl:true,mapTypeControlOptions:{mapTypeIds:['roadmap','hybrid','satellite','terrain']},fullscreenControl:false,streetViewControl:true,rotateControl:true,scaleControl:true,clickableIcons:true});
      infoWindow=new InfoWindow({maxWidth:260});
      mapLocationControl=window.FjordMapLocation?.attach(document.getElementById('itineraryMap'),{locate:p=>{visitorMarker?.setMap(null);visitorMarker=new google.maps.Marker({map,position:{lat:p.latitude,lng:p.longitude},title:text('My location'),icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:'#1678eb',fillOpacity:1,strokeColor:'#fff',strokeWeight:3}});if(window.FjordMapRegion)window.FjordMapRegion.google(map,p);else{map.setCenter(visitorMarker.getPosition());map.setZoom(9);}}});
      new ResizeObserver(()=>{if(dialog.open)fit();}).observe(document.getElementById('itineraryMap'));
      return map;
      }catch(error){if(window.FjordGoogleMapConfig?.provider!=='google'&&window.FjordLeafletMap?.create)return useFallback();throw error;}
    })().catch(error=>{mapLoading=null;throw error;});
    return mapLoading;
  }
  function focusStop(p,index){
    if(mapIsFallback&&map){map.focus({...p,name:`${index+1}. ${localized(p.name)}`});document.getElementById('itineraryMap').scrollIntoView({block:'nearest',behavior:'smooth'});return;}
    if(!map||!markers[index]){document.getElementById('itineraryNavigation').focus();return;}
    map.setCenter(position(p));map.setZoom(13);markers[index].showStop();
    document.getElementById('itineraryMap').scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function showMarkers(points){
    clearMap();
    if(mapIsFallback){map.render(points.map((p,i)=>({...p,category:'rest',name:`${i+1}. ${localized(p.name)}`})),null,'rest',true);return;}
    markers=points.map((p,i)=>{
      const pin=new google.maps.marker.PinElement({glyphText:String(i+1),glyphColor:'#fff',background:'#b70d35',borderColor:'#fff',scale:.9});
      const marker=new google.maps.marker.AdvancedMarkerElement({map,position:position(p),title:`${i+1}. ${localized(p.name)}`,content:pin,gmpClickable:true});
      const popup=node('div'),name=node('b',`${i+1}. ${localized(p.name)}`),action=node('button',text('View this stop'),'button');action.type='button';
      action.onclick=()=>document.getElementById(`itinerary-stop-${i}`)?.scrollIntoView({block:'nearest',behavior:'smooth'});
      popup.append(name,node('br'),action);
      marker.showStop=()=>{infoWindow.setContent(popup);infoWindow.open({map,anchor:marker});};
      marker.addListener('click',marker.showStop);return marker;
    });
    fit();
  }
  document.getElementById('itineraryClose').onclick = () => dialog.close();
  window.addEventListener('fjord:google-auth-failed',async()=>{
    if(window.FjordGoogleMapConfig?.provider==='google'||!map||mapIsFallback||!window.FjordLeafletMap?.create)return;
    const geometry=routeLine?.getPath().getArray().map(p=>[p.lng(),p.lat()])||[];
    clearMap();map=null;mapLoading=null;
    try{await ensureMap();showMarkers(activePoints);fallbackGeometry=geometry;map.setPath(geometry);fit();}catch{/* Existing navigation and stop cards remain available. */}
  });
  document.getElementById('itineraryFit').onclick = fit;
  dialog.addEventListener('close', () => { requestId++; controller?.abort(); });
  function stopCards(points) {
    const list = document.getElementById('itineraryStops');
    list.replaceChildren();
    points.forEach((p, i) => {
      const item = document.createElement('li');
      item.id = `itinerary-stop-${i}`;
      if(p.extra){
        item.dataset.i18nIgnore='';const title=node('div',undefined,'itinerary-stop-title');title.append(node('span',String(i+1).padStart(2,'0')),node('h4',localized(p.name)));const locate=node('button','⌖','stop-on-map');locate.type='button';locate.onclick=()=>{focusStop(p,i);};title.append(locate);const illustration=node('figure',undefined,'itinerary-experience-photo');if(p.image){const image=node('img');image.src=safeURL(p.image);image.alt=localized(p.name);image.loading='lazy';illustration.append(image);window.FjordExperiences?.appendPhotoCredit?.(illustration,p);}else{illustration.className='itinerary-illustration';illustration.textContent='✦';illustration.setAttribute('aria-hidden','true');}item.append(title);if(!p.local)item.append(illustration);else item.classList.add('itinerary-stop-local');item.append(node('p',localized(p.description)),node('small',localized(p.season),'itinerary-access'));const url=official(p);if(url){const a=node('a',et('Official information ↗'),'itinerary-official');a.href=url;a.target='_blank';a.rel='noopener noreferrer';item.append(a);}window.FjordTripTools?.nearby(item,p);list.append(item);return;
      }
      const photos = [...new Set([p.image, ...(p.gallery || []).map(g => g.image)])].filter(Boolean).slice(0, 3);
      item.innerHTML = `<div class="itinerary-stop-title"><span data-i18n-ignore>${String(i + 1).padStart(2, '0')}</span><div><small>${i === 0 ? 'Starting point' : i === points.length - 1 ? 'Final stop' : 'Along the way'}</small><h4 data-i18n-ignore>${esc(p.name)}</h4></div><button type="button" class="stop-on-map" aria-label="Show on map">⌖</button></div><button type="button" class="itinerary-main-photo" aria-label="View photo journal"><img src="${esc(safeURL(photos[0]))}" alt="${esc(p.name)}" loading="lazy"><span>View photo journal ↗</span></button><div class="itinerary-thumbnails">${photos.slice(1).map(src => `<img src="${esc(safeURL(src))}" alt="${esc(p.name)}" loading="lazy">`).join('')}</div><p>${esc(p.description || '')}</p><small class="itinerary-access">${esc(p.routeLabel || p.name)}</small>`;
      item.querySelector('.itinerary-main-photo').onclick = () => openGallery(p.id);
      item.querySelector('.stop-on-map').onclick = () => {
        focusStop(p,i);
      };
      window.FjordTripTools?.nearby(item,p);list.append(item);
    });
  }
  async function openItinerary(key, button) {
    if(key!==activeKey){chosen.clear();excludedStops.clear();}activeKey=key;activeButton=button;
    const token = ++requestId;controller?.abort();controller=new AbortController();const localController=controller,signal=localController.signal;
    let failed=false;try{const loaded=await window.FjordExperiences.load();if(!Array.isArray(loaded))throw Error();experiences=loaded.map(p=>({...p,latitude:p.latitude??p.lat,longitude:p.longitude??p.lon,extra:true}));}catch{experiences=[];failed=true;}
    if(token!==requestId)return;
    extraChoices(key,failed);
    const config = roadTrips[key];
    const custom=customRoutes[key];
    const local=window.FjordTripTools?.localRoutes?.[key];
    if(key==='hadeland')experiences=experiences.map(p=>p.id==='kistefos'?{...p,insertAfter:'hadeland-glassverk'}:p);
    const origin = find(custom?.origin || (key === 'sunnmore' ? 'rampestreken' : 'bergen'));
    const base=local?local.points:custom?[origin,...custom.required.map(id=>experiences.find(p=>p.id===id)),...(custom.destination?[find(custom.destination)]:[])]:[origin,...config.stops.map(find),find(config.destination)];
    baseChoices(base);
    document.getElementById('itineraryUpdate').classList.remove('needs-update');
    if(base.some(p=>!valid(p))){document.getElementById('itineraryTitle').textContent=custom?et(custom.title):button.querySelector('b').textContent;document.getElementById('itineraryOrder').textContent='';document.getElementById('itineraryStops').replaceChildren();document.getElementById('itineraryStatus').textContent=et('Required route coordinates are unavailable. No route was calculated.');document.getElementById('itineraryNavigation').removeAttribute('href');legLinks.replaceChildren();activePoints=[];clearMap();if(!dialog.open)dialog.showModal();return;}
    const points=withExtras(base.filter((p,i)=>i===0||i===base.length-1||!excludedStops.has(p.id)));
    // Åndalsnes is represented by the catalogue's Rampestreken road access.
    activePoints = points;
    document.getElementById('itineraryTitle').textContent = local?localized(local.title):custom?et(custom.title):button.querySelector('b').textContent;
    document.getElementById('itineraryTitle').setAttribute('data-i18n-ignore','');
    document.getElementById('itineraryOrder').textContent = points.map(p => localized(p.name)).join(' → ');
    document.getElementById('itineraryStatus').removeAttribute('data-i18n-ignore');
    document.getElementById('itineraryStatus').textContent = 'Calculating the road route…';
    clearMap();
    stopCards(points);
    const navigation = new URL('https://www.google.com/maps/dir/');
    navigation.searchParams.set('api', '1'); navigation.searchParams.set('travelmode', 'driving');
    navigation.searchParams.set('origin', query(points[0]));
    navigation.searchParams.set('destination', query(points[points.length - 1]));
    navigation.searchParams.set('waypoints', points.slice(1, -1).map(query).join('|'));
    document.getElementById('itineraryNavigation').href = navigation.href;
    legLinks.replaceChildren();if(points.length>5){for(let i=0;i<points.length-1;i+=4){const chunk=points.slice(i,i+5),url=new URL(navigation.href);url.searchParams.set('origin',query(chunk[0]));url.searchParams.set('destination',query(chunk.at(-1)));url.searchParams.set('waypoints',chunk.slice(1,-1).map(query).join('|'));const link=node('a',`${et('Navigation leg')} ${Math.floor(i/4)+1}: ${localized(chunk[0].name)} → ${localized(chunk.at(-1).name)} ↗`);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';legLinks.append(link);}}
    if(!dialog.open)dialog.showModal(); dialog.scrollTop = 0;
    window.FjordI18n?.apply(); requestAnimationFrame(fit);
    let mapFailed=false;
    if(!map){const loading=node('p',text('Loading…'));loading.style.padding='20px';document.getElementById('itineraryMap').replaceChildren(loading);}
    try{await ensureMap();if(token!==requestId||!dialog.open)return;showMarkers(points);}
    catch{if(token!==requestId||!dialog.open)return;mapFailed=true;const unavailable=node('p',et('Google map unavailable. The stops and Google Maps navigation links are still available.'));unavailable.style.padding='20px';const retry=node('button',text('Try again'),'button');retry.type='button';retry.onclick=()=>openItinerary(activeKey,activeButton);unavailable.append(node('br'),retry);document.getElementById('itineraryMap').replaceChildren(unavailable);}
    const withMapStatus=value=>value+(mapFailed?' '+et('Google map unavailable. The stops and Google Maps navigation links are still available.'):'');
    if(local?.navigationOnly){
      document.getElementById('itineraryStatus').setAttribute('data-i18n-ignore','');
      document.getElementById('itineraryStatus').textContent=withMapStatus(et('Open driving directions in Google Maps; parking entrances are resolved there. Map markers show approximate visit areas, not vehicle entrances.'));
      fit();return;
    }
    try {
      const cacheKey=JSON.stringify(points.map(p=>[p.id,p.latitude,p.longitude]));
      let result = cache.get(cacheKey);
      if (!result) {
        const timeout=setTimeout(()=>localController.abort(),25000);
        try{result = custom||chosen.size||excludedStops.size?await directRoute(points,signal):await api('route', {origin: coords(points[0]).join(','), destination: config.destination, stops: config.stops, max_detour_minutes: 90}, {signal});}finally{clearTimeout(timeout);}
        if(token!==requestId||!dialog.open)return;
        if(!Array.isArray(result.geometry)||result.geometry.length<2||result.geometry.some(p=>!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90))throw Error('Missing road geometry');
        cache.set(cacheKey, result);
      }
      if (token !== requestId || !dialog.open) return;
      if (!result.geometry?.length) throw Error('Missing road geometry');
      if(map&&!mapFailed){if(mapIsFallback){fallbackGeometry=result.geometry;map.setPath(fallbackGeometry);}else routeLine = new google.maps.Polyline({map,path:result.geometry.map(p=>({lat:p[1],lng:p[0]})),strokeColor:'#bb1238',strokeWeight:5,strokeOpacity:.9});}
      const distance = Math.round(result.total_distance_km ?? result.distance_km);
      const minutes = Math.round(result.total_duration_minutes ?? result.duration_minutes);
      if(!Number.isFinite(distance)||!Number.isFinite(minutes))throw Error('Missing estimates');
      document.getElementById('itineraryStatus').setAttribute('data-i18n-ignore','');
      document.getElementById('itineraryStatus').textContent = withMapStatus(`${distance} km · ${Math.floor(minutes / 60)} h ${minutes % 60} min · ${et('Driving only; visits and waiting are extra.')}`);
      fit();
    } catch {
      if (token !== requestId || !dialog.open) return;
      if(routeLine){routeLine.setMap(null);routeLine=null;}
      document.getElementById('itineraryStatus').removeAttribute('data-i18n-ignore');
      document.getElementById('itineraryStatus').textContent = withMapStatus(text('Road calculation is unavailable. All stops are shown; open Google Maps for directions.'));
      window.FjordI18n?.apply();
    }
  }
  document.querySelectorAll('[data-roadtrip]').forEach(button => {
    button.onclick = () => openItinerary(button.dataset.roadtrip, button);
  });
  document.getElementById('itineraryUpdate').onclick=()=>openItinerary(activeKey,activeButton);
  const customButtons=[];
  for(const [key,config] of Object.entries(customRoutes)){const local=window.FjordTripTools?.localRoutes?.[key],button=node('button');button.type='button';button.dataset.roadtrip=key;button.dataset.i18nIgnore='';button.append(node('span',local?local.label:key==='family'?'04 / INNLANDET':'05 / ØSTERDALEN'),node('b',local?localized(local.title):et(config.title)),node('small',local?localized(local.summary):key==='family'?'Oslo · Kistefos · Hunderfossen':'Oslo · Storelgen · Røros'));button.onclick=()=>openItinerary(key,button);const host=document.querySelector('.roadtrip-presets');key==='hadeland'?host?.prepend(button):host?.append(button);customButtons.push([button,config,key]);}
  window.FjordTripTools?.practical(dialog.querySelector('.itinerary-map-panel'));
  window.addEventListener('fjord:language',()=>{customButtons.forEach(([b,c,key])=>{const local=window.FjordTripTools?.localRoutes?.[key];b.querySelector('b').textContent=local?localized(local.title):et(c.title);if(local)b.querySelector('small').textContent=localized(local.summary);});if(dialog.open&&activeKey)openItinerary(activeKey,activeButton);});
})();
