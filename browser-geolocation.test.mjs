import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';
const {locate} = createRequire(import.meta.url)('./browser-geolocation.js');
const position = (latitude = 60.36, accuracy = 38) => ({coords: {latitude, longitude:10.57, accuracy}, timestamp:1234});
function fake() {
  const calls = [], cleared = [];
  const provider = {getCurrentPosition(success, failure, options) {calls.push({type:'get',success,failure,options});}, watchPosition(success, failure, options) {calls.push({type:'watch',success,failure,options}); return 42;}, clearWatch(id) {cleared.push(id);}};
  return {provider,calls,cleared};
}
test('does not request location without explicit user action', async () => {
  const f = fake(); await assert.rejects(locate({geolocation:f.provider}).promise, e => e.code === 'gesture-required'); assert.equal(f.calls.length, 0);
});
test('coarse success preserves actual coordinates, accuracy and timestamp', async () => {
  const f = fake(), r = locate({geolocation:f.provider,userInitiated:true});
  assert.deepEqual(f.calls[0].options, {enableHighAccuracy:false, maximumAge:60000,timeout:12000});
  f.calls[0].success(position()); const result = await r.promise;
  assert.equal(result.coords.latitude,60.36); assert.equal(result.coords.accuracy,38); assert.equal(result.timestamp,1234); assert.equal(f.calls.length,1);
});
test('permission denial is final and never retried', async () => {
  const f = fake(), r = locate({geolocation:f.provider,userInitiated:true}); f.calls[0].failure({code:1});
  await assert.rejects(r.promise, e=>e.code===1); assert.equal(f.calls.length,1); assert.deepEqual(f.cleared,[]);
});
test('timeout falls back once to fresh watch; stale coarse result cannot overwrite it', async () => {
  const f = fake(), stages = [], r = locate({geolocation:f.provider,userInitiated:true,onStage:s=>stages.push(s.stage)});
  f.calls[0].failure({code:3}); assert.equal(f.calls.length,2);
  assert.deepEqual(f.calls[1].options,{enableHighAccuracy:true,maximumAge:0,timeout:25000});
  f.calls[0].success(position(61)); f.calls[1].success(position(62,12));
  const result = await r.promise; assert.equal(result.coords.latitude,62); assert.equal(result.coords.accuracy,12); assert.deepEqual(f.cleared,[42]); assert.deepEqual(stages,['coarse','fresh']);
});
test('unavailable coarse provider retries and fresh denial is final', async () => {
  const f = fake(), r = locate({geolocation:f.provider,userInitiated:true}); f.calls[0].failure({code:2}); f.calls[1].failure({code:1});
  await assert.rejects(r.promise,e=>e.code===1); assert.equal(f.calls.length,2); assert.deepEqual(f.cleared,[42]);
});
test('cancel clears watch and ignores late callbacks', async () => {
  const f = fake(), r = locate({geolocation:f.provider,userInitiated:true}); f.calls[0].failure({code:2});
  const rejected = assert.rejects(r.promise,e=>e.code==='cancelled'); r.cancel(); f.calls[1].success(position()); f.calls[0].success(position()); await rejected; assert.deepEqual(f.cleared,[42]);
});
test('own timers bound both attempts even when provider never calls back', async () => {
  const f = fake(), r = locate({geolocation:f.provider,userInitiated:true,coarseTimeoutMs:5,freshTimeoutMs:5});
  await assert.rejects(r.promise,e=>e.code===3); assert.equal(f.calls.length,2); assert.deepEqual(f.cleared,[42]);
});
test('invalid coarse result cannot become a guessed origin', async () => {
  const f = fake(), r = locate({geolocation:f.provider,userInitiated:true}); f.calls[0].success(position(999)); assert.equal(f.calls.length,2); f.calls[1].success(position(0,0)); assert.equal((await r.promise).coords.latitude,0);
});
test('synchronous watch callback still clears the returned watch ID', async () => {
  const f = fake(); f.provider.watchPosition = success => {success(position()); return 99;};
  const r = locate({geolocation:f.provider,userInitiated:true}); f.calls[0].failure({code:3}); await r.promise; assert.deepEqual(f.cleared,[99]);
});
