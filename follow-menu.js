/* Keep the original navigation, including its handlers and focus, available. */
(() => {
  'use strict';
  const nav = document.querySelector('body > header > nav.site-tabs');
  if (!nav) return;
  const slot = document.createElement('div');
  slot.className = 'follow-menu-slot';
  slot.setAttribute('aria-hidden', 'true');
  let pinned = false, queued = false;
  function restore() {
    if (!pinned) return;
    slot.before(nav);
    slot.remove();
    nav.classList.remove('follow-menu-pinned');
    nav.style.removeProperty('--follow-left');
    nav.style.removeProperty('--follow-width');
    pinned = false;
  }
  function update() {
    queued = false;
    if (pinned && slot.getBoundingClientRect().bottom > 0) restore();
    if (!pinned && nav.getBoundingClientRect().bottom <= 0) {
      slot.style.height = nav.getBoundingClientRect().height + 'px';
      nav.before(slot);
      document.body.append(nav);
      nav.classList.add('follow-menu-pinned');
      pinned = true;
    }
    if (pinned) {
      const rect = slot.getBoundingClientRect();
      nav.style.setProperty('--follow-left', Math.max(0, rect.left) + 'px');
      nav.style.setProperty('--follow-width', Math.min(innerWidth, rect.width) + 'px');
    }
    document.documentElement.style.setProperty('--follow-menu-height', pinned ? nav.getBoundingClientRect().height + 'px' : '0px');
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', () => { restore(); update(); });
  addEventListener('pageshow', schedule);
  update();
})();
