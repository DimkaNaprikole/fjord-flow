/** Separate head-first WALL→FLOOR experiment; not a reversed floor→wall clip.
 * World x right, y UP. Input: stationary descend rig to the right of wallX,
 * four real wall contacts, head down. Output: the same bones facing right on
 * floorY. L/R identity and determinant +1 are preserved throughout the turn.
 *
 * const dock=createWallFloorDock(pose,{unit:45,wallX:740,floorY:0,duration:3.2});
 * pose=dock.step(dt); if(dock.done)rig=dock.targetRig;
 * step(0) holds exactly. Errors are WallFloorDockError {code,diagnostics}.
 *
 * Lower front paw searches the floor first; upper rear releases the wall
 * first. Three other world contacts stay fixed during every transfer.
 * Torso-centre disk projection protects reach, never stretches bones or
 * pretends an unreachable target is a contact. This proves only geometric
 * reach/support count: gravity, friction, torque and collision are NOT solved.
 */
import {createOsirisRig,LIMBS} from './rig-kinematics.mjs';
const TAU=2*Math.PI;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n,0,1);return n*n*n*(10+n*(-15+6*n));};
const mix=(a,b,t)=>a+(b-a)*t;
const point=p=>({x:p.x,y:p.y});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mul=(p,s)=>({x:p.x*s,y:p.y*s});
const lerp=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const isPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);

export class WallFloorDockError extends Error{
 constructor(code,message,diagnostics={}){super(message);this.name='WallFloorDockError';this.code=code;this.diagnostics=diagnostics;}
}
const reject=(code,message,data)=>{throw new WallFloorDockError(code,message,data);};

// Dykstra projection onto the same fixed-link reach disks used by the IK.
// Correction vectors make this nearest-point projection deterministic rather
// than dependent on which limb happens to be visited last.
function projectCentre(desired,disks,rail){
 const constraints=[...disks.map(d=>p=>{
  const n=distance(p,d.centre);
  return n>d.radius?add(d.centre,mul(sub(p,d.centre),d.radius/n)):point(p);
 }),p=>({x:clamp(p.x,rail.minX,rail.maxX),y:clamp(p.y,rail.minY,rail.maxY)})];
 let current=point(desired);const corrections=constraints.map(()=>({x:0,y:0}));
 for(let pass=0;pass<200;pass++){
  const before=current;
  for(let i=0;i<constraints.length;i++){
   const input=add(current,corrections[i]),result=constraints[i](input);
   corrections[i]=sub(input,result);current=result;
  }
  if(pass>8&&distance(before,current)<1e-10)break;
 }
 return current;
}

export function createWallFloorDock(fromSnapshot,{unit=45,wallX=740,floorY=0,duration=3.2}={}){
 return new WallFloorDock(fromSnapshot,{unit,wallX,floorY,duration});
}

