import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync}from'node:fs';
function element(){return {children:[],dataset:{},classList:{toggle(){}},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;}};}
test('gallery renders translated owner hours without a checked date or invented open status',()=>{
 const window={FjordI18n:{language:'uk'}},document={createElement:element,documentElement:{lang:'uk'}};
 vm.runInNewContext(readFileSync(new URL('./cafe-gallery-info.js',import.meta.url),'utf8'),{window,document,Intl,Date,URL});
 const host=element(),venue={name:'Sauna',address:'Gran',openingHours:{publishedText:{nb:'Etter avtale',uk:'За домовленістю'},verified:false},hoursNote:{uk:'За домовленістю'}};
 assert.doesNotThrow(()=>window.FjordCafeGalleryInfo.render(host,venue));
 const flattened=node=>[node.textContent||'',...node.children.flatMap(flattened)],labels=flattened(host);
 assert.equal(labels.filter(text=>text==='За домовленістю').length,1);assert.ok(labels.every(text=>!text.includes('[object Object]')));assert.equal(window.FjordCafeGalleryInfo.evaluate(venue.openingHours).open,null);
});
