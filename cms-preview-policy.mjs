export const PREVIEW_POLICY_PATH='/cms/admin/assets/c68e6d40bc59d4567ec90198347a67bc14eab2d8f21f244dec3a6c575a1c34b6';
const TRUSTED_ORIGIN='https://fjord-flow-chat.laurkent123.workers.dev';
export async function requestPreviewPolicy({endpoint,getToken,isAuthorized,getRevision,fetchImpl=fetch,timeoutMs=15000,clock=()=>performance.now()}={}){
 if(new URL(endpoint).href!==TRUSTED_ORIGIN+'/'||!isAuthorized())throw Error('POLICY_CHECK_UNAVAILABLE');
 const revision=getRevision(),target=TRUSTED_ORIGIN+PREVIEW_POLICY_PATH,controller=new AbortController(),deadline=clock()+timeoutMs;
 let expired=false,timer;
 const current=()=>!expired&&!controller.signal.aborted&&clock()<deadline&&isAuthorized()&&getRevision()===revision;
 const operation=(async()=>{
  const token=await getToken();
  if(!current()||!token)throw Error('POLICY_CHECK_UNAVAILABLE');
  const response=await fetchImpl(target,{method:'GET',headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
  try{
   if(!current()||response.redirected||response.url!==target)throw Error('POLICY_CHECK_UNAVAILABLE');
   return {status:response.status,cacheControl:response.headers.get('Cache-Control'),contentType:response.headers.get('Content-Type')};
  }finally{await response.body?.cancel();}
 })();
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;controller.abort();reject(Error('POLICY_CHECK_TIMEOUT'));},timeoutMs);});
 try{return await Promise.race([operation,timeout]);}finally{clearTimeout(timer);}
}
export function previewPolicyResult(value,{observedAt,serviceWorkerControlled=false}={}){
 const clean=text=>typeof text==='string'&&text.length<=240?text:null;
 const cacheControl=clean(value?.cacheControl),contentType=clean(value?.contentType);
 const directives=(cacheControl||'').toLowerCase().split(',').map(x=>x.trim());
 const cacheAge=directives.some(x=>{const match=x.match(/^(?:s-maxage|max-age)\s*=\s*"?(\d+)/);return match&&Number(match[1])>0;});
 const pass=value?.status===200&&directives.includes('private')&&directives.includes('no-store')&&!directives.includes('public')&&!cacheAge&&contentType?.toLowerCase().startsWith('image/')&&!serviceWorkerControlled;
 return {target:PREVIEW_POLICY_PATH,observedAt,status:Number.isInteger(value?.status)?value.status:null,cacheControl,contentType,requestCache:'no-store',serviceWorkerControlled,verdict:pass?'PASS_PRIVATE_NO_STORE':'NOT_CHECKED'};
}
export function mountPreviewPolicyCheck(host,{load,isAuthorized,getRevision,hasServiceWorker=()=>Boolean(navigator.serviceWorker?.controller),now=()=>new Date().toISOString(),eventTarget=window}={}){
 const section=document.createElement('section');section.className='owner-password-panel';
 const title=document.createElement('h2');title.textContent='Проверка закрытого тестового фото';
 const note=document.createElement('p');note.textContent='Один запрос без использования кэша браузера. Проверяется только синтетическое тестовое фото; содержание сайта не меняется.';
 const button=document.createElement('button');button.type='button';button.textContent='Проверить HTTP-защиту фото';
 const status=document.createElement('p');status.setAttribute('role','status');
 const result=document.createElement('pre');result.style.whiteSpace='pre-wrap';result.style.overflowWrap='anywhere';result.hidden=true;
 section.append(title,note,button,status,result);host.append(section);
 let epoch=0,running=false,alive=true;
 function clear(){epoch++;result.textContent='';result.hidden=true;status.textContent='';}
 function sync(){section.hidden=!isAuthorized();button.disabled=running||!isAuthorized();if(!isAuthorized())clear();}
 button.addEventListener('click',async()=>{
  if(!alive||running||!isAuthorized())return;
  const revision=getRevision(),generation=++epoch;running=true;sync();status.textContent='Проверяем ответ сервера…';result.hidden=true;
  try{
   const value=await load(PREVIEW_POLICY_PATH);
   if(!alive||generation!==epoch||revision!==getRevision()||!isAuthorized())return;
   const evidence=previewPolicyResult(value,{observedAt:now(),serviceWorkerControlled:hasServiceWorker()});
   result.textContent=JSON.stringify(evidence,null,2);result.hidden=false;
   status.textContent=evidence.verdict==='PASS_PRIVATE_NO_STORE'?'Подтверждено: ответ 200, private, no-store.':'Проверка не подтверждена. Смотрите доступные поля ответа; пустой заголовок или ServiceWorker не считаются успешной проверкой.';
  }catch{
   if(alive&&generation===epoch&&revision===getRevision()&&isAuthorized()){result.textContent=JSON.stringify({target:PREVIEW_POLICY_PATH,observedAt:now(),verdict:'NOT_CHECKED'},null,2);result.hidden=false;status.textContent='Ответ не получен или проверка недоступна. NOT_CHECKED; автоматического повтора нет.';}
  }finally{running=false;if(alive)sync();}
 });
 const changed=()=>{clear();sync();};const hidden=()=>clear();eventTarget.addEventListener('fjord:auth-changed',changed);eventTarget.addEventListener('pagehide',hidden);sync();
 return {sync,destroy(){alive=false;clear();eventTarget.removeEventListener('fjord:auth-changed',changed);eventTarget.removeEventListener('pagehide',hidden);section.remove();}};
}
