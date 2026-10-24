/* Keep the destination collection short and make longer lists easy to browse. */
(() => {
  const grid = document.querySelector('#cards');
  if (!grid) return;
  const PAGE_SIZE = 10;
  const labels = {
    nb: { name: 'Steder', previous: 'Forrige', next: 'Neste', first: 'Første', last: 'Siste', page: 'Side', of: 'av', show: 'Viser', places: 'steder', forward: 'Hopp fram', back: 'Hopp tilbake' },
    en: { name: 'Places', previous: 'Previous', next: 'Next', first: 'First', last: 'Last', page: 'Page', of: 'of', show: 'Showing', places: 'places', forward: 'Jump forward', back: 'Jump back' },
    uk: { name: 'Місця', previous: 'Назад', next: 'Далі', first: 'Перша', last: 'Остання', page: 'Сторінка', of: 'з', show: 'Показано', places: 'місць', forward: 'Уперед на', back: 'Назад на' },
    sv: { name: 'Platser', previous: 'Föregående', next: 'Nästa', first: 'Första', last: 'Sista', page: 'Sida', of: 'av', show: 'Visar', places: 'platser', forward: 'Hoppa framåt', back: 'Hoppa bakåt' },
    da: { name: 'Steder', previous: 'Forrige', next: 'Næste', first: 'Første', last: 'Sidste', page: 'Side', of: 'af', show: 'Viser', places: 'steder', forward: 'Hop frem', back: 'Hop tilbage' }
  };
  let page = 1;
  let places = [];
  const pager = document.createElement('nav');
  pager.className = 'place-pagination';
  pager.setAttribute('aria-label', 'Places pages');
  const status = document.createElement('p');
  status.className = 'place-pagination-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  grid.after(pager, status);
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('pagination.css?v=2', document.currentScript?.src || import.meta.url).href;
  document.head.append(stylesheet);
  const copy = () => labels[document.documentElement.lang] || labels.en;
  const button = (text, target, title, current = false, disabled = false) =>
    `<button type="button" data-place-page="${target}" aria-label="${title}" title="${title}"${current ? ' aria-current="page"' : ''}${disabled ? ' disabled' : ''}>${text}</button>`;
  function show({ scroll = false, focus = false } = {}) {
    const l = copy();
    const totalPages = Math.max(1, Math.ceil(places.length / PAGE_SIZE));
    page = Math.min(Math.max(page, 1), totalPages);
    for (const [index, card] of places.entries()) card.hidden = Math.floor(index / PAGE_SIZE) + 1 !== page;
    pager.setAttribute('aria-label', l.name + ' — ' + l.page.toLowerCase());
    pager.hidden = totalPages < 2;
    status.hidden = !places.length;
    if (places.length) {
      const start = (page - 1) * PAGE_SIZE + 1;
      const end = Math.min(page * PAGE_SIZE, places.length);
      status.textContent = `${l.show} ${start}–${end} ${l.of} ${places.length} ${l.places}. ${l.page} ${page} ${l.of} ${totalPages}.`;
    }
    if (totalPages < 2) { pager.replaceChildren(); return; }
    const nearby = new Set([1, totalPages, page - 1, page, page + 1]);
    const pageNumbers = [...nearby].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    const numberButtons = pageNumbers.map((n, index) =>
      `${index && n - pageNumbers[index - 1] > 1 ? '<span aria-hidden="true">…</span>' : ''}${button(n, n, `${l.page} ${n} ${l.of} ${totalPages}`, n === page)}`).join('');
    pager.innerHTML = totalPages <= 5 ? [button('‹ ' + l.previous, page - 1, l.previous, false, page === 1), numberButtons, button(l.next + ' ›', page + 1, l.next, false, page === totalPages)].join('') : [
      button('«', 1, l.first, false, page === 1),
      button('−3', page - 3, `${l.back} 3`, false, page - 3 < 1),
      button('−2', page - 2, `${l.back} 2`, false, page - 2 < 1),
      button('‹', page - 1, l.previous, false, page === 1),
      numberButtons,
      button('›', page + 1, l.next, false, page === totalPages),
      button('»', totalPages, l.last, false, page === totalPages),
      button('+2', page + 2, `${l.forward} 2`, false, page + 2 > totalPages),
      button('+3', page + 3, `${l.forward} 3`, false, page + 3 > totalPages)
    ].join('');
    if (focus) pager.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
    if (scroll) grid.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  pager.addEventListener('click', event => {
    const control = event.target.closest('button[data-place-page]');
    if (!control || control.disabled) return;
    page = Number(control.dataset.placePage);
    show({ scroll: true, focus: true });
  });
  new MutationObserver(() => {
    places = [...grid.querySelectorAll(':scope > .card')];
    page = 1;
    show();
  }).observe(grid, { childList: true });
  places = [...grid.querySelectorAll(':scope > .card')];
  show();
  window.addEventListener('fjordlanguagechange', () => show());
})();
