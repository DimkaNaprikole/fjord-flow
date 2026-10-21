/** PAWS-V4 ISOLATED QA: pure fine regular marching tetrahedra, no vertex projection/subdivision.
 * Default stable module is not changed. Startup and vertex budget are intentionally higher.
 * Isolated unit=1 spatial skin experiment, no DOM or rendering side effects.
 * One indexed SDF surface joins torso + four limbs + paws in a low bind stance.
 * Seventeen independent absolute bones deform that surface with four weights.
 * Head/neck/collar/tail are deliberately excluded. The source rig is never driven.
 * Input is world XYZ; mesh positions/bones are ROOT-RELATIVE. Attach the mesh
 * under avatar.root with position=pose.root and identity rotation/scale.
 * Root subtraction happens here; the caller never subtracts a second time.
 * Geometry/reach checks do NOT establish anatomy, balance or skin artistry.
 */
import {createOsirisRig,LIMBS} from './rig-kinematics.mjs';
import {spatialPose} from './spatial-locomotion.mjs';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const V=p=>[p.x,p.y,p.z??0];
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,s)=>a.map(x=>x*s);
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),length=a=>Math.hypot(...a),distance=(a,b)=>length(sub(a,b));
const normal=a=>mul(a,1/Math.max(1e-12,length(a)));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const smoothMin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k);return b*(1-h)+a*h-k*h*(1-h);};
const ids=[...LIMBS],chain=id=>id.endsWith('F')?['shoulder','elbow','wrist','paw']:['hip','knee','hock','paw'];
function validate(pose){
 if(!pose?.spatial)throw new TypeError('Skin requires a unit=1 spatial:true pose');
 const points=[pose.root,pose.body?.centre,pose.body?.chest,pose.body?.pelvis,pose.body?.forward,pose.body?.dorsal,...ids.flatMap(id=>chain(id).map(name=>pose.joints?.[id]?.[name]))];
 if(points.some(p=>!p||![p.x,p.y,p.z].every(Number.isFinite)))throw new TypeError('Spatial body and joint XYZ must be finite');
 for(const id of ids){const c=chain(id),expected=id.endsWith('F')?[.82,.82,.18]:[.70,.66,.48];for(let n=0;n<3;n++){const d=distance(V(pose.joints[id][c[n]]),V(pose.joints[id][c[n+1]]));if(Math.abs(d-expected[n])>1e-4)throw new RangeError('Skin supports unit=1 fixed-length anatomy only');}}
 if(length(cross(V(pose.body.forward),V(pose.body.dorsal)))<.99)throw new RangeError('Body basis must be orthonormal');
}
function defaultPose(){const r=createOsirisRig({mode:'idle'});r.restBlend=1;return spatialPose(r.snapshot());}
export {validate as validateContinuousSkinPose};
function rootRelative(pose){
 const o=V(pose.root),point=p=>({x:p.x-o[0],y:p.y-o[1],z:p.z-o[2]}),body={...pose.body},joints={};
 for(const [key,value]of Object.entries(body))if(value&&typeof value==='object'&&Number.isFinite(value.x)&&!['forward','dorsal','lateral'].includes(key))body[key]=point(value);
 for(const [key,value]of Object.entries(pose.joints)){
  if(ids.includes(key))joints[key]=Object.fromEntries(Object.entries(value).map(([name,p])=>[name,point(p)]));
  else if(Array.isArray(value))joints[key]=value.map(point);else joints[key]=point(value);
 }
 return {...pose,root:{x:0,y:0,z:0},body,joints};
}
function bodyAxes(p){const f=normal(V(p.body.forward)),d=normal(V(p.body.dorsal));return [f,d,normal(cross(f,d))];}
function transforms(p){
 const axes=bodyAxes(p),result=[{origin:V(p.body.centre),axes}];
 for(const id of ids){
  const c=chain(id),j=p.joints[id];
  for(let n=0;n<3;n++){
   const y=normal(sub(V(j[c[n+1]]),V(j[c[n]])));
   let z=sub(axes[2],mul(y,dot(axes[2],y)));
   if(length(z)<1e-7)z=sub(axes[0],mul(y,dot(axes[0],y)));
   z=normal(z);const x=normal(cross(y,z));result.push({origin:V(j[c[n]]),axes:[x,y,z]});
  }
  const sole=p.legs?.[id]?.soleAxis,forward=sole?normal(V(sole)):axes[0];
  // During a floor/wall dock the planted sole keeps its surface while the
  // torso turns past it. Torso dorsal can therefore be parallel to that
  // sole. The dock's fixed anatomical plane, not torso dorsal, defines roll.
  const lateral=p.basisMode==='transition'?normal(sub(axes[2],mul(forward,dot(axes[2],forward)))):normal(cross(forward,axes[1]));
  const dorsal=normal(cross(lateral,forward));
  if(length(lateral)<.9)throw new RangeError('Paw soleAxis has no valid transverse axis');
  result.push({origin:V(j.paw),axes:[forward,dorsal,lateral]});
 }
 return result;
}
function primitives(p){
 const axes=bodyAxes(p),shapes=[];
 const ellipsoid=(bone,centre,radii,basis=axes,name='body')=>{
  const sdf=q=>{const delta=sub(q,centre),v=basis.map(a=>dot(delta,a)),k0=Math.hypot(...v.map((x,i)=>x/radii[i])),k1=Math.hypot(...v.map((x,i)=>x/(radii[i]**2)));return k1<1e-12?-Math.min(...radii):k0*(k0-1)/k1;};
  const extent=[0,1,2].map(i=>Math.sqrt(basis.reduce((n,a,k)=>n+(a[i]*radii[k])**2,0)));
  shapes.push({bone,centre,radii,basis,name,sdf,min:sub(centre,extent),max:add(centre,extent)});
 };
 ellipsoid(0,V(p.body.centre),[1.045,.365,.30]);
 ellipsoid(0,V(p.body.chest),[.36,.35,.31]);
 ellipsoid(0,V(p.body.pelvis),[.37,.36,.32]);
 for(let limb=0;limb<ids.length;limb++){
  const id=ids[limb],c=chain(id),j=p.joints[id],front=id.endsWith('F');
  const radii=front?[[.175,.13],[.115,.085],[.085,.075]]:[[.215,.15],[.125,.09],[.09,.08]];
  for(let n=0;n<3;n++){
   const a=V(j[c[n]]),b=V(j[c[n+1]]),delta=sub(b,a),[r0,r1]=radii[n],radius=Math.max(r0,r1);
   const sdf=q=>{const t=clamp(dot(sub(q,a),delta)/dot(delta,delta));return distance(q,add(a,mul(delta,t)))-(r0+(r1-r0)*t);};
   shapes.push({bone:1+limb*4+n,name:`${id}.${['upper','lower','distal'][n]}`,a,b,radius,r0,r1,sdf,min:a.map((x,i)=>Math.min(x,b[i])-radius),max:a.map((x,i)=>Math.max(x,b[i])+radius)});
  }
  const basis=transforms(p)[1+limb*4+3].axes;
  // One composite primitive, one existing paw bone: no new anatomy/scale.
  // Four rounded digits merge behind the knuckles into the soft palm. Their
  // longest tip is .202U, inside the existing .21U physical toe-push marker.
  const origin=V(j.paw),toes=[[-.081,.139],[-.027,.140],[.027,.140],[.081,.139]];
  const localEllipsoid=(q,c,r)=>{const v=sub(q,c),k0=Math.hypot(...v.map((x,i)=>x/r[i])),k1=Math.hypot(...v.map((x,i)=>x/(r[i]**2)));return k1<1e-12?-Math.min(...r):k0*(k0-1)/k1;};
  const sdf=q=>{
   const delta=sub(q,origin),v=basis.map(a=>dot(delta,a));
   let d=localEllipsoid(v,[.005,.060,0],[.130,.067,.105]);
   d=smoothMin(d,localEllipsoid(v,[-.015,.028,0],[.078,.033,.085]),.018);
   for(const[z,x]of toes)d=smoothMin(d,localEllipsoid(v,[x,.054,z],[.062,.052,.0325]),.018);
   // Deliberately no narrow carved grooves: separation comes only from the
   // four broad soft toe lobes. Micro-grooves were under-resolved at QA budgets.
   return d;
  };
  // Retain the previous sampling bounds, so the torso lattice is unchanged.
  const centre=add(origin,add(mul(basis[0],.055),mul(basis[1],.070))),boundsRadii=[.18,.075,.12],extent=[0,1,2].map(i=>Math.sqrt(basis.reduce((n,a,k)=>n+(a[i]*boundsRadii[k])**2,0)));
  shapes.push({bone:1+limb*4+3,name:`${id}.paw`,centre,radii:boundsRadii,basis,sdf,min:sub(centre,extent),max:add(centre,extent),pawOrigin:origin});
 }
 return shapes;
}
function fieldOf(shapes){return p=>shapes.reduce((d,s)=>smoothMin(d,s.sdf(p),.075),1e6);}
function supportSeparation(pose,sdf){
 // Slice just above the sole, below the joining upper limbs. Each paw must
 // occupy a DISTINCT inside component; this detects bind foot/leg fusion.
 const paws=ids.map(id=>V(pose.joints[id].paw)),y=Math.min(...paws.map(p=>p[1]))+.065,h=.025;
 const minX=Math.min(...paws.map(p=>p[0]))-.3,maxX=Math.max(...paws.map(p=>p[0]))+.35,minZ=Math.min(...paws.map(p=>p[2]))-.3,maxZ=Math.max(...paws.map(p=>p[2]))+.3;
 const nx=Math.ceil((maxX-minX)/h)+1,nz=Math.ceil((maxZ-minZ)/h)+1,labels=new Int32Array(nx*nz);labels.fill(-2);
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)if(sdf([minX+x*h,y,minZ+z*h])>=0)labels[z*nx+x]=-1;
 let components=0;
 for(let start=0;start<labels.length;start++)if(labels[start]===-2){const queue=[start];labels[start]=components;for(let k=0;k<queue.length;k++){const q=queue[k],x=q%nx,z=Math.floor(q/nx);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const i=zz*nx+xx;if(labels[i]===-2){labels[i]=components;queue.push(i);}}}components++;}
 const pawLabels=paws.map(p=>{const x=clamp(Math.round((p[0]-minX)/h),0,nx-1),z=clamp(Math.round((p[2]-minZ)/h),0,nz-1);return labels[z*nx+x];});
 return {height:y,components,pawLabels:Object.fromEntries(ids.map((id,i)=>[id,pawLabels[i]])),distinctPawComponents:new Set(pawLabels).size,merged:pawLabels.some(x=>x<0)||new Set(pawLabels).size!==4};
}
function lowerLimbClearance(shapes){
 const lower=shapes.filter(s=>/\.(lower|distal)$/.test(s.name)),pairs=[];
 for(let a=0;a<lower.length;a++)for(let b=a+1;b<lower.length;b++){
  const first=lower[a],second=lower[b];if(first.name.slice(0,2)===second.name.slice(0,2))continue;
  let clearance=Infinity;
  for(const [s,t]of [[first,second],[second,first]]){
   const count=Math.ceil(distance(s.a,s.b)/.015);
   for(let i=0;i<=count;i++){const z=i/count,p=add(s.a,mul(sub(s.b,s.a),z)),r=s.r0+(s.r1-s.r0)*z;clearance=Math.min(clearance,t.sdf(p)-r);}
  }
  pairs.push({a:first.name,b:second.name,clearance});
 }
 return {method:'Centre-line samples at <=.015U minus both tapered radii; excludes intentional torso/upper joins.',minimum:Math.min(...pairs.map(p=>p.clearance)),overlaps:pairs.filter(p=>p.clearance<-.005)};
}
function surface(shapes,step){
 const sdf=fieldOf(shapes),lo=[0,1,2].map(i=>Math.min(...shapes.map(s=>s.min[i]))-.12),hi=[0,1,2].map(i=>Math.max(...shapes.map(s=>s.max[i]))+.12);
 const dims=lo.map((x,i)=>Math.ceil((hi[i]-x)/step)+1),[nx,ny,nz]=dims,index=(x,y,z)=>(z*ny+y)*nx+x;
 const values=new Float64Array(nx*ny*nz),points=[];
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const p=[lo[0]+x*step,lo[1]+y*step,lo[2]+z*step],i=index(x,y,z);points[i]=p;values[i]=sdf(p);}
 const vertices=[],normals=[],triangles=[],cache=new Map(),delta=.004;
 const gradient=p=>normal([0,1,2].map(i=>{const a=[...p],b=[...p];a[i]+=delta;b[i]-=delta;return sdf(a)-sdf(b);}));
 const vertex=(a,b)=>{
  const t=values[a]/(values[a]-values[b]),snap=t<1e-5?a:t>1-1e-5?b:null;
  // Canonical lattice endpoint identity avoids float32-sized cracks when
  // several tetra edges intersect effectively the same zero-valued node.
  const key=snap===null?(a<b?`${a}:${b}`:`${b}:${a}`):`node:${snap}`;if(cache.has(key))return cache.get(key);
  const p=snap===null?add(points[a],mul(sub(points[b],points[a]),t)):points[snap],i=vertices.length/3;
  vertices.push(...p);normals.push(...gradient(p));cache.set(key,i);return i;
 };
 const tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
 const at=i=>vertices.slice(i*3,i*3+3);
 function triangle(a,b,c,outward){if(a===b||b===c||c===a)return;const n=cross(sub(at(b),at(a)),sub(at(c),at(a)));if(length(n)<1e-18)return;if(dot(n,outward)<0)[b,c]=[c,b];triangles.push(a,b,c);}
 for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
  const cube=[index(x,y,z),index(x+1,y,z),index(x+1,y+1,z),index(x,y+1,z),index(x,y,z+1),index(x+1,y,z+1),index(x+1,y+1,z+1),index(x,y+1,z+1)];
  if(cube.every(i=>values[i]<0)||cube.every(i=>values[i]>=0))continue;
  for(const tet of tets){let v=[];for(const[a,b]of edges){const i=cube[tet[a]],j=cube[tet[b]];if((values[i]<0)!==(values[j]<0))v.push(vertex(i,j));}v=[...new Set(v)];
   const inside=tet.map(i=>cube[i]).filter(i=>values[i]<0),outside=tet.map(i=>cube[i]).filter(i=>values[i]>=0);if(!inside.length||!outside.length)continue;
   const average=list=>mul(list.map(i=>points[i]).reduce((a,b)=>add(a,b),[0,0,0]),1/list.length),outward=sub(average(outside),average(inside));
   if(v.length===3)triangle(v[0],v[1],v[2],outward);
   else if(v.length===4){const centre=mul(v.map(at).reduce((a,b)=>add(a,b),[0,0,0]),.25),n=normal(cross(sub(at(v[1]),at(v[0])),sub(at(v[2]),at(v[0])))),axis=normal(sub(at(v[0]),centre)),other=cross(n,axis);v.sort((a,b)=>{const aa=sub(at(a),centre),bb=sub(at(b),centre);return Math.atan2(dot(aa,other),dot(aa,axis))-Math.atan2(dot(bb,other),dot(bb,axis));});triangle(v[0],v[1],v[2],outward);triangle(v[0],v[2],v[3],outward);}
  }
 }
 return {vertices,normals,triangles,dims,sdf};
}
function topology(vertexCount,triangles){
 const parent=Array.from({length:vertexCount},(_,i)=>i),root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;},edgeCounts=new Map(),edgeDirection=new Map();
 for(let i=0;i<triangles.length;i+=3){const t=triangles.slice(i,i+3);for(let n=0;n<3;n++){const a=t[n],b=t[(n+1)%3];parent[root(a)]=root(b);const key=a<b?`${a}:${b}`:`${b}:${a}`;edgeCounts.set(key,(edgeCounts.get(key)??0)+1);edgeDirection.set(key,(edgeDirection.get(key)??0)+(a<b?1:-1));}}
 return {connectedComponents:new Set(parent.map((_,i)=>root(i))).size,boundaryEdges:[...edgeCounts.values()].filter(n=>n===1).length,nonManifoldEdges:[...edgeCounts.values()].filter(n=>n>2).length,inconsistentlyOrientedEdges:[...edgeDirection.values()].filter(n=>n!==0).length};
}
function pawFaceAudit(data,shapes){
 const paws=shapes.filter(s=>s.pawOrigin),at=i=>data.vertices.slice(i*3,i*3+3),delta=.001;
 const near=p=>paws.some(s=>{const q=sub(p,s.pawOrigin),v=s.basis.map(a=>dot(q,a));return v[0]>-.15&&v[0]<.23&&v[1]>-.11&&v[1]<.17&&Math.abs(v[2])<.15;});
 let checked=0,inverted=0,degenerate=0,minimumCosine=1;const invertedSamples=[];
 for(let i=0;i<data.triangles.length;i+=3){const a=at(data.triangles[i]),b=at(data.triangles[i+1]),c=at(data.triangles[i+2]),centre=mul(add(add(a,b),c),1/3);if(!near(centre))continue;checked++;
  const n=cross(sub(b,a),sub(c,a));if(length(n)<1e-18){degenerate++;continue;}
  const g=[0,1,2].map(k=>{const lo=[...centre],hi=[...centre];lo[k]-=delta;hi[k]+=delta;return data.sdf(hi)-data.sdf(lo);});
  const cosine=dot(normal(n),normal(g));minimumCosine=Math.min(minimumCosine,cosine);if(cosine<=0){inverted++;if(invertedSamples.length<8)invertedSamples.push({centre,cosine});}
 }
 return {checked,inverted,degenerate,minimumCosine,invertedSamples,reference:'Actual face cross product vs finite-difference SDF gradient at face centroid; pure extracted bind surface.'};
}

