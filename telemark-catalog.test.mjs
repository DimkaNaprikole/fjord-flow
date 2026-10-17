import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{nearby}=require('./norway-catalog.js');
const route=require('./southern-routes.js').telemarkcoast;
const read=f=>JSON.parse(readFileSync(new URL(f,import.meta.url)));
const rows=read('norway-catalog.json');
for(const stop of route.points){
  const local=nearby(rows,stop,20);
  for(const category of ['cafe','cabin']) assert.ok(local.some(r=>r.category===category),stop.name+' has a real nearby '+category);
  assert.ok(!local.some(r=>r.id==='luprohjornet-gran'),'No distant Gran café on the coast');
}
for(const file of ['catalog-telemark-places.json','catalog-telemark-stays.json','catalog-telemark-cafes.json']){
  for(const r of read(file)){
    assert.equal(r.route,'telemarkcoast');assert.equal(r.checked,'2026-10-18');
    assert.ok(r.source.startsWith('https://'));
    for(const lang of ['nb','en','uk','sv','da']){assert.ok(r.description[lang]);assert.ok(r.hoursNote[lang]);}
    for(const p of r.gallery){assert.ok(existsSync(new URL(p.src,import.meta.url)));assert.ok(p.credit&&p.original&&p.license&&p.source);}
    assert.ok(rows.some(b=>b.id===r.id));
  }
}
assert.equal(rows.find(r=>r.id==='nordraak-kragero').openingHours.verified,false,'Arrival windows are not closing times');
assert.equal(rows.find(r=>r.id==='nevlunghavn-bakeri').openingHours.verified,false,'Ordering hours must not become verified shop hours');
assert.deepEqual(rows.find(r=>r.id==='langesund-bad-cafe').openingHours.weekly,Array.from({length:7},()=>[['15:00','17:00']]),'Only coffee-and-cake service, not whole restaurant hours');
console.log('PASS: every coastal stop has nearby real cafes/cabins; photos, languages, sources, seasons and uncertain schedules remain honest.');
