import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('./geoapify-cafes.js',import.meta.url),'utf8');
const feature=(id,lat=60.45,lon=10.5,name='Cafe '+id)=>({properties:{place_id:id,name,lat,lon,city:'Gran'}});
function setup({enabled=true,features=[feature('near')],detailsFailure=false,curated=[],commons=null}={}){
 const calls=[],window={};
 const context={window,document:{baseURI:'https://example.org/fjord-flow/',currentScript:null},URL,URLSearchParams,AbortController,setTimeout:(fn,ms)=>ms===250?setTimeout(fn,0):setTimeout(fn,ms),clearTimeout,fetch:async(value,options)=>{const u=new URL(value);calls.push({url:u,options});if(u.hostname==='commons.wikimedia.org')return{ok:true,json:async()=>commons};if(u.pathname.endsWith('geoapify-config.json'))return{ok:true,json:async()=>({enabled,apiKey:'public-restricted-key',maxResults:12})};if(u.pathname.endsWith('cafes.json'))return{ok:true,json:async()=>curated};if(u.pathname.endsWith('/place-details')){if(detailsFailure)return{ok:false,status:429};return{ok:true,json:async()=>({features:[{properties:{feature_type:'details',opening_hours:'Mo-Fr 09:00-17:00',website:'https://real-cafe.no/',wiki_and_media:{image:'https://unlicensed.example/photo.jpg'}}}]})}}return{ok:true,json:async()=>({features})}}};
 vm.runInNewContext(source,context);return{api:window.FjordCafeProvider,calls};
}
const f=setup();assert.equal(f.calls.length,0,'No requests on load');
await assert.rejects(f.api.search({center:{lat:999,lng:10}}),{code:'INVALID_CENTER'});assert.equal(f.calls.length,0);
await assert.rejects(f.api.search({center:{lat:60,lng:10},openOnly:true}),{code:'OPEN_STATUS_UNAVAILABLE'});assert.equal(f.calls.length,0,'Unsupported open filter costs no requests');
const results=await f.api.search({center:{lat:60.45,lng:10.5},radiusMeters:10000});
assert.equal(results.length,1);assert.equal(results[0].openNow,null);assert.equal(results[0].openingHoursRaw,'Mo-Fr 09:00-17:00');assert.equal(results[0].website,'https://real-cafe.no/');assert.equal(results[0].photos.length,0,'Unknown photo license is not guessed');
const places=f.calls.find(c=>c.url.pathname.endsWith('/places'));assert.equal(places.url.searchParams.get('filter'),'circle:10.5,60.45,10000');assert.equal(places.url.searchParams.get('categories'),'catering.cafe');assert.equal(places.options.credentials,'omit');
const bounded=setup({features:[feature('far',61.4),...Array.from({length:12},(_,i)=>feature(String(i),60.45+i*.001)),feature('0')],detailsFailure:true});
const nearby=await bounded.api.search({center:{lat:60.45,lng:10.5},radiusMeters:10000});assert.equal(nearby.length,12);assert.equal(bounded.calls.filter(c=>c.url.pathname.endsWith('/place-details')).length,8,'Bounded enrichment calls');assert.equal(nearby[0].id,'0');assert(nearby.every(c=>c.distanceMeters<=10000),'Client-side radius enforced');assert.equal(nearby[0].hours.length,0,'Optional details failure preserves nearby results');
const unconfigured=setup({enabled:false});await assert.rejects(unconfigured.api.search({center:{lat:60,lng:10}}),{code:'NOT_CONFIGURED'});assert.equal(unconfigured.calls.length,1,'No provider call without configured account');
const h=f.api.helpers;for(const u of ['javascript:alert(1)','http://example.org/','https://127.0.0.1/','https://localhost/','https://user:pass@example.org/','https://[::1]/','https://192.168.1.1/'])assert.equal(h.safeURL(u),'');
assert.equal(h.curatedMatch({name:'Cafe',city:'Gran'},[{name:'Cafe',town:'Oslo'}]),undefined,'Same name in another town cannot borrow photos');
const matched=h.normalize({place_id:'known',name:'Cafe',city:'Gran',lat:60,lng:10,lon:10},{lat:60,lng:10},[{name:'Cafe',town:'Gran',gallery:[{kind:'facade',src:'./images/cafes/real.webp',credit:'Photographer',source:'https://venue.no/'},{kind:'view',src:'./images/bergen.jpg'}]}]);
assert.equal(matched.photos.length,1,'Only actual matched café gallery photos');assert.match(matched.photos[0].url,/images\/cafes\/real.webp$/);
console.log('PASS: explicit-only search, configuration gating, strict radius, distance sorting, deduplication, bounded enrichment, optional failure, unknown status, photo identity, URL safety.');
const imageInfo={url:'https://upload.wikimedia.org/wikipedia/commons/a/a1/Cafe.jpg',mime:'image/jpeg',extmetadata:{Artist:{value:'<a href="https://author.example/">Actual Author</a><script>bad()</script>'},LicenseShortName:{value:'CC BY-SA 4.0'},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'}}};
assert.equal(h.commonsTitle({wiki_and_media:{wikimedia_commons:'Category:Gran cafes'}}),'','No category search or unrelated fallback');
assert.equal(h.commonsTitle({wiki_and_media:{image:'https://commons.wikimedia.org/wiki/Special:FilePath/Actual_Cafe.jpg'}}),'File:Actual Cafe.jpg');
assert.equal(h.commonsTitle({wiki_and_media:{image:'https://evil.example/wiki/Special:FilePath/Cafe.jpg'}}),'');
const approved=h.commonsPhoto(imageInfo,'File:Actual Cafe.jpg');assert.equal(approved.authors[0].name,'Actual Author');assert.equal(approved.license,'CC BY-SA 4.0');assert.equal(h.commonsPhoto({...imageInfo,url:'https://evil.example/fake.jpg'},'File:Cafe.jpg'),null);
assert.equal(h.commonsPhoto({...imageInfo,extmetadata:{...imageInfo.extmetadata,LicenseShortName:{value:'All rights reserved'}}},'File:Cafe.jpg'),null);
assert.equal(h.commonsPhoto({...imageInfo,extmetadata:{...imageInfo.extmetadata,LicenseUrl:{value:'https://evil.example/cc-by/'}}},'File:Cafe.jpg'),null);
const photoFeatures=Array.from({length:7},(_,i)=>({properties:{...feature('p'+i).properties,wiki_and_media:{wikimedia_commons:'File:Cafe '+i+'.jpg'}}}));
const withPhotos=setup({features:photoFeatures,detailsFailure:true,commons:{query:{pages:[{title:'File:Cafe 0.jpg',imageinfo:[imageInfo]},{title:'File:Other Cafe.jpg',imageinfo:[imageInfo]}]}}});
const photoResults=await withPhotos.api.search({center:{lat:60.45,lng:10.5}});const metadataCalls=withPhotos.calls.filter(c=>c.url.hostname==='commons.wikimedia.org');assert.equal(metadataCalls.length,1);assert.equal(metadataCalls[0].url.searchParams.get('titles').split('|').length,4);assert.equal(metadataCalls[0].url.searchParams.get('origin'),'*');assert.equal(photoResults.find(p=>p.id==='p0').photos.length,1);assert.equal(photoResults.filter(p=>p.photos.length).length,1,'Only exact file identity receives the licensed photo');
console.log('PASS: exact Commons file references, one bounded metadata batch, license/origin whitelist, plain-text attribution, no category or name search.');
const verifiedCafe={id:'known',name:'Actual Café',town:'Gran',address:'Real street 1',website:'https://actual-cafe.no/branch-gran',latitude:60.46,longitude:10.5,gallery:[{kind:'facade',src:'./images/cafes/known.webp',credit:'Real Photographer',source:'https://actual-cafe.no/'}],openingHours:{verified:true,checked:'2026-10-17',source:'https://actual-cafe.no/hours',sourceLabel:'Actual Café',weekly:Array.from({length:7},()=>[['09:00','17:00']])}};
const augmented=setup({features:[feature('nearest',60.45,10.5),{properties:{...feature('duplicate',60.46,10.5,'Actual Café').properties,website:verifiedCafe.website}}],detailsFailure:true,curated:[verifiedCafe,{...verifiedCafe,id:'far-curated',latitude:62,name:'Far away'},{...verifiedCafe,id:'unverified',name:'Unverified',latitude:60.47,openingHours:{...verifiedCafe.openingHours,verified:false}},{...verifiedCafe,id:'no-coordinates',latitude:undefined}]});
const augmentedResults=await augmented.api.search({center:{lat:60.45,lng:10.5},radiusMeters:5000});assert.equal(augmentedResults[0].id,'curated:known','Nearby verified photo option is featured');assert.equal(augmentedResults.filter(p=>p.name==='Actual Café').length,1,'Exact venue deduplicated against live result');const known=augmentedResults[0];assert.equal(known.hours.length,7);assert.equal(known.hoursSource,'https://actual-cafe.no/hours');assert.equal(known.hoursVerified,true);assert.equal(known.openNow,null,'Published schedule is not a real-time business assertion');assert.equal(known.photoPriority,true);assert.equal(augmentedResults.find(p=>p.curatedId==='unverified').hours.length,0,'Unverified hours are not published');assert(!augmentedResults.some(p=>p.curatedId==='far-curated'||p.curatedId==='no-coordinates'),'Never supplement a distant or unlocated venue');assert.equal(augmented.calls.filter(c=>c.url.pathname.endsWith('/places')).length,1,'Curated supplementation causes no additional API call');
console.log('PASS: within-radius real photo supplements, exact venue deduplication, verified schedule with source, unverified hours omitted, no missing-coordinate/distant venue leakage.');

const granCatalogue=JSON.parse(readFileSync(new URL('./cafes.json',import.meta.url),'utf8'));
const granSeasonal=setup({features:[feature('sag',60.3762074,10.7146382,'Sagvollstallen'),feature('oscar',60.4306152,10.4690111,'Café Oscar II')],detailsFailure:true,curated:granCatalogue});
const granResults=await granSeasonal.api.search({center:{lat:60.35916,lng:10.57282},radiusMeters:10000});
for(const name of ['Sagvollstallen','Café Oscar II']){const matches=granResults.filter(c=>c.name===name);assert.equal(matches.length,1,'One exact venue, no duplicate');assert.equal(matches[0].photos.length,1,'Actual venue photograph supplied');assert.equal(matches[0].openNow,null,'Seasonal schedule never asserts currently open');}
const sag=granResults.find(c=>c.name==='Sagvollstallen');assert.deepEqual(Array.from(sag.hours),['Jan-Mar: Sa-Su 11:00-15:00']);assert.equal(sag.hoursSource,'https://www.granil.no/sagvollstallen');
const oscar=granResults.find(c=>c.name==='Café Oscar II');assert.equal(oscar.hours.length,0,'Unconfirmed daily hours are not fabricated');assert.match(oscar.hoursNote.en,/May–August/);
for(const c of granCatalogue.filter(c=>['sagvollstallen-gran','cafe-oscar-ii-gran'].includes(c.id)))for(const photo of c.gallery)assert(readFileSync(new URL(photo.src,import.meta.url)).length>1000,'Photo asset exists');
console.log('PASS: Gran venue photos, exact deduplication, winter season preserved, summer note and daily-hour uncertainty.');

const regularResults=await granSeasonal.api.search({center:{lat:60.35916,lng:10.57282},radiusMeters:10000});
assert.deepEqual(regularResults.slice(0,2).map(c=>c.curatedId).join(','),'luprohjornet-gran,hadeland-gjestegard-jaren','Verified regular cafe options appear first');
const regular=regularResults.find(c=>c.curatedId==='hadeland-gjestegard-jaren');assert.equal(regular.hours.length,7);assert.equal(regular.hours[5],'Sa 10:00-18:00');assert.equal(regular.photos.length,2);assert(regular.distanceMeters<5000);
const lupro=regularResults.find(c=>c.curatedId==='luprohjornet-gran');assert(lupro.distanceMeters<500);assert.equal(lupro.photos.length,3);assert.match(lupro.hours.join('; '),/Mo,We,Fr 10:00-15:30/);assert(!lupro.hours.join('; ').includes('Su off'),'No invented Sunday closing');
for(const id of ['luprohjornet-gran','hadeland-gjestegard-jaren'])for(const photo of granCatalogue.find(c=>c.id===id).gallery)assert(readFileSync(new URL(photo.src,import.meta.url)).length>1000);
console.log('PASS: central Gran and nearby year-round options prioritized, exact regular hours, photos, no invented Sunday schedule.');

const localOnly=setup({enabled:false,curated:[verifiedCafe,{...verifiedCafe,id:'without-photo',name:'No photograph',gallery:[]},{...verifiedCafe,id:'distant',latitude:62}]});
assert.equal(localOnly.calls.length,0);
const localResults=await localOnly.api.searchLocal({center:{lat:60.45,lng:10.5},radiusMeters:5000});
assert.equal(localResults.length,2,'Local named venues do not require provider data or a photo');
assert(localResults.every(c=>c.catalogue&&c.openNow===null&&c.distanceMeters<=5000));
assert.equal(localResults.find(c=>c.curatedId==='known').hours.length,7);
assert.equal(localOnly.calls.length,1,'One static catalogue fetch, no configuration or external APIs');
assert.equal(localOnly.calls[0].url.href,'https://example.org/fjord-flow/cafes.json?v=9');
await localOnly.api.searchLocal({center:{lat:60.45,lng:10.5}});
assert.equal(localOnly.calls.length,1,'Catalogue reused for later local searches');
console.log('PASS: local search uses only same-site catalogue, cached across searches; no Geoapify configuration, API, Commons or invented live status.');
