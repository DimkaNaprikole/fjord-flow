import {AlphaSequence} from './alpha-sequence.mjs?v=20261020continuity1';
import {createCatBrain} from './cat-brain.mjs?v=20261020continuity1';
import {buildMovementCatalog,behaviorPools} from './movement-catalog.mjs';
import {fitCharacterClip} from './character-layout.mjs';
import {MOTION_POSES} from './character-calibration.mjs';

const MEDIA=new URL('../media/osiris-life/metadata.json',import.meta.url);
const COPY={
 en:['Pause Osiris animations','Resume Osiris animations','Osiris movements','Choose a movement…','Play','Rest'],
 nb:['Sett Osiris-animasjonene på pause','Fortsett Osiris-animasjonene','Osiris bevegelser','Velg en bevegelse…','Lek','Hvil'],
 ru:['Приостановить движения Osiris','Продолжить движения Osiris','Движения Osiris','Выбрать движение…','Играть','Отдыхать'],
 uk:['Призупинити рухи Osiris','Продовжити рухи Osiris','Рухи Osiris','Вибрати рух…','Грати','Відпочивати'],
 sv:['Pausa Osiris rörelser','Fortsätt Osiris rörelser','Osiris rörelser','Välj en rörelse…','Lek','Vila'],
 da:['Sæt Osiris-bevægelser på pause','Fortsæt Osiris-bevægelser','Osiris bevægelser','Vælg en bevægelse…','Leg','Hvil'],
};
const ENGLISH={
 blink:'Slow blink',yawn:'Yawn',listen:'Listen','nose-lick':'Lick nose',groom:'Wash paw',
 yarn:'Play with yarn',mouse:'Catch toy mouse',feather:'Catch feather',tail:'Chase tail',paper:'Play with paper',
 'side-hop':'Playful hop','lying-toy':'Play lying down',sniff:'Sniff',stretch:'Stretch',knead:'Knead',
 scratch:'Scratch ear',shake:'Shake head','body-groom':'Groom shoulder',roll:'Roll over','look-back':'Look back',
 'rear-leg-stretch':'Stretch hind leg','lie-down':'Lie down',pleading:'Hold hat',rub:'Rub cheek',
 'ledge-reach':'Reach down','arched-back':'Arch back','jump-panther-short':'Panther jump',cursor:'Touch the arrow',
};

// A fixed crop covers the whole trajectory. It never follows individual limbs
// and never shifts the cat's picture to pretend that it is walking.
export function fitPresenceClip(clip,width,height) {
 return fitCharacterClip(clip,width,height,{
  anchorX:width*(clip.anchorFraction??.5),
  baseline:clip.baselineFraction==null?undefined:height*clip.baselineFraction,
 });
}

export function conversationOwnsAttention({state='idle',voice=false,typing=false}={}) {
 return voice||typing||['listening','thinking','speaking'].includes(state);
}

export const presencePaused=({paused=false,hidden=false,reduced=false}={})=>paused||hidden||reduced;
export function patrolStep(rect,dx,width,obstacles=[]) {
 const left=Math.min(rect.left,rect.left+dx),right=Math.max(rect.right,rect.right+dx);
 return left>=12&&right<=width-12&&!obstacles.some(r=>
  left<r.right+10&&right>r.left-10&&rect.top<r.bottom+10&&rect.bottom>r.top-10);
}

