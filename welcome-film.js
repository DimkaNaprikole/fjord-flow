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
const text=document.createElement('span'),label=document.createElement('strong'),hint=document.createElement('small');text.append(label,hint);trigger.append(icon,text);hero.append(trigger);
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
// Let the opening photograph settle, then fade into the scenic eagle flight.
const heroScenery=document.getElementById('heroScenery');
if(heroScenery){
 const heroVideo=document.createElement('video');heroVideo.className='hero-intro-video';heroVideo.muted=true;heroVideo.defaultMuted=true;heroVideo.loop=true;heroVideo.playsInline=true;heroVideo.preload='none';heroVideo.setAttribute('playsinline','');heroVideo.setAttribute('aria-hidden','true');heroVideo.tabIndex=-1;heroScenery.append(heroVideo);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),saveData=navigator.connection?.saveData===true;
 let started=false,inView=true;
 const update=()=>{if(reduced.matches||saveData||document.hidden||!inView){heroVideo.pause();return}if(!started)return;heroVideo.play().catch(()=>{});};
 heroVideo.addEventListener('playing',()=>{heroVideo.classList.add('is-playing');heroScenery.closest('.hero')?.classList.add('is-film-playing')});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;update();},{threshold:.08}).observe(heroScenery);
 document.addEventListener('visibilitychange',update);reduced.addEventListener?.('change',update);
 if(!reduced.matches&&!saveData)setTimeout(()=>{started=true;heroVideo.src='media/eagle-ad-background.mp4';update();},2800);
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
 let backgroundInView=false;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const updateBackground=()=>{if(backgroundInView&&!reducedMotion.matches){if(!backgroundVideo.src)backgroundVideo.src=adFilmUrl;backgroundVideo.play().catch(()=>{});}else backgroundVideo.pause();};
 if('IntersectionObserver' in window){new IntersectionObserver(entries=>{backgroundInView=entries[0].isIntersecting;updateBackground();},{rootMargin:'200px'}).observe(advertising);}else{backgroundInView=true;updateBackground();}
 reducedMotion.addEventListener?.('change',updateBackground);
}
})();
