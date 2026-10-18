import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('./portal-artwork.mjs',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function harness({header=false,explorer=false,reducedMotion=false}={}){
 const mutations=[],intersections=[],timers=new Map();let timerId=0;
 const events=()=>({listeners:new Map(),addEventListener(name,fn){const list=this.listeners.get(name)||[];list.push(fn);this.listeners.set(name,list);},emit(name){for(const fn of this.listeners.get(name)||[])fn();}});
 const notify=target=>{for(const observer of mutations)if(observer.targets.get(target)?.childList)observer.pending.push({target});};
 function node(tag='section'){
  const classes=new Set(),n={tag,children:[],parentNode:null,connected:false,hidden:false,dataset:{},style:{setProperty(){}},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},rect:{top:20,bottom:300,left:0,right:700},
   get isConnected(){return this.connected||Boolean(this.parentNode?.isConnected);},
   setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},decode:async()=>{},
   append(...children){for(const child of children){child.parentNode=this;this.children.push(child);}notify(this);},
   prepend(child){if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(c=>c!==child);child.parentNode=this;this.children.unshift(child);notify(this);},
   replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];this.append(...children);},
   closest(selector){for(let current=this;current;current=current.parentNode)if(selector==='[hidden]'&&current.hidden)return current;return null;},
   getClientRects(){return this.isConnected&&!this.closest('[hidden]')?[this.rect]:[];},getBoundingClientRect(){return this.rect;}};return n;
 }
 class MutationObserver{constructor(callback){this.callback=callback;this.targets=new Map();this.pending=[];mutations.push(this);}observe(target,options){this.targets.set(target,options);}}
 class IntersectionObserver{constructor(callback){this.callback=callback;this.targets=new Set();intersections.push(this);}observe(target){this.targets.add(target);}unobserve(target){this.targets.delete(target);}}
 const body=node('body');body.connected=true;const journeys=node('main');body.append(journeys);
 const sections=[node(),node()];journeys.append(...sections);
 const friendship=header?node('div'):null,pledge=header?node('a'):null,about=explorer?node():null;if(friendship)body.append(friendship);if(about)journeys.append(about);
 const motion={...events(),matches:reducedMotion};
 const document={...events(),body,hidden:false,createElement:node,getElementById:id=>id==='journeys'?journeys:null,querySelector:s=>s==='#about'?about:s==='body>header>.solidarity-art-pair'?friendship:s==='#solidarityBanner .solidarity-pledge'?pledge:null,querySelectorAll:()=>sections};
 const window={...events(),innerWidth:1280,innerHeight:800,IntersectionObserver};
 vm.runInNewContext(source,{window,document,matchMedia:()=>motion,MutationObserver,IntersectionObserver,setInterval(fn,delay){assert.equal(delay,12000);const id=++timerId;timers.set(id,fn);return id;},clearInterval:id=>timers.delete(id)});
 return {document,window,motion,sections,friendship,pledge,about,timers,node,
  near(target,visible=true){intersections[0].callback([{target,isIntersecting:visible}]);},
  tick(){for(const callback of [...timers.values()])callback();},
  deliverMutations(){for(let turn=0;turn<20;turn++){const pending=mutations.filter(o=>o.pending.length);if(!pending.length)return turn;for(const observer of pending)observer.callback(observer.pending.splice(0));}assert.fail('Mutation observer loop');}
 };
}
const art=host=>host.children.find(child=>child.className==='hero-artwork');
const pair=host=>[art(host).dataset.left,art(host).dataset.right];

test('public sections mount lazily, share one clock and retain alternating country pairs',async()=>{
 const h=harness();assert.ok(h.sections.every(section=>!art(section)));assert.equal(h.timers.size,0);
 h.sections.forEach(section=>h.near(section));await flush();assert.equal(h.timers.size,1);
 assert.equal(art(h.sections[0]).dataset.step,'0');assert.equal(art(h.sections[1]).dataset.step,'1');
 const norwegian='images/norway-friendship-original.png';
 for(let i=0;i<6;i++){assert.equal(pair(h.sections[0]).filter(path=>path===norwegian).length,1);assert.equal(pair(h.sections[0])[i%2?0:1],norwegian);h.tick();await flush();}
 assert.equal(pair(h.sections[0])[0],'images/portal-ukraine-ribbons.webp');
});

