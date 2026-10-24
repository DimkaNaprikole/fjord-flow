/* Static portfolio boundary: no accounts, personal inputs or live backend. */
(()=>{'use strict';
const originalFetch=window.fetch.bind(window),clone=x=>JSON.parse(JSON.stringify(x));
const assets=new Map();
const asset=name=>assets.get(name)||(()=>{const promise=originalFetch('./'+name,{credentials:'omit',referrerPolicy:'no-referrer'}).then(r=>{if(!r.ok)throw Error('Public snapshot unavailable');return r.json()});assets.set(name,promise);return promise;})();
window.FjordPortfolio=Object.freeze({demo:true,async api(path,payload){
 if(path==='state')return clone(await asset('demo-data/state.json'));
 if(path==='route'){
  const routes=await asset('demo-data/routes.json');
  const aliases={Bergen:'60.39323,5.3245','Åndalsnes':'62.56749,7.68709'},origin=aliases[String(payload.origin||'').trim()]||String(payload.origin||'').trim();
  const selected=Object.values(routes).find(r=>r.request.origin===origin&&r.request.destination===payload.destination&&JSON.stringify(r.request.stops||[])===JSON.stringify(payload.stops||[]));
  if(selected)return clone(selected.result);
  throw Error('This portfolio includes three saved route examples. No request was sent. Use a featured route or open Google Maps.');
 }
 throw Error('This feature is unavailable in the static portfolio demo.');
}});
window.fetch=async(input,init={})=>{
 const u=new URL(input instanceof Request?input.url:String(input),location.href);
 if(u.origin!==location.origin||/\/(?:api|auth|account|chat|admin)(?:\/|$)/i.test(u.pathname)||(init.method&&init.method.toUpperCase()!=='GET'))throw Error('Live services are disabled in this portfolio.');
 return originalFetch(input,{...init,credentials:'omit',referrerPolicy:'no-referrer'});
};
})();
