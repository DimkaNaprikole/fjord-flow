/** Separate head-first WALL→FLOOR experiment; not a reversed floor→wall clip.
 * World x right, y UP. Input: stationary descend rig to the right of wallX,
 * four real wall contacts, head down. Output: the same bones facing right on
 * floorY. L/R identity and determinant +1 are preserved throughout the turn.
 *
 * const dock=createWallFloorDockClearance(pose,{unit:45,wallX:740,floorY:0,duration:3.2});
 * pose=dock.step(dt); if(dock.done)Object.assign(rig,structuredClone(dock.targetRig));
 * step(0) holds exactly. Errors are WallFloorDockClearanceError {code,diagnostics}.
 *
 * The front transfer with the smaller actual wrist support span goes first;
 * the upper rear releases the wall
 * first. Three other world contacts stay fixed during every transfer.
 * Torso-centre disk projection protects reach, never stretches bones or
 * pretends an unreachable target is a contact. Sampled actual joints and thickness reserves reject plane crossings.
 * Gravity, friction, torque and arbitrary obstacle collision are NOT solved.
 */
import {createOsirisRig,LIMBS} from './rig-kinematics.mjs';
import {createDockDistalSolver,distalFrameOffset} from './dock-distal-frame-rig.mjs';
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

function silhouetteRail(u,f,d,fore,hind,time){
 let x=0,y=0;const include=(q,rx=0,ry=rx)=>{x=Math.max(x,rx-q.x);y=Math.max(y,ry-q.y);};
 for(const [offset,rf,rd]of [[{x:0,y:0},1.045,.332],[add(mul(f,.78*u),mul(d,fore)),.36,.329],[add(mul(f,-.78*u),mul(d,hind)),.37,.327]])include(offset,u*Math.hypot(f.x*rf,d.x*rd)+.01*u,u*Math.hypot(f.y*rf,d.y*rd)+.01*u);
 const head=add(mul(f,1.35*u),mul(d,fore+.22*u));for(const a of [-.4,.60])for(const b of [-.30,.87])include(add(head,add(mul(f,a*u),mul(d,b*u))),.01*u);
 let tail=add(mul(f,-u),mul(d,hind+.14*u));include(tail,.131*u);for(let i=0;i<4;i++){const angle=.25+i*.32+.07*Math.sin(time*1.6-i*.45);tail=add(tail,add(mul(f,-Math.cos(angle)*.30*u),mul(d,Math.sin(angle)*.30*u)));include(tail,(.105*Math.pow(1-(i+1)/4,.75)+.026)*u);}
 return {x,y};
}
function limbClearance(p,wall,floor,u){let worst={clearance:Infinity};for(const id of LIMBS)for(const [name,q]of Object.entries(p.joints[id])){const radius=(name==='paw'?0:name==='wrist'?.105:name==='elbow'?.15:name==='shoulder'?.1775:name==='hip'?.207:name==='knee'?.17:.11)*u;for(const [axis,plane]of [['x',wall],['y',floor]]){const clearance=q[axis]-plane-radius;if(clearance<worst.clearance)worst={clearance,limb:id,joint:name,axis,radius};}}return worst;}
function poseGap(a,b){let gap=0;for(const id of LIMBS)for(const [name,q]of Object.entries(a.joints[id]))gap=Math.max(gap,distance(q,b.joints[id][name]));for(const name of ['centre','chest','pelvis','head','neck','nose','tailRoot'])gap=Math.max(gap,distance(a.body[name],b.body[name]));for(let i=0;i<a.joints.tail.length;i++)gap=Math.max(gap,distance(a.joints.tail[i],b.joints.tail[i]));return gap;}


export class WallFloorDockClearanceError extends Error{
 constructor(code,message,diagnostics={}){super(message);this.name='WallFloorDockClearanceError';this.code=code;this.diagnostics=diagnostics;}
}
const reject=(code,message,data)=>{throw new WallFloorDockClearanceError(code,message,data);};

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

export function createWallFloorDockClearance(fromSnapshot,{unit=1,wallX=0,floorY=0,duration=4,targetRootX=wallX+2.1*unit,motion={}}={}){
 return new WallFloorDockClearance(fromSnapshot,{unit,wallX,floorY,duration,targetRootX,motion});
}

