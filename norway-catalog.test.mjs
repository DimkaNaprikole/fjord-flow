import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {nearby}=createRequire(import.meta.url)('./norway-catalog.js');
const rows=JSON.parse(readFileSync(new URL('./norway-catalog.json',import.meta.url)));
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
assert.deepEqual([...new Set(rows.map(r=>r.category))].sort(),['cabin','cafe','rest','sauna']);
for(const r of rows){
  assert.ok(r.name && r.source && /^2026-/.test(r.checked),r.id+' source/date');
  for(const src of [r.image,...r.gallery.map(p=>p.src)]){
    assert.ok(!/^(?:https?:)?\/\//.test(src),r.id+' local image');
    assert.ok(existsSync(new URL(src,import.meta.url)),src);
  }
  assert.ok(/^https:\/\//.test(r.website),r.id+' website');
  assert.ok(r.description && Object.values(r.description).some(Boolean),r.id+' description');
  assert.ok(!('price' in r),r.id+' no demo price');
}
const scenery=readFileSync(new URL('./scenery.js',import.meta.url),'utf8');
assert.match(scenery,/hadeland: \[\]/);
assert.match(scenery,/granavollen-sister-churches.webp.*Sven Rosborn/);
const gran=nearby(rows,{latitude:60.3592,longitude:10.5728},20);
for (const category of ['cafe','cabin','sauna']) assert.ok(gran.some(r=>r.category===category),`Gran has a verified ${category} nearby`);
assert.ok(gran.every((r,i)=>r.catalogueDistance<=20 && (!i || r.catalogueDistance>=gran[i-1].catalogueDistance)),'strict radius and increasing distance');
const tromso=nearby(rows,{latitude:69.6492,longitude:18.9553},20);
assert.ok(tromso.some(r=>r.id==='smortorget-tromso'));
assert.ok(!tromso.some(r=>r.id==='luprohjornet-gran'),'no Gran café in Tromsø nearby results');
assert.ok(nearby(rows,{latitude:69.7271,longitude:30.045},20).some(r=>r.id==='gamme-cabins-kirkenes'));
console.log(`Validated ${rows.length} catalogue entries, all local photographs, sources and Gran route image.`);
