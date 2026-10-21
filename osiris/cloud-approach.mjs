import {horizontalRoute} from './behavior-policy.mjs?v=20261021cloudapproach1';

const finite=n=>Number.isFinite(n)&&Math.abs(n)<1e6;
const point=p=>p&&finite(p.x)&&finite(p.y);
const rect=r=>r&&['left','right','top','bottom'].every(k=>finite(r[k]))&&r.right>r.left&&r.bottom>r.top;
const shift=(r,p)=>({left:r.left+p.x,right:r.right+p.x,top:r.top+p.y,bottom:r.bottom+p.y});
const overlaps=(a,b,pad=0)=>a.left<b.right+pad&&a.right>b.left-pad&&a.top<b.bottom+pad&&a.bottom>b.top-pad;
const fits=(r,v,pad)=>r.left>=pad&&r.top>=pad&&r.right<=v.width-pad&&r.bottom<=v.height-pad;

export function decodedCloudFrame(seconds,fps,frameCount){
 if(!finite(seconds)||seconds<0||!finite(fps)||fps<=0||!Number.isInteger(frameCount)||frameCount<1)return -1;
 return Math.min(frameCount-1,Math.floor(seconds*fps+1e-7));
}

/** All geometry is fixed, uniformly scaled decoded-source pixels. Randomness
 * changes the approach distance only; the native jump never stretches. */
export function planCloudApproach({startGround,approachBounds,jump,cloud,viewport,obstacles=[],
 minApproach=35,maxApproach=240,clearance=8,random=Math.random}={}){
 if(!point(startGround)||!rect(approachBounds)||!rect(jump?.bounds)||!point(jump?.ground)||!point(jump?.endGround)||
  !point(cloud?.contact)||![cloud?.width,cloud?.height,viewport?.width,viewport?.height].every(n=>finite(n)&&n>0)||
  !Number.isInteger(jump?.frameCount)||jump.frameCount<2||!Number.isInteger(jump?.landingFrame)||jump.landingFrame<1||jump.landingFrame>=jump.frameCount||
  !Array.isArray(obstacles)||obstacles.length>2048||!obstacles.every(rect)||!finite(minApproach)||!finite(maxApproach)||minApproach<0||maxApproach<minApproach||!finite(clearance)||clearance<0)return null;
 const delta={x:jump.endGround.x-jump.ground.x,y:jump.endGround.y-jump.ground.y};
 if(Math.abs(delta.x)<1)return null;
 const direction=Math.sign(delta.x),footprint={width:approachBounds.right-approachBounds.left,height:approachBounds.bottom-approachBounds.top};
 const center={x:(approachBounds.left+approachBounds.right)/2,y:(approachBounds.top+approachBounds.bottom)/2};
 const from={x:startGround.x+center.x,y:startGround.y+center.y};
 for(let attempt=0;attempt<48;attempt++){
  const draw=Math.max(0,Math.min(.999999999,Number(random())||0));
  const distance=minApproach+(maxApproach-minApproach)*(attempt<32?draw:(attempt-32)/15);
  const ground={x:startGround.x+direction*distance,y:startGround.y};
  const endGround={x:ground.x+delta.x,y:ground.y+delta.y};
  const origin={x:ground.x-jump.ground.x,y:ground.y-jump.ground.y};
  const jumpBounds=shift(jump.bounds,origin),cloudOrigin={x:endGround.x-cloud.contact.x,y:endGround.y-cloud.contact.y};
  const cloudBounds={left:cloudOrigin.x,top:cloudOrigin.y,right:cloudOrigin.x+cloud.width,bottom:cloudOrigin.y+cloud.height};
  if(!fits(jumpBounds,viewport,clearance)||!fits(cloudBounds,viewport,clearance)||overlaps(cloudBounds,shift(approachBounds,startGround),clearance)||obstacles.some(o=>overlaps(o,jumpBounds,clearance)||overlaps(o,cloudBounds,clearance)))continue;
  const to={x:ground.x+center.x,y:ground.y+center.y};
  const path=horizontalRoute({start:from,target:to,footprint,viewport,obstacles,clearance});
  if(!path)continue;
  return {approach:{from,to,ground,distance,footprint,path},jump:{origin,bounds:jumpBounds,ground,endGround,delta,frameCount:jump.frameCount,landingFrame:jump.landingFrame},
   cloud:{origin:cloudOrigin,bounds:cloudBounds,contact:endGround,width:cloud.width,height:cloud.height},viewport:{...viewport},clearance};
 }
 return null;
}

/** A decoded-frame state machine: elapsed wall time can never claim a landing. */
export function createCloudSequence(plan){
 let phase='cloud',lastFrame=-1,landed=false,reason=null;
 const snapshot=()=>({phase,lastFrame,landed,reason});
 const cancel=value=>{if(!['complete','cancelled'].includes(phase)){phase='cancelled';reason=value||'cancelled';}return snapshot();};
 return {
  snapshot,cancel,
  approach(){if(phase==='cloud')phase='approach';return snapshot();},
  arrived(){if(phase==='approach')phase='jump';return snapshot();},
  decoded(frame){
   if(phase!=='jump'||!Number.isInteger(frame)||frame<lastFrame||frame<0||frame>=plan.jump.frameCount)return false;
   lastFrame=frame;
   if(!landed&&frame>=plan.jump.landingFrame){landed=true;return true;}return false;
  },
  ended(){if(phase==='jump'&&landed&&lastFrame===plan.jump.frameCount-1)phase='hold';return snapshot();},
  finish(){if(phase==='hold')phase='complete';return snapshot();},
  validate({chatOpen=false,hidden=false,motion=true,roaming=true,dragging=false,viewport=plan.viewport,obstacles=[]}={}){
   if(chatOpen||hidden||!motion||!roaming||dragging)return cancel('interrupted');
   if(viewport.width!==plan.viewport.width||viewport.height!==plan.viewport.height)return cancel('resize');
   if(obstacles.some(o=>overlaps(o,plan.jump.bounds,plan.clearance)||overlaps(o,plan.cloud.bounds,plan.clearance)))return cancel('collision');
   return snapshot();
  },
 };
}
