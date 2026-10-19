/* A quiet, bounded portrait companion. No microphone, chat or remote requests. */
(()=>{'use strict';
const GAP=10,EDGE=12;
const overlaps=(a,b,gap=GAP)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
const swept=(a,dx)=>({left:Math.min(a.left,a.left+dx),right:Math.max(a.right,a.right+dx),top:a.top,bottom:a.bottom});
const safeStep=(rect,dx,width,height,obstacles)=>{
 const area=swept(rect,dx);
 return area.left>=EDGE&&area.right<=width-EDGE&&area.top>=EDGE&&area.bottom<=height-EDGE&&!obstacles.some(r=>overlaps(area,r));
};
// Pure geometry is also used by the offline regression tests.
if(typeof module!=='undefined'&&module.exports)module.exports={overlaps,swept,safeStep};
if(typeof document==='undefined')return;
function attach(){
 const launch=document.querySelector('.fjord-helper-launch.osiris-launch'),dialog=document.getElementById('fjordHelper');
 if(!launch||!dialog||!dialog.querySelector('.fjord-ai-about'))return false;
 if(launch.dataset.osirisPresence)return true;
 launch.dataset.osirisPresence='ready';
 const pet=launch.querySelector('.fjord-ai-pet'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const label=document.createElement('label'),toggle=document.createElement('input'),caption=document.createElement('span');
 label.className='osiris-sound-option';toggle.type='checkbox';toggle.checked=false;label.append(toggle,caption);dialog.querySelector('.fjord-ai-about').append(label);
 const copy={ru:'Звук кота',uk:'Звук кота',nb:'Kattelyd',en:'Cat sounds',sv:'Kattljud',da:'Kattelyde'};
 const translate=()=>{const language=(document.documentElement.lang||'en').split('-')[0];caption.textContent=copy[language]||copy.en};
 translate();
 let audio=null,voiceActive=false,offset=0,direction=-1,hover=false,focus=false,pressed=false,scrollUntil=0,nextWalk=Date.now()+12000,walkUntil=0,lastFrame=0,raf=0,dead=false;
 const blocked=()=>dead||!voiceActive||document.hidden||(dialog.open&&!dialog.classList.contains('osiris-compact'))||reduced.matches||hover||(focus&&launch.matches(':focus-visible'))||pressed||Date.now()<scrollUntil||Boolean(document.querySelector('dialog[open]:not(#fjordHelper),[aria-modal="true"]:not(#fjordHelper)'));
 const soundBlocked=()=>dead||voiceActive||document.hidden||Boolean(window.speechSynthesis?.speaking)||(pet?.dataset.state&&pet.dataset.state!=='idle');
 const stopAudio=()=>{if(audio){audio.pause();audio.currentTime=0}};
 const stopWalking=()=>{walkUntil=0;launch.removeAttribute('data-osiris-walking')};
 const stop=()=>{stopWalking();stopAudio()};
 function chooseSound(event){
  if(!event.isTrusted||!toggle.checked){toggle.checked=false;stopAudio();return;}
  // A short preview requires this explicit opt-in; opening the cat is not consent.
  if(soundBlocked())return;
  if(!audio){audio=new Audio('./media/osiris-meow.mp3');audio.preload='none';audio.volume=.16}
  try{const playing=audio.play();if(playing?.catch)playing.catch(stopAudio)}catch{stopAudio()}
 }
 function obstacles(){
  const list=[];
  for(const node of document.querySelectorAll('a,button,input,select,textarea,summary,[role="button"],[tabindex],video,iframe,[data-osiris-no-roam]')){
   if(node===launch||launch.contains(node)||dialog.contains(node)||node.closest('[hidden],dialog:not([open])'))continue;
   for(const r of node.getClientRects())if(r.width&&r.height&&r.top<innerHeight&&r.bottom>0)list.push(r);
  }
  return list;
 }
 function frame(time){
  if(dead)return;
  raf=requestAnimationFrame(frame);
  if(time-lastFrame<80)return;
  const elapsed=Math.min(time-lastFrame,120);lastFrame=time;
  if(soundBlocked())stopAudio();
  if(blocked()){stopWalking();return}
  const now=Date.now(),rect=launch.getBoundingClientRect();
  // No off-screen drift after rotation or zoom. The CSS dock remains the fallback.
  if(rect.left<EDGE||rect.right>innerWidth-EDGE||rect.bottom>innerHeight-EDGE||rect.top<EDGE){offset=0;launch.style.removeProperty('translate');stopWalking();nextWalk=now+12000;return}
  if(now>=nextWalk&&!walkUntil){walkUntil=now+6500;nextWalk=now+22000;launch.setAttribute('data-osiris-walking','true')}
  if(walkUntil&&now<walkUntil){
   const dx=direction*16*elapsed/1000;
   if(safeStep(rect,dx,innerWidth,innerHeight,obstacles())&&Math.abs(offset+dx)<=36){
    offset+=dx;launch.style.translate=`${offset.toFixed(2)}px 0`;
   }else{direction*=-1;stopWalking();nextWalk=now+16000}
  }else stopWalking();
 }
 const events=[];
 function listen(target,event,handler,options){target.addEventListener(event,handler,options);events.push(()=>target.removeEventListener(event,handler,options))}
 listen(launch,'pointerenter',()=>{hover=true;stop()});listen(launch,'pointerleave',()=>{hover=false});
 listen(launch,'focusin',()=>{focus=true;if(launch.matches(':focus-visible'))stop()});listen(launch,'focusout',()=>{focus=false});
 listen(launch,'pointerdown',()=>{pressed=true;stop()});
 listen(window,'pointerup',()=>{pressed=false});listen(window,'pointercancel',()=>{pressed=false});
 listen(dialog,'close',()=>{nextWalk=Date.now()+12000});
 listen(toggle,'change',chooseSound);
 listen(window,'fjord:voice-activity',event=>{voiceActive=event.detail?.active===true;stop();if(voiceActive)nextWalk=Date.now()+500;});
 listen(window,'scroll',()=>{scrollUntil=Date.now()+1500;stop()},{passive:true});
 listen(window,'resize',()=>{offset=0;launch.style.removeProperty('translate');stop();nextWalk=Date.now()+12000});
 listen(document,'visibilitychange',stop);listen(window,'fjordlanguagechange',translate);
 const observer=new MutationObserver(()=>{if(blocked())stopWalking();if(soundBlocked())stopAudio()});observer.observe(dialog,{attributes:true,attributeFilter:['open','class']});if(pet)observer.observe(pet,{attributes:true,attributeFilter:['data-state']});
 listen(reduced,'change',()=>{offset=0;launch.style.removeProperty('translate');stop()});
 listen(window,'pagehide',event=>{
  stop();if(event.persisted)return;
  dead=true;cancelAnimationFrame(raf);observer.disconnect();events.forEach(remove=>remove());label.remove();launch.style.removeProperty('translate');delete launch.dataset.osirisPresence;
 });
 raf=requestAnimationFrame(frame);return true;
}
function start(){if(attach())return;const pending=new MutationObserver(()=>{if(attach())pending.disconnect()});pending.observe(document.body,{childList:true,subtree:true});window.addEventListener('pagehide',()=>pending.disconnect(),{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
