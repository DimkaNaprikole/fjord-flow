import test from 'node:test';
import {horizontalRoute,walkingSpeed,chooseDifferentPlay,clearHorizontalGoals,horizontalGoals} from './osiris/behavior-policy.mjs';
import {PAW_CONTACT} from './osiris/button-choreography.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fitPresenceClip,ambientCanRun,mountSitePresence} from './osiris/site-presence.mjs';

const metadata=JSON.parse(readFileSync(new URL('./media/osiris-life/metadata.json',import.meta.url)));
const flush=()=>new Promise(resolve=>setImmediate(resolve));

class Element extends EventTarget {
 constructor(tag='div',classes=''){
  super();this.tagName=tag.toUpperCase();this.className=classes;this.children=[];this.dataset={};this.style={};
  this.style.setProperty=function(name,value){this[name]=value;};
  this.style.removeProperty=function(name){delete this[name];};
  this.attrs={};this.hidden=false;this.isConnected=true;
  this.classList={
   contains:name=>this.className.split(/\s+/).includes(name),
   add:name=>{if(!this.classList.contains(name))this.className+=` ${name}`;},
   remove:name=>{this.className=this.className.split(/\s+/).filter(value=>value!==name).join(' ');},
  };
 }
 append(...nodes){for(const node of nodes){node.remove();node.parentNode=this;this.children.push(node);}}
 after(node){this.parentNode.insertBefore(node,this.parentNode.children[this.parentNode.children.indexOf(this)+1]);}
 insertBefore(node,before){node.remove();node.parentNode=this;const i=this.children.indexOf(before);this.children.splice(i<0?this.children.length:i,0,node);}
 remove(){if(this.parentNode){const i=this.parentNode.children.indexOf(this);this.parentNode.children.splice(i,1);this.parentNode=null;}}
 replaceChildren(...nodes){for(const child of [...this.children])child.remove();this.append(...nodes);}
 add(node){this.append(node);}
 setAttribute(name,value){this.attrs[name]=value;if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=value;}
 getAttribute(name){return this.attrs[name];}
 removeAttribute(name){delete this.attrs[name];}
 contains(node){return this===node||this.children.some(child=>child.contains(node));}
 querySelector(selector){return this.children.find(node=>node.classList.contains(selector.slice(1)))||this.children.map(node=>node.querySelector(selector)).find(Boolean)||null;}
 matches(selector){return selector===':focus-visible'?Boolean(this.focusVisible):false;}
 closest(){return this.hidden||this.tagName==='DIALOG'&&!this.open?this:this.parentNode?.closest()||null;}
 getClientRects(){return this.hidden?[]:[this.getBoundingClientRect()];}
 setPointerCapture(id){this.captured=id;}
 releasePointerCapture(id){if(this.captured===id)this.captured=null;}
 getBoundingClientRect(){
  if(this.rect)return {...this.rect};
  const width=this.parentNode?.classList.contains('fjord-ai-portrait')?160:210;
  const isLaunch=this.classList.contains('fjord-helper-launch'),height=isLaunch?162:142;
  const parent=this.parentNode?.classList.contains('fjord-helper-launch')?this.parentNode.getBoundingClientRect():null;
  const left=isLaunch?160+(parseFloat(this.style['--osiris-roam-x'])||0):parent?.left||0;
  const top=isLaunch?550+(parseFloat(this.style['--osiris-roam-y'])||0):parent?.top||0;
  return {width,height,left,top,right:left+width,bottom:top+height};
 }
 emit(type,props={}){const event=new Event(type,{cancelable:true});for(const [key,value]of Object.entries(props))Object.defineProperty(event,key,{value});this.dispatchEvent(event);if(type==='click'&&!event.defaultPrevented)this.onclick?.(event);return event;}
 get firstChild(){return this.children[0];}
}
class Video extends Element {
 constructor(){super('video');this.readyState=0;this.videoWidth=4;this.videoHeight=1;this.currentTime=0;this.duration=5;this.frames=new Map();this.serial=0;this.paused=true;}
 load(){this.readyState=0;this.currentTime=0;this.ended=false;}
 ready(){this.readyState=2;this.emit('loadeddata');}
 pause(){this.paused=true;}
 async play(){this.paused=false;this.playCount=(this.playCount||0)+1;}
 requestVideoFrameCallback(fn){const key=++this.serial;this.frames.set(key,fn);return key;}
 cancelVideoFrameCallback(key){this.frames.delete(key);}
 frame(time){this.currentTime=time;const [key,fn]=this.frames.entries().next().value||[];if(fn){this.frames.delete(key);fn();}}
}
function setup(t,{fetcher,random=()=>.99,preferences,trackPaint=false,virtualTimers=false}={}){
 const saved=new Map(),set=(name,value)=>{saved.set(name,globalThis[name]);globalThis[name]=value;};
 const body=new Element(),launch=new Element('button','fjord-helper-launch osiris-launch');
 const pet=new Element('span','fjord-ai-pet osiris-pet'),original=new Element('img','osiris-avatar');
 const dialog=new Element('dialog'),about=new Element('details','fjord-ai-about'),portrait=new Element('div','fjord-ai-portrait');
 const duplicate=new Element('span','fjord-ai-pet'),window=new Element(),document=new Element(),reduced=new Element();
 reduced.matches=false;
 if(preferences)window.OsirisSettings={preferences};
 const videos=[],canvases=[],observers=[],resizers=[],frames=new Map(),requests=[];
 let clock=0,serial=0;const timers=new Map();
 pet.dataset.state='idle';pet.append(original);launch.append(pet);portrait.append(duplicate);dialog.append(portrait,about);body.append(launch,dialog);
 const originalClick=()=>{launch.chatClicks=(launch.chatClicks||0)+1;};launch.onclick=originalClick;
 document.body=body;document.readyState='complete';document.hidden=false;document.activeElement=null;document.documentElement={lang:'ru'};
 document.obstacles=[];document.queryCalls=0;
 document.querySelectorAll=()=>{document.queryCalls++;return [launch,...document.obstacles];};
 document.querySelector=selector=>selector.includes('osiris-launch')?launch:null;
 document.getElementById=id=>id==='fjordHelper'?dialog:null;
 document.createElement=tag=>{
  if(tag==='video'){const video=new Video();videos.push(video);return video;}
  const el=new Element(tag);
  if(tag==='canvas'){
   canvases.push(el);const context={draws:[],save(){},restore(){},setTransform(){},clearRect(){if(trackPaint)this.draws=[];},drawImage(){if(trackPaint)this.draws.push({alpha:this.globalAlpha,operation:this.globalCompositeOperation});},putImageData(){},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)};}};
   el.getContext=type=>type==='webgl'?null:context;
  }
  return el;
 };
 const Observer=class {constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 set('document',document);set('window',window);set('matchMedia',()=>reduced);
 set('innerWidth',1280);
 set('innerHeight',800);
 set('Option',class extends Element {constructor(text,value){super('option');this.textContent=text;this.value=value;}});
 set('MutationObserver',Observer);
 set('ResizeObserver',class{constructor(callback){this.callback=callback;resizers.push(this);}observe(){}disconnect(){this.disconnected=true;}});
 set('requestAnimationFrame',callback=>{const key=++serial;frames.set(key,callback);return key;});
 set('cancelAnimationFrame',key=>frames.delete(key));
 set('performance',{now:()=>clock});
 if(virtualTimers){set('setTimeout',(fn,ms)=>{const id=++serial;timers.set(id,{fn,due:clock+ms});return id;});set('clearTimeout',id=>timers.delete(id));}
 set('fetch',async(url,options)=>{requests.push({url,options});return fetcher?fetcher(url,options):{ok:true,json:async()=>metadata};});
 let api;
 t.after(()=>{api?.destroy();for(const [name,value]of saved){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}});
 const update=()=>{for(const observer of [...observers])if(!observer.disconnected)observer.callback();};
 const step=async(ms=100)=>{clock+=ms;const pending=[...frames];frames.clear();for(const [,fn]of pending)fn(clock);for(const [id,timer]of [...timers])if(timer.due<=clock){timers.delete(id);timer.fn();}await flush();};
 const mount=async()=>{api=await mountSitePresence({launch,dialog,pet,random,mediaUrl:new URL('./media/osiris-life/metadata.json',import.meta.url)});return api;};
 return {mount,launch,pet,original,dialog,about,portrait,duplicate,document,window,reduced,videos,canvases,observers,resizers,requests,frames,step,update,originalClick};
}

