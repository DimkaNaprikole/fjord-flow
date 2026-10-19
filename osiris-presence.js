/* A quiet, bounded animated companion. No microphone, chat or remote requests. */
(()=>{'use strict';
const GAP=10,EDGE=12;
const overlaps=(a,b,gap=GAP)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
const swept=(a,dx)=>({left:Math.min(a.left,a.left+dx),right:Math.max(a.right,a.right+dx),top:a.top,bottom:a.bottom});
const safeStep=(rect,dx,width,height,obstacles)=>{
 const area=swept(rect,dx);
 return area.left>=EDGE&&area.right<=width-EDGE&&area.top>=EDGE&&area.bottom<=height-EDGE&&!obstacles.some(r=>overlaps(area,r));
};
const isRoamObstacle=node=>{
 if(node.hasAttribute('data-osiris-no-roam'))return true;
 const tag=node.tagName.toLowerCase();
 // Hero and advertising films are decorative (no controls, tabindex=-1).
 if(tag==='video')return node.controls===true;
 if(tag==='iframe')return Boolean(node.getAttribute('src')||node.hasAttribute('srcdoc'))&&node.getAttribute('aria-hidden')!=='true';
 if(['button','input','select','textarea','summary'].includes(tag)||node.getAttribute('role')==='button'||(tag==='a'&&node.hasAttribute('href')))return true;
 return node.hasAttribute('tabindex')&&node.tabIndex>=0;
};
// Pure geometry is also used by the offline regression tests.
if(typeof module!=='undefined'&&module.exports)module.exports={overlaps,swept,safeStep,isRoamObstacle};
if(typeof document==='undefined')return;
function attach(){
 const launch=document.querySelector('.fjord-helper-launch.osiris-launch'),dialog=document.getElementById('fjordHelper');
 if(!launch||!dialog||!dialog.querySelector('.fjord-ai-about'))return false;
 if(launch.dataset.osirisPresence)return true;
 launch.dataset.osirisPresence='ready';
 const pet=launch.querySelector('.fjord-ai-pet'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const avatar=pet?.querySelector?.('.osiris-avatar');
 const originalImageError=avatar?.onerror;
 let motionFailed=false,rendered='',phase='rest',phaseUntil=Date.now()+4000,idleWalks=0;
 if(avatar){
  launch.setAttribute('data-osiris-motion','ready');
  avatar.width=480;avatar.height=270;
  avatar.onerror=()=>{if(motionFailed){originalImageError?.();return}motionFailed=true;rendered='';render('listen',false)};
 }
 const label=document.createElement('label'),toggle=document.createElement('input'),caption=document.createElement('span');
 label.className='osiris-sound-option';toggle.type='checkbox';toggle.checked=false;label.append(toggle,caption);dialog.querySelector('.fjord-ai-about').append(label);
 const copy={ru:'Звук кота',uk:'Звук кота',nb:'Kattelyd',en:'Cat sounds',sv:'Kattljud',da:'Kattelyde'};
 const translate=()=>{const language=(document.documentElement.lang||'en').split('-')[0];caption.textContent=copy[language]||copy.en};
 translate();
 let audio=null,voiceActive=launch.dataset.osirisActive==='true',offset=0,speechAnchor=0,direction=-1,hover=false,focus=false,pressed=false,scrollUntil=0,lastFrame=0,raf=0,dead=false;
 // Listening/thinking always sit. Idle play is silent, brief, and closed-chat only.
 const paused=()=>dead||document.hidden||reduced.matches||hover||(focus&&launch.matches(':focus-visible'))||pressed||Date.now()<scrollUntil||Boolean(document.querySelector('dialog[open]:not(#fjordHelper),[aria-modal="true"]:not(#fjordHelper)'));
 const speaking=()=>voiceActive&&pet?.dataset.state==='speaking';
 const idle=()=>!voiceActive&&!dialog.open&&(!pet?.dataset.state||pet.dataset.state==='idle');
 const blocked=()=>paused()||!(speaking()||(idle()&&phase==='walk'));
 function render(pose,animated=true){
  if(!avatar)return;
  const key=motionFailed?'fallback':`${pose}.${animated&&!document.hidden&&!reduced.matches?'webp':'png'}`;
  if(key!==rendered){rendered=key;avatar.src=motionFailed?'./images/osiris-assistant-v1.png':`./media/osiris-motion/${key}`}
  launch.setAttribute('data-osiris-pose',pose);
  avatar.style.scale=pose==='walk'&&direction<0?'-1 1':'1 1';
 }
 function syncPose(){
  if(paused()){render('listen',false);return}
  if(launch.hasAttribute('data-osiris-walking')){render('walk');return}
  if(idle()&&phase==='play'){render('play');return}
  render('listen',pet?.dataset.state==='listening');
 }
 function rest(delay=4000){phase='rest';phaseUntil=Date.now()+delay}
 const soundBlocked=()=>dead||voiceActive||document.hidden||Boolean(window.speechSynthesis?.speaking)||(pet?.dataset.state&&pet.dataset.state!=='idle');
 const stopAudio=()=>{if(audio){audio.pause();audio.currentTime=0}};
 const stopWalking=()=>{launch.removeAttribute('data-osiris-walking');syncPose()};
 const stop=()=>{rest();stopWalking();stopAudio()};
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
   if(node===launch||launch.contains(node)||!isRoamObstacle(node)||node.closest('[hidden],dialog:not([open])'))continue;
   for(const r of node.getClientRects())if(r.width&&r.height&&r.top<innerHeight&&r.bottom>0)list.push(r);
  }
  return list;
 }
 function placeInitially(){
  const rect=launch.getBoundingClientRect(),nearby=obstacles();
  if(!nearby.some(r=>overlaps(rect,r)))return;
  // Pick a free initial dock before patrol begins; never leave the larger cat
  // on top of the weather link or another existing bottom-edge control.
  for(let dx=-24;dx>=-Math.min(600,innerWidth*.55);dx-=24){
   const target={left:rect.left+dx,right:rect.right+dx,top:rect.top,bottom:rect.bottom};
   if(safeStep(target,0,innerWidth,innerHeight,nearby)){offset=dx;speechAnchor=dx;launch.style.translate=`${dx}px 0`;return}
  }
 }
 function frame(time){
  if(dead)return;
  raf=requestAnimationFrame(frame);
  if(time-lastFrame<80)return;
  const elapsed=Math.min(time-lastFrame,120);lastFrame=time;
  if(idle()&&!paused()&&Date.now()>=phaseUntil){
   if(phase==='rest'){phase=(idleWalks++%3===2)?'play':'walk';phaseUntil=Date.now()+(phase==='play'?1890:5000)}
   else rest(12000);
  }
  if(soundBlocked())stopAudio();
  if(blocked()){stopWalking();return}
  const rect=launch.getBoundingClientRect();
  // No off-screen drift after rotation or zoom. The CSS dock remains the fallback.
  if(rect.left<EDGE||rect.right>innerWidth-EDGE||rect.bottom>innerHeight-EDGE||rect.top<EDGE){offset=0;speechAnchor=0;launch.style.removeProperty('translate');stopWalking();return}
  const nearby=obstacles(),step=16*elapsed/1000;
  const limit=idle()?Math.min(600,innerWidth*.55):36;
  const canMove=dx=>Math.abs(offset+dx-(idle()?0:speechAnchor))<=limit&&safeStep(rect,dx,innerWidth,innerHeight,nearby);
  let dx=direction*step;
  // Keep speaking near the chat; idle walks may explore the free bottom edge.
  // If either direction would cover
  // a control (including the chat's own controls), stay still until it is clear.
  if(!canMove(dx)){direction*=-1;dx=direction*step}
  if(!canMove(dx)){stopWalking();return}
  offset+=dx;launch.style.translate=`${offset.toFixed(2)}px 0`;launch.setAttribute('data-osiris-walking','true');syncPose();
 }
 const events=[];
 function listen(target,event,handler,options){target.addEventListener(event,handler,options);events.push(()=>target.removeEventListener(event,handler,options))}
 listen(launch,'pointerenter',()=>{hover=true;stop()});listen(launch,'pointerleave',()=>{hover=false});
 listen(launch,'focusin',()=>{focus=true;if(launch.matches(':focus-visible'))stop()});listen(launch,'focusout',()=>{focus=false});
 listen(launch,'pointerdown',()=>{pressed=true;stop()});
 listen(window,'pointerup',()=>{pressed=false});listen(window,'pointercancel',()=>{pressed=false});
 listen(dialog,'close',stop);
 listen(toggle,'change',chooseSound);
 listen(window,'fjord:voice-activity',event=>{voiceActive=event.detail?.active===true;speechAnchor=offset;stop()});
 listen(window,'scroll',()=>{scrollUntil=Date.now()+1500;stop()},{passive:true});
 listen(window,'resize',()=>{offset=0;speechAnchor=0;launch.style.removeProperty('translate');stop();placeInitially()});
 listen(document,'visibilitychange',stop);listen(window,'fjordlanguagechange',translate);
 const observer=new MutationObserver(()=>{if(!idle())rest();if(blocked())stopWalking();else syncPose();if(soundBlocked())stopAudio()});observer.observe(dialog,{attributes:true,attributeFilter:['open','class']});if(pet)observer.observe(pet,{attributes:true,attributeFilter:['data-state']});
 listen(reduced,'change',()=>{offset=0;launch.style.removeProperty('translate');stop()});
 listen(window,'pagehide',event=>{
  stop();if(event.persisted)return;
  dead=true;cancelAnimationFrame(raf);observer.disconnect();events.forEach(remove=>remove());label.remove();launch.style.removeProperty('translate');delete launch.dataset.osirisPresence;
 });
 placeInitially();syncPose();raf=requestAnimationFrame(frame);return true;
}
function start(){if(attach())return;const pending=new MutationObserver(()=>{if(attach())pending.disconnect()});pending.observe(document.body,{childList:true,subtree:true});window.addEventListener('pagehide',()=>pending.disconnect(),{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
