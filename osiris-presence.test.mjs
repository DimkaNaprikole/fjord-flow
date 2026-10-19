import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const {safeStep,swept}=require('./osiris-presence.js');
const cat={left:180,right:264,top:650,bottom:758};
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
function fixture(){
 class Node {
  constructor(){this.dataset={};this.listeners={};this.children=[];this.style={removeProperty:key=>delete this.style[key]};this.open=false;this.classes=new Set();this.classList={contains:key=>this.classes.has(key),add:key=>this.classes.add(key),remove:key=>this.classes.delete(key)}}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
  removeEventListener(){}
  emit(type,props={}){for(const fn of this.listeners[type]||[])fn({type,...props})}
  append(...nodes){this.children.push(...nodes)}
  contains(){return false}
  setAttribute(key,value){this[key]=value}
  removeAttribute(key){delete this[key]}
  remove(){}
  matches(){return this.focusVisible===true}
  getBoundingClientRect(){return cat}
 }
 const launch=new Node(),dialog=new Node(),pet=new Node(),about=new Node(),doc=new Node(),win=new Node(),motion=new Node();
 motion.matches=false;
 pet.dataset.state='idle';doc.documentElement={lang:'ru'};doc.readyState='complete';doc.hidden=false;
 launch.querySelector=()=>pet;dialog.querySelector=()=>about;
 doc.querySelector=selector=>selector.includes('.osiris-launch')?launch:null;
 doc.getElementById=()=>dialog;doc.querySelectorAll=()=>[];doc.createElement=()=>new Node();
 let now=0,frame,plays=0,pauses=0;
 const context={document:doc,window:win,innerWidth:390,innerHeight:800,matchMedia:()=>motion,Date:{now:()=>now},requestAnimationFrame:fn=>{frame=fn;return 1},cancelAnimationFrame(){},MutationObserver:class{observe(){}disconnect(){}},Audio:class{play(){plays++;return Promise.resolve()}pause(){pauses++}}};
 vm.runInNewContext(readFileSync(new URL('./osiris-presence.js',import.meta.url),'utf8'),context);
 return {launch,dialog,pet,doc,win,motion,about,toggle:about.children[0].children[0],plays:()=>plays,pauses:()=>pauses,tick(time){now=time;frame(time)}};
}
test('opening the cat never opts into sound or schedules a delayed meow',()=>{
 const f=fixture();assert.equal(f.toggle.checked,false);
 f.tick(100000);assert.equal(f.plays(),0);
 f.launch.emit('keydown',{isTrusted:false,key:'Enter'});f.tick(200000);assert.equal(f.plays(),0);
 f.launch.emit('keydown',{isTrusted:true,key:'Enter'});f.launch.emit('pointerdown',{isTrusted:true});f.win.emit('pointerup');
 f.tick(300000);f.tick(690000);assert.equal(f.plays(),0);
 assert.equal(f.launch.style.translate,undefined,'inactive Osiris is stationary');
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
test('active compact voice can move; hover, focus and reduced motion freeze it',()=>{
 const f=fixture();f.dialog.open=true;f.dialog.classList.add('osiris-compact');f.win.emit('fjord:voice-activity',{detail:{active:true}});
 f.launch.emit('pointerenter');f.tick(13000);assert.equal(f.launch.style.translate,undefined);
 f.launch.emit('pointerleave');f.launch.focusVisible=true;f.launch.emit('focusin');f.tick(14000);assert.equal(f.launch.style.translate,undefined);
 f.launch.emit('focusout');f.motion.matches=true;f.tick(15000);assert.equal(f.launch.style.translate,undefined);
 f.motion.matches=false;f.pet.dataset.state='listening';f.tick(16000);assert.notEqual(f.launch.style.translate,undefined);
 const position=f.launch.style.translate;f.win.emit('fjord:voice-activity',{detail:{active:false}});f.tick(20000);assert.equal(f.launch.style.translate,position,'stopping voice freezes the cat');
});
test('expanded chat pauses movement; compact voice stays within a 36 pixel drift',()=>{
 const f=fixture();f.dialog.open=true;f.win.emit('fjord:voice-activity',{detail:{active:true}});
 f.tick(1000);assert.equal(f.launch.style.translate,undefined,'expanded reader is stationary');f.dialog.classList.add('osiris-compact');
 f.launch.focusVisible=false;f.launch.emit('focusin');
 for(let time=1100;time<120000;time+=100){f.tick(time);if(f.launch.style.translate)assert.ok(Math.abs(parseFloat(f.launch.style.translate))<=36);}
 assert.notEqual(f.launch.style.translate,undefined);assert.equal(f.plays(),0);
 const position=f.launch.style.translate;f.launch.focusVisible=true;f.launch.emit('focusin');f.tick(200000);assert.equal(f.launch.style.translate,position);
});
