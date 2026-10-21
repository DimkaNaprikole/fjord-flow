/** Experimental profile rig, with no renderer or asset dependencies.
 * World: x right, y UP; lengths/speed are world units and units/second.
 * `unit` scales the animal, stride, acceleration and default speed, not time.
 * In walk, root is the ground projection of the torso centre. On a wall it
 * is the torso centre; wallX is fixed at construction. Anatomical L is near
 * the camera, R far. Facing is fixed per instance (mirror with facing:-1).
 *
 * createOsirisRig({mode:'walk', unit:100}).step(dt,{speed:80})
 *   // or worldRootSpeed:80, a magnitude, not an externally integrated root
 * rig.jump({distance:200,height:80,duration:1.5}); rig.step(dt)
 *
 * Stops finish pending swings in time, then breathe with planted feet. The
 * unwrapped distance phase survives stops; no animator/frame index is reset.
 * Horizontal/wall transitions and up/down turns require a separate docking
 * animation: requests are rejected and exposed as unsupportedTransition.
 * This is a geometric experiment, not proof of animal biomechanics.
 */
const TAU=Math.PI*2, EPS=1e-9;
export const LIMBS=Object.freeze(['RH','RF','LH','LF']);
export const WALK_ORDER=LIMBS;
export const WALL_ORDERS=Object.freeze({climb:Object.freeze(['RF','LH','LF','RH']),descend:Object.freeze(['LH','RF','RH','LF'])});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*t*(10+t*(-15+6*t));};
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mul=(a,s)=>({x:a.x*s,y:a.y*s});
const length=a=>Math.hypot(a.x,a.y);
const dist=(a,b)=>length(sub(a,b));
const lerp=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
const point=p=>({x:p.x,y:p.y});
const finite=(n,label)=>{if(!Number.isFinite(n))throw new TypeError(`${label} must be finite`);return n;};
const positive=(n,label)=>{finite(n,label);if(n<=0)throw new RangeError(`${label} must be positive`);return n;};
const checkPoint=(p,label)=>{finite(p.x,`${label}.x`);finite(p.y,`${label}.y`);return point(p);};
const validMode=m=>{if(!['walk','idle','climb','descend'].includes(m))throw new RangeError(`Unknown mode: ${m}`);return m;};

/** Exact fixed-length two-bone IK. Unreachable targets are explicitly reported.
 * bend=+1 chooses the left perpendicular to base→target; -1 the right one.
 * A tiny singularity margin prevents a knee flipping at straight extension.
 */
export function solveTwoBoneIK(base,target,upper,lower,bend=1){
 checkPoint(base,'base');checkPoint(target,'target');positive(upper,'upper');positive(lower,'lower');
 const delta=sub(target,base),raw=length(delta),direction=raw>EPS?mul(delta,1/raw):{x:0,y:-1};
 const margin=Math.min(upper,lower)*1e-7;
 const d=clamp(raw,Math.abs(upper-lower)+margin,upper+lower-margin);
 const along=(upper*upper-lower*lower+d*d)/(2*d),across=Math.sqrt(Math.max(0,upper*upper-along*along));
 const normal={x:-direction.y,y:direction.x};
 const joint=add(add(base,mul(direction,along)),mul(normal,across*(bend<0?-1:1)));
 const end=add(base,mul(direction,d));
 return {joint,end,reachError:dist(end,target),reachable:Math.abs(d-raw)<1e-6*(upper+lower)};
}

/** Three segments hip→knee→hock→paw. The hock angle is supplied continuously;
 * it is never selected by a discontinuous nearest-knee branch heuristic.
 */
export function solveHindIK(hip,paw,{upper,lower,distal,forward={x:1,y:0},dorsal={x:0,y:1},hockAngle=-.5,bend=1}){
 positive(distal,'distal');finite(hockAngle,'hockAngle');
 const offset=add(mul(dorsal,Math.cos(hockAngle)*distal),mul(forward,Math.sin(hockAngle)*distal));
 const hockTarget=add(paw,offset),ik=solveTwoBoneIK(hip,hockTarget,upper,lower,bend);
 return {knee:ik.joint,hock:ik.end,paw:sub(ik.end,offset),reachError:ik.reachError,reachable:ik.reachable};
}

/** Exact critically damped scalar state. Fixed omega retains a positive
 * impulse response: reachable binary-target histories stay in [0,1].
 * Do not reset velocity on a target reversal. Only tiny FP bounds are clipped. */
