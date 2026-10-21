/** Isolated same-skeleton stretch, exclusive ownership of a settled floor rig.
 * Sequential forepaw placement, high pelvis/low chest, hold and exact restore.
 * Skin collision, force/balance and visual naturalness require separate QA.
 */
import {LIMBS,isRestMotionSettled} from './rig-kinematics.mjs';
const copy=x=>structuredClone(x),clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const bell=x=>64*x*x*x*(1-x)*(1-x)*(1-x);
export class RigCatStretchError extends Error{constructor(code,message,diagnostics={}){super(message);this.name='RigCatStretchError';this.code=code;this.diagnostics=diagnostics;}}
export function createRigCatStretch(rig,{holdDuration=1}={}){
 if(!rig?.snapshot||!rig?.body||!rig?.legs)throw new TypeError('An Osiris rig is required');
 if(!Number.isFinite(holdDuration)||holdDuration<.2||holdDuration>20)throw new RangeError('holdDuration must be between .2 and20 seconds');
 const source=rig.snapshot(),u=rig.unit,f=rig.facing<0?-1:1,floor=rig.root.y,eps=1e-7*u;
 if(source.basisMode!=='walk'||rig.jumpState||Math.abs(rig.velocity)>eps||Math.abs(rig.targetSpeed)>eps||LIMBS.some(id=>!source.contacts[id]||rig.legs[id].swing))throw new RigCatStretchError('stance','Stretch requires a stopped four-planted floor stance');
 if(source.issues.length||LIMBS.some(id=>Math.abs(rig.legs[id].paw.y-floor)>eps))throw new RigCatStretchError('floor','All supports must lie on the normal floor');
 if(!isRestMotionSettled(source))throw new RigCatStretchError('settle','Wait for settled rest motion before stretching');
 const startTime=rig.time,sourceMode=rig.mode,sourceLegs=copy(rig.legs);
 const targets={RF:{x:source.body.chest.x+f*1.28*u,y:floor},LF:{x:source.body.chest.x+f*1.24*u,y:floor}};
 if(['RF','LF'].some(id=>f*(targets[id].x-sourceLegs[id].paw.x)<.2*u))throw new RigCatStretchError('stance','The source forepaws leave insufficient forward stretch room');
 let cursor=0;const timeline=[['place-RF',.9],['place-LF',.9],['lower-chest',.9],['stretch-hold',holdDuration],['raise-chest',.9],['restore-LF',.9],['restore-RF',.9],['settled',.4]].map(([phase,length])=>{const start=cursor;cursor+=length;return {phase,start,end:cursor,length};}),duration=cursor;
 let elapsed=0;
 function schedule(at){const span=timeline.find(s=>at<s.end-1e-12)??timeline.at(-1);return {...span,q:clamp((at-span.start)/span.length)};}
 function bodyAt(actor,blend){
  const base=actor.body(),origin=base.pelvis,angle=-.28*blend,c=Math.cos(angle),s=Math.sin(angle),pelvis={x:origin.x-f*.08*u*blend,y:origin.y+.16*u*blend};
  const point=p=>{const x=f*(p.x-origin.x),y=p.y-origin.y;return {x:pelvis.x+f*(x*c-y*s),y:pelvis.y+x*s+y*c};};
  const vector=p=>{const x=f*p.x,y=p.y;return {x:f*(x*c-y*s),y:x*s+y*c};};
  const out={...base},mapped=new Map();for(const[key,p]of Object.entries(base))if(p&&Number.isFinite(p.x)){if(!mapped.has(p))mapped.set(p,['forward','dorsal'].includes(key)?vector(p):point(p));out[key]=mapped.get(p);}return out;
 }
 function evaluate(actor,at){
  actor.time=startTime+at;actor.mode=at>=duration?sourceMode:'idle';actor.legs=copy(sourceLegs);
  const span=schedule(at),q=span.q,blend=span.phase==='lower-chest'?smooth(q):span.phase==='stretch-hold'?1:span.phase==='raise-chest'?1-smooth(q):0;
  if(['place-LF','lower-chest','stretch-hold','raise-chest','restore-LF'].includes(span.phase))actor.legs.RF.paw=copy(targets.RF);
  if(['lower-chest','stretch-hold','raise-chest'].includes(span.phase))actor.legs.LF.paw=copy(targets.LF);
  const moving=span.phase.startsWith('place-')||span.phase.startsWith('restore-');
  if(moving){const id=span.phase.slice(span.phase.indexOf('-')+1),returning=span.phase.startsWith('restore'),from=returning?targets[id]:sourceLegs[id].paw,to=returning?sourceLegs[id].paw:targets[id],t=smooth(q);
   actor.legs[id].paw={x:from.x+(to.x-from.x)*t,y:floor+.14*u*bell(q)};if(q>0&&q<1){actor.legs[id].contact=false;actor.legs[id].swing=null;}
  }
  const result=actor.snapshot(at===0||at>=duration?null:bodyAt(actor,blend));result.mode='cat-stretch';result.events=[];
  for(const id of LIMBS)result.legs[id].soleAxis={x:f,y:0};
  result.catStretch={phase:span.phase,elapsed:at,duration,progress:at/duration,phaseProgress:q,stretchBlend:blend,holdDuration,done:at>=duration,targets:copy(targets)};
  return result;
 }
 const trial=Object.assign(Object.create(Object.getPrototypeOf(rig)),copy(rig)),samples=Math.ceil(duration*240);let maxReachError=0,minJointFloor=Infinity,minExtensionReserve=Infinity,minFoldReserve=Infinity,lowest=null;
 for(let i=0;i<=samples;i++){
  const p=evaluate(trial,duration*i/samples);maxReachError=Math.max(maxReachError,...Object.values(p.legs).map(l=>l.reachError));
  for(const seg of p.segments)for(const endpoint of ['from','to'])if(seg[endpoint].y-floor<minJointFloor){minJointFloor=seg[endpoint].y-floor;lowest=`${seg.id}.${endpoint}`;}
  for(const id of LIMBS){const j=p.joints[id],front=id.endsWith('F'),a=j[front?'shoulder':'hip'],b=j[front?'wrist':'hock'],distance=Math.hypot(a.x-b.x,a.y-b.y);minExtensionReserve=Math.min(minExtensionReserve,(front?1.64:1.36)*u-distance);minFoldReserve=Math.min(minFoldReserve,distance-(front?0:.04)*u);}
  if(p.issues.length||Object.values(p.contacts).filter(Boolean).length<3||minJointFloor< -eps||minExtensionReserve<.02*u||minFoldReserve<.02*u||p.segments.some(s=>![s.from.x,s.from.y,s.to.x,s.to.y,s.length,s.angle].every(Number.isFinite)))throw new RigCatStretchError('unreachable','Stretch exceeds real IK, floor or nondegenerate chain limits; source unchanged',{phase:p.catStretch.phase,progress:p.catStretch.progress,issues:p.issues,minJointFloor,lowest,minExtensionReserve,minFoldReserve,maxReachError});
 }
 rig.mode='idle';let cached=evaluate(rig,0);
 function step(dt){if(!Number.isFinite(dt)||dt<0||dt>10)throw new RangeError('dt must be between0 and10 seconds');if(dt===0||elapsed>=duration)return copy(cached);elapsed=Math.min(duration,elapsed+dt);if(duration-elapsed<1e-10)elapsed=duration;cached=evaluate(rig,elapsed);return copy(cached);}
 return {step,snapshot:()=>copy(cached),get done(){return elapsed>=duration;},diagnostics:{accepted:true,duration,timeline:copy(timeline),targets:copy(targets),samples:samples+1,maxReachError,minJointFloor,lowest,minExtensionReserve,minFoldReserve,torsoRotation:-.28,pelvisRaise:.16*u,pelvisBack:.08*u,limitations:['Skeletal reach/floor checks do not prove continuous skin clearance, collision or naturalness.','No force, torque or mass balance solver.','Rest spring is held only after the original settled-motion gate; breathing follows the actual clock.']}};
}
