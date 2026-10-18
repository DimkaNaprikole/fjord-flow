import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {validPoint,filterPlaces,safeURL,routePoints}=require('./norway-overview-map.js');
test('only finite real coordinates and supported catalogue categories reach markers',()=>{
 const rows=[{id:'c',category:'cafe',latitude:60,longitude:10},{id:'s',category:'sauna',latitude:59,longitude:11},{id:'bad',category:'cabin',latitude:Infinity,longitude:10},{id:'outside',category:'rest',latitude:91,longitude:1},{id:'text',category:'cafe',latitude:'60',longitude:10},{id:'unknown',category:'other',latitude:60,longitude:10}];
 assert.deepEqual(filterPlaces(rows).map(p=>p.id),['c','s']);assert.deepEqual(filterPlaces(rows,'sauna').map(p=>p.id),['s']);assert.deepEqual(filterPlaces(rows,'cabin'),[]);assert.deepEqual(filterPlaces(null),[]);assert.equal(validPoint(null),false);
 assert.deepEqual(routePoints({points:rows}).map(p=>p.id),['c','s','unknown']);assert.deepEqual(routePoints({}),[]);
});
test('popup links allow secure websites without credentials, reject executable URLs',()=>{
 assert.equal(safeURL('https://visitvestfold.com/no/'), 'https://visitvestfold.com/no/');
 for(const url of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:pass@example.com','/relative','not a url'])assert.equal(safeURL(url),null,url);
});

test('every published catalogue place appears on the automatically populated map',()=>{
 const rows=JSON.parse(readFileSync(new URL('./norway-catalog.json',import.meta.url)));
 assert.equal(filterPlaces(rows).length,rows.length);
 for(const category of ['cafe','cabin','sauna','rest'])assert.equal(filterPlaces(rows,category).length,rows.filter(r=>r.category===category).length);
});

test('BUA equipment filter maps only published coordinates and keeps missing locations off the map',()=>{
 const directory=JSON.parse(readFileSync(new URL('./bua-locations.json',import.meta.url)));
 const visible=filterPlaces(directory.locations,'equipment');
 assert.equal(visible.length,directory.mappedCount);
 assert.equal(visible.length,filterPlaces(directory.locations).length);
 assert.ok(directory.locations.length>visible.length,'Unmapped BUA stay in the directory without invented pins');
 const map3d=require('./google-norway-map.js');
 assert.equal(map3d.filterPlaces(directory.locations,'equipment').length,visible.length);
});
import vm from 'node:vm';
const flush = async () => {for(let i=0;i<30;i++)await Promise.resolve();};
function overviewHarness({catalogueRows=[],extraRows=[],catalogueContent}={}){
 const nodes=[],events={},calls={create:0,geolocation:0,locations:[],fetches:[],renders:[],selections:[]};
 let resolveCatalogue,resolveMap;
 const catalogue=new Promise(resolve=>{resolveCatalogue=()=>resolve({ok:true,json:async()=>catalogueRows});});
 const mapReady=new Promise(resolve=>{resolveMap=()=>resolve(map);});
 const map={resize(){},render(rows,route,category,fit){calls.renders.push(rows);calls.selections.push({route,category,fit,ids:filterPlaces(rows,category).map(p=>p.id)});return rows.length;},locate(p){calls.locations.push(p);}};
 function node(tag){const n={tag,children:[],listeners:{},style:{setProperty(){}},dataset:{},hidden:false,disabled:false,textContent:'',setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},replaceChildren(...v){this.children=v;},before(){},addEventListener(k,fn){this.listeners[k]=fn;},click(){if(!this.disabled)return this.listeners.click?.();}};nodes.push(n);return n;}
 const footer=node('footer');
 const window={FjordCatalogueContent:catalogueContent,FjordGoogleMapConfig:{enabled:true},FjordGoogleStandardMap:{create(){calls.create++;return mapReady;}},FjordBrowserGeolocation:{locate(){calls.geolocation++;return {promise:Promise.resolve({coords:{latitude:60.3592,longitude:10.5728}})};}},addEventListener(k,fn){events[k]=fn;}};
 const document={documentElement:{lang:'en'},createElement:node,querySelector:s=>s==='footer'?footer:null};
 vm.runInNewContext(readFileSync(new URL('./norway-overview-map.js',import.meta.url),'utf8'),{window,document,URL,AbortController,setTimeout,clearTimeout,fetch(url){calls.fetches.push(url);return url.includes('norway-catalog')?catalogue:Promise.resolve({ok:true,json:async()=>url.includes('map-attractions')?extraRows:[]});}});
 return {calls,events,window,resolveCatalogue,resolveMap,filters:nodes.find(n=>n.className==='norway-overview__filters'),fit:nodes.find(n=>n.tag==='button'&&n.textContent==='Show selection'),standard:nodes.find(n=>n.tag==='button'&&n.textContent==='Google Maps'),location:nodes.find(n=>n.tag==='button'&&n.textContent.includes('My location'))};
}
test('immediate cached GPS waits for shared deferred catalogue and map activation',async()=>{
 const h=overviewHarness();
 const first=h.standard.click(),second=h.standard.click(),location=h.location.click();
 await flush();assert.equal(h.calls.geolocation,1);assert.equal(h.calls.create,0);assert.equal(h.calls.locations.length,0);
 assert.equal(h.calls.fetches.filter(url=>url.includes('norway-catalog')).length,1);
 h.resolveCatalogue();await flush();assert.equal(h.calls.create,1);assert.equal(h.calls.locations.length,0,'GPS must wait until map is ready');
 h.resolveMap();await Promise.all([first,second,location]);
 assert.equal(h.calls.create,1,'rapid actions share one map creation');
 assert.equal(h.calls.locations.length,1);assert.equal(h.calls.locations[0].latitude,60.3592);assert.equal(h.location.disabled,false);
});

