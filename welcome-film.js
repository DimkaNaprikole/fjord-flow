/* A user-started welcome film. No video traffic until the viewer opens it. */
(()=>{'use strict';
const hero=document.querySelector('.hero-content');if(!hero)return;
const copy={
 en:{watch:'Watch the journey',hint:'Routes · cafés · cabins · saunas',title:'Your next Norwegian story',intro:'A little inspiration. A whole journey to discover.',close:'Close film',explore:'Explore the routes ↗',credits:'Photo credits ↗',error:'The film could not load. Please try again.',play:'Play welcome film'},
 uk:{watch:'Відчуйте подорож',hint:'Маршрути · кав’ярні · будиночки · сауни',title:'Ваша наступна норвезька історія',intro:'Трохи натхнення. Ціла подорож попереду.',close:'Закрити відео',explore:'Обрати маршрут ↗',credits:'Автори фотографій ↗',error:'Не вдалося завантажити відео. Спробуйте ще раз.',play:'Відтворити вітальне відео'},
 nb:{watch:'Se reisen',hint:'Ruter · kafeer · hytter · badstuer',title:'Din neste norske historie',intro:'Litt inspirasjon. En hel reise å oppdage.',close:'Lukk filmen',explore:'Utforsk rutene ↗',credits:'Fotokreditering ↗',error:'Filmen kunne ikke lastes inn. Prøv igjen.',play:'Spill velkomstfilmen'},
 sv:{watch:'Se resan',hint:'Rutter · kaféer · stugor · bastur',title:'Din nästa norska berättelse',intro:'Lite inspiration. En hel resa att upptäcka.',close:'Stäng filmen',explore:'Utforska rutterna ↗',credits:'Fotokreditering ↗',error:'Filmen kunde inte laddas. Försök igen.',play:'Spela välkomstfilmen'},
 da:{watch:'Se rejsen',hint:'Ruter · caféer · hytter · saunaer',title:'Din næste norske historie',intro:'Lidt inspiration. En hel rejse at opdage.',close:'Luk filmen',explore:'Udforsk ruterne ↗',credits:'Fotokreditering ↗',error:'Filmen kunne ikke indlæses. Prøv igen.',play:'Afspil velkomstfilmen'}
};
const trigger=document.createElement('button');trigger.type='button';trigger.className='welcome-film-trigger';trigger.dataset.i18nIgnore='';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','welcomeFilmDialog');
const icon=document.createElement('span');icon.className='welcome-film-play';icon.textContent='▶';icon.setAttribute('aria-hidden','true');
const text=document.createElement('span'),label=document.createElement('strong'),hint=document.createElement('small');text.append(label,hint);trigger.append(icon,text);
const dialog=document.createElement('dialog');dialog.id='welcomeFilmDialog';dialog.className='welcome-film-dialog';dialog.dataset.i18nIgnore='';dialog.setAttribute('aria-labelledby','welcomeFilmTitle');
const top=document.createElement('div');top.className='welcome-film-heading';const title=document.createElement('h2');title.id='welcomeFilmTitle';const close=document.createElement('button');close.type='button';close.className='welcome-film-close';close.textContent='×';top.append(title,close);
const video=document.createElement('video');video.id='welcomeFilmVideo';video.controls=true;video.playsInline=true;video.preload='none';video.poster='images/fjord-flow-welcome-poster.jpg';video.setAttribute('aria-describedby','welcomeFilmIntro');
const captionTracks=[];for(const [lang,name] of Object.entries({nb:'Norsk bokmål',en:'English',uk:'Українська',sv:'Svenska',da:'Dansk'})){const track=document.createElement('track');track.kind='captions';track.srclang=lang;track.label=name;track.src=`media/welcome-film-${lang}.vtt`;video.append(track);captionTracks.push(track);}
function selectCaptions(){const lang=window.FjordI18n?.language||document.documentElement.lang;for(const track of captionTracks){const selected=lang!=='uk'&&track.srclang===(copy[lang]?lang:'en');track.default=selected;if(track.track)track.track.mode=selected?'showing':'disabled';}}
const bottom=document.createElement('div');bottom.className='welcome-film-bottom';const intro=document.createElement('p');intro.id='welcomeFilmIntro';const explore=document.createElement('a');explore.href='#collection';const credits=document.createElement('a');credits.className='welcome-film-credits';credits.href='media/welcome-film-credits.html';credits.target='_blank';credits.rel='noopener noreferrer';const links=document.createElement('div');links.className='welcome-film-links';links.append(credits,explore);bottom.append(intro,links);
const error=document.createElement('p');error.className='welcome-film-error';error.hidden=true;error.setAttribute('role','status');dialog.append(top,video,bottom,error);document.body.append(dialog);
function translate(){const w=copy[window.FjordI18n?.language||document.documentElement.lang]||copy.en;label.textContent=w.watch;hint.textContent=w.hint;title.textContent=w.title;intro.textContent=w.intro;close.setAttribute('aria-label',w.close);video.setAttribute('aria-label',w.play);explore.textContent=w.explore;credits.textContent=w.credits;error.textContent=w.error;selectCaptions();}
translate();window.addEventListener('fjordlanguagechange',translate);
video.addEventListener('loadedmetadata',selectCaptions);
// Keep the welcome film available in the dialog, but let destination photos own the hero.
// A verified location film accompanies Lofoten; the credited photo remains the fallback.
const heroScenery=document.getElementById('heroScenery');
if(heroScenery){
 const locationFilm=document.createElement('video');locationFilm.className='hero-location-film';locationFilm.muted=true;locationFilm.defaultMuted=true;locationFilm.playsInline=true;locationFilm.preload='metadata';locationFilm.loop=true;locationFilm.setAttribute('aria-hidden','true');locationFilm.tabIndex=-1;heroScenery.append(locationFilm);
 const filmUrl='https://upload.wikimedia.org/wikipedia/commons/transcoded/3/30/LOFOTEN_ISLANDS_-_NORWAY_-_4K_FILM.webm/LOFOTEN_ISLANDS_-_NORWAY_-_4K_FILM.webm.1080p.vp9.webm';
 const reduceFilm=matchMedia('(prefers-reduced-motion: reduce)');
 let inView=true;
 const updateLocationFilm=()=>{
  const wanted=heroScenery.dataset.currentImage==='./images/hero-lofoten.jpg'&&inView&&!document.hidden&&!reduceFilm.matches&&!navigator.connection?.saveData;
  if(!wanted){locationFilm.pause();locationFilm.classList.remove('is-visible');heroScenery.dataset.videoActive='false';return;}
  if(!locationFilm.src)locationFilm.src=filmUrl;
  if(locationFilm.readyState<1||locationFilm.seeking)return;
  locationFilm.play().catch(()=>{/* The moving photograph remains visible. */});
 };
 locationFilm.addEventListener('loadedmetadata',()=>{locationFilm.currentTime=60});
 locationFilm.addEventListener('seeked',updateLocationFilm);
 locationFilm.addEventListener('playing',()=>{if(heroScenery.dataset.currentImage==='./images/hero-lofoten.jpg'&&locationFilm.currentTime>=60){locationFilm.classList.add('is-visible');heroScenery.dataset.videoActive='true'}});
 locationFilm.addEventListener('error',()=>{locationFilm.classList.remove('is-visible');heroScenery.dataset.videoActive='false'});
 new MutationObserver(updateLocationFilm).observe(heroScenery,{attributes:true,attributeFilter:['data-current-image']});
 new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;updateLocationFilm()},{rootMargin:'100px'}).observe(heroScenery);
 document.addEventListener('visibilitychange',updateLocationFilm);reduceFilm.addEventListener?.('change',updateLocationFilm);
 const credits=document.getElementById('sceneryCredits');if(credits){const p=document.createElement('p');p.append('Lofoten location film — Danny Rest · ');for(const [label,href] of [['CC BY 3.0','https://creativecommons.org/licenses/by/3.0/'],['Original video','https://commons.wikimedia.org/wiki/File:LOFOTEN_ISLANDS_-_NORWAY_-_4K_FILM.webm']]){const a=document.createElement('a');a.textContent=label;a.href=href;a.target='_blank';a.rel='noopener noreferrer';p.append(a,' · ')}p.append('Muted, cropped preview.');credits.append(p)}
}
let previousOverflow='';
trigger.addEventListener('click',()=>{error.hidden=true;previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';if(!video.getAttribute('src'))video.src='media/fjord-flow-welcome.mp4';video.play().catch(()=>{/* Native controls remain available if playback is blocked. */});});
function stop(){video.pause();document.body.style.overflow=previousOverflow;trigger.focus({preventScroll:true});}
close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',stop);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
video.addEventListener('error',()=>{error.hidden=false;});
explore.addEventListener('click',e=>{e.preventDefault();dialog.close();const routes=document.querySelector('.roadtrip-collection');if(routes){routes.tabIndex=-1;routes.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});routes.focus({preventScroll:true});}});

