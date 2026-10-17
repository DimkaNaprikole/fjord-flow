import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{nearby}=require('./norway-catalog.js'),route=require('./southern-routes.js').agdercoast;
const rows=JSON.parse(readFileSync(new URL('./norway-catalog.json',import.meta.url)));
for(const p of route.points){
  const local=nearby(rows,p,20);
  for(const category of ['cafe','cabin']) assert.ok(local.some(r=>r.category===category),p.name+' needs a real nearby '+category);
  assert.ok(!local.some(r=>r.id==='luprohjornet-gran'),'No distant Gran suggestions on coastal route');
}
for(const file of ['catalog-east-coast-places.json','catalog-east-coast-cafes.json','catalog-east-coast-stays.json']){
  for(const r of JSON.parse(readFileSync(new URL(file,import.meta.url)))){
    assert.equal(r.route,'agdercoast');assert.equal(r.checked,'2026-10-18');assert.ok(r.source.startsWith('https:'));
    for(const lang of ['nb','en','uk','sv','da']){assert.ok(r.description[lang]);assert.ok(r.hoursNote[lang]);}
    for(const p of r.gallery){assert.ok(existsSync(new URL(p.src,import.meta.url)));assert.ok(p.source&&p.credit&&p.license&&p.original);}
    assert.ok(rows.some(p=>p.id===r.id),'Built catalogue includes '+r.id);
  }
}
assert.equal(rows.find(r=>r.id==='strandhaven-lillesand').openingHours.verified,false,'Last booking must not become a closing time');
assert.equal(rows.find(r=>r.id==='tyholmen-arendal').openingHours.verified,false,'Unpublished Sunday must not become closed');
console.log('PASS: four coastal towns each have real cafés and cabins within20km, complete local photos/translations, and honest partial schedules.');
