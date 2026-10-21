/** Isolated wall-normal XYZ turn experiment, from an actual stopped native
 * climb snapshot. This is geometric support, not adhesion/grip simulation.
 * No core rig is mutated, respawned or switched to the descend basis.
 * Explicit hind geometry preserves the native climb source. An optional
 * genuine stopped native descend snapshot supplies the complete final pose.
 */
import {createQuadrupedStepTurn} from './quadruped-step-turn.mjs';
import {spatialPose} from './spatial-locomotion.mjs';
import {createOsirisRig} from './rig-kinematics.mjs';
const ids=['RF','LF','RH','LH'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z??0)-(b.z??0));

function transformPose(s,point,vector){
 const body={};for(const [key,p] of Object.entries(s.body))body[key]=p&&Number.isFinite(p.x)?(['forward','dorsal','lateral'].includes(key)?vector(p):point(p)):p;
 const joints={};for(const [key,p] of Object.entries(s.joints))joints[key]=ids.includes(key)?Object.fromEntries(Object.entries(p).map(([name,p])=>[name,point(p)])):Array.isArray(p)?p.map(point):point(p);
 const legs=Object.fromEntries(ids.map(id=>{const leg=s.legs[id];return [id,{...leg,joints:joints[id],targetPaw:point(leg.targetPaw),contactPoint:leg.contactPoint?point(leg.contactPoint):null,...(leg.soleAxis?{soleAxis:vector(leg.soleAxis)}:{})}];}));
 return {...s,body,joints,legs,root:point(s.root),segments:s.segments.map(seg=>({...seg,from:point(seg.from),to:point(seg.to)})),...(s.worldRootSpeed?{worldRootSpeed:vector(s.worldRootSpeed)}:{})};
}

export function createQuadrupedWallTurn(from,{unit=1,wallX=from?.legs?.RF?.targetPaw?.x,duration=5,direction=1,target=null}={}){
 if(!Number.isFinite(unit)||unit<=0||!Number.isFinite(wallX))throw new RangeError('Invalid wall turn scale or wall plane');
 if(!from||from.spatial||from.basisMode!=='climb'||from.mode==='jump'||!Number.isFinite(from.velocity)||Math.abs(from.velocity)>1e-7*unit||from.issues?.length||ids.some(id=>!from.contacts?.[id]||from.legs?.[id]?.swing!==null))throw new Error('Wall turn requires a stopped native four-contact climb stance');
 if(Math.abs(from.body.forward.x)>1e-8||Math.abs(from.body.forward.y-1)>1e-8||Math.abs(from.body.dorsal.x-1)>1e-8||Math.abs(from.body.dorsal.y)>1e-8)throw new Error('Wall turn requires the native head-up wall basis');
 if(ids.some(id=>Math.abs(from.legs[id].targetPaw.x-wallX)>1e-7*unit))throw new Error('Every real support must lie on the same wall plane');
 const toFloor=p=>({x:p.y,y:p.x-wallX,z:-(p.z??0)}),toFloorVector=p=>({x:p.y,y:p.x,z:-(p.z??0)});
 const canonical=transformPose(from,toFloor,toFloorVector);
 canonical.root={x:from.root.y,y:0,z:0};canonical.basisMode='walk';
 const hockAngles=s=>Object.fromEntries(['RH','LH'].map(id=>{const a=s.joints[id].hock,b=s.joints[id].paw,v={x:a.x-b.x,y:a.y-b.y};return [id,Math.atan2(v.x*s.body.forward.x+v.y*s.body.forward.y,v.x*s.body.dorsal.x+v.y*s.body.dorsal.y)];}));
 let canonicalTarget=null;
 if(target){
  if(target.spatial||target.basisMode!=='descend'||target.mode==='jump'||Math.abs(target.velocity)>1e-7*unit||target.issues.length||ids.some(id=>!target.contacts[id]||target.legs[id].swing!==null||Math.abs(target.legs[id].targetPaw.x-wallX)>1e-7*unit))throw new Error('Target requires a stopped native four-contact descend stance on the same wall');
  canonicalTarget=transformPose(target,toFloor,toFloorVector);canonicalTarget.root={x:target.root.y,y:0,z:0};canonicalTarget.basisMode='walk';
 }
 const sourceHockAngles=hockAngles(canonical),targetHockAngles=canonicalTarget?hockAngles(canonicalTarget):Object.fromEntries(['RH','LH'].map(id=>[id,.45+.08*Math.sin(from.phase*2*Math.PI)]));
 const turn=createQuadrupedStepTurn(canonical,{unit,duration,direction,geometry:{sourceHockAngles,targetHockAngles,targetPose:canonicalTarget}});
 const toWall=p=>({x:wallX+p.y,y:p.x,z:-p.z}),toWallVector=p=>({x:p.y,y:p.x,z:-p.z});
 function world(s){const result=transformPose(s,toWall,toWallVector);result.basisMode='wall-turn';result.mode='wall-turn';result.turn={...s.turn,axis:{x:-1,y:0,z:0},wallX};result.limitations=[...s.limitations,'No adhesion, grip, gravity or force solver; support means geometric wall contact.',...(target?['The final pose matches the supplied native descend snapshot; applying it to a live core rig is the caller\'s responsibility.']:['No native descend target supplied: only the hock angle reaches descend geometry; complete core handoff is unavailable.'])];return result;}
 let cached=world(turn.snapshot());
 const source=spatialPose(from,{},unit);let sourceJointGap=0;
 for(const id of ids)for(const [name,p] of Object.entries(source.joints[id]))sourceJointGap=Math.max(sourceJointGap,distance(p,cached.joints[id][name]));
 return {snapshot:()=>structuredClone(cached),step(dt){cached=world(turn.step(dt));return structuredClone(cached);},get done(){return turn.done;},diagnostics:{wallX,sourceJointGap,seamlessSource:sourceJointGap<1e-6*unit,targetJointGap:turn.diagnostics.targetJointGap,seamlessTarget:!!target&&turn.diagnostics.targetJointGap<1e-6*unit,sourceHockAngles,targetHockAngles,preflight:true,canonicalRoot:{...canonical.root}}};
}