const advertising=document.querySelector('.advertising-showcase');
if(advertising){
 const adFilmUrl='media/eagle-ad-background.mp4';
 const backgroundVideo=document.createElement('video');backgroundVideo.className='advertising-background-film';backgroundVideo.muted=true;backgroundVideo.defaultMuted=true;backgroundVideo.loop=true;backgroundVideo.autoplay=true;backgroundVideo.playsInline=true;backgroundVideo.preload='none';backgroundVideo.poster='images/advertising-fjord-art.webp';backgroundVideo.setAttribute('aria-hidden','true');backgroundVideo.setAttribute('playsinline','');backgroundVideo.tabIndex=-1;advertising.prepend(backgroundVideo);
 let backgroundInView=false,autoplayBlocked=false;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const updateBackground=()=>{const box=advertising.getBoundingClientRect();backgroundInView=box.bottom>0&&box.top<innerHeight&&box.width>0;if(backgroundInView&&!reducedMotion.matches&&!document.hidden&&!advertising.closest('[hidden]')&&!navigator.connection?.saveData){if(!backgroundVideo.src)backgroundVideo.src=adFilmUrl;autoplayBlocked=false;backgroundVideo.play().catch(error=>{autoplayBlocked=error?.name==='NotAllowedError';});}else backgroundVideo.pause();};
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