export class WallFloorDockClearance{
 constructor(from,{unit=1,wallX=0,floorY=0,duration=4,targetRootX=wallX+2.1*unit,motion={}}={}){
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

  if(!Number.isFinite(targetRootX)||targetRootX<wallX+1.9*unit||targetRootX>wallX+2.5*unit)reject('invalid-target','Target floor root must be 1.9–2.5U beyond wall');
  this.unit=unit;this.wallX=wallX;this.floorY=floorY;this.duration=duration;
  this.from=structuredClone(from);this.elapsed=0;this.done=false;
  this.motion={turnStart:0,turnLength:.60,earlyHeight:1.70,earlyTime:.35,knots:[[0,0],[.23,.60],[.46,1.05],[.74,1.40],[.93,Math.PI/2],[1,Math.PI/2]],...motion};
  const m=this.motion;
  if(!motion||typeof motion!=='object'||![m.turnStart,m.turnLength,m.earlyHeight,m.earlyTime].every(Number.isFinite)||m.turnStart<0||m.turnLength<=0||m.turnStart+m.turnLength>1||m.earlyTime<=0||m.earlyTime>1||m.earlyHeight<1||m.earlyHeight>3)reject('invalid-motion','Invalid finite motion timing/height');
  if(m.knots!==null&&(!Array.isArray(m.knots)||m.knots.length<2||m.knots.some((k,i)=>!Array.isArray(k)||k.length!==2||!k.every(Number.isFinite)||k[0]<0||k[0]>1||k[1]<0||k[1]>Math.PI/2||(i&&k[0]<=m.knots[i-1][0])||(i&&k[1]<m.knots[i-1][1]))||m.knots[0][0]!==0||m.knots[0][1]!==0||m.knots.at(-1)[0]!==1||m.knots.at(-1)[1]!==Math.PI/2))reject('invalid-motion','Motion knots must monotonically span exact native orientations');
  this.targetRig=createOsirisRig({unit,mode:'walk',facing:1,root:{x:targetRootX,y:floorY}});
  Object.assign(this.targetRig,{time:from.time+duration,phase:from.phase,orderOrigin:from.phase,nextLift:from.phase,velocity:0,targetSpeed:0});
  this.targetPose=this.targetRig.snapshot();
  this.hockAngles={};for(const id of ['RH','LH']){const angle=s=>{const j=s.joints[id],v=sub(j.hock,j.paw),f=s.body.forward,d=s.body.dorsal;return Math.atan2(v.x*f.x+v.y*f.y,v.x*d.x+v.y*d.y);};this.hockAngles[id]=[angle(from),angle(this.targetPose)];}
  const frontSpan=first=>distance(this.targetPose.joints[first].wrist,from.joints[first==='RF'?'LF':'RF'].wrist);
  const fronts=['RF','LF'].sort((a,b)=>frontSpan(a)-frontSpan(b));
  if(frontSpan(fronts[0])>2*.82*unit*2-1e-5*unit)reject('unreachable','No first front transfer has a feasible fixed-wrist support span',{reason:'front-wrist-span',spans:{RF:frontSpan('RF'),LF:frontSpan('LF')}});
  const rears=['RH','LH'].sort((a,b)=>from.joints[b].paw.y-from.joints[a].paw.y);
  this.order=[...fronts,...rears];
  const windows=[[0,.23],[.23,.46],[.46,.69],[.69,.93]];
  this.windows=Object.fromEntries(this.order.map((id,i)=>[id,windows[i]]));

  // Compare actual native hock targets. Per-foot surface offsets differ: the
  // old raw paw-span formula would incorrectly reject a reachable pairing.
  const retained=rears[1],first=rears[0];
  const span=distance(from.joints[retained].hock,this.targetPose.joints[first].hock),maximum=2*(.70+.66)*unit;
  if(span>maximum-1e-5*unit)
   reject('unreachable','Retained rear wall grip is too high for a three-support transfer; descend to a lower rear regrip first',{
    reason:'rear-support-span',remainingWallLimb:retained,firstFloorLimb:first,supportSpan:span,maxSupportSpan:maximum,stopHeight,
    accepted:false,requiresLowerRearGrip:true});

  this.solver=createDockDistalSolver({unit,mode:'descend',root:from.root,wallX});
  Object.assign(this.solver,{time:from.time,phase:from.phase,orderOrigin:from.phase,nextLift:from.phase,velocity:0,targetSpeed:0});
  this.startCentre=sub(from.body.centre,mul(from.body.dorsal,.012*unit*Math.sin(from.time*TAU*.22)));
  this.startNoseClearance=Math.min(.02*unit,from.body.nose.y-floorY);
  this.endCentre={x:this.targetRig.root.x,y:floorY+1.39*unit};
  this.diagnostics={accepted:false,order:[...this.order],stopHeight,samples:0,maxReachError:0,maxCentreCorrection:0,minContacts:4};
  const samples=Math.max(240,Math.ceil(duration*240));let worst=null;
  for(let n=0;n<=samples;n++){
   const pose=this.evaluate(n/samples),contacts=Object.values(pose.contacts).filter(Boolean).length;
   const clearance=limbClearance(pose,wallX,floorY,unit);
   if(!Number.isFinite(clearance.clearance)||[...LIMBS.flatMap(id=>Object.values(pose.joints[id])),...pose.joints.tail].some(q=>!isPoint(q)))reject('invalid-path','Nonfinite actual joint in preflight',{progress:n/samples});
   if(clearance.clearance<(this.diagnostics.minJointClearance??Infinity)){this.diagnostics.minJointClearance=clearance.clearance;this.diagnostics.worstClearance={...clearance,progress:n/samples};}
   if(clearance.clearance< -1e-7*unit)reject('surface-clearance','Actual joints and their skin-radius reserves cross a surface',{...this.diagnostics});
   this.diagnostics.samples++;this.diagnostics.minContacts=Math.min(this.diagnostics.minContacts,contacts);
   this.diagnostics.maxCentreCorrection=Math.max(this.diagnostics.maxCentreCorrection,pose.dock.centreCorrection);
   for(const issue of pose.issues){
    this.diagnostics.maxReachError=Math.max(this.diagnostics.maxReachError,issue.error);
    if(!worst||issue.error>worst.error)worst={...issue,progress:n/samples};
   }
  }
  if(worst||this.diagnostics.minContacts<3)
   reject('unreachable','No verified three-support wall→floor path for this stance; change the stopping/regrip height',{...this.diagnostics,worst});
  this.diagnostics.sourceGap=poseGap(this.evaluate(0),from);this.diagnostics.targetGap=poseGap(this.evaluate(1),this.targetPose);
  if(Math.max(this.diagnostics.sourceGap,this.diagnostics.targetGap)>1e-6*unit)reject('handoff-gap','Clearance constraints cannot preserve this native endpoint',{...this.diagnostics});
  this.diagnostics.accepted=true;this.current=this.evaluate(0);
 }

