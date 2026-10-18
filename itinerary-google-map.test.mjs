import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./itinerary.js',import.meta.url),'utf8');
function harness(){
  let loads=0,maps=0;const elements=new Map();
  class Element{constructor(){this.children=[];}append(...children){this.children.push(...children);}scrollIntoView(){}focus(){this.focused=true;}}
  const google={maps:{importLibrary:async name=>name==='maps'?{Map:class{constructor(container,options){maps++;this.options=options;this.zoom=9;}fitBounds(bounds,padding){this.bounds=bounds;this.padding=padding;}getZoom(){return this.zoom;}setZoom(z){this.zoom=z;}setCenter(p){this.center=p;}},InfoWindow:class{setContent(c){this.content=c;}open(args){this.args=args;}close(){this.args=null;}}}:{},LatLngBounds:class{constructor(){this.points=[];}extend(p){this.points.push(p);}},event:{addListenerOnce(map,event,callback){callback();}},marker:{PinElement:class{constructor(options){this.options=options;}},AdvancedMarkerElement:class{constructor(options){Object.assign(this,options);}addListener(event,handler){this.click=handler;}}}}};
  const context=vm.createContext({google,window:{FjordGoogleMapConfig:{enabled:true,apiKey:'restricted-key'},FjordGoogleNorwayMap:{loadAPI:async opts=>{assert.equal(opts.userActivated,true);loads++;}}},document:{getElementById:id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}},ResizeObserver:class{observe(){}},language:()=> 'nb',localized:v=>v,text:v=>v,node:(tag,value)=>{const e=new Element();e.textContent=value;return e;}});
  const helpers=source.slice(source.indexOf('  const position = p =>'),source.indexOf("  document.getElementById('itineraryClose')"));
  vm.runInContext(`let map,mapLoading,infoWindow,routeLine,markers=[],activePoints=[];const dialog={open:true};${helpers}\nglobalThis.api={ensureMap,showMarkers,focusStop,clearMap,fit,getMap:()=>map,getMarkers:()=>markers,getInfo:()=>infoWindow,setPoints:p=>activePoints=p};`,context);
  return {...context.api,counts:()=>({loads,maps}),elements};
}
test('itinerary uses a single native Google map with embedded controls and numbered stops',async()=>{
  const h=harness();await Promise.all([h.ensureMap(),h.ensureMap()]);await h.ensureMap();assert.deepEqual(h.counts(),{loads:1,maps:1});
  const map=h.getMap();assert.equal(map.options.gestureHandling,'greedy');assert.equal(map.options.fullscreenControl,false);assert.equal(map.options.mapTypeControl,true);assert.deepEqual(Array.from(map.options.mapTypeControlOptions.mapTypeIds),['roadmap','hybrid','satellite','terrain']);
  const points=[{latitude:60.3,longitude:10.5,name:'Gran'},{latitude:59.9,longitude:10.7,name:'Oslo'}];h.setPoints(points);h.showMarkers(points);const old=h.getMarkers();assert.equal(old.length,2);assert.equal(old[1].content.options.glyphText,'2');
  h.focusStop(points[1],1);assert.equal(map.center.lat,59.9);assert.equal(map.zoom,13);assert.equal(h.getInfo().args.anchor,old[1]);
  h.showMarkers(points.slice(0,1));assert.ok(old.every(marker=>marker.map===null));assert.equal(h.getMarkers().length,1);
});
test('itinerary keeps existing route geometry and navigation, without Leaflet or paid Google routing calls',()=>{
  assert.doesNotMatch(source,/\bL\.|leaflet|DirectionsService|RoutesService|routes\.googleapis/);
  assert.match(source,/new google\.maps\.Polyline/);
  assert.match(source,/router\.project-osrm\.org/);
  assert.match(source,/navigation\.searchParams\.set\('travelmode', 'driving'\)/);
  assert.match(source,/retry\.onclick=\(\)=>openItinerary\(activeKey,activeButton\)/);
});
