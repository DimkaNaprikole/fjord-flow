/** Experimental floor→wall docking for the SAME profile bones/skin.
 * World coordinates are x right, y UP (as in rig-kinematics.mjs).
 * Input: a stationary all-planted walk/idle snapshot, facing LEFT, on the
 * floor to the RIGHT of wallX. No mirroring, reskinning or bone scaling.
 *
 * const dock=createFloorWallDockClearance(pose,{unit:45,wallX:740,duration:3.2});
 * pose=dock.step(dt); if(dock.done) Object.assign(rig,structuredClone(dock.targetRig));
 * step(0) is a pure hold; completion is time-based and never forced by stop.
 * Rejections throw FloorWallDockClearanceError with code and geometric diagnostics.
 *
 * One paw moves at a time; all other paw targets remain fixed in WORLD.
 * Rear order is farthest-from-wall first, leaving the nearer floor support.
 * A convex disk projection adjusts the proposed torso centre to preserve
 * reach, never the contact targets or link lengths. Infeasible poses reject
 * during sampled preflight; runtime IK errors remain explicit as a backup.
 * Preflight checks sampled reach, support count and geometric clearance reserves.
 * Grip forces, balance and naturalness still require separate review.
 */
import {createOsirisRig,LIMBS} from './rig-kinematics.mjs';
import {createDockDistalSolver,distalFrameOffset} from './dock-distal-frame-rig.mjs';

const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*x*(10+x*(-15+6*x));};
const mix=(a,b,t)=>a+(b-a)*t;
const p=a=>({x:a.x,y:a.y});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mul=(a,s)=>({x:a.x*s,y:a.y*s});
const lerp=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const finitePoint=a=>a&&Number.isFinite(a.x)&&Number.isFinite(a.y);
function silhouetteRail(u,f,d,fore,hind,time){
 let x=0,y=0;const include=(q,rx=0,ry=rx)=>{x=Math.max(x,rx-q.x);y=Math.max(y,ry-q.y);};
 for(const [offset,rf,rd]of [[{x:0,y:0},1.045,.332],[add(mul(f,.78*u),mul(d,fore)),.36,.329],[add(mul(f,-.78*u),mul(d,hind)),.37,.327]])include(offset,u*Math.hypot(f.x*rf,d.x*rd)+.01*u,u*Math.hypot(f.y*rf,d.y*rd)+.01*u);
 const head=add(mul(f,1.35*u),mul(d,fore+.22*u));for(const a of [-.4,.60])for(const b of [-.30,.87])include(add(head,add(mul(f,a*u),mul(d,b*u))),.01*u);
 let tail=add(mul(f,-u),mul(d,hind+.14*u));include(tail,.131*u);for(let i=0;i<4;i++){const angle=.25+i*.32+.07*Math.sin(time*1.6-i*.45);tail=add(tail,add(mul(f,-Math.cos(angle)*.30*u),mul(d,Math.sin(angle)*.30*u)));include(tail,(.105*Math.pow(1-(i+1)/4,.75)+.026)*u);}
 return {x,y};
}
function limbClearance(p,wall,floor,u){let worst={clearance:Infinity};for(const id of LIMBS)for(const [name,q]of Object.entries(p.joints[id])){const radius=(name==='paw'?0:name==='wrist'?.105:name==='elbow'?.15:name==='shoulder'?.1775:name==='hip'?.207:name==='knee'?.17:.11)*u;for(const [axis,plane]of [['x',wall],['y',floor]]){const clearance=q[axis]-plane-radius;if(clearance<worst.clearance)worst={clearance,limb:id,joint:name,axis,radius};}}return worst;}
function poseGap(a,b){let gap=0;for(const id of LIMBS)for(const [name,q]of Object.entries(a.joints[id]))gap=Math.max(gap,distance(q,b.joints[id][name]));for(const name of ['centre','chest','pelvis','head','neck','nose','tailRoot'])gap=Math.max(gap,distance(a.body[name],b.body[name]));for(let i=0;i<a.joints.tail.length;i++)gap=Math.max(gap,distance(a.joints.tail[i],b.joints.tail[i]));return gap;}

