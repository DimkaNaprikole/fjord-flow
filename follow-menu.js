/* Move the real two-row navigation; never clone controls or their handlers. */
(() => {
  'use strict';
  const nav = document.querySelector('body > header > nav.site-tabs');
  const main = document.getElementById('journeys');
  if (!nav || !main) return;
  const menus = [...document.querySelectorAll('.site-group-links')];
  const host = document.createElement('div');
  host.className = 'follow-menu-cloud';
  host.dataset.followMenuGap = 'true';
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
    slots.clear(); controls.forEach(box => box.remove()); document.body.append(host); host.classList.remove('is-moving'); moved = false;
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
    const targets = [...main.children].filter(el => !el.hidden && !el.dataset.followMenuGap
      && !el.classList.contains('follow-menu-subslot') && !el.classList.contains('site-group-links'))
      .filter(el => { const box = el.getBoundingClientRect(); return box.height > 0 && box.top >= 16; });
    // Occupy real layout space at a section boundary; never cover its heading/photo.
    if (targets.length) {
      if (targets[0].previousElementSibling === host) return;
      targets[0].before(host);
    } else {
      if (main.lastElementChild === host) return;
      main.append(host);
    }
    revealPending = true;
  }
  function reveal() {
    const box = host.getBoundingClientRect();
    if (!revealPending || box.top >= innerHeight || box.bottom <= 0) return;
    revealPending = false;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      host.animate([{opacity:0,transform:'translateY(8px)',filter:'blur(4px)'},
        {opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:260,easing:'ease-out'});
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
    if (moved) reveal();
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', () => { if (moved) {
    const rail = slots.get(nav).getBoundingClientRect();
    host.style.width = Math.min(innerWidth, rail.width) + 'px';
  } schedule(); });
  addEventListener('fjord:sections-changed', schedule);
  addEventListener('pageshow', schedule);
  update();
})();