test('CMS snapshots replace map catalogue markers and retain independent attractions',async()=>{
 const catalogueRows=[{id:'base',name:'Base',category:'cafe',latitude:60,longitude:10}];
 const extraRows=[{id:'attraction',name:'Attraction',category:'rest',latitude:61,longitude:11}];
 let replacements=[{id:'custom',name:'Custom sauna',category:'sauna',latitude:62,longitude:12}];
 const baselines=[];
 const h=overviewHarness({catalogueRows,extraRows,catalogueContent:{merge(rows){baselines.push(rows);return replacements;}}});
 // An early event before lazy data loading must not lose supplemental map entries.
 h.events['fjord:catalogue-content']();
 h.resolveCatalogue();h.resolveMap();await h.standard.click();
 assert.deepEqual(Array.from(h.calls.renders.at(-1),r=>r.id),['custom','attraction']);
 replacements=[];h.events['fjord:catalogue-content']();
 assert.deepEqual(Array.from(h.calls.renders.at(-1),r=>r.id),['attraction'],'hidden catalogue records disappear, supplementary places remain');
 replacements=catalogueRows;h.events['fjord:catalogue-content']();
 assert.deepEqual(Array.from(h.calls.renders.at(-1),r=>r.id),['base','attraction']);
 assert.ok(baselines.slice(1).every(rows=>rows===catalogueRows),'overrides are reapplied to raw catalogue only');
 assert.equal(h.calls.geolocation,0,'catalogue publication does not request visitor location');
 assert.equal(h.calls.fetches.filter(url=>url.includes('norway-catalog')).length,1);
});

test('a CMS runtime arriving after map activation refreshes markers without recreating the map',async()=>{
 const base={id:'old',name:'Old',category:'cafe',latitude:60,longitude:10};
 const updated={...base,name:'Updated',latitude:61,longitude:11};
 const h=overviewHarness({catalogueRows:[base]});
 h.resolveCatalogue();h.resolveMap();await h.standard.click();
 assert.equal(h.calls.renders.at(-1)[0].name,'Old');
 h.window.FjordCatalogueContent={merge(){return [updated];}};
 h.events['fjord:catalogue-content']();
 assert.equal(h.calls.renders.at(-1)[0].name,'Updated');
 assert.equal(h.calls.renders.at(-1)[0].latitude,61);
 assert.equal(h.calls.create,1);
});

test('overview starts with cafes and fitting a category does not restore all markers',async()=>{
 const cafe={id:'cafe',category:'cafe',latitude:60,longitude:10};
 const sauna={id:'sauna',category:'sauna',latitude:61,longitude:11};
 const h=overviewHarness({catalogueRows:[cafe,sauna]});
 h.resolveCatalogue();h.resolveMap();await h.standard.click();
 assert.equal(h.calls.selections.at(-1).category,'cafe');
 assert.deepEqual(h.calls.selections.at(-1).ids,['cafe']);
 assert.deepEqual(Array.from(h.filters.children,b=>b.textContent),['Cafés','Cabins','Saunas','Places to unwind','BUA · equipment loans','Shopping centres']);
 h.filters.children.find(b=>b.textContent==='Saunas').click();
 assert.equal(h.calls.selections.at(-1).category,'sauna');
 h.fit.click();
 assert.equal(h.calls.selections.at(-1).category,'sauna');
 assert.deepEqual(h.calls.selections.at(-1).ids,['sauna']);
 assert.equal(h.calls.selections.at(-1).fit,true);
 assert.equal(h.filters.children.find(b=>b.textContent==='Saunas')['aria-pressed'],'true');
});
