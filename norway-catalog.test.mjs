import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
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
console.log(`Validated ${rows.length} catalogue entries, all local photographs, sources and Gran route image.`);
