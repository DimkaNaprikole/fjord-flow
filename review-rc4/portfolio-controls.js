/* Light follows the pointer only while the user interacts. No animation loop. */
(()=>{'use strict';
const controls='.portfolio-first-cta,.ref-link,.postcard-toggle,.card-bottom button,.catalogue-flip-toggle,.norway-catalog-more,.norway-catalog-actions a,#filters button,.place-pagination button,.norway-catalog-gps,.norway-catalog-retry,dialog button:not(.stay-gallery-thumb),dialog a.button';
const fine=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
document.addEventListener('pointermove',e=>{
 if(!fine.matches||reduce.matches)return;
 const b=e.target.closest?.(controls);if(!b||b.disabled)return;
 const r=b.getBoundingClientRect();
 b.style.setProperty('--ff-light-x',`${Math.round(e.clientX-r.left)}px`);
 b.style.setProperty('--ff-light-y',`${Math.round(e.clientY-r.top)}px`);
},{passive:true});
})();
