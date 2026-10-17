import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('./cafe-nearby.js',import.meta.url),'utf8');
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function setup(){
 const nodes=new Map(),events=new Map(),calls=[];let nextTown=[],finishSearch,searches=0;
 class Node{set id(value){nodes.set(value,this)}constructor(){this.value='';this.children=[];this.dataset={};this.hidden=false}set innerHTML(html){this.html=html;for(const match of html.matchAll(/id="([^"]+)"/g))if(!nodes.has(match[1]))nodes.set(match[1],new Node())}get innerHTML(){return this.html||''}setAttribute(){}querySelector(){return null}querySelectorAll(){return []}prepend(){}insertAdjacentHTML(){}append(child){this.children.push(child)}replaceChildren(){this.children=[]}remove(){nodes.delete('cafeNearby')}}
 const section=new Node();nodes.set('cafeStops',section);
 const window={FjordI18n:{language:'en'},addEventListener:(name,fn)=>events.set(name,fn),FjordCafeProvider:{search:()=>{searches++;return new Promise(resolve=>finishSearch=resolve)}}};
 const context={window,document:{getElementById:id=>nodes.get(id),createElement:()=>new Node(),body:new Node()},navigator:{},URL,URLSearchParams,AbortController,setTimeout,clearTimeout,MutationObserver:class{observe(){}},fetch:async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>String(url).includes('geonorge')?{navn:nextTown}:{destinations:[{id:'bergen',name:'Bergen',latitude:60.39,longitude:5.32}]}}}};
 vm.runInNewContext(source,context);
 return{nodes,events,calls,get searches(){return searches},setTown:r=>nextTown=r,finish:r=>finishSearch(r)};
}
const f=setup();await settle();
assert.equal(f.nodes.get('cafeNearbyPlace').value,'','No hidden Bergen default');
f.nodes.get('cafeNearbyForm').onsubmit({preventDefault(){}});await settle();assert.equal(f.searches,0,'No Places request without a centre');
f.events.get('fjordexplorerphoto')?.({detail:{place:{id:'bergen'}}});assert.equal(f.nodes.get('cafeNearbyPlace').value,'','Slideshow does not select a centre');
f.events.get('fjord:nearby-cafes')({detail:{lat:60.45,lng:10.5,name:'Gran'}});
assert.match(f.nodes.get('cafeNearbyCenter').textContent,/Gran/);assert.equal(f.nodes.get('cafeNearbyGPS').textContent,'Use my location');assert.equal(f.searches,0,'Event never starts a paid café search');
f.events.get('fjord:nearby-cafes')({detail:{lat:999,lng:10.5,name:'invalid'}});assert.match(f.nodes.get('cafeNearbyCenter').textContent,/Gran/,'Invalid coordinates do not replace centre');
f.nodes.get('cafeNearbyForm').onsubmit({preventDefault(){}});assert.equal(f.searches,1);
f.events.get('fjord:nearby-cafes')({detail:{lat:59.91,lng:10.75,name:'Oslo'}});f.finish([{name:'Stale café'}]);await settle();assert.equal(f.nodes.get('cafeNearbyResults').innerHTML,'','Changing centre invalidates in-flight café results');
f.setTown([{skrivemåte:'Gran',representasjonspunkt:{nord:60.45,øst:10.5},kommuner:[{kommunenavn:'Gran'}],navneobjekttype:'Tettsted'},{skrivemåte:'Bad',representasjonspunkt:{nord:200,øst:10}}]);f.nodes.get('cafeNearbyTown').value='Gran';f.nodes.get('cafeNearbyTownForm').onsubmit({preventDefault(){}});await settle();
assert.equal(f.nodes.get('cafeNearbyTownResults').children.length,1,'Invalid geocoder coordinates filtered');assert.match(f.nodes.get('cafeNearbyCenter').textContent,/Oslo/,'Geocoder results require explicit choice');
f.nodes.get('cafeNearbyTownResults').children[0].onclick();assert.match(f.nodes.get('cafeNearbyCenter').textContent,/Gran/);assert.equal(f.searches,1,'Town search and selection do not call Places');
const townCall=f.calls.find(c=>c.url.includes('geonorge'));assert.equal(new URL(townCall.url).searchParams.get('sok'),'Gran');assert.equal(townCall.options.credentials,'omit');
f.setTown([]);f.nodes.get('cafeNearbyTown').value='Unknown';f.nodes.get('cafeNearbyTownForm').onsubmit({preventDefault(){}});await settle();assert.match(f.nodes.get('cafeNearbyTownStatus').textContent,/No locations/);
console.log('PASS: explicit centre, no slideshow drift, no automatic Places requests, invalid coordinates, stale café response, explicit geocoded place selection, empty geocoder results.');
