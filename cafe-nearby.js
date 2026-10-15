/* Google Maps URLs: no API key, no copied venue photos or unverified opening status.
   https://developers.google.com/maps/documentation/urls/get-started */
(() => {
  'use strict';
  const copy = {
    en:['Find cafés open nearby','Choose a destination or use your location. Google Maps shows café photos, opening hours and directions. Check the hours and “Open now” filter there.','Near a destination','Choose a destination','Use my location','Travel mode','Walking','Driving','Find cafés in Google Maps','Open route planner','Google Maps opens in a new tab. Your location is requested only when you press the location button and is sent to Google only when you open a Maps link.','Waiting for location permission…','Location selected. Open Google Maps to see nearby cafés.','Location unavailable. Choose a destination instead.','Choose a destination or use your location first.','Current location','Maps results are not guaranteed to be the nearest café or currently open. Choose your café in Maps before starting navigation.'],
    nb:['Finn åpne kafeer i nærheten','Velg et reisemål eller bruk posisjonen din. Google Maps viser kafébilder, åpningstider og veibeskrivelse. Sjekk åpningstidene og filteret «Åpent nå» der.','Nær et reisemål','Velg et reisemål','Bruk posisjonen min','Reisemåte','Til fots','Med bil','Finn kafeer i Google Maps','Åpne ruteplanlegger','Google Maps åpnes i en ny fane. Vi ber bare om posisjonen når du trykker på posisjonsknappen, og sender den bare til Google når du åpner en Maps-lenke.','Venter på tillatelse til posisjon…','Posisjonen er valgt. Åpne Google Maps for å se kafeer i nærheten.','Posisjonen er utilgjengelig. Velg et reisemål i stedet.','Velg et reisemål eller bruk posisjonen din først.','Nåværende posisjon','Resultatene i Maps er ikke garantert å være den nærmeste kafeen eller åpne nå. Velg kafé i Maps før du starter navigasjon.'],
    uk:['Знайти відкриті кав’ярні поруч','Оберіть місце або використайте геолокацію. Google Maps покаже фото кав’ярень, години роботи й маршрути. Перевірте там години роботи та фільтр «Відкрито зараз».','Поруч із місцем','Оберіть місце','Використати моє місцезнаходження','Як дістатися','Пішки','Автомобілем','Знайти кав’ярні в Google Maps','Відкрити планувальник маршруту','Google Maps відкриється в новій вкладці. Геолокацію запитуємо лише після натискання кнопки, а координати передаємо Google лише коли ви відкриваєте посилання Maps.','Очікуємо дозвіл на геолокацію…','Місцезнаходження визначено. Відкрийте Google Maps, щоб побачити кав’ярні поруч.','Геолокація недоступна. Натомість оберіть місце.','Спочатку оберіть місце або визначте своє місцезнаходження.','Поточне місцезнаходження','Результати Maps не гарантують найближчу чи відкриту зараз кав’ярню. Оберіть заклад у Maps перед початком навігації.'],
    sv:['Hitta öppna kaféer i närheten','Välj ett resmål eller använd din position. Google Maps visar kafébilder, öppettider och vägbeskrivningar. Kontrollera öppettiderna och filtret ”Öppet nu” där.','Nära ett resmål','Välj ett resmål','Använd min position','Färdsätt','Till fots','Med bil','Hitta kaféer i Google Maps','Öppna ruttplaneraren','Google Maps öppnas i en ny flik. Positionen begärs bara när du trycker på positionsknappen och skickas till Google först när du öppnar en Maps-länk.','Väntar på tillåtelse till position…','Position vald. Öppna Google Maps för att se kaféer i närheten.','Positionen är otillgänglig. Välj ett resmål i stället.','Välj ett resmål eller använd din position först.','Nuvarande position','Maps-resultaten garanterar inte det närmaste kaféet eller att det är öppet nu. Välj kafé i Maps innan du startar navigering.'],
    da:['Find åbne caféer i nærheden','Vælg et rejsemål eller brug din position. Google Maps viser cafébilleder, åbningstider og vejvisning. Tjek åbningstiderne og filteret ”Åbent nu” der.','Nær et rejsemål','Vælg et rejsemål','Brug min position','Transportform','Til fods','I bil','Find caféer i Google Maps','Åbn ruteplanlægger','Google Maps åbnes i en ny fane. Positionen hentes kun, når du trykker på positionsknappen, og sendes først til Google, når du åbner et Maps-link.','Venter på tilladelse til position…','Position valgt. Åbn Google Maps for at se caféer i nærheden.','Positionen er utilgængelig. Vælg et rejsemål i stedet.','Vælg et rejsemål eller brug din position først.','Nuværende position','Maps-resultaterne garanterer ikke den nærmeste café, eller at den er åben nu. Vælg café i Maps, før du starter navigation.']
  };
  let places=[], selected='bergen', location=null, status=-1, busy=false, explicitChoice=false;
  const language=()=>window.FjordI18n?.language||'nb';
  const text=n=>(copy[language()]||copy.nb)[n];
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function origin(){if(location)return location;const p=places.find(p=>p.id===selected);return p?(p.routeLabel||p.name)+', Norway':''}
  function links(){
    const near=origin(),search=document.getElementById('cafeNearbySearch');
    if(!search)return;
    const map=new URL('https://www.google.com/maps/search/');map.searchParams.set('api','1');map.searchParams.set('query','cafes open now near '+near);
    search.href=map.href;search.setAttribute('aria-disabled',String(!near));
    document.getElementById('cafeNearbyStatus').textContent=status>=0?text(status):'';
    const gps=document.getElementById('cafeNearbyGPS');gps.disabled=busy;gps.textContent=text(busy?11:location?15:4);
  }
  function options(){const select=document.getElementById('cafeNearbyPlace');if(!select)return;select.innerHTML=`<option value="">${escape(text(3))}</option>`+places.map(p=>`<option value="${escape(p.id)}">${escape(p.name)}</option>`).join('');select.value=selected}
  function mount(){
    const section=document.getElementById('cafeStops');if(!section||document.getElementById('cafeNearby'))return;
    const panel=document.createElement('div');panel.id='cafeNearby';panel.className='cafe-nearby';panel.dataset.i18nIgnore='';
    panel.innerHTML=`<div class="cafe-nearby-title"><span aria-hidden="true">☕</span><h3>${escape(text(0))} · Google Maps</h3></div><p class="cafe-nearby-intro">${escape(text(1))}</p><form id="cafeNearbyForm"><label>${escape(text(2))}<select id="cafeNearbyPlace"></select></label><button type="button" id="cafeNearbyGPS">${escape(text(4))}</button><div class="cafe-nearby-actions"><a id="cafeNearbySearch" target="_blank" rel="noopener noreferrer">${escape(text(8))} ↗</a></div></form><p id="cafeNearbyStatus" role="status" aria-live="polite"></p><details class="cafe-nearby-privacy"><summary>Google Maps · GPS</summary><p>${escape(text(10))}</p></details>`;
    const heading=section.querySelector('.discovery-cafe-heading');heading?heading.after(panel):section.prepend(panel);options();
    document.getElementById('cafeNearbyForm').onsubmit=e=>e.preventDefault();
    document.getElementById('cafeNearbyPlace').onchange=e=>{explicitChoice=true;selected=e.target.value;location=null;status=-1;links()};
    for(const id of ['cafeNearbySearch'])document.getElementById(id).onclick=e=>{if(!origin()){e.preventDefault();status=14;links();document.getElementById('cafeNearbyPlace').focus()}};
    document.getElementById('cafeNearbyGPS').onclick=()=>{
      if(busy)return;explicitChoice=true;if(!navigator.geolocation){status=13;links();return}busy=true;status=11;links();
      navigator.geolocation.getCurrentPosition(position=>{location=position.coords.latitude.toFixed(5)+','+position.coords.longitude.toFixed(5);selected='';busy=false;status=12;options();links()},()=>{busy=false;status=13;links()},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
    };links();
  }
  window.addEventListener('fjord:state',event=>{places=event.detail?.destinations||[];options();links()});
  window.addEventListener('fjordexplorerphoto',event=>{const id=event.detail?.place?.id;if(explicitChoice||!id||!places.some(place=>place.id===id))return;selected=id;location=null;status=-1;options();links()});
  window.addEventListener('fjordlanguagechange',()=>{document.getElementById('cafeNearby')?.remove();mount()});
  // Discoveries re-renders its section after loading and when the language changes.
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
  mount();
  if(typeof data!=='undefined'&&data?.destinations){places=data.destinations;options();links()}
  else fetch('./demo-data/state.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(state=>{places=state.destinations||[];options();links()}).catch(()=>{});
})();