export class WallFloorDock{
 constructor(from,{unit=45,wallX=740,floorY=0,duration=3.2}={}){
  if(!Number.isFinite(unit)||unit<=0||!Number.isFinite(wallX)||!Number.isFinite(floorY)||!Number.isFinite(duration)||duration<=0)
   reject('invalid-options','Finite surfaces and positive unit/duration are required');
  if(!from?.body||!from.joints||!isPoint(from.body.centre)||!isPoint(from.body.forward)||!isPoint(from.body.dorsal)||!isPoint(from.body.nose)||!isPoint(from.root)||!Number.isFinite(from.time)||!Number.isFinite(from.phase))
   reject('invalid-snapshot','A complete finite rig snapshot is required');
  if(from.basisMode!=='descend'||!['descend','idle'].includes(from.mode)||from.body.forward.y>-.999999||Math.abs(from.body.forward.x)>1e-6||from.body.dorsal.x<.999999)
   reject('unsupported-facing','A head-first descend rig is required; no rotation/reverse fallback');
  if(LIMBS.some(id=>{
   const j=from.joints?.[id];
   return !from.contacts?.[id]||!isPoint(j?.paw)||!isPoint(id.endsWith('F')?j?.shoulder:j?.hip)||!isPoint(id.endsWith('F')?j?.elbow:j?.knee);
  })||from.issues?.length)reject('not-planted','All four reachable wall contacts must be planted');
  if(Math.abs(from.velocity??0)>1e-6*unit)reject('still-moving','Brake and finish regrips before searching for the floor');
  if(LIMBS.some(id=>{
   const j=from.joints[id];return Math.abs(distance(id.endsWith('F')?j.shoulder:j.hip,id.endsWith('F')?j.elbow:j.knee)-(id.endsWith('F')?.82:.70)*unit)>1e-5*unit;
  }))reject('unit-mismatch','Input bones do not match unit');
  const rootDistance=(from.root.x-wallX)/unit,stopHeight=(from.root.y-floorY)/unit;
  if(rootDistance<.80||rootDistance>1.40||stopHeight<1.35||stopHeight>2.5)
   reject('too-far','Entry root must be .8–1.4 units outside the wall and 1.35–2.5 units above the floor',{rootDistance,stopHeight});
  if(LIMBS.some(id=>Math.abs(from.joints[id].paw.x-wallX)>1e-5*unit||from.joints[id].paw.y<floorY-1e-5*unit)||from.body.nose.y<floorY-1e-5*unit)
   reject('unsupported-surface','Entry feet must be on this wall and the head must not already penetrate the floor');

  this.unit=unit;this.wallX=wallX;this.floorY=floorY;this.duration=duration;
  this.from=structuredClone(from);this.elapsed=0;this.done=false;
  this.targetRig=createOsirisRig({unit,mode:'walk',facing:1,root:{x:wallX+1.08*unit,y:floorY}});
  Object.assign(this.targetRig,{time:from.time+duration,phase:from.phase,orderOrigin:from.phase,nextLift:from.phase,velocity:0,targetSpeed:0});
  this.targetPose=this.targetRig.snapshot();
  const fronts=['RF','LF'].sort((a,b)=>from.joints[a].paw.y-from.joints[b].paw.y);
  const rears=['RH','LH'].sort((a,b)=>from.joints[b].paw.y-from.joints[a].paw.y);
  this.order=[...fronts,...rears];
  const windows=[[0,.23],[.23,.46],[.46,.69],[.69,.93]];
  this.windows=Object.fromEntries(this.order.map((id,i)=>[id,windows[i]]));

  // At the rear handover both hip→hock chains have the SAME distal offset.
  // A span over 2*(.70+.66) cannot be fixed by any torso trajectory or turn.
  const retained=rears[1],first=rears[0];
  const span=distance(from.joints[retained].paw,this.targetPose.joints[first].paw),maximum=2*(.70+.66)*unit;
  if(span>maximum-1e-5*unit)
   reject('unreachable','Retained rear wall grip is too high for a three-support transfer; descend to a lower rear regrip first',{
    reason:'rear-support-span',remainingWallLimb:retained,firstFloorLimb:first,supportSpan:span,maxSupportSpan:maximum,stopHeight,
    accepted:false,requiresLowerRearGrip:true});

  this.solver=createOsirisRig({unit,mode:'descend',root:from.root,wallX});
  Object.assign(this.solver,{time:from.time,phase:from.phase,orderOrigin:from.phase,nextLift:from.phase,velocity:0,targetSpeed:0});
  this.startCentre=sub(from.body.centre,mul(from.body.dorsal,.012*unit*Math.sin(from.time*TAU*.22)));
  this.startNoseClearance=Math.min(.02*unit,from.body.nose.y-floorY);
  this.endCentre={x:this.targetRig.root.x,y:floorY+1.39*unit};
  this.diagnostics={accepted:false,order:[...this.order],stopHeight,samples:0,maxReachError:0,maxCentreCorrection:0,minContacts:4};
  const samples=Math.max(240,Math.ceil(duration*240));let worst=null;
  for(let n=0;n<=samples;n++){
   const pose=this.evaluate(n/samples),contacts=Object.values(pose.contacts).filter(Boolean).length;
   this.diagnostics.samples++;this.diagnostics.minContacts=Math.min(this.diagnostics.minContacts,contacts);
   this.diagnostics.maxCentreCorrection=Math.max(this.diagnostics.maxCentreCorrection,pose.dock.centreCorrection);
   for(const issue of pose.issues){
    this.diagnostics.maxReachError=Math.max(this.diagnostics.maxReachError,issue.error);
    if(!worst||issue.error>worst.error)worst={...issue,progress:n/samples};
   }
  }
  if(worst||this.diagnostics.minContacts<3)
   reject('unreachable','No verified three-support wall→floor path for this stance; change the stopping/regrip height',{...this.diagnostics,worst});
  this.diagnostics.accepted=true;this.current=this.evaluate(0);
 }