export function advanceRestBlend(position,velocity,target,dt,omega=2.5){
 finite(position,'restBlend');finite(velocity,'restBlendVelocity');finite(dt,'rest dt');positive(omega,'rest omega');
 if(position<0||position>1||![0,1].includes(target)||dt<0)throw new RangeError('Invalid bounded rest state/target/time');
 if(dt===0)return {position,velocity};
 const offset=position-target,k=velocity+omega*offset,e=Math.exp(-omega*dt),next=target+(offset+k*dt)*e,v=(velocity-omega*k*dt)*e;
 if(next< -1e-10||next>1+1e-10)throw new RangeError('Rest state velocity is incompatible with bounded target history');
 return {position:clamp(next,0,1),velocity:v};
}

/** Held actions may freeze rest height only once its residual velocity is
 * negligible. This bounds a visible seam; it is not mathematical C1 at freeze.
 * Legacy static snapshots without velocity retain their previous eligibility. */
export function isRestMotionSettled(state,{minBlend=.85,maxVelocity=.002}={}){
 if(!Number.isFinite(minBlend)||minBlend<0||minBlend>1||!Number.isFinite(maxVelocity)||maxVelocity<0)throw new RangeError('Invalid rest readiness gate');
 const velocity=state?.restBlendVelocity??0;
 return Number.isFinite(state?.restBlend)&&state.restBlend>=minBlend&&Number.isFinite(velocity)&&Math.abs(velocity)<=maxVelocity;
}

export function createOsirisRig(options={}){return new OsirisRig(options);}

export class OsirisRig{
 constructor({unit=1,mode='walk',root,facing=1,wallX, stride,acceleration,maxSpeed}={}){
  this.unit=positive(unit,'unit');validMode(mode);this.basisMode=mode==='idle'?'walk':mode;this.mode=mode;
  this.facing=facing<0?-1:1;this.root=checkPoint(root||{x:this.basisMode==='walk'?0:1.08*unit,y:0},'root');
  this.wallX=finite(wallX??this.root.x-1.08*unit,'wallX');
  this.stride=positive(stride??(this.basisMode==='walk'?1.35:.55)*unit,'stride');
  this.acceleration=positive(acceleration??2.5*unit,'acceleration');
  this.maxSpeed=positive(maxSpeed??(this.basisMode==='walk'?1.5:.6)*unit,'maxSpeed');
  this.time=0;this.phase=0;this.nextLift=0;this.orderOrigin=0;this.velocity=0;this.targetSpeed=0;this.restBlend=0;this.restBlendVelocity=0;this.restOmega=2.5;this.rootVelocity={x:0,y:0};
  this.events=[];this.pending=[];this.unsupportedTransition=null;this.jumpState=null;this.lastJumpPhase=null;
  this.legs={};
  const body=this.body(),order=this.basisMode==='walk'?WALK_ORDER:WALL_ORDERS[this.basisMode];
  // Initial all-planted stagger covers the wait until each first liftoff;
  // otherwise the fourth leg would start at the back of its reachable stance.
  for(const id of LIMBS){
   const offset=this.stride*(order.indexOf(id)/4)*.5;
   this.legs[id]={paw:add(this.nominalPaw(id,body),mul(this.axes().travel,offset)),contact:true,swing:null};
  }
 }

 axes(){
  if(this.basisMode==='walk')return {forward:{x:this.facing,y:0},dorsal:{x:0,y:1},travel:{x:this.facing,y:0}};
  return {forward:{x:0,y:this.basisMode==='climb'?1:-1},dorsal:{x:1,y:0},travel:{x:0,y:this.basisMode==='climb'?1:-1}};
 }

 body(){
  const u=this.unit,{forward,dorsal}=this.axes(),wall=this.basisMode!=='walk';
  const breathing=.012*u*Math.sin(this.time*TAU*.22);
  let lift=0,compression=0,jumpPhase=null;
  if(this.jumpState){
   const t=clamp(this.jumpState.elapsed/this.jumpState.duration,0,1);
   if(t<.18){jumpPhase='prepare';compression=-.23*u*smooth(t/.18);}
   else if(t<.30){jumpPhase='push';compression=mix(-.23*u,0,smooth((t-.18)/.12));}
   else if(t<.72){jumpPhase='flight';const z=(t-.30)/.42;lift=4*this.jumpState.height*z*(1-z);}
   else if(t<.84){jumpPhase='front-land';compression=-.18*u*Math.sin(Math.PI*(t-.72)/.12);}
   else {jumpPhase='hind-settle';compression=-.13*u*Math.sin(Math.PI*(t-.84)/.16);}
  }
  const centre=add(this.root,mul(dorsal,(wall?0:1.39*u-.38*u*this.restBlend)+breathing+lift+compression));
  const down=this.basisMode==='descend';
  const chest=add(add(centre,mul(forward,.78*u)),mul(dorsal,(wall?(down?-.08:.02):.06)*u));
  const pelvis=add(add(centre,mul(forward,-.78*u)),mul(dorsal,(wall?(down?.10:0):-.02)*u));
  const neck=add(add(chest,mul(forward,.27*u)),mul(dorsal,.12*u));
  const head=add(add(neck,mul(forward,.30*u)),mul(dorsal,.10*u));
  const nose=add(head,mul(forward,.30*u));
  const tailRoot=add(add(pelvis,mul(forward,-.22*u)),mul(dorsal,.14*u));
  return {centre,chest,pelvis,shoulder:chest,hip:pelvis,neck,head,nose,tailRoot,forward,dorsal,lift,compression,jumpPhase};
 }

