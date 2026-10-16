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
let previousOverflow='';
trigger.addEventListener('click',()=>{error.hidden=true;previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';if(!video.getAttribute('src'))video.src='media/fjord-flow-welcome.mp4';video.play().catch(()=>{/* Native controls remain available if playback is blocked. */});});
function stop(){video.pause();document.body.style.overflow=previousOverflow;trigger.focus({preventScroll:true});}
close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',stop);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
video.addEventListener('error',()=>{error.hidden=false;});
explore.addEventListener('click',e=>{e.preventDefault();dialog.close();const routes=document.querySelector('.roadtrip-collection');if(routes){routes.tabIndex=-1;routes.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});routes.focus({preventScroll:true});}});

const advertising=document.querySelector('.advertising-showcase');
if(advertising){
 const labels={nb:'Se reklamefilmen (norsk)',en:'Watch the ad film (Norwegian)',uk:'Дивитися рекламний ролик (норвезькою)',sv:'Se reklamfilmen (norska)',da:'Se reklamefilmen (norsk)'};
 const adTrigger=document.createElement('button');adTrigger.type='button';adTrigger.className='advertising-film-trigger';adTrigger.dataset.i18nIgnore='';
 const adDialog=document.createElement('dialog');adDialog.className='welcome-film-dialog advertising-film-dialog';adDialog.dataset.i18nIgnore='';
 const adTop=document.createElement('div');adTop.className='welcome-film-heading';const adTitle=document.createElement('h2');const adClose=document.createElement('button');adClose.className='welcome-film-close';adClose.type='button';adClose.textContent='×';adClose.setAttribute('aria-label','Close');adTop.append(adTitle,adClose);
 const adVideo=document.createElement('video');adVideo.controls=true;adVideo.playsInline=true;adVideo.preload='none';adVideo.poster='images/advertising-fjord-art.webp';adVideo.setAttribute('aria-label','FJORD FLOW Norwegian advertising film');
 adDialog.append(adTop,adVideo);document.body.append(adDialog);advertising.append(adTrigger);
 const adStyle=document.createElement('style');adStyle.textContent='.advertising-film-trigger{margin-top:26px;min-height:48px;padding:12px 22px;border:1px solid #fff5d5aa;border-radius:999px;background:#082f3dde;color:#fff9e5;font:750 14px Manrope,\"Segoe UI\",sans-serif;cursor:pointer;box-shadow:0 8px 30px #001b2b66;backdrop-filter:blur(8px)}.advertising-film-trigger:hover{background:#174a59}.advertising-film-trigger:focus-visible{outline:3px solid #ffe5a5;outline-offset:4px}.advertising-film-dialog{margin:auto}.advertising-film-dialog video{aspect-ratio:16/9}';document.head.append(adStyle);
 const translateAd=()=>{const language=window.FjordI18n?.language||document.documentElement.lang;adTrigger.textContent='▶ '+(labels[language]||labels.en);adTitle.textContent=labels[language]||labels.en;};translateAd();window.addEventListener('fjordlanguagechange',translateAd);
 adTrigger.addEventListener('click',()=>{adDialog.showModal();document.body.style.overflow='hidden';if(!adVideo.src)adVideo.src='https://d2ol7oe51mr4n9.cloudfront.net/user_2xaGL2ZweQR3ccHuX5BlXzZ3s2k/ce662e82-eef6-4e90-bc31-489ac35780c3.mp4';adVideo.play().catch(()=>{});});
 adClose.addEventListener('click',()=>adDialog.close());adDialog.addEventListener('close',()=>{adVideo.pause();document.body.style.overflow='';adTrigger.focus({preventScroll:true});});
 adDialog.addEventListener('click',e=>{if(e.target===adDialog)adDialog.close();});
}
})();
