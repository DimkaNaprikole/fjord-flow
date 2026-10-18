import test from 'node:test';
import assert from 'node:assert/strict';
import {elementDescriptor,validateDocument} from './site-editor-schema.mjs';
import {elementCSS} from './element-design.mjs';
import {resolveVisualSelection,captureSelectionValues} from './visual-builder.mjs';

test('photo descriptors stay inside safe known card cover selectors',()=>{
 const photo=elementDescriptor('image_place_granavolden-cafe');
 assert.equal(photo.kind,'photo');assert.equal(photo.group,'catalogue');assert.equal(photo.itemId,'granavolden-cafe');
 assert.equal(photo.imageSelector,'[data-cms-place-id="granavolden-cafe"] :is(.norway-catalog-photo,.stay-photo-open) img');
 assert.equal(elementDescriptor('image_story_bergen').imageSelector,'[data-discovery-story="bergen"] .discovery-story-image img');
 assert.equal(elementDescriptor('image_experience_tusenfryd').group,'blocks');
 assert.equal(elementDescriptor('image_story_x"] body'),null);
 assert.equal(elementDescriptor('photo_cafes').selector,'#cafeStops .discovery-cafe-photo img');
 for(const id of ['image_place_../x','image_place_x"] body','image_place_'+('a'.repeat(81))])assert.equal(elementDescriptor(id),null);
});

test('direct image click selects photo while card padding selects its container',()=>{
 const card={dataset:{cmsPlaceId:'granavolden-cafe',builderElement:'place_granavolden-cafe'},closest:selector=>selector==='[data-builder-element]'?card:null};
 const image={dataset:{builderElement:'image_place_granavolden-cafe'},closest:selector=>selector==='img'||selector==='[data-builder-element]'?image:selector==='[data-cms-place-id]'?card:null};
 assert.equal(resolveVisualSelection(image).item.id,'image_place_granavolden-cafe');
 assert.equal(resolveVisualSelection(image).target,image);
 assert.equal(resolveVisualSelection(card).item.id,'place_granavolden-cafe');
 const title={dataset:{builderElement:'text_pages_home_title'},closest:selector=>selector==='[data-builder-element]'?title:null};
 assert.equal(resolveVisualSelection(title).item.kind,'text');
});

test('selected photo values contain bounded actual data for contextual inspector',()=>{
 const attributes={src:'images/real.jpg',alt:'Real place'};
 const photo={tagName:'IMG',innerText:'',textContent:'',getAttribute:key=>attributes[key],getBoundingClientRect:()=>({width:320,height:210}),ownerDocument:{defaultView:{getComputedStyle:()=>({fontSize:'16px',paddingTop:'4px',borderTopLeftRadius:'8px',backgroundColor:'rgb(0, 0, 0)'})}}};
 const values=captureSelectionValues(photo,{kind:'photo'});
 assert.equal(values.src,'images/real.jpg');assert.equal(values.alt,'Real place');assert.equal(values.metrics.width,320);assert.equal(values.metrics.borderRadius,8);
 assert.equal(captureSelectionValues({...photo,innerText:'Visible title'},{kind:'text'}).text,'Visible title');
});

test('image sizing, margins and visibility validate with bounded responsive styles',()=>{
 const style={heightPx:240,marginTop:-16,marginRight:20,marginBottom:0,marginLeft:8,objectFit:'contain',objectPositionX:30,objectPositionY:70,hidden:true,mobile:{heightPx:180,objectPositionY:20,hidden:false}};
 const elements=validateDocument({schemaVersion:1,elements:{'image_place_granavolden-cafe':style}}).elements;
 const css=elementCSS(elements,elementDescriptor);
 assert.match(css,/height:240px!important/);assert.match(css,/margin-top:-16px!important/);assert.match(css,/object-fit:contain!important/);assert.match(css,/object-position:30% 70%!important/);assert.match(css,/display:none!important/);assert.match(css,/object-position:30% 20%!important/);
 for(const record of [{heightPx:15},{heightPx:1201},{objectFit:'url(x)'},{objectPositionX:101},{marginLeft:-161},{hidden:'true'}])assert.throws(()=>validateDocument({schemaVersion:1,elements:{photo_hero:record}}));
});

