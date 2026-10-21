/** ISOLATED clearance candidate: gentle lean / folded lying / breathing / rise.
 * Same XY rig and fixed IK links. Mesh/floor acceptance is a separate audit.
 * Exclusive ownership: do not step the source concurrently. No force model.
 */
import {LIMBS,isRestMotionSettled} from './rig-kinematics.mjs';
const copy=x=>structuredClone(x),clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const bell=x=>64*x*x*x*(1-x)*(1-x)*(1-x);
const clone=r=>Object.assign(Object.create(Object.getPrototypeOf(r)),copy(r));
// Endpoint radii bound each tapered upper/forearm capsule against the floor.
// These are geometric reservations, not clamps or alterations of skin vertices.
function forearmFloor(p,floor,u){let worst={clearance:Infinity};for(const id of ['RF','LF'])for(const [joint,radius]of [['shoulder',.1775],['elbow',.15],['wrist',.105]]){const clearance=p.joints[id][joint].y-floor-radius*u;if(clearance<worst.clearance)worst={clearance,limb:id,joint,radius:radius*u};}return worst;}
export class RigRestCycleClearanceError extends Error{constructor(code,message,diagnostics={}){super(message);this.name='RigRestCycleClearanceError';this.code=code;this.diagnostics=diagnostics;}}
export function createRigRestCycleClearance(rig,{holdDuration=2}={}){
 if(!rig?.snapshot||!rig?.body||!rig?.legs)throw new TypeError('An Osiris rig is required');
 if(!Number.isFinite(holdDuration)||holdDuration<.5||holdDuration>20)throw new RangeError('holdDuration must be between .5 and20 seconds');
 const before=rig.snapshot(),u=rig.unit,eps=1e-7*u;
 if(before.basisMode!=='walk'||rig.jumpState||Math.abs(rig.velocity)>eps||Math.abs(rig.targetSpeed)>eps||LIMBS.some(id=>!before.contacts[id]||rig.legs[id].swing))throw new RigRestCycleClearanceError('stance','A stopped four-planted floor stance is required');
 if(before.issues.length||LIMBS.some(id=>Math.abs(rig.legs[id].paw.y-rig.root.y)>eps))throw new RigRestCycleClearanceError('floor','All four supports must lie on the normal floor');
 if(!isRestMotionSettled(before))throw new RigRestCycleClearanceError('settle','Wait for settled rest motion before the cycle');
 const startTime=rig.time,sourceLegs=copy(rig.legs),sourceMode=rig.mode,f=rig.facing<0?-1:1,floor=rig.root.y;
 const order=['RF','LF','RH','LH'],restoreOrder=[...order].reverse(),rel={RF:.88,LF:.90,RH:-.28,LH:-.24};
 const prepared=Object.fromEntries(order.map(id=>[id,{x:rig.root.x+f*rel[id]*u,y:floor}]));
 const spans=[['lean',1.6],['prepare',2.8],['lie-down',1.6],['lying',holdDuration],['rise',1.6],['restore',2.8],['settled',.4]];
 let cursor=0;const timeline=spans.map(([phase,length])=>{const start=cursor;cursor+=length;return {phase,start,end:cursor,length};}),duration=cursor;
 const sourceAngle=-.5+.08*Math.sin(rig.phase*Math.PI*2),lieAngle=-1.4,lieCentre=.43*u;
 let elapsed=0;
 function schedule(at){const span=timeline.find(p=>at<p.end-1e-12)??timeline.at(-1);return {...span,z:clamp((at-span.start)/span.length)};}
 function bodyPose(actor,lie,stretch){
  const body=actor.body(),origin=body.centre,angle=-.13*stretch,cos=Math.cos(angle),sin=Math.sin(angle);
  // Keep the original tilt/translation/timing, but support the lean from a
  // slightly raised torso plan. Original -.035U lowering drove the near elbow
  // into its .15U skin reserve. This +.04U C2 envelope moves no root or support.
  const baseHeight=(1.39-.38*actor.restBlend)*u,centre={x:origin.x-f*.08*u*stretch,y:origin.y+(lieCentre-baseHeight)*lie+.04*u*stretch};
  const point=p=>{const x=f*(p.x-origin.x),y=p.y-origin.y;return {x:centre.x+f*(x*cos-y*sin),y:centre.y+x*sin+y*cos};};
  const vector=p=>{const x=f*p.x,y=p.y;return {x:f*(x*cos-y*sin),y:x*sin+y*cos};};
  const out={...body};for(const [key,p]of Object.entries(body))if(p&&Number.isFinite(p.x))out[key]=['forward','dorsal'].includes(key)?vector(p):point(p);
  out.hockAngle=sourceAngle+(lieAngle-sourceAngle)*lie;return out;
 }
 function evaluate(actor,at){
  const s=schedule(at),lie=s.phase==='lie-down'?smooth(s.z):s.phase==='lying'?1:s.phase==='rise'?1-smooth(s.z):0,stretch=s.phase==='lean'?bell(s.z):0;
  actor.time=startTime+at;actor.mode=at>=duration?sourceMode:'idle';actor.legs=copy(sourceLegs);
  if(['lie-down','lying','rise','restore'].includes(s.phase))for(const id of order)actor.legs[id].paw=copy(prepared[id]);
  if(s.phase==='prepare'||s.phase==='restore'){
   const sequence=s.phase==='prepare'?order:restoreOrder,t=s.z*4,index=Math.min(3,Math.floor(t)),q=clamp(t-index);
   for(let i=0;i<4;i++){
    const id=sequence[i],from=s.phase==='prepare'?sourceLegs[id].paw:prepared[id],to=s.phase==='prepare'?prepared[id]:sourceLegs[id].paw;
    if(i<index)actor.legs[id].paw=copy(to);
    else if(i===index){const z=smooth(q);actor.legs[id].paw={x:from.x+(to.x-from.x)*z,y:floor+.22*u*bell(q)};if(q>0&&q<1){actor.legs[id].contact=false;actor.legs[id].swing=null;}}
    else actor.legs[id].paw=copy(from);
   }
  }
  // Always derive from the core body at the current clock. Never reapply an
  // override to a previous override: full-cycle repeats cannot accumulate.
  const override=bodyPose(actor,lie,stretch),result=actor.snapshot(at===0||at>=duration?null:override);result.mode='rest-cycle';result.events=[];
  for(const id of order)result.legs[id].soleAxis={x:f,y:0};
  result.restCycle={phase:s.phase,elapsed:at,duration,progress:at/duration,phaseProgress:s.z,lieBlend:lie,done:at>=duration,holdDuration,centreHeight:result.body.centre.y-floor,lieCentreHeight:lieCentre,requiresSkinFloorQA:true};return result;
 }
 const trial=clone(rig),samples=Math.ceil(duration*240);let maxReachError=0,minJointFloor=Infinity,lowest=null,minLeanForearmClearance=Infinity,worstLeanForearm=null;
 for(let i=0;i<=samples;i++){
  const s=evaluate(trial,duration*i/samples);maxReachError=Math.max(maxReachError,...Object.values(s.legs).map(l=>l.reachError));
  if(s.restCycle.phase==='lean'){const worst=forearmFloor(s,floor,u);if(worst.clearance<minLeanForearmClearance){minLeanForearmClearance=worst.clearance;worstLeanForearm={...worst,elapsed:s.restCycle.elapsed,time:s.time};}if(!Number.isFinite(worst.clearance)||worst.clearance<.01*u)throw new RigRestCycleClearanceError('lean-clearance','Lean cannot preserve the actual forearm/upper capsule floor reserves; source unchanged',{worstLeanForearm,minLeanForearmClearance,requiredReserve:.01*u});}
  for(const seg of s.segments)for(const endpoint of ['from','to'])if(seg[endpoint].y-floor<minJointFloor){minJointFloor=seg[endpoint].y-floor;lowest=`${seg.id}.${endpoint}`;}
  if(s.issues.length||Object.values(s.contacts).filter(Boolean).length<3||s.segments.some(seg=>![seg.from.x,seg.from.y,seg.to.x,seg.to.y,seg.length,seg.angle].every(Number.isFinite))||minJointFloor< -eps)throw new RigRestCycleClearanceError('unreachable','Full rest cycle exceeds actual IK/floor limits; source unchanged',{phase:s.restCycle.phase,elapsed:s.restCycle.elapsed,issues:s.issues,minJointFloor,lowest,maxReachError});
 }
 rig.mode='idle';let cached=evaluate(rig,0);
 const snapshot=()=>copy(cached);
 function step(dt){if(!Number.isFinite(dt)||dt<0||dt>10)throw new RangeError('dt must be between0 and10 seconds');if(dt===0||elapsed>=duration)return snapshot();elapsed=Math.min(duration,elapsed+dt);if(duration-elapsed<1e-10)elapsed=duration;cached=evaluate(rig,elapsed);return snapshot();}
 return {step,snapshot,get done(){return elapsed>=duration;},diagnostics:{accepted:true,samples:samples+1,maxReachError,minJointFloor,lowest,duration,timeline:copy(timeline),lieCentreHeight:lieCentre,minLeanForearmClearance,worstLeanForearm,leanPlan:{torsoPitch:-.13,torsoBack:.08*u,torsoRaise:.04*u,requiredCapsuleReserve:.01*u},limitations:['Lean floor gate reserves actual shoulder/elbow/wrist capsule thickness; whole-avatar skin QA remains separate.','Folded same-skeleton pose; actual continuous-skin floor and self-intersection QA is required.','No mass, gravity, force, collision or balance simulation.','Fixed joints/reach do not prove a natural or visually acceptable lying cat.']}};
}
