/** Optional same-rig rest-cycle owner. Not the default until visual/skin QA.
 * Reuses the existing exclusive interaction handoff; no parallel rig stepping. */
import {createSurfaceRoamWalkGovernorLife} from './surface-roam-walk-governor-life.mjs';
import {createRigStretchRestCycleV2 as createRigStretchRestCycle} from './rig-stretch-rest-cycle-v2.mjs';
import {inspectStretchRestSpace} from './stretch-rest-action-space-v1.mjs';
import {spatialPose} from './spatial-locomotion.mjs';
export function createSurfaceStretchRestSpaceLife({life=null,interval=40,holdDuration=2,stretchHoldDuration=1,...routeOptions}={}){
 life??=createSurfaceRoamWalkGovernorLife(routeOptions);
 if(!Number.isFinite(interval)||interval<10)throw new RangeError('Rest-cycle interval must be at least 10 seconds');
 const spaceStats={accepted:0,deferred:0,last:null};let nextAttempt=-Infinity;
 let paused=true,cycle=null,source=null,frame=null,lastRest=-Infinity,count=0,error=null;
 function decorate(p){const base=life.snapshot().surfaceLife;return {...p,surfaceLife:{...base,paused,error:error??base.error,phase:cycle?`stretch-rest-${p.stretchRestCycle.phase}`:base.phase,restCycles:count,restCycleActive:!!cycle,restActionSpace:{...structuredClone(spaceStats),nextAttempt}}};}
 function pose(){if(!cycle)return decorate(life.snapshot());const p=spatialPose(cycle.snapshot(),frame,life.rig.unit),age=p.time-source.time;p.toys=(source.toys??[]).map(t=>({...t,opacity:(t.opacity??1)*Math.max(0,1-Math.max(0,age-2)/2)})).filter(t=>t.opacity>0);return decorate(p);}
 function step(dt){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');if(paused||error||dt===0)return pose();
  if(cycle){cycle.step(dt);if(cycle.done){const end=spatialPose(cycle.snapshot(),frame,life.rig.unit);life.resumeAfterInteraction(end,{action:'genuine-stretch-lie-rise'});cycle=null;count++;lastRest=life.rig.time;}return pose();}
  life.step(dt);const s=life.snapshot(),routes=s.surfaceLife.roam.actions.filter(a=>a.action==='route').length;
  if(routes>=1&&life.rig.time>=nextAttempt&&life.rig.time-lastRest>=interval&&life.canBeginInteraction()){
   // Preflight on clone belongs to the gesture factory. The actor is leased
   // only after successful creation, and no source timestep is consumed here.
   try{const trial=Object.assign(Object.create(Object.getPrototypeOf(life.rig)),structuredClone(life.rig));const trialCycle=createRigStretchRestCycle(trial,{stretchHoldDuration,restHoldDuration:holdDuration});
    const trialFrame={heading:s.locomotion.heading,pivotX:life.rig.root.x,position:{x:s.root.x,z:s.root.z}},u=life.rig.unit;
    const view={position:{x:(routeOptions.wallX??0)+11*u,y:(routeOptions.floorY??0)+5*u,z:11*u},lookAt:{x:(routeOptions.wallX??0)+.6*u,y:(routeOptions.floorY??0)+1.2*u,z:0},near:.05*u,far:80*u,...(routeOptions.toyView??{}),...(routeOptions.getToyView?.()??{})};
    const space=inspectStretchRestSpace(trialCycle,{frame:trialFrame,unit:u,view});spaceStats.last={...space,time:life.rig.time,root:{...s.root}};
    if(!space.accepted){spaceStats.deferred++;nextAttempt=life.rig.time+8;return pose();}spaceStats.accepted++;
    source=life.beginInteraction();if(!source)throw new Error('Rest cycle lost its settled ownership gate');frame={heading:source.locomotion.heading,pivotX:life.rig.root.x,position:{x:source.root.x,z:source.root.z}};cycle=createRigStretchRestCycle(life.rig,{stretchHoldDuration,restHoldDuration:holdDuration});}catch(e){error={message:e.message,code:'stretch-rest-cycle',diagnostics:e.diagnostics??null};paused=true;life.hold();}
  }return pose();
 }
 return {step,snapshot:pose,canBeginInteraction:()=>!cycle&&!error&&!paused&&life.canBeginInteraction(),beginInteraction:()=>!cycle&&!error?life.beginInteraction():null,resumeAfterInteraction:(...args)=>life.resumeAfterInteraction(...args),start(){paused=false;if(!cycle)life.start();},resume(){if(!error){paused=false;if(!cycle)life.resume();}},hold(){paused=true;if(!cycle)life.hold();},get rig(){return life.rig;}};
}
