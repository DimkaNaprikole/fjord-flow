/** Own procedural QUADRUPED art candidate. No source GLB, biped or textures.
 * Torso is one continuous loft; limbs remain articulated volumes, not a production skinned
 * surface. All four anatomical chains follow the existing profile IK.
 * World/model axes: X muzzlewards, Y up, Z anatomical left (near camera).
 * update(snapshot) accepts unit=1 rig snapshots; world paw anchors retain
 * their original X/Y and receive a constant anatomical side width in Z.
 * spatial:true accepts explicit world XYZ body/joints and the orthonormal
 * body.forward/dorsal/lateral basis (lateral defaults to forward×dorsal).
 * No step-turn controller is implemented here.
 */
import {createContinuousQuadrupedSkin} from './quadruped-continuous-skin.mjs?v=stable-sole1';
import {headShapeDisplacement} from './quadruped-head-shape-v1.mjs';
import {sphynxFoldDisplacement} from './quadruped-sphynx-folds-v1.mjs';
import {createEyeSurfaceSeat} from './quadruped-eye-surface-seat.mjs?v=seat3-ocular';
import {blinkAmount,createBlinkLids} from './quadruped-eye-life.mjs?v=seat3-ocular';
export function createQuadrupedAvatar(THREE,{skinTexture=null,continuousSurface=false,skinFactory=createContinuousQuadrupedSkin}={}){
 const root=new THREE.Group();root.name='Osiris_quadruped_art_candidate';
 const geometries=new Set(),materials=new Set(),up=new THREE.Vector3(0,1,0);
 const skin=new THREE.MeshStandardMaterial({color:0xaa9392,roughness:.91});
 const soft=new THREE.MeshStandardMaterial({color:0xb8a09d,roughness:.88});
 const crease=new THREE.MeshStandardMaterial({color:0xa47a70,roughness:.85});
 const pink=new THREE.MeshStandardMaterial({color:0xc08482,roughness:.83,side:THREE.DoubleSide});
 const dark=new THREE.MeshStandardMaterial({color:0x1e2221,roughness:.6});
 const green=new THREE.MeshStandardMaterial({color:0x7f9350,roughness:.38});
 const glint=new THREE.MeshStandardMaterial({color:0xf8f6e8,roughness:.1});
 const silver=new THREE.MeshStandardMaterial({color:0xc5cfce,roughness:.25,metalness:.82});
 if(skinTexture){skin.color.set(0xffffff);soft.color.set(0xfff5ee);for(const m of [skin,soft]){m.map=skinTexture.color;m.bumpMap=skinTexture.bump;m.bumpScale=.006;m.roughness=.88;}}
 [skin,soft,crease,pink,dark,green,glint,silver].forEach(x=>materials.add(x));
 const sphere=new THREE.SphereGeometry(1,20,14),cylinder=new THREE.CylinderGeometry(.7,1.1,1,20,1),zAxis=new THREE.Vector3(0,0,1);
 geometries.add(sphere);geometries.add(cylinder);
 function mesh(parent,name,geometry,material){
  geometries.add(geometry);const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 }
 function ellipsoid(parent,name,position,scale,material=skin){
  const m=mesh(parent,name,sphere,material);m.position.set(...position);m.scale.set(...scale);return m;
 }
 function group(parent,name){const g=new THREE.Group();g.name=name;parent.add(g);return g;}
 function curve(parent,name,points,radius=.005,material=crease){
  return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,6,false),material);
 }
 // One indexed longitudinal surface, including shoulder and pelvic contours.
 // Smooth interpolation of section radii avoids the old three-bead silhouette.
 function loftGeometry(sections,rings=64,sides=32){
  const path=new THREE.CatmullRomCurve3(sections.map(s=>new THREE.Vector3(s[0],s[1],s[2])),false,'centripetal');
  const vertices=[],indices=[],uvs=[];
  for(let r=0;r<=rings;r++){
   const p=path.getPoint(r/rings),ry=Math.max(.001,p.y),rz=Math.max(.001,p.z);
   for(let s=0;s<=sides;s++){const a=s/sides*Math.PI*2+Math.PI;vertices.push(p.x,Math.cos(a)*ry,Math.sin(a)*rz);uvs.push(r/rings,s/sides);}
  }
  for(let r=0;r<rings;r++)for(let s=0;s<sides;s++){const a=r*(sides+1)+s,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 const torso=mesh(root,'continuous_feline_torso',loftGeometry([[-1.17,.001,.001],[-1.04,.27,.24],[-.80,.43,.37],[-.43,.425,.345],[-.05,.385,.30],[.32,.44,.345],[.70,.485,.37],[.98,.36,.28],[1.12,.001,.001]]),skin);
 const neck=ellipsoid(root,'neck',[0,0,0],[.29,.36,.28]);
 const shoulderFolds=group(root,'shoulder_folds');
 for(let n=0;n<3;n++)curve(shoulderFolds,`fold_${n}`,[[.11+n*.05,.30,-.24],[.14+n*.05,.35,0],[.11+n*.05,.30,.24]],.0045);

 // Head v3: independent art revision. The head group and all rig anchors below
 // are unchanged. Skull, inset eyes and concave pinnae are real XYZ surfaces.
 // Rollback source: quadruped-avatar-before-head-v3.mjs (head block only).
 const head=group(root,'sphynx_head');
 const headSkin=skin.clone();headSkin.roughness=.89;materials.add(headSkin);
 const lidSkin=soft.clone();lidSkin.color.multiplyScalar(.93);materials.add(lidSkin);
 const headCrease=new THREE.MeshStandardMaterial({color:0x856e69,roughness:.95});materials.add(headCrease);
 const earInner=new THREE.MeshStandardMaterial({color:0xa96d61,roughness:.88,side:THREE.DoubleSide});materials.add(earInner);
 const noseSkin=new THREE.MeshStandardMaterial({color:0x493a36,roughness:.6});materials.add(noseSkin);
 const irisMaterial=green.clone();irisMaterial.color.set(0xffffff);irisMaterial.vertexColors=true;irisMaterial.roughness=.31;materials.add(irisMaterial);
 const pupilMaterial=new THREE.MeshPhysicalMaterial({color:0x090b09,roughness:.15,clearcoat:1,clearcoatRoughness:.08});materials.add(pupilMaterial);
 const livingEyes=[];
 // Anatomical sections: height, fore/aft centre, depth, half cheek width.
 // A superellipse gives cheek planes instead of the old egg-shaped balloon.
 const sections=[[-.32,.14,.001,.001],[-.285,.19,.115,.115],[-.235,.15,.20,.16],[-.15,.045,.27,.255],[-.055,.015,.285,.34],[.08,.015,.28,.315],[.20,-.015,.25,.28],[.30,-.055,.20,.215],[.355,-.07,.11,.13],[.37,-.07,.001,.001]];
 function sectionAt(y){
  let i=0;while(i<sections.length-2&&y>sections[i+1][0])i++;
  const a=sections[i],b=sections[i+1],z=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
  const result=[y];
  for(let k=1;k<4;k++){
   const p=sections[Math.max(0,i-1)][k],q=a[k],r=b[k],s=sections[Math.min(sections.length-1,i+2)][k];
   result[k]=.5*((2*q)+(-p+r)*z+(2*p-5*q+4*r-s)*z*z+(-p+3*q-3*r+s)*z*z*z);
  }
  return result;
 }
 const signedPow=(x,p)=>Math.sign(x)*Math.abs(x)**p;
 const skullVertices=[],skullUV=[],skullIndices=[],skullRings=64,skullSides=48;
 for(let r=0;r<=skullRings;r++){
  const y=-.32+.69*r/skullRings,[,cx,rx,rz]=sectionAt(y);
  for(let s=0;s<=skullSides;s++){
   const a=s/skullSides*Math.PI*2,c=Math.cos(a),z=signedPow(Math.sin(a),.86)*Math.max(.001,rz);
   // The central nose bridge projects forward; lateral cheeks stay broader.
   const bridge=(.075*Math.exp(-(((y-.025)/.19)**2))+.075*Math.exp(-(((y+.13)/.10)**2)))*Math.max(0,c)**5+.035*Math.exp(-(((y+.23)/.055)**2))*Math.max(0,c)**3;
   // Local nasal skin closes the measured .024–.027U central gap to the
   // unchanged nose base; it does not move the head/nose or eye anchors.
   const nasalSkin=.045*Math.exp(-(((y+.11)/.055)**2))*Math.max(0,c)**12;
   const fold=sphynxFoldDisplacement({y,angle:a,z,rx:Math.max(.001,rx),rz:Math.max(.001,rz)});
   const basePoint={x:cx+signedPow(c,.86)*Math.max(.001,rx)+bridge+nasalSkin+fold.x,y,z:z+fold.z},shape=headShapeDisplacement(basePoint);
   skullVertices.push(basePoint.x,basePoint.y+shape.y,basePoint.z+shape.z);skullUV.push(s/skullSides,r/skullRings);
  }
 }
 for(let r=0;r<skullRings;r++)for(let s=0;s<skullSides;s++){const a=r*(skullSides+1)+s,b=a+skullSides+1;skullIndices.push(a,b,a+1,b,b+1,a+1);}
 const skullGeometry=new THREE.BufferGeometry();skullGeometry.setAttribute('position',new THREE.Float32BufferAttribute(skullVertices,3));skullGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(skullUV,2));skullGeometry.setIndex(skullIndices);skullGeometry.computeVertexNormals();
 mesh(head,'sculpted_sphynx_skull_v3',skullGeometry,headSkin);
 // Return the front skull surface for a visible forehead fold at known y/z.
 const faceX=(y,z)=>{const[,cx,rx,rz]=sectionAt(y),sn=Math.min(.999,Math.abs(z/Math.max(.001,rz))**(1/.86)),cs=Math.sqrt(1-sn*sn);return cx+cs**.86*rx+(.075*Math.exp(-(((y-.025)/.19)**2))+.075*Math.exp(-(((y+.13)/.10)**2)))*cs**5+.035*Math.exp(-(((y+.23)/.055)**2))*cs**3;};
 for(const side of [-1,1]){
  ellipsoid(head,`whisker_pad_${side}`,[.345,-.15,side*.087],[.105,.066,.108],lidSkin);
  const eye=group(head,`green_eye_${side}`);eye.position.set(faceX(.095,.232)-.006,.095,side*.232);eye.rotation.y=-side*.90;eye.scale.set(1,.86,.82);
  // A curved almond lens. Unlike a green flat sticker it has inset corners,
  // rounded ocular relief and real upper/lower lids continuous around the edge.
  const lensVertices=[],lensUV=[],lensIndices=[],lensColors=[],nu=28,nv=12;
  const lidPoint=(u,upper)=>{const bulge=Math.max(0,1-u*u)**.72;return [.004,(upper?.057:-.042)*bulge+.012*u, .116*u];};
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){
   const u=-1+2*i/nu,v=-1+2*j/nv,lo=lidPoint(u,false),hi=lidPoint(u,true);
   const y=lo[1]+(hi[1]-lo[1])*j/nv,z=.116*u;
   lensVertices.push(.004+.025*(1-u*u)*(1-v*v),y,z);lensUV.push(i/nu,j/nv);
   // Iris bounded by the same almond opening: radial stroma and a dark limbus,
   // with subdued warm sclera at corners instead of an entirely green sticker.
   const radius=Math.hypot(z/.072,(y-.005)/.060),angle=Math.atan2(y-.005,z),edge=Math.max(0,Math.min(1,(1-radius)/.12));
   const streak=.88+.09*Math.sin(angle*31+radius*7)+.045*Math.cos(angle*47-radius*13),limbus=radius>.83?.64:1;
   const iris=new THREE.Color(0x84975a).multiplyScalar(streak*limbus),corner=new THREE.Color(0x655a49);
   corner.lerp(iris,edge);lensColors.push(corner.r,corner.g,corner.b);
  }
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;lensIndices.push(a,a+1,b,b,a+1,b+1);}
  const lens=new THREE.BufferGeometry();lens.setAttribute('position',new THREE.Float32BufferAttribute(lensVertices,3));lens.setAttribute('uv',new THREE.Float32BufferAttribute(lensUV,2));lens.setAttribute('color',new THREE.Float32BufferAttribute(lensColors,3));lens.setIndex(lensIndices);lens.computeVertexNormals();
  mesh(eye,'curved_almond_eye',lens,irisMaterial);
  const upper=[],lower=[];for(let i=0;i<=12;i++){const u=-1+2*i/12;upper.push(lidPoint(u,true));lower.push(lidPoint(u,false));}
  curve(eye,'upper_lid',upper,.013,headSkin);curve(eye,'lower_lid',lower,.009,lidSkin);
  // Pupil stays within the lens outline; no hanging cylindrical black stalk.
  ellipsoid(eye,'vertical_pupil',[.034,.007,0],[.006,.037,.052],pupilMaterial);
  ellipsoid(eye,'small_corneal_glint',[.035,.025,-.025],[.004,.008,.006],glint);
  curve(eye,'supraorbital_fold',upper.map(([x,y,z])=>[x-.012,y+.027,z*.91]),.012,headSkin);
  const seat=createEyeSurfaceSeat(THREE,skullGeometry,eye,lidPoint);
  try{for(const child of eye.children)if(child.isMesh){seat.seatMesh(child);geometries.add(child.geometry);}}catch(error){seat.dispose();throw error;}
  // A pupil is a dark aperture on the ocular front, not a separate black
  // ball visible from behind the far eye. Keep the same object anchors and
  // ellipse size, conforming this front-only surface to the genuine lens.
  for(const [name,relief]of [['vertical_pupil',.0008],['small_corneal_glint',.0018]]){
   const object=eye.getObjectByName(name),vertices=[],indices=[],rings=8,sides=48;
   const ocularX=(y,z)=>{const u=z/.116,lo=lidPoint(u,false)[1],hi=lidPoint(u,true)[1],v=2*(y-lo)/(hi-lo)-1;return seat.depth(.004+.025*(1-u*u)*(1-v*v)+relief,y,z);};
   for(let r=0;r<=rings;r++)for(let s=0;s<=sides;s++){const angle=s/sides*Math.PI*2,y=object.position.y+object.scale.y*r/rings*Math.sin(angle),z=object.position.z+object.scale.z*r/rings*Math.cos(angle);vertices.push((ocularX(y,z)-object.position.x)/object.scale.x,(y-object.position.y)/object.scale.y,(z-object.position.z)/object.scale.z);}
   for(let r=0;r<rings;r++)for(let s=0;s<sides;s++){const a=r*(sides+1)+s,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();object.geometry=geometry;geometries.add(geometry);
  }
  eye.userData.surfaceSeat=seat.diagnostics;
  eye.userData.surfaceSeat.version='seat3-ocular-lids';
  const ocularLidDepth=(x,y,z)=>{const u=z/.116,lo=lidPoint(u,false)[1],hi=lidPoint(u,true)[1],v=hi-lo>1e-10?2*(y-lo)/(hi-lo)-1:0;return seat.depth(.004+.025*Math.max(0,1-u*u)*Math.max(0,1-v*v)+.003,y,z);};
  const lids=createBlinkLids(THREE,eye,headSkin,lidPoint,{depth:ocularLidDepth,backDepth:(y,z)=>seat.depth(0,y,z)-.004});seat.dispose();livingEyes.push(lids);lids.geometries.forEach(g=>geometries.add(g));

  // Broad, splayed, concave triangular pinna. The old flat narrow blades
  // lacked a concha and read as rabbit ears in three-quarter views.
  const ear=group(head,`cupped_ear_${side}`);ear.position.set(-.115,.27,side*.225);ear.rotation.x=side*.15;ear.rotation.y=-side*.65;
  const er=24,es=20,ev=[],euv=[],ei=[],surface=(u,v,back=false)=>[-.15*v+.045*(1-v)-.105*(1-u*u)*Math.sin(Math.PI*v)-(back?.035:0),.45*v-.014*u*u*v**10,side*.12*v+(.26*(1-v)**.85+.045*Math.sin(Math.PI*v)+.012*Math.sin(Math.PI/2*v)**12)*u];
  for(let back=0;back<2;back++)for(let r=0;r<=er;r++)for(let s=0;s<=es;s++){const u=-1+2*s/es,v=r/er;ev.push(...surface(u,v,Boolean(back)));euv.push(s/es,r/er);}
  const per=(er+1)*(es+1);
  for(let back=0;back<2;back++)for(let r=0;r<er;r++)for(let s=0;s<es;s++){const a=back*per+r*(es+1)+s,b=a+es+1;if(back)ei.push(a,a+1,b,b,a+1,b+1);else ei.push(a,b,a+1,b,b+1,a+1);}
  const frontCount=er*es*6;
  const edge=[];for(let s=0;s<=es;s++)edge.push(s);for(let r=1;r<=er;r++)edge.push(r*(es+1)+es);for(let s=es-1;s>=0;s--)edge.push(er*(es+1)+s);for(let r=er-1;r>0;r--)edge.push(r*(es+1));
  for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];ei.push(a,b,a+per,b,b+per,a+per);}
  const earGeometry=new THREE.BufferGeometry();earGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ev,3));earGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(euv,2));earGeometry.setIndex(ei);earGeometry.addGroup(0,frontCount,1);earGeometry.addGroup(frontCount,ei.length-frontCount,0);earGeometry.computeVertexNormals();
  mesh(ear,'continuous_pinna_shell',earGeometry,[headSkin,earInner]);
  for(const edgeSide of [-1,1]){const pts=[];for(let n=0;n<=14;n++)pts.push(surface(edgeSide,n/14));curve(ear,`rolled_helix_${edgeSide}`,pts,.012,headSkin);}
  curve(ear,'concha_fold',[[.005,.015,0],[-.014,.06,side*.03],[-.045,.13,side*.07],[-.065,.18,side*.045]],.010,headSkin);
 }
 const noseShape=new THREE.Shape();noseShape.moveTo(-.061,.025);noseShape.quadraticCurveTo(0,.033,.061,.025);noseShape.quadraticCurveTo(.034,-.02,0,-.045);noseShape.quadraticCurveTo(-.034,-.02,-.061,.025);
 const noseGeometry=new THREE.ExtrudeGeometry(noseShape,{depth:.018,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:12});noseGeometry.rotateY(Math.PI/2);
 const nose=mesh(head,'cat_nose',noseGeometry,noseSkin);nose.position.set(.458,-.11,0);
 for(const side of [-1,1])curve(head,`nostril_${side}`,[[.483,-.103,side*.045],[.486,-.115,side*.049],[.481,-.123,side*.031]],.0025,dark);
 curve(head,'philtrum',[[.469,-.145,0],[.470,-.190,0]],.0035,headCrease);
 for(const side of [-1,1])curve(head,`quiet_mouth_${side}`,[[.468,-.19,0],[.440,-.204,side*.045],[.402,-.198,side*.10]],.003,headCrease);
 // Chin is now part of the continuous skull surface, without a separate bead.
 // Forehead relief is sculpted into the skull; no duplicate scratch tubes.

 const collar=group(root,'black_collar');
 const collarGeometry=new THREE.TorusGeometry(.275,.038,12,48);
 const collarBand=mesh(collar,'band',collarGeometry,dark);collarBand.quaternion.setFromUnitVectors(zAxis,new THREE.Vector3(1,.25,0).normalize());
 const bell=group(collar,'silver_bell');bell.position.set(.055,-.29,0);
 const ring=mesh(bell,'ring',new THREE.TorusGeometry(.035,.009,8,20),silver);ring.rotation.y=Math.PI/2;
 ellipsoid(bell,'bell_body',[0,-.075,0],[.075,.075,.075],silver);
 curve(bell,'bell_slit',[[.058,-.105,-.022],[.073,-.10,0],[.058,-.105,.022]],.004,dark);

 // Rounded continuous muscle sleeves taper into the joint volumes instead of
 // exposing hard cylinder caps. Centres and link endpoints remain pure IK.
 const limbGeometry=loftGeometry([[-.5,.001,.001],[-.43,.82,.82],[-.27,1,1],[.08,.89,.89],[.36,.66,.66],[.49,.001,.001]],32,24);
 limbGeometry.rotateZ(Math.PI/2);
 const legs={};
 for(const id of ['RH','RF','LH','LF']){
  const front=id.endsWith('F'),leg=group(root,id),side=id.startsWith('L')?1:-1;
  const upper=mesh(leg,'upper',limbGeometry,skin),lower=mesh(leg,'lower',limbGeometry,skin),distal=mesh(leg,'distal',limbGeometry,skin);
  const a=ellipsoid(leg,'base_joint',[0,0,0],front?[.19,.22,.18]:[.245,.27,.225]);
  const b=ellipsoid(leg,front?'elbow':'knee',[0,0,0],front?[.135,.15,.13]:[.16,.17,.15]);
  const c=ellipsoid(leg,front?'wrist':'hock',[0,0,0],[.105,.115,.10]);
  const muscle=null;
  const paw=group(leg,'paw');ellipsoid(paw,'paw_volume',[.025,.072,0],[.19,.080,.13]);
  for(let toe=0;toe<4;toe++)ellipsoid(paw,`toe_${toe}`,[.145,.055,(toe-1.5)*.058],[.057,.055,.036]);
  legs[id]={upper,lower,distal,a,b,c,muscle,paw,side,front,depth:side*(front?.32:.37)};
 }
 // One tapered, connected tube rooted at the sacrum; no extra tail meshes.
 const tailRings=32,tailSides=10,tailPositions=new Float32Array((tailRings+1)*(tailSides+1)*3),tailIndices=[];
 for(let r=0;r<tailRings;r++)for(let s=0;s<tailSides;s++){
  const a=r*(tailSides+1)+s,b=a+tailSides+1;tailIndices.push(a,b,a+1,b,b+1,a+1);
 }
 const tailUVs=[];for(let r=0;r<=tailRings;r++)for(let s=0;s<=tailSides;s++)tailUVs.push(r/tailRings,s/tailSides);
 const tailGeometry=new THREE.BufferGeometry();tailGeometry.setAttribute('position',new THREE.BufferAttribute(tailPositions,3));tailGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(tailUVs,2));tailGeometry.setIndex(tailIndices);
 const tail=mesh(root,'single_sacral_tail',tailGeometry,skin);
 const segment=(m,a,b,radius)=>{
  const delta=b.clone().sub(a),n=delta.length();m.position.copy(a).add(b).multiplyScalar(.5);
  if(n>1e-8)m.quaternion.setFromUnitVectors(up,delta.multiplyScalar(1/n));m.scale.set(radius,n,radius);
 };
 let continuous=null;
 if(continuousSurface){
  continuous=skinFactory(THREE,{material:skin});
  if(continuous.diagnostics.warnings.length){continuous.dispose();throw new Error(`Continuous skin rejected: ${continuous.diagnostics.warnings.join('; ')}`);}
  root.add(continuous.mesh);torso.visible=false;shoulderFolds.visible=false;for(const id of Object.keys(legs))root.getObjectByName(id).visible=false;
 }
 let disposed=false;
 function update(pose){
  if(disposed)return;
  const blink=blinkAmount(pose.time);for(const eye of livingEyes)eye.update(blink);
  const b=pose.body,origin=new THREE.Vector3(pose.root.x,pose.spatial?(pose.root.y??0):0,pose.spatial?(pose.root.z??0):0);
  const point3=(p,z=0)=>new THREE.Vector3(p.x-origin.x,p.y-origin.y,(pose.spatial?(p.z??0):z)-origin.z);
  const forward=new THREE.Vector3(b.forward.x,b.forward.y,b.forward.z??0).normalize(),dorsal=new THREE.Vector3(b.dorsal.x,b.dorsal.y,b.dorsal.z??0).normalize();
  const lateral=b.lateral?new THREE.Vector3(b.lateral.x,b.lateral.y,b.lateral.z):new THREE.Vector3().crossVectors(forward,dorsal);
  lateral.normalize();const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(forward,dorsal,lateral));
  root.position.copy(origin);root.rotation.set(0,0,0);
  const c=point3(b.chest),h=point3(b.pelvis);
  torso.position.copy(c).add(h).multiplyScalar(.5);torso.quaternion.copy(rotation);
  torso.scale.set(c.distanceTo(h)/1.56,1,1);
  shoulderFolds.position.copy(c);shoulderFolds.quaternion.copy(rotation);
  neck.position.copy(point3(b.neck));neck.quaternion.setFromUnitVectors(up,point3(b.head).sub(c).normalize());
  head.position.copy(point3(b.head)).addScaledVector(forward,.09).addScaledVector(dorsal,.08);head.quaternion.copy(rotation);
  collar.position.copy(point3(b.neck));collar.quaternion.copy(rotation);
  const worldJoints={};
  for(const [id,leg] of Object.entries(legs)){
   const j=pose.joints[id],a=point3(j.shoulder??j.hip,leg.depth),m=point3(j.elbow??j.knee,leg.depth),e=point3(j.wrist??j.hock,leg.depth),p=point3(j.paw,leg.depth);
   segment(leg.upper,a,m,leg.front?.19:.245);segment(leg.lower,m,e,leg.front?.115:.125);segment(leg.distal,e,p,.092);
   leg.a.position.copy(a);leg.b.position.copy(m);leg.c.position.copy(e);leg.paw.position.copy(p);
   if(leg.muscle){leg.muscle.position.copy(a).lerp(m,.33);leg.muscle.quaternion.setFromUnitVectors(up,m.clone().sub(a).normalize());}
   const sole=pose.legs?.[id]?.soleAxis??b.forward;
   leg.paw.rotation.y=-Math.atan2(sole.z??0,sole.x);
   worldJoints[id]={...Object.fromEntries(Object.entries(j).map(([name,q])=>[name,{x:q.x,y:q.y,z:pose.spatial?(q.z??0):leg.depth}])),contact:pose.contacts[id]};
  }
  const points=pose.joints.tail.map(q=>point3(q));
  const path=new THREE.CatmullRomCurve3(points),tangent=new THREE.Vector3(),normal=new THREE.Vector3(),binormal=new THREE.Vector3(),reference=new THREE.Vector3(0,0,1);
  for(let r=0;r<=tailRings;r++){
   const t=r/tailRings,centre=path.getPoint(t);tangent.copy(path.getTangent(t)).normalize();
   normal.crossVectors(tangent,reference).normalize();binormal.crossVectors(tangent,normal).normalize();
   const radius=.105*Math.pow(1-t,.75)+.006;
   for(let s=0;s<=tailSides;s++){
    const a=s/tailSides*Math.PI*2,offset=r*(tailSides+1)*3+s*3;
    tailPositions[offset]=centre.x+radius*(normal.x*Math.cos(a)+binormal.x*Math.sin(a));
    tailPositions[offset+1]=centre.y+radius*(normal.y*Math.cos(a)+binormal.y*Math.sin(a));
    tailPositions[offset+2]=centre.z+radius*(normal.z*Math.cos(a)+binormal.z*Math.sin(a));
   }
  }
  tailGeometry.attributes.position.needsUpdate=true;tailGeometry.computeVertexNormals();tailGeometry.computeBoundingSphere();
  const skinReport=continuous?.update(pose);
  return {worldJoints,issues:pose.issues,contacts:pose.contacts,bodyAxis:{x:forward.x,y:forward.y,z:forward.z},tailMeshes:1,skinWarnings:skinReport?.warnings??[]};
 }
 function dispose(){if(disposed)return;disposed=true;continuous?.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();root.removeFromParent();}
 return {root,update,dispose,skinDiagnostics:continuous?.diagnostics??null,kind:'own-procedural-quadruped',limitations:['Separate artistic candidate; likeness is not accepted.',continuous?'Experimental linear-blend skin; independent visual deformation review remains necessary.':'Torso is one continuous loft; articulated limbs are not a unified skinned surface.','Walking uses profile IK plus constant lateral width.','No gravity, collision or skin deformation solver.']};
}
