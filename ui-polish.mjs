/* Vanilla adaptation of Kokonut UI composer/card patterns. See vendor/kokonut-ui/SOURCES.txt. */
import { animate } from './vendor/animejs/anime.esm.min.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const seen = new WeakSet(), enhanced = new WeakSet(), active = new Map(), observed = new Set();
const cardSelector = '#collection .ref-card, #norwayCatalogue .ref-card';
let pending = false, dialog, input, lastDraft = '', lastWidth = 0, open = false;

function stop(target) {
  const animation = active.get(target);
  if (!animation) return;
  animation.cancel(); active.delete(target);
  target.style.removeProperty('opacity'); target.style.removeProperty('transform');
}
function reveal(target, distance = 8) {
  if (reduced.matches || document.hidden || !target.isConnected || !target.getClientRects().length) return;
  stop(target);
  active.set(target, animate(target, {
    opacity: [.65, 1], translateY: [distance, 0], duration: 320, ease: 'outCubic',
    onComplete: () => {
      active.delete(target);
      target.style.removeProperty('opacity'); target.style.removeProperty('transform');
    }
  }));
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    observer.unobserve(entry.target); observed.delete(entry.target);
    if (!seen.has(entry.target)) { seen.add(entry.target); reveal(entry.target); }
  }
}, { threshold: .12 });

/* Adapted from Kokonut UI's use-auto-resize-textarea hook. Bounded on short/mobile screens. */
function resizeComposer(force = false) {
  if (!input || !dialog?.open || dialog.classList.contains('osiris-compact') || !input.getClientRects().length) return;
  const width = input.clientWidth;
  if (!force && input.value === lastDraft && width === lastWidth) return;
  lastDraft = input.value; lastWidth = width;
  const max = innerHeight <= 520 ? 48 : innerWidth <= 500 ? 88 : 112;
  input.style.setProperty('--ff-compose-height', '44px');
  const desired = Math.min(max, Math.max(52, input.scrollHeight + 2));
  input.style.setProperty('--ff-compose-height', desired + 'px');
}
function scan() {
  pending = false;
  for (const card of document.querySelectorAll(cardSelector)) if (!enhanced.has(card)) {
    enhanced.add(card); card.classList.add('ff-place-card'); observed.add(card); observer.observe(card);
  }
  const current = document.getElementById('fjordHelper');
  if (current?.classList.contains('fjord-ai') && current !== dialog) {
    dialog = current; dialog.classList.add('ff-ui-polished');
    input = dialog.querySelector('#fjordAIQuestion');
    input?.addEventListener('input', () => resizeComposer(true));
    dialog.addEventListener('close', () => { stop(dialog); open = false; });
  }
  if (dialog) {
    const isOpen = dialog.open && !dialog.classList.contains('osiris-compact');
    if (isOpen && !open) { reveal(dialog, 10); resizeComposer(true); }
    if (!isOpen) stop(dialog);
    open = isOpen;
    resizeComposer();
  }
  for (const target of active.keys()) if (!target.isConnected) stop(target);
  for (const target of observed) if (!target.isConnected) { observer.unobserve(target); observed.delete(target); }
}
function schedule() {
  if (pending) return;
  pending = true; requestAnimationFrame(scan);
}
/* Only structural/state changes: animation style updates never reschedule this observer. */
const changes = new MutationObserver(schedule);
changes.observe(document.body, { childList: true, subtree: true, attributes: true,
  attributeFilter: ['open', 'class', 'aria-busy', 'hidden'] });
window.addEventListener('resize', () => { resizeComposer(true); schedule(); }, { passive: true });
window.visualViewport?.addEventListener('resize', () => resizeComposer(true), { passive: true });
reduced.addEventListener('change', () => { for (const target of active.keys()) stop(target); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) for (const target of active.keys()) stop(target);
  else schedule();
});
window.addEventListener('pagehide', () => { for (const target of active.keys()) stop(target); });
schedule();
