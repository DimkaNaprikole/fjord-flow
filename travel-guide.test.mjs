import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const state=JSON.parse(readFileSync(new URL('./demo-data/state.json',import.meta.url)));
function runtime(){
 const calls=[];
 const window={fetch:async input=>{const url=String(input);calls.push(url);if(url.includes('/demo-data/state.json'))return Response.json(state);if(url.endsWith('/demo-data/routes.json'))return Response.json(JSON.parse(readFileSync(new URL('./demo-data/routes.json',import.meta.url))));throw Error('Unexpected external request: '+url);}};
 const context={window,document:{currentScript:{src:'https://guide.test/fjord-flow/demo-runtime.js'},baseURI:'https://guide.test/fjord-flow/',documentElement:{lang:'en'}},location:{origin:'https://guide.test'},URL,URLSearchParams,Request,Response,DOMException,AbortController,setTimeout,clearTimeout};
 vm.runInNewContext(readFileSync(new URL('./demo-runtime.js',import.meta.url),'utf8'),context);
 return {fetch:window.fetch,calls};
}
test('Old checkout requests cannot reserve places, change inventory or send an external request',async()=>{
 const api=runtime(),r=await api.fetch('https://guide.test/fjord-flow/api/book',{method:'POST',body:JSON.stringify({event_id:'old-link',departure:'trolltunga',seats:2,paid:true,payment_method:'card'})});
 assert.equal(r.status,410);assert.match((await r.json()).error,/does not sell or reserve trips/);
 assert.deepEqual(api.calls,[]);
 const after=await (await api.fetch('https://guide.test/fjord-flow/api/state')).json();
 assert.deepEqual(after,state);
 for(const p of after.destinations)for(const field of ['price','date','capacity','available'])assert.equal(field in p,false,`${p.id} has no sales ${field}`);
});
test('The informational guide still serves a saved driving route with stops and geometry',async()=>{
 const snapshots=JSON.parse(readFileSync(new URL('./demo-data/routes.json',import.meta.url))),snapshot=Object.values(snapshots).find(x=>x.request&&x.result?.geometry?.length);
 assert.ok(snapshot,'An actual route snapshot is available');
 const api=runtime(),r=await api.fetch('https://guide.test/fjord-flow/api/route',{method:'POST',body:JSON.stringify(snapshot.request)});
 assert.equal(r.status,200);const route=await r.json();assert.ok(route.geometry.length>1);assert.deepEqual(route.selected_stops,snapshot.result.selected_stops);assert.ok(route.distance_km>0);
 assert.ok(api.calls.every(url=>url.includes('/demo-data/')),'Saved routes need no new provider request');
});
