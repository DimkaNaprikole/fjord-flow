const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
test('scroll relocates the same menu and restores its slot without duplicates', () => {
  let y = 0, parent = 'header', slotPresent = false;
  const listeners = {}, classes = new Set(), properties = new Map();
  const style = {setProperty:(k,v)=>properties.set(k,v), removeProperty:k=>properties.delete(k)};
  const nav = {
    style,
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
    getBoundingClientRect:()=>({top:parent==='header'?500-y:0,bottom:parent==='header'?560-y:60,height:60}),
    before:node=>{assert.equal(node,slot);slotPresent=true;}
  };
  const slot = {style:{},setAttribute(){},getBoundingClientRect:()=>({left:20,width:960,bottom:560-y}),
    before:node=>{assert.equal(node,nav);parent='header';},remove:()=>{slotPresent=false;}};
  const document = {querySelector:()=>nav,createElement:()=>slot,documentElement:{style},
    body:{append:node=>{assert.equal(node,nav);parent='body';}}};
  vm.runInNewContext(readFileSync(__dirname+'/follow-menu.js','utf8'),{
    document,innerWidth:1000,addEventListener:(k,fn)=>listeners[k]=fn,requestAnimationFrame:fn=>fn()
  });
  assert.equal(parent,'header');
  y=559;listeners.scroll();assert.equal(parent,'header');
  y=600;listeners.scroll();assert.equal(parent,'body');assert.equal(slotPresent,true);
  assert.equal(slot.style.height,'60px');assert.equal(properties.get('--follow-width'),'960px');
  y=1800;listeners.scroll();assert.equal(parent,'body');
  listeners.resize();assert.equal(parent,'body');assert.equal(slotPresent,true);
  y=400;listeners.scroll();assert.equal(parent,'header');assert.equal(slotPresent,false);
  assert.equal(classes.has('follow-menu-pinned'),false);
  assert.equal(properties.get('--follow-menu-height'),'0px');
});
