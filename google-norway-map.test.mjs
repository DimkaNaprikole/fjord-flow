import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const {validPoint,filterPlaces,cameraForPoints,scriptURL,createWithLibrary}=require('./google-norway-map.js');
test('camera ignores invalid positions and frames real route extent',()=>{
 assert.equal(validPoint({latitude:NaN,longitude:10}),false);assert.equal(validPoint({latitude:'59',longitude:10}),false);
 const c=cameraForPoints([{latitude:59,longitude:10},{latitude:61,longitude:12},{latitude:Infinity,longitude:1}]);
 assert.deepEqual(c.center,{lat:60,lng:11,altitude:0});assert.ok(c.range>400000&&c.range<600000);
 assert.equal(cameraForPoints([{latitude:59,longitude:10}]).range,2500);assert.equal(cameraForPoints([]).center.lat,65);
 assert.deepEqual(filterPlaces([{category:'cafe',latitude:59,longitude:10},{category:'other',latitude:60,longitude:11}],'cafe').length,1);
});
test('script loader has fixed official origin and rejects injected keys/callbacks',()=>{
 const u=new URL(scriptURL('AIza'+'x'.repeat(35),'uk'));assert.equal(u.origin,'https://maps.googleapis.com');assert.equal(u.pathname,'/maps/api/js');assert.equal(u.searchParams.get('libraries'),'maps3d');assert.equal(u.searchParams.get('language'),'uk');
 assert.throws(()=>scriptURL('https://evil.test/script.js'));assert.throws(()=>scriptURL('AIza'+'x'.repeat(35),'en','alert(1)'));
});
test('stub adapter refreshes markers, delegates clicks, fits route and cleans listeners',()=>{
 class Node {constructor(opts){Object.assign(this,opts);this.children=[];this.handlers={};this.style={};}append(n){this.children.push(n);}remove(){this.removed=true;}addEventListener(n,f){this.handlers[n]=f;}removeEventListener(n){delete this.handlers[n];}stopCameraAnimation(){}}
 const container=new Node(),clicked=[],errors=[];const adapter=createWithLibrary(container,{onPlaceClick:r=>clicked.push(r.id),onError:e=>errors.push(e.message)},{Map3DElement:Node,Marker3DInteractiveElement:Node});const map=container.children[0];map.handlers['gmp-error']();assert.deepEqual(errors,['GOOGLE_MAPS_RENDER_FAILED']);
 const rows=[{id:'a',name:'Cafe',category:'cafe',latitude:59,longitude:10},{id:'b',name:'Cabin',category:'cabin',latitude:61,longitude:12}];assert.equal(adapter.render(rows),2);const old=map.children[0];old.handlers['gmp-click']();assert.deepEqual(clicked,['a']);
 adapter.render(rows,{points:[rows[1]]},'cabin');assert.equal(adapter.markerCount,1);assert.equal(old.removed,true);assert.equal(old.handlers['gmp-click'],undefined);assert.equal(map.center.lat,61);
 adapter.reset();assert.equal(adapter.markerCount,2);adapter.destroy();assert.equal(adapter.markerCount,0);assert.equal(map.removed,true);assert.equal(adapter.render(rows),0);
});
test('loading adapter file and disabled create never access document or Google',async()=>{
 const context={window:{},URL,setTimeout,clearTimeout};vm.runInNewContext(readFileSync(new URL('./google-norway-map.js',import.meta.url),'utf8'),context);
 await assert.rejects(context.window.FjordGoogleNorwayMap.create(null,{}),/NOT_ENABLED/);
 await assert.rejects(context.window.FjordGoogleNorwayMap.create(null,{enabled:true,userActivated:false}),/NOT_ENABLED/);
});
