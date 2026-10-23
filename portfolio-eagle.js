/* Original published eagle scene, without contact or welcome-film modules. */
(()=>{'use strict';
const advertising=document.querySelector('.advertising-showcase');
if(advertising){
 // Keep Osiris inside the opening scene. This is a visual mascot, without
 // the account, microphone, live chat or roaming layers of the main site.
 const mascot=document.createElement('figure');mascot.className='portfolio-osiris';
 const portrait=document.createElement('img');portrait.src='images/osiris-assistant-v1.png';portrait.alt='Osiris, the Fjord Flow mascot';portrait.width=1145;portrait.height=1374;portrait.decoding='async';
 const mascotName=document.createElement('figcaption');mascotName.textContent='Osiris';mascot.append(portrait,mascotName);advertising.append(mascot);
 const mascotStyle=document.createElement('style');mascotStyle.textContent=`
 .portfolio-demo #advertising .portfolio-osiris{position:absolute;left:clamp(24px,4vw,64px);bottom:22px;z-index:3;margin:0;width:clamp(130px,15vw,220px);pointer-events:none;isolation:isolate}
 .portfolio-demo #advertising .portfolio-osiris img{display:block;width:100%;height:auto;max-height:270px;object-fit:contain;filter:drop-shadow(0 6px 10px #0003)}
 .portfolio-demo #advertising .portfolio-osiris figcaption{display:table;margin:5px auto 0;padding:5px 16px;border:1px solid #ffffff8a;border-radius:3px;background:#fffffff2;color:#242424;font:600 12px/1.4 'DM Sans',sans-serif;letter-spacing:.06em;text-shadow:none}
 @media(max-width:650px){.portfolio-demo #advertising .portfolio-osiris{left:auto;right:18px;top:264px;bottom:auto;width:108px}.portfolio-demo #advertising .portfolio-osiris img{max-height:152px}.portfolio-demo #advertising .portfolio-osiris figcaption{font-size:11px;padding:4px 12px}.portfolio-demo #advertising .advertising-message{width:calc(100% - 152px)!important;right:auto!important;left:20px!important;top:248px!important;bottom:auto!important}.portfolio-demo #advertising .advertising-message h2{font-size:30px!important}.portfolio-demo #advertising .advertising-brand img{max-width:155px}.portfolio-demo #advertising .portfolio-scene-note{display:block!important;width:100%!important;max-width:100%;white-space:normal!important;overflow-wrap:break-word;box-sizing:border-box}.portfolio-demo #advertising .portfolio-first-cta{font-size:11px;white-space:normal;min-height:44px}}
 `;document.head.append(mascotStyle);
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
