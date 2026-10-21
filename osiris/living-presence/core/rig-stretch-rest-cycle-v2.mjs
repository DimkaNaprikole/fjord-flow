/** Isolated v2: genuine forepaw stretch and rest with a clearance-aware lean.
 * Exclusive ownership of one stopped floor rig. Original v1 actions unchanged.
 */
import {LIMBS} from './rig-kinematics.mjs';
import {createRigCatStretch} from './rig-cat-stretch.mjs';
import {createRigRestCycleClearance} from './rig-rest-cycle-clearance-v1.mjs';
const copy=x=>structuredClone(x);
const clone=r=>Object.assign(Object.create(Object.getPrototypeOf(r)),copy(r));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function poseGap(a,b){let gap=0;for(const id of LIMBS)for(const [key,p]of Object.entries(a.joints[id]))gap=Math.max(gap,distance(p,b.joints[id][key]));for(const key of ['centre','chest','pelvis','neck','head','nose','tailRoot'])gap=Math.max(gap,distance(a.body[key],b.body[key]));for(let i=0;i<a.joints.tail.length;i++)gap=Math.max(gap,distance(a.joints.tail[i],b.joints.tail[i]));return gap;}
function finish(action){while(!action.done){const p=action.snapshot(),elapsed=(p.catStretch??p.restCycle).elapsed;action.step(Math.min(10,action.diagnostics.duration-elapsed));}return action.snapshot();}
export class RigStretchRestCycleV2Error extends Error{constructor(message,diagnostics){super(message);this.name='RigStretchRestCycleV2Error';this.code='handoff-gap';this.diagnostics=diagnostics;}}

export function createRigStretchRestCycleV2(rig,{stretchHoldDuration=1,restHoldDuration=2}={}){
 if(!rig?.snapshot||!rig?.body||!rig?.legs)throw new TypeError('An Osiris rig is required');
 const trial=clone(rig),source=copy(rig),eps=1e-6*rig.unit;
 // Both complete action preflights and endpoint checks precede live ownership.
 // The second action sees the real elapsed clock, never the initial timestamp.
 const trialStretch=createRigCatStretch(trial,{holdDuration:stretchHoldDuration}),stretchDuration=trialStretch.diagnostics.duration;
 const seams={sourceStretch:poseGap(trialStretch.snapshot(),rig.snapshot())};
 const endStretch=finish(trialStretch),stretchNative=trial.snapshot();seams.stretchNative=poseGap(endStretch,stretchNative);
 const trialRest=createRigRestCycleClearance(trial,{holdDuration:restHoldDuration});seams.stretchRest=poseGap(endStretch,trialRest.snapshot());
 const endRest=finish(trialRest);seams.restNative=poseGap(endRest,trial.snapshot());
 const expected=Object.assign(Object.create(Object.getPrototypeOf(rig)),copy(source));expected.time=trial.time;
 seams.finalSourceAtElapsedTime=poseGap(trial.snapshot(),expected.snapshot());
 if(Object.values(seams).some(g=>!Number.isFinite(g)||g>eps))throw new RigStretchRestCycleV2Error('Native stance cannot pass continuously between stretch and rest',{seams});
 const restDuration=trialRest.diagnostics.duration,duration=stretchDuration+restDuration;
 const diagnostics={accepted:true,duration,seams:copy(seams),stretch:copy(trialStretch.diagnostics),rest:copy(trialRest.diagnostics),timeline:[...trialStretch.diagnostics.timeline.map(s=>({...s,stage:'stretch'})),...trialRest.diagnostics.timeline.map(s=>({...s,stage:'rest',start:s.start+stretchDuration,end:s.end+stretchDuration}))],limitations:['Composition preserves the existing rest-cycle gentle lean and full lying sequence.','Geometry/reach and sampled floor checks do not prove naturalness, skin clearance, balance or force.','Source must satisfy both actions at their actual elapsed clocks.']};
 let action=createRigCatStretch(rig,{holdDuration:stretchHoldDuration}),stage='stretch',elapsed=0,paused=false,done=false;
 function snapshot(){const p=done?rig.snapshot():action.snapshot(),child=stage==='stretch'?p.catStretch:p.restCycle;p.stretchRestCycle={stage:done?'complete':stage,phase:done?'complete':child.phase,elapsed,duration,progress:elapsed/duration,paused,done};return p;}
 function step(dt){
  if(!Number.isFinite(dt)||dt<0||dt>10)throw new RangeError('dt must be between0 and10 seconds');
  if(paused||dt===0||done)return snapshot();let remaining=dt;
  while(remaining>1e-12&&!done){
   const end=stage==='stretch'?stretchDuration:duration,h=Math.min(remaining,Math.max(0,end-elapsed));action.step(h);elapsed=Math.min(end,elapsed+h);remaining-=h;
   if(action.done){
    if(stage==='stretch'){const before=action.snapshot();action=createRigRestCycleClearance(rig,{holdDuration:restHoldDuration});const gap=poseGap(before,action.snapshot());if(gap>eps)throw new RigStretchRestCycleV2Error('Live stretch→rest seam differs from preflight',{gap});stage='rest';}
    else{done=true;elapsed=duration;}
   }else if(h===0)throw new RigStretchRestCycleV2Error('Action clock failed to reach its verified endpoint',{stage,elapsed});
  }return snapshot();
 }
 return {rig,step,snapshot,hold(){paused=true;return snapshot();},resume(){paused=false;return snapshot();},get done(){return done;},diagnostics};
}
