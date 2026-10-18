import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENTS,elementDescriptor,validateDocument,emptyDocument} from './site-editor-schema.mjs';
import {elementCSS,createElementImages,createElementMedia} from './element-design.mjs';
test('editor targets are fixed, unique and map back to existing text/button records',()=>{
 assert.equal(new Set(ELEMENTS.map(row=>row.id)).size,ELEMENTS.length);
 assert.equal(elementDescriptor('text_pages_home_title').field,'title');
 assert.equal(elementDescriptor('button_register').itemId,'register');
 assert.equal(elementDescriptor('section_hero').kind,'section');
 assert.equal(elementDescriptor('photo_header').imageSelector,'.solidarity-art-pair>.solidarity-art');
 assert.equal(elementDescriptor('place_granavolden-cafe').selector,'[data-cms-place-id="granavolden-cafe"]');
 for(const id of ['body','__proto__','place_x\"]{body','place_../x','place_'+('a'.repeat(81))])assert.equal(elementDescriptor(id),null);
});
test('legacy documents keep an empty optional design overlay and unchanged catalogue',()=>{
 const old=emptyDocument();delete old.elements;old.catalogue.places=[{id:'existing-place',enabled:false}];
 const next=validateDocument(old);assert.deepEqual(next.elements,{});assert.deepEqual(next.catalogue,old.catalogue);
 assert.equal(elementCSS(next.elements,elementDescriptor),'');
});
test('bounded design validates without adding defaults and rejects executable content',()=>{
 const input={schemaVersion:1,elements:{button_register:{name:' Регистрация ',background:'#123456',backgroundOpacity:0.4,borderColor:'#abcdef',borderOpacity:0,borderStyle:'ridge',borderTopWidth:16,radiusBottomRight:160,fontWeight:'700',textAlign:'right',opacity:1,offsetX:-160,offsetY:160,image:{src:'images/cafe.jpg',alt:'Кафе',credit:'Автор',source:'https://example.org/photo'}}}};
 const actual=validateDocument(input).elements.button_register;assert.equal(actual.name,'Регистрация');assert.equal(actual.padding,undefined);assert.equal(actual.image.credit,'Автор');
 for(const record of [{selector:'body'},{html:'<img>'},{css:'display:none'},{background:'red'},{opacity:1.01},{borderOpacity:-1},{fontSize:10},{widthPercent:101},{radius:65},{radiusTopLeft:161},{borderLeftWidth:17},{offsetX:161},{shadow:'url(x)'},{borderStyle:'evil'},{image:{src:'javascript:alert(1)'}},{image:{src:'images/a.jpg',source:'https://x.test/a\"'}},{name:'x\n'}])assert.throws(()=>validateDocument({schemaVersion:1,elements:{section_hero:record}}),JSON.stringify(record));
 assert.throws(()=>validateDocument({schemaVersion:1,elements:{body:{}}}));
 const many=Object.fromEntries(Array.from({length:501},(_,i)=>['place_id-'+i,{}]));assert.throws(()=>validateDocument({schemaVersion:1,elements:many}));
});
test('CSS alters only explicit fields and restricts position offsets to desktop',()=>{
 const css=elementCSS(validateDocument({schemaVersion:1,elements:{section_hero:{name:'Editor only',background:'#123456',backgroundOpacity:0.5,borderColor:'#abcdef',borderOpacity:0,borderWidth:2,borderStyle:'double',radius:18,radiusTopLeft:36,borderLeftWidth:4,offsetX:0,offsetY:42,textAlign:'right'},photo_hero:{image:{src:'images/hero.jpg'}}}}).elements,elementDescriptor);
 assert.match(css,/background-color:rgba\(18,52,86,0.5\)/);assert.match(css,/border-color:rgba\(171,205,239,0\)/);assert.match(css,/border-top-left-radius:36px/);assert.match(css,/border-left-width:4px/);
 assert.match(css,/@media\(min-width:1001px\)\{:is\(#homePanel, #journeys > .hero\)\{translate:0px 42px!important\}\}/);
 assert.match(css,/background-image:url\("images\/hero.jpg"\)/);assert.match(css,/hero-location-film\{display:none/);
 assert.doesNotMatch(css,/Editor only|padding:|[;{]width:|transform:/);
 assert.equal(elementCSS({section_hero:{name:'A'}},elementDescriptor),'');
});
test('tablet and mobile design overrides remain independent and desktop movement stays on desktop',()=>{
 const record={background:'#123456',offsetX:120,padding:32,tablet:{padding:20,offsetX:8},mobile:{padding:12,widthPercent:100,backgroundOpacity:0.3,offsetY:2}};
 const doc=validateDocument({schemaVersion:1,elements:{section_hero:record}});assert.deepEqual(doc.elements.section_hero,record);
 const css=elementCSS(doc.elements,elementDescriptor);
 assert.match(css,/@media\(min-width:1001px\).*translate:120px 0px/);
 assert.match(css,/@media\(min-width:681px\) and \(max-width:1000px\).*padding:20px.*translate:8px 0px/);
 assert.match(css,/@media\(max-width:680px\).*padding:12px.*rgba\(18,52,86,0.3\).*translate:0px 2px/);
 for(const nested of [{mobile:{name:'x'}},{mobile:{mobile:{padding:12}}},{tablet:{offsetY:161}},{mobile:{image:{src:'data:x'}}}])assert.throws(()=>validateDocument({schemaVersion:1,elements:{section_hero:nested}}));
});
test('owner frame presets store only bounded border styles and safe decorative image borders',()=>{
 const preset={id:'my-border',name:'Моя рамка',style:{borderStyle:'solid',borderWidth:8,radiusTopLeft:30,borderImage:{src:'images/border.png',slice:30,repeat:'round'}}};
 assert.deepEqual(validateDocument({schemaVersion:1,framePresets:[preset]}).framePresets,[preset]);
 const css=elementCSS({section_hero:{borderImage:{src:'images/border.png'}}},elementDescriptor);
 assert.match(css,/border-image-source:url\("images\/border.png"\)/);assert.match(css,/border-image-slice:25%!important/);assert.match(css,/border-width:8px/);
 for(const invalid of [{...preset,style:{color:'#ffffff'}},{...preset,style:{borderImage:{src:'javascript:x'}}},{...preset,style:{borderImage:{src:'images/border.png',slice:0}}},{...preset,style:{borderImage:{src:'images/border.png',repeat:'evil'}}}])assert.throws(()=>validateDocument({schemaVersion:1,framePresets:[invalid]}));
 assert.throws(()=>validateDocument({schemaVersion:1,framePresets:[preset,preset]}));
});
test('responsive global radius and border width override inherited per-corner and per-side values',()=>{
 const css=elementCSS({section_hero:{radiusTopLeft:50,borderLeftWidth:10,mobile:{radius:8,borderWidth:2,radiusTopRight:16,borderBottomWidth:4}}},elementDescriptor);
 const mobile=css.slice(css.indexOf('@media(max-width:680px)'));
 assert.match(mobile,/border-top-left-radius:8px!important/);assert.match(mobile,/border-left-width:2px!important/);
 assert.ok(mobile.indexOf('border-top-right-radius:16px')>mobile.indexOf('border-top-right-radius:8px'));
 assert.ok(mobile.indexOf('border-bottom-width:4px')>mobile.indexOf('border-bottom-width:2px'));
});
test('normal media and element overlays converge without repeated source writes',()=>{
 const attrs=new Map([['src','images/native.jpg'],['alt','Native']]);let writes=0;
 const node={getAttribute:key=>attrs.get(key)??null,setAttribute:(key,value)=>{writes++;attrs.set(key,value);},removeAttribute:key=>{writes++;attrs.delete(key);}};
 const document={querySelectorAll:selector=>selector==='.waterfall-story>img'?[node]:[],querySelector:selector=>selector==='.waterfall-story>img'?node:null};
 const applyBase=(target,photo)=>{if(!target)return;const values=photo||{src:'images/native.jpg',alt:'Native'};for(const field of ['src','alt'])if(target.getAttribute(field)!==values[field])target.setAttribute(field,values[field]);};
 const apply=createElementMedia(document,elementDescriptor,applyBase),legacy={waterfall:{src:'images/legacy.jpg',alt:'Legacy'}},elements={photo_waterfall:{image:{src:'images/overlay.jpg',alt:'Overlay'}}};
 apply(elements,legacy,1200);const firstWrites=writes;assert.equal(attrs.get('src'),'images/overlay.jpg');
 for(let i=0;i<10;i++)apply(elements,legacy,1200);assert.equal(writes,firstWrites);
 apply({},legacy,1200);assert.equal(attrs.get('src'),'images/legacy.jpg');assert.equal(attrs.get('alt'),'Legacy');
 const restoredWrites=writes;apply({},legacy,1200);assert.equal(writes,restoredWrites);
});
test('responsive image replacements follow actual viewport and restore native images',()=>{
 const attrs=new Map([['src','images/original.jpg'],['alt','Original']]),node={getAttribute:key=>attrs.get(key)??null,setAttribute:(key,value)=>attrs.set(key,value),removeAttribute:key=>attrs.delete(key)};
 const apply=createElementImages({querySelectorAll:()=>[node]},elementDescriptor),elements={photo_waterfall:{image:{src:'images/desktop.jpg'},tablet:{image:{src:'images/tablet.jpg'}},mobile:{image:{src:'images/mobile.jpg',alt:'Mobile'}}}};
 apply(elements,1200);assert.equal(attrs.get('src'),'images/desktop.jpg');
 apply(elements,800);assert.equal(attrs.get('src'),'images/tablet.jpg');
 apply(elements,390);assert.equal(attrs.get('src'),'images/mobile.jpg');assert.equal(attrs.get('alt'),'Mobile');
 apply(elements,1200);assert.equal(attrs.get('src'),'images/desktop.jpg');assert.equal(attrs.get('alt'),'Original');
 apply({},390);assert.equal(attrs.get('src'),'images/original.jpg');
});
test('image replacement restores original src and alt and does not change absent alt',()=>{
 const attributes=new Map([['src','images/original.jpg'],['alt','Original']]);
 const node={getAttribute:key=>attributes.get(key)??null,setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key)};
 const document={querySelectorAll:selector=>selector==='.waterfall-story>img'?[node]:[]};
 const apply=createElementImages(document,elementDescriptor);
 apply({photo_waterfall:{image:{src:'images/new.jpg'}}});assert.equal(attributes.get('src'),'images/new.jpg');assert.equal(attributes.get('alt'),'Original');
 apply({photo_waterfall:{image:{src:'images/new.jpg',alt:'New'}}});assert.equal(attributes.get('alt'),'New');
 apply({});assert.equal(attributes.get('src'),'images/original.jpg');assert.equal(attributes.get('alt'),'Original');
 apply({photo_waterfall:{image:{src:'images/overlay.jpg',alt:'Overlay'}}});
 // The older media editor may replace the baseline while the element overlay is active.
 attributes.set('src','images/new-baseline.jpg');attributes.set('alt','New baseline');
 apply({photo_waterfall:{image:{src:'images/overlay.jpg',alt:'Overlay'}}});
 apply({});assert.equal(attributes.get('src'),'images/new-baseline.jpg');assert.equal(attributes.get('alt'),'New baseline');
 apply({photo_waterfall:{image:{src:'images/overlay.jpg'}}});attributes.set('src','images/another-baseline.jpg');
 apply({});assert.equal(attributes.get('src'),'images/another-baseline.jpg');
});
