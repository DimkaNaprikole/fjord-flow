import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('full Google canvas enables wheel zoom and retains camera during label refresh',async()=>{
  let options,frames=0,types=[],markers=[],popup;
  class Map {constructor(el,opts){options=opts;}fitBounds(){frames++;}setMapTypeId(t){types.push(t);}}
  class InfoWindow {setContent(c){popup=c;}open(){}close(){}}
  class AdvancedMarkerElement {constructor(o){Object.assign(this,o);markers.push(this);}addListener(name,fn){this.click=fn;}}
  class LatLngBounds {extend(){}}
  const context={window:{FjordGoogleNorwayMap:{loadAPI:async()=>{}}},document:{createElement:()=>({append(){}})},google:{maps:{importLibrary:async name=>name==='maps'?{Map,InfoWindow}:{AdvancedMarkerElement},LatLngBounds,event:{trigger(){}}}},module:undefined};
  vm.runInNewContext(readFileSync(new URL('./google-standard-map.js',import.meta.url),'utf8'),context);
  await assert.rejects(context.window.FjordGoogleStandardMap.create({},{}),/NOT_ENABLED/);
  const adapter=await context.window.FjordGoogleStandardMap.create({replaceChildren(){}},{enabled:true,userActivated:true,buildInfo:r=>r.id});
  assert.equal(options.gestureHandling,'greedy');assert.equal(options.scrollwheel,true);assert.equal(options.zoomControl,true);assert.equal(options.mapTypeControl,true);assert.equal(options.fullscreenControl,false);
  const rows=[{id:'coffee',name:'Coffee',latitude:60,longitude:10,category:'cafe'},{id:'hill',name:'View',latitude:61,longitude:11,category:'rest',kind:'attraction'}];
  assert.equal(adapter.render(rows,null,'all'),2);assert.equal(frames,1);
  adapter.render(rows,null,'all',false);assert.equal(frames,1);assert.equal(markers.length,2);
  markers[0].click();assert.equal(popup,'coffee');
  adapter.render(rows,null,'cafe',true);assert.equal(frames,2);assert.equal(markers[0].map,null);
  adapter.setType('terrain');adapter.setType('invalid');assert.deepEqual(types,['terrain']);
  adapter.destroy();assert.equal(markers.at(-1).map,null);
});
