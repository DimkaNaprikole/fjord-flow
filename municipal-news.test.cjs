const {test}=require('node:test'),assert=require('node:assert/strict');const {activeItems,groupSearch}=require('./municipal-news.js');const directory=require('./news-municipalities.json'),data=require('./municipal-news-data.json');
const {facebookPostURL}=require('./municipal-news.js');
test('comments lead to a real post, never a group homepage or lookalike host',()=>{
 assert.ok(facebookPostURL(data.items[0].facebookPost));
 assert.ok(facebookPostURL('https://www.facebook.com/groups/681820395175180/posts/29148682134728959/'));
 for(const url of ['https://www.facebook.com/groups/681820395175180/','https://www.facebook.com/','https://facebook.com.evil.test/Lunnerkommune/posts/123','javascript:alert(1)','http://www.facebook.com/test/posts/123',undefined])assert.equal(facebookPostURL(url),null);
});
test('news images and practical details retain attribution and do not invent engagement counts',()=>{
 const fs=require('node:fs');
 for(const item of data.items){if(item.image){assert.ok(fs.existsSync(item.image.url));assert.ok(item.image.alt&&item.image.credit);if(item.image.originalUrl)assert.equal(new URL(item.image.originalUrl).protocol,'https:');assert.equal(new URL(item.image.source).protocol,'https:');}assert.ok(item.location);for(const lang of ['nb','en','uk','sv','da'])assert.ok(item.details[lang].length);assert.equal(item.likes,undefined);assert.equal(item.commentCount,undefined);}
 assert.deepEqual(data.items[1].eventDates,['2026-10-27','2026-10-28']);
});
test('municipality registry is national and disambiguates duplicate names by code',()=>{assert.equal(directory.municipalities.length,357);assert.equal(new Set(directory.municipalities.map(x=>x.id)).size,357);for(const item of data.items)assert.ok(directory.municipalities.some(m=>m.id===item.municipality));});
test('local news filters and expiry prevent old events appearing as upcoming',()=>{const now=Date.parse('2026-10-18');assert.equal(activeItems(data.items,'3446','all',now).filter(x=>x.category!=='places').length,2);assert.equal(activeItems(data.items,'0301','all',now).length,0);assert.equal(activeItems(data.items,'all','events',now).length,1);assert.deepEqual(activeItems(data.items,'all','all',Date.parse('2026-10-30')).filter(x=>x.category!=='places').map(x=>x.id),['halloween-jevnaker-2026']);assert.equal(activeItems(data.items,'all','all',Date.parse('2026-10-01')).length,0);});
test('editorial items have dated attributable sources and five languages',()=>{for(const item of data.items){assert.equal(new URL(item.url).protocol,'https:');assert.ok(item.published);if(item.category!=='places')assert.ok(item.expires);for(const lang of['nb','en','uk','sv','da'])assert.equal(item.copy[lang].length,2);}assert.equal(new URL(groupSearch('Våler')).searchParams.get('q'),'Våler kommune');assert.ok(data.sources['4204'].facebookSource);});

test('nearby catalogue includes only Gran, Lunner and Jevnaker while respecting category and expiry',()=>{
 const fixture=[
  {municipality:'3446',category:'places',published:'2026-10-18'},
  {municipality:'3234',category:'places',published:'2026-10-18'},
  {municipality:'3236',category:'events',published:'2026-10-17',expires:'2026-10-19T00:00:00Z'},
  {municipality:'0301',category:'places',published:'2026-10-18'}
 ];
 assert.equal(activeItems(fixture,'nearby','all',Date.parse('2026-10-18T12:00:00Z')).length,3);
 assert.equal(activeItems(fixture,'nearby','places',Date.parse('2026-10-18T12:00:00Z')).length,2);
 assert.equal(activeItems(fixture,'nearby','events',Date.parse('2026-10-20')).length,0);
 assert.equal(activeItems(fixture,'3234','all',Date.parse('2026-10-18T12:00:00Z')).length,1);
});

test('local tips keep hours and seasonal caveats in all five languages',()=>{
 const places=data.items.filter(x=>x.category==='places');assert.ok(places.length>=8);
 for(const place of places){assert.equal(place.expires,undefined);for(const lang of ['nb','en','uk','sv','da'])assert.ok(place.hours[lang]);}
 assert.equal(data.items.find(x=>x.id==='local-sagvollstallen-gran').season,'winter');
 assert.equal(data.items.find(x=>x.id==='local-cafe-oscar-ii-gran').season,'summer');
});