export class FloorWallDockClearanceError extends Error{
 constructor(code,message,diagnostics={}){super(message);this.name='FloorWallDockClearanceError';this.code=code;this.diagnostics=diagnostics;}
}
const reject=(code,message,data)=>{throw new FloorWallDockClearanceError(code,message,data);};

/** Nearest feasible centre for four fixed-radius IK reach disks. Dykstra's
 * corrections avoid depending on constraint iteration order. Rail constraints
 * prevent an otherwise reachable torso from passing far through the wall or
 * below the floor. Tiny reach reserve avoids a straight singular knee.
 */
function projectCentre(proposed,disks,rail){
 const constraints=[...disks.map(d=>x=>{
  const length=distance(x,d.centre);
  return length>d.radius?add(d.centre,mul(sub(x,d.centre),d.radius/length)):p(x);
 }),x=>({x:clamp(x.x,rail.minX,rail.maxX),y:clamp(x.y,rail.minY,rail.maxY)})];
 const corrections=constraints.map(()=>({x:0,y:0}));let centre=p(proposed);
 for(let n=0;n<160;n++){
  const before=centre;
  for(let i=0;i<constraints.length;i++){
   const input=add(centre,corrections[i]),output=constraints[i](input);
   corrections[i]=sub(input,output);centre=output;
  }
  if(n>8&&distance(before,centre)<1e-10)break;
 }
 return centre;
}

export function createFloorWallDockClearance(fromSnapshot,{unit=1,wallX=0,duration=4,targetHeight=2*unit}={}){
 return new FloorWallDockClearance(fromSnapshot,{unit,wallX,duration,targetHeight});
}

