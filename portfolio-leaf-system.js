/* Short visible photo cues; accessible opening names remain descriptive. */
(() => {
  let queued=false;
  const observed=new WeakSet();
  const captionSize=new ResizeObserver(entries=>entries.forEach(({target})=>{target.closest('.compact-postcard')?.style.setProperty('--ff-photo-caption-height',`${Math.ceil(target.getBoundingClientRect().height)}px`);}));
  function refresh(){
    queued=false;const language=window.FjordI18n?.language||document.documentElement.lang;
    const label={uk:'Фото',nb:'Foto',sv:'Foto',da:'Foto',en:'Photos'}[language]||'Photos';
    document.querySelectorAll('#cards .photo-hint').forEach(e=>{if(e.textContent!==label)e.textContent=label;});
    document.querySelectorAll('#cards .postcard-caption').forEach(caption=>{if(!observed.has(caption)){observed.add(caption);captionSize.observe(caption);}});
    document.querySelectorAll('.gallery-stage,.stay-gallery-stage').forEach(stage=>{let corner=stage.querySelector('.ff-photo-corner');if(!corner){corner=document.createElement('span');corner.className='ff-photo-corner';corner.setAttribute('aria-hidden','true');stage.append(corner);}if(corner.textContent!==label)corner.textContent=label;});
  }
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(refresh);}}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('fjord:languagechange',refresh);refresh();
})();
