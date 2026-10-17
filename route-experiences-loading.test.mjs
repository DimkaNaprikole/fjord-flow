import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const code = readFileSync(new URL('./route-experiences.js', import.meta.url), 'utf8');
const venue = {id:'test-stop', name:'Test attraction', website:'https://example.com/'};
const deferred = () => {let resolve; const promise = new Promise(r => {resolve=r;}); return {promise,resolve};};
const flush = async () => {for(let i=0;i<8;i++)await Promise.resolve();};
function setup(fetch) {
  const timers=new Map(), events=[]; let nextTimer=0;
  const window={addEventListener(){},dispatchEvent(event){events.push(event);}};
  vm.runInNewContext(code, {window, document:{getElementById:()=>null, body:{}, documentElement:{lang:'en'}},
    MutationObserver:class {observe(){}}, matchMedia:()=>({matches:false}), fetch, URL, AbortController,
    CustomEvent:class {constructor(type,options){this.type=type;Object.assign(this,options);}},console:{info(){}},
    setTimeout(fn,ms){timers.set(++nextTimer,{fn,ms});return nextTimer;},clearTimeout(id){timers.delete(id);}});
  return {api:window.FjordExperiences,timers,events,expire(){assert.equal(timers.size,1);const [id,timer]=[...timers][0];assert.equal(timer.ms,8000);timers.delete(id);timer.fn();}};
}

test('stalled attraction request is aborted, optional data fails honestly, and retry recovers',async()=>{
  const slow=deferred();let calls=0,firstSignal;
  const h=setup((_url,options)=>{calls++;if(calls===1){firstSignal=options.signal;return slow.promise;}return Promise.resolve({ok:true,json:async()=>[venue]});});
  const waiting=h.api.load();h.expire();
  assert.equal(await waiting,null,'itinerary must receive failure, not a successful empty list');
  assert.equal(firstSignal.aborted,true);assert.equal(h.events.length,0);
  assert.equal((await h.api.load())[0].id,venue.id);
  assert.equal(calls,2);assert.equal(h.events.length,1);assert.equal(h.timers.size,0);
  slow.resolve({ok:true,json:async()=>[{...venue,id:'late-old-stop'}]});await flush();
  assert.equal(h.api.places[0].id,venue.id,'late timed-out data must not overwrite a successful retry');
});

test('timeout includes a response whose JSON body stalls',async()=>{
  const body=deferred();let signal;
  const h=setup(async(_url,options)=>{signal=options.signal;return {ok:true,json:()=>body.promise};});
  const waiting=h.api.load();await flush();h.expire();
  assert.equal(await waiting,null);assert.equal(signal.aborted,true);assert.equal(h.timers.size,0);
});

test('successful attraction load clears its deadline and shares the request',async()=>{
  const response=deferred();let calls=0;
  const h=setup(()=>{calls++;return response.promise;});
  const first=h.api.load(),second=h.api.load();assert.equal(first,second);
  response.resolve({ok:true,json:async()=>[venue]});
  assert.equal((await first)[0].id,venue.id);assert.equal(calls,1);assert.equal(h.timers.size,0);
  assert.equal((await h.api.load())[0].id,venue.id);assert.equal(calls,1);
});
