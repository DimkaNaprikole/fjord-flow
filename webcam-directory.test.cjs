const {test}=require('node:test'),assert=require('node:assert/strict');
const {recent,playable,select}=require('./webcam-directory.js');
const data=require('./world-webcams-data.json');
test('only reviewed embeddable world cameras are selected and checks expire',()=>{
 const now=Date.parse('2026-10-19T12:00:00Z');assert.equal(select(data.cameras,now).length,2);assert.equal(select(data.cameras,now+8*86400000).length,0);
 assert.equal(playable({verification:'embedded-visual',youtube:'bad'}),false);assert.equal(playable({...data.cameras[0],enabled:false}),false);
 assert.equal(recent(data.cameras[0],Date.parse('2026-10-18')),false);
 assert.ok(select(data.cameras,now).every(c=>!c.operator.includes('EarthCam')));
});
async function harness(){
 const vm=require('node:vm'),fs=require('node:fs');let section;const events={},docEvents={};
 class Element{constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.hidden=false;}append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}replaceChildren(...nodes){this.children=[];this.append(...nodes);}after(node){section=node;}closest(){return null;}getBoundingClientRect(){return {top:100,bottom:300};}}
 const anchor=new Element('section'),nav=new Element('nav');const document={hidden:false,documentElement:{lang:'en'},createElement:t=>new Element(t),getElementById:()=>anchor,querySelector:()=>nav,addEventListener:(name,fn)=>docEvents[name]=fn};
 const window={addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:e=>events[e.type]?.()};
 vm.runInNewContext(fs.readFileSync(require.resolve('./webcam-directory.js'),'utf8'),{window,document,innerHeight:800,fetch:async()=>({ok:true,json:async()=>data}),Date:class extends Date{static now(){return Date.parse('2026-10-19T12:00:00Z');}},Event:class{constructor(type){this.type=type;}}});await window.FjordWebcams.ready;
 const all=(tag,node=section)=>[...(node.tagName===tag?[node]:[]),...node.children.flatMap(n=>all(tag,n))];return {section,document,docEvents,events,all};
}
test('world-only UI has actual players and no search, filters, or tourist selector',async()=>{
 const h=await harness();assert.equal(h.all('article').length,2);assert.equal(h.all('iframe').length,2);assert.equal(h.all('input').length,0);assert.equal(h.all('select').length,0);assert.equal(h.all('button').length,0);assert.equal(h.all('a').length,0);
 for(const frame of h.all('iframe')){assert.match(frame.src,/youtube-nocookie\.com\/embed\/[\w-]{11}\?autoplay=1&mute=1/);assert.doesNotMatch(frame.allow,/fullscreen/);const params=new URL(frame.src).searchParams;for(const [key,value]of Object.entries({controls:'0',disablekb:'1',fs:'0',iv_load_policy:'3',mute:'1'}))assert.equal(params.get(key),value);}
});
test('hidden tab or section unloads video, returning restores only visible players',async()=>{
 const h=await harness();h.document.hidden=true;h.docEvents.visibilitychange();assert.equal(h.all('iframe').length,0);h.document.hidden=false;h.docEvents.visibilitychange();assert.equal(h.all('iframe').length,2);
 h.section.hidden=true;h.events['fjord:sections-changed']();assert.equal(h.all('iframe').length,0);h.section.hidden=false;h.events['fjord:sections-changed']();assert.equal(h.all('iframe').length,2);
});
