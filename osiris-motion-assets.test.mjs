import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './osiris-presence.fixture.mjs';

test('idle patrol and play are brief and silent; hovering pins the launcher for clicking',()=>{
 const f=fixture();assert.match(f.avatar.src,/listen\.png$/);
 f.tick(4100);assert.match(f.avatar.src,/walk\.webp$/);assert.notEqual(f.launch.style.translate,undefined);
 f.tick(9200);assert.match(f.avatar.src,/listen\.png$/);
 f.tick(21300);f.tick(26400);f.tick(38500);assert.match(f.avatar.src,/play\.webp$/);
 const position=f.launch.style.translate;f.tick(39000);assert.equal(f.launch.style.translate,position);
 f.tick(40500);assert.match(f.avatar.src,/listen\.png$/);assert.equal(f.plays(),0);
 f.tick(53000);f.launch.emit('pointerenter');const pinned=f.launch.style.translate;
 f.tick(54000);assert.equal(f.launch.style.translate,pinned);assert.match(f.avatar.src,/listen\.png$/);
});

test('listening replaces walking immediately and never starts recording or cat audio',()=>{
 const f=fixture();f.tick(4100);f.win.emit('fjord:voice-activity',{detail:{active:true}});f.setState('speaking');f.tick(4200);
 const position=f.launch.style.translate;f.setState('listening');assert.match(f.avatar.src,/listen\.webp$/);
 f.tick(10000);assert.equal(f.launch.style.translate,position);assert.equal(f.plays(),0);
 f.setState('thinking');assert.match(f.avatar.src,/listen\.png$/);
});

test('hidden pages and reduced motion use static images and missing media falls back to portrait',()=>{
 const f=fixture();f.tick(4100);f.doc.hidden=true;f.doc.emit('visibilitychange');assert.match(f.avatar.src,/listen\.png$/);
 f.doc.hidden=false;f.motion.matches=true;f.motion.emit('change');f.tick(10000);assert.match(f.avatar.src,/listen\.png$/);
 f.avatar.onerror();assert.equal(f.avatar.src,'./images/osiris-assistant-v1.png');assert.equal(f.plays(),0);
});
