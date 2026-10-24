/* Presentation only: original account artwork, no authentication handlers. */
(() => {
  let queued = false;
  function sync() {
    queued = false;
    const panel = document.getElementById('fjordHelper');
    if (!panel || !panel.classList.contains('fjord-ai-auth-pending')) return;
    let cover = panel.querySelector('.osiris-account-cover');
    if (!cover) {
      cover = document.createElement('div');
      cover.className = 'osiris-account-cover site-account-cover';
      cover.setAttribute('aria-hidden', 'true'); cover.setAttribute('translate', 'no');
      for (const country of ['ukraine', 'norway']) {
        const img = document.createElement('img'); img.className = 'site-account-art site-account-art-' + country; img.alt = '';
        img.src = country === 'ukraine' ? 'images/ukraine-friendship-clean.webp' : 'images/norway-friendship-original.png'; cover.append(img);
      }
      const brand = document.createElement('img'); brand.className = 'site-account-brand'; brand.src = 'images/friendship-wordmark-no-slash.webp'; brand.alt = '';
      const pledge = document.createElement('div'); pledge.className = 'site-account-pledge'; pledge.append(document.createElement('span'));
      const forever = document.createElement('img'); forever.className = 'site-account-forever'; forever.src = 'images/friendship-nazavzhdy.png'; forever.alt = ''; pledge.append(forever);
      cover.append(brand, pledge); panel.prepend(cover);
    }
    const lang = (document.documentElement.lang || 'nb').split('-')[0];
    if (cover.dataset.language !== lang) {
      cover.dataset.language = lang;
      cover.querySelector('.site-account-pledge span').textContent = lang === 'uk' ? 'Wake up Украина' : lang === 'nb' ? 'Wake up Norway' : lang === 'en' ? 'Wake up USA' : 'Norge + Ukraina · Sammen for frihet';
      cover.querySelector('.site-account-forever').hidden = ['uk', 'nb', 'en'].includes(lang);
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(sync); } }
  new MutationObserver(schedule).observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  new MutationObserver(schedule).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  sync();
})();
