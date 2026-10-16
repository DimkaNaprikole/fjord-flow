/* Small origin mark, rather than flags behind the content. */
(()=>{'use strict';
const hero=document.querySelector('.hero');if(!hero)return;
const words={nb:'Laget i Norge',en:'Created in Norway',uk:'Створено в Норвегії',sv:'Skapat i Norge',da:'Skabt i Norge'};
const badge=document.createElement('div');badge.className='norway-origin';badge.dataset.i18nIgnore='';
badge.innerHTML='<svg viewBox="0 0 22 16" aria-hidden="true"><path fill="#BA0C2F" d="M0 0h22v16H0z"/><path fill="#fff" d="M6 0h4v16H6zM0 6h22v4H0z"/><path fill="#00205B" d="M7 0h2v16H7zM0 7h22v2H0z"/></svg><span></span>';
hero.append(badge);function update(){badge.querySelector('span').textContent=words[window.FjordI18n?.language]||words.nb}update();window.addEventListener('fjordlanguagechange',update);
})();
