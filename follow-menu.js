/* Move the real two-row navigation; never clone controls or their handlers. */
(() => {
  'use strict';
  const nav = document.querySelector('body > header > nav.site-tabs');
  const main = document.getElementById('journeys');
  if (!nav || !main) return;
  const menus = [...document.querySelectorAll('.site-group-links')];
  const host = document.createElement('div');
  host.className = 'follow-menu-cloud';
  const slots = new Map();
  let moved = false, queued = false, endFollow = 0;
  function jump(end) {
    const run = ++endFollow;
    window.scrollTo({top: end ? document.documentElement.scrollHeight : 0, behavior:'instant'});
    schedule();
    if (!end) return;
    const until = performance.now() + 1200;
    function settle() {
      if (run !== endFollow || performance.now() >= until) return;
      if (document.documentElement.scrollHeight - innerHeight - scrollY > 1)
        window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
      requestAnimationFrame(settle);
    }
    requestAnimationFrame(settle);
  }
  for (const name of ['wheel','touchstart','pointerdown','keydown'])
    addEventListener(name, () => { endFollow++; }, {passive:true});
  const controls = document.createElement('div');
  controls.className = 'follow-menu-ends';
  controls.dataset.i18nIgnore = '';
  for (const [label, end] of [['Home ↑', false], ['End ↓', true]]) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => {
      jump(end);
    });
    controls.append(button);
  }
  document.body.append(host);
  function visibleMenu() { return menus.find(menu => !menu.hidden); }
  function restore() {
    if (!moved) return;
    for (const [node, slot] of slots) { slot.before(node); slot.remove(); }
    slots.clear(); controls.remove(); host.classList.remove('is-moving'); moved = false;
  }
  function transfer() {
    for (const node of [nav, ...menus]) {
      const slot = document.createElement('div');
      slot.className = node === nav ? 'follow-menu-slot' : 'follow-menu-subslot';
      slot.style.height = (node.hidden ? 0 : node.getBoundingClientRect().height) + 'px';
      slot.setAttribute('aria-hidden', 'true');
      node.before(slot); slots.set(node, slot); host.append(node);
    }
    (visibleMenu() || host).append(controls); moved = true; host.classList.add('is-moving');
  }
  function place() {
    const rail = slots.get(nav).getBoundingClientRect();
    host.style.left = Math.max(0, rail.left) + 'px';
    host.style.width = Math.min(innerWidth, rail.width) + 'px';
    const height = host.getBoundingClientRect().height;
    const limit = Math.max(24, innerHeight - height - 18);
    const boundaries = [...main.children].filter(el => !el.hidden && !el.classList.contains('follow-menu-subslot') && !el.classList.contains('site-group-links'))
      .map(el => el.getBoundingClientRect().top).filter(top => top >= 24 && top <= limit);
    const next = boundaries.length ? Math.max(...boundaries) : limit;
    const pageEnd = Math.max(0, document.documentElement.scrollHeight - height - 32);
    host.style.top = Math.min(pageEnd, scrollY + next) + 'px';
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      host.animate([{opacity:0,transform:'translateY(14px) scale(.98)',filter:'blur(7px)'},
        {opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],{duration:330,easing:'ease-out'});
    }
  }
  function update() {
    queued = false;
    if (moved && slots.get(nav).getBoundingClientRect().bottom > 0) restore();
    if (!moved) {
      const last = visibleMenu() || nav;
      if (Math.max(nav.getBoundingClientRect().bottom, last.getBoundingClientRect().bottom) <= 0) { transfer(); place(); }
    } else {
      (visibleMenu() || host).append(controls);
      for (const menu of menus) slots.get(menu).style.height = (!menu.hidden ? menu.getBoundingClientRect().height : 0) + 'px';
      const box = host.getBoundingClientRect();
      if (box.bottom <= 0 || box.top >= innerHeight) place();
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', () => { if (moved) place(); schedule(); });
  addEventListener('fjord:sections-changed', schedule);
  addEventListener('pageshow', schedule);
  update();
})();
