import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {validPoint,filterPlaces,safeURL,routePoints}=require('./norway-overview-map.js');
test('only finite real coordinates and supported catalogue categories reach markers',()=>{
 const rows=[{id:'c',category:'cafe',latitude:60,longitude:10},{id:'s',category:'sauna',latitude:59,longitude:11},{id:'bad',category:'cabin',latitude:Infinity,longitude:10},{id:'outside',category:'rest',latitude:91,longitude:1},{id:'text',category:'cafe',latitude:'60',longitude:10},{id:'unknown',category:'other',latitude:60,longitude:10}];
 assert.deepEqual(filterPlaces(rows).map(p=>p.id),['c','s']);assert.deepEqual(filterPlaces(rows,'sauna').map(p=>p.id),['s']);assert.deepEqual(filterPlaces(rows,'cabin'),[]);assert.deepEqual(filterPlaces(null),[]);assert.equal(validPoint(null),false);
 assert.deepEqual(routePoints({points:rows}).map(p=>p.id),['c','s','unknown']);assert.deepEqual(routePoints({}),[]);
});
test('popup links allow secure websites without credentials, reject executable URLs',()=>{
 assert.equal(safeURL('https://visitvestfold.com/no/'), 'https://visitvestfold.com/no/');
 for(const url of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:pass@example.com','/relative','not a url'])assert.equal(safeURL(url),null,url);
});

test('every published catalogue place appears on the automatically populated map',()=>{
 const rows=JSON.parse(readFileSync(new URL('./norway-catalog.json',import.meta.url)));
 assert.equal(filterPlaces(rows).length,rows.length);
 for(const category of ['cafe','cabin','sauna','rest'])assert.equal(filterPlaces(rows,category).length,rows.filter(r=>r.category===category).length);
});

test('BUA equipment filter maps only published coordinates and keeps missing locations off the map',()=>{
 const directory=JSON.parse(readFileSync(new URL('./bua-locations.json',import.meta.url)));
 const visible=filterPlaces(directory.locations,'equipment');
 assert.equal(visible.length,directory.mappedCount);
 assert.equal(visible.length,filterPlaces(directory.locations).length);
 assert.ok(directory.locations.length>visible.length,'Unmapped BUA stay in the directory without invented pins');
 const map3d=require('./google-norway-map.js');
 assert.equal(map3d.filterPlaces(directory.locations,'equipment').length,visible.length);
});
