import {AlphaSequence} from './alpha-sequence.mjs?v=20261020contact1';
import {createCatBrain} from './cat-brain.mjs?v=20261020continuity1';
import {buildMovementCatalog,behaviorPools} from './movement-catalog.mjs';
import {MOTION_POSES,CHARACTER_CALIBRATION} from './character-calibration.mjs';
import {clampCenter,planRoute,stepRoute} from './viewport-roaming.mjs';
import {gestureFit,contactPlans,PAW_CONTACT} from './button-choreography.mjs';

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
 return gestureFit(clip,width,height);
}

export function conversationOwnsAttention({state='idle',voice=false,typing=false}={}) {
 return voice||typing||['listening','thinking','speaking'].includes(state);
}

export const presencePaused=({paused=false,hidden=false,reduced=false,animations=true}={})=>paused||hidden||reduced||animations===false;
export function patrolStep(rect,dx,width,obstacles=[]) {
 const left=Math.min(rect.left,rect.left+dx),right=Math.max(rect.right,rect.right+dx);
 return left>=12&&right<=width-12&&!obstacles.some(r=>
  left<r.right+10&&right>r.left-10&&rect.top<r.bottom+10&&rect.bottom>r.top-10);
}

export async function mountSitePresence({launch,dialog,pet,mediaUrl=MEDIA,random=Math.random}={}) {
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
  for(const item of catalog.clips)for(const variant of item.variants)clips.set(variant.id,variant.media);
  if(!clips.has('blink'))throw Error('Osiris calm frame unavailable');
 }catch(error){
  delete launch.dataset.osirisLife;throw error;
 }finally{
  clearTimeout(startupTimeout);window.removeEventListener('pagehide',abortStartup);
 }
 const canvas=document.createElement('canvas'),poster=document.createElement('img'),walk=document.createElement('img'),hitbox=document.createElement('span');
 hitbox.className='osiris-life-hitbox';hitbox.setAttribute('aria-hidden','true');
 walk.className='osiris-life-walk';walk.alt='';walk.hidden=true;walk.style.opacity='0';
 walk.src=new URL('../media/osiris-motion/walk.webp',import.meta.url);
 canvas.className='osiris-life-canvas';canvas.setAttribute('aria-hidden','true');
 poster.className='osiris-life-poster';poster.alt='';poster.src=new URL(clips.get('blink').poster,mediaUrl);
 pet.append(poster,canvas,walk,hitbox);
 let renderer;
 try{renderer=new AlphaSequence(canvas,{fit:fitPresenceClip});}catch(error){canvas.remove();poster.remove();walk.remove();hitbox.remove();delete launch.dataset.osirisLife;throw error;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let time=0,last=performance.now(),generation=0,load=null,loading=false,active=null,currentClip=clips.get('blink');
 let paused=false,voice=false,dead=false,blocked=false,ready=false,held=false;
 let roamingEnabled=window.OsirisSettings?.preferences?.roaming!==false;
 let animationsEnabled=window.OsirisSettings?.preferences?.animations!==false;
 let lastPlay='',restUntil=0,frame=0,offset=0,offsetY=0,direction=-1,hover=false,walking=false;
 let travel=null,drag=null,nextRoamAt=8000,suppressClickUntil=0,suppressNextClick=false,lastRoamZone=-1,publicApi;
 let walkReady=walk.complete&&walk.naturalWidth>0;
 let obstacleCacheAt=-Infinity,obstacleCache=[];
 let anchorFraction=.5,baselineFraction;
 let interaction=null;
 const events=[],listen=(el,type,fn,opts)=>{el.addEventListener(type,fn,opts);events.push(()=>el.removeEventListener(type,fn,opts));};
 const brain=createCatBrain({
  now:()=>time,random,...behaviorPools(catalog),
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
  const isPaused=paused||!animationsEnabled;
  pause.setAttribute('aria-label',copy[isPaused?1:0]);pause.title=copy[isPaused?1:0];
  pause.setAttribute('aria-pressed',String(isPaused));pause.textContent=copy[isPaused?1:0];
  pause.disabled=play.disabled=select.disabled=!animationsEnabled;
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
  const walkingFit=fitPresenceClip(walkClip(),width,height);
  for(const key of ['width','height','left','top'])walk.style[key]=`${walkingFit[key]}px`;
  const box=visualRect();
  Object.assign(hitbox.style,{left:`${box.left-pet.getBoundingClientRect().left}px`,top:`${box.top-pet.getBoundingClientRect().top}px`,
   width:`${box.width}px`,height:`${box.height}px`});
  hitbox.hidden=docked();
 }
 const viewport=()=>({width:innerWidth,height:innerHeight});
 const hasViewport=()=>Number.isFinite(innerWidth)&&innerWidth>0&&Number.isFinite(innerHeight)&&innerHeight>0;
 const docked=()=>Boolean(dialog.open&&!dialog.classList.contains('osiris-compact')&&!dialog.classList.contains('fjord-ai-auth-pending')||!launch.contains(pet)||launch.hidden);
 const walkClip=()=>({id:'walk',width:480,height:270,anchorFraction,baselineFraction,mirrored:direction<0});
 function visualRect(source=walking?walkClip():ready?currentClip:clips.get('blink'),mirror=source.mirrored||source.id==='walk'&&direction<0){
  const stage=pet.getBoundingClientRect(),fit=fitPresenceClip(source,stage.width,stage.height);
  const entry=CHARACTER_CALIBRATION.clips[source.id],u=entry?.unionBounds||source.unionBounds||source.bounds||{left:0,top:0,right:1,bottom:1};
  const left=stage.left+fit.left+(mirror?1-u.right:u.left)*fit.width;
  const right=stage.left+fit.left+(mirror?1-u.left:u.right)*fit.width;
  const top=stage.top+fit.top+u.top*fit.height,bottom=stage.top+fit.top+u.bottom*fit.height;
  return {left,right,top,bottom,width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2};
 }
 function placeCenter(point,source,mirror){
  if(docked())return;
  const box=visualRect(source,mirror),clamped=clampCenter(point,box,viewport(),8);
  if(!clamped)return;
  offset+=clamped.x-box.x;offsetY+=clamped.y-box.y;
  launch.style.setProperty('--osiris-roam-x',`${offset.toFixed(2)}px`);
  launch.style.setProperty('--osiris-roam-y',`${offsetY.toFixed(2)}px`);
 }
 function clampViewport(){
  if(!docked()){const box=visualRect();placeCenter(box);}
 }
 function groundPoint(source,end=false){
  const stage=pet.getBoundingClientRect(),fit=fitPresenceClip(source,stage.width,stage.height);
  const ground=end?fit.endGround:fit.ground;
  return ground&&{x:stage.left+ground.x,y:stage.top+ground.y};
 }
 function shiftStage(origin){
  const stage=pet.getBoundingClientRect();
  offset+=origin.x-stage.left;offsetY+=origin.y-stage.top;
  launch.style.setProperty('--osiris-roam-x',`${offset.toFixed(2)}px`);
  launch.style.setProperty('--osiris-roam-y',`${offsetY.toFixed(2)}px`);
 }
 function alignGround(point,source){
  if(!point)return;
  const stage=pet.getBoundingClientRect(),fit=fitPresenceClip(source,stage.width,stage.height);
  if(fit.ground)shiftStage({x:point.x-fit.ground.x,y:point.y-fit.ground.y});
 }
 function cancelTravel(){
  if(!travel)return;
  const previous=travel;travel=null;previous.signal?.removeEventListener('abort',previous.abort);
  previous.resolve(false);nextRoamAt=time+6000;
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
 function beginWalk(point){
  if(!walkReady||blocked||dead||!travel||docked())return;
  const alreadyWalking=walking;
  walking=true;walk.hidden=false;walk.style.opacity='0';position();
  if(point)placeCenter(point,walkClip());
  // Commit the transparent start before fading in a previously hidden image.
  if(!alreadyWalking)walk.getBoundingClientRect();
  walk.style.opacity='1';canvas.style.opacity='0';poster.style.opacity='0';
  launch.dataset.osirisScene='walk';
 }
 function cancelInteraction(){
  const previous=interaction;if(!previous)return;
  interaction=null;previous.controller.abort();previous.detach?.();previous.resolve(false);
  delete launch.dataset.osirisInteraction;
 }
 function stop({preserveWalk=false,preserveInteraction=false}={}){
  if(!preserveInteraction)cancelInteraction();
  cancelTravel();
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
  const busy=attention(),next=presencePaused({paused,hidden:document.hidden,reduced:reduced.matches,animations:animationsEnabled});
  if(docked()&&(travel||drag||interaction)){endDrag(true);stop();nextRoamAt=time+5000;}
  if(next!==blocked){
   blocked=next;
   if(blocked){endDrag(true);stop();}
   else{brain.noteUserActivity(time);last=performance.now();}
  }
  launch.dataset.osirisLife=paused||!animationsEnabled?'paused':busy?'conversation':reduced.matches?'still':'ready';
  position();
 }
 async function show(decision){
  if(dead||blocked)return;
  if(decision.mode==='rest'){
   active=decision;renderer.pause();launch.dataset.osirisScene='rest';
   if(decision.phase!=='settle')maybeRoam();return;
  }
  const source=clips.get(decision.id),clip=source&&{...source,anchorFraction,baselineFraction,mirrored:direction<0};
  if(!clip){brain.finish(decision.token,time);return;}
  const incomingGround=walking?groundPoint(walkClip()):null;
  const token=++generation;load?.abort();load=new AbortController();renderer.pause();
  active=decision;loading=true;held=false;launch.dataset.osirisScene=clip.id;
  // Keep the actual outgoing frame during buffering, interruptions and rest.
  // The fallback portrait is only needed before the first decoded frame.
  if(!ready&&!walking){canvas.style.opacity='0';poster.style.opacity='1';}
  try{
   await renderer.load(new URL(clip.packed,mediaUrl).href,{signal:load.signal,clip});
   if(token!==generation||blocked||dead)return;
   // The outgoing canvas is not the outgoing picture when the native walk is
   // visible. Do not dissolve an old seated pose over the new action.
   if(incomingGround)await renderer.seek(0);
   if(token!==generation||blocked||dead)return;
   currentClip=clip;alignGround(incomingGround,clip);position();ready=true;loading=false;
   hideWalk();
   clampViewport();position();
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
  if(!animationsEnabled||!clips.has(id)||document.hidden||reduced.matches)return;
  paused=false;translate();sync();stop({preserveWalk:true});restUntil=0;
  brain.queueReaction({kind:'command',id},time);
  const decision=brain.next(time);if(decision)void show(decision);
 }
 function setPaused(value){paused=value;translate();sync();}
 function setPreferences(preferences={}){
  if(dead)return;
  if(preferences?.siteActions===false&&interaction)stop();
  if(typeof preferences?.roaming==='boolean')roamingEnabled=preferences.roaming;
  if(typeof preferences?.animations==='boolean')animationsEnabled=preferences.animations;
  if(!roamingEnabled&&travel?.reason==='ambient')finishTravel(false);
  translate();sync();
 }
 listen(pause,'click',()=>setPaused(!paused));
 listen(play,'click',()=>{
  const choices=catalog.clips.filter(item=>item.group==='play'&&item.id!==lastPlay);
  const choice=choices[Math.floor(Math.random()*choices.length)];
  if(choice){lastPlay=choice.id;command(choice.id);}
 });
 listen(rest,'click',()=>{stop();restUntil=time+45000;launch.dataset.osirisScene='rest';});
 listen(select,'change',()=>{command(select.value);select.value='';});
 listen(walk,'load',()=>{walkReady=true;});
 listen(walk,'error',()=>{walkReady=false;cancelTravel();hideWalk({immediate:true});holdLastFrame();});
 listen(renderer.video,'ended',()=>{
  if(interaction)return;
  if(loading||!active||active.mode==='rest'||!renderer.video.ended)return;
  brain.finish(active.token,time,{completed:true});
  const {width,height}=pet.getBoundingClientRect();
  const fit=fitPresenceClip(currentClip,width,height);
  if(fit.endGround){anchorFraction=currentClip.mirrored?1-fit.endGround.x/width:fit.endGround.x/width;baselineFraction=fit.endGround.y/height;}
  active=null;held=true;renderer.pause();
 });
 listen(pet,'pointerenter',()=>{hover=true;if(travel&&!travel.scene){hideWalk({immediate:true});holdLastFrame();}else if(!blocked&&!interaction)brain.queueReaction({kind:'hover',targetId:'osiris'},time);});
 listen(pet,'pointerleave',()=>{hover=false;brain.cancelAttention('osiris',time);});
 let lastViewportSize={width:innerWidth,height:innerHeight};
 listen(window,'resize',()=>{
  obstacleCacheAt=-Infinity;
  const changed=lastViewportSize.width!==innerWidth||lastViewportSize.height!==innerHeight;
  lastViewportSize={width:innerWidth,height:innerHeight};
  // Opening a Fjord Flow section emits resize to refresh its maps. It does
  // not resize the screen and must not cancel the gesture that opened it.
  if(changed){if(interaction)stop();else cancelTravel();hideWalk({immediate:true});holdLastFrame();}
  position();clampViewport();position();
 });
 listen(window,'scroll',()=>{obstacleCacheAt=-Infinity;},true);
 listen(launch,'focus',()=>{if(!blocked&&!travel)brain.queueReaction({kind:'focus',targetId:'osiris'},time);});
 listen(launch,'blur',()=>brain.cancelAttention('osiris',time));
 listen(dialog,'focusin',sync);listen(dialog,'focusout',()=>queueMicrotask(sync));
 listen(window,'fjord:voice-activity',event=>{voice=event.detail?.active===true;sync();});
 listen(document,'visibilitychange',sync);listen(reduced,'change',()=>{brain.setReducedMotion(reduced.matches,time);sync();});
 listen(window,'fjordlanguagechange',translate);
 listen(window,'osiris:settings-changed',event=>setPreferences(event.detail?.preferences));
 listen(document,'keydown',event=>{if(event.key==='Escape'){endDrag(true);setPaused(true);}});
 const observer=new MutationObserver(sync);
 observer.observe(pet,{attributes:true,attributeFilter:['data-state']});
 observer.observe(dialog,{attributes:true,attributeFilter:['open','class']});
 const resize=new ResizeObserver(()=>{position();clampViewport();});resize.observe(pet);
 const sameRect=(a,b)=>Boolean(a&&b&&['left','top','right','bottom'].every(k=>Math.abs(a[k]-b[k])<.5));
 function sceneObstacles(obstacles,scene){
  // For an explicit request the pet can walk over page controls. They are not
  // physical walls, and crossing them never clicks them: only onContact owns
  // the one requested action. Unprompted roaming still avoids every control.
  return scene?[]:obstacles;
 }
 const targetRect=target=>{
  if(!target||target.isConnected===false||target.disabled)return null;
  for(let node=target;node;node=node.parentElement){
   if(node.hidden||node.getAttribute?.('aria-hidden')==='true')return null;
   const style=window.getComputedStyle?.(node);
   if(style?.display==='none'||style?.visibility==='hidden')return null;
  }
  const rect=target.getBoundingClientRect?.();
  return rect?.width>0&&rect.height>0?rect:null;
 };
 function nextFrame(signal){
  return new Promise(resolve=>{
   if(signal.aborted){resolve(false);return;}
   const abort=()=>{cancelAnimationFrame(handle);resolve(false);};
   const handle=requestAnimationFrame(()=>{signal.removeEventListener('abort',abort);resolve(!signal.aborted);});
   signal.addEventListener('abort',abort,{once:true});
  });
 }
 async function interactionClip(scene,plan){
  const signal=scene.controller.signal,clip=plan.source,token=++generation;
  load?.abort();load=new AbortController();loading=true;renderer.pause();active=null;
  const abortLoad=()=>load?.abort();signal.addEventListener('abort',abortLoad,{once:true});
  try{
   await renderer.load(new URL(clip.packed,mediaUrl).href,{signal:load.signal,clip});
   if(interaction!==scene||signal.aborted||token!==generation)return false;
   if(walking)await renderer.seek(0);
   if(interaction!==scene||signal.aborted||token!==generation)return false;
   currentClip=clip;ready=true;loading=false;held=false;
   shiftStage(plan.origin);hideWalk();position();canvas.style.opacity='1';poster.style.opacity='0';
   launch.dataset.osirisScene='cursor-button';launch.dataset.osirisInteraction='reach';
   return await new Promise((resolve,reject)=>{
    const cleanup=()=>{renderer.video.removeEventListener('ended',ended);signal.removeEventListener('abort',aborted);};
    const aborted=()=>{cleanup();renderer.pause();resolve(false);};
    const ended=()=>{cleanup();held=true;renderer.pause();resolve(true);};
    renderer.video.addEventListener('ended',ended,{once:true});signal.addEventListener('abort',aborted,{once:true});
    renderer.play(seconds=>{
     if(interaction!==scene||signal.aborted||scene.contacted||seconds<PAW_CONTACT.time)return;
     // Layout can change while he approaches. Never claim a hit on a moved button.
     const rect=targetRect(scene.target),stage=pet.getBoundingClientRect(),fit=fitPresenceClip(clip,stage.width,stage.height);
     const paw={x:stage.left+fit.left+(clip.mirrored?1-PAW_CONTACT.x:PAW_CONTACT.x)*fit.width,
      y:stage.top+fit.top+PAW_CONTACT.y*fit.height};
     scene.contacted=true;
     const within=seconds<=PAW_CONTACT.end&&rect&&paw.x>=rect.left-3&&paw.x<=rect.right+3&&paw.y>=rect.top-3&&paw.y<=rect.bottom+3;
     let committed=false;
     try{committed=!!within&&scene.onContact()===true;}catch{}
     scene.committed=committed;
     launch.dataset.osirisInteraction=committed?'contact':'miss';
     if(committed){
      scene.target.classList?.add('osiris-paw-contact');
      setTimeout(()=>scene.target.classList?.remove('osiris-paw-contact'),420);
     }
     scene.resolve(committed);
    }).catch(error=>{cleanup();reject(error);});
   });
  }finally{signal.removeEventListener('abort',abortLoad);if(interaction===scene)loading=false;}
 }
 async function depart(scene){
  if(interaction!==scene||scene.controller.signal.aborted||blocked||docked())return;
  launch.dataset.osirisInteraction='depart';
  const here=visualRect(),view=viewport(),side=scene.plan.mirrored?1:-1;
  const goals=[{x:here.x+side*190,y:Math.min(view.height-here.height/2-16,here.y+100)},
   {x:view.width*.5,y:view.height*.72},{x:view.width*.2,y:view.height*.72},{x:view.width*.8,y:view.height*.72}];
  for(const goal of goals){
   if(interaction!==scene)return;
   if(Math.hypot(goal.x-here.x,goal.y-here.y)<70)continue;
   if(await moveTo(goal,{scene,signal:scene.controller.signal,reason:'command'}))break;
  }
  if(interaction!==scene)return;
  scene.detach?.();interaction=null;
  launch.dataset.osirisInteraction='relax';
  const id=random()<.55?'yarn':'sniff';
  brain.queueReaction({kind:'command',id},time);
  const decision=brain.next(time);if(decision)void show(decision);
  nextRoamAt=time+14000;restUntil=time+1800;
 }
 async function interactWith(target,{signal,onContact}={}){
  stop();
  const requestGeneration=generation;
  // Compact chat moves the same pet through a MutationObserver. Let that DOM
  // move settle before deciding whether the pet is still inside the full chat.
  await Promise.resolve();
  if(requestGeneration!==generation)return false;
  if(dead||blocked||docked()||drag||!hasViewport()||!walkReady||signal?.aborted||typeof onContact!=='function'||!clips.has('cursor-button')||!targetRect(target))return Promise.resolve(false);
  return new Promise(resolve=>{
   const scene={target,onContact,resolve,controller:new AbortController(),committed:false,contacted:false};
   interaction=scene;
   const abort=()=>{if(interaction===scene)stop();};
   signal?.addEventListener('abort',abort,{once:true});scene.detach=()=>signal?.removeEventListener('abort',abort);
   void (async()=>{
    let rect=targetRect(target);
    if(rect.top<130||rect.bottom>innerHeight-25||rect.left<0||rect.right>innerWidth){
     target.scrollIntoView?.({block:'center',inline:'nearest',behavior:'instant'});
     if(!await nextFrame(scene.controller.signal)||!await nextFrame(scene.controller.signal))return;
     rect=targetRect(target);
    }
    if(!rect)return;
    const stage=pet.getBoundingClientRect(),clip={...clips.get('cursor-button'),anchorFraction:.5};
    const plans=contactPlans({rect,stage,viewport:viewport(),position:visualRect(),clip,walk:walkClip()});
    launch.dataset.osirisInteraction='approach';scene.targetRect=rect;
    for(const plan of plans){
     if(interaction!==scene)return;
     scene.plan=plan;
     if(!await moveTo(plan.approach,{scene,signal:scene.controller.signal,reason:'command'}))continue;
     if(interaction!==scene)return;
     direction=plan.mirrored?-1:1;
     if(await interactionClip(scene,plan)&&scene.committed)await depart(scene);
     return;
    }
   })().catch(()=>{}).finally(()=>{
    if(interaction===scene){scene.detach();interaction=null;loading=false;hideWalk();holdLastFrame();delete launch.dataset.osirisInteraction;nextRoamAt=time+6000;}
    resolve(scene.committed);
   });
  });
 }
 function patrolObstacles(now){
  if(now-obstacleCacheAt<200)return obstacleCache;
  obstacleCacheAt=now;const nextObstacles=[];
  for(const node of document.querySelectorAll('a[href],button,input,select,textarea,summary,[data-osiris-no-roam]')){
   if(node===launch||node===pause||launch.contains(node)||node.closest('dialog:not([open]),[hidden]'))continue;
   for(const r of node.getClientRects())if(r.width&&r.height&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight)nextObstacles.push(r);
  }
  if(nextObstacles.length!==obstacleCache.length||nextObstacles.some((r,i)=>['left','right','top','bottom'].some(k=>r[k]!==obstacleCache[i][k])))obstacleCache=nextObstacles;
  return obstacleCache;
 }
 function moveTo(target,{reason='command',signal,scene=null}={}){
  if(dead||blocked||docked()||drag||!walkReady||!hasViewport()||signal?.aborted||!Number.isFinite(target?.x)||!Number.isFinite(target?.y)||(reason==='ambient'&&!roamingEnabled))return Promise.resolve(false);
  if(scene&&!walking){const here=groundPoint(currentClip,held)||visualRect();if(Math.abs(target.x-here.x)>1)direction=target.x<here.x?-1:1;}
  const startBox=visualRect(),walkBox=visualRect(walkClip()),footprint={width:walkBox.width,height:walkBox.height};
  if(scene&&ready&&!walking){
   const ground=groundPoint(currentClip,held),wg=groundPoint(walkClip());
   if(ground&&wg){startBox.x=ground.x+walkBox.x-wg.x;startBox.y=ground.y+walkBox.y-wg.y;}
  }
  const start=clampCenter(startBox,footprint,viewport(),8),goal=clampCenter(target,footprint,viewport(),8);
  if(!start||!goal)return Promise.resolve(false);
  const obstacles=sceneObstacles(patrolObstacles(performance.now()),scene);
  const path=planRoute({start,target:goal,footprint,viewport:viewport(),obstacles,clearance:8});
  if(!path)return Promise.resolve(false);
  stop({preserveInteraction:scene===interaction&&!!scene});restUntil=0;
  if(Math.hypot(goal.x-start.x,goal.y-start.y)<2)return Promise.resolve(true);
  return new Promise(resolve=>{
   const abort=()=>{cancelTravel();hideWalk({immediate:true});holdLastFrame();};
   travel={position:start,target:goal,remaining:path,footprint,obstacles,reason,resolve,signal,abort,scene};
   signal?.addEventListener('abort',abort,{once:true});
  });
 }
 function finishTravel(success){
  if(!travel)return;
  const previous=travel;travel=null;previous.signal?.removeEventListener('abort',previous.abort);
  if(!previous.scene){hideWalk();holdLastFrame();placeCenter(previous.position);position();}
  restUntil=time+1500;nextRoamAt=time+9000+random()*7000;
  brain.noteUserActivity(time);launch.dataset.osirisScene='rest';previous.resolve(success);
 }
 function maybeRoam(){
  if(interaction||!roamingEnabled||!hasViewport()||travel||drag||hover||docked()||!walkReady||time<nextRoamAt||launch.matches(':focus-visible'))return;
  nextRoamAt=time+6000+random()*8000;
  // Many pauses remain genuine rest. A walk is a route, never a treadmill loop.
  if(random()>.45)return;
  const view=viewport(),here=visualRect(),zones=[[.15,.18],[.5,.18],[.85,.18],[.15,.5],[.5,.5],[.85,.5],[.15,.82],[.5,.82],[.85,.82]];
  const first=Math.floor(random()*zones.length);
  for(let i=0;i<zones.length;i++){
   const index=(first+i)%zones.length;if(index===lastRoamZone)continue;
   const target={x:view.width*zones[index][0],y:view.height*zones[index][1]};
   if(Math.hypot(target.x-here.x,target.y-here.y)<100)continue;
   void moveTo(target,{reason:'ambient'});
   if(travel){lastRoamZone=index;break;}
  }
 }
 function advanceTravel(delta,now){
  if(!travel)return;
  if(blocked||drag||docked()||!hasViewport()){finishTravel(false);return;}
  if(!travel.scene&&(hover||launch.matches(':focus-visible'))){hideWalk({immediate:true});holdLastFrame();return;}
  const obstacles=sceneObstacles(patrolObstacles(now),travel.scene);
  if(obstacles.length!==travel.obstacles.length||obstacles.some((r,i)=>!sameRect(r,travel.obstacles[i]))){
   const path=planRoute({start:travel.position,target:travel.target,footprint:travel.footprint,viewport:viewport(),obstacles,clearance:8});
   if(!path){finishTravel(false);return;}
   travel.remaining=path;travel.obstacles=obstacles;
  }
  const step=stepRoute(travel.position,travel.remaining,85*Math.min(100,delta)/1000);
  if(!step){finishTravel(false);return;}
  const dx=step.position.x-travel.position.x;
  if(Math.abs(dx)>.01)direction=dx<0?-1:1;
  walk.style.scale=direction<0?'-1 1':'1 1';
  if(Math.hypot(step.position.x-travel.position.x,step.position.y-travel.position.y)>.001){
   beginWalk(travel.position);placeCenter(step.position,walkClip());position();
  }
  travel.position=step.position;travel.remaining=step.remaining;
  if(step.arrived)finishTravel(true);
 }
 function endDrag(cancelled=false){
  if(!drag)return;
  const previous=drag;drag=null;
  if(previous.active){
   suppressClickUntil=performance.now()+700;suppressNextClick=true;
   try{launch.releasePointerCapture(previous.id);}catch{}
   delete launch.dataset.osirisDragging;nextRoamAt=time+12000;restUntil=time+5000;brain.noteUserActivity(time);
   clampViewport();position();
  }
 }
 listen(launch,'pointerdown',event=>{
  if(dead||docked()||document.hidden||event.isPrimary===false||(event.button!=null&&event.button!==0))return;
  suppressNextClick=false;
  const box=visualRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,center:{x:box.x,y:box.y},active:false};
 });
 listen(window,'pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.active&&Math.hypot(dx,dy)<6)return;
  if(!drag.active){
   drag.active=true;stop();launch.dataset.osirisDragging='true';
   try{launch.setPointerCapture(drag.id);}catch{}
  }
  event.preventDefault();placeCenter({x:drag.center.x+dx,y:drag.center.y+dy});position();
 },{passive:false});
 listen(window,'pointerup',event=>{if(drag&&event.pointerId===drag.id)endDrag();});
 listen(window,'pointercancel',event=>{if(drag&&event.pointerId===drag.id)endDrag(true);});
 listen(launch,'lostpointercapture',()=>endDrag(true));
 listen(launch,'click',event=>{
  if(suppressNextClick&&performance.now()<suppressClickUntil&&event.detail!==0){suppressNextClick=false;event.preventDefault();event.stopImmediatePropagation();}
 },true);
 function tick(now){
  if(dead)return;
  const delta=Math.min(250,Math.max(0,now-last));last=now;
  if(!blocked&&!drag&&!loading&&(!active||active.mode==='rest'))time+=delta;
  if(!blocked&&!drag&&!travel&&!interaction&&!loading&&time>=restUntil){
   const decision=brain.next(time);
   if(decision&&decision.token!==active?.token)void show(decision);
  }
  advanceTravel(delta,now);
  frame=requestAnimationFrame(tick);
 }
 function destroy(){
  dead=true;endDrag(true);stop();cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();
  events.forEach(off=>off());renderer.destroy();canvas.remove();poster.remove();walk.remove();hitbox.remove();pause.remove();panel.remove();launch.style.removeProperty('--osiris-roam-x');launch.style.removeProperty('--osiris-roam-y');
  pet.classList.remove('osiris-life-pet');delete launch.dataset.osirisLife;
  if(window.OsirisPresence===publicApi)delete window.OsirisPresence;
 }
 listen(window,'pagehide',event=>{if(!event.persisted)destroy();else{endDrag(true);stop();}});
 pet.classList.add('osiris-life-pet');
 launch.dataset.osirisMotion='life-v1';launch.dataset.osirisPresence='ready';
 translate();position();sync();frame=requestAnimationFrame(tick);
 // Same pet node is subsequently moved by the existing production chat dock.
 publicApi={command,setPaused,setPreferences,moveTo,interactWith,cancelMove:()=>{
  const had=!!travel||!!interaction;stop();return had;
 },destroy,snapshot:()=>({paused,blocked,loading,ready,held,walking,roaming:roamingEnabled,animations:animationsEnabled,offset,offsetY,dragging:!!drag?.active,
  travelling:!!travel,interaction:launch.dataset.osirisInteraction||null,position:visualRect(),target:travel?{...travel.target}:null,scene:launch.dataset.osirisScene,brain:brain.snapshot(time)})};
 window.OsirisPresence=publicApi;
 window.dispatchEvent(new Event('osiris:presence-ready'));
 return publicApi;
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
