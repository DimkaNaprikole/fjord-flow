import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fixture,cat} from './osiris-presence.fixture.mjs';
const require=createRequire(import.meta.url);
const {safeStep,swept}=require('./osiris-presence.js');
test('lower-edge movement stays inside viewport',()=>{
 assert.equal(safeStep(cat,-2,390,800,[]),true);
 assert.equal(safeStep(cat,120,390,800,[]),false);
 assert.equal(safeStep(cat,-180,390,800,[]),false);
});
test('swept path cannot jump across a narrow link or media',()=>{
 assert.deepEqual(swept(cat,-100),{left:80,right:264,top:650,bottom:758});
 assert.equal(safeStep(cat,-100,390,800,[{left:120,right:123,top:660,bottom:690}]),false);
 assert.equal(safeStep(cat,-2,390,800,[{left:90,right:200,top:500,bottom:645}]),false);
 assert.equal(safeStep(cat,-2,390,800,[{left:30,right:160,top:200,bottom:400}]),true);
});
test('opening the cat never opts into sound or schedules a delayed meow',()=>{
 const f=fixture();assert.equal(f.toggle.checked,false);
 f.tick(100000);assert.equal(f.plays(),0);
 f.launch.emit('keydown',{isTrusted:false,key:'Enter'});f.tick(200000);assert.equal(f.plays(),0);
 f.launch.emit('keydown',{isTrusted:true,key:'Enter'});f.launch.emit('pointerdown',{isTrusted:true});f.win.emit('pointerup');
 f.tick(300000);f.tick(690000);assert.equal(f.plays(),0);
 assert.equal(f.plays(),0,'idle motion is always silent');
});
test('only a trusted sound toggle previews a meow, and never during voice or speech',()=>{
 const f=fixture();f.toggle.checked=true;f.toggle.emit('change',{isTrusted:false});assert.equal(f.plays(),0);assert.equal(f.toggle.checked,false);
 f.toggle.checked=true;f.toggle.emit('change',{isTrusted:true});assert.equal(f.plays(),1);
 f.tick(90000);f.tick(180000);assert.equal(f.plays(),1,'no periodic sound');
 f.win.emit('fjord:voice-activity',{detail:{active:true}});assert.ok(f.pauses()>0);
 f.toggle.checked=true;f.toggle.emit('change',{isTrusted:true});assert.equal(f.plays(),1);
 f.win.emit('fjord:voice-activity',{detail:{active:false}});f.tick(300000);assert.equal(f.plays(),1,'ending voice never replays a meow');
 f.pet.dataset.state='speaking';f.toggle.emit('change',{isTrusted:true});assert.equal(f.plays(),1);
 f.pet.dataset.state='idle';f.doc.hidden=true;f.toggle.emit('change',{isTrusted:true});assert.equal(f.plays(),1);
 f.doc.hidden=false;f.toggle.checked=false;f.toggle.emit('change',{isTrusted:true});assert.equal(f.toggle.checked,false);
});
test('compact speaking can move; hover, focus and reduced motion freeze it',()=>{
 const f=fixture();f.dialog.open=true;f.dialog.classList.add('osiris-compact');f.win.emit('fjord:voice-activity',{detail:{active:true}});f.setState('speaking');
 f.launch.emit('pointerenter');f.tick(13000);assert.equal(f.launch.style.translate,undefined);
 f.launch.emit('pointerleave');f.launch.focusVisible=true;f.launch.emit('focusin');f.tick(14000);assert.equal(f.launch.style.translate,undefined);
 f.launch.emit('focusout');f.motion.matches=true;f.tick(15000);assert.equal(f.launch.style.translate,undefined);
 f.motion.matches=false;f.tick(16000);assert.notEqual(f.launch.style.translate,undefined);
 const position=f.launch.style.translate;f.win.emit('fjord:voice-activity',{detail:{active:false}});f.tick(20000);assert.equal(f.launch.style.translate,position,'stopping voice freezes the cat');
});
test('expanded and compact speaking stay within a 36 pixel drift',()=>{
 const f=fixture();f.dialog.open=true;f.win.emit('fjord:voice-activity',{detail:{active:true}});f.setState('speaking');
 f.tick(1000);assert.notEqual(f.launch.style.translate,undefined,'expanded speech also permits a safe step');f.dialog.classList.add('osiris-compact');
 f.launch.focusVisible=false;f.launch.emit('focusin');
 for(let time=1100;time<120000;time+=100){f.tick(time);if(f.launch.style.translate)assert.ok(Math.abs(parseFloat(f.launch.style.translate))<=36);}
 assert.notEqual(f.launch.style.translate,undefined);assert.equal(f.plays(),0);
 const position=f.launch.style.translate;f.launch.focusVisible=true;f.launch.emit('focusin');f.tick(200000);assert.equal(f.launch.style.translate,position);
});
