import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const read=f=>JSON.parse(readFileSync(new URL(f,import.meta.url)));
const rows=read('norway-catalog.json'),added=read('catalog-national-expansion.json'),coverage=read('norway-coverage.json');
const {routeUrl}=createRequire(import.meta.url)('./norway-catalog.js');
assert.equal(added.length,6);
for(const r of added){
 const published=rows.find(x=>x.id===r.id);assert.ok(published,r.id);
 for(const lang of ['nb','en','uk','sv','da']){assert.ok(r.description[lang]);assert.ok(r.hoursNote[lang]);}
 assert.ok(published.countyId&&published.municipalityId&&published.countySource.startsWith('https://api.kartverket.no/'));
 assert.ok(r.coordinatesSource.startsWith('https://ws.geonorge.no/'));
 for(const p of r.gallery){assert.ok(existsSync(new URL(p.src,import.meta.url)));assert.match(p.source,/commons.wikimedia.org/);assert.match(p.license,/^CC BY/);assert.ok(p.credit&&p.licenseUrl);}
 const route=new URL(routeUrl(published,{latitude:60.3592,longitude:10.5728}));
 assert.equal(route.hostname,'www.google.com');assert.equal(route.searchParams.get('travelmode'),'driving');assert.equal(route.searchParams.get('origin'),'60.3592,10.5728');
 if(r.routeQuery)assert.equal(route.searchParams.get('destination'),r.routeQuery,'Natural sights use a named arrival point, not the mountain or water');
}
assert.equal(coverage.counties.length,15);assert.equal(coverage.total,rows.length);
assert.equal(coverage.counties.reduce((sum,c)=>sum+c.total,0),rows.length);
assert.equal(new Set(rows.map(r=>r.countyId)).size,15);
for(const c of coverage.counties)assert.equal(c.total,rows.filter(r=>r.countyId===c.id).length,c.name);
const alta=added.find(r=>r.id==='alta-museum-rock-art');assert.match(alta.hoursNote.en,/snow or ice/);assert.ok(!alta.openingHours?.verified,'Seasonal paths must not get an invented weekly opening schedule');
console.log('Six national additions: licensed local photos, five languages, official coordinates, safe driving destinations and all 15 county counts validated.');
