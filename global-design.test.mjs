import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,emptyDocument} from './site-editor-schema.mjs';
import {GLOBAL_DESIGN_GROUPS,globalDesignCSS,individualDesignDescriptor,DESIGN_SCOPE} from './global-design.mjs';
import {elementCSS} from './element-design.mjs';
test('global design is optional and preserves existing catalogue, frames and individual edits',()=>{
 const document=emptyDocument();document.framePresets=[{id:'test',name:'Рамка',style:{radius:12}}];document.elements={button_register:{padding:14}};document.catalogue.places=[{id:'private-hidden',enabled:false}];
 assert.deepEqual(validateDocument(document),document);
 document.globalDesign={buttons:{padding:12,mobile:{padding:8},tablet:{fontSize:15}},cards:{radius:20}};
 const result=validateDocument(document);assert.deepEqual(result,document);
});
test('global designs reject unsafe selectors, media, geometry shifts and excessive values',()=>{
 for(const globalDesign of [{evil:{color:'#ffffff'}},{buttons:{selector:'body'}},{buttons:{image:{src:'images/test.jpg'}}},{cards:{borderImage:{src:'images/test.jpg'}}},{buttons:{offsetX:10}},{headings:{fontSize:999}},{cards:{mobile:{background:'red'}}},{buttons:{mobile:{hidden:true}}}])assert.throws(()=>validateDocument({schemaVersion:1,globalDesign}));
});
test('global CSS has fixed reviewed groups and responsive styles without covering technical buttons',()=>{
 const css=globalDesignCSS({buttons:{fontSize:16,mobile:{fontSize:13}},cards:{radius:20},headings:{color:'#fefefe'}});
 assert.match(css,/@media\(max-width:680px\)/);assert.match(css,/font-size:13px!important/);assert.match(css,/border-radius:20px!important/);
 const buttons=GLOBAL_DESIGN_GROUPS.find(group=>group.id==='buttons');assert.ok(!buttons.selector.split(',').includes('button'));assert.ok(!buttons.selector.includes('iframe'));assert.ok(!buttons.selector.includes('gm-'));
 assert.ok(css.includes(DESIGN_SCOPE));
 const individual=elementCSS({one:{radius:3}},()=>individualDesignDescriptor({selector:'.norway-catalog-card'}));assert.ok(individual.includes(DESIGN_SCOPE+' :is(.norway-catalog-card)'));
});


test('schema exposes the global groups consumed by the admin module',async()=>{
 const schema=await import('./site-editor-schema.mjs?v=6');
 assert.equal(schema.GLOBAL_DESIGN_GROUPS.length,3);
 assert.ok(schema.GLOBAL_DESIGN_FIELDS.includes('fontSize'));
});
