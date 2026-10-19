import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {primary,labels,keyForId,normalizeKey}=createRequire(import.meta.url)('./site-tabs.js');

test('five destinations retain forum immediately before rightmost news',()=>{
 assert.deepEqual(primary.map(([key])=>key),['home','catalogue','webcams','forum','news']);
 for(const words of Object.values(labels))assert.equal(words.length,primary.length);
});
test('existing deep links open their regrouped destination',()=>{
 for(const id of ['collection','scenicRoutes','buaEquipment','travelServices','travelUpdates'])assert.equal(keyForId(id),'home');
 for(const id of ['norwayCatalogue','shoppingCentres'])assert.equal(keyForId(id),'catalogue');
 for(const id of ['community','travelStories'])assert.equal(keyForId(id),'forum');
 assert.equal(keyForId('municipalNews'),'news');
 assert.equal(keyForId('norwayWebcams'),'webcams');
});
test('legacy reveal callers keep working after grouping',()=>{
 for(const key of ['bua','services','useful'])assert.equal(normalizeKey(key),'home');
 for(const key of ['community','journal'])assert.equal(normalizeKey(key),'forum');
 assert.equal(normalizeKey('shopping'),'catalogue');
 assert.equal(normalizeKey('news'),'news');
});
