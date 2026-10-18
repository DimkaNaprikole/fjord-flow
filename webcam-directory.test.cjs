const {test}=require('node:test');const assert=require('node:assert/strict');const {cameras,recent,select}=require('./webcam-directory.js');
test('checked cameras expire instead of claiming permanent availability',()=>{const day=Date.parse('2026-10-18T12:00:00Z');assert.equal(select('all',true,day).length,3);assert.equal(select('all',true,day+7*86400000).length,0);assert.equal(select('all',false,day+7*86400000).length,3);assert.equal(recent(cameras[0],Date.parse('2026-10-17')),false);});
test('type filtering and evidence stay separate from guessed quality',()=>{const day=Date.parse('2026-10-18T12:00:00Z');assert.equal(select('video',true,day).length,2);assert.equal(select('panorama',true,day).length,1);assert.equal(cameras.find(c=>c.id==='bergen').quality,'1920 × 1080');assert.equal(cameras.find(c=>c.id==='loen').quality,null);for(const c of cameras)assert.ok(c.url.startsWith('https://'));});

// Run the complete browser module and its actual play/stop/filter handlers.
function browserHarness(){
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
 const window={addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:event=>events[event.type]?.(event)};
 vm.runInNewContext(fs.readFileSync(require.resolve('./webcam-directory.js'),'utf8'),{document,window,Event:class{constructor(type){this.type=type;}},Date:{parse:Date.parse,now:()=>Date.parse('2026-10-18T12:00:00Z')}});
 const find=(predicate,node=section)=>predicate(node)?node:node.children.map(child=>find(predicate,child)).find(Boolean);
 return {document,events,documentEvents,get section(){return section;},find};
}
test('leaving webcam tab removes the real player, preserves filters and restores click-to-play',()=>{
 const h=browserHarness();
 h.find(n=>n.className==='webcam-filters').children.find(n=>n.textContent==='Video').onclick();
 const play=h.find(n=>n.tagName==='button'&&n.textContent==='Watch camera');
 assert.equal(h.find(n=>n.tagName==='iframe'),undefined,'no third-party player before a click');
 play.onclick();const frame=h.find(n=>n.tagName==='iframe');assert.match(frame.src,/youtube-nocookie/);
 h.section.hidden=true;h.events['fjord:sections-changed']();
 assert.equal(h.find(n=>n.tagName==='iframe'),undefined);assert.equal(frame.parentElement,null);
 assert.equal(h.find(n=>n.textContent==='Video'&&n.attributes['aria-pressed']==='true').textContent,'Video');
 assert.equal(play.textContent,'Watch camera');assert.ok(h.find(n=>n.tagName==='img'&&n.alt==='Geiranger · Hotel Union'));
 h.section.hidden=false;h.events['fjord:sections-changed']();assert.equal(h.find(n=>n.tagName==='iframe'),undefined,'returning must not restart autoplay');
 play.onclick();assert.ok(h.find(n=>n.tagName==='iframe'),'explicit click starts the camera again');
});
test('backgrounding the browser stops a camera without changing its selected section',()=>{
 const h=browserHarness();h.find(n=>n.tagName==='button'&&n.textContent==='Watch camera').onclick();
 h.document.hidden=true;h.documentEvents.visibilitychange();assert.equal(h.find(n=>n.tagName==='iframe'),undefined);
 h.document.hidden=false;h.documentEvents.visibilitychange();assert.equal(h.find(n=>n.tagName==='iframe'),undefined);
});
