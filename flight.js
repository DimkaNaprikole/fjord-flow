let flightVideos={};
let galleryYouTubePlayer=null,youtubeAPIReady=null;
function loadYouTubeAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(youtubeAPIReady)return youtubeAPIReady;
 youtubeAPIReady=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT)};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
  script.onerror=()=>{youtubeAPIReady=null;reject(Error('YouTube controls could not load'))};document.head.append(script);
 });return youtubeAPIReady;
}
function appendFlightMedia(place,photos){const film=flightVideos[place.id];return film?[...photos,{kind:'drone',image:place.image,...film}]:photos}
function clearGalleryMotion(){galleryYouTubePlayer?.destroy?.();galleryYouTubePlayer=null;document.querySelector('.gallery-motion')?.remove();document.querySelector('.film-controls')?.remove();$('#galleryImage').hidden=false}
function showGalleryMotion(item){
 $('#galleryImage').hidden=true;
 const stage=document.createElement('div');stage.className='gallery-motion';
 const iframe=document.createElement('iframe'),url=new URL('https://www.youtube-nocookie.com/embed/'+item.youtubeId);
 url.search=new URLSearchParams({autoplay:'0',mute:'0',controls:'0',fs:'0',iv_load_policy:'3',enablejsapi:'1',playsinline:'1',rel:'0',origin:location.origin,start:String(Number.isInteger(item.startSeconds)&&item.startSeconds>0?item.startSeconds:0)}).toString();
 iframe.src=url.href;iframe.title=galleryPlace.name+' — '+item.title;iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';stage.append(iframe);
 $('#galleryCaption').textContent=`${galleryIndex+1} / ${galleryPhotos.length} · YouTube · ${galleryPlace.name} · Original soundtrack`;
 const controls=document.createElement('div');controls.className='film-controls';
 const command=name=>galleryYouTubePlayer?.[name]?.();
 const play=document.createElement('button');play.textContent='Play';play.disabled=true;
 play.onclick=()=>{if(galleryYouTubePlayer?.getPlayerState?.()===1)command('pauseVideo');else command('playVideo')};
 const sound=document.createElement('button');sound.textContent='Mute';sound.disabled=true;sound.setAttribute('aria-pressed','false');
 sound.onclick=()=>{const muted=galleryYouTubePlayer?.isMuted?.();command(muted?'unMute':'mute');sound.textContent=muted?'Mute':'Unmute';sound.setAttribute('aria-pressed',String(!muted))};
 const full=document.createElement('button');full.textContent='Full screen';full.onclick=()=>{const action=document.fullscreenElement?document.exitFullscreen?.():stage.requestFullscreen?.();action?.catch?.(()=>{})};
 controls.append(play,sound,full);
 const status=document.createElement('span');status.setAttribute('role','status');status.textContent='Loading video controls…';controls.append(status);
 stage.append(controls);$('.gallery-stage').prepend(stage);
 loadYouTubeAPI().then(YT=>{
  if(!stage.isConnected)return;
  galleryYouTubePlayer=new YT.Player(iframe,{events:{
   onReady:()=>{if(!stage.isConnected)return;controls.querySelectorAll('button').forEach(b=>b.disabled=false);status.textContent='Ready — press play for sound.'},
   onStateChange:event=>{if(!stage.isConnected)return;play.textContent=event.data===1?'Pause':event.data===0?'Replay':'Play';status.textContent=event.data===1?'Playing':event.data===2?'Paused':event.data===0?'Film ended':'Ready — press play for sound.';const muted=galleryYouTubePlayer?.isMuted?.();sound.textContent=muted?'Unmute':'Mute';sound.setAttribute('aria-pressed',String(!!muted))},
   onAutoplayBlocked:()=>{status.textContent='Press play inside the video to start playback.'},
   onError:event=>{status.textContent='This film cannot play here. ';console.warn('YouTube embed unavailable',item.youtubeId,event.data);play.disabled=true;sound.disabled=true;const link=document.createElement('a');link.href=safeURL(item.source);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open original video ↗';status.append(link)}
  }});
 }).catch(()=>{if(stage.isConnected)status.textContent='Use play inside the video, or open the Original film link.'});
}
function decorateFlights(){document.querySelectorAll('.card .photo').forEach(photo=>{const id=photo.dataset.gallery;if(photo.querySelector('[data-flight]')||!flightVideos[id])return;const button=document.createElement('button');button.className='flight-launch';button.dataset.flight=id;button.textContent=flightVideos[id].mediaKind==='visit'?'▶ Visit film':'▶ Watch the film';button.setAttribute('aria-label',(flightVideos[id].mediaKind==='visit'?'Watch a visit to ':'Fly over ')+(data.destinations.find(p=>p.id===id)?.name||id));button.onclick=e=>{e.stopPropagation();openGallery(id);galleryIndex=galleryPhotos.length-1;showGalleryPhoto()};button.onkeydown=e=>e.stopPropagation();photo.append(button)})}
$('#galleryDialog').addEventListener('close',clearGalleryMotion);
new MutationObserver(decorateFlights).observe($('#cards'),{childList:true});
fetch('./api/videos').then(r=>{if(!r.ok)throw Error('Video catalog unavailable');return r.json()}).then(v=>{flightVideos=Object.fromEntries(Object.entries(v).filter(([,x])=>/^[A-Za-z0-9_-]{11}$/.test(x.youtubeId)));document.querySelectorAll('.flight-launch').forEach(b=>b.remove());decorateFlights()}).catch(()=>{});
