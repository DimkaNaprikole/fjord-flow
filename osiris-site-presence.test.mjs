import test from 'node:test';
import assert from 'node:assert/strict';
import {patrolStep,presencePaused} from './osiris/site-presence.mjs';
test('conversation and translation do not freeze movement; explicit pauses still do',()=>{
 for(const state of ['idle','listening','thinking','speaking'])assert.equal(presencePaused({state,voice:true}),false);
 for(const flag of ['paused','hidden','reduced'])assert.equal(presencePaused({[flag]:true}),true);
});
test('patrol can cross the old 36px limit but never cross a button or screen edge',()=>{
 const rect={left:160,right:370,top:550,bottom:712};
 assert.equal(patrolStep(rect,-100,1280),true);
 assert.equal(patrolStep(rect,-155,1280),false);
 assert.equal(patrolStep(rect,900,1280),false);
 assert.equal(patrolStep(rect,-100,1280,[{left:90,right:95,top:580,bottom:610}]),false);
 assert.equal(patrolStep(rect,-100,1280,[{left:90,right:95,top:100,bottom:200}]),true);
 assert.equal(patrolStep({left:20,right:188,top:550,bottom:684},-10,390),false);
});
