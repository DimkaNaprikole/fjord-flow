import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),route=require('./innerfjord-route.js');
const read=f=>JSON.parse(readFileSync(new URL(f,import.meta.url),'utf8'));
const places=read('catalog-innerfjord-places.json'),venues=read('catalog-innerfjord-venues.json'),catalogue=read('norway-catalog.json');
test('Coastal continuation connects Horten and the two shores without silently selecting a ferry',()=>{
 assert.deepEqual(route.points.map(p=>p.routeQuery),['Horten sentrum, Norway','Holmestrand sentrum, Norway','Svelvik sentrum, Norway','Drammen sentrum, Norway','Drøbak sentrum, Norway','Son sentrum, Norway']);
 const previous=require('./southern-routes.js').vestfoldcoast.points.at(-1);
 assert.equal(route.points[0].latitude,previous.latitude);assert.equal(route.points[0].longitude,previous.longitude);
 assert.equal(route.navigationOnly,true,'Current Google navigation resolves roadworks and town access; do not invent a driving estimate');
 assert.match(route.points[3].description.en,/construction/);
 assert.match(route.points[4].description.en,/passenger-ferry/);
 assert.match(route.points.at(-1).description.en,/one-way/);
 for(const lang of ['en','nb','uk','sv','da']){assert.ok(route.title[lang]);assert.ok(route.summary[lang]);assert.ok(route.points.every(p=>p.description[lang]));}
});
test('Every new map pin has a real local photograph, coordinates, source and usable navigation',()=>{
 for(const r of [...places,...venues]){
  const live=catalogue.find(c=>c.id===r.id);assert.ok(live,r.id+' included in built catalogue');
  assert.equal(r.route,'innerfjordcoast');assert.ok(r.latitude>59.45&&r.latitude<59.8);assert.ok(r.longitude>10.2&&r.longitude<10.9);
  assert.ok(r.coordinatesSource?.startsWith('https://ws.geonorge.no/'));assert.ok(r.source.startsWith('https://'));
  assert.match(live.directionsUrl,/google.com\/maps\/dir/);
  for(const lang of ['en','nb','uk','sv','da'])assert.ok(r.description[lang]&&r.hoursNote[lang],r.id+' '+lang);
  for(const photo of r.gallery){assert.ok(existsSync(new URL(photo.src,import.meta.url)));assert.ok(photo.source&&photo.credit);}
 }
 assert.equal(places.length,4);assert.ok(venues.some(r=>r.category==='cafe'));assert.ok(venues.some(r=>r.category==='sauna'));
});
