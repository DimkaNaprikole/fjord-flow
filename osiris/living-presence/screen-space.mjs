/** Orthographic floor mapping. Screen coordinates are CSS pixels, never DPR. */
export function createScreenSpace({width,height,pixelsPerUnit=58,azimuth=.62,elevation=.65}={}){
 if(![width,height,pixelsPerUnit,azimuth,elevation].every(Number.isFinite)||width<=0||height<=0||pixelsPerUnit<=0||elevation<=.1||elevation>=1.5)throw new RangeError('Invalid screen-space camera');
 const c=Math.cos(azimuth),s=Math.sin(azimuth),v=Math.sin(elevation),u=Math.cos(elevation);
 return {width,height,pixelsPerUnit,azimuth,elevation,
  project(p){return {x:width/2+pixelsPerUnit*(c*p.x-s*p.z),y:height/2+pixelsPerUnit*(v*s*p.x-u*(p.y??0)+v*c*p.z)};},
  floor(p,y=0){const x=(p.x-width/2)/pixelsPerUnit,q=((p.y-height/2)/pixelsPerUnit+u*y)/v;return {x:c*x+s*q,y,z:-s*x+c*q};},
  cameraPosition:{x:Math.sin(azimuth)*Math.cos(elevation)*50,y:Math.sin(elevation)*50,z:Math.cos(azimuth)*Math.cos(elevation)*50},
 };
}
export function ndcRect(bounds,width,height){return {left:(bounds.minX+1)*width/2,right:(bounds.maxX+1)*width/2,top:(1-bounds.maxY)*height/2,bottom:(1-bounds.minY)*height/2,width:(bounds.maxX-bounds.minX)*width/2,height:(bounds.maxY-bounds.minY)*height/2,x:(bounds.minX+bounds.maxX+2)*width/4,y:(2-bounds.minY-bounds.maxY)*height/4};}
export function fitRectShift(rect,{width,height},pad=8){
 const dx=rect.width>width-2*pad?width/2-rect.x:rect.left<pad?pad-rect.left:rect.right>width-pad?width-pad-rect.right:0;
 const dy=rect.height>height-2*pad?height/2-rect.y:rect.top<pad?pad-rect.top:rect.bottom>height-pad?height-pad-rect.bottom:0;
 return {x:dx,y:dy,fits:rect.width<=width-2*pad&&rect.height<=height-2*pad};
}
export function presenceGate({paused=false,hidden=false,reduced=false,animations=true,docked=false,voice=false,typing=false,state='idle'}={}){
 return {blocked:paused||hidden||reduced||!animations,busy:docked||voice||typing||['listening','thinking','speaking'].includes(state)};
}