 nominalPaw(id,body,root=this.root){
  const front=id.endsWith('F'),u=this.unit;
  if(this.basisMode==='walk')return {x:root.x+this.facing*(front?.91:-.83)*u,y:root.y};
  const reach=this.basisMode==='descend'?(front?1.06:-.89):(front?.94:-.83);
  return {x:this.wallX,y:root.y+body.forward.y*reach*u};
 }

 requestMode(mode){
  validMode(mode);
  if(mode==='idle'){this.mode='idle';this.targetSpeed=0;return true;}
  if(mode!==this.basisMode){
   this.unsupportedTransition={from:this.basisMode,to:mode,reason:'Separate docking/turn animation required'};
   return false;
  }
  this.mode=mode;this.unsupportedTransition=null;return true;
 }

 /** Start only from fully planted horizontal stance, preserving walking phase.
  * distance is positive along facing. Height is world units above baseline.
  */
 jump({distance=2.2*this.unit,height=.65*this.unit,duration=1.4}={}){
  finite(distance,'distance');positive(height,'height');positive(duration,'duration');
  if(distance<0||distance>3*this.unit||height>1.5*this.unit)throw new RangeError('Jump outside experimental reach envelope');
  if(this.basisMode!=='walk'||this.jumpState||LIMBS.some(id=>!this.legs[id].contact))throw new Error('Jump requires a planted horizontal stance');
  const start=point(this.root),end={x:start.x+this.facing*distance,y:start.y};
  this.jumpState={elapsed:0,duration,height,start,end,launch:Object.fromEntries(LIMBS.map(id=>[id,point(this.legs[id].paw)]))};
  this.velocity=0;this.targetSpeed=0;this.rootVelocity={x:0,y:0};this.pending=[];this.lastJumpPhase=null;
  this.events=[];return this.snapshot();
 }

 startSwing(id){
  const leg=this.legs[id];if(leg.swing)return;
  const wall=this.basisMode!=='walk';
  const fraction=wall?.18:.22;
  const duration=clamp(fraction*this.stride/Math.max(this.velocity,.20*this.unit),.08,.65);
  const body=this.body(),travel=this.axes().travel;
  // A spatial foothold covers the coming stance even during acceleration.
  // Predicting it from the instantaneous startup speed leaves a hind foot
  // behind the reachable envelope before its next distance-based liftoff.
  const target=add(this.nominalPaw(id,body),mul(travel,this.stride*(wall?.50:.56)));
  leg.swing={from:point(leg.paw),to:target,elapsed:0,duration};leg.contact=false;
  this.events.push({type:'lift',limb:id,phase:this.phase,time:this.time});
 }

 advanceSwings(dt){
  const wall=this.basisMode!=='walk',down=this.basisMode==='descend',axes=this.axes();
  for(const id of LIMBS){
   const leg=this.legs[id],s=leg.swing;if(!s)continue;
   s.elapsed=Math.min(s.duration,s.elapsed+dt);const z=s.elapsed/s.duration;
   // Smooth endpoints, with a nonnegative clearance along the surface normal.
   const clearance=(wall?(down?.17:.24):.25)*this.unit*Math.sin(Math.PI*z)**2;
   leg.paw=add(lerp(s.from,s.to,smooth(z)),mul(axes.dorsal,clearance));
   if(z>=1){leg.paw=point(s.to);leg.contact=true;leg.swing=null;this.events.push({type:'plant',limb:id,time:this.time,phase:this.phase});}
  }
 }

