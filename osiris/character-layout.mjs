import {CHARACTER_CALIBRATION} from './character-calibration.mjs';

const PAD=4;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const boundsFor=entry=>entry.unionBounds||entry.startBounds||{left:0,top:0,right:1,bottom:1};
function units(entry){
 const aspect=entry.sourceSize.width/entry.sourceSize.height;
 const head=Math.max(.001,entry.head.width),u=boundsFor(entry),g=entry.ground;
 return {
  left:(g.x-u.left)/head,right:(u.right-g.x)/head,
  up:(g.y-u.top)/(head*aspect),down:(u.bottom-g.y)/(head*aspect),
 };
}
// One physical scale for the entire library, not a separate fit per action.
// Empty source margins, toys, ears and lying posture never define skull size.
const EXTENTS=Object.values(CHARACTER_CALIBRATION.clips).map(units);
export function characterStage(width,height){
 const horizontal=Math.max(...EXTENTS.map(e=>e.left+e.right));
 const up=Math.max(...EXTENTS.map(e=>e.up)),down=Math.max(0,...EXTENTS.map(e=>e.down));
 const headPixels=Math.max(.01,Math.min((width-PAD*2)/horizontal,(height-PAD*2)/(up+down)));
 return {headPixels,baseline:height-PAD-down*headPixels};
}
export function fitCharacterClip(clip,width,height,{anchorX=width/2,baseline}={}){
 const entry=CHARACTER_CALIBRATION.clips[clip.id];
 const stage=characterStage(width,height);
 if(!entry){
  const ratio=clip.width/clip.height,u=clip.unionBounds||clip.bounds||{left:0,top:0,right:1,bottom:1};
  const h=Math.min((height-PAD*2)/(u.bottom-u.top),(width-PAD*2)/(ratio*(u.right-u.left)));
  return {width:h*ratio,height:h,left:width/2-h*ratio*(u.left+u.right)/2,top:height-PAD-u.bottom*h};
 }
 const u=boundsFor(entry),aspect=entry.sourceSize.width/entry.sourceSize.height;
 const w=stage.headPixels/entry.head.width,h=w/aspect;
 const groundX=clamp(anchorX,PAD+(entry.ground.x-u.left)*w,width-PAD-(u.right-entry.ground.x)*w);
 const groundY=clamp(baseline??stage.baseline,PAD+(entry.ground.y-u.top)*h,height-PAD-(u.bottom-entry.ground.y)*h);
 return {
  width:w,height:h,left:groundX-entry.ground.x*w,top:groundY-entry.ground.y*h,
  headPixels:stage.headPixels,
  ground:{x:groundX,y:groundY},
  endGround:{
   x:groundX+((entry.endGround?.x??entry.ground.x)-entry.ground.x)*w,
   y:groundY+((entry.endGround?.y??entry.ground.y)-entry.ground.y)*h,
  },
 };
}
