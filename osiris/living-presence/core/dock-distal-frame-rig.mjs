/** Isolated docking IK extension. Native snapshots are exactly unchanged.
 * A released/planted foot may supply its own surface reference frame while
 * the torso turns. No target, bone length, plane or mesh is corrected here. */
import {OsirisRig,LIMBS,solveTwoBoneIK,solveHindIK} from './rig-kinematics.mjs';
const point=p=>({x:p.x,y:p.y});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const mul=(p,s)=>({x:p.x*s,y:p.y*s});
function checkFrame(frame,id){
 if(!frame||![frame.forward?.x,frame.forward?.y,frame.dorsal?.x,frame.dorsal?.y].every(Number.isFinite))throw new TypeError(`Finite distal frame required for ${id}`);
 const {forward:f,dorsal:d}=frame,det=f.x*d.y-f.y*d.x;
 if(Math.abs(Math.hypot(f.x,f.y)-1)>1e-7||Math.abs(Math.hypot(d.x,d.y)-1)>1e-7||Math.abs(f.x*d.x+f.y*d.y)>1e-7||Math.abs(Math.abs(det)-1)>1e-7)throw new RangeError(`Orthonormal distal frame required for ${id}`);
 if(!id.endsWith('F')&&!Number.isFinite(frame.hockAngle))throw new TypeError(`Finite hockAngle required for ${id}`);
 return det;
}
/** Identical offsets must also be used by the dock's reach-disk planner. */
export function distalFrameOffset(id,frame,unit=1){
 if(!LIMBS.includes(id))throw new RangeError('Unknown limb');
 if(!Number.isFinite(unit)||unit<=0)throw new RangeError('Positive unit required');checkFrame(frame,id);
 const {forward:f,dorsal:d}=frame;
 return id.endsWith('F')?add(mul(d,.18*unit*Math.cos(.3)),mul(f,-.18*unit*Math.sin(.3))):add(mul(d,.48*unit*Math.cos(frame.hockAngle)),mul(f,.48*unit*Math.sin(frame.hockAngle)));
}
export class DockDistalFrameRig extends OsirisRig{
 snapshot(bodyOverride=null){
  const frames=bodyOverride?.distalFrames;if(frames===undefined||frames===null)return super.snapshot(bodyOverride);
  if(typeof frames!=='object'||Array.isArray(frames)||Object.keys(frames).some(id=>!LIMBS.includes(id)))throw new TypeError('Distal frames must be keyed by anatomical limb');
  const body=bodyOverride,det=body.forward.x*body.dorsal.y-body.forward.y*body.dorsal.x;
  if(!Number.isFinite(det)||Math.abs(Math.abs(det)-1)>1e-7||Math.abs(Math.hypot(body.forward.x,body.forward.y)-1)>1e-7||Math.abs(Math.hypot(body.dorsal.x,body.dorsal.y)-1)>1e-7||Math.abs(body.forward.x*body.dorsal.x+body.forward.y*body.dorsal.y)>1e-7)throw new RangeError('Orthonormal torso basis required');
  for(const[id,frame]of Object.entries(frames))if(Math.sign(checkFrame(frame,id))!==Math.sign(det))throw new RangeError(`Distal frame would reverse anatomical bend for ${id}`);
  const result=super.snapshot(bodyOverride),replacements=new Map(),u=this.unit;
  for(const[id,frame]of Object.entries(frames)){
   const front=id.endsWith('F'),base=front?body.chest:body.pelvis,raw=this.legs[id],offset=distalFrameOffset(id,frame,u);
   let joints,error;
   if(front){const ik=solveTwoBoneIK(base,add(raw.paw,offset),.82*u,.82*u,-Math.sign(det));joints={shoulder:point(base),elbow:ik.joint,wrist:ik.end,paw:{x:ik.end.x-offset.x,y:ik.end.y-offset.y}};error=ik.reachError;}
   else{const ik=solveHindIK(base,raw.paw,{upper:.70*u,lower:.66*u,distal:.48*u,forward:frame.forward,dorsal:frame.dorsal,hockAngle:frame.hockAngle,bend:Math.sign(det)});joints={hip:point(base),knee:ik.knee,hock:ik.hock,paw:ik.paw};error=ik.reachError;}
   const contact=raw.contact&&error<1e-6*u,old=result.legs[id];
   result.joints[id]=joints;result.legs[id]={...old,joints,contact,contactPoint:contact?point(raw.paw):null,reachError:error,soleAxis:point(frame.forward)};result.contacts[id]=contact;
   result.issues=result.issues.filter(issue=>issue.limb!==id||issue.type!=='unreachable');if(error>1e-6*u)result.issues.push({limb:id,type:'unreachable',error});
   const chain=front?['shoulder','elbow','wrist','paw']:['hip','knee','hock','paw'];
   for(let n=0;n<3;n++){const from=joints[chain[n]],to=joints[chain[n+1]];replacements.set(`${id}.${['upper','lower','foot'][n]}`,{from:point(from),to:point(to),length:Math.hypot(to.x-from.x,to.y-from.y),angle:Math.atan2(to.y-from.y,to.x-from.x)});}
  }
  result.segments=result.segments.map(segment=>replacements.has(segment.id)?{...segment,...replacements.get(segment.id)}:segment);
  return result;
 }
}
export const createDockDistalSolver=options=>new DockDistalFrameRig(options);
