import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const read=f=>JSON.parse(readFileSync(new URL(f,import.meta.url),'utf8'));
const route=createRequire(import.meta.url)('./lister-coast-route.js'),rows=read('catalog-lister-coast.json');
test('Lister itinerary uses named vehicle arrivals and discloses seasonal walking visits',()=>{
 assert.equal(route.navigationOnly,true);assert.equal(route.points.length,5);
 assert.match(route.points[1].routeQuery,/parkeringsplass/);assert.match(route.points[2].routeQuery,/parkering/);assert.match(route.points[3].routeQuery,/Vollen/);
 assert.match(rows[0].description.en,/undated/);assert.match(rows[1].description.en,/steep steps/);assert.match(rows[2].description.en,/not a garage entrance/);
 for(const lang of ['en','nb','uk','sv','da'])assert.ok(route.title[lang]&&route.summary[lang]&&route.points.every(p=>p.description[lang]));
 assert.ok(route.points.every(p=>p.website?.startsWith('https://')&&p.extra&&p.local),'local multilingual stops use the local renderer');
});
test('Lister additions have licensed local photographs and are included once',()=>{
 const catalog=read('norway-catalog.json');assert.equal(rows.length,3);
 for(const row of rows){assert.equal(catalog.filter(c=>c.id===row.id).length,1);assert.equal(row.checked,'2026-10-19');assert.match(row.directionsUrl,/destination=[^&]+/);assert.ok(row.latitude>58&&row.latitude<59);
 for(const photo of row.gallery){assert.ok(existsSync(new URL(photo.src,import.meta.url)));assert.match(photo.license,/CC BY/);assert.ok(photo.credit&&photo.source&&photo.licenseUrl)}
 }
 assert.ok(!catalog.some(r=>r.id==='flam-zipline'),'rail-only excursion must not acquire a generic driving arrival during rebuild');
 assert.ok(read('route-experiences.json').some(r=>r.id==='flam-zipline'),'rail excursion remains in its own collection');
});