export class FloorWallDockClearance{
 constructor(from,{unit=1,wallX=0,duration=4,targetHeight=2*unit}={}){
  if(!Number.isFinite(unit)||unit<=0||!Number.isFinite(wallX)||!Number.isFinite(duration)||duration<=0)
   reject('invalid-options','Finite wallX and positive unit/duration are required');
  if(!from?.body||!finitePoint(from.body.centre)||!finitePoint(from.body.forward)||!finitePoint(from.body.dorsal)||!finitePoint(from.body.nose)||!finitePoint(from.root)||!Number.isFinite(from.time)||!Number.isFinite(from.phase))
   reject('invalid-snapshot','A complete finite rig snapshot is required');
  if(from.basisMode!=='walk'||!['walk','idle'].includes(from.mode)||from.body.forward.x>-.999999||Math.abs(from.body.forward.y)>1e-6||from.body.dorsal.y<.999999)
   reject('unsupported-facing','Dock requires a horizontal walk rig facing left');
  if(LIMBS.some(id=>{
   const j=from.legs?.[id]?.joints;
   return !from.contacts?.[id]||!finitePoint(j?.paw)||!finitePoint(id.endsWith('F')?j?.shoulder:j?.hip)||!finitePoint(id.endsWith('F')?j?.elbow:j?.knee);
  })||from.issues?.length)
   reject('not-planted','All four real, reachable contacts must be planted');
  if(Math.abs(from.velocity??0)>1e-6*unit)
   reject('still-moving','Finish braking and placement before docking');
  const lengths=LIMBS.map(id=>{const j=from.legs[id].joints;return distance(id.endsWith('F')?j.shoulder:j.hip,id.endsWith('F')?j.elbow:j.knee);});
  if(lengths.some((n,i)=>Math.abs(n-(LIMBS[i].endsWith('F')?.82:.70)*unit)>1e-5*unit))
   reject('unit-mismatch','Input link lengths do not match the requested unit');
  const floorY=from.root.y,distanceToWall=(from.root.x-wallX)/unit;
  if(distanceToWall<1.2||distanceToWall>2.2)
   reject('too-far','Root must be 1.2–2.2 units to the right of the wall',{distanceToWall});
  if(LIMBS.some(id=>Math.abs(from.legs[id].joints.paw.y-floorY)>1e-5*unit||from.legs[id].joints.paw.x<wallX-1e-5*unit))
   reject('unsupported-surface','Input feet must be on the floor, outside the wall');

  if(!Number.isFinite(targetHeight)||targetHeight<1.9*unit||targetHeight>2.5*unit)reject('invalid-target','Target climb height must be 1.9–2.5U');
  this.unit=unit;this.wallX=wallX;this.floorY=floorY;this.duration=duration;
  this.from=structuredClone(from);this.elapsed=0;this.done=false;
  this.motion={turnStart:.18,turnLength:.50,earlyHeight:1.75,earlyTime:.35};
  this.targetRig=createOsirisRig({unit,mode:'climb',wallX,root:{x:wallX+1.08*unit,y:floorY+targetHeight}});
  Object.assign(this.targetRig,{time:from.time+duration,phase:from.phase,orderOrigin:from.phase,nextLift:from.phase,velocity:0,targetSpeed:0});
  this.targetPose=this.targetRig.snapshot();
  this.hockAngles={};for(const id of ['RH','LH']){const angle=s=>{const j=s.joints[id],v=sub(j.hock,j.paw),f=s.body.forward,d=s.body.dorsal;return Math.atan2(v.x*f.x+v.y*f.y,v.x*d.x+v.y*d.y);};this.hockAngles[id]=[angle(from),angle(this.targetPose)];}
  this.solver=createDockDistalSolver({unit,facing:-1,root:from.root});
  Object.assign(this.solver,{phase:from.phase,orderOrigin:from.phase,nextLift:from.phase,time:from.time,velocity:0,targetSpeed:0});
  const rears=['RH','LH'].sort((a,b)=>from.legs[b].joints.paw.x-from.legs[a].joints.paw.x);
  this.order=['RF','LF',...rears];
  const windows=[[0,.22],[.22,.44],[.44,.68],[.68,.92]];
  this.windows=Object.fromEntries(this.order.map((id,i)=>[id,windows[i]]));
  this.startCentre=sub(from.body.centre,mul(from.body.dorsal,.012*unit*Math.sin(from.time*TAU*.22)));
  this.startNoseClearance=Math.min(0,from.body.nose.x-wallX);
  this.lastProgress=0;this.diagnostics={accepted:false,order:[...this.order],samples:0,maxReachError:0,maxCentreCorrection:0,minContacts:4};

  // Check the concrete stance and phase, not just nominal root distance.
  // No solver state is advanced by this deterministic analytic sampling.
  const count=Math.max(240,Math.ceil(duration*240));let worst=null;
  for(let i=0;i<=count;i++){
   const pose=this.evaluate(i/count),contacts=Object.values(pose.contacts).filter(Boolean).length;
   const clearance=limbClearance(pose,wallX,floorY,unit);
   if(!Number.isFinite(clearance.clearance)||[...LIMBS.flatMap(id=>Object.values(pose.joints[id])),...pose.joints.tail].some(q=>!finitePoint(q)))reject('invalid-path','Nonfinite actual joint in preflight',{progress:i/count});
   if(clearance.clearance<(this.diagnostics.minJointClearance??Infinity)){this.diagnostics.minJointClearance=clearance.clearance;this.diagnostics.worstClearance={...clearance,progress:i/count};}
   if(clearance.clearance< -1e-7*unit)reject('surface-clearance','Actual joints and their skin-radius reserves cross a surface',{...this.diagnostics});
   this.diagnostics.samples++;
   this.diagnostics.minContacts=Math.min(this.diagnostics.minContacts,contacts);
   this.diagnostics.maxCentreCorrection=Math.max(this.diagnostics.maxCentreCorrection,pose.dock.centreCorrection);
   for(const issue of pose.issues){
    this.diagnostics.maxReachError=Math.max(this.diagnostics.maxReachError,issue.error);
    if(!worst||issue.error>worst.error)worst={...issue,progress:i/count};
   }
  }
  if(worst||this.diagnostics.minContacts<3)
   reject('unreachable','This stance has no verified three-support docking path; align the floor feet before retrying',{...this.diagnostics,worst});
  this.diagnostics.sourceGap=poseGap(this.evaluate(0),from);this.diagnostics.targetGap=poseGap(this.evaluate(1),this.targetPose);
  if(Math.max(this.diagnostics.sourceGap,this.diagnostics.targetGap)>1e-6*unit)reject('handoff-gap','Clearance constraints cannot preserve this native endpoint',{...this.diagnostics});
  this.diagnostics.accepted=true;this.current=this.evaluate(0);
 }

