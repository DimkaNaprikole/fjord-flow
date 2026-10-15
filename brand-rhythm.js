/* The original luggage / railway travel drawing, made clear and legible. */
(()=>{'use strict';
const lines={en:'Further from the everyday. Closer to the fjords.',nb:'Lenger fra hverdagen. Nærmere fjordene.',uk:'Далі від буднів. Ближче до фіордів.',sv:'Längre från vardagen. Närmare fjordarna.',da:'Længere fra hverdagen. Tættere på fjordene.'};
const host=document.querySelector('.hero .journey-doodles');if(!host)return;
const drawing=host.querySelector('svg');if(!drawing)return;
host.dataset.i18nIgnore='';host.removeAttribute('aria-hidden');
const link=document.createElement('a');link.className='brand-rhythm brand-luggage';link.href='#';
drawing.setAttribute('aria-hidden','true');drawing.setAttribute('focusable','false');
const caption=document.createElement('span');caption.className='brand-rhythm-tagline';link.append(drawing,caption);host.replaceChildren(link);
function update(){caption.textContent=lines[window.FjordI18n?.language]||lines.nb;link.setAttribute('aria-label','FJORD / FLOW — '+caption.textContent)}
update();window.addEventListener('fjordlanguagechange',update);
})();
