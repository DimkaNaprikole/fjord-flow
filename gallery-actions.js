/* Gallery shortcuts for place details and independent route planning. */
(() => {
  'use strict';
  const thumbs = document.getElementById('galleryThumbs');
  const dialog = document.getElementById('galleryDialog');
  if (!thumbs || !dialog) return;
  const row = document.createElement('div'); row.className = 'gallery-action-row';
  thumbs.before(row); row.append(thumbs);
  const panel = document.createElement('div'); panel.className = 'gallery-quick-actions'; panel.dataset.i18nIgnore = '';
  const details = document.createElement('button'), route = document.createElement('button');
  details.type = route.type = 'button'; panel.append(details, route); row.append(panel);
  const labels = {uk:['Про місце ↓','Побудувати маршрут ↓'], en:['About this place ↓','Plan your route ↓'], nb:['Om stedet ↓','Planlegg ruten ↓'], sv:['Om platsen ↓','Planera rutten ↓'], da:['Om stedet ↓','Planlæg ruten ↓']};
  function reveal(target) {
    if (!target) return;
    target.tabIndex = -1;
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth', block:'start'});
    target.focus({preventScroll:true});
  }
  function render() {
    const words = labels[window.FjordI18n?.language || document.documentElement.lang] || labels.en;
    details.textContent = words[0]; route.textContent = words[1];
    details.hidden = !dialog.querySelector('#destinationDetails');
    route.hidden = !dialog.querySelector('.route-planner');
  }
  details.onclick = () => reveal(dialog.querySelector('#destinationDetails'));
  route.onclick = () => reveal(dialog.querySelector('.route-planner'));
  new MutationObserver(render).observe(dialog,{attributes:true,attributeFilter:['open']});
  window.addEventListener('fjordlanguagechange',render);
  render();
})();
