/* Published schedules, evaluated in the venue's time zone; no live-status claim. */
(() => {
  'use strict';
  const strings = {
    nb: ['Åpent til', 'Stengt nå', 'Åpningstider må bekreftes', 'I dag', 'Åpningstider', 'Finn veien', 'Etter publisert timeplan · norsk tid. Endringer kan forekomme.', 'Veiledende tider · ikke bekreftet av kafeen.', 'Stengt', 'Sjekket', 'Ukjent'],
    en: ['Open until', 'Closed now', 'Confirm opening hours', 'Today', 'Opening hours', 'Get directions', 'Based on published hours · Norway time. Changes may occur.', 'Indicative hours · not confirmed by the café.', 'Closed', 'Checked', 'Unknown'],
    uk: ['Відкрито до', 'Зараз зачинено', 'Години потребують уточнення', 'Сьогодні', 'Години роботи', 'Прокласти маршрут', 'За опублікованим розкладом · час Норвегії. Можливі зміни.', 'Орієнтовні години · не підтверджені кав’ярнею.', 'Зачинено', 'Перевірено', 'Невідомо'],
    sv: ['Öppet till', 'Stängt nu', 'Bekräfta öppettiderna', 'I dag', 'Öppettider', 'Hitta hit', 'Enligt publicerade tider · norsk tid. Ändringar kan förekomma.', 'Ungefärliga tider · inte bekräftade av kaféet.', 'Stängt', 'Kontrollerat', 'Okänt'],
    da: ['Åbent til', 'Lukket nu', 'Bekræft åbningstiderne', 'I dag', 'Åbningstider', 'Find vej', 'Ifølge offentliggjorte tider · norsk tid. Ændringer kan forekomme.', 'Vejledende tider · ikke bekræftet af caféen.', 'Lukket', 'Kontrolleret', 'Ukendt']
  };
  const minutes = value => /^\d{2}:\d{2}$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
  function evaluate(hours, now = new Date()) {
    if (!hours || !Array.isArray(hours.weekly) || hours.weekly.length !== 7) return {open: null, today: []};
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone: hours.timeZone || 'Europe/Oslo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(now).map(p => [p.type, p.value]));
    const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday);
    const time = Number(parts.hour) * 60 + Number(parts.minute), today = hours.weekly[day] || [];
    const checked = Date.parse(hours.checked + 'T00:00:00Z');
    if (!hours.verified || !Number.isFinite(checked) || now.getTime() - checked > 30 * 86400000) return {open: null, today, day};
    for (const offset of [-1, 0]) {
      for (const [start, finish] of hours.weekly[(day + offset + 7) % 7] || []) {
        const a = minutes(start), b = minutes(finish), end = b <= a ? b + 1440 : b, point = time - offset * 1440;
        if (point >= a && point < end) return {open: true, until: finish, today, day};
      }
    }
    return {open: false, today, day};
  }
  const node = (tag, cls, text) => {const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;};
  function render(host, venue) {
    host.replaceChildren(); host.hidden = !venue.openingHours;
    if (host.hidden) return;
    const lang = window.FjordI18n?.language || document.documentElement.lang, w = strings[lang] || strings.nb;
    const hours = venue.openingHours, state = evaluate(hours), line = node('div', 'cafe-gallery-summary'), info = node('div');
    const badge = node('strong', 'cafe-gallery-status', state.open === null ? w[2] : state.open ? `${w[0]} ${state.until}` : w[1]);
    badge.dataset.state = state.open === null ? 'unknown' : state.open ? 'open' : 'closed';
    const times = periods => periods.length ? periods.map(p => p.join('–')).join(', ') : w[8];
    const todayLine = node('span', 'cafe-gallery-today', Array.isArray(hours.weekly) ? `${w[3]}: ${times(state.today)}` : w[10]); info.append(badge, todayLine);
    const route = node('a', 'cafe-gallery-route', w[5] + ' ↗');
    route.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(venue.name + ', ' + venue.address);
    route.target = '_blank'; route.rel = 'noopener noreferrer';
    const actions = node('div', 'cafe-gallery-actions'); actions.append(route);
    try {
      const url = new URL(venue.website);
      if (url.protocol === 'https:' && !url.username && !url.password) {
        const labels = {nb: 'Kafeens nettsted', en: 'Café website', uk: 'Сайт закладу', sv: 'Kaféets webbplats', da: 'Caféens hjemmeside'};
        const website = node('a', 'cafe-gallery-website', (labels[lang] || labels.nb) + ' ↗');
        website.href = url.href; website.target = '_blank'; website.rel = 'noopener noreferrer'; actions.append(website);
      }
    } catch {}
    line.append(info, actions);
    const details = node('details', 'cafe-gallery-hours'), summary = node('summary', '', w[4]); details.append(summary); details.open = !!venue.hoursNote;
    const table = node('dl');
    (hours.weekly || []).forEach((periods, day) => {
      const row = node('div'); if (day === state.day) row.className = 'is-today';
      const label = new Intl.DateTimeFormat(lang || 'nb', {weekday: 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(2026, 9, 12 + day)));
      row.append(node('dt', '', label), node('dd', '', times(periods))); table.append(row);
    });
    details.append(table); if (hours.publishedText) details.append(node('p', '', hours.publishedText)); const hoursNote = typeof venue.hoursNote === 'string' ? venue.hoursNote : venue.hoursNote?.[lang] || venue.hoursNote?.en; if (hoursNote) details.append(node('p', 'cafe-gallery-hours-note', hoursNote)); details.append(node('p', 'cafe-gallery-address', venue.address));
    const source = node('a', '', (hours.sourceLabel || venue.name) + ' ↗');
    try {const url = new URL(hours.source); if (url.protocol === 'https:') source.href = url.href;} catch {}
    source.target = '_blank'; source.rel = 'noopener noreferrer';
    const date = new Intl.DateTimeFormat(lang || 'nb').format(new Date(hours.checked + 'T12:00:00Z'));
    details.append(source, node('span', 'cafe-gallery-checked', `${w[9]}: ${date}`));
    const note = node('p', 'cafe-gallery-hours-note', state.open === null ? w[7] : w[6]);
    host.append(line, note, details);
    return () => {
      const fresh = evaluate(hours);
      badge.textContent = fresh.open === null ? w[2] : fresh.open ? `${w[0]} ${fresh.until}` : w[1];
      badge.dataset.state = fresh.open === null ? 'unknown' : fresh.open ? 'open' : 'closed';
      todayLine.textContent = Array.isArray(hours.weekly) ? `${w[3]}: ${times(fresh.today)}` : w[10];
      note.textContent = fresh.open === null ? w[7] : w[6];
      [...table.children].forEach((row, day) => row.classList.toggle('is-today', day === fresh.day));
    };
  }
  window.FjordCafeGalleryInfo = {evaluate, render};
})();
