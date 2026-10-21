/** A sphere swept along a segment fits a convex, inset perspective frustum iff
 * both endpoint spheres fit. Covers every intermediate roll orientation too.
 * No renderer dependency, pose mutation, sampling or projected AABB.
 */
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const normalize=v=>{const n=Math.hypot(v.x,v.y,v.z);if(!Number.isFinite(n)||n<1e-12)throw new RangeError('Degenerate toy view');return {x:v.x/n,y:v.y/n,z:v.z/n};};
const valid=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
export function createSceneToyZone({position={x:11,y:5,z:11},lookAt={x:.6,y:1.2,z:0},up={x:0,y:1,z:0},fov=38,aspect=738/560,near=.05,far=80,margin=.02}={}){
 if(!valid(position)||!valid(lookAt)||!valid(up)||![fov,aspect,near,far,margin].every(Number.isFinite)||fov<=0||fov>=180||aspect<=0||near<=0||far<=near||margin<0||margin>=1)throw new RangeError('Invalid toy view');
 position={...position};const forward=normalize(sub(lookAt,position)),right=normalize(cross(forward,up)),vertical=cross(right,forward),v=Math.tan(fov*Math.PI/360)*(1-margin),h=v*aspect;
 function inspectSegment(start,end,radius){
  if(!valid(start)||!valid(end)||!Number.isFinite(radius)||radius<=0)throw new RangeError('Invalid toy trajectory');
  let clearance=Infinity;
  for(const point of [start,end]){const q=sub(point,position),x=dot(q,right),y=dot(q,vertical),depth=dot(q,forward);
   clearance=Math.min(clearance,(depth*h-Math.abs(x))/Math.hypot(1,h)-radius,(depth*v-Math.abs(y))/Math.hypot(1,v)-radius,depth-near-radius,far-depth-radius);
  }
  return {accepted:clearance>=0,clearance,start:{...start},end:{...end},radius};
 }
 return {inspectSegment};
}