 advanceJump(dt){
  const j=this.jumpState;j.elapsed=Math.min(j.duration,j.elapsed+dt);const t=j.elapsed/j.duration;
  this.root=lerp(j.start,j.end,smooth((t-.30)/.42));
  const z=clamp((t-.30)/.42,0,1),derivative=30*z*z*(z-1)*(z-1)/(.42*j.duration);
  this.rootVelocity=mul(sub(j.end,j.start),derivative);
  const body=this.body();
  if(body.jumpPhase!==this.lastJumpPhase){this.events.push({type:'jump-phase',phase:body.jumpPhase,time:this.time});this.lastJumpPhase=body.jumpPhase;}
  for(const id of LIMBS){
   const leg=this.legs[id],landing=id.endsWith('F')?.72:.84;
   if(t<.30){leg.paw=point(j.launch[id]);leg.contact=true;continue;}
   // Land into a staggered four-paw stance, ready for the next lateral cycle.
   // Four nominally aligned feet make the third scheduled leg overextend
   // before its first post-jump lift.
   const end=add(this.nominalPaw(id,body,j.end),mul(body.forward,this.stride*(WALK_ORDER.indexOf(id)/4)*.5));
   if(t>=landing){
    if(!leg.contact)this.events.push({type:'plant',limb:id,time:this.time});
    leg.paw=end;leg.contact=true;
   }else{
    if(leg.contact)this.events.push({type:'lift',limb:id,time:this.time});
    leg.contact=false;const z=(t-.30)/(landing-.30);
    const xy=smooth((t-.30)/.42);
    leg.paw=lerp(j.launch[id],end,xy);
    leg.paw.y+=body.lift+(id.endsWith('F')?.30:.38)*this.unit*Math.sin(Math.PI*z)**2;
   }
  }
  if(t>=1){this.root=point(j.end);this.jumpState=null;this.mode='idle';this.targetSpeed=0;
   // Start a new support sequence without changing the continuous distance
   // phase used by the hock pose. Rounding that phase creates a landing jerk.
   this.orderOrigin=this.phase;this.nextLift=this.phase;this.pending=[];
   this.events.push({type:'jump-complete',time:this.time});}
 }

 /** Integrates in small bounded steps so contacts do not depend on frame rate.
  * speed/worldRootSpeed are nonnegative magnitudes in world units/second.
  * step(0, command) changes the command without advancing any animation.
  */
 step(dt,command={}){
  finite(dt,'dt');if(dt<0||dt>10)throw new RangeError('dt must be between 0 and 10 seconds');
  if(command.mode!==undefined)this.requestMode(command.mode);
  const speed=command.worldRootSpeed??command.speed;
  if(speed!==undefined){finite(speed,'speed');if(speed<0)throw new RangeError('Use facing:-1 for negative world direction');this.targetSpeed=clamp(speed,0,this.maxSpeed);}
  if(this.mode==='idle')this.targetSpeed=0;
  this.events=[];
  const count=Math.max(1,Math.ceil(dt*240)),h=dt/count;
  for(let n=0;n<count;n++){
   this.time+=h;
   // Settle the same body into a low quiet stance. Keep the feet where they
   // landed; lifting the body out of rest also uses a timed transition.
   const resting=this.basisMode==='walk'&&this.mode==='idle'&&!this.jumpState&&Math.abs(this.velocity)<EPS&&LIMBS.every(id=>!this.legs[id].swing);
   if(h>0){const next=advanceRestBlend(this.restBlend,this.restBlendVelocity??0,resting?1:0,h,this.restOmega??2.5);this.restBlend=next.position;this.restBlendVelocity=next.velocity;}
   if(this.jumpState){this.advanceJump(h);continue;}
   const previous=this.velocity,change=this.acceleration*h;
   this.velocity+=clamp(this.targetSpeed-this.velocity,-change,change);
   this.rootVelocity=mul(this.axes().travel,this.velocity);
   const travel=(previous+this.velocity)*.5*h;
   this.root=add(this.root,mul(this.axes().travel,travel));this.phase+=travel/this.stride;
   this.advanceSwings(h);
   // Events are distance-based. No phase movement at rest; swings still finish.
   if(travel>0){
    const order=this.basisMode==='walk'?WALK_ORDER:WALL_ORDERS[this.basisMode];
    while(this.nextLift<=this.phase+EPS){this.pending.push(order[Math.round((this.nextLift-this.orderOrigin)*4)%4]);this.nextLift+=.25;}
   }
   const wall=this.basisMode!=='walk';
   if(this.velocity>0&&(!wall||LIMBS.every(id=>!this.legs[id].swing))){
    while(this.pending.length){this.startSwing(this.pending.shift());if(wall)break;}
   }
   // A wall regrip can be queued while the previous foot is still moving.
   // Keep it across a stop, but do not lift again until motion is requested.
  }
  return this.snapshot();
 }

