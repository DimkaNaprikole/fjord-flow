/* Presentation only: four original editorial SVGs, no changes to emergency actions. */
(() => {
  const root=document.documentElement;
  if(root.dataset.ffEmergencyIllustrationCarousel==='ready')return;
  root.dataset.ffEmergencyIllustrationCarousel='ready';
  const paths=['ambulance','fire','police','clinic'].map(name=>'images/editorial/news-'+name+'-illustration.svg');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const words={nb:'Illustrasjon',en:'Illustration',uk:'Ілюстрація',sv:'Illustration',da:'Illustration'};
  let mounted=null,timer=null,queued=false,generation=0;
  const clear=()=>{if(timer!==null){clearTimeout(timer);timer=null;}};
  const paused=state=>!state||!state.host.isConnected||document.hidden||reduced.matches||state.host.matches(':focus-within');
  function localize(){if(!mounted)return;const locale=(document.documentElement.lang||'nb').split('-')[0],label=words[locale]||words.nb;if(mounted.label.textContent!==label)mounted.label.textContent=label;}
  function arm(){clear();if(!paused(mounted))timer=setTimeout(()=>{timer=null;void advance();},9000);}
  async function advance(){
    const state=mounted,epoch=generation;if(paused(state))return;
    const nextSlot=1-state.active,nextIndex=(state.index+1)%paths.length,next=state.images[nextSlot];
    next.src=paths[nextIndex];
    try{await next.decode();}catch{if(state===mounted&&epoch===generation)arm();return;}
    if(state!==mounted||epoch!==generation||paused(state))return;
    next.classList.add('is-visible');state.images[state.active].classList.remove('is-visible');
    state.active=nextSlot;state.index=nextIndex;arm();
  }
  function sync(){
    queued=false;const host=document.querySelector('#travelServices .ref-emergency');
    if(host===mounted?.host&&host?.isConnected&&mounted.images[0].isConnected&&mounted.label.isConnected){localize();return;}
    clear();generation++;if(mounted){mounted.listeners.abort();mounted.images[0].parentElement?.remove();mounted.label.remove();}mounted=null;
    if(!host)return;
    const backdrop=document.createElement('div');backdrop.className='ff-emergency-illustrations';backdrop.setAttribute('aria-hidden','true');
    const images=[0,1].map((value)=>{const image=document.createElement('img');image.alt='';image.decoding='async';image.src=paths[value];image.draggable=false;if(value===0)image.className='is-visible';backdrop.append(image);return image;});
    const label=document.createElement('small');label.className='ff-emergency-illustration-label';
    const listeners=new AbortController();mounted={host,images,label,listeners,index:0,active:0};
    host.prepend(backdrop);host.append(label);localize();
    host.addEventListener('focusin',clear,{signal:listeners.signal});
    host.addEventListener('focusout',()=>queueMicrotask(arm),{signal:listeners.signal});arm();
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(sync);}}
  new MutationObserver(()=>{if(!mounted?.host.isConnected||!mounted.images[0].isConnected||!mounted.label.isConnected||document.querySelector('#travelServices .ref-emergency')!==mounted.host)schedule();}).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(localize).observe(root,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('visibilitychange',arm);reduced.addEventListener('change',arm);
  window.addEventListener('fjordlanguagechange',()=>{schedule();localize();});sync();
})();
