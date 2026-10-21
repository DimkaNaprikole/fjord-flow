/** Isolated XY button gesture. Exclusive ownership of the same rig while active.
 * Y is up; target is the fixed world position of the visible front toe (.21U
 * ahead of the IK paw anchor). No DOM, OS input, force or collision simulation.
 * snapshot().buttonPress.events is cumulative: consumers deduplicate by ID.
 * Freezes the already-settled rest spring; time/breathing continue normally.
 */
import {LIMBS,isRestMotionSettled} from './rig-kinematics.mjs';
const copy=x=>structuredClone(x),clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const bell=x=>64*x*x*x*(1-x)*(1-x)*(1-x);
const clone=rig=>Object.assign(Object.create(Object.getPrototypeOf(rig)),copy(rig));
export class RigButtonPressError extends Error{
 constructor(code,message,diagnostics={}){super(message);this.name='RigButtonPressError';this.code=code;this.diagnostics=diagnostics;}
}
export function createRigButtonPress(rig,{limb='RF',target,duration=2}={}){
 if(!rig?.snapshot||!rig?.body||!rig?.legs)throw new TypeError('An Osiris rig is required');
 if(!['RF','LF'].includes(limb))throw new RigButtonPressError('limb','Button press requires a front paw');
 if(!target||![target.x,target.y].every(Number.isFinite))throw new TypeError('A finite fixed XY toe target is required');
 if(!Number.isFinite(duration)||duration<.6||duration>10)throw new RangeError('duration must be between .6 and 10 seconds');
 const source=rig.snapshot(),u=rig.unit,epsilon=1e-7*u;
 if(source.basisMode!=='walk'||rig.jumpState||Math.abs(rig.velocity)>epsilon||Math.abs(rig.targetSpeed)>epsilon||LIMBS.some(id=>!source.contacts[id]||rig.legs[id].swing))throw new RigButtonPressError('stance','A stopped four-planted floor stance is required');
 if(source.issues.length||LIMBS.some(id=>Math.abs(rig.legs[id].paw.y-source.root.y)>epsilon))throw new RigButtonPressError('floor','All supports must lie on the same normal floor');
 if(!isRestMotionSettled(source))throw new RigButtonPressError('settle','Wait for settled rest motion before a held button gesture');
 if(target.y<source.root.y)throw new RigButtonPressError('target','The toe target must not lie below the floor');
 const fixedTarget={x:target.x,y:target.y},sourceLeg=copy(rig.legs[limb]),paw=copy(sourceLeg.paw),f=rig.facing<0?-1:1;
 const endPaw={x:fixedTarget.x-f*.21*u,y:fixedTarget.y},startTime=rig.time,sourceMode=rig.mode,touchPhase=.42,touchAt=touchPhase*duration;
 const touchEvent={type:'touch',id:`button-touch:${startTime}:${limb}`,limb,time:startTime+touchAt,target:copy(fixedTarget)};
 let elapsed=0,finished=false,cancelPlan=null,touched=false;
 function phase(q){return q<=.12?'attention':q<touchPhase?'reach':q<.56?'hold':q<.88?'withdraw':'settled';}
 function pawAt(q){
  if(q<=.12||q>=.88)return copy(paw);
  if(q>=touchPhase&&q<=.56)return copy(endPaw);
  const returning=q>.56,z=returning?(q-.56)/.32:(q-.12)/.30,s=smooth(z),a=returning?endPaw:paw,b=returning?paw:endPaw;
  return {x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s+.24*u*bell(z)};
 }
 function evaluate(actor,at,q,{cancelled=false,event=touched,done=false}={}){
  actor.time=startTime+at;actor.legs[limb]=copy(sourceLeg);
  if(q>.12&&q<.88){actor.legs[limb].paw=pawAt(q);actor.legs[limb].contact=false;actor.legs[limb].swing=null;}
  actor.mode=done?sourceMode:'idle';const s=actor.snapshot();s.mode='button-press';s.events=[];s.legs[limb].soleAxis={x:f,y:0};
  s.buttonPress={limb,target:copy(fixedTarget),focus:copy(fixedTarget),progress:q,elapsed:at,duration,phase:cancelled?'cancel-withdraw':phase(q),cancelled,done,touchPoint:{x:s.joints[limb].paw.x+f*.21*u,y:s.joints[limb].paw.y},events:event?[copy(touchEvent)]:[]};
  return s;
 }
 function audit(sample,total,label){
  const trial=clone(rig),samples=Math.max(2,Math.ceil(total*240));let maxReachError=0;
  for(let i=0;i<=samples;i++){
   const {at,q}=sample(total*i/samples),s=evaluate(trial,at,q);
   maxReachError=Math.max(maxReachError,...Object.values(s.legs).map(l=>l.reachError));
   let minY=Infinity;for(const seg of s.segments)minY=Math.min(minY,seg.from.y,seg.to.y);
   if(s.issues.length||Object.values(s.contacts).filter(Boolean).length<3||minY<source.root.y-epsilon||s.segments.some(seg=>![seg.from.x,seg.from.y,seg.to.x,seg.to.y,seg.length,seg.angle].every(Number.isFinite)))throw new RigButtonPressError('unreachable','Button trajectory exceeds the actual chain/floor envelope; source was not changed',{path:label,progress:q,issues:s.issues,minY,maxReachError});
  }
  return {samples:samples+1,maxReachError};
 }
 const preflight=audit(t=>({at:t,q:clamp(t/duration)}),duration,'normal');
 rig.mode='idle';let cached=evaluate(rig,0,0);
 const snapshot=()=>copy(cached);
 function cancelQ(plan,t){
  if(plan.kind==='finish')return clamp(plan.qStart+t/duration);
  if(t<plan.decelerate){const s=t/plan.decelerate;return plan.qStart+plan.decelerate/duration*(s-.5*s*s);}
  return plan.qStop*(1-smooth((t-plan.decelerate)/plan.returnTime));
 }
 function step(dt){
  if(!Number.isFinite(dt)||dt<0||dt>10)throw new RangeError('dt must be between0 and10 seconds');
  if(dt===0||finished)return snapshot();
  const end=cancelPlan?cancelPlan.start+cancelPlan.total:duration;elapsed=Math.min(end,elapsed+dt);if(end-elapsed<1e-10)elapsed=end;
  const q=cancelPlan?cancelQ(cancelPlan,elapsed-cancelPlan.start):clamp(elapsed/duration);
  if(!cancelPlan&&elapsed>=touchAt)touched=true;
  finished=elapsed>=end;cached=evaluate(rig,elapsed,q,{cancelled:!!cancelPlan,event:touched,done:finished});return snapshot();
 }
 function cancel(){
  if(finished||cancelPlan)return snapshot();
  const q=clamp(elapsed/duration);let plan;
  if(touched){
   // Skip only a stationary contact hold. During withdrawal preserve the
   // original path rate/velocity, then return the original floor stance.
   const qStart=Math.max(q,.56);plan={kind:'finish',qStart,total:(1-qStart)*duration};
  }else if(q<=.12){plan={kind:'return',qStart:0,qStop:0,decelerate:0,returnTime:0,total:0};}
  else{
   // Decelerate the original path parameter before retracing it. Remaining
   // space to contact sets the stop interval, so cancellation never reaches
   // the target. Arbitrarily late cancellation can require high acceleration.
   const decelerate=Math.min(.12*duration,(touchPhase-q)*duration),qStop=q+decelerate/(2*duration),returnTime=.32*duration;
   plan={kind:'return',qStart:q,qStop,decelerate,returnTime,total:decelerate+returnTime};
  }
  plan.start=elapsed;
  // Cancellation is separately checked before changing the live plan/actor.
  const checked=audit(t=>({at:elapsed+t,q:plan.total===0?0:cancelQ(plan,t)}),plan.total,'cancel');
  cancelPlan=plan;finished=plan.total===0;
  diagnostics.cancel={...checked,kind:plan.kind,duration:plan.total};
  const currentQ=finished?0:cancelQ(plan,0);cached=evaluate(rig,elapsed,currentQ,{cancelled:true,event:touched,done:finished});return snapshot();
 }
 const diagnostics={accepted:true,...preflight,minContacts:3,limitations:['Kinematic fixed-point gesture; button force and collision are not simulated.','Near-instant cancellation before contact can require high deceleration; no naturalness or C2 claim.','Call step(0), or stop advancing time, to pause. Do not concurrently drive the source rig.']};
 return {step,snapshot,cancel,get done(){return finished;},diagnostics};
}
