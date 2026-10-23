const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fetchNewsSnapshot}=require('./municipal-news.js');

test('a later visit bypasses a cached agenda and receives the newly published event',async()=>{
 const cache=new Map(),requests=[];
 let published=[{id:'old'}];
 const fetcher=async(url,options)=>{
  requests.push({url,options});
  const directory=url.includes('municipalities');
  const body=directory?{municipalities:[{id:'4601'}]}:{items:published.slice()};
  if(options.cache!=='no-store'&&cache.has(url))return cache.get(url);
  const response={ok:true,json:async()=>body};cache.set(url,response);return response;
 };
 assert.equal((await fetchNewsSnapshot(fetcher,100)).data.items.length,1);
 published.push({id:'bergen-julemarked-2026'});
 assert.equal((await fetchNewsSnapshot(fetcher,101)).data.items.length,2);
 const agenda=requests.filter(x=>x.url.includes('municipal-news-data'));
 assert.notEqual(agenda[0].url,agenda[1].url);
 assert.ok(agenda.every(x=>x.options.cache==='no-store'));
});

test('failed or malformed responses never become an accepted news snapshot',async()=>{
 await assert.rejects(fetchNewsSnapshot(async()=>({ok:false}),1),/unavailable/);
 await assert.rejects(fetchNewsSnapshot(async()=>({ok:true,json:async()=>({})}),2),/invalid/);
});
