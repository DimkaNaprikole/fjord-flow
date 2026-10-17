/* Exercise the real catalogue callbacks and helper without a browser/GPS permission. */
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const helper = createRequire(import.meta.url)('./browser-geolocation.js');
const source = await readFile(new URL('./norway-catalog.js', import.meta.url), 'utf8');
const marker = "  window.addEventListener('fjordlanguagechange', rebuild);";
assert.ok(source.includes(marker));
const instrumented = source.replace(marker, `window.__test = {requestGPS, chooseCity, setRecords: value => {records = value;}, snapshot: () => ({origin:originState.current, message:geoMessage, baseChoice, radius, category, query})};\n${marker}`);
const flush = async () => {for (let n=0;n<24;n++) await Promise.resolve();};
function harness({deferTowns = false} = {}) {
  const calls = [], cleared = [], events = {}, fetches = [];
  let resolveTowns;
  const townRows = [{name:'Jaren',latitude:60.392,longitude:10.561}];
  const provider = {getCurrentPosition(success,failure,options) {calls.push({success,failure,options});}, watchPosition(success,failure,options) {calls.push({success,failure,options}); return 123;}, clearWatch(id) {cleared.push(id);}};
  const window = {addEventListener(name, callback) {events[name]=callback;}, FjordBrowserGeolocation:{locate(options) {return helper.locate({...options,geolocation:provider});}}};
  const document = {getElementById() {return null;},body:{},documentElement:{lang:'nb'}};
  const context = {window,document,URL,Intl,AbortController,setTimeout,clearTimeout,MutationObserver:class {observe() {} disconnect() {}},fetch(url) {
    fetches.push(url); const response = {ok:true,json:async()=>({towns:townRows})};
    return deferTowns ? new Promise(resolve=>{resolveTowns=()=>resolve(response);}) : Promise.resolve(response);
  }};
  vm.runInNewContext(instrumented,context);
  return {api:window.__test,calls,cleared,events,fetches,resolveTowns:()=>resolveTowns()};
}
const actual = {coords:{latitude:60.398,longitude:10.569,accuracy:418},timestamp:123};
test('catalogue does not request GPS or settlement data on page load; actual GPS stays the origin',async()=>{
  const h=harness(); assert.equal(h.calls.length,0); assert.equal(h.fetches.length,0);
  h.api.requestGPS(); h.calls[0].success(actual); await flush();
  const s=h.api.snapshot(); assert.equal(s.origin.latitude,actual.coords.latitude); assert.equal(s.origin.longitude,actual.coords.longitude); assert.equal(s.origin.accuracy,418); assert.equal(s.origin.nearestTown,'Jaren'); assert.equal(s.radius,'20');
});
test('manual choice cancels active fallback watch and cannot be overwritten',async()=>{
  const h=harness(); h.api.requestGPS(); h.calls[0].failure({code:3}); assert.equal(h.api.snapshot().message,'17');
  h.api.chooseCity('Oslo'); h.calls[1].success(actual); await flush();
  assert.equal(h.api.snapshot().origin.name,'Oslo'); assert.deepEqual(h.cleared,[123]);
});
test('late local settlement fetch cannot overwrite a manual choice after GPS response',async()=>{
  const h=harness({deferTowns:true}); h.api.requestGPS(); h.calls[0].success(actual); await flush();
  h.api.chooseCity('Gran'); h.resolveTowns(); await flush(); assert.equal(h.api.snapshot().origin.name,'Gran');
});
test('pagehide cancels watch and clears searching state',async()=>{
  const h=harness(); h.api.requestGPS(); h.calls[0].failure({code:2}); h.events.pagehide(); await flush();
  assert.deepEqual(h.cleared,[123]); assert.equal(h.api.snapshot().message,'');
});
test('denied access does not retry or substitute a town',async()=>{
  const h=harness(); h.api.requestGPS(); h.calls[0].failure({code:1}); await flush();
  assert.equal(h.calls.length,1); assert.equal(h.api.snapshot().message,'7'); assert.equal(h.api.snapshot().origin,null);
});
test('route-stop catalogue selection cancels GPS and uses the chosen stop without claiming GPS',async()=>{
  const h=harness(); h.api.requestGPS(); h.calls[0].failure({code:3});
  h.events['fjord:catalogue-nearby']({detail:{lat:58.34,lng:8.59,name:'Grimstad',category:'cabin'}});
  h.calls[1].success(actual); await flush();
  const s=h.api.snapshot(); assert.equal(s.baseChoice,'stop'); assert.equal(s.radius,'20');
  assert.equal(s.origin.name,'Grimstad'); assert.equal(s.origin.latitude,58.34); assert.deepEqual(h.cleared,[123]);
});
test('invalid catalogue-stop coordinates and categories cannot overwrite the origin',()=>{
  const h=harness(); h.api.chooseCity('Gran');
  for(const detail of [{lat:91,lng:8,name:'Bad',category:'cabin'},{lat:58,lng:8,name:'Bad',category:'unknown'}]) h.events['fjord:catalogue-nearby']({detail});
  assert.equal(h.api.snapshot().origin.name,'Gran');
});


test('overview map selection opens the exact catalogue record and rejects unknown IDs',async()=>{
  const h=harness(); h.api.setRecords([{id:'cafe-test',name:'Coastal Café',category:'cafe',latitude:59.13,longitude:10.22}]);
  h.api.requestGPS(); h.calls[0].failure({code:3});
  h.events['fjord:catalogue-select']({detail:{id:'cafe-test'}}); h.calls[1].success(actual); await flush();
  const s=h.api.snapshot(); assert.equal(s.origin.name,'Coastal Café'); assert.equal(s.baseChoice,'stop'); assert.equal(s.category,'cafe'); assert.equal(s.query,'Coastal Café'); assert.deepEqual(h.cleared,[123]);
  h.events['fjord:catalogue-select']({detail:{id:'missing'}}); assert.equal(h.api.snapshot().origin.name,'Coastal Café');
});
