import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {waterfallVisits} from './waterfall-visits.mjs';

const state=JSON.parse(readFileSync(new URL('./demo-data/state.json',import.meta.url)));
const waterfalls=state.destinations.filter(x=>x.category==='Waterfalls');

test('every waterfall in the expanded collection has real local photography, attribution and visitor notes',()=>{
 assert.ok(waterfalls.length>=12);
 assert.equal(new Set(waterfalls.map(x=>x.id)).size,waterfalls.length);
 for(const x of waterfalls){
  assert.ok(existsSync(new URL(x.image,import.meta.url)),x.id+' photograph');
  assert.ok(x.imageCredit&&x.imageSource&&x.imageLicense,x.id+' attribution');
  assert.ok(x.latitude>57&&x.latitude<72&&x.longitude>3&&x.longitude<33,x.id+' Norway coordinates');
  assert.match(x.geoSource,/^https:\/\/ws\.geonorge\.no\//);
  const v=waterfallVisits[x.id];assert.ok(v,x.id+' visit information');
  assert.equal(new URL(v.source).protocol,'https:');
  for(const key of ['parking','walk']){assert.equal(v[key].length,5);assert.ok(v[key].every(t=>typeof t==='string'&&t.length>10));}
 }
});

test('ambiguous waterfall names and seasonal access remain explicit',()=>{
 const byId=id=>waterfalls.find(x=>x.id===id);
 assert.equal(byId('rjukanfossen').municipality,'Tinn');
 assert.equal(byId('huldrefossen').municipality,'Sunnfjord');
 assert.equal(byId('tvindefossen').municipality,'Voss');
 assert.match(waterfallVisits.mardalsfossen.description[1],/20 June.*20 August/);
 assert.match(waterfallVisits.rjukanfossen.description[1],/diverted/);
 assert.match(waterfallVisits.kjosfossen.parking[1],/No direct road/);
 assert.ok(waterfallVisits.kjosfossen.train);
 assert.equal(byId('vettisfossen').routeMode,'external','Do not auto-plan a car journey to the waterfall pin in the mountain valley');
 assert.match(byId('vettisfossen').routeQuery,/Hjelle/);
});
