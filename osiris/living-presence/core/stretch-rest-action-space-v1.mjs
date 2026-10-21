/** Conservative whole-action frustum preflight, renderer-free and clone-only.
 * Caller supplies an unadvanced cycle owning a disposable clone, never live rig.
 * No source/frame/view mutation; the supplied trial cycle is consumed to done.
 */
import {createSceneToyZone} from './scene-toy-zone.mjs';
import {spatialPose} from './spatial-locomotion.mjs';
const ids=['RF','LF','RH','LH'];
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const mul=(p,n)=>({x:p.x*n,y:p.y*n,z:p.z*n});
const valid=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const offset=(p,f,a,d,b,l,c=0)=>add(add(add(p,mul(f,a)),mul(d,b)),mul(l,c));

// Fixed envelopes for the current full avatar, in U. They deliberately exceed
// the visible lean skin dimensions and retain head/ear/collar/tail appendages.
// Paw capsules include the physical forward toe, not only its IK anchor.
function envelopes(p,u){
 const b=p.body,f=b.forward,d=b.dorsal,l=b.lateral,out=[];
 const capsule=(part,start,end,radius)=>out.push({part,start,end,radius:radius*u+.025*u});
 capsule('body',b.pelvis,b.chest,.54);capsule('neck-collar-bell',b.neck,b.head,.40);
 const head=offset(b.head,f,.09*u,d,.08*u,l);
 capsule('head',offset(head,f,-.04*u,d,0,l),offset(head,f,.10*u,d,0,l),.53);
 for(const side of [-1,1])capsule(`ear:${side}`,offset(head,f,-.10*u,d,.30*u,l,side*.225*u),offset(head,f,-.23*u,d,.65*u,l,side*.25*u),.34);
 for(const id of ids){const j=p.joints[id],front=id.endsWith('F'),chain=front?['shoulder','elbow','wrist','paw']:['hip','knee','hock','paw'];
  for(let i=0;i<3;i++)capsule(`${id}:${['upper','lower','distal'][i]}`,j[chain[i]],j[chain[i+1]],(front?[.24,.18,.15]:[.28,.20,.16])[i]);
  const sole=p.legs[id].soleAxis;capsule(`${id}:paw`,add(j.paw,mul(sole,-.16*u)),add(j.paw,mul(sole,.36*u)),.18);
 }
 // Radius includes the thick sacral end, Catmull-Rom departure from its chords,
 // and tapered-tip detail; retaining it at every tail link is conservative.
 for(let i=0;i<p.joints.tail.length-1;i++)capsule(`tail:${i}`,p.joints.tail[i],p.joints.tail[i+1],.15);
 return out;
}
export function inspectStretchRestSpace(trialCycle,{frame,unit=1,view}={}){
 if(!trialCycle?.step||!trialCycle?.snapshot||!Number.isFinite(unit)||unit<=0||!view||!frame||!Number.isFinite(frame.heading)||!Number.isFinite(frame.pivotX)||!Number.isFinite(frame.position?.x)||!Number.isFinite(frame.position?.z))throw new RangeError('A fresh disposable trial cycle, finite spatial frame/unit and live view are required');
 const zone=createSceneToyZone(view),initial=trialCycle.snapshot(),state=initial.stretchRestCycle;
 if(!state||state.elapsed!==0||!Number.isFinite(state.duration)||state.duration<=0||trialCycle.done)throw new RangeError('The full action must start at elapsed0 on a disposable clone');
 const count=Math.ceil(state.duration*240);let clearance=Infinity,worst=null,firstRejected=null,samples=0,maxSupportSlip=0,previous=null,lastElapsed=0;
 function inspect(native){
  const p=spatialPose(native,frame,unit),meta=p.stretchRestCycle;
  if(previous)for(const id of ids)if(previous.contacts[id]&&p.contacts[id])maxSupportSlip=Math.max(maxSupportSlip,distance(previous.joints[id].paw,p.joints[id].paw));
  for(const capsule of envelopes(p,unit)){
   if(!valid(capsule.start)||!valid(capsule.end))throw new RangeError('Nonfinite actual pose in action-space preflight');
   const result=zone.inspectSegment(capsule.start,capsule.end,capsule.radius),record={clearance:result.clearance,part:capsule.part,elapsed:meta.elapsed,phase:meta.phase,stage:meta.stage,time:p.time};
   if(result.clearance<clearance){clearance=result.clearance;worst=record;}
   if(!result.accepted&&!firstRejected)firstRejected=record;
  }previous=p;samples++;
 }
 inspect(initial);
 for(let i=1;i<=count;i++){const elapsed=state.duration*i/count;inspect(trialCycle.step(elapsed-lastElapsed));lastElapsed=elapsed;}
 const accepted=clearance>=0&&maxSupportSlip<=1e-6*unit&&trialCycle.done;
 return {accepted,clearance,minClearance:clearance,reason:accepted?null:maxSupportSlip>1e-6*unit?'support-slip':!trialCycle.done?'incomplete-trial':'action-frustum',samples,duration:state.duration,worst,firstRejected,maxSupportSlip,envelopePadding:.025*unit,sampleHz:240,limitations:['Conservative fixed capsule envelopes may defer an otherwise visible gesture.','Current avatar envelope and240Hz temporal padding require reevaluation after geometry/action changes.','Frustum preflight is not a force, floor/self-collision or arbitrary obstacle solver.']};
}
