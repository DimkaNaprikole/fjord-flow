/* Rest the pointer to inspect a postcard. Scrolling never changes grid geometry. */
(() => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pointerX = null, pointerY = null, activeCard = null;
  let restTimer = 0, scrollTimer = 0, scrolling = false;
  const enabled = () => finePointer.matches && !reducedMotion.matches;
  const grids = () => document.querySelectorAll('.cards');
  const cardAt = target => {
    const card = target instanceof Element ? target.closest('.cards > .card') : null;
    return card && !card.hidden ? card : null;
  };
  const clearFocus = () => {
    clearTimeout(restTimer);
    if (activeCard) activeCard.classList.remove('card-pointer-rest');
    activeCard = null;
  };
  const cardUnderPointer = () => pointerX === null ? null : cardAt(document.elementFromPoint(pointerX, pointerY));
  const settle = (delay = 220) => {
    clearTimeout(restTimer);
    if (!enabled() || scrolling) return;
    restTimer = setTimeout(() => {
      if (!enabled() || scrolling) return;
      const card = cardUnderPointer();
      if (activeCard !== card) clearFocus();
      if (card) { activeCard = card; card.classList.add('card-pointer-rest'); }
    }, delay);
  };
  const syncMode = () => {
    clearFocus();
    grids().forEach(grid => grid.classList.toggle('card-focus-ready', enabled()));
    if (enabled()) settle();
  };
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !enabled()) return;
    const moved = pointerX === null || Math.abs(event.clientX - pointerX) + Math.abs(event.clientY - pointerY) > 2;
    pointerX = event.clientX; pointerY = event.clientY;
    if (moved) { clearFocus(); settle(); }
  }, { passive: true });
  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch' || !enabled()) return;
    pointerX = event.clientX; pointerY = event.clientY;
    if (cardAt(event.target) !== cardAt(event.relatedTarget)) { clearFocus(); settle(); }
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget) { pointerX = pointerY = null; clearFocus(); }
    else if (cardAt(event.target) !== cardAt(event.relatedTarget)) { clearFocus(); settle(); }
  }, { passive: true });
  const onScroll = () => {
    if (!enabled()) return;
    scrolling = true;
    clearFocus();
    grids().forEach(grid => grid.classList.add('card-focus-scrolling'));
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      scrolling = false;
      grids().forEach(grid => grid.classList.remove('card-focus-scrolling'));
      // Re-hit-test: the pointer did not move, but a different card may now be beneath it.
      settle(0);
    }, 180);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onScroll, { passive: true });
  window.addEventListener('blur', () => { pointerX = pointerY = null; clearFocus(); });
  finePointer.addEventListener('change', syncMode);
  reducedMotion.addEventListener('change', syncMode);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncMode, { once: true });
  else syncMode();
})();
