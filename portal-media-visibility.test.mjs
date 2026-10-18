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
  let observer,hidden=false,plays=0,pauses=0;
  const handlers={},connection={saveData:false,addEventListener:(name,fn)=>handlers['connection:'+name]=fn};
  const video={setAttribute(){},play(){plays++;return Promise.resolve();},pause(){pauses++;}};
  const advertising={prepend(){},closest:()=>hidden?{}:null};
  const document={hidden:false,querySelector:()=>advertising,createElement:()=>video,addEventListener:(name,fn)=>handlers[name]=fn};
  const window={addEventListener:(name,fn)=>handlers[name]=fn,IntersectionObserver:true};
  vm.runInNewContext(block,{document,window,navigator:{connection},matchMedia:()=>({matches:false,addEventListener(){}}),IntersectionObserver:class {constructor(fn){observer=fn;}observe(){}}});
  observer([{isIntersecting:true}]);assert.equal(plays,1);
  document.hidden=true;handlers.visibilitychange();assert.equal(pauses,1);
  document.hidden=false;hidden=true;handlers['fjord:sections-changed']();assert.equal(plays,1);
  hidden=false;connection.saveData=true;handlers['connection:change']();assert.equal(plays,1);
  connection.saveData=false;handlers['connection:change']();assert.equal(plays,2,'visible film resumes after data saver is disabled');
});

test('weather refresh waits for a visible associated section and keeps its TTL cache',async()=>{
  const code=source('./explorer-weather.js');
  const refresh=code.slice(code.indexOf('async function refresh(){'),code.indexOf('function icon('));
  const audience=code.slice(code.indexOf('function weatherVisible(){'),code.indexOf('function makeBadge('));
  let hidden=true,fetches=0;
  const host={closest:()=>hidden?{}:null,getBoundingClientRect:()=>({width:400,height:300})};
  const context={document:{hidden:false},badges:[{el:{parentElement:host}}],catalogueReady:Promise.resolve(),pending:null,cache:{at:0},failedAt:0,TTL:600000,RETRY:120000,places:[{id:'bergen'}],signature:()=> 'one',apiURL:()=> 'https://example.invalid/weather',mapResponse:()=>({bergen:{}}),renderAll(){},sessionStorage:{setItem(){}},AbortSignal,console,fetch:async()=>{fetches++;return {ok:true,json:async()=>({})};}};
  vm.createContext(context);vm.runInContext(audience+refresh,context);
  await context.refresh();assert.equal(fetches,0);
  hidden=false;context.document.hidden=true;await context.refresh();assert.equal(fetches,0);
  context.document.hidden=false;await context.refresh();assert.equal(fetches,1);
  await context.refresh();assert.equal(fetches,1,'reopening the tab must reuse fresh weather');
});
