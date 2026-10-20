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
 const canvas=document.createElement('canvas'),poster=document.createElement('img');
 canvas.className='osiris-life-canvas';canvas.setAttribute('aria-hidden','true');
 poster.className='osiris-life-poster';poster.alt='';poster.src=new URL(clips.get('blink').poster,mediaUrl);
 pet.append(poster,canvas);
 let renderer;
 try{renderer=new AlphaSequence(canvas,{fit:fitPresenceClip});}catch(error){canvas.remove();poster.remove();delete launch.dataset.osirisLife;throw error;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let time=0,last=performance.now(),generation=0,load=null,loading=false,active=null,currentClip=clips.get('blink');
 let paused=false,voice=false,dead=false,blocked=false,ready=false,held=false;
 let lastPlay='',restUntil=0,frame=0;
 let anchorFraction=.5,baselineFraction;
 const events=[],listen=(el,type,fn,opts)=>{el.addEventListener(type,fn,opts);events.push(()=>el.removeEventListener(type,fn,opts));};
 const brain=createCatBrain({
  now:()=>time,...behaviorPools(catalog),
  durations:Object.fromEntries([...clips].map(([id,c])=>[id,c.duration*1000+500])),
  restDurationRangeMs:[6000,14000],initialPlayDelayMs:10000,playCooldownMs:26000,samePlayCooldownMs:100000,
  dailyCooldownMs:24000,sameDailyCooldownMs:90000,reducedMotion:reduced.matches,
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
 }
 function fallback(){
  canvas.style.opacity='0';poster.style.opacity='1';ready=false;
 }
 function stop(){
  generation++;load?.abort();loading=false;renderer.pause();brain.cancel(time);active=null;
 }
 function attention(){
  const focused=document.activeElement;
  return conversationOwnsAttention({
   state:pet.dataset.state,voice,
   typing:dialog.contains(focused)&&/^(INPUT|TEXTAREA)$/.test(focused?.tagName||''),
  });
 }
 function sync(){
  const busy=attention(),next=paused||document.hidden||reduced.matches||busy;
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
   active=decision;renderer.pause();launch.dataset.osirisScene='rest';return;
  }
  const source=clips.get(decision.id),clip=source&&{...source,anchorFraction,baselineFraction};
  if(!clip){brain.finish(decision.token,time);return;}
  const token=++generation;load?.abort();load=new AbortController();renderer.pause();
  active=decision;loading=true;held=false;launch.dataset.osirisScene=clip.id;
  // Keep the actual outgoing frame during buffering, interruptions and rest.
  // The fallback portrait is only needed before the first decoded frame.
  if(!ready){canvas.style.opacity='0';poster.style.opacity='1';}
  try{
   await renderer.load(new URL(clip.packed,mediaUrl).href,{signal:load.signal,clip});
   if(token!==generation||blocked||dead)return;
   currentClip=clip;position();ready=true;loading=false;
   canvas.style.opacity='1';poster.style.opacity='0';last=performance.now();
   let previous=0;
   await renderer.play(seconds=>{
    if(token!==generation||blocked||dead)return;
    time+=Math.max(0,seconds-previous)*1000;previous=seconds;
   });
  }catch(error){
   if(token!==generation||error.name==='AbortError')return;
   loading=false;brain.finish(decision.token,time);active=null;if(!ready)fallback();
   // A failed download must not enter a tight retry loop.
   restUntil=time+30000;launch.dataset.osirisLife='fallback';
  }
 }
 function command(id){
  if(!clips.has(id)||attention()||document.hidden||reduced.matches)return;
  paused=false;translate();sync();stop();restUntil=0;
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
 listen(renderer.video,'ended',()=>{
  if(loading||!active||!renderer.video.ended)return;
  brain.finish(active.token,time,{completed:true});
  const {width,height}=pet.getBoundingClientRect();
  const fit=fitPresenceClip(currentClip,width,height);
  if(fit.endGround){anchorFraction=fit.endGround.x/width;baselineFraction=fit.endGround.y/height;}
  active=null;held=true;renderer.pause();
 });
 listen(pet,'pointerenter',()=>{if(!blocked)brain.queueReaction({kind:'hover',targetId:'osiris'},time);});
 listen(pet,'pointerleave',()=>brain.cancelAttention('osiris',time));
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
 function tick(now){
  if(dead)return;
  const delta=Math.min(250,Math.max(0,now-last));last=now;
  if(!blocked&&!loading&&(!active||active.mode==='rest'))time+=delta;
  if(!blocked&&!loading&&time>=restUntil){
   const decision=brain.next(time);
   if(decision&&decision.token!==active?.token)void show(decision);
  }
  frame=requestAnimationFrame(tick);
 }
 function destroy(){
  dead=true;stop();cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();
  events.forEach(off=>off());renderer.destroy();canvas.remove();poster.remove();pause.remove();panel.remove();
  pet.classList.remove('osiris-life-pet');delete launch.dataset.osirisLife;
 }
 listen(window,'pagehide',event=>{if(!event.persisted)destroy();});
 pet.classList.add('osiris-life-pet');
 launch.dataset.osirisMotion='life-v1';launch.dataset.osirisPresence='ready';
 translate();position();sync();frame=requestAnimationFrame(tick);
 // Same pet node is subsequently moved by the existing production chat dock.
 return {command,setPaused,destroy,snapshot:()=>({paused,blocked,loading,ready,held,scene:launch.dataset.osirisScene,brain:brain.snapshot(time)})};
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
