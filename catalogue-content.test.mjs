import test from 'node:test';import assert from 'node:assert/strict';
import {mergeCatalogue} from './catalogue-content.mjs';import {validatePlace,validateDocument} from './site-editor-schema.mjs';
const base={id:'old',name:'Old cafe',category:'cafe',latitude:60,longitude:10,hoursNote:{nb:'Hver dag'},openingHours:{verified:true,weekly:[[],[],[],[],[],[],[]]},directionsUrl:'https://www.google.com/maps/dir/?api=1&destination=Old',visitInfo:{text:{nb:'Parking'}}};
const fresh=()=>({id:'new',name:'New sauna',category:'sauna',lat:61,lon:11,hours:{nb:'Etter avtale'},photos:[{src:'https://example.org/photo.jpg',credit:'Author',license:'CC BY 4.0'}]});
test('new places, replacements and reversible hiding merge without changing the source',()=>{
 const hidden=validatePlace({id:'old',enabled:false}),place=validatePlace(fresh());
 const merged=mergeCatalogue([base],[hidden,place]);assert.equal(merged.length,1);assert.equal(merged[0].latitude,61);assert.equal(merged[0].openingHours.verified,false);assert.equal(merged[0].image,place.photos[0].src);assert.equal(merged[0].gallery[0].license,'CC BY 4.0');assert.equal(base.name,'Old cafe');assert.equal(mergeCatalogue([base],[])[0],base);
});
test('editing hours invalidates old live-open calculation and moving clears stale navigation',()=>{
 const changed=mergeCatalogue([base],[{...validatePlace({...fresh(),id:'old'}),lat:62}])[0];assert.equal(changed.openingHours.verified,false);assert.equal(changed.openingHours.weekly,undefined);assert.equal(changed.directionsUrl,undefined);assert.equal(changed.visitInfo,base.visitInfo);
 const untouched=mergeCatalogue([base],[validatePlace({id:'old',name:'Renamed',category:'cafe',lat:60,lon:10,hours:{nb:'Hver dag'}})])[0];assert.equal(untouched.openingHours,base.openingHours);
});
test('removing all gallery photos removes the old cover too; season is visible',()=>{
 const old={...base,image:'images/a.jpg',gallery:[{src:'images/a.jpg'}]};const record=mergeCatalogue([old],[validatePlace({id:'old',name:'Cafe',category:'cafe',lat:60,lon:10,photos:[],hours:{nb:'10–16'},season:{nb:'Hele året'}})])[0];assert.equal(record.image,'');assert.deepEqual(record.gallery,[]);assert.equal(record.hoursNote.nb,'10–16\nHele året');
});
test('catalogue validation rejects duplicates, script URLs, invalid coordinates and dates',()=>{
 for(const patch of [{lat:NaN},{lat:91},{category:'script'},{website:'javascript:alert(1)'},{checked:'2026-02-30'},{photos:[{src:'data:image/svg+xml,x'}]}])assert.throws(()=>validatePlace({...fresh(),...patch}));
 assert.throws(()=>validateDocument({schemaVersion:1,catalogue:{places:[fresh(),fresh()]}}));
 assert.deepEqual(validateDocument({schemaVersion:1}).catalogue,{places:[]});
});