 bodyAt(t,paws,distalFrames){
  const u=this.unit,knots=this.motion.knots;
  let phi;if(knots){const index=Math.max(0,knots.findIndex((p,i)=>i<knots.length-1&&t<=knots[i+1][0])),a=knots[index],b=knots[Math.min(index+1,knots.length-1)];phi=mix(a[1],b[1],smooth((t-a[0])/(b[0]-a[0]||1)));}else phi=smooth((t-this.motion.turnStart)/this.motion.turnLength)*Math.PI/2;
  const turn=phi/(Math.PI/2);
  const forward={x:Math.sin(phi),y:-Math.cos(phi)},dorsal={x:Math.cos(phi),y:Math.sin(phi)};
  const fore=mix(-.08,.06,turn)*u,hind=mix(.10,-.02,turn)*u;
  const hockAngle=mix(.45,-.5,turn)+.08*Math.sin(this.from.phase*TAU);
  const time=this.from.time+t*this.duration,breathing=.012*u*Math.sin(time*TAU*.22);
  // Independently designed descent: shift away from the wall to seek the
  // floor, lower the chest, then bring the hips down after the front grips.
  const earlyHeight=mix(this.startCentre.y,this.floorY+this.motion.earlyHeight*u,smooth(t/this.motion.earlyTime));
  const desired=add({x:mix(this.startCentre.x,this.endCentre.x,smooth(t))+.30*u*Math.sin(Math.PI*t)**2,
   y:mix(earlyHeight,this.endCentre.y,smooth((t-.46)/.54))},mul(dorsal,breathing));
  const disks=LIMBS.map(id=>{
   const front=id.endsWith('F'),baseOffset=add(mul(forward,(front?.78:-.78)*u),mul(dorsal,front?fore:hind));
   return {centre:sub(add(paws[id],distalFrameOffset(id,distalFrames[id],u)),baseOffset),radius:(front?1.64:1.36)*u-.015*u*Math.sin(Math.PI*t)**2};
  });
  const noseOffset=add(mul(forward,1.65*u),mul(dorsal,fore+.22*u));
  const hipOffset=add(mul(forward,-.78*u),mul(dorsal,hind));
  const noseClearance=mix(this.startNoseClearance,.02*u,smooth(t/.35));
  const silhouette=silhouetteRail(u,forward,dorsal,fore,hind,time);
  const rail={minX:Math.max(this.wallX+.65*u,this.wallX+.04*u-hipOffset.x,this.wallX+silhouette.x),maxX:this.wallX+2.6*u,
   minY:Math.max(this.floorY+.80*u,this.floorY+noseClearance-noseOffset.y,this.floorY+silhouette.y),maxY:this.floorY+3.2*u};
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
  t=clamp(t,0,1);const paws={},contacts={},soleAxes={},distalFrames={};
  for(const id of LIMBS){
   const [start,end]=this.windows[id],z=clamp((t-start)/(end-start),0,1);
   // The individual sole frame controls both skin metadata and actual distal IK.
   // Wall-down (-pi/2) → floor-right (0), one paw's window at a time.
   const soleAngle=-Math.PI/2+Math.PI/2*smooth(z);
   soleAxes[id]=z===0?{x:0,y:-1}:z===1?{x:1,y:0}:{x:Math.cos(soleAngle),y:Math.sin(soleAngle)};
   distalFrames[id]={forward:point(soleAxes[id]),dorsal:{x:-soleAxes[id].y,y:soleAxes[id].x},hockAngle:id.endsWith('F')?0:mix(...this.hockAngles[id],smooth(z))};
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
  const {body,correction}=this.bodyAt(t,paws,distalFrames);
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



