/* The guide's own editorial surfaces. No visitor posts or venue facts are rewritten. */
(() => {
  'use strict';
  const copy = {
    en: {
      brand: 'DISCOVER NORWAY · NEAR & FAR', places: 'Places', badge: 'NORWAY GUIDE',
      hero: ['Fjords, coastlines and places worth stopping for.', 'Discover what is around you and build your own way through Norway.'],
      action: 'Choose a route', collection: 'PLACES TO DISCOVER / NORWAY',
      intro: ['Find viewpoints, waterfalls, towns and trails.', 'Explore photos, practical details and routes at your own pace.', 'Choose a place, then plan your own visit.'],
      footer: ['Independent Norway travel guide. Routes are suggestions for your own trip.', 'Opening hours, access and availability can change. Check each official source before travelling.', 'Accommodation booking opens on external providers’ websites.'],
      signature: ['TAKE YOUR TIME. DISCOVER NORWAY.', 'INDEPENDENT TRAVEL GUIDE']
    },
    nb: {
      brand: 'OPPDAG NORGE · NÆRT OG FJERNT', places: 'Steder', badge: 'NORGESGUIDE',
      hero: ['Fjorder, kystlandskap og steder det er verdt å stoppe ved.', 'Oppdag det som finnes rundt deg, og finn din egen vei gjennom Norge.'],
      action: 'Velg en rute', collection: 'STEDER Å OPPDAGE / NORGE',
      intro: ['Finn utsiktspunkter, fossefall, byer og turstier.', 'Utforsk bilder, praktisk informasjon og ruter i ditt eget tempo.', 'Velg et sted, og planlegg ditt eget besøk.'],
      footer: ['Uavhengig reiseguide til Norge. Rutene er forslag til din egen tur.', 'Åpningstider, adkomst og tilgjengelighet kan endre seg. Sjekk de offisielle kildene før reisen.', 'Bestilling av overnatting åpnes på eksterne tilbyderes nettsider.'],
      signature: ['TA DEG TID. OPPDAG NORGE.', 'UAVHENGIG REISEGUIDE']
    },
    uk: {
      brand: 'ВІДКРИЙТЕ НОРВЕГІЮ · ПОРУЧ І ДАЛІ', places: 'Місця', badge: 'ПУТІВНИК НОРВЕГІЄЮ',
      hero: ['Фіорди, узбережжя й місця, де варто зупинитися.', 'Дізнайтеся, що є поруч, і прокладіть власний шлях Норвегією.'],
      action: 'Обрати маршрут', collection: 'МІСЦЯ ДЛЯ ВІДКРИТТІВ / НОРВЕГІЯ',
      intro: ['Знайдіть оглядові майданчики, водоспади, міста та стежки.', 'Переглядайте фото, практичні поради й маршрути у власному темпі.', 'Оберіть місце та сплануйте власну подорож.'],
      footer: ['Незалежний путівник Норвегією. Маршрути — ідеї для самостійних подорожей.', 'Години роботи, доступ і наявність місць можуть змінюватися. Перед поїздкою перевірте офіційні джерела.', 'Бронювання житла відкривається на зовнішніх сайтах постачальників.'],
      signature: ['НЕ ПОСПІШАЙТЕ. ВІДКРИВАЙТЕ НОРВЕГІЮ.', 'НЕЗАЛЕЖНИЙ ПУТІВНИК']
    },
    sv: {
      brand: 'UPPTÄCK NORGE · NÄRA OCH LÅNGT BORT', places: 'Platser', badge: 'NORGEGUIDE',
      hero: ['Fjordar, kustlandskap och platser värda ett stopp.', 'Upptäck vad som finns omkring dig och hitta din egen väg genom Norge.'],
      action: 'Välj en rutt', collection: 'PLATSER ATT UPPTÄCKA / NORGE',
      intro: ['Hitta utsiktsplatser, vattenfall, städer och vandringsleder.', 'Utforska bilder, praktisk information och rutter i din egen takt.', 'Välj en plats och planera ditt eget besök.'],
      footer: ['Oberoende reseguide till Norge. Rutterna är förslag för din egen resa.', 'Öppettider, tillfart och tillgänglighet kan ändras. Kontrollera de officiella källorna före resan.', 'Bokning av boende öppnas på externa leverantörers webbplatser.'],
      signature: ['TA DIG TID. UPPTÄCK NORGE.', 'OBEROENDE RESEGUIDE']
    },
    da: {
      brand: 'OPLEV NORGE · NÆRT OG FJERNT', places: 'Steder', badge: 'NORGESGUIDE',
      hero: ['Fjorde, kystlandskaber og steder, der er et stop værd.', 'Opdag det, der findes omkring dig, og find din egen vej gennem Norge.'],
      action: 'Vælg en rute', collection: 'STEDER AT OPDAGE / NORGE',
      intro: ['Find udsigtspunkter, vandfald, byer og vandrestier.', 'Udforsk billeder, praktisk information og ruter i dit eget tempo.', 'Vælg et sted, og planlæg dit eget besøg.'],
      footer: ['Uafhængig rejseguide til Norge. Ruterne er forslag til din egen tur.', 'Åbningstider, adgang og tilgængelighed kan ændre sig. Tjek de officielle kilder før rejsen.', 'Booking af overnatning åbnes på eksterne udbyderes hjemmesider.'],
      signature: ['TAG DIG TID. OPLEV NORGE.', 'UAFHÆNGIG REJSEGUIDE']
    }
  };

  function set(selector, lines, emphasis = false) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.dataset.i18nIgnore = '';
    const fragments = [];
    (Array.isArray(lines) ? lines : [lines]).forEach((line, i, list) => {
      if (i) fragments.push(document.createElement('br'));
      if (emphasis && i === list.length - 1) {
        const strong = document.createElement('strong');
        strong.textContent = line;
        fragments.push(strong);
      } else fragments.push(document.createTextNode(line));
    });
    el.replaceChildren(...fragments);
  }

  function render() {
    const language = window.FjordI18n?.language || document.documentElement.lang;
    const c = copy[language] || copy.nb;
    document.title = 'FJORD / FLOW — ' + ({nb:'Reiseguide til Norge',en:'Norway travel guide',uk:'Путівник Норвегією',sv:'Reseguide till Norge',da:'Rejseguide til Norge'}[language] || 'Reiseguide til Norge');
    const description=document.querySelector('meta[name=description]');if(description)description.content=c.hero.join(' ');
    set('header > .brand > span', c.brand);
    set('header nav [data-tab="journeys"]', c.places);
    set('header .sandbox', c.badge);
    set('.hero .hero-copy', c.hero);
    set('.hero-content > a.button', c.action + ' ↗');
    const action = document.querySelector('.hero-content > a.button');
    if (action) action.href = '#scenicRoutes';
    set('#collection .eyebrow', c.collection);
    set('#collection > p', c.intro, true);
    const footer = document.querySelector('body > footer > p');
    const privacy = footer?.querySelector('a[href*="privacy"]');
    set('body > footer > p', c.footer);
    if (privacy && footer) footer.append(document.createElement('br'), privacy);
    set('body > footer > span', c.signature);
  }

  window.addEventListener('fjord:language', render);
  render();
})();