 bodyAt(t,paws){
  const u=this.unit,turn=smooth((t-.20)/.70),phi=turn*Math.PI/2;
  const forward={x:Math.sin(phi),y:-Math.cos(phi)},dorsal={x:Math.cos(phi),y:Math.sin(phi)};
  const fore=mix(-.08,.06,turn)*u,hind=mix(.10,-.02,turn)*u;
  const hockAngle=mix(.45,-.5,turn)+.08*Math.sin(this.from.phase*TAU);
  const time=this.from.time+t*this.duration,breathing=.012*u*Math.sin(time*TAU*.22);
  // Independently designed descent: shift away from the wall to seek the
  // floor, lower the chest, then bring the hips down after the front grips.
  const earlyHeight=mix(this.startCentre.y,this.floorY+1.70*u,smooth(t/.35));
  const desired=add({x:mix(this.startCentre.x,this.endCentre.x,smooth(t))+.30*u*Math.sin(Math.PI*t)**2,
   y:mix(earlyHeight,this.endCentre.y,smooth((t-.46)/.54))},mul(dorsal,breathing));
  const frontOffset=add(mul(dorsal,.18*u*Math.cos(.3)),mul(forward,-.18*u*Math.sin(.3)));
  const rearOffset=add(mul(dorsal,.48*u*Math.cos(hockAngle)),mul(forward,.48*u*Math.sin(hockAngle)));
  const disks=LIMBS.map(id=>{
   const front=id.endsWith('F'),baseOffset=add(mul(forward,(front?.78:-.78)*u),mul(dorsal,front?fore:hind));
   return {centre:sub(add(paws[id],front?frontOffset:rearOffset),baseOffset),radius:(front?1.64:1.36)*u-.015*u*Math.sin(Math.PI*t)**2};
  });
  const noseOffset=add(mul(forward,1.65*u),mul(dorsal,fore+.22*u));
  const hipOffset=add(mul(forward,-.78*u),mul(dorsal,hind));
  const noseClearance=mix(this.startNoseClearance,.02*u,smooth(t/.35));
  const rail={minX:Math.max(this.wallX+.65*u,this.wallX+.04*u-hipOffset.x),maxX:this.wallX+2.6*u,
   minY:Math.max(this.floorY+.80*u,this.floorY+noseClearance-noseOffset.y),maxY:this.floorY+3.2*u};
  const centre=projectCentre(desired,disks,rail);
  const chest=add(add(centre,mul(forward,.78*u)),mul(dorsal,fore));
  const pelvis=add(add(centre,mul(forward,-.78*u)),mul(dorsal,hind));
  const neck=add(add(chest,mul(forward,.27*u)),mul(dorsal,.12*u));
  const head=add(add(neck,mul(forward,.30*u)),mul(dorsal,.10*u));
  const nose=add(head,mul(forward,.30*u));
  const tailRoot=add(add(pelvis,mul(forward,-.22*u)),mul(dorsal,.14*u));
  return {body:{centre,chest,pelvis,shoulder:chest,hip:pelvis,neck,head,nose,tailRoot,forward,dorsal,hockAngle,lift:0,compression:0,jumpPhase:null},correction:distance(centre,desired)};
 }

