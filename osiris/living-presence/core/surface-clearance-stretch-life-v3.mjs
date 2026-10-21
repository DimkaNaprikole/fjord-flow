/** Isolated route assembly; not the main/default dock implementation. */
import {LivingOsirisRig} from './surface-roam-walk-governor-life.mjs';
import {createSurfaceClearanceLife} from './integrated-surface-clearance-life-v1.mjs';
import {createSurfaceRoamLife} from './surface-roam-life.mjs';
import {createSurfaceStretchRestSpaceLife} from './surface-stretch-rest-life-v3.mjs';
export function createSurfaceClearanceStretchSpaceLife({unit=1,wallX=0,floorY=0,...options}={}){
 const rig=new LivingOsirisRig({unit,facing:-1,root:{x:wallX+2*unit,y:floorY},wallX});
 const surface=createSurfaceClearanceLife({unit,wallX,floorY,rig});
 const roam=createSurfaceRoamLife({...options,unit,wallX,floorY,surface});
 return createSurfaceStretchRestSpaceLife({...options,unit,wallX,floorY,life:roam});
}
