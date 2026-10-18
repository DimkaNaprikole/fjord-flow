import test from 'node:test';
import assert from 'node:assert/strict';
import {contextActions} from './builder-context-admin.mjs';
import {elementDescriptor} from './site-editor-schema.mjs';
test('context menu offers real operations of the selected target without dead text actions',()=>{
 const ids=item=>contextActions(item).map(a=>a[0]);
 assert.ok(ids(elementDescriptor('text_pages_home_title')).includes('content'));
 assert.ok(ids(elementDescriptor('button_register')).includes('border'));
 assert.ok(ids(elementDescriptor('image_place_granavolden-cafe')).includes('photo'));
 assert.ok(ids(elementDescriptor('image_place_granavolden-cafe')).includes('place'));
 assert.ok(!ids(elementDescriptor('section_hero')).includes('content'));
 assert.deepEqual(contextActions(null),[]);
});
