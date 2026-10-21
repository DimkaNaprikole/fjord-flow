/** Optional candidate only. No default core/controller imports this subclass. */
import {OsirisRig} from './rig-kinematics.mjs';
import {boundedJumpVertical} from './quadruped-jump-vertical-c1.mjs';
export class JumpC1CandidateRig extends OsirisRig{
 body(){
  const base=super.body();if(!this.jumpState)return base;
  const j=this.jumpState,envelope=boundedJumpVertical({progress:j.elapsed/j.duration,height:j.height,duration:j.duration,unit:this.unit}),delta=envelope.lift+envelope.compression-base.lift-base.compression;
  const shifted=new Map(),out={...base,...envelope};
  for(const[key,value]of Object.entries(base))if(value&&Number.isFinite(value.x)&&!['forward','dorsal'].includes(key)){
   if(!shifted.has(value))shifted.set(value,{x:value.x+base.dorsal.x*delta,y:value.y+base.dorsal.y*delta});out[key]=shifted.get(value);
  }
  return out;
 }
 jump(options={}){
  const params={distance:2.2*this.unit,height:.65*this.unit,duration:1.4,...options};
  // Check envelope, existing parameter/stance rules and every sampled real
  // candidate chain on a clone before assigning any state to the actual rig.
  boundedJumpVertical({progress:0,height:params.height,duration:params.duration,unit:this.unit});
  const trial=Object.assign(Object.create(Object.getPrototypeOf(this)),structuredClone(this));
  OsirisRig.prototype.jump.call(trial,params);
  const samples=Math.max(240,Math.ceil(params.duration*240));
  for(let i=0;i<=samples;i++){
   const pose=i?trial.step(params.duration/samples):trial.snapshot();
   let minY=Infinity,lowestSegment=null;for(const segment of pose.segments)for(const endpoint of ['from','to'])if(segment[endpoint].y<minY){minY=segment[endpoint].y;lowestSegment=`${segment.id}.${endpoint}`;}
   if(pose.issues.length||minY<this.root.y-1e-7*this.unit)throw Object.assign(new Error('C1 jump trajectory exceeds real IK or floor clearance'),{code:'jump-c1-unreachable',diagnostics:{progress:i/samples,issues:pose.issues,minY,lowestSegment,floorY:this.root.y}});
  }
  return super.jump(params);
 }
}
export const createJumpC1Candidate=options=>new JumpC1CandidateRig(options);
