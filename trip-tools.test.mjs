import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const window={addEventListener(){}};
vm.runInNewContext(readFileSync(new URL('./trip-tools.js',import.meta.url),'utf8'),{window,URL,document:{getElementById:()=>null},fetch:async()=>({ok:true,json:async()=>({destinations:[]})})});
const tools=window.FjordTripTools;
assert.equal(tools.searchURL('cafe',{latitude:91,longitude:10}), '');
assert.equal(tools.searchURL('cafe',{latitude:'60.2',longitude:10}), '');
const u=new URL(tools.searchURL('sauna',{latitude:60.23767,longitude:10.39666}));
assert.equal(u.origin,'https://www.google.com');
assert.equal(u.searchParams.get('query'),'sauna near 60.23767,10.39666');
const trip=tools.localRoutes.hadeland;
assert.equal(trip.points.length,4);
assert.equal(trip.points[0].latitude,trip.points.at(-1).latitude,'Local trip returns to its start');
assert.equal(trip.points[0].longitude,trip.points.at(-1).longitude);
assert.ok(!trip.points.some(p=>p.id==='kistefos'),'Seasonal museum is optional, never a mandatory stop');
for(const p of trip.points){assert.ok(tools.point(p));for(const lang of ['en','nb','uk','sv','da'])assert.ok(p.description[lang]);assert.equal(new URL(p.website).protocol,'https:');}
console.log('PASS: nearby searches use the chosen coordinates, invalid points rejected, local Gran loop returns home and does not require the seasonal museum.');