 bodyAt(t,paws,distalFrames){
  const u=this.unit,time=this.from.time+t*this.duration;
  const turn=smooth((t-this.motion.turnStart)/this.motion.turnLength),phi=turn*Math.PI/2;
  const forward={x:-Math.cos(phi),y:Math.sin(phi)},dorsal={x:Math.sin(phi),y:Math.cos(phi)};
  const fore=mix(.06,.02,turn)*u,hind=mix(-.02,0,turn)*u;
  const hockAngle=mix(-.5,-.28,turn)+.08*Math.sin(this.from.phase*TAU);
  const breathing=.012*u*Math.sin(time*TAU*.22);
  const earlyHeight=mix(this.startCentre.y,this.floorY+this.motion.earlyHeight*u,smooth(t/this.motion.earlyTime));
  const proposed={x:mix(this.startCentre.x,this.targetRig.root.x,smooth(t)),
   y:mix(earlyHeight,this.targetRig.root.y,smooth((t-.44)/.56))};
  const desired=add(proposed,mul(dorsal,breathing));
  const disks=LIMBS.map(id=>{
   const front=id.endsWith('F');
   const jointOffset=add(mul(forward,(front?.78:-.78)*u),mul(dorsal,front?fore:hind));
   const reserve=.02*u*Math.sin(Math.PI*t)**2;
   return {centre:sub(add(paws[id],distalFrameOffset(id,distalFrames[id],u)),jointOffset),radius:(front?1.64:1.36)*u-reserve};
  });
  // The endpoint gate rejects a source that these clearance rails would move.
  const noseOffset=add(mul(forward,1.65*u),mul(dorsal,fore+.22*u));
  const allowedNose=mix(this.startNoseClearance,.02*u,smooth(t/.44));
  const silhouette=silhouetteRail(u,forward,dorsal,fore,hind,time);
  const rail={minX:Math.max(this.wallX+.60*u,this.wallX+allowedNose-noseOffset.x,this.wallX+silhouette.x),maxX:this.wallX+2.4*u,
   minY:Math.max(this.floorY+.65*u,this.floorY+silhouette.y),maxY:this.floorY+2.6*u};
  const centre=projectCentre(desired,disks,rail);
  const chest=add(add(centre,mul(forward,.78*u)),mul(dorsal,fore));
  const pelvis=add(add(centre,mul(forward,-.78*u)),mul(dorsal,hind));
  const neck=add(add(chest,mul(forward,.27*u)),mul(dorsal,.12*u));
  const head=add(add(neck,mul(forward,.30*u)),mul(dorsal,.10*u));
  const nose=add(head,mul(forward,.30*u));
  const tailRoot=add(add(pelvis,mul(forward,-.22*u)),mul(dorsal,.14*u));
  return {body:{centre,chest,pelvis,shoulder:chest,hip:pelvis,neck,head,nose,tailRoot,forward,dorsal,hockAngle,distalFrames,lift:0,compression:0,jumpPhase:null},correction:distance(centre,desired)};
 }

