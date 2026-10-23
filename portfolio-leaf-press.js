/* One short press pulse; native clicks, focus and navigation remain untouched. */
(()=>{
 'use strict';
 const selector='.portfolio-first-cta,.ref-panel .ref-link,#cards .postcard-toggle,#cards .card-bottom button,#cards .photo-hint,#norwayCatalogue .catalogue-flip-toggle,.norway-catalog-more,.norway-catalog-actions a,#filters button,.place-pagination button,.norway-catalog-gps,.norway-catalog-retry';
 const timers=new Map();
 let active=null;
 function target(event){const el=event.target instanceof Element?event.target.closest(selector):null;return el?.closest('#journeys')&&!el.matches(':disabled,[aria-disabled="true"]')?el:null;}
 function clear(el){clearTimeout(timers.get(el));timers.delete(el);el.removeAttribute('data-ff-leaf-press');}
 function release(immediate=false){
  if(!active)return;
  const state=active;active=null;
  const delay=immediate?0:Math.max(0,160-(performance.now()-state.started));
  if(!delay)clear(state.el);else timers.set(state.el,setTimeout(()=>clear(state.el),delay));
 }
 function start(el){release(true);clear(el);el.setAttribute('data-ff-leaf-press','');active={el,started:performance.now()};}
 document.addEventListener('pointerdown',e=>{if(e.button!==0)return;const el=target(e);if(el)start(el);},{passive:true});
 window.addEventListener('pointerup',()=>release(),{passive:true});
 window.addEventListener('pointercancel',()=>release(true),{passive:true});
 document.addEventListener('keydown',e=>{if(e.repeat||!['Enter',' '].includes(e.key))return;const el=target(e);if(el)start(el);});
 window.addEventListener('keyup',e=>{if(['Enter',' '].includes(e.key))release();});
 document.addEventListener('click',e=>{const el=target(e);if(el&&!el.hasAttribute('data-ff-leaf-press')){start(el);release();}});
 document.addEventListener('focusout',e=>{if(active?.el===e.target)release(true);});
 function cancel(){release(true);for(const el of [...timers.keys()])clear(el);}
 window.addEventListener('blur',cancel);window.addEventListener('pagehide',cancel);
})();
