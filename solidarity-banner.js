/* A quiet statement of friendship, translated with the page. */
(()=>{'use strict';
 const banner=document.getElementById('solidarityBanner');if(!banner)return;
 const copy={nb:['Norge + Ukraina','Sammen for frihet'],en:['Norway + Ukraine','Together for freedom'],uk:['Норвегія + Україна','Разом за свободу'],sv:['Norge + Ukraina','Tillsammans för frihet'],da:['Norge + Ukraine','Sammen for frihed']};
 function render(){const lang=window.FjordI18n?.language||document.documentElement.lang,t=copy[lang]||copy.nb;banner.querySelector('strong').textContent=t[0];banner.querySelector('.solidarity-message').textContent=t[1];}
 window.addEventListener('fjordlanguagechange',render);render();
})();