 evaluate(t){
  t=clamp(t,0,1);const paws={},contacts={},swings={},soleAxes={},distalFrames={};
  for(const id of LIMBS){
   const [start,end]=this.windows[id],z=clamp((t-start)/(end-start),0,1);
   // Skin orientation follows THIS paw's surface transfer, not torso tilt.
   // Floor-left (pi) → wall-up (pi/2), with exact planted endpoints.
   const soleAngle=Math.PI-Math.PI/2*smooth(z);
   soleAxes[id]=z===0?{x:-1,y:0}:z===1?{x:0,y:1}:{x:Math.cos(soleAngle),y:Math.sin(soleAngle)};
   distalFrames[id]={forward:p(soleAxes[id]),dorsal:{x:soleAxes[id].y,y:-soleAxes[id].x},hockAngle:id.endsWith('F')?0:mix(...this.hockAngles[id],smooth(z))};
   const source=this.from.legs[id].joints.paw,target=this.targetPose.legs[id].joints.paw;
   if(z===0){paws[id]=p(source);contacts[id]=true;swings[id]=null;}
   else if(z===1){paws[id]=p(target);contacts[id]=true;swings[id]=null;}
   else{
    const arc=.10*this.unit*Math.sin(Math.PI*z)**2;
    // Reach wallwards before lifting a front paw past shoulder height. A
    // straight diagonal can cross the shoulder, folding equal fore bones
    // almost to zero and spinning the elbow despite a constant IK branch.
    const along=lerp(source,target,smooth(z));
    along.x=mix(source.x,target.x,smooth(z/(id.endsWith('F')?.65:.75)));
    paws[id]=add(along,{x:arc*Math.sin(z*Math.PI/2),y:arc*Math.cos(z*Math.PI/2)});
    contacts[id]=false;swings[id]=z;
   }
   this.solver.legs[id]={paw:paws[id],contact:contacts[id],swing:swings[id]===null?null:{elapsed:swings[id],duration:1}};
  }
  const {body,correction}=this.bodyAt(t,paws,distalFrames);
  this.solver.time=this.from.time+t*this.duration;
  this.solver.root=lerp(this.from.root,this.targetRig.root,smooth(t));
  this.solver.rootVelocity=mul(sub(this.targetRig.root,this.from.root),30*t*t*(t-1)*(t-1)/this.duration);
  const pose=this.solver.snapshot(body);
  for(const id of LIMBS)pose.legs[id].soleAxis=soleAxes[id];
  pose.restBlend=(this.from.restBlend??0)*(1-smooth(t));
  pose.mode='dock';pose.basisMode='transition';pose.done=t===1;
  pose.dock={progress:t,order:[...this.order],activeLimb:this.order.find(id=>!contacts[id])??null,centreCorrection:correction,geometryOnly:true};
  pose.limitations=[...pose.limitations,'Dock support count is geometric; grip, torque and obstacle collision are not simulated.','Only stationary left-facing floor→wall entry is supported; no wall→floor or descending dock.','No preliminary floor regrips are implemented; infeasible stances reject before animation.'];
  return pose;
 }

 snapshot(){return this.current;}

 step(dt){
  if(!Number.isFinite(dt)||dt<0)reject('invalid-dt','dt must be finite and nonnegative');
  if(dt===0||this.done)return this.current;
  const previous=this.elapsed/this.duration;
  this.elapsed=Math.min(this.duration,this.elapsed+dt);
  if(this.duration-this.elapsed<1e-12*this.duration)this.elapsed=this.duration;
  const t=this.elapsed/this.duration;
  const pose=this.evaluate(t);pose.events=[];
  for(const id of this.order){
   const [start,end]=this.windows[id];
   if(previous<=start&&t>start)pose.events.push({type:'lift',limb:id,time:this.from.time+start*this.duration});
   if(previous<end&&t>=end)pose.events.push({type:'plant',limb:id,time:this.from.time+end*this.duration});
  }
  // Never promote an IK failure to a contact. Keep the explicit issues for
  // callers even if an unsampled edge case escaped construction preflight.
  if(pose.issues.length){pose.dock.failed=true;this.current=pose;return pose;}
  if(t===1){
   this.done=true;
   // Return the very target rig, including breathing, tail clock and hock
   // phase. Switching controller ownership therefore changes no joints.
   this.current=this.targetRig.snapshot();this.current.done=true;
   this.current.dock={...pose.dock,complete:true};this.current.events=pose.events;
  }else this.current=pose;
  this.lastProgress=t;return this.current;
 }
}

