import {fitCharacterClip} from './character-layout.mjs';
import {CHARACTER_CALIBRATION} from './character-calibration.mjs';

// Measured on cursor-button frame 108 (native 24fps), not a prompt timestamp.
export const PAW_CONTACT = Object.freeze({x:603/854,y:404/480,time:4.5,end:4.79});

export function gestureFit(clip,width,height) {
 const fit=fitCharacterClip(clip,width,height,{
  anchorX:width*(clip.anchorFraction??.5),
  baseline:clip.baselineFraction==null?undefined:height*clip.baselineFraction,
 });
 if(!clip.mirrored)return fit;
 return {...fit,left:width-fit.left-fit.width,mirror:true,
  ground:fit.ground&&{x:width-fit.ground.x,y:fit.ground.y},
  endGround:fit.endGround&&{x:width-fit.endGround.x,y:fit.endGround.y}};
}

/** Plan both handed approaches. Coordinates are viewport pixels, not DOM offsets. */
export function contactPlans({rect,stage,viewport,position,clip,walk}) {
 if(!rect||![rect.left,rect.top,rect.width,rect.height,stage?.width,stage?.height,viewport?.width,viewport?.height].every(Number.isFinite)
  ||rect.width<=0||rect.height<=0||stage.width<=0||stage.height<=0)return [];
 const plans=[];
 for(const mirrored of [false,true]){
  const source={...clip,mirrored},fit=gestureFit(source,stage.width,stage.height);
  const u=CHARACTER_CALIBRATION.clips[clip.id].unionBounds;
  const contact={x:rect.left+(mirrored?rect.width-Math.min(12,rect.width/2):Math.min(12,rect.width/2)),y:rect.top+rect.height/2};
  const origin={x:contact.x-fit.left-(mirrored?1-PAW_CONTACT.x:PAW_CONTACT.x)*fit.width,
   y:contact.y-fit.top-PAW_CONTACT.y*fit.height};
  const extent={left:origin.x+fit.left+(mirrored?1-u.right:u.left)*fit.width,
   right:origin.x+fit.left+(mirrored?1-u.left:u.right)*fit.width,
   top:origin.y+fit.top+u.top*fit.height,bottom:origin.y+fit.top+u.bottom*fit.height};
  if(extent.left<8||extent.right>viewport.width-8||extent.top<8||extent.bottom>viewport.height-8)continue;
  const ground={x:origin.x+fit.ground.x,y:origin.y+fit.ground.y};
  const walkSource={...walk,mirrored},wf=gestureFit(walkSource,stage.width,stage.height);
  const wu=CHARACTER_CALIBRATION.clips.walk.unionBounds;
  const walkCenter={x:wf.left+(mirrored?1-(wu.left+wu.right)/2:(wu.left+wu.right)/2)*wf.width,
   y:wf.top+(wu.top+wu.bottom)/2*wf.height};
  const approach={x:ground.x+walkCenter.x-wf.ground.x,y:ground.y+walkCenter.y-wf.ground.y};
  plans.push({source,fit,origin,contact,approach,mirrored,
   distance:Math.hypot(approach.x-position.x,approach.y-position.y)});
 }
 return plans.sort((a,b)=>a.distance-b.distance);
}
