/* Owner-side only: canonical URLs remain in saved documents; blobs are transient. */
export const EMPTY_PREVIEW='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
export function cmsAssetId(value,endpoint){
 try{const u=new URL(value),base=new URL(endpoint);return u.origin===base.origin&&!u.search&&!u.hash&&/^\/cms\/assets\/[a-f0-9]{64}$/.test(u.pathname)?u.pathname.slice(-64):null;}catch{return null;}
}
export function createPrivatePreviews({endpoint,load,urls=URL,maxBytes=32*1024*1024,maxAssets=128}){
 const cache=new Map(),waiting=[],running=new Set(),retained=new Set();let size=0,epoch=0;
 const cancelled=()=>Error('Предпросмотр закрыт. Войдите владельцем снова.');
 // A slot covers the full load/Blob lifetime, including old loads after clear().
 // The retained byte budget below is separate from in-flight response memory.
 function pump(){
  while(running.size<3&&waiting.length){
   const job=waiting.shift();
   if(job.epoch!==epoch){job.reject(cancelled());continue;}
   running.add(job);
   (async()=>{try{job.resolve(await job.run());}catch(error){job.reject(error);}finally{running.delete(job);pump();}})();
  }
 }
 function enqueue(run,started){return new Promise((resolve,reject)=>{waiting.push({run,epoch:started,resolve,reject});pump();});}
 async function resolve(value){
  const id=cmsAssetId(value,endpoint);if(!id)return value;
  if(cache.has(value))return cache.get(value);
  if(cache.size>=maxAssets)throw Error('Слишком много фото для одного предпросмотра. Обновите окно редактора.');
  const started=epoch;
  const pending=enqueue(async()=>{
   if(started!==epoch)throw cancelled();
   const blob=await load('/cms/admin/assets/'+id);
   if(started!==epoch)throw cancelled();
   if(!(blob instanceof Blob)||!['image/png','image/jpeg','image/webp'].includes(blob.type)||blob.size>1800000)throw Error('Некорректный файл предпросмотра.');
   if(size+blob.size>maxBytes)throw Error('Лимит памяти предпросмотра. Обновите окно редактора.');
   const url=urls.createObjectURL(blob);retained.add(url);size+=blob.size;return url;
  },started);
  cache.set(value,pending);
  try{return await pending;}catch(error){if(cache.get(value)===pending)cache.delete(value);throw error;}
 }
 async function prepare(document){
  const values=new Set();
  function visit(v){if(typeof v==='string'){if(cmsAssetId(v,endpoint))values.add(v);}else if(v&&typeof v==='object')Object.values(v).forEach(visit);}
  visit(document);if(values.size>maxAssets)throw Error('Слишком много фото для одного предпросмотра.');
  const started=epoch;
  const pairs=await Promise.all([...values].map(async src=>[src,await resolve(src)]));
  if(started!==epoch)throw cancelled();
  return Object.fromEntries(pairs);
 }
 function clear(){
  epoch++;
  for(const job of waiting.splice(0))job.reject(cancelled());
  for(const job of running)job.reject(cancelled());
  for(const url of retained)urls.revokeObjectURL(url);
  retained.clear();cache.clear();size=0;
  // Running transports may be non-cancellable. Keep their slots occupied until
  // they settle; epoch checks prevent late blobs and cross-generation bursts.
 }
 return {resolve,prepare,clear};
}
export function previewDocument(document,mapping,origin){
 const clean={};
 if(mapping&&typeof mapping==='object'&&!Array.isArray(mapping)&&Object.keys(mapping).length<=128){
  for(const [src,url]of Object.entries(mapping)){
   if(/^https:\/\/[^/]+\/cms\/assets\/[a-f0-9]{64}$/.test(src)&&typeof url==='string'&&url.startsWith('blob:'+origin+'/')&&/^[a-zA-Z0-9-]+$/.test(url.slice(('blob:'+origin+'/').length)))clean[src]=url;
  }
 }
 function copy(v){if(typeof v==='string'){if(Object.hasOwn(clean,v))return clean[v];return /^https:\/\/[^/]+\/cms\/assets\/[a-f0-9]{64}$/.test(v)?EMPTY_PREVIEW:v;}if(Array.isArray(v))return v.map(copy);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,copy(x)]));return v;}
 return copy(document);
}
