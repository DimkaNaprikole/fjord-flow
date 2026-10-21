/** Every actual visible vertex, including the current skin/morph pose.
 * Ordinary affine THREE.SkinnedMesh without morphs fuses skinning/projection;
 * other meshes retain getVertexPosition + world/camera projection semantics.
 */
const skinClips=new WeakMap();
const affine=m=>{const e=m.elements;return e[3]===0&&e[7]===0&&e[11]===0&&e[15]===1;};
const finiteMatrix=m=>{for(const value of m.elements)if(!Number.isFinite(value)||Math.abs(value)>1e12)return false;return true;};
function attribute(THREE,a,size,count){
 if(!a?.isBufferAttribute||a.isInterleavedBufferAttribute||a.itemSize!==size||a.count<count||a.getX!==THREE.BufferAttribute.prototype.getX||a.getY!==THREE.BufferAttribute.prototype.getY||(size>=3&&a.getZ!==THREE.BufferAttribute.prototype.getZ)||(size===4&&a.getW!==THREE.BufferAttribute.prototype.getW))return null;
 let scale=1,signed=false;
 if(a.normalized){switch(a.array.constructor){case Float32Array:break;case Uint8Array:case Uint8ClampedArray:scale=1/255;break;case Uint16Array:scale=1/65535;break;case Uint32Array:scale=1/4294967295;break;case Int8Array:scale=1/127;signed=true;break;case Int16Array:scale=1/32767;signed=true;break;case Int32Array:scale=1/2147483647;signed=true;break;default:return null;}}
 return {array:a.array,scale,signed};
}
export function projectedSurfaceBounds(THREE,root,camera){
 root.updateMatrixWorld(true);const p=new THREE.Vector3(),pv=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),worldClip=new THREE.Matrix4(),post=new THREE.Matrix4(),bone=new THREE.Matrix4(),boneBind=new THREE.Matrix4(),boneClip=new THREE.Matrix4();
 const bounds={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity,vertices:0,invalid:0,clippedDepth:0};
 const safeCamera=affine(camera.matrixWorldInverse)&&finiteMatrix(camera.matrixWorldInverse)&&finiteMatrix(camera.projectionMatrix);
 function prepare(object,count){
  if(!safeCamera||!object.isSkinnedMesh||object.getVertexPosition!==THREE.SkinnedMesh.prototype.getVertexPosition||object.applyBoneTransform!==THREE.SkinnedMesh.prototype.applyBoneTransform||object.geometry.morphAttributes.position?.length||!affine(object.matrixWorld)||!affine(object.bindMatrix)||!affine(object.bindMatrixInverse)||!finiteMatrix(object.matrixWorld)||!finiteMatrix(object.bindMatrix)||!finiteMatrix(object.bindMatrixInverse))return null;
  const attributes=object.geometry.attributes,position=attribute(THREE,attributes.position,3,count),indices=attribute(THREE,attributes.skinIndex,4,count),weights=attribute(THREE,attributes.skinWeight,4,count),skeleton=object.skeleton;
  if(!position||!indices||!weights||!skeleton||skeleton.bones.length!==skeleton.boneInverses.length)return null;
  worldClip.multiplyMatrices(pv,object.matrixWorld);post.multiplyMatrices(worldClip,object.bindMatrixInverse);if(!finiteMatrix(post))return null;
  let clips=skinClips.get(object);if(!clips||clips.length!==16*skeleton.bones.length){clips=new Float64Array(16*skeleton.bones.length);skinClips.set(object,clips);}
  for(let i=0;i<skeleton.bones.length;i++){
   const world=skeleton.bones[i]?.matrixWorld,inverse=skeleton.boneInverses[i];if(!world||!inverse||!affine(world)||!affine(inverse)||!finiteMatrix(world)||!finiteMatrix(inverse))return null;
   // Match current CPU getVertexPosition, which uses world * inverse directly;
   // skeleton.boneMatrices may be stale until a renderer/skeleton update.
   bone.multiplyMatrices(world,inverse);boneBind.multiplyMatrices(bone,object.bindMatrix);boneClip.multiplyMatrices(post,boneBind);if(!finiteMatrix(boneClip))return null;clips.set(boneClip.elements,16*i);
  }
  return {position,indices,weights,clips,bones:skeleton.bones.length,tx:post.elements[12],ty:post.elements[13],tz:post.elements[14],tw:post.elements[15]};
 }
 root.traverseVisible(object=>{
  if(!object.isMesh||!object.geometry?.attributes?.position)return;
  const count=object.geometry.attributes.position.count,skin=prepare(object,count);
  for(let i=0;i<count;i++){
   let legacy=!skin;
   if(skin){
    const a=skin.position,w=skin.weights,idx=skin.indices,m=skin.clips,k=i*3;
    let x=a.array[k]*a.scale,y=a.array[k+1]*a.scale,z=a.array[k+2]*a.scale;
    if(a.signed){x=Math.max(x,-1);y=Math.max(y,-1);z=Math.max(z,-1);}
    let cx=0,cy=0,cz=0,cw=0,sum=0;
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z)||Math.abs(x)>1e8||Math.abs(y)>1e8||Math.abs(z)>1e8)legacy=true;
    else for(let j=0;j<4;j++){
     let weight=w.array[i*4+j]*w.scale;if(w.signed)weight=Math.max(weight,-1);sum+=weight;
     if(!Number.isFinite(weight)||Math.abs(weight)>1e6){legacy=true;break;}if(weight===0)continue;
     let index=idx.array[i*4+j]*idx.scale;if(idx.signed)index=Math.max(index,-1);
     if(!Number.isInteger(index)||index<0||index>=skin.bones){legacy=true;break;}const n=index*16;
     cx+=(m[n]*x+m[n+4]*y+m[n+8]*z+m[n+12])*weight;
     cy+=(m[n+1]*x+m[n+5]*y+m[n+9]*z+m[n+13])*weight;
     cz+=(m[n+2]*x+m[n+6]*y+m[n+10]*z+m[n+14])*weight;
     cw+=(m[n+3]*x+m[n+7]*y+m[n+11]*z+m[n+15])*weight;
    }
    if(!legacy){
     // THREE blends XYZ, then applies bindInverse/world/view with w=1.
     // Their translation must occur once even when the four weights do not sum 1.
     const correction=1-sum;cx+=skin.tx*correction;cy+=skin.ty*correction;cz+=skin.tz*correction;cw+=skin.tw*correction;
     p.set(cx/cw,cy/cw,cz/cw);
     if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.z)||Math.abs(Math.abs(p.x)-1)<1e-11||Math.abs(Math.abs(p.y)-1)<1e-11||Math.abs(Math.abs(p.z)-1)<1e-11)legacy=true;
    }
   }
   if(legacy){object.getVertexPosition(i,p);p.applyMatrix4(object.matrixWorld).project(camera);}
   bounds.vertices++;if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.z)){bounds.invalid++;continue;}
   bounds.minX=Math.min(bounds.minX,p.x);bounds.maxX=Math.max(bounds.maxX,p.x);bounds.minY=Math.min(bounds.minY,p.y);bounds.maxY=Math.max(bounds.maxY,p.y);
   if(p.z<-1||p.z>1)bounds.clippedDepth++;
  }
 });
 bounds.overflow=!!(bounds.invalid||bounds.clippedDepth||bounds.minX<-1||bounds.maxX>1||bounds.minY<-1||bounds.maxY>1);
 return bounds;
}
