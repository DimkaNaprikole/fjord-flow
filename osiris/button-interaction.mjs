// Demo only: uses the real presence renderer and production action bridge.
import './site-presence.mjs';
import { createSiteActionBridge } from './site-actions.mjs';

const launch = document.querySelector('.fjord-helper-launch.osiris-launch');
const dialog = document.getElementById('fjordHelper');
const status = document.getElementById('interactionStatus');
const readiness = document.getElementById('interactionReadiness');
const phase = document.getElementById('interactionPhase');
const scene = document.getElementById('interactionScene');
const life = document.getElementById('interactionLife');
const cancelButton = document.getElementById('interactionCancel');
const commands = [...document.querySelectorAll('[data-demo-command]')];
const targets = new Map(['scenicRoutes', 'cafeNearby', 'norwayWebcams'].map(id => [id, document.getElementById(id)]));
const names = { scenicRoutes: 'Маршруты', cafeNearby: 'Кафе', norwayWebcams: 'Камеры' };
const counts = Object.fromEntries([...targets.keys()].map(id => [id, 0]));
const bridge = createSiteActionBridge();
let controller = null;
let generation = 0;
let result = null;
let canInteract = false;

for (const [id, target] of targets) {
  target.addEventListener('click', () => {
    counts[id] += 1;
    document.querySelector(`[data-demo-count="${id}"]`).textContent = String(counts[id]);
    status.textContent = `«${names[id]}»: выполнено нажатие №${counts[id]}.`;
  });
}

function refreshState() {
  phase.textContent = launch.dataset.osirisInteraction || 'idle';
  scene.textContent = launch.dataset.osirisScene || '—';
  life.textContent = launch.dataset.osirisLife || 'loading';
  canInteract = typeof window.OsirisPresence?.interactWith === 'function';
  for (const command of commands) command.disabled = !canInteract;
  readiness.textContent = canInteract
    ? (matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'Уменьшение движения включено: действие выполняется без анимации.'
      : 'Готово. Можно нажать целевую кнопку самому или попросить Osiris.')
    : window.OsirisPresence
      ? 'Персонаж загружен; интерфейс полной сцены касания ещё не доступен в этой сборке.'
      : 'Ожидается загрузка персонажа и каталога.';
}

function cancel() {
  generation += 1;
  controller?.abort();
  controller = null;
  bridge.cancel('cancelled');
  window.OsirisPresence?.cancelMove?.();
  cancelButton.disabled = true;
  status.textContent = 'Сцена остановлена. Уже выполненные нажатия сохраняются.';
}

async function run(id) {
  const target = targets.get(id);
  if (!target || !canInteract) return { status: 'unavailable' };
  controller?.abort();
  bridge.cancel('replaced');
  controller = new AbortController();
  const request = controller;
  const token = ++generation;
  result = null;
  cancelButton.disabled = false;
  if (dialog.open) dialog.close();
  status.textContent = `Osiris идёт к кнопке «${names[id]}»…`;
  try {
    const outcome = await bridge.perform({
      kind: 'section', id, target, visualTarget: target,
      signal: request.signal,
      isCurrent: () => token === generation,
      commit: () => { target.click(); return true; },
    });
    if (token !== generation) return outcome;
    result = outcome;
    if (outcome.status === 'completed') {
      status.textContent = `«${names[id]}»: нажатие выполнено. Счётчик — ${counts[id]}.`;
    } else {
      const descriptions = {
        cancelled: 'Сцена отменена.', disabled: 'Действия на сайте выключены.',
        unavailable: 'Цель сейчас недоступна.', failed: 'Не удалось выполнить действие.',
      };
      status.textContent = descriptions[outcome.status] || `Результат: ${outcome.status}.`;
    }
    // Keep the signal available: departure can continue after the actual click.
    return outcome;
  } catch (error) {
    if (token === generation) {
      result = { status: 'failed' };
      status.textContent = `Не удалось выполнить сцену: ${error.message || 'ошибка'}.`;
    }
    return { status: 'failed' };
  }
}
for (const command of commands) command.addEventListener('click', () => { void run(command.dataset.demoCommand); });
cancelButton.addEventListener('click', cancel);
const openOptions = () => { if (!dialog.open) dialog.showModal(); };
launch.addEventListener('click', openOptions);
document.getElementById('interactionOptions').addEventListener('click', openOptions);
document.getElementById('interactionOptionsClose').addEventListener('click', () => dialog.close());
window.addEventListener('osiris:presence-ready', refreshState);
const observer = new MutationObserver(refreshState);
observer.observe(launch, {
  attributes: true,
  attributeFilter: ['data-osiris-interaction', 'data-osiris-scene', 'data-osiris-life', 'data-osiris-presence'],
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancel();
});
window.addEventListener('pagehide', () => {
  cancel();
  observer.disconnect();
}, { once: true });
window.OsirisButtonDemo = Object.freeze({
  run, cancel,
  snapshot: () => ({
    ready: canInteract, phase: launch.dataset.osirisInteraction || 'idle',
    scene: launch.dataset.osirisScene || '', counts: { ...counts }, result,
  }),
});
refreshState();
