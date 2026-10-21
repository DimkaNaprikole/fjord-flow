/** ISOLATED CANDIDATE CACHE: same V4 runtime, candidate topology counts; never changes default. */
/** Isolated V4 cache: await load, then synchronously create independent skins.
 * No SDF evaluation at load/create. Stable default is never imported/changed.
 * await loadContinuousQuadrupedSkinFactory(THREE) -> same skin factory API.
 */
import {createContinuousSkinRuntime,validateContinuousSkinPose} from './quadruped-continuous-skin-paws-v4.mjs';
const layout={position:['Float32Array',3],normal:['Float32Array',3],uv:['Float32Array',2],skinIndex:['Uint16Array',4],skinWeight:['Float32Array',4],index:['Uint32Array',1]};
const types={Float32Array,Uint16Array,Uint32Array};
export function cacheChecksum(bytes){let h=2166136261;for(const v of bytes)h=Math.imul(h^v,16777619);return (h>>>0).toString(16).padStart(8,'0');}
const signature=p=>JSON.stringify({spatial:p.spatial,root:p.root,body:p.body,joints:p.joints,legs:Object.fromEntries(Object.entries(p.legs).map(([id,l])=>[id,{soleAxis:l.soleAxis}]))});
export function decodeContinuousSkinCache(manifest,binary){
 if(manifest?.format!=='osiris-paws-v4-f32-v1'||manifest.endian!=='little'||manifest.bindType!=='unit1-spatial-rest1-root-relative'||manifest.vertexCount!==127984||manifest.triangleCount!==255964||manifest.diagnostics?.bones?.length!==17||!manifest.diagnostics?.soleSkinV2)throw new TypeError('Unsupported or inconsistent sole-v2 skin cache manifest');
 if(!(binary instanceof ArrayBuffer)||binary.byteLength!==manifest.byteLength)throw new RangeError('Skin cache byte length mismatch');
 const arrays={},ranges=[];
 for(const [name,[type,size]]of Object.entries(layout)){
  const a=manifest.attributes?.[name],ctor=types[type],expected=name==='index'?manifest.triangleCount*3:manifest.vertexCount*size;
  if(!a||a.type!==type||a.itemSize!==size||a.length!==expected||!Number.isInteger(a.byteOffset)||a.byteOffset<0||a.byteOffset%ctor.BYTES_PER_ELEMENT||a.byteLength!==a.length*ctor.BYTES_PER_ELEMENT||a.byteOffset+a.byteLength>binary.byteLength)throw new RangeError(`Invalid cache attribute ${name}`);
  ranges.push([a.byteOffset,a.byteOffset+a.byteLength]);const bytes=new Uint8Array(binary,a.byteOffset,a.byteLength);
  if(cacheChecksum(bytes)!==a.checksum)throw new Error(`Skin cache checksum mismatch: ${name}`);
  arrays[name]=new ctor(binary,a.byteOffset,a.length);
  if(type==='Float32Array'&&!arrays[name].every(Number.isFinite))throw new TypeError(`Nonfinite cache ${name}`);
 }
 ranges.sort((a,b)=>a[0]-b[0]);if(ranges[0][0]!==0||ranges.at(-1)[1]!==binary.byteLength||ranges.some((r,i)=>i&&r[0]!==ranges[i-1][1]))throw new RangeError('Overlapping or incomplete cache ranges');
 if(arrays.index.some(i=>i>=manifest.vertexCount)||arrays.skinIndex.some(i=>i>=17))throw new RangeError('Out of range cache vertex/bone index');
 for(let i=0;i<manifest.vertexCount;i++){let sum=0;for(let j=0;j<4;j++){const w=arrays.skinWeight[4*i+j];if(w<0||w>1)throw new RangeError('Invalid skin weight');sum+=w;}if(Math.abs(sum-1)>1e-6)throw new RangeError('Unnormalized skin weights');}
 const p=manifest.bindPose;if(!p?.spatial||!p.root||p.root.x!==0||p.root.y!==0||p.root.z!==0||p.restBlend!==1)throw new TypeError('Wrong cache bind pose');
 validateContinuousSkinPose(p);
 const boneNames=['body',...['RH','RF','LH','LF'].flatMap(id=>['upper','lower','distal','paw'].map(k=>`${id}.${k}`))];
 if(JSON.stringify(manifest.diagnostics.bones)!==JSON.stringify(boneNames))throw new TypeError('Wrong cache bone order');
 return {arrays,manifest:structuredClone(manifest)};
}
export function createCachedContinuousSkinFactory(THREE,cache){
 const {arrays,manifest}=cache,bindSignature=signature(manifest.bindPose);
 return function createContinuousQuadrupedSkin(THREEArgument=THREE,{material,bindPose=manifest.bindPose,step=manifest.diagnostics.step}={}){
  if(THREEArgument!==THREE)throw new TypeError('Use the same THREE runtime used to load the cache');
  if(step!==manifest.diagnostics.step||signature(bindPose)!==bindSignature)throw new RangeError('Cached skin requires its exact authored bind pose and step');
  const g=new THREE.BufferGeometry();
  for(const [name,[,size]]of Object.entries(layout)){if(name==='index')continue;g.setAttribute(name,new THREE.BufferAttribute(arrays[name].slice(),size));}
  g.setIndex(new THREE.BufferAttribute(arrays.index.slice(),1));g.computeBoundingBox();g.computeBoundingSphere();
  try{return createContinuousSkinRuntime(THREE,{geometry:g,material,bindPose,diagnostics:structuredClone(manifest.diagnostics)});}catch(e){g.dispose();throw e;}
 };
}
export async function loadContinuousQuadrupedSkinFactory(THREE,{url=new URL('./sole-skin-v2-cache.json',import.meta.url),fetchImpl=globalThis.fetch}={}){
 const m=await fetchImpl(url);if(!m.ok)throw new Error(`Skin cache manifest HTTP ${m.status}`);const manifest=await m.json();
 const b=await fetchImpl(new URL(manifest.binary,url));if(!b.ok)throw new Error(`Skin cache binary HTTP ${b.status}`);
 return createCachedContinuousSkinFactory(THREE,decodeContinuousSkinCache(manifest,await b.arrayBuffer()));
}
