import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{nearby}=require('./norway-catalog.js');
const route=require('./southern-routes.js').vestfoldcoast;
const read=f=>JSON.parse(readFileSync(new URL(f,import.meta.url)));
const rows=read('norway-catalog.json');
for(const stop of route.points){
  const local=nearby(rows,stop,20);
  for(const category of ['cafe','cabin']) assert.ok(local.some(r=>r.category===category),stop.name+' has a real nearby '+category);
  assert.ok(!local.some(r=>r.id==='luprohjornet-gran'),'No distant Gran café on the coast');
}
for(const file of ['catalog-vestfold-places.json','catalog-vestfold-stays.json','catalog-vestfold-cafes.json']){
  for(const r of read(file)){
    assert.equal(r.route,'vestfoldcoast');assert.equal(r.checked,'2026-10-18');
    assert.ok(r.source.startsWith('https://'));
    for(const lang of ['nb','en','uk','sv','da']){assert.ok(r.description[lang]);assert.ok(r.hoursNote[lang]);}
    for(const p of r.gallery){assert.ok(existsSync(new URL(p.src,import.meta.url)));assert.ok(p.credit&&p.original&&p.license&&p.source);}
    assert.ok(rows.some(b=>b.id===r.id));
  }
}
assert.equal(rows.find(r=>r.id==='traktern-horten').openingHours.verified,false,'Unpublished hours stay unknown');
assert.equal(rows.find(r=>r.id==='bare-barista-tonsberg').website,'https://barebarista.no/','Use the functioning operator domain');
console.log('PASS: all five Vestfold route stops have real nearby cafes/cabins and locally stored genuine attributed photos.');