/** Apply the accepted turn to the SAME live core rig. The clone is only a
 * preflight target: its reflected paws are actual destinations of the XYZ
 * replant trajectory, never a teleport of the source. Do not concurrently
 * drive the core while this controller owns it (as with createRigPlay).
 */
export function createRigWallTurn(rig,{duration=5,direction=1}={}){
 if(!rig?.snapshot||!rig?.legs)throw new TypeError('An existing core rig is required');
 const source=rig.snapshot(),planned=Object.assign(Object.create(Object.getPrototypeOf(rig)),structuredClone(rig));
 planned.basisMode='descend';planned.mode='idle';planned.time=source.time+duration;
 planned.velocity=0;planned.targetSpeed=0;planned.rootVelocity={x:0,y:0};planned.pending=[];planned.unsupportedTransition=null;
 for(const id of ids)planned.legs[id]={...planned.legs[id],paw:{x:rig.wallX,y:2*rig.root.y-rig.legs[id].paw.y},contact:true,swing:null};
 const turn=createQuadrupedWallTurn(source,{unit:rig.unit,wallX:rig.wallX,duration,direction,target:planned.snapshot()});
 const diagnostics={...turn.diagnostics,committed:false,handoffGap:null,cancelledClimbRegrips:rig.pending.length};
 let cached=turn.snapshot();
 function step(dt){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');
  if(turn.done||dt===0)return structuredClone(cached);
  cached=turn.step(dt);rig.time=cached.time;
  if(turn.done){
   rig.basisMode='descend';rig.mode='idle';rig.legs=structuredClone(planned.legs);rig.root={...planned.root};
   rig.velocity=0;rig.targetSpeed=0;rig.rootVelocity={x:0,y:0};rig.pending=[];rig.unsupportedTransition=null;
   const native=spatialPose(rig.snapshot(),{},rig.unit);let gap=0;
   for(const id of ids)for(const [name,p] of Object.entries(cached.joints[id]))gap=Math.max(gap,distance(p,native.joints[id][name]));
   for(const key of ['centre','chest','pelvis','head','neck','nose','tailRoot'])gap=Math.max(gap,distance(cached.body[key],native.body[key]));
   diagnostics.handoffGap=gap;diagnostics.committed=true;
  }
  return structuredClone(cached);
 }
 return {step,snapshot:()=>structuredClone(cached),get done(){return turn.done;},get rig(){return rig;},diagnostics};
}

/** Isolated local sequence for a wall-only renderer. Explicit start/resume;
 * climb -> finish grips -> wall-normal turn -> native head-first descend ->
 * stop. This does not connect a wall to a floor or simulate adhesion.
 */
export function createWallLocomotion({unit=1,wallX=0,root={x:wallX+1.08*unit,y:0},rig=createOsirisRig({unit,wallX,root,mode:'climb'}),direction=1}={}){
 if(rig.basisMode!=='climb'||![1,-1].includes(direction))throw new Error('A native climb rig and a valid turn direction are required');
 let phase='climb',elapsed=0,paused=true,turn=null,error=null,handoffs=[];
 function snapshot(){const s=turn?turn.snapshot():spatialPose(rig.snapshot(),{},rig.unit);s.wallLife={phase,paused,error,handoffs:[...handoffs],turnDiagnostics:turn?structuredClone(turn.diagnostics):null};return s;}
 function step(dt){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');
  if(paused||dt===0)return snapshot();let remaining=dt;
  while(remaining>1e-10){const h=Math.min(remaining,1/120);remaining-=h;
   if(phase==='turn'){
    turn.step(h);if(turn.done){handoffs.push({...turn.diagnostics});turn=null;phase='descend';elapsed=0;}
   }else{
    rig.step(h,{mode:phase==='climb'?'climb':phase==='descend'?'descend':'idle',speed:phase==='climb'?.30*rig.unit:phase==='descend'?.25*rig.unit:0});elapsed+=h;
    if(phase==='climb'&&elapsed>=2){phase='settle';elapsed=0;rig.step(0,{mode:'idle'});}
    else if(phase==='settle'&&rig.velocity===0&&Object.values(rig.snapshot().contacts).every(Boolean)){
     try{turn=createRigWallTurn(rig,{direction});phase='turn';elapsed=0;}catch(e){error=e.message;phase='rejected';paused=true;break;}
    }else if(phase==='descend'&&elapsed>=2){phase='rest';elapsed=0;rig.step(0,{mode:'idle'});}
   }
  }return snapshot();
 }
 return {step,snapshot,start(){paused=false;},resume(){paused=false;},rest(){paused=true;},get rig(){return rig;}};
}