 snapshot(bodyOverride=null){
  // A docking controller may supply a continuous body pose while retaining
  // the same IK solver, skin links and explicit contact/reach checks.
  const body=bodyOverride??this.body(),u=this.unit,{forward,dorsal}=body;
  const determinant=forward.x*dorsal.y-forward.y*dorsal.x;
  const segments=[],legs={},issues=[];
  const segment=(id,from,to,extra={})=>{segments.push({id,from:point(from),to:point(to),length:dist(from,to),angle:Math.atan2(to.y-from.y,to.x-from.x),...extra});};
  for(const id of LIMBS){
   const front=id.endsWith('F'),leg=this.legs[id],base=front?body.chest:body.pelvis;
   const depth=id.startsWith('L')?'near':'far';let joints,error;
   if(front){
    const offset=add(mul(dorsal,.18*u*Math.cos(.3)),mul(forward,-.18*u*Math.sin(.3)));
    const ik=solveTwoBoneIK(base,add(leg.paw,offset),.82*u,.82*u,-Math.sign(determinant));
    const paw=sub(ik.end,offset);error=ik.reachError;
    joints={shoulder:point(base),elbow:ik.joint,wrist:ik.end,paw};
    segment(`${id}.upper`,base,joints.elbow,{limb:id,kind:'upper',depth});
    segment(`${id}.lower`,joints.elbow,joints.wrist,{limb:id,kind:'lower',depth});
    segment(`${id}.foot`,joints.wrist,paw,{limb:id,kind:'foot',depth});
   }else{
    const angle=body.hockAngle??((this.basisMode==='descend'?.45:this.basisMode==='climb'?-.28:-.5)+.08*Math.sin(this.phase*TAU));
    const ik=solveHindIK(base,leg.paw,{upper:.70*u,lower:.66*u,distal:.48*u,forward,dorsal,hockAngle:angle,bend:Math.sign(determinant)});
    error=ik.reachError;joints={hip:point(base),knee:ik.knee,hock:ik.hock,paw:ik.paw};
    segment(`${id}.upper`,base,joints.knee,{limb:id,kind:'upper',depth});
    segment(`${id}.lower`,joints.knee,joints.hock,{limb:id,kind:'lower',depth});
    segment(`${id}.foot`,joints.hock,joints.paw,{limb:id,kind:'foot',depth});
   }
   const contact=leg.contact&&error<1e-6*u;
   if(error>1e-6*u)issues.push({limb:id,type:'unreachable',error});
   legs[id]={joints,contact,requestedContact:leg.contact,contactPoint:contact?point(leg.paw):null,targetPaw:point(leg.paw),reachError:error,swing:leg.swing?clamp(leg.swing.elapsed/leg.swing.duration,0,1):null,depth};
  }
  const tail=[point(body.tailRoot)];
  for(let i=0;i<4;i++){
   const angle=.25+i*.32+.07*Math.sin(this.time*1.6-i*.45);
   tail.push(add(tail.at(-1),add(mul(forward,-Math.cos(angle)*.30*u),mul(dorsal,Math.sin(angle)*.30*u))));
   segment(`tail.${i}`,tail[i],tail[i+1],{kind:'tail',depth:'near'});
  }
  segment('torso',body.pelvis,body.chest,{kind:'torso',depth:'body'});
  segment('neck',body.chest,body.neck,{kind:'neck',depth:'body'});
  segment('head',body.neck,body.nose,{kind:'head',depth:'body'});
  return {mode:this.jumpState?'jump':this.mode,basisMode:this.basisMode,time:this.time,phase:this.phase,velocity:this.velocity,restBlend:this.restBlend,restBlendVelocity:this.restBlendVelocity??0,worldRootSpeed:point(this.rootVelocity),root:point(this.root),body,
   joints:{shoulder:point(body.chest),hip:point(body.pelvis),head:point(body.head),neck:point(body.neck),nose:point(body.nose),tailRoot:point(body.tailRoot),tail,...Object.fromEntries(LIMBS.map(id=>[id,legs[id].joints]))},
   legs,segments,contacts:Object.fromEntries(LIMBS.map(id=>[id,legs[id].contact])),events:this.events.map(e=>({...e})),issues,unsupportedTransition:this.unsupportedTransition?{...this.unsupportedTransition}:null,
   limitations:['Profile 2D projection; no collision, grip force or body torque solver.','No horizontal/wall docking, wall turn, target ledge or terrain adaptation.','IK reach failure is reported; it never counts as a planted contact.','Fixed link lengths and support counts do not establish natural animal motion.']};
 }
}
