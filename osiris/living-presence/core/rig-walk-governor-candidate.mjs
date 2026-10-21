/** ISOLATED trial: retain paw timing/path; bound translation while one swings.
 * Requested speed remains an intent. Actual root obeys the core acceleration
 * bound and a remaining-distance/remaining-swing-time speed ceiling.
 */
import {OsirisRig} from './rig-kinematics.mjs';
export function makeWalkGovernorRigClass(Base=OsirisRig){
 return class WalkGovernorRig extends Base{
 step(dt,command={}){
  if(!Number.isFinite(dt)||dt<0||dt>10)throw new RangeError('Invalid dt');
  if(dt===0||this.basisMode!=='walk'||this.jumpState)return super.step(dt,command);
  super.step(0,command);const requested=this.targetSpeed,count=Math.max(1,Math.ceil(dt*240)),h=dt/count,events=[];
  for(let i=0;i<count;i++){
   const swings=Object.values(this.legs).filter(l=>l.swing).map(l=>l.swing),time=Math.max(0,...swings.map(s=>s.duration-s.elapsed));
   const distance=Math.max(0,(this.nextLift-this.phase)*this.stride),cap=time>0?.98*distance/time:requested;
   super.step(h,{speed:Math.min(requested,cap)});events.push(...this.events);this.targetSpeed=requested;
  }
  this.events=events;return this.snapshot();
 }
 };
}
export const WalkGovernorRig=makeWalkGovernorRigClass();
export const createWalkGovernorRig=options=>new WalkGovernorRig(options);
