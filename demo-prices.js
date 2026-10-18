/* User-selected demonstration amounts, never venue tariffs. */
(() => {
  'use strict';
  const amounts=[333,222,444,555,777,888,399,999];
  const labels={nb:'Demopris',en:'Demo price',uk:'Демо-ціна',sv:'Demopris',da:'Demopris'};
  const language=()=>labels[window.FjordI18n?.language||document.documentElement.lang]?window.FjordI18n?.language||document.documentElement.lang:'nb';
  function priceFor(name){let hash=0;for(const c of String(name||'').normalize('NFKC').trim().toLowerCase())hash=(hash*31+c.codePointAt(0))>>>0;return amounts[hash%amounts.length];}
  const markup=name=>'<span class="demo-price" data-i18n-ignore><strong>'+priceFor(name)+' kr</strong><small>'+labels[language()]+'</small></span>';
  function badge(name){const host=document.createElement('span');host.innerHTML=markup(name);return host.firstElementChild;}
  function gallery(host,name){let price=host.querySelector('.demo-gallery-price');if(!price){price=document.createElement('div');price.className='demo-gallery-price';let anchor=host.querySelector('h2');while(anchor?.parentElement&&anchor.parentElement!==host)anchor=anchor.parentElement;if(anchor)anchor.after(price);else host.prepend(price);}price.replaceChildren(badge(name));}
  window.FjordDemoPrices={priceFor,markup,badge,gallery};
  document.addEventListener('DOMContentLoaded',()=>{
    const routeHost=document.querySelector('.roadtrip-presets');
    const routes=()=>document.querySelectorAll('[data-roadtrip]').forEach(button=>{if(!button.querySelector('.demo-price'))button.append(badge(button.dataset.roadtrip));});
    routes();if(routeHost)new MutationObserver(routes).observe(routeHost,{childList:true,subtree:true});
    const drone=document.getElementById('droneExperience');if(drone)drone.querySelector('h2')?.after(badge('drone-filming'));
  });
  window.addEventListener('fjordlanguagechange',()=>document.querySelectorAll('.demo-price small').forEach(el=>{el.textContent=labels[language()];}));
})();
