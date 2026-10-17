/* The site's own curated catalogue: one local data request, no search API. */
(() => {
  'use strict';
  const copy = {
    nb: ['Norge, stopp for stopp', 'Vår egen reisekatalog', 'Et utvalg kafeer, hytter, badstuer og fine pauser langs veien. Bilder og informasjon ligger på nettstedet. Sjekk dato og vertens nettside før besøket.', 'Søk etter sted, by eller region', 'Alle steder', 'Kafeer', 'Hytter', 'Badstuer', 'Fine pauser', 'steder', 'Vis flere', 'Ingen treff. Prøv en annen by eller kategori.', 'Åpne bildegalleri', 'Nettsted', 'Finn veien', 'Åpningstider og sesong', 'Åpningstider er ikke publisert. Kontakt stedet før besøket.', 'Informasjonskilde', 'Sist kontrollert', 'Fotokilde', 'Foto kommer når et ekte bilde er tilgjengelig.', 'Laster katalogen…', 'Kunne ikke laste katalogen.', 'Prøv igjen', 'Ikke oppgitt', 'Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag', 'Åpningstider kan endres på helligdager. Dette er ikke en sanntidsstatus.'],
    en: ['Norway, stop by stop', 'Our own travel catalogue', 'A selection of cafés, cabins, saunas and worthwhile breaks along the road. Photos and information are stored on this website. Check the date and the host’s website before visiting.', 'Search place, town or region', 'All places', 'Cafés', 'Cabins', 'Saunas', 'Places to unwind', 'places', 'Show more', 'No matches. Try another town or category.', 'Open photo gallery', 'Website', 'Get directions', 'Opening hours and season', 'Opening hours are not published. Contact the venue before visiting.', 'Information source', 'Last checked', 'Photo source', 'A photo will appear when a genuine image is available.', 'Loading catalogue…', 'Could not load the catalogue.', 'Try again', 'Not published', 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday', 'Holiday hours may differ. This is not a live open/closed status.'],
    uk: ['Норвегія, зупинка за зупинкою', 'Наш власний каталог подорожей', 'Добірка кав’ярень, будиночків, саун і місць для відпочинку дорогою. Фото та інформація зберігаються на сайті. Перед візитом перевірте дату й сайт закладу.', 'Пошук місця, міста або регіону', 'Усі місця', 'Кав’ярні', 'Будиночки', 'Сауни', 'Місця відпочинку', 'місць', 'Показати ще', 'Нічого не знайдено. Спробуйте інше місто або категорію.', 'Відкрити фотогалерею', 'Сайт', 'Прокласти маршрут', 'Години роботи та сезон', 'Години роботи не опубліковані. Уточніть у закладу перед візитом.', 'Джерело інформації', 'Перевірено', 'Джерело фото', 'Фото з’явиться, коли буде доступний справжній знімок.', 'Завантаження каталогу…', 'Не вдалося завантажити каталог.', 'Спробувати ще', 'Не опубліковано', 'Понеділок|Вівторок|Середа|Четвер|П’ятниця|Субота|Неділя', 'У свята графік може змінюватися. Це не поточний статус роботи.'],
    sv: ['Norge, stopp för stopp', 'Vår egen resekatalog', 'Ett urval kaféer, stugor, bastur och fina pauser längs vägen. Bilder och information finns på webbplatsen. Kontrollera datum och värdens webbplats före besöket.', 'Sök plats, ort eller region', 'Alla platser', 'Kaféer', 'Stugor', 'Bastur', 'Platser att koppla av', 'platser', 'Visa fler', 'Inga träffar. Prova en annan ort eller kategori.', 'Öppna bildgalleri', 'Webbplats', 'Hitta hit', 'Öppettider och säsong', 'Öppettider är inte publicerade. Kontakta platsen före besöket.', 'Informationskälla', 'Senast kontrollerad', 'Bildkälla', 'En bild visas när ett äkta foto finns tillgängligt.', 'Laddar katalogen…', 'Katalogen kunde inte laddas.', 'Försök igen', 'Inte publicerat', 'Måndag|Tisdag|Onsdag|Torsdag|Fredag|Lördag|Söndag', 'Helgdagstider kan avvika. Detta är inte en aktuell öppetstatus.'],
    da: ['Norge, stop for stop', 'Vores eget rejsekatalog', 'Et udvalg af caféer, hytter, saunaer og fine pauser langs vejen. Billeder og information ligger på hjemmesiden. Kontrollér dato og værtens hjemmeside før besøget.', 'Søg sted, by eller region', 'Alle steder', 'Caféer', 'Hytter', 'Saunaer', 'Steder til en pause', 'steder', 'Vis flere', 'Ingen resultater. Prøv en anden by eller kategori.', 'Åbn billedgalleri', 'Hjemmeside', 'Find vej', 'Åbningstider og sæson', 'Åbningstider er ikke offentliggjort. Kontakt stedet før besøget.', 'Informationskilde', 'Sidst kontrolleret', 'Billedkilde', 'Et billede vises, når et ægte foto er tilgængeligt.', 'Indlæser kataloget…', 'Kataloget kunne ikke indlæses.', 'Prøv igen', 'Ikke offentliggjort', 'Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag', 'Helligdagstider kan variere. Dette er ikke en aktuel åbningsstatus.']
  };
  const categories = ['all', 'cafe', 'cabin', 'sauna', 'rest'];
  const lang = () => copy[window.FjordI18n?.language || document.documentElement.lang] ? (window.FjordI18n?.language || document.documentElement.lang) : 'nb';
  const t = n => copy[lang()][n];
  const local = value => typeof value === 'string' ? value : value?.[lang()] || value?.en || value?.nb || '';
  const node = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const safe = value => { if (typeof value !== 'string' || !value.trim()) return ''; try { const u = new URL(value, document.baseURI); return u.protocol === 'https:' || (u.protocol === location.protocol && u.origin === location.origin) ? u.href : ''; } catch { return ''; } };
  const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').toLowerCase();
  let section, grid, status, search, select, more, records = [], query = '', category = 'all', limit = 12, loading = true, failed = false;
  function link(text, href, cls = '') { const a = node('a', cls, text); a.href = safe(href); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
  function directions(r) { return safe(r.directionsUrl) || 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(Number.isFinite(r.latitude) && Number.isFinite(r.longitude) ? `${r.latitude},${r.longitude}` : [r.name, r.address, r.town, 'Norway'].filter(Boolean).join(', ')); }
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
      visual.onclick = () => window.FjordStayGallery?.open({...r, gallery: photos.length ? photos : [{src: image, kind: r.category === 'cafe' ? 'facade' : 'grounds', source: r.imageSource, credit: r.photoCredit, license: r.photoLicense, licenseUrl: r.photoLicenseUrl}]});
    } else visual.append(node('p', 'norway-catalog-no-photo', t(20)));
    article.append(visual);
    const body = node('div', 'norway-catalog-copy');
    body.append(node('p', 'norway-catalog-location', [t(4 + Math.max(1, categories.indexOf(r.category))), r.town, r.region].filter(Boolean).join(' · ')), node('h3', '', r.name), node('p', 'norway-catalog-description', local(r.description)));
    if (r.address) body.append(node('p', 'norway-catalog-address', r.address));
    const hours = node('details', 'norway-catalog-hours'); hours.append(node('summary', '', t(15)));
    const note = local(r.hoursNote) || local(r.openingHours?.publishedText);
    if (note && note !== local(r.description)) body.append(node('p', 'norway-catalog-hours-note', note));
    const weekly = r.openingHours?.verified === true && r.openingHours?.weekly;
    if (Array.isArray(weekly) && weekly.length === 7) {
      const list = node('ul'); const days = t(25).split('|');
      weekly.forEach((periods, index) => {const display = Array.isArray(periods) && periods.length ? periods.map(p => Array.isArray(p) ? p.join('–') : String(p)).join(', ') : t(24); list.append(node('li', '', `${days[index]}: ${display}`));});
      hours.append(list, node('p', 'norway-catalog-muted', t(26))); body.append(hours);
    } else if (local(r.openingHours?.publishedText)) {
      hours.append(node('p', '', local(r.openingHours.publishedText)), node('p', 'norway-catalog-muted', t(26))); body.append(hours);
    } else if (!note) body.append(node('p', 'norway-catalog-hours-note', t(16)));
    const actions = node('nav', 'norway-catalog-actions'); actions.setAttribute('aria-label', r.name);
    if (safe(r.website)) actions.append(link(t(13) + ' ↗', r.website));
    actions.append(link(t(14) + ' ↗', directions(r))); body.append(actions);
    const meta = node('div', 'norway-catalog-meta');
    const infoSource = safe(r.source) || safe(r.openingHours?.source) || safe(r.website);
    if (infoSource) meta.append(link(t(17) + ' ↗', infoSource));
    const checked = r.checked || r.openingHours?.checked;
    if (checked) meta.append(node('span', '', `${t(18)}: ${checked}`));
    if (local(r.photoCaption)) meta.append(node('span', '', local(r.photoCaption)));
    if (safe(r.imageSource || photos[0]?.source)) meta.append(link(t(19) + ' ↗', r.imageSource || photos[0].source));
    body.append(meta); article.append(body); return article;
  }
  function render() {
    if (!grid) return;
    const filtered = records.filter(r => (category === 'all' || r.category === category) && (!query || fold([r.name, r.town, r.region, r.address].join(' ')).includes(fold(query))));
    grid.replaceChildren(...filtered.slice(0, limit).map(card));
    status.textContent = loading ? t(21) : failed ? t(22) : filtered.length ? `${Math.min(limit, filtered.length)} / ${filtered.length} ${t(9)}` : t(11);
    more.hidden = loading || failed || filtered.length <= limit;
    more.textContent = t(10);
    if (failed) {const retry = node('button', 'norway-catalog-retry', t(23)); retry.type = 'button'; retry.onclick = load; grid.append(retry);}
  }
  function mount() {
    if (section || !document.getElementById('cafeStops')) return;
    section = node('section', 'norway-catalog'); section.id = 'norwayCatalogue'; section.dataset.i18nIgnore = ''; section.setAttribute('aria-labelledby', 'norwayCatalogueTitle');
    document.getElementById('cafeStops').before(section); rebuild(); load();
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
    grid = node('div', 'norway-catalog-grid'); more = node('button', 'norway-catalog-more', t(10)); more.type = 'button'; more.onclick = () => {limit += 12; render();};
    search.oninput = () => {query = search.value.trim(); limit = 12; render();}; select.onchange = () => {category = select.value; limit = 12; render();};
    section.replaceChildren(eyebrow, title, node('p', 'norway-catalog-intro', t(2)), controls, status, grid, more); render();
  }
  async function load() {
    loading = true; failed = false; render();
    try {const response = await fetch('./norway-catalog.json?v=1'); if (!response.ok) throw Error(); const data = await response.json(); if (!Array.isArray(data)) throw Error(); records = data.filter(r => r && typeof r.name === 'string' && categories.includes(r.category) && r.category !== 'all');}
    catch {failed = true;} finally {loading = false; render();}
  }
  window.addEventListener('fjordlanguagechange', rebuild);
  const observer = new MutationObserver(() => {mount(); if (section) observer.disconnect();});
  observer.observe(document.body, {childList: true, subtree: true}); mount(); if (section) observer.disconnect();
})();
