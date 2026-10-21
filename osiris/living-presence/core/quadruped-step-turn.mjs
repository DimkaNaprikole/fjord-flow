/** Independent XYZ step-turn experiment. Never rotates planted paw targets.
 * Body yaw is genuine 3D geometry. Sixteen sequential 45-degree repositions
 * turn all four paws through 180 degrees. Anatomical sides survive occlusion.
 * Geometric reach/contact counts only: no force, friction or collision model.
 */
const ids=['RF','LH','LF','RH'];
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),mul=(a,k)=>({x:a.x*k,y:a.y*k,z:a.z*k});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,len=a=>Math.hypot(a.x,a.y,a.z),distance=(a,b)=>len(sub(a,b));
const unit=a=>mul(a,1/Math.max(1e-12,len(a)));
const rotate=(p,angle)=>({x:p.x*Math.cos(angle)-p.z*Math.sin(angle),y:p.y,z:p.x*Math.sin(angle)+p.z*Math.cos(angle)});
const copy=p=>({...p});
function projectCentre(proposed,disks,u){
 const constraints=disks.map(d=>p=>{const v=sub(p,d.centre),n=len(v);return n>d.radius?add(d.centre,mul(v,d.radius/n)):copy(p);});
 constraints.push(p=>({x:Math.max(proposed.x-.30*u,Math.min(proposed.x+.30*u,p.x)),y:Math.max(proposed.y-.30*u,Math.min(proposed.y+.10*u,p.y)),z:Math.max(proposed.z-.30*u,Math.min(proposed.z+.30*u,p.z))}));
 const corrections=constraints.map(()=>({x:0,y:0,z:0}));let current=copy(proposed);
 for(let pass=0;pass<160;pass++){const before=current;for(let i=0;i<constraints.length;i++){const p=add(current,corrections[i]),next=constraints[i](p);corrections[i]=sub(p,next);current=next;}if(pass>8&&distance(before,current)<1e-9)break;}
 return current;
}
export function solveTwoBone3D(base,target,upper,lower,pole){
 const delta=sub(target,base),raw=len(delta),direction=unit(delta),d=Math.max(Math.abs(upper-lower)+1e-8,Math.min(upper+lower-1e-8,raw));
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 let normal=sub(pole,mul(direction,dot(pole,direction)));
 if(len(normal)<1e-8){const fallback=Math.abs(direction.z)<.8?{x:0,y:0,z:1}:{x:1,y:0,z:0};normal=sub(fallback,mul(direction,dot(fallback,direction)));}
 const joint=add(add(base,mul(direction,along)),mul(unit(normal),height)),end=add(base,mul(direction,d));
 return {joint,end,reachError:distance(end,target)};
}
export function createQuadrupedStepTurn(from,{unit:u=45,width={front:.32,hind:.37},duration=5,direction=1,radians=Math.PI,preflight=true,geometry=null}={}){
 const widths=typeof width==='number'?{front:width,hind:width}:width;
 if(![u,widths?.front,widths?.hind,duration,radians].every(Number.isFinite)||!(u>0&&widths.front>0&&widths.hind>0&&duration>0&&radians>0&&radians<=Math.PI)||![1,-1].includes(direction))throw new RangeError('Invalid turn parameters');
 if(from.basisMode!=='walk'||from.mode==='jump'||from.velocity>.01||Object.values(from.contacts).some(c=>!c))throw new Error('Turn requires a stationary four-contact floor stance');
 const facing=Math.sign(from.body.forward.x);if(!facing)throw new Error('A horizontal profile stance is required');
 const origin={x:from.root.x,y:from.root.y,z:0},initialCentre={...from.body.centre,z:0};
 const side=id=>(id.startsWith('L')?1:-1)*facing*(id.endsWith('F')?widths.front:widths.hind)*u;
 const initialPaws=Object.fromEntries(ids.map(id=>[id,{...from.joints[id].paw,z:side(id)}]));
 // Optional explicit endpoint geometry is used by the separate wall adapter.
 // The ordinary floor path below remains unchanged when geometry is omitted.
 const target=geometry?.targetPose??null,finalAngle=direction*radians;
 for(const angles of [geometry?.sourceHockAngles,geometry?.targetHockAngles])if(angles&&!['RH','LH'].every(id=>Number.isFinite(angles[id])))throw new RangeError('Invalid hind hock geometry');
 if(target&&(target.basisMode!=='walk'||target.mode==='jump'||Math.abs(target.velocity)>.01||ids.some(id=>!target.contacts[id])||target.issues.length||Math.abs(target.phase-from.phase)>1e-8||Math.abs(target.time-from.time-duration)>1e-7||Math.abs(target.body.forward.x+facing)>1e-8||Math.abs(target.body.forward.y)>1e-8||Math.abs(target.body.dorsal.x)>1e-8||Math.abs(target.body.dorsal.y-1)>1e-8||Math.abs(radians-Math.PI)>1e-8))throw new Error('Target requires a reachable opposite-facing stance with matching phase and final clock');
 const targetCentre=target?{...target.body.centre,z:0}:null;
 const endBreathing=.012*u*(Math.sin((from.time+duration)*2*Math.PI*.22)-Math.sin(from.time*2*Math.PI*.22));
 const finalPaws=target?Object.fromEntries(ids.map(id=>[id,{...target.joints[id].paw,z:-side(id)}])):null;
 let elapsed=0,current;
 const rounds=Math.max(1,Math.ceil(radians/(Math.PI/4))),increment=radians/rounds;
 function evaluate(t,correctedCentre=null){
  t=clamp(t);const ramp=.06, yawT=(t<ramp?t*t/(2*ramp):t>1-ramp?1-ramp-(1-t)*(1-t)/(2*ramp):t-ramp/2)/(1-ramp); const angle=direction*radians*yawT,forward=rotate({x:facing,y:0,z:0},angle),dorsal={x:0,y:1,z:0},lateral=rotate({x:0,y:0,z:facing},angle);
  const breathing=.012*u*(Math.sin((from.time+t*duration)*2*Math.PI*.22)-Math.sin(from.time*2*Math.PI*.22));
  const blend=smooth(t);
  const desiredCentre=target?add(add(mul(initialCentre,1-blend),mul({...targetCentre,y:targetCentre.y-endBreathing},blend)),{x:0,y:breathing-.12*u*Math.sin(Math.PI*t)**2,z:0}):{...initialCentre,y:initialCentre.y+breathing-.12*u*Math.sin(Math.PI*t)**2},centre=correctedCentre??desiredCentre;
  const mapBody=p=>add(centre,rotate({x:p.x-initialCentre.x,y:p.y-initialCentre.y,z:0},angle));
  const body={};for(const key of ['chest','pelvis','neck','head','nose','tailRoot']){
   if(target){const a={x:from.body[key].x-initialCentre.x,y:from.body[key].y-initialCentre.y,z:0},b=rotate({x:target.body[key].x-targetCentre.x,y:target.body[key].y-targetCentre.y,z:0},-finalAngle);body[key]=add(centre,rotate(add(mul(a,1-blend),mul(b,blend)),angle));}
   else body[key]=mapBody(from.body[key]);
  }
  Object.assign(body,{centre,shoulder:body.chest,hip:body.pelvis,forward,dorsal,lateral});
  const tail=[copy(body.tailRoot)];for(let i=0;i<4;i++){const a=.25+i*.32+.07*Math.sin((from.time+t*duration)*1.6-i*.45);tail.push(add(tail.at(-1),add(mul(forward,-Math.cos(a)*.30*u),mul(dorsal,Math.sin(a)*.30*u))));}
  const joints={shoulder:body.chest,hip:body.pelvis,neck:body.neck,head:body.head,nose:body.nose,tailRoot:body.tailRoot,tail},legs={},contacts={},issues=[],segments=[],disks=[];
  for(const id of ids){
   const index=ids.indexOf(id),slot=.9/(rounds*4),span=slot*.82;
   let turnAngle=0,swing=null,layoutBlend=0;
   for(let round=0;round<rounds;round++){
    const start=.04+(round*4+index)*slot,base=round*increment;
    const z=clamp((t-start)/span);
    if(t>=start){turnAngle=base+increment*smooth(z);layoutBlend=(round+smooth(z))/rounds;if(z>0&&z<1)swing=z;}
   }
   const originalLocal=sub(initialPaws[id],origin),local=target?add(mul(originalLocal,1-layoutBlend),mul(rotate(sub(finalPaws[id],origin),-finalAngle),layoutBlend)):originalLocal,paw=add(origin,rotate(local,direction*turnAngle));
   if(swing!==null)paw.y+=.22*u*Math.sin(Math.PI*swing)**2;
   const front=id.endsWith('F'),base=add(front?body.chest:body.pelvis,rotate({x:0,y:0,z:side(id)},angle));
   const sourceHock=geometry?.sourceHockAngles?.[id]??(-.5+.08*Math.sin(from.phase*2*Math.PI)),targetHock=geometry?.targetHockAngles?.[id]??sourceHock;
   const hockAngle=sourceHock+(targetHock-sourceHock)*blend,offset=add(mul(dorsal,(front?.18*Math.cos(.3):.48*Math.cos(hockAngle))*u),mul(forward,(front?-.18*Math.sin(.3):.48*Math.sin(hockAngle))*u));
   disks.push({centre:sub(add(paw,offset),sub(base,centre)),radius:(front?1.64:1.36)*u-.015*u*Math.sin(Math.PI*t)**2});
   const result=solveTwoBone3D(base,add(paw,offset),(front?.82:.70)*u,(front?.82:.66)*u,mul(forward,front?-1:1));
   const endPaw=sub(result.end,offset),contact=swing===null&&result.reachError<1e-6*u;
   const j=front?{shoulder:base,elbow:result.joint,wrist:result.end,paw:endPaw}:{hip:base,knee:result.joint,hock:result.end,paw:endPaw};
   joints[id]=j;legs[id]={joints:j,contact,requestedContact:swing===null,targetPaw:paw,contactPoint:contact?copy(paw):null,swing,reachError:result.reachError,soleAxis:rotate({x:facing,y:0,z:0},direction*turnAngle)};contacts[id]=contact;
   if(result.reachError>1e-6*u)issues.push({limb:id,error:result.reachError});
   const chain=front?['shoulder','elbow','wrist','paw']:['hip','knee','hock','paw'];
   for(let i=0;i<3;i++)segments.push({id:`${id}.${i}`,from:j[chain[i]],to:j[chain[i+1]],length:distance(j[chain[i]],j[chain[i+1]])});
  }
  if(correctedCentre===null){const proposed=projectCentre(centre,disks,u);if(distance(proposed,centre)>1e-7)return evaluate(t,proposed);}
  return {spatial:true,mode:'turn',basisMode:'walk',root:copy(origin),body,joints,legs,contacts,segments,issues,time:from.time+t*duration,phase:from.phase,turn:{progress:t,angle,direction,centreCorrection:distance(centre,desiredCentre)},limitations:['Geometric 3D reach; no balance, friction or collision solver.','Centre may shift within bounded rails to preserve reach; paw targets and bone lengths never change.','Not connected to the production actor or accepted artwork.']};
 }
 if(preflight){const count=Math.ceil(duration*240);for(let i=0;i<=count;i++){const pose=evaluate(i/count);if(pose.issues.length)throw Object.assign(new Error('Turn stance is unreachable'),{diagnostics:{progress:i/count,issues:pose.issues}});}}
 current=evaluate(0);
 function endpointGap(actual,expected,sign){let gap=0;for(const id of ids)for(const [name,p] of Object.entries(expected.joints[id]))gap=Math.max(gap,distance(actual.joints[id][name],{...p,z:side(id)*sign}));for(const key of ['centre','chest','pelvis','neck','head','nose','tailRoot'])gap=Math.max(gap,distance(actual.body[key],{...expected.body[key],z:0}));return gap;}
 const diagnostics=geometry?{sourceJointGap:endpointGap(current,from,1),targetJointGap:target?endpointGap(evaluate(1),target,-1):null}:null;
 if(diagnostics&&(diagnostics.sourceJointGap>1e-6*u||(target&&diagnostics.targetJointGap>1e-6*u)))throw Object.assign(new Error('Explicit turn geometry does not match an endpoint stance'),{diagnostics});
 return {snapshot:()=>current,step(dt){if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');if(dt===0)return current;elapsed=Math.min(duration,elapsed+dt);current=evaluate(elapsed/duration);return current;},get done(){return elapsed>=duration;},...(diagnostics?{diagnostics}:{})};
}

