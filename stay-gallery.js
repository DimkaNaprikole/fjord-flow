/* Venue galleries: only photographs from the named property's own website. */
(() => {
  'use strict';
  const words = {
    nb: ['Åpne bildegalleri', 'Lukk', 'Forrige bilde', 'Neste bilde', 'Forstørr bildet', 'Tilpass bildet', 'Bildekilde', 'Kunne ikke laste bildet. Åpne bildekilden.', 'Hytter og omgivelser', 'Inne i hytta', 'Soverom', 'Badstue', 'Bad og inngang til badstuen', 'Utsikt', 'Terrasse', 'Badestamp'],
    en: ['Open photo gallery', 'Close', 'Previous photo', 'Next photo', 'Enlarge photo', 'Fit photo', 'Photo source', 'Could not load this photo. Open the photo source.', 'Cabins and grounds', 'Cabin interior', 'Bedroom', 'Sauna', 'Bathroom and sauna entrance', 'Surrounding views', 'Terrace', 'Hot tub'],
    uk: ['Відкрити фотогалерею', 'Закрити', 'Попереднє фото', 'Наступне фото', 'Збільшити фото', 'Вмістити фото', 'Джерело фото', 'Не вдалося завантажити фото. Відкрийте джерело.', 'Будиночки й територія', 'Усередині будиночка', 'Спальня', 'Сауна', 'Ванна та вхід до сауни', 'Краєвиди навколо', 'Тераса', 'Гаряча купіль'],
    sv: ['Öppna bildgalleriet', 'Stäng', 'Föregående bild', 'Nästa bild', 'Förstora bilden', 'Anpassa bilden', 'Bildkälla', 'Bilden kunde inte laddas. Öppna bildkällan.', 'Stugor och omgivning', 'Inne i stugan', 'Sovrum', 'Bastu', 'Badrum och ingång till bastun', 'Utsikt', 'Terrass', 'Badtunna'],
    da: ['Åbn billedgalleri', 'Luk', 'Forrige billede', 'Næste billede', 'Forstør billedet', 'Tilpas billedet', 'Billedkilde', 'Billedet kunne ikke indlæses. Åbn billedkilden.', 'Hytter og omgivelser', 'Inde i hytten', 'Soveværelse', 'Sauna', 'Bad og indgang til saunaen', 'Udsigt', 'Terrasse', 'Vildmarksbad']
  };
  Object.entries(words).forEach(([lang, row]) => row.push(...{"nb":["Kafeen utenfra","Inne i kafeen","Kaffe og bakverk"],"en":["Café exterior","Inside the café","Coffee and baked treats"],"uk":["Кав’ярня зовні","Усередині кав’ярні","Кава та випічка"],"sv":["Kaféets utsida","Inne i kaféet","Kaffe och bakverk"],"da":["Caféen udefra","Inde i caféen","Kaffe og bagværk"]}[lang]));
  Object.entries(words).forEach(([lang,row]) => row.push({nb:'Stedet og omgivelsene',en:'Place and surroundings',uk:'Місце та краєвиди',sv:'Platsen och omgivningen',da:'Stedet og omgivelserne'}[lang]));
  const kinds = {place: 19, facade: 16, cafeInside: 17, food: 18, grounds: 8, inside: 9, bedroom: 10, sauna: 11, bathSauna: 12, view: 13, terrace: 14, hotTub: 15};
  const language = () => window.FjordI18n?.language || document.documentElement.lang;
  const w = () => words[language()] || words.nb;
  const el = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls || ''; if (text) e.textContent = text; return e; };
  const valid = value => { if (typeof value !== "string" || !value.trim()) return ""; try {const u = new URL(value, document.baseURI); return u.protocol === 'https:' || u.origin === location.origin ? u.href : '';} catch {return '';} };
  let dialog, stage, photo, title, counter, caption, source, license, thumbs, error, previous, next, close;
  let record, photos = [], index = 0, touchStart, cafeInfo, cafeTimer, venueActions;
  function button(cls, text, handler) { const b = el('button', cls, text); b.type = 'button'; b.onclick = handler; return b; }
  function show(i) {
    index = (i + photos.length) % photos.length;
    const p = photos[index], label = w()[kinds[p.kind] || 8];
    photo.hidden = false; error.hidden = true;
    photo.alt = record.name + ' — ' + label; photo.src = valid(p.src);
    caption.textContent = label; counter.textContent = `${index + 1} / ${photos.length}`;
    source.href = valid(p.source || record.imageSource || record.website);
    source.textContent = [p.credit, w()[6] + ' ↗'].filter(Boolean).join(' · ');
    license.hidden = !valid(p.licenseUrl); license.textContent = p.license || ''; if (!license.hidden) license.href = valid(p.licenseUrl);
    [...thumbs.children].forEach((b, n) => {b.setAttribute('aria-current', String(n === index));});
  }
  function create() {
    dialog = el('dialog', 'stay-gallery'); dialog.id = 'stayGallery'; dialog.dataset.i18nIgnore = '';
    dialog.setAttribute('aria-labelledby', 'stayGalleryTitle');
    const header = el('div', 'stay-gallery-header');
    title = el('h2'); title.id = 'stayGalleryTitle';
    close = button('stay-gallery-icon stay-gallery-close', '×', () => dialog.close());
    header.append(title, close);
    const viewer = el('div', 'stay-gallery-viewer');
    stage = el('div', 'stay-gallery-stage'); photo = el('img'); photo.decoding = 'async';
    photo.onerror = () => {photo.hidden = true; error.hidden = false;};
    error = el('p', 'stay-gallery-error'); error.setAttribute('role', 'status'); error.hidden = true;
    stage.append(photo, error);
    previous = button('stay-gallery-icon stay-gallery-prev', '‹', () => show(index - 1));
    next = button('stay-gallery-icon stay-gallery-next', '›', () => show(index + 1));
    viewer.append(stage, previous, next);
    const meta = el('div', 'stay-gallery-meta');
    const details = el('div'); caption = el('strong'); counter = el('span', 'stay-gallery-counter');
    counter.setAttribute('aria-live', 'polite'); details.append(caption, counter);
    source = el('a', 'stay-gallery-source'); source.target = '_blank'; source.rel = 'noopener noreferrer';
    license = el('a', 'stay-gallery-source'); license.target = '_blank'; license.rel = 'noopener noreferrer'; license.hidden = true;
    meta.append(details, source, license);
    thumbs = el('nav', 'stay-gallery-thumbs');
    cafeInfo = el('section', 'cafe-gallery-info'); cafeInfo.hidden = true;
    venueActions = el('nav', 'stay-gallery-venue-actions'); venueActions.hidden = true;
    dialog.append(header, cafeInfo, venueActions, viewer, meta, thumbs); document.body.append(dialog);
    dialog.addEventListener('close', () => clearInterval(cafeTimer));
    dialog.addEventListener('click', e => {if (e.target === dialog) dialog.close();});
    dialog.addEventListener('keydown', e => {
      if(e.target.closest?.('.google-place-map'))return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {e.preventDefault(); show(index + (e.key === 'ArrowRight' ? 1 : -1));}
    });
    stage.addEventListener('touchstart', e => {touchStart = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null;}, {passive: true});
    stage.addEventListener('touchend', e => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart[0], dy = e.changedTouches[0].clientY - touchStart[1];
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) show(index + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, {passive: true});
  }
  window.FjordStayGallery = {
    label: () => w()[0],
    open(venue) {
      const list = (Array.isArray(venue.gallery) ? venue.gallery : [{src: venue.image, kind: 'grounds'}]).filter(p => valid(p.src));
      if (!list.length) return;
      if (!dialog) create();
      record = venue; photos = list; title.textContent = venue.name;
      close.setAttribute('aria-label', w()[1]); previous.setAttribute('aria-label', w()[2]); next.setAttribute('aria-label', w()[3]);
      source.textContent = w()[6] + ' ↗'; error.textContent = w()[7];
      thumbs.setAttribute('aria-label', w()[0]);
      thumbs.replaceChildren(...photos.map((p, i) => {
        const b = button('stay-gallery-thumb', '', () => show(i));
        b.setAttribute('aria-label', `${i + 1}. ${w()[kinds[p.kind] || 8]}`);
        const img = el('img'); img.src = valid(p.src); img.alt = ''; img.loading = 'lazy'; b.append(img); return b;
      }));
      previous.hidden = next.hidden = photos.length < 2;
      venueActions.replaceChildren(); venueActions.hidden = !venue.website || Boolean(venue.openingHours && !venue.bookingUrl);
      if (!venueActions.hidden) {
        const labels = {nb:['Nettsted','Bestill','Finn veien'],en:['Website','Book a stay','Get directions'],uk:['Сайт','Забронювати','Прокласти маршрут'],sv:['Webbplats','Boka','Hitta hit'],da:['Hjemmeside','Book','Find vej']}[language()] || ['Website','Book a stay','Get directions'];
        if (venue.category && venue.category !== 'cabin') labels[1] = {nb:'Bestill',en:'Book',uk:'Забронювати',sv:'Boka',da:'Book'}[language()] || 'Book';
        venueActions.setAttribute('aria-label', venue.name);
        const targets = [venue.website, venue.bookingUrl, venue.directionsUrl || 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(venue.routeQuery || [venue.name,venue.address,venue.area,venue.town,'Norway'].filter(Boolean).join(', '))];
        targets.forEach((target, i) => {
          if (venue.openingHours && i !== 1) return;
          let url; try { url = new URL(target); } catch { return; }
          if (url.protocol !== 'https:' || url.username || url.password) return;
          const a = el('a', i === 1 ? 'stay-gallery-book' : '', labels[i] + ' ↗');
          a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; venueActions.append(a);
        });
      }
      clearInterval(cafeTimer);
      const refreshCafe = window.FjordCafeGalleryInfo?.render(cafeInfo, venue);
      if (venue.visitInfo?.text) {
        const info = venue.visitInfo, text = typeof info.text === 'string' ? info.text : info.text[language()] || info.text.en || info.text.nb;
        if (text) {
          cafeInfo.hidden = false;
          const visit = el('details', 'cafe-gallery-hours');
          visit.append(el('summary', '', {nb:'Før du drar',en:'Before you go',uk:'Перед поїздкою',sv:'Före besöket',da:'Før afrejse'}[language()] || 'Before you go'), el('p', '', text));
          if (valid(info.source)) {const a = el('a', '', ({nb:'Informasjonskilde',en:'Information source',uk:'Джерело інформації',sv:'Informationskälla',da:'Informationskilde'}[language()] || 'Information source') + ' ↗'); a.href = valid(info.source); a.target = '_blank'; a.rel = 'noopener noreferrer'; visit.append(a);}
          if (info.checked) visit.append(el('p', 'cafe-gallery-muted', info.checked));
          cafeInfo.append(visit);
        }
      }
      if (!venue.openingHours && venue.hoursNote) {
        const local = value => typeof value === 'string' ? value : value?.[language()] || value?.en || value?.nb || '';
        cafeInfo.hidden = false;
        const details = el('details', 'cafe-gallery-hours');
        details.append(el('summary', '', {nb:'Besøk og bestilling',en:'Visiting and booking',uk:'Відвідування та бронювання',sv:'Besök och bokning',da:'Besøg og booking'}[language()] || 'Visiting and booking'), el('p', '', local(venue.hoursNote)));
        if (venue.address) details.append(el('p', 'cafe-gallery-address', venue.address));
        cafeInfo.append(details);
      }
      if (refreshCafe) cafeTimer = setInterval(refreshCafe, 60000);
      show(0); dialog.showModal(); window.FjordPlaceMaps?.show(dialog,[venue]);
    }
  };
})();
