const {test}=require('node:test');const assert=require('node:assert/strict');const {cameras,recent,select}=require('./webcam-directory.js');
test('checked cameras expire instead of claiming permanent availability',()=>{const day=Date.parse('2026-10-19T12:00:00Z');assert.equal(select('all',true,day).length,cameras.length);assert.equal(select('all',true,day+8*86400000).length,0);assert.equal(select('all',false,day+8*86400000).length,cameras.length);assert.equal(recent(cameras[0],Date.parse('2026-10-18')),false);});
test('road cameras have a checked image, source timestamp and explicit technical verification',()=>{const road=cameras.filter(c=>c.kind==='road');assert.equal(road.length,864);assert.equal(new Set(road.map(c=>c.cameraId)).size,road.length);for(const c of road){assert.equal(c.type,'snapshot');assert.equal(c.verification,'image-response');assert.match(c.snapshot,/^https:\/\/kamera\.atlas\.vegvesen\.no\/api\/images\//);assert.ok(Date.parse(c.sourceUpdated));assert.match(c.quality,/\d+ × \d+/);}assert.ok(cameras.filter(c=>c.verification==='visual').length>=14);});
test('type filtering and evidence do not invent video for still images',()=>{const day=Date.parse('2026-10-19T12:00:00Z');assert.ok(select('snapshot',true,day).length>=864);assert.ok(select('video',true,day).every(c=>c.type==='video'));assert.equal(cameras.find(c=>c.id==='loen').quality,null);});

// Run the complete browser module and its actual play/stop/filter handlers.
async function browserHarness(){
 const vm=require('node:vm'),fs=require('node:fs');
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.dataset={};this.hidden=false;}
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  replaceChildren(...nodes){this.children.forEach(n=>n.parentElement=null);this.children=[];this.append(...nodes);}
  setAttribute(name,value){this.attributes[name]=value;}
  after(node){section=node;}
  closest(selector){if(selector==='[hidden]'){let n=this;while(n){if(n.hidden)return n;n=n.parentElement;}}return null;}
 }
 let section;const events={},documentEvents={},nav=new Element('nav'),anchor=new Element('section');
 const document={hidden:false,documentElement:{lang:'en'},createElement:tag=>new Element(tag),createTextNode:text=>Object.assign(new Element('#text'),{textContent:text}),getElementById:()=>anchor,querySelector:()=>nav,addEventListener:(name,fn)=>documentEvents[name]=fn};
 const window={fetch:async()=>({ok:true,json:async()=>require('./webcam-directory-data.json')}),addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:event=>events[event.type]?.(event)};
 vm.runInNewContext(fs.readFileSync(require.resolve('./webcam-directory.js'),'utf8'),{document,window,Event:class{constructor(type){this.type=type;}},Date:class extends Date{static now(){return Date.parse('2026-10-19T12:00:00Z')}}});
 await window.FjordWebcams.ready;
 const find=(predicate,node=section)=>predicate(node)?node:node.children.map(child=>find(predicate,child)).find(Boolean);
 return {document,events,documentEvents,get section(){return section;},find};
}
test('leaving webcam tab removes the real player, preserves filters and restores click-to-play',async()=>{
 const h=await browserHarness();
 h.find(n=>n.className==='webcam-filters').children.find(n=>n.textContent==='Video').onclick();
 const play=h.find(n=>n.tagName==='button'&&n.textContent==='Watch camera');
 assert.equal(h.find(n=>n.tagName==='iframe'),undefined,'no third-party player before a click');
 play.onclick();const frame=h.find(n=>n.tagName==='iframe');assert.match(frame.src,/youtube-nocookie/);
 h.section.hidden=true;h.events['fjord:sections-changed']();
 assert.equal(h.find(n=>n.tagName==='iframe'),undefined);assert.equal(frame.parentElement,null);
 assert.equal(h.find(n=>n.textContent==='Video'&&n.attributes['aria-pressed']==='true').textContent,'Video');
 assert.equal(play.textContent,'Watch camera');assert.ok(h.find(n=>n.tagName==='img'&&n.alt==='Geiranger · Hotel Union')); // Location photo remains a separate illustration.
 h.section.hidden=false;h.events['fjord:sections-changed']();assert.equal(h.find(n=>n.tagName==='iframe'),undefined,'returning must not restart autoplay');
 play.onclick();assert.ok(h.find(n=>n.tagName==='iframe'),'explicit click starts the camera again');
});
test('backgrounding the browser stops a camera without changing its selected section',async()=>{
 const h=await browserHarness();h.find(n=>n.tagName==='button'&&n.textContent==='Watch camera').onclick();
 h.document.hidden=true;h.documentEvents.visibilitychange();assert.equal(h.find(n=>n.tagName==='iframe'),undefined);
 h.document.hidden=false;h.documentEvents.visibilitychange();assert.equal(h.find(n=>n.tagName==='iframe'),undefined);
});

test('large registry starts with 24 cards and lets visitors search without loading remote camera images',async()=>{
 const h=await browserHarness();
 const grid=()=>h.find(n=>n.className==='webcam-grid');
 assert.equal(grid().children.length,24);
 assert.equal(h.find(n=>n.tagName==='iframe'),undefined);
 const more=h.find(n=>n.className==='webcam-more');more.onclick();
 assert.equal(grid().children.length,48);
 const field=h.find(n=>n.tagName==='input'&&n.type==='search');field.value='Gimsøystraumen';
 h.find(n=>n.tagName==='button'&&n.textContent==='Search').onclick();
 assert.ok(grid().children.length>0&&grid().children.length<24);
 assert.ok(grid().children.every(card=>card.children.some(n=>n.tagName==='h3'&&n.textContent.includes('Gimsøystraumen'))));
});
