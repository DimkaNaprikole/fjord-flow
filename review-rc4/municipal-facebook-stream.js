/* Optional official Page timeline. No Facebook request is made before the visitor opts in. */
(() => {
  'use strict';
  const hosts = new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com']);
  function facebookURL(value, kind = 'page') {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.port || url.username || url.password) return null;
      const path = url.pathname.replace(/\/+$/, '');
      if (kind === 'group') {
        if (!/^\/groups\/[A-Za-z0-9._-]+$/.test(path)) return null;
      } else {
        if (!/^\/[A-Za-z0-9._-]+$/.test(path) || /\.(?:php|html?)$/i.test(path)) return null;
        if (/^\/(?:groups|plugins|login|logout|watch|reel|reels|marketplace|events|share|sharer|dialog|settings|help|search|photo|photos|gaming|home)$/i.test(path)) return null;
      }
      return 'https://www.facebook.com' + path;
    } catch { return null; }
  }
  function timelineURL(page, width = 500) {
    const safe = facebookURL(page);
    if (!safe) return null;
    const url = new URL('https://www.facebook.com/plugins/page.php');
    url.search = new URLSearchParams({href:safe,tabs:'timeline',width:String(Math.max(180,Math.min(500,Math.floor(Number(width)||500)))),height:'600',small_header:'true',adapt_container_width:'true',hide_cover:'false',show_facepile:'false'}).toString();
    return url.href;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {facebookURL, timelineURL}; return; }
  const words = {
    nb:['Facebook · kommunens offisielle side','Innlegg fra','Last inn Facebook-tidslinjen','Åpne siden på Facebook ↗','Facebook lastes først når du trykker. Da kobles nettleseren til Meta, som kan behandle nettverks- og nettleseropplysninger.','Dette er sidens tidslinje, ikke en strøm fra Facebook-grupper. Hvis innbyggingen er blokkert eller ber om innlogging, åpne siden direkte.','Lokale grupper · lenker','Offisielt nettsted ↗','Facebook-tidslinje · '],
    en:['Facebook · official municipal Page','Posts from','Load Facebook timeline','Open Page on Facebook ↗','Facebook loads only after you press the button. Your browser then connects to Meta, which may process network and browser information.','This is the Page timeline, not a feed from Facebook groups. If the embed is blocked or requests sign-in, open the Page directly.','Local groups · links','Official website ↗','Facebook timeline · '],
    uk:['Facebook · офіційна сторінка комуни','Дописи від','Завантажити стрічку Facebook','Відкрити сторінку у Facebook ↗','Facebook завантажиться лише після натискання. Тоді браузер з’єднається з Meta, яка може обробляти мережеві дані й відомості про браузер.','Це стрічка сторінки, а не дописи з Facebook-груп. Якщо вбудовану стрічку заблоковано або потрібен вхід, відкрийте сторінку напряму.','Місцеві групи · посилання','Офіційний сайт ↗','Стрічка Facebook · '],
    sv:['Facebook · kommunens officiella sida','Inlägg från','Ladda Facebook-flödet','Öppna sidan på Facebook ↗','Facebook laddas först när du trycker. Webbläsaren ansluter då till Meta, som kan behandla nätverks- och webbläsaruppgifter.','Detta är sidans tidslinje, inte ett flöde från Facebook-grupper. Om inbäddningen blockeras eller kräver inloggning, öppna sidan direkt.','Lokala grupper · länkar','Officiell webbplats ↗','Facebook-tidslinje · '],
    da:['Facebook · kommunens officielle side','Opslag fra','Indlæs Facebook-tidslinjen','Åbn siden på Facebook ↗','Facebook indlæses først, når du trykker. Browseren forbinder derefter til Meta, som kan behandle netværks- og browseroplysninger.','Dette er sidens tidslinje, ikke et feed fra Facebook-grupper. Hvis indlejringen blokeres eller kræver login, åbn siden direkte.','Lokale grupper · links','Officiel hjemmeside ↗','Facebook-tidslinje · ']
  };
  const mounted = new WeakMap();
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const link = (label, href) => {
    const node = element('a', '', label); node.href = href;
    node.target = '_blank'; node.rel = 'noopener noreferrer'; return node;
  };
  function mount({container, source} = {}) {
    if (!container || typeof container.append !== 'function') return null;
    mounted.get(container)?.remove(); mounted.delete(container);
    const page = facebookURL(source?.facebook);
    if (!page || typeof source?.name !== 'string' || !source.name.trim()) return null;
    const lang = window.FjordI18n?.language || document.documentElement.lang;
    const w = words[lang] || words.nb;
    const root = element('section', 'municipal-facebook-stream'); root.dataset.i18nIgnore = '';
    const heading = element('h3', '', source.name.trim());
    root.append(element('p', 'municipal-facebook-stream__eyebrow', w[0]), heading);
    const privacy = element('p', 'municipal-facebook-stream__privacy', w[4]);
    const stage = element('div', 'municipal-facebook-stream__stage');
    const load = element('button', 'municipal-facebook-stream__load', w[2]); load.type = 'button';
    const actions = element('nav', 'municipal-facebook-stream__actions'); actions.setAttribute('aria-label', source.name.trim());
    actions.append(link(w[3], page));
    try {const official = new URL(source.news); if (official.protocol === 'https:' && !official.username && !official.password) actions.append(link(w[7], official.href));} catch {}
    load.addEventListener('click', () => {
      if (stage.querySelector('iframe')) return;
      const frame = element('iframe', 'municipal-facebook-stream__frame');
      const width = Math.max(180, Math.min(500, stage.clientWidth || root.clientWidth || 500));
      frame.title = w[8] + source.name.trim(); frame.width = String(Math.floor(width)); frame.height = '600';
      frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = timelineURL(page, width);
      stage.append(frame); load.hidden = true;
    });
    root.append(privacy, load, stage, actions, element('p', 'municipal-facebook-stream__note', w[5]));
    const groups = (Array.isArray(source.groups) ? source.groups : []).map(group => ({name:group?.name,url:facebookURL(group?.url,'group')})).filter(group => group.url && typeof group.name === 'string' && group.name.trim());
    if (groups.length) {
      const list = element('nav', 'municipal-facebook-stream__groups'); list.setAttribute('aria-label', w[6]);
      list.append(element('strong', '', w[6]));
      for (const group of groups) list.append(link(group.name.trim() + ' ↗', group.url));
      root.append(list);
    }
    container.append(root); mounted.set(container, root); return root;
  }
  window.FjordMunicipalFacebook = Object.freeze({mount});
})();
