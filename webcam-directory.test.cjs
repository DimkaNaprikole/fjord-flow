const {test}=require('node:test'),assert=require('node:assert/strict');
const {recent,playable,select}=require('./webcam-directory.js');
const data=require('./world-webcams-data.json');
test('world catalogue contains distinct reviewed embeds with official sources',()=>{
 assert.equal(data.cameras.length,15);assert.equal(new Set(data.cameras.map(c=>c.youtube)).size,15);assert.equal(select(data.cameras).length,15);
 for(const camera of data.cameras){assert.equal(new URL(camera.url).protocol,'https:');assert.ok(camera.evidence);assert.ok(!camera.operator.includes('EarthCam'));}
 assert.equal(playable({youtube:'bad',verification:'embedded-visual'}),false);assert.equal(playable({...data.cameras[0],enabled:false}),false);assert.equal(recent(data.cameras[0],Date.parse('2026-10-18')),false);
});
async function harness(){
 const vm=require('node:vm'),fs=require('node:fs');let section,tick,now=Date.parse('2026-10-19T12:00:00Z');const events={},docEvents={},instances=[];
 class Element{constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.hidden=false;}append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}replaceChildren(...nodes){this.children=[];this.append(...nodes);}after(node){section=node;}closest(){return null;}contains(){return false;}querySelector(selector){const match=n=>selector[0]==='.'?n.className===selector.slice(1):n.tagName===selector;const find=n=>match(n)?n:n.children.map(find).find(Boolean);return this.children.map(find).find(Boolean)||null;}getBoundingClientRect(){return this.hidden?{top:0,bottom:0}:{top:100,bottom:300};}}
 const anchor=new Element('section'),nav=new Element('nav');const document={hidden:false,documentElement:{lang:'en'},createElement:t=>new Element(t),getElementById:()=>anchor,querySelector:()=>nav,addEventListener:(name,fn)=>docEvents[name]=fn};
 const YT={Player:function(frame,options){instances.push({frame,events:options.events});this.destroy=()=>{};}};
 const window={loadYouTubeAPI:async()=>YT,addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:e=>events[e.type]?.()};
 vm.runInNewContext(fs.readFileSync(require.resolve('./webcam-directory.js'),'utf8'),{window,document,innerHeight:800,location:{origin:'https://example.test'},setInterval:fn=>{tick=fn;return 1;},encodeURIComponent,fetch:async()=>({ok:true,json:async()=>data}),Date:class extends Date{static now(){return now;}},Event:class{constructor(type){this.type=type;}}});await window.FjordWebcams.ready;
 const all=(tag,node=section)=>[...(node.tagName===tag?[node]:[]),...node.children.flatMap(n=>all(tag,n))];return {section,document,docEvents,events,all,instances,tick:()=>tick(),advance:ms=>{now+=ms;}};
}
test('all cameras have permanent cards without search, filters, source buttons or player controls',async()=>{
 const h=await harness();assert.equal(h.all('article').length,15);assert.equal(h.all('iframe').length,15);for(const tag of ['input','select','button','a'])assert.equal(h.all(tag).length,0);
 for(const frame of h.all('iframe')){const params=new URL(frame.src).searchParams;for(const [key,value]of Object.entries({autoplay:'1',mute:'1',controls:'0',disablekb:'1',fs:'0',iv_load_policy:'3',enablejsapi:'1'}))assert.equal(params.get(key),value);}
});
test('background tab and hidden section unload video; returning restores visible players',async()=>{
 const h=await harness();h.document.hidden=true;h.docEvents.visibilitychange();assert.equal(h.all('iframe').length,0);h.document.hidden=false;h.docEvents.visibilitychange();assert.equal(h.all('iframe').length,15);
 h.section.hidden=true;h.events['fjord:sections-changed']();assert.equal(h.all('iframe').length,0);h.section.hidden=false;h.events['fjord:sections-changed']();assert.equal(h.all('iframe').length,15);
});
test('periodic health check never rotates cards or rebuilds healthy players',async()=>{
 const h=await harness(),cards=h.all('article'),frames=h.all('iframe');for(let i=0;i<10;i++){h.advance(30000);h.tick();}assert.deepEqual(h.all('article'),cards);assert.deepEqual(h.all('iframe'),frames);
});
test('an errored camera alone is hidden and retried after cooldown without restarting its neighbours',async()=>{
 const h=await harness(),cards=h.all('article'),frames=h.all('iframe');h.instances[0].events.onError({data:100});assert.equal(cards[0].hidden,true);assert.equal(h.all('iframe').length,14);assert.equal(h.all('iframe')[0],frames[1]);
 h.advance(299000);h.tick();assert.equal(cards[0].hidden,true);h.advance(2000);h.tick();assert.equal(cards[0].hidden,false);assert.equal(h.all('iframe').length,15);assert.equal(h.all('iframe')[1],frames[1]);
});
