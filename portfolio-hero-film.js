(() => {
  'use strict';
  const video=document.getElementById('portfolioHeroFilm'),button=document.getElementById('portfolioHeroFilmControl');
  if(!video||!button)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),saveData=!!navigator.connection?.saveData;
  let visible=true,manualPause=false,started=false;
  const copy={uk:['Пауза','Відтворити','Повторити'],nb:['Pause','Spill av','Spill igjen'],en:['Pause','Play film','Replay'],sv:['Pausa','Spela','Spela igen'],da:['Pause','Afspil','Afspil igen']};
  const labels=()=>copy[window.FjordI18n?.language||document.documentElement.lang]||copy.en;
  function update(){const words=labels(),playing=!video.paused&&!video.ended;button.textContent=video.ended?words[2]:playing?words[0]:words[1];const credit=document.querySelector('footer .editorial-credit');if(credit)credit.textContent='Opening film: Fjord Flow eagle sequence · illustrative scenery.';}
  async function play(){try{await video.play();started=true;}catch{/* Autoplay may require the existing visible play control. */}update();}
  function resume(){if(visible&&!document.hidden&&!manualPause&&!reduced.matches&&!saveData&&!video.ended)play();}
  video.muted=true;video.playsInline=true;
  button.addEventListener('click',()=>{if(video.paused||video.ended){manualPause=false;if(video.ended)video.currentTime=0;play();}else{manualPause=true;video.pause();}update();});
  ['play','pause','ended','loadedmetadata','error'].forEach(name=>video.addEventListener(name,update));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else resume();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)video.pause();else if(started||!manualPause)resume();},{threshold:.15}).observe(video);
  reduced.addEventListener('change',()=>{if(reduced.matches)video.pause();else resume();});
  new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('DOMContentLoaded',update,{once:true});
  update();resume();
})();
