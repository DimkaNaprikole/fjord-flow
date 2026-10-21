/** Opt-in combined route: one core with governed walk and C1 jump joins. */
import {createSurfaceRoamLife} from './surface-roam-life.mjs';
import {createSurfaceLife} from './integrated-surface-life.mjs';
import {JumpPawC1BlendExperimentRig} from './quadruped-jump-paw-c1-blend-experiment.mjs';
import {makeWalkGovernorRigClass} from './rig-walk-governor-candidate.mjs';
export const LivingOsirisRig=makeWalkGovernorRigClass(JumpPawC1BlendExperimentRig);
export function createSurfaceRoamWalkGovernorLife({unit=1,wallX=0,floorY=0,...options}={}){
 const rig=new LivingOsirisRig({unit,facing:-1,root:{x:wallX+1.6*unit,y:floorY},wallX});
 const surface=createSurfaceLife({unit,wallX,floorY,rig});
 return createSurfaceRoamLife({...options,unit,wallX,floorY,surface});
}
