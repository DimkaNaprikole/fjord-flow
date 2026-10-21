/** Short C1 Hermite joins around original foot-path velocity seams.
 * Original middle path/peak, body flight, contact schedule and X stay exact.
 */
import {JumpC1CandidateRig} from './quadruped-jump-c1-candidate.mjs';
import {LIMBS} from './rig-kinematics.mjs';
export function originalJumpPawY(t,height,unit=1,front=true){
 if(![t,height,unit].every(Number.isFinite)||height<=0||unit<=0)throw new RangeError('Invalid original foot path');
 const landing=front?.72:.84;if(t<=.30||t>=landing)return {y:0,dy:0};
 const z=(t-.30)/.42,s=(t-.30)/(landing-.30),amplitude=(front?.30:.38)*unit;
 return {y:(t<.72?4*height*z*(1-z):0)+amplitude*Math.sin(Math.PI*s)**2,dy:(t<.72?4*height*(1-2*z)/.42:0)+amplitude*Math.PI*Math.sin(2*Math.PI*s)/(landing-.30)};
}
function hermite(t,a,b,left,right){const s=(t-a)/(b-a),h=b-a;return (2*s**3-3*s*s+1)*left.y+(s**3-2*s*s+s)*h*left.dy+(-2*s**3+3*s*s)*right.y+(s**3-s*s)*h*right.dy;}
export function blendedJumpPawY(t,height,unit=1,front=true,width=.02){
 if(![t,height,unit,width].every(Number.isFinite)||height<=0||unit<=0||width<=0||width>.04)throw new RangeError('Invalid foot blend');
 const landing=front?.72:.84;if(t<=.30||t>=landing)return 0;
 const original=x=>originalJumpPawY(x,height,unit,front);
 if(t<.30+width)return hermite(t,.30,.30+width,{y:0,dy:0},original(.30+width));
 if(!front&&t>=.72-width/2&&t<.72+width/2)return hermite(t,.72-width/2,.72+width/2,original(.72-width/2),original(.72+width/2));
 if(t>landing-width)return hermite(t,landing-width,landing,original(landing-width),{y:0,dy:0});
 return original(t).y;
}
export class JumpPawC1BlendExperimentRig extends JumpC1CandidateRig{
 advanceJump(dt){const j=this.jumpState;super.advanceJump(dt);if(!this.jumpState)return;const t=j.elapsed/j.duration;if(t<.30)return;
  for(const id of LIMBS){const front=id.endsWith('F'),landing=front?.72:.84;if(t<landing)this.legs[id].paw.y=j.start.y+blendedJumpPawY(t,j.height,this.unit,front);}
 }
}
export const createJumpPawC1BlendExperiment=options=>new JumpPawC1BlendExperimentRig(options);
