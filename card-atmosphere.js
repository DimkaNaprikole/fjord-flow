(() => {
  const grid = document.getElementById('cards');
  const visible = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('card-in-view', entry.isIntersecting);
  }), {rootMargin: '30px'});
  let observed = [];
  let layoutPending = false;
  function layoutScenery() {
    if (layoutPending) return;
    layoutPending = true;
    requestAnimationFrame(() => {
      layoutPending = false;
      const bounds = grid.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 24;
      const rowGap = parseFloat(getComputedStyle(grid).rowGap) || 30;
      const rows = new Map();
      for (const card of observed) {
        const rect = card.getBoundingClientRect(), key = Math.round(rect.top);
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push({card, rect});
      }
      for (const row of rows.values()) {
        const sceneTop = Math.min(...row.map(({card, rect}) => {
          const photo = card.querySelector('.photo');
          return photo ? photo.offsetTop + photo.offsetHeight - 18 : rect.height * .43;
        }));
        row.forEach(({card, rect}, index) => {
        const left = index === 0 ? Math.max(0, rect.left - bounds.left - 14) : gap / 2 + 8;
        const right = index === row.length - 1 ? Math.max(0, bounds.right - rect.right - 14) : gap / 2 + 8;
        card.style.setProperty('--scene-left', `${left}px`);
        card.style.setProperty('--scene-right', `${right}px`);
        card.style.setProperty('--scene-bottom', `${Math.min(24, rowGap / 2 + 6)}px`);
        card.style.setProperty('--scene-top', `${sceneTop}px`);
      });
      }
    });
  }
  const credited = new Set();
  function photoCredits() {
    if (typeof data === 'undefined' || !data?.destinations) return;
    const credits = document.getElementById('sceneryCredits');
    for (const place of data.destinations) {
      const images = [...new Set([place.image, ...(place.gallery || []).map(p => p.image)])].filter(Boolean).slice(0, 2);
      for (const src of images.slice(1)) {
        if (credited.has(src)) continue;
        const photo = place.gallery?.find(p => p.image === src);
        if (!photo?.imageCredit || !photo.imageSource) continue;
        credited.add(src);
        const row = document.createElement('p');
        row.setAttribute('data-i18n-ignore', '');
        row.append(`${place.name} — ${photo.imageCredit} · `);
        for (const [label, url] of [[photo.imageLicense, photo.imageLicenseUrl], ['Original photograph', photo.imageSource]]) {
          const href = safeURL(url); if (!href) continue;
          const link = document.createElement('a');
          link.textContent = label; link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
          row.append(link, ' · ');
        }
        row.append('Blur, responsive crop and slow pan.'); credits.append(row);
      }
    }
  }
  function observeCards() {
    observed.forEach(card => visible.unobserve(card));
    observed = [...grid.querySelectorAll('.card')];
    observed.forEach(card => visible.observe(card));
    layoutScenery();
    photoCredits();
  }
  new MutationObserver(observeCards).observe(grid, {childList: true});
  new ResizeObserver(layoutScenery).observe(grid);
  window.addEventListener('resize', layoutScenery);
  observeCards();
})();