async function contactFixture(f,api,{onContact=()=>true,signal}={}){
 f.pet.querySelector('.osiris-life-walk').emit('load');
 const ground=api.snapshot().ground,stage=f.pet.getBoundingClientRect();
 const fit=fitPresenceClip({id:'cursor-button',width:854,height:480,anchorFraction:.5},stage.width,stage.height);
 const pawY=ground.y-fit.ground.y+fit.top+PAW_CONTACT.y*fit.height;
 const target=new Element('button');
 target.rect={left:540,right:660,top:pawY-3,bottom:pawY+37,width:120,height:40};
 f.document.body.append(target);f.document.obstacles.push(target);
 const pending=api.interactWith(target,{onContact,signal});await flush();
 for(let i=0;i<200&&!api.snapshot().loading&&api.snapshot().interaction;i++)await f.step(100);
 assert.equal(api.snapshot().loading,true,'native gesture loads after a same-lane walk');
 const video=f.videos.find(v=>String(v.src).includes('cursor-button-packed.mp4'));
 assert.ok(video);video.duration=169/24;video.ready();await flush();
 assert.equal(api.snapshot().interaction,'reach');return {pending,target,video};
}

test('side-on walking never becomes diagonal climbing or an obstacle detour',()=>{
 const opts={start:{x:100,y:400},target:{x:600,y:400},footprint:{width:100,height:70},viewport:{width:1000,height:700}};
 assert.deepEqual(horizontalRoute(opts),[{x:600,y:400}]);
 assert.equal(horizontalRoute({...opts,target:{x:600,y:300}}),null);
 assert.equal(horizontalRoute({...opts,obstacles:[{left:300,right:350,top:350,bottom:440}]}),null);
 assert.deepEqual(horizontalRoute({...opts,obstacles:[{left:300,right:350,top:500,bottom:540}]}),[{x:600,y:400}]);
});
test('speed follows one common visual scale and manual play avoids the last three games',()=>{
 assert.equal(walkingSpeed(25,25),85);assert.equal(walkingSpeed(20,25),68);
 assert.equal(chooseDifferentPlay(['yarn','mouse','paper','tail'],['yarn','mouse','paper'],()=>0),'tail');
 assert.notEqual(chooseDifferentPlay(['yarn','mouse'],['yarn','mouse'],()=>.99),'mouse');
});
test('legacy clips retain the common calibrated head scale',()=>{
 for(const [w,h]of [[280,180],[230,150]]){
  const scales=metadata.clips.filter(c=>!['cloud-perch','run-short','descent-short'].includes(c.id)).map(c=>fitPresenceClip(c,w,h).headPixels);
  assert.ok(scales.every(x=>Math.abs(x-scales[0])<1e-8));
 }
});
test('horizontal native walk stays on the support line and abort never produces a click',async t=>{
 const f=setup(t),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 const before=api.snapshot().walkStart;
 assert.equal(await api.moveTo({x:800,y:before.y-60},{reason:'ambient'}),false);
 const ctl=new AbortController(),p=api.moveTo({x:800,y:before.y},{signal:ctl.signal});
 for(let i=0;i<12;i++){await f.step(100);const s=api.snapshot();assert.equal(s.walking,true);assert.ok(Math.abs(s.position.y-before.y)<.02);assert.ok(s.position.left>=7.99);}
 ctl.abort();assert.equal(await p,false);assert.equal(api.snapshot().travelling,false);assert.equal(f.launch.chatClicks,undefined);
});
test('native decoded contact commits once; wall clock and early frames cannot click',async t=>{
 const f=setup(t),api=await f.mount();let n=0;
 const {pending,video}=await contactFixture(f,api,{onContact:()=>{n++;return true;}});
 for(let i=0;i<15;i++)await f.step(100);assert.equal(n,0);
 video.frame(4.49);assert.equal(n,0);video.frame(4.5);assert.equal(await pending,true);assert.equal(n,1);
 video.frame(4.7);video.frame(5);assert.equal(n,1);
});
for(const action of ['abort','settings','resize'])test(`${action} before paw contact suppresses stale clicks`,async t=>{
 const f=setup(t),api=await f.mount(),ctl=new AbortController();let n=0;
 const {pending,video}=await contactFixture(f,api,{signal:ctl.signal,onContact:()=>{n++;return true;}});
 if(action==='abort')ctl.abort();
 if(action==='settings')api.setPreferences({siteActions:false});
 if(action==='resize'){globalThis.innerWidth=1100;f.window.emit('resize');}
 assert.equal(await pending,false);video.frame(4.5);assert.equal(n,0);assert.equal(api.snapshot().interaction,null);
});
test('reduced motion/animations disabled refuse an animated click',async t=>{
 const f=setup(t),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 const target=new Element('button');target.rect={left:400,right:500,top:600,bottom:640,width:100,height:40};let n=0;
 api.setPreferences({animations:false});assert.equal(await api.interactWith(target,{onContact:()=>++n}),false);
 api.setPreferences({animations:true});f.reduced.matches=true;f.reduced.emit('change');assert.equal(await api.interactWith(target,{onContact:()=>++n}),false);assert.equal(n,0);
});
test('drag interrupts a route and keeps the whole visible cat inside the viewport',async t=>{
 const f=setup(t),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 const pending=api.moveTo({x:800,y:api.snapshot().walkStart.y});await f.step(100);const box=api.snapshot().position;
 f.launch.emit('pointerdown',{pointerId:1,clientX:box.x,clientY:box.y,button:0});
 f.window.emit('pointermove',{pointerId:1,clientX:2000,clientY:-100});
 assert.equal(await pending,false);assert.equal(api.snapshot().dragging,true);
 const p=api.snapshot().position;assert.ok(p.left>=7.99&&p.right<=innerWidth-7.99&&p.top>=7.99&&p.bottom<=innerHeight-7.99);
 f.window.emit('pointerup',{pointerId:1});assert.equal(api.snapshot().dragging,false);assert.equal(f.launch.chatClicks,undefined);
});
test('a completed game schedules a real horizontal walk after settling',async t=>{
 const f=setup(t,{random:()=>.5}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 api.command('mouse');f.videos[0].ready();await flush();f.videos[0].frame(8);f.videos[0].ended=true;f.videos[0].emit('ended');
 assert.deepEqual(api.snapshot().playHistory,['mouse']);
 for(let i=0;i<20&&!api.snapshot().travelling;i++)await f.step(100);
 assert.equal(api.snapshot().travelling,true);await f.step(100);assert.equal(api.snapshot().walking,true);
 const y=api.snapshot().position.y;await f.step(100);assert.ok(Math.abs(api.snapshot().position.y-y)<.02);
});

test('blocked far random goals still permit a bounded walk inside the clear current segment',()=>{
 const start={x:200,y:400},viewport={width:1000,height:700},footprint={width:100,height:70};
 const obstacles=[{left:300,right:360,top:350,bottom:450}];
 assert.ok(horizontalGoals(start,viewport,()=>.5).every(target=>!horizontalRoute({start,target,viewport,footprint,obstacles})));
 const goals=clearHorizontalGoals({start,viewport,footprint,obstacles,random:()=>.5});
 assert.ok(goals.length>0);
 for(const target of goals){assert.equal(target.y,start.y);assert.ok(target.x>=58&&target.x<242);assert.ok(Math.abs(target.x-start.x)<=250);assert.ok(horizontalRoute({start,target,viewport,footprint,obstacles}));}
});

test('game-ending overlap escapes to the nearest clear point without crossing a new obstacle',()=>{
 const start={x:500,y:400},viewport={width:1000,height:700},footprint={width:100,height:70};
 const obstacles=[{left:480,right:540,top:385,bottom:440},{left:650,right:700,top:385,bottom:440}];
 const goals=clearHorizontalGoals({start,viewport,footprint,obstacles,random:()=>1});
 assert.ok(goals.length);assert.equal(goals[0].escape,true);assert.ok(goals[0].x<422,'closest exit is to the left');
 assert.ok(goals.every(target=>target.x<592),'never pass the second obstacle to reach another clear interval');
 for(const target of goals)assert.ok(horizontalRoute({start,target,viewport,footprint,obstacles}));
 assert.deepEqual(clearHorizontalGoals({start,viewport,footprint,obstacles:[{left:0,right:1000,top:300,bottom:500}]}),[]);
});

test('scheduler starts a near safe walk when all old screen-fraction destinations are blocked',async t=>{
 const f=setup(t,{random:()=>.5}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 api.command('mouse');f.videos[0].ready();await flush();f.videos[0].frame(8);f.videos[0].ended=true;f.videos[0].emit('ended');
 const here=api.snapshot().walkStart;
 for(const x of [.18,.5,.82]){const o=new Element('button');o.rect={left:innerWidth*x-10,right:innerWidth*x+10,top:here.y-20,bottom:here.y+20,width:20,height:40};f.document.body.append(o);f.document.obstacles.push(o);}
 for(let i=0;i<30&&!api.snapshot().travelling;i++)await f.step(100);
 assert.equal(api.snapshot().travelling,true);assert.ok(['overlap-escape','clear-horizontal-segment'].includes(api.snapshot().lastRoamPolicy));
 const target=api.snapshot().target;assert.ok(Math.abs(target.x-here.x)<=300);
 assert.equal(target.y,here.y);await f.step(100);assert.equal(api.snapshot().walking,true);assert.equal(f.launch.chatClicks,undefined);
});

for(const edge of ['left','right'])test(`wide lying clip is reserved through walk and restored safely near the ${edge} edge`,async t=>{
 const f=setup(t),api=await f.mount();globalThis.innerWidth=815;globalThis.innerHeight=884;f.window.emit('resize');
 f.pet.querySelector('.osiris-life-walk').emit('load');api.command('lie-down');f.videos[0].ready();await flush();
 f.videos[0].frame(7);f.videos[0].ended=true;f.videos[0].emit('ended');
 const start=api.snapshot().walkStart,p=api.moveTo({x:edge==='left'?8:807,y:start.y});
 assert.equal(api.snapshot().travelling,true);
 for(let i=0;i<200&&api.snapshot().travelling;i++){
  await f.step(100);const b=api.snapshot().position;
  assert.ok(b.left>=7.98&&b.right<=807.02&&b.top>=7.98&&b.bottom<=876.02,JSON.stringify(b));
 }
 assert.equal(await p,true);const held=api.snapshot().position;
 assert.equal(api.snapshot().walking,false);assert.ok(held.left>=7.98&&held.right<=807.02,JSON.stringify(held));
 const oldOffset=api.snapshot().offset;await f.step(100);assert.equal(api.snapshot().offset,oldOffset,'held frame does not drift laterally');
 // A wider next action must fit its whole phase-union, not only frame zero.
 api.command('feather');const incoming=f.videos.find(v=>String(v.src).includes('feather-packed.mp4'));incoming.ready();await flush();
 const b=api.snapshot().position;assert.ok(b.left>=7.98&&b.right<=807.02,JSON.stringify(b));
});

test('ambient requires a closed chat and honours voice, visibility and motion preferences',()=>{
 assert.equal(ambientCanRun(),true);
 for(const flags of [{chatOpen:true},{voice:true},{state:'listening'},{state:'thinking'},{state:'speaking'},
  {typing:true},{paused:true},{hidden:true},{reduced:true},{animations:false}])assert.equal(ambientCanRun(flags),false);
});

for(const compact of [false,true])test(`opening ${compact?'compact':'expanded'} chat cancels ambient playback; closing resumes it`,async t=>{
 const f=setup(t),api=await f.mount();
 for(let i=0;i<30&&!api.snapshot().loading;i++)await f.step(250);
 const incoming=f.videos.find(v=>v.src);
 assert.ok(incoming);assert.equal(api.snapshot().loading,true);
 f.dialog.open=true;if(compact)f.dialog.classList.add('osiris-compact');f.update();
 assert.equal(api.snapshot().ambient,false);assert.equal(api.snapshot().loading,false);
 incoming.ready();await flush();assert.equal(incoming.playCount,undefined,'late load cannot play underneath chat');
 for(let i=0;i<20;i++)await f.step(250);
 assert.ok(f.videos.every(v=>v.paused));
 f.dialog.open=false;f.update();
 for(let i=0;i<20&&!api.snapshot().loading;i++)await f.step(250);
 assert.equal(api.snapshot().ambient,true);assert.equal(api.snapshot().loading,true);
 assert.equal(f.launch.chatClicks,undefined);
});

test('opening compact chat cancels an ambient walk without cancelling an explicit action',async t=>{
 const f=setup(t),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 const start=api.snapshot().walkStart,pending=api.moveTo({x:start.x+100,y:start.y},{reason:'ambient'});
 await f.step(100);assert.equal(api.snapshot().walking,true);
 f.dialog.open=true;f.dialog.classList.add('osiris-compact');f.update();
 assert.equal(await pending,false);assert.equal(api.snapshot().walking,false);
 assert.equal(await api.moveTo({x:start.x+100,y:start.y},{reason:'ambient'}),false);
 const ctl=new AbortController(),explicit=api.moveTo({x:start.x+100,y:start.y},{signal:ctl.signal});
 assert.equal(api.snapshot().travelling,true,'explicit action remains independently authorized');
 ctl.abort();assert.equal(await explicit,false);
});

test('Escape closes the chat without leaving ambient motion permanently paused',async t=>{
 const f=setup(t),api=await f.mount();
 f.dialog.open=true;f.update();f.document.emit('keydown',{key:'Escape'});
 f.dialog.open=false;f.update();
 assert.equal(api.snapshot().paused,false);assert.equal(api.snapshot().ambient,true);
 for(let i=0;i<30&&!api.snapshot().loading;i++)await f.step(250);
 assert.equal(api.snapshot().loading,true);
 api.setPaused(true);f.document.emit('keydown',{key:'Escape'});
 assert.equal(api.snapshot().paused,true,'Escape must not undo an explicitly selected pause');
});

test('closed-chat scene scheduler varies one-shots and uses a separate cloud before its native hop',async t=>{
 const ids=['run-short','descent-short','window-hop-cloud'];
 for(const id of ids)assert.ok(metadata.clips.some(c=>c.id===id),`missing reviewed ${id}`);
 const f=setup(t,{random:()=>.5,virtualTimers:true}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 let elapsed=0;const seen=new Set(),phases=new Set();
 for(let i=0;i<1800;i++){
  await f.step(100);elapsed+=100;
  const cloud=f.document.body.children.find(c=>c.className==='osiris-cloud-target');if(cloud)cloud.emit('load');
  if(f.launch.dataset.osirisCloudPhase)phases.add(f.launch.dataset.osirisCloudPhase);
  const playing=f.videos.find(v=>!v.paused);
  if(api.snapshot().loading){
   const loading=f.videos.find(v=>v.src&&v.readyState===0);loading?.ready();await flush();
  }
  if(playing){
   const source=metadata.clips.find(c=>String(playing.src).endsWith(c.packed));
   assert.ok(source);playing.duration=source.duration;
   const next=playing.currentTime+.1;playing.frame(Math.min(next,source.duration));
   if(ids.includes(source.id)){
    seen.add(source.id);assert.equal(api.snapshot().walking,false,'one-shot never gets a second CSS route');
    assert.notEqual(playing.loop,true);
   }
   if(next>=source.duration){playing.ended=true;playing.emit('ended');}
  }
 }
 assert.deepEqual([...seen].sort(),[...ids].sort());
 assert.ok(!api.snapshot().activityHistory.some(a=>a.id==='cloud-perch'),'the rejected pop-in is not automatic');
 for(const phase of ['cloud','approach','jump','hold'])assert.ok(phases.has(phase),phase);
 const state=api.snapshot();assert.ok(state.roamCount>=3);assert.ok(new Set(state.activityHistory.map(a=>a.id)).size>=7);
 for(const id of ids){const starts=state.activityHistory.filter(a=>a.id===id);for(let i=1;i<starts.length;i++)assert.ok(starts[i].time-starts[i-1].time>=45000);}
 assert.equal(f.launch.chatClicks,undefined);
});

async function advanceAmbient(f,api,{loadCloud=false}={}){
 await f.step(100);
 const cloud=f.document.body.children.find(c=>c.className==='osiris-cloud-target');
 if(loadCloud)cloud?.emit('load');
 const loading=f.videos.find(v=>v.src&&v.readyState===0);
 if(api.snapshot().loading&&loading){loading.ready();await flush();}
 for(const playing of f.videos.filter(v=>!v.paused)){
  const source=metadata.clips.find(c=>String(playing.src).endsWith(c.packed));
  playing.duration=source.duration;
  const next=playing.currentTime+.1;playing.frame(Math.min(next,source.duration));
  if(next>=source.duration){playing.ended=true;playing.emit('ended');}
 }
 return cloud;
}

test('a stalled cloud image times out and ordinary activity resumes without a late hop',async t=>{
 const f=setup(t,{random:()=>.5,virtualTimers:true}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 let cloud;
 for(let i=0;i<500&&!cloud;i++)cloud=await advanceAmbient(f,api);
 assert.ok(cloud,'a safe cloud attempt starts');
 const before=api.snapshot().activityHistory.length;
 for(let i=0;i<180;i++)await advanceAmbient(f,api);
 assert.equal(cloud.parentNode,null);assert.equal(f.launch.dataset.osirisCloudPhase,undefined);
 assert.ok(api.snapshot().activityHistory.length>before,'normal scheduler is not held by the failed image');
 cloud.emit('load');await flush();
 assert.ok(!f.videos.some(v=>String(v.src).includes('window-hop-cloud')),'stale load cannot start a hop');
 assert.equal(f.launch.chatClicks,undefined);
});

for(const interruption of ['chat','resize','obstacle'])test(`cloud approach cancels safely on ${interruption} before a native hop loads`,async t=>{
 const f=setup(t,{random:()=>.5,virtualTimers:true}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 let cloud,visibleSteps=0;
 for(let i=0;i<500&&f.launch.dataset.osirisCloudPhase!=='approach';i++){
  cloud=await advanceAmbient(f,api,{loadCloud:true})||cloud;
  if(cloud?.style.opacity==='1')visibleSteps++;
 }
 assert.equal(f.launch.dataset.osirisCloudPhase,'approach');assert.ok(visibleSteps>=5,'cloud is visibly separate before walking');
 assert.equal(api.snapshot().travelling,true);
 if(interruption==='chat'){f.dialog.open=true;f.update();}
 if(interruption==='resize'){globalThis.innerWidth=1200;f.window.emit('resize');}
 if(interruption==='obstacle'){
  const obstacle=new Element('button');
  const left=parseFloat(cloud.style.left),top=parseFloat(cloud.style.top),width=parseFloat(cloud.style.width),height=parseFloat(cloud.style.height);
  obstacle.rect={left,top,right:left+width,bottom:top+height,width,height};f.document.obstacles.push(obstacle);
  await f.step(1000);
 }
 await flush();assert.equal(cloud.parentNode,null);assert.equal(api.snapshot().travelling,false);
 cloud.emit('load');for(let i=0;i<10;i++)await f.step(100);
 assert.equal(f.launch.dataset.osirisCloudPhase,undefined);
 assert.ok(!f.videos.some(v=>String(v.src).includes('window-hop-cloud')),'cancelled approach cannot load a delayed native jump');
 assert.equal(f.launch.chatClicks,undefined);
});

test('native ended flush completes the hop even without a final video-frame callback',async t=>{
 const f=setup(t,{random:()=>.5,virtualTimers:true}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 for(let i=0;i<600&&f.launch.dataset.osirisCloudPhase!=='jump';i++)await advanceAmbient(f,api,{loadCloud:true});
 assert.equal(f.launch.dataset.osirisCloudPhase,'jump');
 const video=f.videos.find(v=>String(v.src).includes('window-hop-cloud'));
 video.frame(1);video.currentTime=1.9;video.ended=true;video.emit('ended');await flush();
 assert.equal(f.launch.dataset.osirisCloudPhase,'hold');assert.equal(api.snapshot().held,true);
});

for(const side of ['left','right'])test(`the first cloud tries the opposite native direction when the cat faces the ${side} edge`,async t=>{
 const f=setup(t,{random:()=>.5,virtualTimers:true}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 const pending=api.moveTo({x:side==='left'?110:1170,y:api.snapshot().walkStart.y});
 for(let i=0;i<200&&api.snapshot().travelling;i++)await f.step(100);
 assert.equal(await pending,true);
 const ground=api.snapshot().ground;assert.ok(side==='left'?ground.x<150:ground.x>1130,'cat is near the edge and facing it');
 api.command('blink');const blink=f.videos.find(v=>v.src&&v.readyState===0);blink.ready();await flush();
 blink.frame(5);blink.ended=true;blink.emit('ended');await flush();
 await f.step(100);
 const cloud=f.document.body.children.find(c=>c.className==='osiris-cloud-target');
 assert.ok(cloud,`first safe attempt succeeds without waiting for a different ordinary route: ${JSON.stringify(api.snapshot())}`);
 assert.ok(side==='left'?parseFloat(cloud.style.left)>ground.x:parseFloat(cloud.style.left)+parseFloat(cloud.style.width)<ground.x,'separate cloud is away from the blocked edge');
 cloud.emit('load');await flush();
 for(let i=0;i<6;i++)await f.step(100);
 assert.equal(f.launch.dataset.osirisCloudPhase,'approach');assert.ok(side==='left'?api.snapshot().target.x>ground.x:api.snapshot().target.x<ground.x);
 for(let i=0;i<100&&f.launch.dataset.osirisCloudPhase!=='jump';i++)await advanceAmbient(f,api,{loadCloud:true});
 assert.equal(f.launch.dataset.osirisCloudPhase,'jump');
 const box=api.snapshot().position;assert.ok(box.left>=8&&box.right<=innerWidth-8);
});

test('interrupting an airborne source frame anchors the next pose at the displayed silhouette',async t=>{
 const f=setup(t,{random:()=>.5,virtualTimers:true}),api=await f.mount();f.pet.querySelector('.osiris-life-walk').emit('load');
 for(let i=0;i<600&&f.launch.dataset.osirisCloudPhase!=='jump';i++)await advanceAmbient(f,api,{loadCloud:true});
 assert.equal(f.launch.dataset.osirisCloudPhase,'jump');
 const canvas=f.canvases.find(c=>c.className==='osiris-life-canvas'),context=canvas.getContext('2d'),stage=f.pet.getBoundingClientRect();
 const x=Math.floor(canvas.width*.65),y=Math.floor(canvas.height*.6);
 context.getImageData=()=>{const data=new Uint8ClampedArray(canvas.width*canvas.height*4);data[(y*canvas.width+x)*4+3]=255;return {data};};
 const expected={x:stage.left+(x+.5)*stage.width/canvas.width,y:stage.top+(y+1)*stage.height/canvas.height};
 f.dialog.open=true;f.dialog.classList.add('osiris-compact');f.update();await flush();
 assert.deepEqual(api.snapshot().ground,expected);assert.equal(f.launch.dataset.osirisCloudPhase,undefined);
 f.dialog.open=false;f.update();api.command('blink');
 f.videos.find(v=>v.src&&v.readyState===0).ready();await flush();
 assert.ok(Math.abs(api.snapshot().ground.x-expected.x)<.02);assert.ok(Math.abs(api.snapshot().ground.y-expected.y)<.02);
 assert.equal(f.launch.chatClicks,undefined);
});

test('one-shot scene boundaries cut cleanly while ordinary pose transitions retain their blend',async t=>{
 const f=setup(t,{trackPaint:true}),api=await f.mount();
 const paint=()=>f.canvases.find(c=>c.className==='osiris-life-canvas').getContext('2d').draws;
 const show=async id=>{
  api.command(id);const pending=f.videos.find(v=>v.src&&v.readyState===0);
  assert.ok(pending);pending.ready();await flush();
 };
 await show('groom');await show('blink');
 assert.equal(paint().length,2,'ordinary transition draws outgoing and incoming poses');
 assert.ok(paint().every(draw=>draw.operation==='lighter'));
 await show('cloud-perch');
 assert.deepEqual(paint(),[{alpha:1,operation:'source-over'}],'cloud starts without a second ghost silhouette');
 await show('groom');
 assert.deepEqual(paint(),[{alpha:1,operation:'source-over'}],'leaving cloud also removes the outgoing scene immediately');
});

test('a narrow window reserves scrollbar space during dragging, walking and the held frame',async t=>{
 const f=setup(t),api=await f.mount();
 globalThis.innerWidth=390;globalThis.innerHeight=844;
 f.document.documentElement.clientWidth=375;f.document.documentElement.clientHeight=829;
 f.window.emit('resize');f.pet.querySelector('.osiris-life-walk').emit('load');
 api.command('lie-down');f.videos[0].ready();await flush();
 f.videos[0].frame(7);f.videos[0].ended=true;f.videos[0].emit('ended');
 const bounded=()=>{const b=api.snapshot().position;assert.ok(b.left>=7.98&&b.right<=367.02&&b.top>=7.98&&b.bottom<=821.02,JSON.stringify(b));};
 bounded();
 let box=api.snapshot().position;
 f.launch.emit('pointerdown',{pointerId:1,clientX:box.x,clientY:box.y,button:0});
 f.window.emit('pointermove',{pointerId:1,clientX:1000,clientY:1000});bounded();
 f.window.emit('pointerup',{pointerId:1});
 const start=api.snapshot().walkStart,pending=api.moveTo({x:8,y:start.y});
 assert.equal(api.snapshot().travelling,true);
 for(let i=0;i<200&&api.snapshot().travelling;i++){await f.step(100);bounded();}
 assert.equal(await pending,true);bounded();assert.equal(api.snapshot().walking,false);
});
