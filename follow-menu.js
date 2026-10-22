/* Move the real two-row navigation; never clone controls or their handlers. */
(() => {
  'use strict';
  const isSpaceFree = (rect, obstacles) => !obstacles.some(other =>
    rect.left < other.right + 6 && rect.right > other.left - 6 &&
    rect.top < other.bottom + 6 && rect.bottom > other.top - 6);
  if (typeof module !== 'undefined' && module.exports) { module.exports = {isSpaceFree}; return; }
  const nav = document.querySelector('body > header > nav.site-tabs');
  const main = document.getElementById('journeys');
  if (!nav || !main) return;
  const menus = [...document.querySelectorAll('.site-group-links')];
  // Main navigation may land only in dedicated gaps before substantive chapters.
  // Advertising, small anchors, card rails and photo-only inserts are not landing zones.
  const landingIds = new Set(['about','scenicRoutes','collection','waterfallChapter',
    'buaEquipment','cafeStops','staysSauna','travelUpdates','travelServices',
    'norwayCatalogue','norwayWebcams','municipalNews','community','travelStories','shoppingCentres']);
  let lastLanding = null;
  let entrance = null;
  const host = document.createElement('div');
  host.className = 'follow-menu-cloud';
  host.dataset.followMenuGap = 'true';
  host.setAttribute('data-osiris-no-roam', '');
  const slots = new Map();
  let moved = false, queued = false, endFollow = 0, revealPending = false, endActive = false;
  function jump(end) {
    const run = ++endFollow;
    endActive = end;
    window.scrollTo({top: end ? document.documentElement.scrollHeight : 0, behavior:'instant'});
    schedule();
    if (!end) return;
    const until = performance.now() + 1200;
    function settle() {
      if (run !== endFollow) return;
      if (performance.now() >= until) { endActive = false; return; }
      if (document.documentElement.scrollHeight - innerHeight - scrollY > 1)
        window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
      requestAnimationFrame(settle);
    }
    requestAnimationFrame(settle);
  }
  for (const name of ['wheel','touchstart','pointerdown','keydown'])
    addEventListener(name, () => { endFollow++; endActive = false; }, {passive:true});
  const controls = [];
  for (const [label, end] of [['Home ↑', false], ['End ↓', true]]) {
    const box = document.createElement('div');
    box.className = end ? 'follow-menu-end' : 'follow-menu-home';
    box.dataset.i18nIgnore = '';
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => jump(end));
    box.append(button); controls.push(box);
  }
  document.body.append(host);
  function visibleMenu() { return menus.find(menu => !menu.hidden); }
  function restore() {
    if (!moved) return;
    for (const [node, slot] of slots) { slot.before(node); slot.remove(); }
    slots.clear(); lastLanding = null; entrance?.cancel?.(); controls.forEach(box => box.remove()); document.body.append(host); host.classList.remove('is-moving'); moved = false;
  }
  function transfer() {
    for (const node of [nav, ...menus]) {
      const slot = document.createElement('div');
      slot.className = node === nav ? 'follow-menu-slot' : 'follow-menu-subslot';
      slot.style.height = (node.hidden ? 0 : node.getBoundingClientRect().height) + 'px';
      slot.setAttribute('aria-hidden', 'true');
      node.before(slot); slots.set(node, slot); host.append(node);
    }
    controls.forEach(box => host.append(box)); moved = true; host.classList.add('is-moving');
  }
  function place() {
    const rail = slots.get(nav).getBoundingClientRect();
    host.style.width = Math.min(innerWidth, rail.width) + 'px';
    const minDistance = Math.max(400, innerHeight * .75);
    const targets = [...main.children].filter(el => !el.hidden && landingIds.has(el.id))
      .filter(el => {
        const box = el.getBoundingClientRect();
        const distance = lastLanding === null ? Infinity : box.top + scrollY - lastLanding;
        return box.height >= 280 && box.top >= 16 && distance >= minDistance;
      });
    // Occupy real layout space at a section boundary; never cover its heading/photo.
    if (targets.length) {
      if (targets[0].previousElementSibling === host) return;
      lastLanding = targets[0].getBoundingClientRect().top + scrollY;
      targets[0].before(host);
    } else {
      if (main.lastElementChild === host) return;
      main.append(host);
    }
    entrance?.cancel?.();
    revealPending = true;
  }
  function reveal() {
    const box = host.getBoundingClientRect();
    if (!revealPending || box.top >= innerHeight || box.bottom <= 0) return;
    revealPending = false;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      entrance = host.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
  }

  function update() {
    queued = false;
    if (moved && slots.get(nav).getBoundingClientRect().bottom > 0) restore();
    if (!moved) {
      const last = visibleMenu() || nav;
      if (Math.max(nav.getBoundingClientRect().bottom, last.getBoundingClientRect().bottom) <= 0) { transfer(); place(); }
    } else {
      for (const menu of menus) slots.get(menu).style.height = (!menu.hidden ? menu.getBoundingClientRect().height : 0) + 'px';
      const box = host.getBoundingClientRect();
      if (box.bottom <= 0 && !endActive) place();
    }
    if (moved) { reveal(); checkFreeSpace(); }
  }
  function checkFreeSpace() {
    if (!moved || document.hidden) return;
    const area = host.getBoundingClientRect();
    if (area.bottom <= 0 || area.top >= innerHeight) return;
    const occupied = [...document.querySelectorAll('.fjord-helper-launch,.fjord-ai-pet-name,dialog[open]')]
      .map(node => node.getBoundingClientRect()).filter(rect => rect.width && rect.height);
    for (const box of controls) {
      const value = String(!isSpaceFree(box.getBoundingClientRect(), occupied));
      if (box.dataset.occupied !== value) box.dataset.occupied = value;
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', () => { if (moved) {
    const rail = slots.get(nav).getBoundingClientRect();
    host.style.width = Math.min(innerWidth, rail.width) + 'px';
  } schedule(); });
  addEventListener('fjord:sections-changed', schedule);
  addEventListener('pageshow', schedule);
  if (typeof setInterval === 'function') setInterval(checkFreeSpace, 200);
  update();
})();