test('section rerenders restore the same artwork once without replacing visitor content',async()=>{
 const h=harness(),section=h.sections[0];h.near(section);await flush();h.deliverMutations();
 const original=art(section),newContent=h.node('p');section.replaceChildren(newContent);
 assert.equal(art(section),undefined);assert.equal(h.deliverMutations(),2,'one restoration plus its harmless notification');
 assert.equal(art(section),original);assert.ok(section.children.includes(newContent));assert.equal(h.deliverMutations(),0);assert.equal(h.timers.size,1);
 h.tick();await flush();assert.equal(original.dataset.step,'1','restored layer retains its original animation callback');
 section.parentNode=null;section.replaceChildren(newContent);h.deliverMutations();assert.equal(art(section),undefined,'detached section is not resurrected');
});

test('offscreen and hidden sections, hidden document and reduced motion do not rotate artwork',async()=>{
 const h=harness(),section=h.sections[0];h.near(section);await flush();h.tick();await flush();const original=art(section);
 section.rect.top=1000;section.rect.bottom=1300;h.tick();await flush();assert.equal(original.dataset.step,'1');section.rect.top=20;
 section.hidden=true;h.window.emit('fjord:sections-changed');assert.equal(h.timers.size,0);h.tick();await flush();assert.equal(original.dataset.step,'1');
 section.hidden=false;h.window.emit('fjord:sections-changed');assert.equal(h.timers.size,1);
 h.document.hidden=true;h.document.emit('visibilitychange');assert.equal(h.timers.size,0);h.document.hidden=false;h.document.emit('visibilitychange');assert.equal(h.timers.size,1);
 h.motion.matches=true;h.motion.emit('change');await flush();assert.equal(h.timers.size,0);const frozen=original.dataset.step;h.tick();await flush();assert.equal(original.dataset.step,frozen);
 h.motion.matches=false;h.motion.emit('change');await flush();assert.equal(h.timers.size,1);
});

test('header cycles two wake-up pairs and a clean friendship frame, then resets with reduced motion',async()=>{
 const h=harness({header:true});h.near(h.friendship);await flush();
 const first=['images/ukraine-friendship-original.png','images/norway-friendship-original.png'];
 const second=['images/ukraine-friendship-clean.webp','images/norway-wake-up.webp'];
 const third=['images/ukraine-friendship-clean.webp','images/norway-friendship-original.png'];
 const captioned=new Set([first[0],second[1]]);
 const caption=h.friendship.parentNode.children.find(child=>child.className==='friendship-third-caption');
 assert.ok(caption,'third frame has its own sibling caption above the artwork');
 const captionText=caption.innerHTML.replace(/<br\s*\/?\s*>/gi,' ').replace(/<\/span>/gi,' ').replace(/<[^>]+>/g,'');
 assert.match(captionText,/Norge \+\s+Ukraina/);assert.match(captionText,/Sammen\s+for frihet/);
 const frames=[[first,'Stand with Norway'],[second,'Stand with Ukraine'],[third,null],[first,'Stand with Norway']];
 for(let i=0;i<frames.length;i++){
  const [expected,label]=frames[i],clean=expected===third;
  assert.deepEqual(pair(h.friendship),expected);assert.equal(pair(h.friendship).filter(path=>captioned.has(path)).length,clean?0:1);
  assert.equal(caption.hidden,!clean);assert.equal(h.pledge.style.visibility,clean?'hidden':'');
  if(label)assert.equal(h.pledge.textContent,label);
  if(i<frames.length-1){h.tick();await flush();}
 }
 h.tick();await flush();h.tick();await flush();assert.deepEqual(pair(h.friendship),third);
 h.motion.matches=true;h.motion.emit('change');await flush();
 assert.deepEqual(pair(h.friendship),first);assert.equal(h.pledge.textContent,'Stand with Norway');
 assert.equal(h.pledge.style.visibility,'');assert.equal(caption.hidden,true);assert.equal(h.timers.size,0);
});

test('explorer advances once on a committed photo, not on selection or language render events',async()=>{
 const h=harness({explorer:true});await flush();assert.equal(art(h.about).dataset.step,'0');
 h.window.emit('fjordexplorerchange');h.window.emit('fjordlanguagechange');await flush();assert.equal(art(h.about).dataset.step,'0');
 h.window.emit('fjordexplorerphoto');await flush();assert.equal(art(h.about).dataset.step,'1');
 h.window.emit('fjordexplorerchange');await flush();assert.equal(art(h.about).dataset.step,'1');
 h.window.emit('fjordexplorerphoto');await flush();assert.equal(art(h.about).dataset.step,'2');
});
