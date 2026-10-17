import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url),routes=require('./southern-routes.js');
test('Sørlandet keeps the westbound mainland order and distinct stops',()=>{
 const points=routes.sorlandet.points;
 assert.deepEqual(points.map(p=>p.id),['sorlandet-kristiansand','sorlandet-mandal','sorlandet-lindesnes']);
 for(const p of points){assert.ok(p.latitude>57.9&&p.latitude<58.2);assert.ok(p.longitude>7&&p.longitude<8.1);assert.ok(p.website.startsWith('https://'));assert.ok(p.routeQuery);}
 assert.ok(points[0].longitude>points[1].longitude&&points[1].longitude>points[2].longitude);
 assert.deepEqual(routes.sorlandet.optionalExperienceIds,[],'Do not silently add distant eastern Norway attractions');
});
test('Every route and stop has all five languages, source dates and real local photographs',()=>{
 for(const route of Object.values(routes)){
  for(const lang of ['en','nb','uk','sv','da']){assert.ok(route.title[lang]);assert.ok(route.summary[lang]);for(const p of route.points)assert.ok(p.description[lang]);}
  assert.match(route.checkedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(route.sources.length>=3);
  for(const photo of route.photos){assert.ok(existsSync(new URL(photo.image,import.meta.url)),photo.image);assert.ok(photo.author&&photo.license&&photo.licenseUrl&&photo.source);}
 }
});
test('Oslo uses named car parks and cannot send the beach marker to numeric routing',()=>{
 const route=routes.oslofjord;assert.equal(route.navigationOnly,true);
 assert.deepEqual(route.points.map(p=>p.routeQuery),['Operagata P-hus, Oslo, Norway','Huk parkeringsplass, Oslo, Norway']);
 assert.ok(route.points.every(p=>p.coordinatePrecision==='area'));
 const script=readFileSync(new URL('./itinerary.js',import.meta.url),'utf8');
 const guard=script.indexOf('if(local?.navigationOnly)');assert.ok(guard>0);
 assert.ok(script.indexOf('fit();return;',guard)<script.indexOf('const cacheKey=',guard),'Navigation-only must return before OSRM/cache calculation');
 assert.match(script,/const query = p => p\.routeQuery \|\| coords\(p\)\.join/);
});
test('Browser registration retains existing local routes',()=>{
 const old={title:'old'},context={window:{FjordTripTools:{localRoutes:{hadeland:old}}}};
 vm.runInNewContext(readFileSync(new URL('./southern-routes.js',import.meta.url),'utf8'),context);
 assert.equal(context.window.FjordTripTools.localRoutes.hadeland,old);assert.ok(context.window.FjordTripTools.localRoutes.sorlandet);
});
