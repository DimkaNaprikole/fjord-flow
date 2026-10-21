/** Continuous autonomous floor life AFTER the accepted surface route.
 * One core/phase/clock; the adapter frame owns world XZ, never another cat.
 * Deterministic bags, bounded routes and conservative kinematic jumps.
 * This does not provide force, adhesion, obstacle collision or naturalness.
 */
import {createSurfaceLife} from './integrated-surface-life.mjs';
import {createSpatialLocomotion} from './spatial-locomotion.mjs';
import {createRigPlay} from './rig-play.mjs';
import {spatialPose} from './spatial-locomotion.mjs';
import {createSceneToyZone} from './scene-toy-zone.mjs';
import {isRestMotionSettled} from './rig-kinematics.mjs';
const ids=['RF','LF','RH','LH'];
const copy=x=>structuredClone(x);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const xzDistance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function gap(a,b){let n=0;for(const id of ids)for(const [name,p] of Object.entries(a.joints[id]))n=Math.max(n,distance(p,b.joints[id][name]));for(const key of ['centre','chest','pelvis','head','neck','nose','tailRoot'])n=Math.max(n,distance(a.body[key],b.body[key]));for(let i=0;i<a.joints.tail.length;i++)n=Math.max(n,distance(a.joints.tail[i],b.joints.tail[i]));return n;}