export function createContinuousQuadrupedSkin(THREE,{material,bindPose=defaultPose(),step=.018}={}){
 validate(bindPose);if(!Number.isFinite(step)||step<.018||step>.04)throw new RangeError('Experimental grid step must be .018.. .04 unit');
 const source=rootRelative(bindPose),shapes=primitives(source),data=surface(shapes,step),separation=supportSeparation(source,data.sdf);
 const count=data.vertices.length/3,skinIndices=[],skinWeights=[],pawVertices=Object.fromEntries(ids.map(id=>[id,[]]));
 for(let i=0;i<count;i++){
  const p=data.vertices.slice(i*3,i*3+3),scores=new Map();
  // Blend nearby capsule/ellipsoid influences. Group the three torso fields
  // into one bone so the body does not gain accidental triple voting weight.
  for(const s of shapes){const score=Math.exp(-Math.max(0,s.sdf(p))/.11);scores.set(s.bone,Math.max(scores.get(s.bone)??0,score));}
  const top=[...scores].sort((a,b)=>b[1]-a[1]).slice(0,4),total=top.reduce((n,e)=>n+e[1],0);
  skinIndices.push(...top.map(e=>e[0]));skinWeights.push(...top.map(e=>e[1]/total));
  for(const id of ids){const paw=V(source.joints[id].paw);if(distance(p,paw)<.15&&p[1]<paw[1]+.115)pawVertices[id].push(i);}
 }
 let uvMinX=Infinity,uvMinY=Infinity,uvMaxX=-Infinity,uvMaxY=-Infinity;
 for(let i=0;i<data.vertices.length;i+=3){uvMinX=Math.min(uvMinX,data.vertices[i]);uvMinY=Math.min(uvMinY,data.vertices[i+1]);uvMaxX=Math.max(uvMaxX,data.vertices[i]);uvMaxY=Math.max(uvMaxY,data.vertices[i+1]);}
 const uvWidth=uvMaxX-uvMinX,uvHeight=uvMaxY-uvMinY;
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.vertices,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(data.vertices.flatMap((_,i)=>i%3===0?[(data.vertices[i]-uvMinX)/uvWidth,(data.vertices[i+1]-uvMinY)/uvHeight]:[]),2));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));geometry.setIndex(data.triangles);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const boneNames=['body',...ids.flatMap(id=>['upper','lower','distal','paw'].map(k=>`${id}.${k}`))];
 const topo=topology(count,data.triangles),clearance=lowerLimbClearance(shapes),faceAudit=pawFaceAudit(data,shapes),diagnostics={experimental:true,extraction:'Pure regular marching tetrahedra; zero projection/subdivision passes.',coordinateSpace:'Root-relative mesh/bones; input world XYZ; parent position=pose.root, rotation=identity, scale=1.',step,grid:data.dims,vertices:count,triangles:data.triangles.length/3,bones:boneNames,topology:topo,bindSupportSlice:separation,bindLowerLimbClearance:clearance,pawFaceAudit:faceAudit,pawShape:{toes:4,maxPrimitiveToe:.202,physicalToeMarker:.21,grooveDepth:0,acceptedAppearance:false},pawVertexIndices:pawVertices,warnings:[],limitations:['Linear blend skinning; no volume preservation or collision/balance model.','Contact anchors are unchanged, but a soft skin can bulge or cross the floor.','Topology is generated once in a low bind stance; deformation needs independent visual QA.','No accepted likeness or naturalness is implied.']};
 if(separation.merged)diagnostics.warnings.push('Bind paw/lower-leg regions are fused or missing at the support slice. Do not activate without inspection.');
 if(topo.connectedComponents!==1)diagnostics.warnings.push('The generated body/limb surface is not one connected component.');
 if(topo.boundaryEdges||topo.nonManifoldEdges)diagnostics.warnings.push('The extracted skin has open or non-manifold edges.');
 if(clearance.overlaps.length)diagnostics.warnings.push('Different lower limb capsules overlap in the bind shape. Inspect before activation.');
 if(topo.inconsistentlyOrientedEdges||faceAudit.degenerate)diagnostics.warnings.push('REJECTED: incoherent edge winding or degenerate paw triangles.');
 diagnostics.requiresVisualReview=true;
 diagnostics.reviewNotes=faceAudit.inverted?[`${faceAudit.inverted} face centroids oppose the nonlinear SDF gradient (minimum cosine ${faceAudit.minimumCosine}); this heuristic is separate from closedness/edge winding and requires visual inspection.`]:[];
 return createContinuousSkinRuntime(THREE,{geometry,material,bindPose,diagnostics});
}