export async function mountSitePresence({launch,dialog,pet,mediaUrl=MEDIA}={}) {
 if(!launch||!dialog||!pet||launch.dataset.osirisLife)return null;
 launch.dataset.osirisLife='loading';
 // The production dock can reuse the original pet even if metadata fails.
 launch.dataset.osirisPresence='fallback';
 const startup=new AbortController();
 const abortStartup=()=>startup.abort();
 const startupTimeout=setTimeout(abortStartup,15000);
 window.addEventListener('pagehide',abortStartup,{once:true});
 let catalog,clips;
 try{
  const response=await fetch(mediaUrl,{signal:startup.signal});
  if(!response.ok)throw Error('Osiris movement manifest unavailable');
  catalog=buildMovementCatalog(await response.json());
  // A mocked/cache response may finish after cancellation; never attach it.
  if(startup.signal.aborted||pet.isConnected===false)throw new DOMException('Osiris mount cancelled','AbortError');
  clips=new Map(catalog.clips.map(item=>[item.id,item.media]));
  if(!clips.has('blink'))throw Error('Osiris calm frame unavailable');
 }catch(error){
  delete launch.dataset.osirisLife;throw error;
 }finally{
  clearTimeout(startupTimeout);window.removeEventListener('pagehide',abortStartup);
 }
 const canvas=document.createElement('canvas'),poster=document.createElement('img'),walk=document.createElement('img');
 walk.className='osiris-life-walk';walk.alt='';walk.hidden=true;walk.style.opacity='0';
 walk.src=new URL('../media/osiris-motion/walk.webp',import.meta.url);
 canvas.className='osiris-life-canvas';canvas.setAttribute('aria-hidden','true');
 poster.className='osiris-life-poster';poster.alt='';poster.src=new URL(clips.get('blink').poster,mediaUrl);
 pet.append(poster,canvas,walk);
 let renderer;
 try{renderer=new AlphaSequence(canvas,{fit:fitPresenceClip});}catch(error){canvas.remove();poster.remove();walk.remove();delete launch.dataset.osirisLife;throw error;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let time=0,last=performance.now(),generation=0,load=null,loading=false,active=null,currentClip=clips.get('blink');
 let paused=false,voice=false,dead=false,blocked=false,ready=false,held=false;
 let lastPlay='',restUntil=0,frame=0,offset=0,direction=-1,hover=false,walking=false;
 let walkReady=walk.complete&&walk.naturalWidth>0;
 let obstacleCacheAt=-Infinity,obstacleCache=[];
 let anchorFraction=.5,baselineFraction;
 const events=[],listen=(el,type,fn,opts)=>{el.addEventListener(type,fn,opts);events.push(()=>el.removeEventListener(type,fn,opts));};
 const brain=createCatBrain({
  now:()=>time,...behaviorPools(catalog),
  durations:Object.fromEntries([...clips].map(([id,c])=>[id,c.duration*1000+500])),
  restDurationRangeMs:[3500,5200],initialPlayDelayMs:1500,playCooldownMs:7000,samePlayCooldownMs:35000,
  dailyCooldownMs:4000,sameDailyCooldownMs:30000,reducedMotion:reduced.matches,
  motionPoses:MOTION_POSES,initialPose:MOTION_POSES.blink.start,poseSelection:'prefer',
 });
 const pause=document.createElement('button');
 pause.type='button';pause.className='osiris-life-pause';pause.textContent='Ⅱ';
 const panel=document.createElement('div');panel.className='osiris-life-options';
 const label=document.createElement('label'),select=document.createElement('select');
 const caption=document.createElement('span');label.append(caption,select);
 const play=document.createElement('button'),rest=document.createElement('button');
 play.type=rest.type='button';panel.append(label,play,rest,pause);
 dialog.querySelector('.fjord-ai-about')?.append(panel);
 const lang=()=>document.documentElement.lang.split('-')[0];
 function translate(){
  const copy=COPY[lang()]||COPY.en;
  pause.setAttribute('aria-label',copy[paused?1:0]);pause.title=copy[paused?1:0];
  pause.setAttribute('aria-pressed',String(paused));pause.textContent=copy[paused?1:0];
  caption.textContent=copy[2];play.textContent=copy[4];rest.textContent=copy[5];
  const value=select.value;
  select.replaceChildren(new Option(copy[3],''));
  for(const item of catalog.clips)select.add(new Option(lang()==='ru'?item.title:ENGLISH[item.id]||item.title,item.id));
  select.value=value;
 }
 function position(){
  const {width,height}=pet.getBoundingClientRect();
  if(width<10||height<10)return;
  renderer.resize(width,height);
  Object.assign(canvas.style,{width:`${width}px`,height:`${height}px`,left:'0px',top:'0px'});
  const fit=fitPresenceClip(clips.get('blink'),width,height);
  for(const key of ['width','height','left','top'])poster.style[key]=`${fit[key]}px`;
  const walkingFit=fitPresenceClip({id:'walk',width:480,height:270,anchorFraction,baselineFraction},width,height);
  for(const key of ['width','height','left','top'])walk.style[key]=`${walkingFit[key]}px`;
 }
 function fallback(){
  canvas.style.opacity='0';poster.style.opacity='1';ready=false;
 }
 function hideWalk({immediate=false}={}){
  walking=false;walk.style.opacity='0';
  if(immediate)walk.hidden=true;
 }
 function holdLastFrame(){
  canvas.style.opacity=ready?'1':'0';poster.style.opacity=ready?'0':'1';
 }
 function beginWalk(){
  if(!walkReady||blocked||dead||active?.mode!=='rest'||active.phase==='settle')return;
  walking=true;walk.hidden=false;walk.style.opacity='0';position();
  // Commit the transparent start before fading in a previously hidden image.
  walk.getBoundingClientRect();
  walk.style.opacity='1';canvas.style.opacity='0';poster.style.opacity='0';
  launch.dataset.osirisScene='walk';
 }
 function stop({preserveWalk=false}={}){
  generation++;load?.abort();loading=false;renderer.pause();brain.cancel(time);active=null;
  if(!preserveWalk){hideWalk({immediate:true});holdLastFrame();}
 }
 function attention(){
  const focused=document.activeElement;
  return conversationOwnsAttention({
   state:pet.dataset.state,voice,
   typing:dialog.contains(focused)&&/^(INPUT|TEXTAREA)$/.test(focused?.tagName||''),
  });
 }
 function sync(){
  obstacleCacheAt=-Infinity;
  const busy=attention(),next=presencePaused({paused,hidden:document.hidden,reduced:reduced.matches});
  if(next!==blocked){
   blocked=next;
   if(blocked)stop();
   else{brain.noteUserActivity(time);last=performance.now();}
  }
  launch.dataset.osirisLife=paused?'paused':busy?'conversation':reduced.matches?'still':'ready';
  position();
 }
 async function show(decision){
  if(dead||blocked)return;
  if(decision.mode==='rest'){
   active=decision;renderer.pause();launch.dataset.osirisScene='rest';beginWalk();return;
  }
  const source=clips.get(decision.id),clip=source&&{...source,anchorFraction,baselineFraction};
  if(!clip){brain.finish(decision.token,time);return;}
  const token=++generation;load?.abort();load=new AbortController();renderer.pause();
  active=decision;loading=true;held=false;launch.dataset.osirisScene=clip.id;
  // Keep the actual outgoing frame during buffering, interruptions and rest.
  // The fallback portrait is only needed before the first decoded frame.
  if(!ready&&!walking){canvas.style.opacity='0';poster.style.opacity='1';}
  try{
   await renderer.load(new URL(clip.packed,mediaUrl).href,{signal:load.signal,clip});
   if(token!==generation||blocked||dead)return;
   currentClip=clip;position();ready=true;loading=false;
   hideWalk();
   canvas.style.opacity='1';poster.style.opacity='0';last=performance.now();
   let previous=0;
   await renderer.play(seconds=>{
    if(token!==generation||blocked||dead)return;
    time+=Math.max(0,seconds-previous)*1000;previous=seconds;
   });
  }catch(error){
   if(token!==generation||error.name==='AbortError')return;
   loading=false;brain.finish(decision.token,time);active=null;hideWalk();holdLastFrame();if(!ready)fallback();
   // A failed download must not enter a tight retry loop.
   restUntil=time+30000;launch.dataset.osirisLife='fallback';
  }
 }
 function command(id){
  if(!clips.has(id)||document.hidden||reduced.matches)return;
  paused=false;translate();sync();stop({preserveWalk:true});restUntil=0;
  brain.queueReaction({kind:'command',id},time);
  const decision=brain.next(time);if(decision)void show(decision);
 }
 function setPaused(value){paused=value;translate();sync();}
 listen(pause,'click',()=>setPaused(!paused));
 listen(play,'click',()=>{
  const choices=catalog.clips.filter(item=>item.group==='play'&&item.id!==lastPlay);
  const choice=choices[Math.floor(Math.random()*choices.length)];
  if(choice){lastPlay=choice.id;command(choice.id);}
 });
 listen(rest,'click',()=>{stop();restUntil=time+45000;launch.dataset.osirisScene='rest';});
 listen(select,'change',()=>{command(select.value);select.value='';});
 listen(walk,'load',()=>{walkReady=true;if(!loading)beginWalk();});
 listen(walk,'error',()=>{walkReady=false;hideWalk({immediate:true});holdLastFrame();});
 listen(renderer.video,'ended',()=>{
  if(loading||!active||active.mode==='rest'||!renderer.video.ended)return;
  brain.finish(active.token,time,{completed:true});
  const {width,height}=pet.getBoundingClientRect();
  const fit=fitPresenceClip(currentClip,width,height);
  if(fit.endGround){anchorFraction=fit.endGround.x/width;baselineFraction=fit.endGround.y/height;}
  active=null;held=true;renderer.pause();
 });
 listen(pet,'pointerenter',()=>{hover=true;if(!blocked)brain.queueReaction({kind:'hover',targetId:'osiris'},time);});
 listen(pet,'pointerleave',()=>{hover=false;brain.cancelAttention('osiris',time);});
 listen(window,'resize',()=>{offset=0;obstacleCacheAt=-Infinity;launch.style.removeProperty('--osiris-roam-x');position();});
 listen(window,'scroll',()=>{obstacleCacheAt=-Infinity;},true);
 listen(launch,'focus',()=>{if(!blocked)brain.queueReaction({kind:'focus',targetId:'osiris'},time);});
 listen(launch,'blur',()=>brain.cancelAttention('osiris',time));
 listen(dialog,'focusin',sync);listen(dialog,'focusout',()=>queueMicrotask(sync));
 listen(window,'fjord:voice-activity',event=>{voice=event.detail?.active===true;sync();});
 listen(document,'visibilitychange',sync);listen(reduced,'change',()=>{brain.setReducedMotion(reduced.matches,time);sync();});
 listen(window,'fjordlanguagechange',translate);
 listen(document,'keydown',event=>{if(event.key==='Escape')setPaused(true);});
 const observer=new MutationObserver(sync);
 observer.observe(pet,{attributes:true,attributeFilter:['data-state']});
 observer.observe(dialog,{attributes:true,attributeFilter:['open','class']});
 const resize=new ResizeObserver(position);resize.observe(pet);
 function patrolObstacles(now){
  if(now-obstacleCacheAt<200)return obstacleCache;
  obstacleCacheAt=now;obstacleCache=[];
  for(const node of document.querySelectorAll('a[href],button,input,select,textarea,summary,[data-osiris-no-roam]')){
   if(node===launch||node===pause||launch.contains(node)||node.closest('dialog:not([open]),[hidden]'))continue;
   for(const r of node.getClientRects())if(r.width&&r.height)obstacleCache.push(r);
  }
  return obstacleCache;
 }
 function tick(now){
  if(dead)return;
  const delta=Math.min(250,Math.max(0,now-last));last=now;
  if(!blocked&&!loading&&(!active||active.mode==='rest'))time+=delta;
  if(!blocked&&!loading&&time>=restUntil){
   const decision=brain.next(time);
   if(decision&&decision.token!==active?.token)void show(decision);
  }
  if(!blocked&&walking&&!hover&&!launch.hidden&&!launch.matches(':focus-visible')){
   const rect=launch.getBoundingClientRect(),obstacles=patrolObstacles(now);
   let dx=direction*38*delta/1000;
   if(!patrolStep(rect,dx,innerWidth,obstacles)){
    if(patrolStep(rect,-dx,innerWidth,obstacles)){direction*=-1;dx=-dx;}
    else dx=0;
   }
   if(dx){
    offset+=dx;launch.style.setProperty('--osiris-roam-x',`${offset.toFixed(2)}px`);
   }
   walk.style.scale=direction<0?'-1 1':'1 1';
  }
  frame=requestAnimationFrame(tick);
 }
 function destroy(){
  dead=true;stop();cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();
  events.forEach(off=>off());renderer.destroy();canvas.remove();poster.remove();walk.remove();pause.remove();panel.remove();launch.style.removeProperty('--osiris-roam-x');
  pet.classList.remove('osiris-life-pet');delete launch.dataset.osirisLife;
 }
 listen(window,'pagehide',event=>{if(!event.persisted)destroy();});
 pet.classList.add('osiris-life-pet');
 launch.dataset.osirisMotion='life-v1';launch.dataset.osirisPresence='ready';
 translate();position();sync();frame=requestAnimationFrame(tick);
 // Same pet node is subsequently moved by the existing production chat dock.
 return {command,setPaused,destroy,snapshot:()=>({paused,blocked,loading,ready,held,walking,offset,scene:launch.dataset.osirisScene,brain:brain.snapshot(time)})};
}

function attach(){
 const launch=document.querySelector('.fjord-helper-launch.osiris-launch'),dialog=document.getElementById('fjordHelper');
 const pet=launch?.querySelector('.fjord-ai-pet');
 if(!launch||!dialog?.querySelector('.fjord-ai-about')||!pet)return false;
 if(launch.dataset.osirisLife)return true;
 mountSitePresence({launch,dialog,pet}).catch(()=>{delete launch.dataset.osirisLife;});
 return true;
}
if(typeof document!=='undefined'){
 const start=()=>{
  if(attach())return;
  const waiting=new MutationObserver(()=>{if(attach())waiting.disconnect();});
  waiting.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>waiting.disconnect(),{once:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
