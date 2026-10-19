import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{valid,pathPoints}=require('./leaflet-map.js');
test('fallback rejects absent and invalid coordinates and preserves GeoJSON axis order',()=>{
 assert.equal(valid({latitude:null,longitude:10}),false);assert.equal(valid({latitude:NaN,longitude:10}),false);assert.equal(valid({latitude:91,longitude:10}),false);assert.equal(valid({latitude:60,longitude:10}),true);
 assert.deepEqual(pathPoints([[10,60],[null,60],[12,61],[200,70]]),[[60,10],[61,12]]);
});
const source=readFileSync(new URL('./google-standard-map.js',import.meta.url),'utf8');
test('localhost uses the free fallback without loading Google',async()=>{
 let calls=0;const fallback={provider:'openstreetmap'};
 const window={FjordLeafletMap:{preferred:()=>true,create:async(el,opts)=>{assert.equal(opts.userActivated,true);calls++;return fallback;}},FjordGoogleNorwayMap:{loadAPI:()=>assert.fail('Google must not load for local preview')}};
 vm.runInNewContext(source,{window});assert.equal(await window.FjordGoogleStandardMap.create({}, {enabled:true,userActivated:true}),fallback);assert.equal(calls,1);
});
test('a Google bootstrap error recovers instead of leaving a blank map',async()=>{
 let calls=0;const fallback={provider:'openstreetmap'};const window={FjordLeafletMap:{preferred:()=>false,create:async()=>{calls++;return fallback;}},FjordGoogleNorwayMap:{loadAPI:async()=>{throw Error('AUTH_FAILED');}}};
 vm.runInNewContext(source,{window});assert.equal(await window.FjordGoogleStandardMap.create({}, {enabled:true,userActivated:true}),fallback);assert.equal(calls,1);
});