/** Reuses the identical V4 transforms without evaluating any SDF or remeshing. */
export function createContinuousSkinRuntime(THREE,{geometry,material,bindPose,diagnostics}){
 validate(bindPose);const source=rootRelative(bindPose);
 const ownsMaterial=!material,skinMaterial=material??new THREE.MeshStandardMaterial({color:0xb59a94,roughness:.9}),mesh=new THREE.SkinnedMesh(geometry,skinMaterial);mesh.name='Osiris_continuous_body_17bones_experiment';mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
 const boneNames=['body',...ids.flatMap(id=>['upper','lower','distal','paw'].map(k=>`${id}.${k}`))],bones=boneNames.map(name=>{const b=new THREE.Bone();b.name=name;mesh.add(b);return b;});
 const matrix=t=>new THREE.Matrix4().makeBasis(...t.axes.map(a=>new THREE.Vector3(...a))).setPosition(...t.origin);
 function apply(pose){const ts=transforms(pose);for(let i=0;i<bones.length;i++)matrix(ts[i]).decompose(bones[i].position,bones[i].quaternion,bones[i].scale);mesh.parent?.updateWorldMatrix(true,false);mesh.updateMatrixWorld(true);}
 apply(source);const skeleton=new THREE.Skeleton(bones,bones.map(b=>b.matrixWorld.clone().invert()));mesh.bind(skeleton,new THREE.Matrix4());skeleton.update();
 let disposed=false;
 function update(pose){if(disposed)throw new Error('Skin has been disposed');validate(pose);apply(rootRelative(pose));skeleton.update();return {worldPaws:Object.fromEntries(ids.map(id=>[id,{...pose.joints[id].paw}])),warnings:[...diagnostics.warnings]};}
 function dispose(){if(disposed)return;disposed=true;geometry.dispose();skeleton.dispose();if(ownsMaterial)skinMaterial.dispose();mesh.removeFromParent();}
 return {mesh,update,dispose,diagnostics};
}