export function createSurfaceRoamLife({unit=1,wallX=0,floorY=0,seed=173,toyView={},getToyView=null,surface=createSurfaceLife({unit,wallX,floorY})}={}){
 if(!Number.isFinite(unit)||unit<=0||!Number.isFinite(wallX)||!Number.isFinite(floorY)||!Number.isInteger(seed)||seed<0||surface.rig.unit!==unit)throw new RangeError('Invalid roam configuration');
 const original=surface.rig,bounds={minX:wallX+2.1*unit,maxX:wallX+4.9*unit,minZ:-1.8*unit,maxZ:1.8*unit};
 if(getToyView!==null&&typeof getToyView!=='function')throw new TypeError('getToyView must be a function');
 const defaultToyView={position:{x:wallX+11*unit,y:floorY+5*unit,z:11*unit},lookAt:{x:wallX+.6*unit,y:floorY+1.2*unit,z:0},near:.05*unit,far:80*unit,...toyView};
 createSceneToyZone(defaultToyView); // Reject invalid static configuration now.
 const toyPreflight={accepted:0,deferred:0,last:null};
 let rng=seed>>>0||1;const random=()=>{rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return (rng>>>0)/4294967296;};
 const shuffle=values=>{const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
 const targets=[{id:'A',x:wallX+2.45*unit,z:-.9*unit},{id:'B',x:wallX+4.5*unit,z:-.8*unit},{id:'C',x:wallX+4.45*unit,z:.95*unit},{id:'D',x:wallX+2.5*unit,z:unit},{id:'E',x:wallX+3.45*unit,z:0}];
 let actor=null,paused=true,started=false,error=null,phase='surface-route',elapsed=0,clock=0,target=null,actionBag=[],goalBag=[],lastGoal=null,lastAction=null,lastPlayLimb='LF',jumpStarted=false;
 let sinceJump=0,lastJump=-Infinity,lastPlay=-Infinity,distanceSincePlay=0,lastRoot=null,legacyToy=null,completedToyId=null,restDuration=0,interaction=null;
 const phases=[],actions=[],handoffs=[],touchEvents=[],touchIds=new Set(),handoffIds=new Set();let surfaceHistory=[];
 const inside=p=>p.x>=bounds.minX-1e-7*unit&&p.x<=bounds.maxX+1e-7*unit&&p.z>=bounds.minZ-1e-7*unit&&p.z<=bounds.maxZ+1e-7*unit;
 function transition(next){phase=next;elapsed=0;phases.push(next);if(phases.length>80)phases.shift();}
 function observe(s){for(const event of s.play?.events??[])if(!touchIds.has(event.id)){touchIds.add(event.id);touchEvents.push(copy(event));lastPlayLimb=event.limb;completedToyId=event.id;}if(touchEvents.length>128)touchEvents.shift();if(touchIds.size>256)touchIds.delete(touchIds.values().next().value);
  if(s.mode==='jump')lastJump=clock;
  for(const h of s.locomotion?.handoffs??[]){const key=`${h.action}:${h.time}`;if(!handoffIds.has(key)){handoffIds.add(key);handoffs.push(copy(h));if(handoffs.length>64)handoffs.shift();if(handoffIds.size>256)handoffIds.delete(handoffIds.values().next().value);}}
 }
 function current(){return actor?actor.snapshot():surface.snapshot();}
 function snapshot(){const s=copy(current()),base=s.surfaceLife??{};
  if(actor){s.toys=(s.toys??[]).map(ball=>({...ball,id:completedToyId}));if(legacyToy)s.toys.unshift({...legacyToy.ball,id:legacyToy.id,opacity:Math.max(0,1-Math.max(0,legacyToy.age-2)/2)});}
  s.surfaceLife={...base,phase:actor?phase:base.phase,history:actor?[...surfaceHistory,...phases]:base.history,handoffs:actor?copy(handoffs):base.handoffs,paused,error:copy(error??base.error??null),clock,interactionActive:!!interaction,roam:{active:!!actor,bounds:{...bounds},target:target?{...target}:null,actions:copy(actions),touchEvents:copy(touchEvents),lastPlayLimb,toyPreflight:copy(toyPreflight)}};return s;
 }
 function fail(e){error={message:e.message,code:e.code??'roam',diagnostics:copy(e.diagnostics??null)};paused=true;transition('roam-rejected');}
 function takeGoal(root){for(let tries=0;tries<20;tries++){if(!goalBag.length)goalBag=shuffle(targets);const next=goalBag.shift();if(next.id!==lastGoal&&xzDistance(next,root)>.7*unit){lastGoal=next.id;return next;}}throw new Error('No distinct reachable floor target');}
 function startRoute(s){target=takeGoal(s.root);const heading=Math.atan2(target.z-s.root.z,target.x-s.root.x),delta=Math.atan2(Math.sin(heading-s.locomotion.heading),Math.cos(heading-s.locomotion.heading));actor.turnBy(delta);transition('roam-turn');}
 function canJump(s){const end={x:s.root.x+s.body.forward.x*.55*unit,z:s.root.z+s.body.forward.z*.55*unit};return clock-lastJump>=22&&sinceJump>=3&&inside(end);}
 function jumpPreflight(){const trial=Object.assign(Object.create(Object.getPrototypeOf(original)),copy(original));trial.jump({distance:.55*unit,height:.3*unit,duration:1.4});for(let i=0;i<336;i++){const s=trial.step(1/240,{mode:'idle',speed:0});if(s.issues.length)throw Object.assign(new Error('Low jump preflight is unreachable'),{code:'jump-preflight',diagnostics:{progress:i/336,issues:s.issues}});}}
 function canPlay(s,limb){return isRestMotionSettled(s)&&lastAction!=='play-LF'&&lastAction!=='play-RF'&&limb!==lastPlayLimb&&distanceSincePlay>=1.2*unit&&clock-lastPlay>=7&&s.root.x+s.body.forward.x*2.8*unit>=wallX+.2*unit;}
 function safePlay(s,limb){
  // A live getter makes each new game's preflight use the actual resized view.
  // Read and validate it before even planning a pose, never after acceptance.
  const live=getToyView?getToyView():{};
  if(!live||typeof live!=='object')throw new TypeError('getToyView must return view options');
  const view={...defaultToyView,...live},toyZone=createSceneToyZone(view);
  // The original reach/stance gate runs unchanged on a clone, before any real
  // command. The ball follows one monotone, constant-height segment in RigPlay.
  const trial=Object.assign(Object.create(Object.getPrototypeOf(original)),copy(original)),play=createRigPlay(trial,{limb});
  const frame={heading:s.locomotion.heading,pivotX:original.root.x,position:{x:s.root.x,z:s.root.z}};
  const start=spatialPose(play.snapshot(),frame,unit).play.ball,end=spatialPose(play.step(3.8),frame,unit).play.ball;
  // Yarn's outermost torus is (.994+.025)*ball radius, for every rotation.
  const result=toyZone.inspectSegment(start,end,start.radius*1.019001);
  toyPreflight[result.accepted?'accepted':'deferred']++;toyPreflight.last={...result,limb,clock,view:copy(view)};return result.accepted;
 }
 function choose(s){let next=null;for(let tries=0;tries<20;tries++){
   if(!actionBag.length)actionBag=shuffle(['route','rest','play-LF','play-RF','jump']);const candidate=actionBag.shift();
   if(candidate===lastAction)continue;if(candidate==='jump'&&!canJump(s))continue;if(candidate.startsWith('play-')&&(!canPlay(s,candidate.slice(5))||!safePlay(s,candidate.slice(5))))continue;next=candidate;break;
  }
  next??=lastAction==='route'?'rest':'route';
  actions.push({action:next,time:s.time,clock,root:{...s.root}});if(actions.length>80)actions.shift();lastAction=next;sinceJump++;
  if(next==='route'){startRoute(s);actions.at(-1).targetId=target.id;}
  else if(next==='rest'){actor.rest();restDuration=1.2+random();transition('roam-rest');}
  else if(next==='jump'){jumpPreflight();actor.jump({distance:.55*unit,height:.3*unit,duration:1.4});sinceJump=0;lastJump=clock;jumpStarted=false;transition('roam-jump');}
  else{actor.playWithBall({limb:next.slice(5)});lastPlay=clock;distanceSincePlay=0;transition('roam-play');}
 }
 function attach(s){
  const next=createSpatialLocomotion({unit,rig:original,position:{x:s.root.x,z:s.root.z},heading:Math.atan2(s.body.forward.z,s.body.forward.x)}),after=next.snapshot(),maxJointGap=gap(s,after);
  if(maxJointGap>1e-6*unit||after.time!==s.time||after.phase!==s.phase||next.rig!==original)throw Object.assign(new Error('Surface to roam handoff mismatch'),{code:'handoff',diagnostics:{maxJointGap}});
  if(!inside(after.root))throw Object.assign(new Error('Surface endpoint is outside floor roam bounds'),{code:'bounds',diagnostics:{root:after.root,bounds}});
  surfaceHistory=[...s.surfaceLife.history];handoffs.push(...copy(s.surfaceLife.handoffs),{action:'surface-roam',time:s.time,phase:s.phase,maxJointGap,sameRig:true});
  if(s.toys?.[0])legacyToy={ball:{...s.toys[0]},age:0,id:completedToyId};actor=next;lastRoot={...after.root};lastPlay=clock;distanceSincePlay=0;transition('roam-settle');
 }
 function step(dt){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');if(paused||dt===0)return snapshot();let remaining=dt;
  while(remaining>1e-10){const h=Math.min(remaining,1/120);remaining-=h;clock+=h;elapsed+=h;
   try{
    if(!actor){const s=surface.step(h);observe(s);if(s.surfaceLife.error)throw Object.assign(new Error(s.surfaceLife.error.message),s.surfaceLife.error);if(surface.done)attach(s);continue;}
    if(legacyToy){legacyToy.age+=h;if(legacyToy.age>=4)legacyToy=null;}
    const s=actor.step(h);observe(s);if(s.locomotion.error||s.issues.length)throw Object.assign(new Error(s.locomotion.error??'Unreachable roam pose'),{diagnostics:s.issues});
    if(!inside(s.root))throw Object.assign(new Error('Floor route exceeded its root bounds'),{code:'bounds',diagnostics:{root:s.root,bounds}});
    distanceSincePlay+=xzDistance(s.root,lastRoot);lastRoot={...s.root};
    if(phase==='roam-turn'&&!s.locomotion.turnActive&&s.locomotion.preparing!=='turn'){actor.walk(.45*unit);transition('roam-walk');}
    else if(phase==='roam-walk'&&xzDistance(s.root,target)<=original.velocity**2/(2*original.acceleration)+.02*unit){actor.rest();transition('roam-settle');}
    // Decide only after rest motion settles: do not discard a play choice
    // merely because its clone preflight would freeze a still-moving torso.
    else if(phase==='roam-settle'&&original.velocity===0&&Object.values(s.contacts).every(Boolean)&&isRestMotionSettled(s,{minBlend:.88})){choose(s);}
    else if(phase==='roam-rest'&&elapsed>=restDuration)transition('roam-settle');
    else if(phase==='roam-play'&&!s.locomotion.playActive&&!s.locomotion.preparing)transition('roam-settle');
    else if(phase==='roam-jump'){if(s.mode==='jump')jumpStarted=true;if(jumpStarted&&!original.jumpState&&!s.locomotion.preparing)transition('roam-settle');}
   }catch(e){fail(e);break;}
  }return snapshot();
 }
 function canBeginInteraction(){
  if(error||paused||interaction||!actor||!['roam-settle','roam-rest'].includes(phase))return false;
  const s=actor.snapshot();return original.velocity===0&&Object.values(s.contacts).every(Boolean)&&isRestMotionSettled(s)&&!s.locomotion.turnActive&&!s.locomotion.playActive&&!s.locomotion.preparing;
 }
 function beginInteraction(){
  if(!canBeginInteraction())return null;
  const source=snapshot();interaction={startTime:original.time};paused=true;return source;
 }
 function resumeAfterInteraction(source,{cancelled=false,action='button'}={}){
  if(!interaction)throw new Error('No external interaction owns this actor');
  const native=original.snapshot();
  if(!source?.spatial||!inside(source.root)||native.issues.length||original.basisMode!=='walk'||original.jumpState||original.velocity!==0||!Object.values(native.contacts).every(Boolean)||!isRestMotionSettled(native))throw new Error('Interaction must end in a settled reachable floor stance inside the route');
  const next=createSpatialLocomotion({unit,rig:original,position:{x:source.root.x,z:source.root.z},heading:Math.atan2(source.body.forward.z,source.body.forward.x)}),after=next.snapshot(),maxJointGap=gap(source,after);
  if(maxJointGap>1e-6*unit||after.time!==source.time||after.phase!==source.phase)throw Object.assign(new Error('Interaction return changes the actor pose'),{diagnostics:{maxJointGap}});
  const delta=original.time-interaction.startTime;if(delta<0)throw new Error('Interaction time moved backwards');
  clock+=delta;if(legacyToy){legacyToy.age+=delta;if(legacyToy.age>=4)legacyToy=null;}
  actor=next;lastRoot={...after.root};target=null;interaction=null;paused=false;
  handoffs.push({action:'interaction-return',time:after.time,phase:after.phase,maxJointGap,sameRig:true});if(handoffs.length>64)handoffs.shift();
  actions.push({action:cancelled?'interaction-cancel':action,time:after.time,clock,root:{...after.root}});if(actions.length>80)actions.shift();lastAction=cancelled?'interaction-cancel':action;
  actor.rest();restDuration=1.4;transition('roam-rest');return snapshot();
 }
 return {step,snapshot,canBeginInteraction,beginInteraction,resumeAfterInteraction,start(){if(error||interaction)return;if(!started){surface.start();started=true;}paused=false;},resume(){if(!error&&!interaction){if(!started){surface.start();started=true;}paused=false;}},hold(){paused=true;},get rig(){return original;}};
}
