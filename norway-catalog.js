/* The site's own curated catalogue: one local data request, no search API. */
(() => {
  'use strict';
  const validPoint = p => !!p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
  function distanceKm(a, b) {
    if (!validPoint(a) || !validPoint(b)) return null;
    const rad = n => n * Math.PI / 180, dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
  }
  function nearby(rows, origin, radius) {
    const mapped = rows.map((record, index) => ({...record, catalogueDistance: distanceKm(origin, record), catalogueIndex: index}));
    return mapped.filter(r => radius === 'all' || (r.catalogueDistance !== null && r.catalogueDistance <= Number(radius)))
      .sort((a, b) => validPoint(origin) ? (a.catalogueDistance ?? Infinity) - (b.catalogueDistance ?? Infinity) || a.catalogueIndex - b.catalogueIndex : a.catalogueIndex - b.catalogueIndex);
  }
  function nearestCity(point, towns, maximumDistanceKm = Infinity) {return nearby(towns, point, 'all').find(town => town.catalogueDistance !== null && town.catalogueDistance <= maximumDistanceKm) || null;}
  function routeUrl(record, origin) {
    let url = new URL('https://www.google.com/maps/dir/');
    if (record.directionsUrl) {try {const supplied = new URL(record.directionsUrl); if (supplied.protocol === 'https:' && !supplied.username && !supplied.password && /^(www\.)?google\.com$/.test(supplied.hostname) && /^\/maps\/dir\/?$/.test(supplied.pathname) && supplied.searchParams.get('destination')?.trim()) url = supplied;} catch {}}
    url.searchParams.set('api', '1');
    url.searchParams.set('travelmode', 'driving');
    if (record.coordinatePrecision === 'area' && /^\s*[+-]?\d+(?:\.\d+)?\s*,\s*[+-]?\d+(?:\.\d+)?\s*$/.test(url.searchParams.get('destination') || '')) url.searchParams.delete('destination');
    if (!url.searchParams.has('destination')) url.searchParams.set('destination', validPoint(record) && record.coordinatePrecision !== 'area' ? `${record.latitude},${record.longitude}` : record.routeQuery || [record.name, record.address, record.town, 'Norway'].filter(Boolean).join(', '));
    url.searchParams.delete('origin');
    if (validPoint(origin)) url.searchParams.set('origin', `${origin.latitude},${origin.longitude}`);
    return url.href;
  }
  function createOriginState() {
    let current = null, revision = 0;
    return {get current() {return current;}, set(point) {revision++; current = validPoint(point) ? {...point} : null;}, beginGPS() {return ++revision;}, acceptGPS(token, point) {if (token !== revision || !validPoint(point)) return false; current = {...point}; return true;}, isCurrent(token) {return token === revision;}};
  }
  if (typeof window === 'undefined') {if (typeof module !== 'undefined') module.exports = {validPoint, distanceKm, nearby, nearestCity, routeUrl, createOriginState}; return;}
  const copy = {
    nb: ['Norge, stopp for stopp', 'Vår egen reisekatalog', 'Et utvalg kafeer, hytter, badstuer og fine pauser langs veien. Bilder og informasjon ligger på nettstedet. Sjekk dato og vertens nettside før besøket.', 'Søk etter sted, by eller region', 'Alle steder', 'Kafeer', 'Hytter', 'Badstuer', 'Fine pauser', 'steder', 'Vis flere', 'Ingen treff. Prøv en annen by eller kategori.', 'Åpne bildegalleri', 'Nettsted', 'Finn veien', 'Åpningstider og sesong', 'Åpningstider er ikke publisert. Kontakt stedet før besøket.', 'Informasjonskilde', 'Sist kontrollert', 'Fotokilde', 'Foto kommer når et ekte bilde er tilgjengelig.', 'Laster katalogen…', 'Kunne ikke laste katalogen.', 'Prøv igjen', 'Ikke oppgitt', 'Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag', 'Åpningstider kan endres på helligdager. Dette er ikke en sanntidsstatus.'],
    en: ['Norway, stop by stop', 'Our own travel catalogue', 'A selection of cafés, cabins, saunas and worthwhile breaks along the road. Photos and information are stored on this website. Check the date and the host’s website before visiting.', 'Search place, town or region', 'All places', 'Cafés', 'Cabins', 'Saunas', 'Places to unwind', 'places', 'Show more', 'No matches. Try another town or category.', 'Open photo gallery', 'Website', 'Get directions', 'Opening hours and season', 'Opening hours are not published. Contact the venue before visiting.', 'Information source', 'Last checked', 'Photo source', 'A photo will appear when a genuine image is available.', 'Loading catalogue…', 'Could not load the catalogue.', 'Try again', 'Not published', 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday', 'Holiday hours may differ. This is not a live open/closed status.'],
    uk: ['Норвегія, зупинка за зупинкою', 'Наш власний каталог подорожей', 'Добірка кав’ярень, будиночків, саун і місць для відпочинку дорогою. Фото та інформація зберігаються на сайті. Перед візитом перевірте дату й сайт закладу.', 'Пошук місця, міста або регіону', 'Усі місця', 'Кав’ярні', 'Будиночки', 'Сауни', 'Місця відпочинку', 'місць', 'Показати ще', 'Нічого не знайдено. Спробуйте інше місто або категорію.', 'Відкрити фотогалерею', 'Сайт', 'Прокласти маршрут', 'Години роботи та сезон', 'Години роботи не опубліковані. Уточніть у закладу перед візитом.', 'Джерело інформації', 'Перевірено', 'Джерело фото', 'Фото з’явиться, коли буде доступний справжній знімок.', 'Завантаження каталогу…', 'Не вдалося завантажити каталог.', 'Спробувати ще', 'Не опубліковано', 'Понеділок|Вівторок|Середа|Четвер|П’ятниця|Субота|Неділя', 'У свята графік може змінюватися. Це не поточний статус роботи.'],
    sv: ['Norge, stopp för stopp', 'Vår egen resekatalog', 'Ett urval kaféer, stugor, bastur och fina pauser längs vägen. Bilder och information finns på webbplatsen. Kontrollera datum och värdens webbplats före besöket.', 'Sök plats, ort eller region', 'Alla platser', 'Kaféer', 'Stugor', 'Bastur', 'Platser att koppla av', 'platser', 'Visa fler', 'Inga träffar. Prova en annan ort eller kategori.', 'Öppna bildgalleri', 'Webbplats', 'Hitta hit', 'Öppettider och säsong', 'Öppettider är inte publicerade. Kontakta platsen före besöket.', 'Informationskälla', 'Senast kontrollerad', 'Bildkälla', 'En bild visas när ett äkta foto finns tillgängligt.', 'Laddar katalogen…', 'Katalogen kunde inte laddas.', 'Försök igen', 'Inte publicerat', 'Måndag|Tisdag|Onsdag|Torsdag|Fredag|Lördag|Söndag', 'Helgdagstider kan avvika. Detta är inte en aktuell öppetstatus.'],
    da: ['Norge, stop for stop', 'Vores eget rejsekatalog', 'Et udvalg af caféer, hytter, saunaer og fine pauser langs vejen. Billeder og information ligger på hjemmesiden. Kontrollér dato og værtens hjemmeside før besøget.', 'Søg sted, by eller region', 'Alle steder', 'Caféer', 'Hytter', 'Saunaer', 'Steder til en pause', 'steder', 'Vis flere', 'Ingen resultater. Prøv en anden by eller kategori.', 'Åbn billedgalleri', 'Hjemmeside', 'Find vej', 'Åbningstider og sæson', 'Åbningstider er ikke offentliggjort. Kontakt stedet før besøget.', 'Informationskilde', 'Sidst kontrolleret', 'Billedkilde', 'Et billede vises, når et ægte foto er tilgængeligt.', 'Indlæser kataloget…', 'Kataloget kunne ikke indlæses.', 'Prøv igen', 'Ikke offentliggjort', 'Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag', 'Helligdagstider kan variere. Dette er ikke en aktuel åbningsstatus.']
  };
  const categories = ['all', 'cafe', 'cabin', 'sauna', 'rest'];
  const geoCopy = {
    nb: ['Utgangspunkt', 'Velg by / hele landet', 'Bruk posisjonen min', 'Radius', 'Hele Norge', 'Posisjonen din', 'Henter posisjon…', 'Posisjonstilgang ble avslått. Velg en by manuelt.', 'Posisjonen kunne ikke hentes. Velg en by eller prøv igjen.', 'Geolokalisering støttes ikke i denne nettleseren.', 'i luftlinje', 'Velg en by eller bruk posisjonen din for å søke innenfor en radius.', 'Ingen katalogsteder i denne radiusen. Utvid radiusen eller velg hele Norge.', 'GPS brukes bare i denne økten, etter ditt klikk. Avstand er i luftlinje, ikke kjørelengde.'],
    en: ['Starting point', 'Choose a town / nationwide', 'Use my location', 'Radius', 'All Norway', 'Your location', 'Getting your location…', 'Location access was denied. Choose a town manually.', 'Location could not be obtained. Choose a town or try again.', 'This browser does not support geolocation.', 'in a straight line', 'Choose a town or use your location to search within a radius.', 'No catalogue places in this radius. Increase the radius or choose all Norway.', 'GPS is used only for this session, after your click. Distances are straight-line distances, not driving distances.'],
    uk: ['Звідки їдете', 'Виберіть місто / вся країна', 'Моє місцезнаходження', 'Радіус', 'Уся Норвегія', 'Ваше місцезнаходження', 'Визначення місцезнаходження…', 'Доступ до геолокації відхилено. Виберіть місто вручну.', 'Не вдалося визначити місцезнаходження. Виберіть місто або спробуйте ще.', 'Цей браузер не підтримує геолокацію.', 'по прямій', 'Виберіть місто або геолокацію для пошуку в заданому радіусі.', 'У каталозі немає місць у цьому радіусі. Збільште його або виберіть усю Норвегію.', 'GPS використовується лише в цьому сеансі й після натискання. Відстань по прямій, а не дорогою.'],
    sv: ['Utgångspunkt', 'Välj ort / hela landet', 'Använd min plats', 'Radie', 'Hela Norge', 'Din plats', 'Hämtar din plats…', 'Platsåtkomst nekades. Välj en ort manuellt.', 'Platsen kunde inte hämtas. Välj en ort eller försök igen.', 'Webbläsaren stöder inte geolokalisering.', 'fågelvägen', 'Välj en ort eller din plats för att söka inom en radie.', 'Inga katalogplatser inom radien. Öka radien eller välj hela Norge.', 'GPS används bara under denna session, efter ditt klick. Avstånd är fågelvägen, inte körsträckor.'],
    da: ['Udgangspunkt', 'Vælg by / hele landet', 'Brug min placering', 'Radius', 'Hele Norge', 'Din placering', 'Henter din placering…', 'Adgang til placering blev afvist. Vælg en by manuelt.', 'Placeringen kunne ikke hentes. Vælg en by eller prøv igen.', 'Browseren understøtter ikke geolokalisering.', 'i luftlinje', 'Vælg en by eller din placering for at søge inden for en radius.', 'Ingen katalogsteder inden for radius. Udvid radius eller vælg hele Norge.', 'GPS bruges kun i denne session, efter dit klik. Afstande er i luftlinje, ikke køreafstande.']
  };
  const cities = [
    ['Gran',60.3592,10.5728], ['Oslo',59.9139,10.7522], ['Bergen',60.3913,5.3221], ['Stavanger',58.969,5.7331], ['Kristiansand',58.1467,7.9956], ['Trondheim',63.4305,10.3951], ['Ålesund',62.4722,6.1549], ['Bodø',67.2804,14.4049], ['Tromsø',69.6492,18.9553], ['Alta',69.9689,23.2716], ['Kirkenes',69.7271,30.045]
  ].map(([name,latitude,longitude]) => ({name,latitude,longitude}));
  Object.entries(geoCopy).forEach(([language, row]) => row.push({nb: 'Det tok for lang tid å hente posisjonen. Velg en by eller prøv igjen.', en: 'Getting your location timed out. Choose a town or try again.', uk: 'Час визначення місцезнаходження минув. Виберіть місто або спробуйте ще.', sv: 'Tiden för att hämta platsen gick ut. Välj en ort eller försök igen.', da: 'Det tog for lang tid at hente placeringen. Vælg en by eller prøv igen.'}[language]));
  Object.entries(geoCopy).forEach(([language, row]) => {
    row[2] = {nb:'Vis steder nær meg',en:'Show places near me',uk:'Показати поруч зі мною',sv:'Visa platser nära mig',da:'Vis steder i nærheden af mig'}[language];
    row.push(...{nb:['Nærmeste tettsted', 'Endre sted'],en:['Nearest settlement', 'Change location'],uk:['Найближчий населений пункт', 'Змінити місце'],sv:['Närmaste ort', 'Ändra plats'],da:['Nærmeste bebyggelse', 'Skift placering']}[language]);
    row[14] = {nb:'Posisjonen ble ikke funnet i tide. Sjekk at nettleseren har posisjonstilgang, og trykk igjen.',en:'Your location was not found in time. Check the browser’s location permission and press the button again.',uk:'Не вдалося вчасно визначити місцезнаходження. Перевірте доступ браузера до геолокації й натисніть ще раз.',sv:'Platsen hittades inte i tid. Kontrollera webbläsarens platsåtkomst och tryck igen.',da:'Placeringen blev ikke fundet i tide. Kontrollér browserens adgang til placering og tryk igen.'}[language];
    row.push({nb:'Prøver en ny, mer nøyaktig posisjon…',en:'Trying a fresh, more accurate location…',uk:'Нова спроба визначити точніше місцезнаходження…',sv:'Försöker hämta en ny, mer exakt plats…',da:'Prøver at hente en ny, mere præcis placering…'}[language]);
  });
  const originState = createOriginState();
  let baseChoice = '', radius = 'all', geoMessage = '', geoControls, geoStatus, gpsButton, manualDetails, manualOpen = false, gpsRequest;
  let townsPromise, townsMeta;
  function loadTowns() {
    if (!townsPromise) {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
      townsPromise = fetch('./norway-towns.json?v=1', {signal: controller.signal}).then(response => {if (!response.ok) throw Error(); return response.json();}).then(data => {
        if (!Array.isArray(data?.towns)) throw Error(); townsMeta = data;
        return data.towns.filter(town => typeof town.name === 'string' && validPoint(town));
      }).catch(() => []).finally(() => clearTimeout(timer));
    }
    return townsPromise;
  }
  const lang = () => copy[window.FjordI18n?.language || document.documentElement.lang] ? (window.FjordI18n?.language || document.documentElement.lang) : 'nb';
  const t = n => copy[lang()][n];
  const g = n => geoCopy[lang()][n];
  const local = value => typeof value === 'string' ? value : value?.[lang()] || value?.en || value?.nb || '';
  const node = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const safe = value => { if (typeof value !== 'string' || !value.trim()) return ''; try { const u = new URL(value, document.baseURI); return u.protocol === 'https:' || (u.protocol === location.protocol && u.origin === location.origin) ? u.href : ''; } catch { return ''; } };
  const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').toLowerCase();
  let section, grid, status, search, select, more, records = [], query = '', category = 'all', limit = 12, loading = true, failed = false;
  function link(text, href, cls = '') { const a = node('a', cls, text); a.href = safe(href); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
  function directions(r) { return routeUrl(r, originState.current); }
  const flipCopy = {nb:['Om stedet','Til bildet'],en:['About this place','Back to photo'],uk:['Про місце','До фотографії'],sv:['Om platsen','Till bilden'],da:['Om stedet','Til billedet']};
  let lastCardScroll = 0;
  window.addEventListener('scroll', () => {lastCardScroll = performance.now();}, {passive:true});
  function foldCatalogue(article, visual, body, r, image, photos) {
    article.classList.add('catalogue-flip');
    if (image) article.style.setProperty('--catalogue-photo', `url("${image}")`);
    const caption = node('div','catalogue-front-caption');
    caption.append(window.FjordDemoPrices.badge(r.name));
    caption.append(node('small','',[r.town,r.region].filter(Boolean).join(' · ')),node('strong','',r.name));
    article.append(caption);
    const labels = flipCopy[lang()];
    const prompts={nb:['Foto','Informasjon og adresse'],en:['Photos','Information & address'],uk:['Фото','Інформація та адреса'],sv:['Foto','Information och adress'],da:['Foto','Information og adresse']}[lang()];
    const photoLabel=visual.querySelector('.norway-catalog-photo-label');
    if(photoLabel)photoLabel.textContent=prompts[0];
    const toggle = node('button','catalogue-flip-toggle',labels[0]+' ↻'); toggle.type='button';
    let dwell, hoverOpened=false;
    function side(open) {
      clearTimeout(dwell); article.classList.toggle('catalogue-flipped',open);
      visual.inert=open; body.inert=!open; caption.hidden=open;
      toggle.setAttribute('aria-expanded',String(open)); toggle.textContent=open?labels[1]+' ↶':prompts[1];
    }
    toggle.onclick=()=>{hoverOpened=false;side(!article.classList.contains('catalogue-flipped'));};
    article.addEventListener('pointerenter',event=>{
      if(event.pointerType==='touch'||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
      dwell=setTimeout(()=>{if(article.isConnected&&article.matches(':hover')&&!article.matches(':focus-within')&&performance.now()-lastCardScroll>300&&!document.querySelector('dialog[open]')){hoverOpened=true;side(true);}},2000);
    });
    article.addEventListener('pointerleave',()=>{clearTimeout(dwell);if(hoverOpened&&!article.matches(':focus-within')){hoverOpened=false;side(false);}});
    article.addEventListener('keydown',event=>{if(event.key==='Escape'){hoverOpened=false;side(false);toggle.focus({preventScroll:true});}});
    article.append(toggle); side(false);
    const img=visual.querySelector('img');
    const sources=[...new Set([image,...photos.map(p=>safe(p.src))].filter(Boolean))];
    if(img&&sources.length>1) {img.alt=r.name;img.dataset.slides=JSON.stringify(sources);img.dataset.slide='0';}
  }
  // One shared clock: pause offscreen cards, inactive tabs, open galleries and reduced motion.
  setInterval(()=>{
    if(document.hidden||document.querySelector('dialog[open]')||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    document.querySelectorAll('.catalogue-flip:not(.catalogue-flipped) img[data-slides]').forEach(img=>{
      const rect=img.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;
      const sources=JSON.parse(img.dataset.slides), next=(Number(img.dataset.slide)+1)%sources.length;
      img.dataset.slide=String(next);img.src=sources[next];
      img.closest('.catalogue-flip').style.setProperty('--catalogue-photo',`url("${sources[next]}")`);
    });
  },6500);
  function card(r) {
    const article = node('article', 'norway-catalog-card');
    const photos = (Array.isArray(r.gallery) ? r.gallery : []).filter(p => safe(p.src));
    const image = safe(r.image) || safe(photos[0]?.src);
    const visual = node(image ? 'button' : 'div', 'norway-catalog-photo');
    if (image) {
      visual.type = 'button'; visual.setAttribute('aria-label', `${t(12)} — ${r.name}`);
      const img = node('img'); img.src = image; img.alt = local(r.photoAlt) || r.name; img.loading = 'lazy'; img.decoding = 'async';
      img.addEventListener('error', () => {img.remove(); visual.append(node('span', 'norway-catalog-no-photo', t(20)));}, {once: true});
      visual.append(img, node('span', 'norway-catalog-photo-label', t(12) + ' ↗'));
      visual.onclick = () => window.FjordStayGallery?.open({...r, directionsUrl: directions(r), gallery: photos.length ? photos : [{src: image, kind: r.category === 'cafe' ? 'facade' : 'grounds', source: r.imageSource, credit: r.photoCredit, license: r.photoLicense, licenseUrl: r.photoLicenseUrl}]});
    } else visual.append(node('p', 'norway-catalog-no-photo', t(20)));
    article.append(visual);
    const body = node('div', 'norway-catalog-copy');
    const locationLabel = node('p', 'norway-catalog-location', [t(4 + Math.max(1, categories.indexOf(r.category))), r.town, r.region].filter(Boolean).join(' · '));
    locationLabel.title = locationLabel.textContent;
    const title = node('h3', '', r.name); title.title = r.name;
    body.append(locationLabel, title);
    const about = node('details', 'norway-catalog-about');
    const summary = node('summary', '', {nb:'Om stedet',en:'About this place',uk:'Про місце',sv:'Om platsen',da:'Om stedet'}[lang()]);
    const content = node('div', 'norway-catalog-about-content');
    content.append(window.FjordDemoPrices.badge(r.name));
    content.append(node('p', 'norway-catalog-description', local(r.description)));
    about.append(summary, content);
    // Only deliberate click/keyboard activation reveals details.
    about.addEventListener('toggle', () => {
      article.classList.toggle('is-expanded', about.open);
      content.querySelectorAll('details').forEach(detail => {detail.open = about.open;});
    });
    if (r.address) {
      const address = node('details', 'norway-catalog-address-details');
      const addressSummary = node('summary', '', {nb:'Adresse',en:'Address',uk:'Адреса',sv:'Adress',da:'Adresse'}[lang()]);
      address.append(addressSummary, node('p', 'norway-catalog-address', r.address));
      content.append(address);
    }
    if (r.catalogueDistance !== null && r.catalogueDistance !== undefined) body.append(node('p', 'norway-catalog-distance', `${r.coordinatePrecision === 'area' ? '≈ ' : ''}${new Intl.NumberFormat(lang(), {maximumFractionDigits: 1}).format(r.catalogueDistance)} km ${g(10)}`));
    const hours = node('details', 'norway-catalog-hours'); hours.append(node('summary', '', t(15)));
    const note = local(r.hoursNote) || local(r.openingHours?.publishedText);
    if (note && note !== local(r.description)) content.append(node('p', 'norway-catalog-hours-note', note));
    const weekly = r.openingHours?.verified === true && r.openingHours?.weekly;
    if (Array.isArray(weekly) && weekly.length === 7) {
      const list = node('ul'); const days = t(25).split('|');
      weekly.forEach((periods, index) => {const display = Array.isArray(periods) && periods.length ? periods.map(p => Array.isArray(p) ? p.join('–') : String(p)).join(', ') : t(24); list.append(node('li', '', `${days[index]}: ${display}`));});
      hours.append(list, node('p', 'norway-catalog-muted', t(26))); content.append(hours);
    } else if (local(r.openingHours?.publishedText)) {
      hours.append(node('p', '', local(r.openingHours.publishedText)), node('p', 'norway-catalog-muted', t(26))); content.append(hours);
    } else if (!note) content.append(node('p', 'norway-catalog-hours-note', t(16)));
    const actions = node('nav', 'norway-catalog-actions'); actions.setAttribute('aria-label', r.name);
    if (local(r.visitInfo?.text)) {
      const visit = node('details', 'norway-catalog-hours');
      visit.append(node('summary', '', {nb:'Før du drar',en:'Before you go',uk:'Перед поїздкою',sv:'Före besöket',da:'Før afrejse'}[lang()]), node('p', '', local(r.visitInfo.text)));
      if (safe(r.visitInfo.source)) visit.append(link(t(17) + ' ↗', r.visitInfo.source));
      if (r.visitInfo.checked) visit.append(node('p', 'norway-catalog-muted', `${t(18)}: ${r.visitInfo.checked}`));
      content.append(visit);
    }
    if (safe(r.website)) actions.append(link(t(13) + ' ↗', r.website));
    if (safe(r.bookingUrl)) actions.append(link(({nb:'Bestill',en:'Book',uk:'Забронювати',sv:'Boka',da:'Book'})[lang()] + ' ↗', r.bookingUrl));
    actions.append(link(t(14) + ' ↗', directions(r))); body.append(about, actions);
    const meta = node('div', 'norway-catalog-meta');
    const infoSource = safe(r.source) || safe(r.openingHours?.source) || safe(r.website);
    if (infoSource) meta.append(link(t(17) + ' ↗', infoSource));
    const checked = r.checked || r.openingHours?.checked;
    if (checked) meta.append(node('span', '', `${t(18)}: ${checked}`));
    if (local(r.photoCaption)) meta.append(node('span', '', local(r.photoCaption)));
    if (safe(r.imageSource || photos[0]?.source)) meta.append(link(t(19) + ' ↗', r.imageSource || photos[0].source));
    content.append(meta); article.append(body);
    about.open = true; content.querySelectorAll('details').forEach(detail => {detail.open=true;});
    foldCatalogue(article,visual,body,r,image,photos);
    return article;
  }
  function render() {
    if (!grid) return;
    const filtered = nearby(records.filter(r => (category === 'all' || r.category === category) && (!query || fold([r.name, r.town, r.region, r.address].join(' ')).includes(fold(query)))), originState.current, radius);
    grid.replaceChildren(...filtered.slice(0, limit).map(card));
    status.textContent = loading ? t(21) : failed ? t(22) : filtered.length ? `${Math.min(limit, filtered.length)} / ${filtered.length} ${t(9)}` : radius !== 'all' && !originState.current ? g(11) : radius !== 'all' ? g(12) : t(11);
    renderGeoStatus();
    more.hidden = loading || failed || filtered.length <= limit;
    more.textContent = t(10);
    if (failed) {const retry = node('button', 'norway-catalog-retry', t(23)); retry.type = 'button'; retry.onclick = load; grid.append(retry);}
  }
  function mount() {
    if (section || !document.getElementById('cafeStops')) return;
    section = node('section', 'norway-catalog'); section.id = 'norwayCatalogue'; section.dataset.i18nIgnore = ''; section.setAttribute('aria-labelledby', 'norwayCatalogueTitle');
    document.getElementById('cafeStops').before(section); rebuild(); load();
  }
  function renderGeoStatus() {
    if (!geoStatus) return;
    const point = originState.current;
    const label = point ? (baseChoice === 'gps' ? g(5) + (point.nearestTown ? ` · ${g(15)}: ${point.nearestTown}` : '') : point.name) : '';
    geoStatus.textContent = (geoMessage ? g(Number(geoMessage)) + ' ' : '') + (label ? `${g(0)}: ${label}. ` : '') + g(13);
    if (baseChoice === 'gps' && point?.nearestTown && safe(townsMeta?.source)) geoStatus.append(document.createTextNode(' · '), link(townsMeta.attribution || 'Kartverket / SSR', townsMeta.attributionUrl || townsMeta.source));
    if (gpsButton) {const searching = geoMessage === '6' || geoMessage === '17'; gpsButton.disabled = searching; gpsButton.textContent = searching ? g(Number(geoMessage)) : g(2);}
  }
  function cancelGPS() {gpsRequest?.cancel(); gpsRequest = null;}
  function chooseCity(value) {
    baseChoice = value; geoMessage = ''; originState.set(cities.find(c => c.name === value));
    cancelGPS();
    if (value && radius === 'all') radius = '50';
    limit = 12; rebuild();
  }
  function requestGPS() {
    cancelGPS();
    if (!window.FjordBrowserGeolocation) {geoMessage = '8'; manualOpen = true; if (manualDetails) manualDetails.open = true; renderGeoStatus(); return;}
    const token = originState.beginGPS(); geoMessage = '6'; renderGeoStatus();
    const townData = loadTowns(); // Local static file only: coordinates are never sent to an external lookup.
    const request = window.FjordBrowserGeolocation.locate({userInitiated:true, onStage: state => {
      if (!originState.isCurrent(token)) return; geoMessage = state.stage === 'fresh' ? '17' : '6'; renderGeoStatus();
    }});
    gpsRequest = request;
    request.promise.then(async position => {
      const point = {latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy};
      if (!originState.isCurrent(token)) return;
      const towns = await townData;
      if (!originState.isCurrent(token)) return;
      point.nearestTown = nearestCity(point, towns, 50)?.name || '';
      if (!originState.acceptGPS(token, point)) {geoMessage = '8'; renderGeoStatus(); return;}
      baseChoice = 'gps'; geoMessage = ''; if (radius === 'all') radius = '20'; limit = 12; rebuild();
    }).catch(error => {
      if (!originState.isCurrent(token)) return;
      if (error.code === 'cancelled') return;
      geoMessage = error.code === 1 ? '7' : error.code === 3 ? '14' : error.code === 'unsupported' ? '9' : '8'; manualOpen = true; if (manualDetails) manualDetails.open = true; renderGeoStatus();
    }).finally(() => {if (gpsRequest === request) gpsRequest = null;});
  }
  function rebuild() {
    if (!section) return;
    let shortcut = document.getElementById('norwayCatalogueShortcut');
    if (!shortcut) {shortcut = node('a'); shortcut.id = 'norwayCatalogueShortcut'; shortcut.href = '#norwayCatalogue'; shortcut.dataset.i18nIgnore = ''; document.querySelector('header nav')?.append(shortcut);}
    shortcut.textContent = {nb:'Katalog',en:'Catalogue',uk:'Каталог',sv:'Katalog',da:'Katalog'}[lang()];
    const eyebrow = node('p', 'norway-catalog-eyebrow', t(0)), title = node('h2', '', t(1)); title.id = 'norwayCatalogueTitle';
    const controls = node('div', 'norway-catalog-controls');
    const searchLabel = node('label', '', t(3)); search = node('input'); search.type = 'search'; search.maxLength = 120; search.value = query; search.placeholder = 'Gran, Bergen, Hardanger…'; search.autocomplete = 'off'; searchLabel.append(search);
    const categoryLabel = node('label', '', t(4)); select = node('select');
    categories.forEach((value, index) => {const option = node('option', '', t(4 + index)); option.value = value; select.append(option);}); select.value = category; categoryLabel.append(select);
    controls.append(searchLabel, categoryLabel); status = node('p', 'norway-catalog-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    geoControls = node('div', 'norway-catalog-geo-controls');
    const baseLabel = node('label', '', g(0)), baseSelect = node('select'); baseSelect.id = 'norwayCatalogueOrigin';
    const defaultOption = node('option', '', g(1)); defaultOption.value = ''; baseSelect.append(defaultOption);
    if (baseChoice === 'gps') {const gpsOption = node('option', '', g(5)); gpsOption.value = 'gps'; baseSelect.append(gpsOption);}
    if (baseChoice === 'stop') {const stopOption = node('option', '', originState.current?.name || ''); stopOption.value = 'stop'; baseSelect.append(stopOption);}
    cities.forEach(c => {const option = node('option', '', c.name); option.value = c.name; baseSelect.append(option);}); baseSelect.value = baseChoice;
    baseSelect.onchange = () => {if (!['gps','stop'].includes(baseSelect.value)) chooseCity(baseSelect.value);}; baseLabel.append(baseSelect);
    const radiusLabel = node('label', '', g(3)), radiusSelect = node('select'); radiusSelect.id = 'norwayCatalogueRadius';
    ['20','50','100','250','all'].forEach(value => {const option = node('option', '', value === 'all' ? g(4) : value + ' km'); option.value = value; radiusSelect.append(option);}); radiusSelect.value = radius;
    radiusSelect.onchange = () => {radius = radiusSelect.value; limit = 12; render();}; radiusLabel.append(radiusSelect);
    gpsButton = node('button', 'norway-catalog-gps', g(2)); gpsButton.type = 'button'; gpsButton.onclick = requestGPS;
    geoControls.append(gpsButton, radiusLabel);
    manualDetails = node('details', 'norway-catalog-manual'); manualDetails.open = manualOpen; manualDetails.append(node('summary', '', g(16)), baseLabel); manualDetails.ontoggle = () => {manualOpen = manualDetails.open;};
    geoStatus = node('p', 'norway-catalog-geo-status'); geoStatus.setAttribute('role', 'status'); geoStatus.setAttribute('aria-live', 'polite');
    grid = node('div', 'norway-catalog-grid'); more = node('button', 'norway-catalog-more', t(10)); more.type = 'button'; more.onclick = () => {limit += 12; render();};
    search.oninput = () => {query = search.value.trim(); limit = 12; render();}; select.onchange = () => {category = select.value; limit = 12; render();};
    section.replaceChildren(eyebrow, title, node('p', 'norway-catalog-intro', t(2)), geoControls, geoStatus, manualDetails, controls, status, grid, more); render();
  }
  async function load() {
    loading = true; failed = false; render();
    try {const response = await fetch('./norway-catalog.json?v=8'); if (!response.ok) throw Error(); const data = await response.json(); if (!Array.isArray(data)) throw Error(); records = data.filter(r => r && typeof r.name === 'string' && categories.includes(r.category) && r.category !== 'all');}
    catch {failed = true;} finally {loading = false; render();}
  }
  window.FjordCatalogueCards=Object.freeze({fold:foldCatalogue});
  window.dispatchEvent(new CustomEvent('fjord:catalogue-cards-ready'));
  window.addEventListener('fjordlanguagechange', rebuild);
  window.addEventListener('fjord:catalogue-select', event => {
    const record = records.find(r => r.id === event.detail?.id);
    if (!record || !validPoint(record)) return;
    originState.set({latitude:record.latitude, longitude:record.longitude, name:record.name}); cancelGPS();
    baseChoice = 'stop'; category = record.category; radius = '20'; query = record.name; geoMessage = ''; manualOpen = false; limit = 12; rebuild();
    section?.scrollIntoView({block:'start',behavior:'smooth'}); search?.focus({preventScroll:true});
  });
  window.addEventListener('fjord:catalogue-nearby', event => {
    const detail = event.detail || {}, point = {latitude:detail.lat, longitude:detail.lng, name:String(detail.name || '').slice(0,160)};
    if (!validPoint(point) || !['cabin','sauna'].includes(detail.category)) return;
    originState.set(point); cancelGPS(); baseChoice = 'stop'; category = detail.category; radius = '20'; query = ''; geoMessage = ''; manualOpen = false; limit = 12; rebuild();
    section?.scrollIntoView({block:'start',behavior:'smooth'}); select?.focus({preventScroll:true});
  });
  window.addEventListener('pagehide', () => {originState.set(originState.current); cancelGPS(); if (geoMessage === '6' || geoMessage === '17') geoMessage = ''; renderGeoStatus();});
  const observer = new MutationObserver(() => {mount(); if (section) observer.disconnect();});
  observer.observe(document.body, {childList: true, subtree: true}); mount(); if (section) observer.disconnect();
})();
