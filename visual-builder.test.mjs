import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,emptyDocument,safeButtonHref,PAGES} from './site-editor-schema.mjs';
import {reorderIDs} from './visual-builder.mjs';

test('old published catalogue snapshots retain all entries when builder defaults are added',()=>{
 const old={schemaVersion:1,catalogue:{places:[{id:'cafe-gran',name:'Café',category:'cafe',lat:60.36,lon:10.57,hours:{nb:'10–18'},photos:[{src:'images/cafe.jpg',credit:'Author',license:'CC BY'}]}]}};
 const clean=validateDocument(old);assert.deepEqual(clean.buttons,{});assert.deepEqual(clean.headerButtonOrder,[]);assert.deepEqual(clean.catalogue.places[0].photos,old.catalogue.places[0].photos);assert.deepEqual(clean.catalogue.places[0].hours,old.catalogue.places[0].hours);
});
test('fixed buttons accept five-language labels and bounded appearance while auth actions remain immutable',()=>{
 const clean=validateDocument({schemaVersion:1,buttons:{register:{label:{nb:'Bli med',uk:'Реєстрація'},fontSize:18,padding:12,radius:20,background:'#123456',color:'#ffffff'},hero:{href:'#norwayCatalogue'}},headerButtonOrder:['register','signIn']});
 assert.equal(clean.buttons.register.label.uk,'Реєстрація');assert.deepEqual(clean.headerButtonOrder,['register','signIn']);
 for(const buttons of [{any:{label:{nb:'No'}}},{register:{href:'https://example.org/'}},{register:{onclick:'evil()'}},{signIn:{action:'register'}},{hero:{fontSize:1000}},{hero:{padding:-1}},{hero:{background:'red;display:none'}},{hero:{label:{ru:'not supported'}}}])assert.throws(()=>validateDocument({schemaVersion:1,buttons}));
 for(const order of [['account'],['register','register'],['home'],['signIn','register','x']])assert.throws(()=>validateDocument({schemaVersion:1,headerButtonOrder:order}));
});
test('button destinations cannot execute code or break CSS and only known local sections are allowed',()=>{
 for(const href of ['javascript:alert(1)','data:text/html,test','//evil.test','#unknown','https://user:pass@example.com','https://example.com/\";color:red'])assert.equal(safeButtonHref(href),false,href);
 for(const href of ['#norwayCatalogue','#scenicRoutes','https://www.visitnorway.com/'])assert.equal(safeButtonHref(href),true,href);
});
test('drag reorder preserves all identifiers and unknown/external sources are ignored',()=>{
 const ids=PAGES.map(p=>p.id),order=reorderIDs(ids,'shopping','home');assert.equal(order[0],'shopping');assert.equal(new Set(order).size,ids.length);assert.deepEqual([...order].sort(),[...ids].sort());assert.deepEqual(reorderIDs(ids,'foreign','home'),ids);assert.deepEqual(reorderIDs(ids,'home','foreign'),ids);assert.equal(emptyDocument().navOrder.length,0);
 assert.deepEqual(reorderIDs(['home','bua','journal'],'home','bua'),['bua','home','journal']);
});
