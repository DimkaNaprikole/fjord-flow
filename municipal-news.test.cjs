const {test}=require('node:test'),assert=require('node:assert/strict');const {activeItems,groupSearch}=require('./municipal-news.js');const directory=require('./news-municipalities.json'),data=require('./municipal-news-data.json');
const {facebookPostURL}=require('./municipal-news.js');
test('comments lead to a real post, never a group homepage or lookalike host',()=>{
 assert.ok(facebookPostURL(data.items[0].facebookPost));
 assert.ok(facebookPostURL('https://www.facebook.com/groups/681820395175180/posts/29148682134728959/'));
 for(const url of ['https://www.facebook.com/groups/681820395175180/','https://www.facebook.com/','https://facebook.com.evil.test/Lunnerkommune/posts/123','javascript:alert(1)','http://www.facebook.com/test/posts/123',undefined])assert.equal(facebookPostURL(url),null);
});
test('news images and practical details retain attribution and do not invent engagement counts',()=>{
 const fs=require('node:fs');
 for(const item of data.items){assert.ok(fs.existsSync(item.image.url));assert.ok(item.image.alt&&item.image.credit);assert.equal(new URL(item.image.originalUrl).hostname,'www.gran.kommune.no');assert.equal(item.image.source,item.url);assert.ok(item.location);for(const lang of ['nb','en','uk','sv','da'])assert.ok(item.details[lang].length);assert.equal(item.likes,undefined);assert.equal(item.commentCount,undefined);}
 assert.deepEqual(data.items[1].eventDates,['2026-10-27','2026-10-28']);
});
test('municipality registry is national and disambiguates duplicate names by code',()=>{assert.equal(directory.municipalities.length,357);assert.equal(new Set(directory.municipalities.map(x=>x.id)).size,357);for(const item of data.items)assert.ok(directory.municipalities.some(m=>m.id===item.municipality));});
test('local news filters and expiry prevent old events appearing as upcoming',()=>{const now=Date.parse('2026-10-18');assert.equal(activeItems(data.items,'3446','all',now).length,2);assert.equal(activeItems(data.items,'0301','all',now).length,0);assert.equal(activeItems(data.items,'all','events',now).length,1);assert.equal(activeItems(data.items,'all','all',Date.parse('2026-10-30')).length,0);assert.equal(activeItems(data.items,'all','all',Date.parse('2026-10-01')).length,0);});
test('editorial items have dated attributable sources and five languages',()=>{for(const item of data.items){assert.ok(item.url.startsWith('https://www.gran.kommune.no/'));assert.ok(item.published&&item.expires);for(const lang of['nb','en','uk','sv','da'])assert.equal(item.copy[lang].length,2);}assert.equal(new URL(groupSearch('Våler')).searchParams.get('q'),'Våler kommune');assert.ok(data.sources['4204'].facebookSource);});
