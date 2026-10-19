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
  constructor(){this.dataset={};this.listeners={};this.children=[];this.style={removeProperty:key=>delete this.style[key]};this.open=false}
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
 return {launch,dialog,pet,doc,win,motion,about,plays:()=>plays,pauses:()=>pauses,tick(time){now=time;frame(time)}};
}
test('no audio before trusted gesture; dialogue, voice and hidden states suppress it',()=>{
 const f=fixture();
 f.tick(100000);assert.equal(f.plays(),0);
 f.launch.emit('keydown',{isTrusted:false,key:'Enter'});f.tick(200000);assert.equal(f.plays(),0);
 f.launch.emit('keydown',{isTrusted:true,key:'Enter'});
 f.dialog.open=true;f.tick(300000);assert.equal(f.plays(),0);
 f.dialog.open=false;f.pet.dataset.state='listening';f.tick(400000);assert.equal(f.plays(),0);
 f.pet.dataset.state='idle';f.doc.hidden=true;f.tick(500000);assert.equal(f.plays(),0);
 f.doc.hidden=false;f.tick(600000);assert.equal(f.plays(),1);
 f.tick(601000);assert.equal(f.plays(),1);
 f.tick(690000);assert.equal(f.plays(),2);
});
test('hover, focus and reduced motion freeze movement and never open the menu',()=>{
 const f=fixture();f.launch.emit('pointerenter');f.tick(13000);assert.equal(f.launch.style.translate,undefined);
 f.launch.emit('pointerleave');f.launch.focusVisible=true;f.launch.emit('focusin');f.tick(14000);assert.equal(f.launch.style.translate,undefined);
 f.launch.emit('focusout');f.motion.matches=true;f.tick(15000);assert.equal(f.launch.style.translate,undefined);
 assert.equal(f.dialog.open,false);
});
test('returned pointer focus after closing does not prevent idle; keyboard focus does',()=>{
 const f=fixture();
 f.launch.emit('keydown',{isTrusted:true,key:'Enter'});
 f.dialog.open=true;f.tick(1000);
 f.dialog.open=false;f.dialog.emit('close');
 f.launch.focusVisible=false;f.launch.emit('focusin');
 f.tick(92000);assert.equal(f.plays(),1);assert.notEqual(f.launch.style.translate,undefined);
 const position=f.launch.style.translate;
 f.launch.focusVisible=true;f.launch.emit('focusin');
 f.tick(200000);assert.equal(f.plays(),1);assert.equal(f.launch.style.translate,position);
});
