/* Original published eagle scene, without contact or welcome-film modules. */
(()=>{'use strict';
const advertising=document.querySelector('.advertising-showcase');
if(advertising){
 const adFilmUrl='media/eagle-ad-background.mp4';
 const backgroundVideo=document.createElement('video');backgroundVideo.className='advertising-background-film';backgroundVideo.muted=true;backgroundVideo.defaultMuted=true;backgroundVideo.loop=true;backgroundVideo.autoplay=true;backgroundVideo.playsInline=true;backgroundVideo.preload='none';backgroundVideo.poster='images/advertising-fjord-art.webp';backgroundVideo.setAttribute('aria-hidden','true');backgroundVideo.setAttribute('playsinline','');backgroundVideo.tabIndex=-1;advertising.prepend(backgroundVideo);
 let backgroundInView=false,autoplayBlocked=false;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const updateBackground=()=>{const box=advertising.getBoundingClientRect();backgroundInView=box.bottom>0&&box.top<innerHeight&&box.width>0;if(backgroundInView&&!reducedMotion.matches&&!document.hidden&&!advertising.closest('[hidden]')&&!navigator.connection?.saveData){if(!backgroundVideo.src)backgroundVideo.src=adFilmUrl;autoplayBlocked=false;backgroundVideo.muted=true;backgroundVideo.play().catch(error=>{autoplayBlocked=error?.name==='NotAllowedError';});}else backgroundVideo.pause();};
 // Match the strict viewport check above: an expanded margin can fire too early
 // and leave a paused film without another callback when it reaches the screen.
 if('IntersectionObserver' in window){new IntersectionObserver(entries=>{backgroundInView=entries[0].isIntersecting;updateBackground();},{rootMargin:'0px'}).observe(advertising);}else{backgroundInView=true;updateBackground();}
 reducedMotion.addEventListener?.('change',updateBackground);
 document.addEventListener('visibilitychange',updateBackground);
 window.addEventListener('fjord:sections-changed',()=>requestAnimationFrame(updateBackground));
 window.addEventListener('hashchange',()=>requestAnimationFrame(updateBackground));
 window.addEventListener('resize',updateBackground);
 requestAnimationFrame(updateBackground);
 navigator.connection?.addEventListener?.('change',updateBackground);
 // Some mobile policies reject even muted autoplay. Retry within the next real
 // interaction, while retaining the same visibility, motion and data limits.
 const retryBackground=()=>{if(autoplayBlocked)updateBackground();};
 document.addEventListener('touchend',retryBackground,{passive:true});
 document.addEventListener('click',retryBackground,{passive:true});
 document.addEventListener('keydown',retryBackground);
}

})();
