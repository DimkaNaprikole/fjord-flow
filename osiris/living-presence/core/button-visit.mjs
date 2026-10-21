/** Exclusive, isolated same-rig approach/press/withdraw controller. No UI input. */
import {createSpatialLocomotion,spatialPose} from './spatial-locomotion.mjs';
import {isRestMotionSettled,LIMBS} from './rig-kinematics.mjs';
import {createRigButtonPress} from './rig-button-press.mjs';
const copy=x=>structuredClone(x),clone=r=>Object.assign(Object.create(Object.getPrototypeOf(r)),copy(r));
function gap(a,b){let max=0;const check=(p,q)=>{if(!p||!q)return;max=Math.max(max,Math.hypot(p.x-q.x,p.y-q.y,(p.z??0)-(q.z??0)));};for(const id of LIMBS)for(const[key,p]of Object.entries(a.joints[id]))check(p,b.joints[id][key]);for(const key of ['centre','chest','pelvis','neck','head','nose','tailRoot'])check(a.body[key],b.body[key]);a.joints.tail.forEach((p,i)=>check(p,b.joints.tail[i]));return max;}
function validate(rig,{sourcePose,deltaHeading,walkDuration=1.4,jump=null,target,durationPress=2}){
 if(!rig?.snapshot||!sourcePose?.spatial||!Number.isFinite(sourcePose.locomotion?.heading)||!Number.isFinite(sourcePose.root?.x)||!Number.isFinite(sourcePose.root?.z))throw new TypeError('Current spatial source pose and same rig are required');
 if(rig.facing!==1||rig.basisMode!=='walk'||rig.jumpState||rig.velocity!==0||rig.targetSpeed!==0||LIMBS.some(id=>!rig.legs[id].contact||rig.legs[id].swing))throw new Error('Button visit requires a stopped canonical four-planted floor rig');
 if(!Number.isFinite(deltaHeading)||!Number.isFinite(walkDuration)||walkDuration<0||!Number.isFinite(durationPress)||durationPress<.6||durationPress>10)throw new RangeError('Invalid button visit timing/heading');
 if(target&&![target.x,target.y].every(Number.isFinite))throw new TypeError('Invalid fixed native target');
 if(jump!==null&&jump!==true&&(typeof jump!=='object'||!jump))throw new TypeError('jump must be null, true or jump parameters');
}
function build(rig,options,plannedWorld=null){
 const {sourcePose,deltaHeading,walkDuration=1.4,durationPress=2,target,jump=null}=options;validate(rig,options);
 const unit=rig.unit,actor=createSpatialLocomotion({rig,unit,position:{x:sourcePose.root.x,z:sourcePose.root.z},heading:sourcePose.locomotion.heading}),initial=actor.snapshot(),sourceGap=gap(sourcePose,initial);
 if(sourceGap>1e-6*unit||initial.time!==sourcePose.time||initial.phase!==sourcePose.phase)throw Object.assign(new Error('Button visit source world handoff mismatch'),{code:'button-handoff',diagnostics:{sourceGap}});
 let phase='attention',elapsed=0,clock=0,press=null,cancelled=false,done=false,error=null,jumpSeen=false,fixedTargetNative=target?copy(target):null,fixedTargetWorld=copy(plannedWorld),pressFrame=null,lastPress=null;
 const handoffs=[{action:'button-source',maxJointGap:sourceGap,time:rig.time}],events=[],eventIds=new Set();
 const jumpParams=jump?{distance:.55*unit,height:.3*unit,duration:1.4,...(jump===true?{}:jump)}:null;
 function transition(next){phase=next;elapsed=0;}
 function settled(s){return rig.velocity===0&&!rig.jumpState&&LIMBS.every(id=>s.contacts[id]&&!rig.legs[id].swing)&&isRestMotionSettled(s);}
 function worldPoint(p){const side=-.32*unit,c=Math.cos(pressFrame.heading),s=Math.sin(pressFrame.heading),dx=p.x-pressFrame.pivotX;return {x:pressFrame.position.x+c*dx-s*side,y:p.y,z:pressFrame.position.z+s*dx+c*side};}
 function spatialPress(){const s=spatialPose(press.snapshot(),pressFrame,unit);
  // Compatibility until the shared spatial adapter supplies these fields.
  // Already-world metadata is never mapped twice.
  if(s.buttonPress.target.z===undefined)for(const key of ['target','focus','touchPoint'])s.buttonPress[key]=worldPoint(s.buttonPress[key]);
  return s;
 }
 function observe(s){for(const e of s.buttonPress?.events??[])if(!eventIds.has(e.id)){eventIds.add(e.id);events.push({...copy(e),target:copy(fixedTargetWorld)});}}
 function snapshot(){const s=press?spatialPress():actor.snapshot();return {...s,buttonVisit:{phase,clock,elapsed,done,cancelled,error:copy(error),fixedTargetNative:copy(fixedTargetNative),fixedTargetWorld:copy(fixedTargetWorld),handoffs:copy(handoffs),events:copy(events),lastPress:copy(lastPress)}};}
 function finish(){done=true;transition(cancelled?'cancelled':'complete');}
 function beginPress(s){
  fixedTargetNative??={x:rig.legs.RF.paw.x+.36*unit,y:rig.root.y+.22*unit};
  pressFrame={heading:s.locomotion.heading,pivotX:rig.root.x,position:{x:s.root.x,z:s.root.z}};
  const actualWorld=worldPoint(fixedTargetNative);if(fixedTargetWorld&&Math.hypot(actualWorld.x-fixedTargetWorld.x,actualWorld.y-fixedTargetWorld.y,actualWorld.z-fixedTargetWorld.z)>1e-6*unit)throw new Error('Planned fixed button world target mismatch');
  fixedTargetWorld=actualWorld;press=createRigButtonPress(rig,{limb:'RF',target:fixedTargetNative,duration:durationPress});transition('press');
 }

 function step(dt){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid button visit dt');if(done||dt===0)return snapshot();let remaining=dt;
  while(remaining>1e-10&&!done){const h=Math.min(remaining,1/120);remaining-=h;clock+=h;elapsed+=h;
   try{
    if(press){press.step(h);const p=spatialPress();observe(p);lastPress=copy(p.buttonPress);if(press.done){const after=actor.snapshot(),maxJointGap=gap(p,after);if(maxJointGap>1e-6*unit)throw new Error('Button press return handoff mismatch');handoffs.push({action:'button-withdraw',time:rig.time,maxJointGap});press=null;finish();}continue;}
    const s=actor.step(h);if(phase==='attention'){if(elapsed>=.45-1e-10){actor.turnBy(deltaHeading);transition('turn');}continue;}if(s.locomotion.error||s.issues.length)throw Object.assign(new Error(s.locomotion.error??'Unreachable button visit pose'),{diagnostics:s.issues});
    if(phase==='turn'&&!s.locomotion.turnActive&&s.locomotion.preparing!=='turn'){
     if(cancelled){actor.rest();transition('cancel-settle');}else if(walkDuration===0){actor.rest();transition('settle');}else{actor.walk(.45*unit);transition('walk');}
    }else if(phase==='walk'&&elapsed>=walkDuration-1e-10){actor.rest();transition('settle');}
    else if((phase==='settle'||phase==='post-jump-settle'||phase==='cancel-settle')&&settled(s)){
     if(cancelled)finish();else if(phase==='settle'&&jumpParams){actor.jump(jumpParams);jumpSeen=false;transition('jump');}else beginPress(s);
    }else if(phase==='jump'){if(s.mode==='jump')jumpSeen=true;if(jumpSeen&&!rig.jumpState&&!s.locomotion.preparing){actor.rest();transition(cancelled?'cancel-settle':'post-jump-settle');}}
   }catch(e){error={message:e.message,code:e.code??'button-visit',diagnostics:copy(e.diagnostics??null)};done=true;transition('rejected');}
  }return snapshot();
 }
 function cancel(){if(done||cancelled)return snapshot();
  if(press){press.cancel();cancelled=true;const p=spatialPress();observe(p);lastPress=copy(p.buttonPress);if(press.done){handoffs.push({action:'button-cancel-withdraw',time:rig.time,maxJointGap:gap(p,actor.snapshot())});press=null;finish();}}
  else{cancelled=true;if(phase!=='turn'){actor.rest();if(phase!=='jump'||!rig.jumpState)transition('cancel-settle');}}
  return snapshot();
 }
 return {step,snapshot,cancel,get done(){return done;},get rig(){return rig;}};
}
export function planButtonVisit(rig,options){
 validate(rig,options);const trial=clone(rig),visit=build(trial,options),pathBounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,minZ:Infinity,maxZ:-Infinity},rootBounds={...pathBounds};let maxReachError=0,minContacts=4,frames=0;
 function inspect(p){for(const [bounds,points]of [[rootBounds,[p.root]],[pathBounds,[...LIMBS.flatMap(id=>Object.values(p.joints[id])),...p.joints.tail,...['centre','chest','pelvis','head','nose'].map(k=>p.body[k])]]])for(const point of points)for(const axis of ['X','Y','Z']){bounds[`min${axis}`]=Math.min(bounds[`min${axis}`],point[axis.toLowerCase()]);bounds[`max${axis}`]=Math.max(bounds[`max${axis}`],point[axis.toLowerCase()]);}maxReachError=Math.max(maxReachError,...Object.values(p.legs).map(l=>l.reachError));minContacts=Math.min(minContacts,Object.values(p.contacts).filter(Boolean).length);options.onPose?.(p);}
 inspect(visit.snapshot());const limit=Math.ceil(((options.walkDuration??1.4)+(options.durationPress??2)+(options.jump?.duration??1.4)+45)*120);
 while(!visit.done&&frames++<limit)inspect(visit.step(1/120));const end=visit.snapshot();
 if(!visit.done||end.buttonVisit.error)throw Object.assign(new Error(end.buttonVisit.error?.message??'Button visit plan timed out'),{code:end.buttonVisit.error?.code??'button-plan-timeout',diagnostics:end.buttonVisit.error?.diagnostics});
 return {fixedTargetNative:copy(end.buttonVisit.fixedTargetNative),fixedTargetWorld:copy(end.buttonVisit.fixedTargetWorld),path:{rootBounds:copy(rootBounds),posedBounds:copy(pathBounds)},stats:{frames,duration:end.buttonVisit.clock,maxReachError,minContacts,pathBounds,rootBounds,handoffs:copy(end.buttonVisit.handoffs)},endPose:end};
}
export function createButtonVisit(rig,options){const plan=planButtonVisit(rig,options),visit=build(rig,{...options,target:plan.fixedTargetNative},plan.fixedTargetWorld);return {...visit,plan,get done(){return visit.done;},get rig(){return rig;}};}
