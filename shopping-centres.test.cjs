const {test}=require('node:test'),assert=require('node:assert/strict');
const rows=require('./shopping-centres.json'),{search,distance}=require('./shopping-centres.js');
test('shopping search finds actual tenants, cities and pharmacies',()=>{assert.equal(search(rows,'Gran').length,2);assert.equal(search(rows,'Sport 1')[0].id,'smietorget');assert.equal(search(rows,'H&M').length,4);assert.ok(search(rows,'аптека').some(c=>c.id==='granstunet'));assert.equal(search(rows,'not-a-real-store').length,0);});
test('shopping points and stores have reviewed official sources, not guessed locations',()=>{assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);for(const c of rows){assert.equal(c.category,'shopping');assert.ok(c.latitude>57&&c.latitude<72);assert.ok(c.longitude>4&&c.longitude<33);assert.equal(new URL(c.coordinateSource).hostname,'ws.geonorge.no');assert.ok(c.address.length>10);assert.ok(c.stores.length>=5);for(const s of c.stores)assert.equal(new URL(s.url).hostname,new URL(c.website).hostname);if(c.website.includes('thonsenter'))assert.ok(c.stores.some(s=>s.location));}});
test('nearest shopping centre at Gran stays local',()=>{const origin={latitude:60.35916,longitude:10.57282};const sorted=[...rows].sort((a,b)=>distance(origin,a)-distance(origin,b));assert.equal(sorted[0].town,'Gran');assert.equal(sorted[1].town,'Gran');assert.ok(distance(origin,sorted[0])<1);assert.equal(distance(null,rows[0]),null);});
test('both Google map views include the new shopping category',()=>{const overview=require('./norway-overview-map.js'),threeD=require('./google-norway-map.js');assert.equal(overview.filterPlaces(rows,'shopping').length,6);assert.equal(threeD.filterPlaces(rows,'shopping').length,6);assert.equal(overview.filterPlaces(rows,'cafe').length,0);});
const fs=require('node:fs');
test('every shopping card has a real local photo with attribution and multilingual hours',()=>{
 for(const centre of rows){
  assert.ok(fs.existsSync(centre.image.url),centre.id);
  assert.ok(centre.image.alt&&centre.image.credit&&centre.image.license);
  assert.equal(new URL(centre.image.source).protocol,'https:');
  assert.equal(centre.gallery[0].src,centre.image.url);
  assert.equal(new URL(centre.hoursSource).hostname,new URL(centre.website).hostname);
  for(const language of ['nb','en','uk','sv','da'])assert.ok(centre.hoursNote[language]);
 }
});
