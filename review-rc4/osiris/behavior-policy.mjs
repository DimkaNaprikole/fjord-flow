import {planRoute} from './viewport-roaming.mjs';

// The installed native walk is side-on. A route is allowed only on its own
// support line; obstacle avoidance must never manufacture a climbing view.
export function horizontalRoute(options) {
 const {start,target}=options;
 if(!start||!target||Math.abs(start.y-target.y)>.5)return null;
 const path=planRoute({...options,target:{x:target.x,y:start.y}});
 return path?.every(p=>Math.abs(p.y-start.y)<.001)?path:null;
}

export function walkingSpeed(headPixels,referenceHeadPixels) {
 return 85*Math.max(.5,Math.min(1.5,headPixels/referenceHeadPixels));
}

// The walking center remains the public coordinate. Collision planning uses the
// union of that narrow walk and the outgoing, wider frozen clip aligned at its
// actual support point. This makes the held frame safe BEFORE the route starts.
export function walkingEnvelope(walk,walkGround,held,heldGround) {
 const shiftX=walkGround.x-heldGround.x,shiftY=walkGround.y-heldGround.y;
 const left=Math.min(walk.left,held.left+shiftX),right=Math.max(walk.right,held.right+shiftX);
 const top=Math.min(walk.top,held.top+shiftY),bottom=Math.max(walk.bottom,held.bottom+shiftY);
 return {offset:{x:(left+right)/2-walk.x,y:(top+bottom)/2-walk.y},footprint:{width:right-left,height:bottom-top}};
}

export function chooseDifferentPlay(available,recent,random=Math.random) {
 const blocked=new Set(recent.slice(-3));
 const fresh=available.filter(id=>!blocked.has(id));
 const pool=fresh.length?fresh:available.filter(id=>id!==recent.at(-1));
 return pool.length?pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]:null;
}

export function horizontalGoals(here,viewport,random=Math.random) {
 const x=[.18,.5,.82],start=Math.floor(random()*x.length)%x.length;
 return x.map((_,i)=>({x:viewport.width*x[(start+i)%x.length],y:here.y}))
  .filter(p=>Math.abs(p.x-here.x)>=Math.min(100,viewport.width*.18));
}

// Find real available portions of the CURRENT horizontal lane. Fixed screen
// fractions are insufficient: all three can be behind a control even when a
// shorter safe walk is possible. Expand controls by the full visible footprint,
// then validate the resulting direct routes with the existing collision planner.
export function clearHorizontalGoals({start,footprint,viewport,obstacles=[],clearance=8,random=Math.random}={}) {
 if(!start||!footprint||!viewport||!Array.isArray(obstacles)||obstacles.length>2048
  ||![start.x,start.y,footprint.width,footprint.height,viewport.width,viewport.height,clearance].every(Number.isFinite)
  ||footprint.width<=0||footprint.height<=0||viewport.width<=0||viewport.height<=0||clearance<0)return [];
 const left=footprint.width/2+clearance,right=viewport.width-footprint.width/2-clearance;
 if(left>right||start.x<left||start.x>right||start.y<footprint.height/2+clearance||start.y>viewport.height-footprint.height/2-clearance)return [];
 const intervals=[];
 for(const o of obstacles){
  const l=o.left??o.x,t=o.top??o.y,r=o.right??(l+o.width),b=o.bottom??(t+o.height);
  if(![l,t,r,b].every(Number.isFinite)||r<l||b<t)return [];
  if(l===r||t===b||start.y<t-footprint.height/2-clearance||start.y>b+footprint.height/2+clearance)continue;
  const a=Math.max(left,l-footprint.width/2-clearance),z=Math.min(right,r+footprint.width/2+clearance);
  if(a<=z)intervals.push([a,z]);
 }
 intervals.sort((a,b)=>a[0]-b[0]);
 const merged=[];
 for(const interval of intervals){
  const last=merged.at(-1);
  if(last&&interval[0]<=last[1])last[1]=Math.max(last[1],interval[1]);else merged.push([...interval]);
 }
 const free=[];let cursor=left;
 for(const [a,z]of merged){if(a-cursor>.02)free.push([cursor,a-.02]);cursor=z+.02;}
 if(cursor<=right)free.push([cursor,right]);
 const overlapped=intervals.some(([a,z])=>start.x>=a&&start.x<=z);
 const minDistance=Math.min(60,Math.max(28,footprint.width*.45));
 const preferred=Math.max(minDistance*2,Math.min(220,footprint.width*1.65));
 const maxDistance=Math.max(220,Math.min(300,footprint.width*2.5));
 const candidates=[],seen=new Set();
 const add=x=>{
  const distance=Math.abs(x-start.x);
  if(distance<(overlapped?1:minDistance)||distance>maxDistance||seen.has(x))return;
  const target={x,y:start.y};
  if(!horizontalRoute({start,target,footprint,viewport,obstacles,clearance}))return;
  seen.add(x);candidates.push({...target,escape:overlapped});
 };
 for(const [a,b]of free){
  if(overlapped){
   // An authored game may end over a control. Walk out of that INITIAL overlap
   // only; the planner still forbids crossing any newly encountered obstacle.
   const inset=Math.min(8,(b-a)/2);
   add(start.x<a?a+inset:start.x>b?b-inset:start.x);
  }else{
   add(Math.max(a,Math.min(b,start.x-preferred)));
   add(Math.max(a,Math.min(b,start.x+preferred)));
  }
 }
 const preferRight=random()>=.5;
 return candidates.sort((a,b)=>overlapped?Math.abs(a.x-start.x)-Math.abs(b.x-start.x):
  Number((b.x>start.x)===preferRight)-Number((a.x>start.x)===preferRight)
  ||Math.abs(Math.abs(a.x-start.x)-preferred)-Math.abs(Math.abs(b.x-start.x)-preferred));
}