 evaluate(t){
  t=clamp(t,0,1);const paws={},contacts={},soleAxes={};
  for(const id of LIMBS){
   const [start,end]=this.windows[id],z=clamp((t-start)/(end-start),0,1);
   // Sole orientation is metadata for the skin, independent of body/IK.
   // Wall-down (-pi/2) → floor-right (0), one paw's window at a time.
   const soleAngle=-Math.PI/2+Math.PI/2*smooth(z);
   soleAxes[id]=z===0?{x:0,y:-1}:z===1?{x:1,y:0}:{x:Math.cos(soleAngle),y:Math.sin(soleAngle)};
   const source=this.from.joints[id].paw,target=this.targetPose.joints[id].paw;
   let swing=null;
   if(z===0){paws[id]=point(source);contacts[id]=true;}
   else if(z===1){paws[id]=point(target);contacts[id]=true;}
   else{
    // Search downward before advancing right. Rear paws stay close to the
    // wall until below the hips; this avoids passing the hock through hip.
    const xProgress=id.endsWith('F')?smooth(z):smooth((z-.35)/.65);
    const yProgress=smooth(z/(id.endsWith('F')?.75:.80));
    const arc=.10*this.unit*Math.sin(Math.PI*z)**2;
    paws[id]=add({x:mix(source.x,target.x,xProgress),y:mix(source.y,target.y,yProgress)},
     {x:arc*Math.cos(z*Math.PI/2),y:arc*Math.sin(z*Math.PI/2)});
    contacts[id]=false;swing={elapsed:z,duration:1};
   }
   this.solver.legs[id]={paw:paws[id],contact:contacts[id],swing};
  }
  const {body,correction}=this.bodyAt(t,paws);
  this.solver.time=this.from.time+t*this.duration;
  this.solver.root=lerp(this.from.root,this.targetRig.root,smooth(t));
  this.solver.rootVelocity=mul(sub(this.targetRig.root,this.from.root),30*t*t*(t-1)*(t-1)/this.duration);
  const pose=this.solver.snapshot(body);pose.mode='dock';pose.basisMode='transition';pose.done=t===1;
  for(const id of LIMBS)pose.legs[id].soleAxis=soleAxes[id];
  pose.dock={direction:'wall-floor',progress:t,order:[...this.order],activeLimb:this.order.find(id=>!contacts[id])??null,centreCorrection:correction,geometryOnly:true};
  pose.limitations=[...pose.limitations,'Wall→floor is a separate geometric transfer, not a reverse floor→wall clip.','Gravity, friction, grip strength, torque and obstacle collision are not simulated.','Only a stationary head-first entry and right-facing floor exit are supported.','Too-high retained rear grips require further descent/regripping before this transfer.'];
  return pose;
 }

 snapshot(){return this.current;}

 step(dt){
  if(!Number.isFinite(dt)||dt<0)reject('invalid-dt','dt must be finite and nonnegative');
  if(dt===0||this.done)return this.current;
  const previous=this.elapsed/this.duration;
  this.elapsed=Math.min(this.duration,this.elapsed+dt);
  if(this.duration-this.elapsed<1e-12*this.duration)this.elapsed=this.duration;
  const t=this.elapsed/this.duration,pose=this.evaluate(t);pose.events=[];
  for(const id of this.order){
   const [start,end]=this.windows[id];
   if(previous<=start&&t>start)pose.events.push({type:'lift',limb:id,time:this.from.time+start*this.duration});
   if(previous<end&&t>=end)pose.events.push({type:'plant',limb:id,time:this.from.time+end*this.duration});
  }
  if(pose.issues.length){pose.dock.failed=true;this.current=pose;return pose;}
  if(t===1){
   this.done=true;this.current=this.targetRig.snapshot();this.current.done=true;
   this.current.dock={...pose.dock,complete:true};this.current.events=pose.events;
  }else this.current=pose;
  return this.current;
 }
}
