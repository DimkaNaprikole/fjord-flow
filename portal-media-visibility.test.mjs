import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const source=name=>readFileSync(new URL(name,import.meta.url),'utf8');

test('catalogue clock ignores collapsed hidden cards, and resumes visible photos',()=>{
  const code=source('./norway-catalog.js');
  const clock=code.slice(code.indexOf('  setInterval(()=>{'),code.indexOf('  function card(r)'));
  let tick,changes=0,rect={width:0,height:0,top:0,bottom:0};
  const image={dataset:{slides:'["one.jpg","two.jpg"]',slide:'0'},getBoundingClientRect:()=>rect,closest:()=>({style:{setProperty(){}}}),set src(value){changes++;}};
  const document={hidden:false,querySelector:()=>null,querySelectorAll:()=>[image]};
  vm.runInNewContext(clock,{document,innerHeight:800,matchMedia:()=>({matches:false}),setInterval:fn=>{tick=fn;}});
  tick();tick();assert.equal(changes,0,'hidden cards must not fetch their next photograph');
  rect={width:300,height:250,top:100,bottom:350};tick();assert.equal(changes,1);
  document.hidden=true;tick();assert.equal(changes,1,'background document remains paused');
});

test('advertising film stops for background document, inactive tab and data saver',()=>{
  const code=source('./welcome-film.js');
  const block=code.slice(code.indexOf("const advertising=document.querySelector('.advertising-showcase');"),code.lastIndexOf('})();'));
  let observer,hidden=false,plays=0,pauses=0,rect={width:600,top:900,bottom:1400};
  const frames=[],flushFrame=()=>{for(const frame of frames.splice(0))frame();};
  const handlers={},connection={saveData:false,addEventListener:(name,fn)=>handlers['connection:'+name]=fn};
  const video={setAttribute(){},play(){plays++;return Promise.resolve();},pause(){pauses++;}};
  const advertising={prepend(){},closest:()=>hidden?{}:null,getBoundingClientRect:()=>rect};
  const document={hidden:false,querySelector:()=>advertising,createElement:()=>video,addEventListener:(name,fn)=>handlers[name]=fn};
  const window={addEventListener:(name,fn)=>handlers[name]=fn,IntersectionObserver:true};
  vm.runInNewContext(block,{document,window,innerHeight:800,requestAnimationFrame:fn=>frames.push(fn),navigator:{connection},matchMedia:()=>({matches:false,addEventListener(){}}),IntersectionObserver:class {constructor(fn){observer=fn;}observe(){}}});
  flushFrame();assert.equal(plays,0);assert.equal(video.src,undefined,'offscreen film must not load');assert.equal(pauses,1);
  rect={width:600,top:100,bottom:600};
  observer([{isIntersecting:true}]);assert.equal(plays,1);
  assert.equal(video.src,'media/eagle-ad-background.mp4');assert.equal(video.muted,true);
  document.hidden=true;handlers.visibilitychange();assert.equal(pauses,2);
  document.hidden=false;hidden=true;handlers['fjord:sections-changed']();flushFrame();assert.equal(plays,1);assert.equal(pauses,3);
  hidden=false;connection.saveData=true;handlers['connection:change']();assert.equal(plays,1);
  connection.saveData=false;handlers['connection:change']();assert.equal(plays,2,'visible film resumes after data saver is disabled');
  rect={width:600,top:-600,bottom:-100};handlers['fjord:sections-changed']();flushFrame();assert.equal(plays,2);assert.equal(pauses,5,'offscreen section pauses the film');
  rect={width:600,top:100,bottom:600};handlers['fjord:sections-changed']();flushFrame();assert.equal(plays,3,'section change resumes the visible film');
  rect={width:600,top:900,bottom:1400};handlers.hashchange();flushFrame();assert.equal(plays,3);assert.equal(pauses,6,'hash navigation out of view pauses the film');
  rect={width:600,top:100,bottom:600};handlers.hashchange();flushFrame();assert.equal(plays,4,'hash navigation back resumes the visible film');
});

test('advertising film resumes when scrolling from the former preload margin into the viewport',()=>{
  const code=source('./welcome-film.js');
  const block=code.slice(code.indexOf("const advertising=document.querySelector('.advertising-showcase');"),code.lastIndexOf('})();'));
  let top=900,plays=0,checkIntersection;
  const video={setAttribute(){},play(){plays++;return Promise.resolve();},pause(){}};
  const advertising={prepend(){},closest:()=>null,getBoundingClientRect:()=>({width:390,top,bottom:top+640})};
  const document={hidden:false,querySelector:()=>advertising,createElement:()=>video,addEventListener(){}};
  const window={addEventListener(){},IntersectionObserver:true};
  class Observer {
    constructor(callback,{rootMargin}){
      const margin=parseFloat(rootMargin);let previous;
      checkIntersection=()=>{const isIntersecting=top<800+margin&&top+640>-margin;if(isIntersecting!==previous){previous=isIntersecting;callback([{isIntersecting}]);}};
    }
    observe(){checkIntersection();}
  }
  vm.runInNewContext(block,{document,window,innerHeight:800,requestAnimationFrame:fn=>fn(),navigator:{},matchMedia:()=>({matches:false,addEventListener(){}}),IntersectionObserver:Observer});
  assert.equal(plays,0,'the film starts below the viewport, within the former 200px margin');
  top=700;checkIntersection();
  assert.equal(plays,1,'entering the viewport must notify the observer and resume playback without another hash event');
});

test('weather refresh waits for a visible associated section and keeps its TTL cache',async()=>{
  const code=source('./explorer-weather.js');
  const refresh=code.slice(code.indexOf('async function refresh(){'),code.indexOf('function icon('));
  const audience=code.slice(code.indexOf('function weatherVisible(){'),code.indexOf('function makeBadge('));
  let hidden=true,fetches=0;
  const host={closest:()=>hidden?{}:null,getBoundingClientRect:()=>({width:400,height:300})};
  const context={document:{hidden:false},badges:[{el:{parentElement:host}}],catalogueReady:Promise.resolve(),pending:null,cache:{until:{}},metFailures:{},failedAt:0,visiblePlaces:()=>[{id:'bergen'}],loadWeather:async()=>{fetches++;context.cache.until.bergen=Date.now()+600000;},renderAll(){},console};
  vm.createContext(context);vm.runInContext(audience+refresh,context);
  await context.refresh();assert.equal(fetches,0);
  hidden=false;context.document.hidden=true;await context.refresh();assert.equal(fetches,0);
  context.document.hidden=false;await context.refresh();assert.equal(fetches,1);
  await context.refresh();assert.equal(fetches,1,'reopening the tab must reuse fresh weather');
});
