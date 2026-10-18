const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const ctx={URL};vm.createContext(ctx);vm.runInContext(fs.readFileSync('travel-services.js','utf8'),ctx);
const api=ctx.FjordTravelServiceTest;
test('curated services have unique IDs, HTTPS links and all five languages',()=>{
 assert.equal(new Set(api.services.map(s=>s.id)).size,api.services.length);
 for(const s of api.services){assert.equal(new URL(s.url).protocol,'https:');for(const lang of ['nb','en','uk','sv','da'])assert.ok(s.description[lang].length>10);}
 assert.match(api.services.find(s=>s.id==='blablacar').description.en,/Norway is absent/);
});
test('filters and pagination do not lose services or show invalid pages',()=>{
 const first=api.select('all',new Set()),last=api.select('all',new Set(),99);
 assert.equal(first.items.length,6);assert.equal(last.page,2);assert.equal(last.items.length,1);
 assert.ok(api.select('rental',new Set()).items.every(s=>s.category==='rental'));
 const favourites=new Set(['hyre','unknown']);assert.equal(api.select('favourites',favourites).total,1);
 assert.equal(api.select('favourites',new Set(),3).page,0);
});
test('favourites reject stale IDs, broken JSON and inaccessible storage',()=>{
 assert.equal(api.loadFavourites({getItem:()=>JSON.stringify(['hyre','unknown','hyre'])}).size,1);
 assert.equal(api.loadFavourites({getItem:()=>'{'}).size,0);
 assert.equal(api.loadFavourites({getItem:()=>{throw Error('denied');}}).size,0);
});
test('nearby transport uses the chosen stop, handles zero and rejects bad coordinates',()=>{
 const url=new URL(api.mapURL('car rental',{latitude:60.35916,longitude:10.57282}));
 assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('query'),'car rental near 60.35916,10.57282');
 assert.ok(api.mapURL('train station',{lat:0,lng:0}));
 for(const p of [{lat:91,lng:0},{lat:0,lng:181},{lat:'60',lng:10},null])assert.equal(api.mapURL('car rental',p),null);
});
