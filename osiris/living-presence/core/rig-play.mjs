/** Local profile toy experiment. The caller owns scheduling and rendering.
 * Coordinates are world XY (Y up), unit and facing come from the SAME rig.
 * Only a front paw moves; three actual world supports remain planted.
 * This is kinematic: no ball collision/force, balance, or naturalness claim.
 * While active, do not drive the rig concurrently. Its rest height, distance
 * phase and scheduling fields are held; its real time advances analytically.
 * .play.events is a cumulative, single-entry touch log (not a per-frame pulse).
 * After done, the original leg is restored; rig is idle and may walk again.
 */
import {LIMBS,isRestMotionSettled} from './rig-kinematics.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const mix=(a,b,t)=>a+(b-a)*t;
const copy=x=>structuredClone(x);
const cloneRig=rig=>Object.assign(Object.create(Object.getPrototypeOf(rig)),copy(rig));
export class RigPlayError extends Error{
 constructor(code,message,diagnostics={}){super(message);this.name='RigPlayError';this.code=code;this.diagnostics=diagnostics;}
}

export function createRigPlay(rig,{limb='LF',duration=3.8}={}){
 if(!rig?.snapshot||!rig?.body||!rig?.legs)throw new TypeError('An Osiris rig is required');
 if(!['LF','RF'].includes(limb))throw new RigPlayError('limb','Toy play requires a front paw');
 if(!Number.isFinite(duration)||duration<.5||duration>10)throw new RangeError('duration must be between .5 and 10 seconds');
 // Every rejection, including the trajectory preflight below, precedes any
 // assignment to the actual rig. Never silently settle or teleport an input.
 const source=rig.snapshot(),u=rig.unit,eps=1e-7*u;
 if(source.basisMode!=='walk'||rig.jumpState||Math.abs(rig.velocity)>eps||Math.abs(rig.targetSpeed)>eps||LIMBS.some(id=>!source.contacts[id]||rig.legs[id].swing))
  throw new RigPlayError('stance','Play requires a stopped, four-planted floor stance');
 if(source.issues.length||LIMBS.some(id=>Math.abs(rig.legs[id].paw.y-source.root.y)>eps))
  throw new RigPlayError('floor','All four real supports must be on the same normal floor');
 if(!isRestMotionSettled(source,{minBlend:.8}))throw new RigPlayError('settle','Let restBlend reach >= .8 and abs(restBlendVelocity) <= .002 before play');
 const sourceLeg=copy(rig.legs[limb]),startTime=rig.time,paw=copy(sourceLeg.paw),f=rig.facing<0?-1:1,floor=source.root.y;
 // The renderer's front sole pin lies .21U ahead of the paw anchor. Contact
 // uses that visible toe, not the invisible centre of the IK target.
 const toeOffset=.21*u,ballRadius=.20*u;
 const touchTime=.35*duration,initialBall={x:paw.x+f*(.28*u+toeOffset+ballRadius),y:floor+ballRadius,radius:ballRadius};
 let elapsed=0;
 const stage=t=>t<.15?'attention':t<.35?'reach':t<.5?'push':t<.78?'withdraw':'settled';
 function pawAt(t){
  if(t<=.15||t>=.78)return copy(paw);
  if(t<.35){const z=(t-.15)/.2;return {x:paw.x+f*.28*u*smooth(z),y:mix(paw.y,initialBall.y,smooth(z))+.27*u*Math.sin(Math.PI*z)**2};}
  if(t<.5){const z=smooth((t-.35)/.15);return {x:paw.x+f*mix(.28,.5,z)*u,y:initialBall.y};}
  const z=(t-.5)/.28;return {x:paw.x+f*.5*u*(1-smooth(z)),y:mix(initialBall.y,paw.y,smooth(z))+.25*u*Math.sin(Math.PI*z)**2};
 }
 function ballAt(t){
  const distance=t<=.35?0:t<.5?.22*smooth((t-.35)/.15):.22+.68*smooth((t-.5)/.38);
  return {...initialBall,x:initialBall.x+f*distance*u,rotation:-f*distance/(ballRadius/u),opacity:1};
 }
 function evaluate(actor,at){
  const t=clamp(at/duration);actor.time=startTime+at;
  actor.legs[limb]=copy(sourceLeg);
  if(t>.15&&t<.78){actor.legs[limb].paw=pawAt(t);actor.legs[limb].contact=false;actor.legs[limb].swing=null;}
  const body=actor.body(),dip=.08*u*Math.sin(Math.PI*t)**2;
  // Shift each body point once: shoulder/chest and hip/pelvis alias upstream.
  const shifted={...body};for(const [key,value] of Object.entries(body))if(value&&typeof value==='object'&&Number.isFinite(value.x)&&Number.isFinite(value.y)&&!['forward','dorsal'].includes(key))shifted[key]={x:value.x,y:value.y-dip};
  const result=actor.snapshot(t===0||t===1?null:shifted),ball=ballAt(t);
  result.mode='play';result.events=[];
  result.legs[limb].soleAxis={x:f,y:0};
  result.play={limb,progress:t,phase:stage(t),focus:{x:ball.x,y:ball.y},ball,touchPoint:{x:result.joints[limb].paw.x+f*toeOffset,y:result.joints[limb].paw.y},events:at+1e-10>=touchTime?[{type:'touch',id:`play-touch:${startTime}:${limb}`,limb,time:startTime+touchTime}]:[],limitations:['Kinematic toy prop; gravity, force, collision and balance are not simulated.','Only the selected front paw moves; this does not establish natural animal motion.']};
  return result;
 }
 const trial=cloneRig(rig);trial.mode='idle';
 const samples=Math.ceil(duration*240);
 let maxReachError=0;
 for(let i=0;i<=samples;i++){
  const pose=evaluate(trial,duration*i/samples);maxReachError=Math.max(maxReachError,...Object.values(pose.legs).map(l=>l.reachError));
  if(pose.issues.length||Object.values(pose.contacts).filter(Boolean).length<3||pose.segments.some(s=>!Number.isFinite(s.length)||!Number.isFinite(s.angle)))
   throw new RigPlayError('unreachable','Toy path is outside the current stance reach; source rig was not changed',{progress:i/samples,issues:pose.issues,maxReachError});
 }
 rig.mode='idle'; // Accepted: same instance, no class/atlas/phase replacement.
 let cached=evaluate(rig,0);
 function snapshot(){return copy(cached);}
 function step(dt){
  if(!Number.isFinite(dt)||dt<0||dt>10)throw new RangeError('dt must be between 0 and 10 seconds');
  if(dt===0||elapsed>=duration)return snapshot();
  elapsed=Math.min(duration,elapsed+dt);if(duration-elapsed<1e-10)elapsed=duration;
  cached=evaluate(rig,elapsed);return snapshot();
 }
 return {step,snapshot,get done(){return elapsed>=duration;},diagnostics:{accepted:true,samples:samples+1,maxReachError,minContacts:3}};
}
