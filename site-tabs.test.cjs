/* Execute actual tab handlers with a small DOM; no browser/network dependencies. */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
function harness({hash='',reduced=false}={}){
 const nodes=[],listeners={},observers=[],scrolls=[],navScrolls=[];let focused=null;
 function element(tag,id='',href=''){
  const classes=new Set(),attrs={};if(href)attrs.href=href;
  const el={tag,id,children:[],parent:null,dataset:{},hidden:false,offsetLeft:0,offsetWidth:100,clientWidth:100,scrollWidth:100,scrollLeft:0,
   classList:{add:x=>classes.add(x),toggle(x,on){on?classes.add(x):classes.delete(x);}},
   append(...items){for(const x of items){this.children.push(x);x.parent=this;}},
   matches(selector){return selector==='a,button'&&['a','button'].includes(tag);},
   getAttribute:k=>attrs[k]||null,setAttribute(k,v){attrs[k]=String(v);},
   get hash(){return (attrs.href||'').startsWith('#')?attrs.href:'';},
   closest(selector){for(let n=this;n;n=n.parent){if(selector==='[data-site-tab]'&&n.dataset.siteTab)return n;if(selector==='[role=tab]'&&n.getAttribute('role')==='tab')return n;if(selector==='a[href^="#"]'&&n.tag==='a'&&n.hash)return n;}return null;},
   contains(target){for(let n=target;n;n=n.parent)if(n===this)return true;return false;},
   querySelector(selector){return selector==='.hero'?this.children.find(n=>n.isHero):null;},
   addEventListener(name,fn){(listeners[id+':'+name]??=[]).push(fn);},
   scrollIntoView(options){scrolls.push({id:this.id,options});},
   scrollTo(options){navScrolls.push(options);this.scrollLeft=options.left;},
   getBoundingClientRect(){return {left:this===nav?0:this.offsetLeft-nav.scrollLeft,right:this===nav?nav.clientWidth:this.offsetLeft-nav.scrollLeft+this.offsetWidth,width:this.clientWidth};},
   focus(){focused=this;}
  };nodes.push(el);return el;
 }
 const nav=element('nav','nav'),main=element('main','journeys'),hero=element('section','homePanel');hero.isHero=true;
 const catalogue=element('section','norwayCatalogue'),news=element('section','municipalNews'),detail=element('div','newsDetails'),homeExtra=element('section','collection');news.append(detail);main.append(hero,homeExtra,catalogue,news);
 const home=element('button','home'),cat=element('a','cat','#norwayCatalogue'),newsTab=element('a','news','#municipalNews');nav.append(home,cat,newsTab);nav.children.forEach((el,i)=>{el.offsetLeft=i*100;});nav.clientWidth=120;nav.scrollWidth=300;
 const document={getElementById:id=>nodes.find(n=>n.id===id)||null,querySelector:s=>s==='body>header>nav'?nav:null,querySelectorAll:s=>s==='[data-site-tab]'?nodes.filter(n=>n.dataset.siteTab):[],addEventListener(name,fn){(listeners['document:'+name]??=[]).push(fn);}};
 const location={hash},history={pushState(_,__,value){location.hash=value;},replaceState(_,__,value){location.hash=value;}};
 const window={addEventListener(name,fn){(listeners['window:'+name]??=[]).push(fn);},dispatchEvent(event){for(const fn of listeners['window:'+event.type]||[])fn(event);}};
 const event=(target,extra={})=>({target,button:0,prevented:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){},...extra});
 const fire=(surface,name,e)=>{for(const fn of listeners[surface+':'+name]||[])fn(e);return e;};
 vm.runInNewContext(readFileSync(__dirname+'/site-tabs.js','utf8'),{window,document,history,location,Event:class{constructor(type){this.type=type;}},matchMedia:()=>({matches:reduced}),MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}}});
 scrolls.length=0;navScrolls.length=0;
 return {api:window.FjordTabs,nav,main,home,cat,newsTab,catalogue,news,detail,hero,location,scrolls,navScrolls,element,observers,event,fire,focused:()=>focused,visible:()=>main.children.filter(n=>!n.hidden).map(n=>n.id)};
}
test('normal tab click selects a unique group and updates hash without scrolling page',()=>{
 const h=harness();const e=h.fire('nav','click',h.event(h.cat));assert.equal(e.prevented,true);assert.equal(h.api.current,'catalogue');assert.deepEqual(h.visible(),['norwayCatalogue']);assert.equal(h.location.hash,'#norwayCatalogue');assert.equal(h.cat.getAttribute('aria-selected'),'true');assert.equal(h.home.tabIndex,-1);assert.deepEqual(h.scrolls,[]);
});
test('modified and non-left tab or cross-section link clicks preserve browser behavior',()=>{
 for(const extra of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}]){
  const h=harness(),link=h.element('a','cross','#municipalNews');
  const tabEvent=h.fire('nav','click',h.event(h.cat,extra));assert.equal(tabEvent.prevented,false);assert.equal(h.api.current,'home');assert.equal(h.location.hash,'');
  const crossEvent=h.fire('document','click',h.event(link,extra));assert.equal(crossEvent.prevented,false);assert.equal(h.api.current,'home');
 }
});
test('keyboard arrows wrap and Home/End select and focus the correct tab',()=>{
 const h=harness();for(const [target,key,want] of [[h.home,'ArrowLeft',h.newsTab],[h.newsTab,'ArrowRight',h.home],[h.home,'End',h.newsTab],[h.newsTab,'Home',h.home]]){const e=h.fire('nav','keydown',h.event(target,{key}));assert.equal(e.prevented,true);assert.equal(h.focused(),want);assert.equal(want.getAttribute('aria-selected'),'true');}assert.deepEqual(h.scrolls,[]);
});
test('deep links, cross-section links, and map events reveal the right panel',()=>{
 const h=harness({hash:'#newsDetails'});assert.equal(h.api.current,'news');assert.deepEqual(h.visible(),['municipalNews']);
 const link=h.element('a','cross','#norwayCatalogue');h.fire('document','click',h.event(link));assert.equal(h.api.current,'catalogue');
 h.fire('window','fjord:open-place',{});assert.equal(h.api.current,'home');assert.ok(h.visible().includes('collection'));
 h.location.hash='#newsDetails';h.fire('window','hashchange',{});assert.equal(h.api.current,'news');
});
test('unknown activation keys fall back to visible home content',()=>{
 const h=harness();h.api.activate('missing',{historyMode:'push'});assert.equal(h.api.current,'home');assert.ok(h.visible().includes('homePanel'));assert.equal(h.home.getAttribute('aria-selected'),'true');
});
test('editor-disabled tabs are skipped by keyboard and cannot be reopened by deep-link activation',()=>{
 const h=harness();h.cat.dataset.cmsDisabled='true';
 h.fire('nav','keydown',h.event(h.home,{key:'ArrowRight'}));assert.equal(h.focused(),h.newsTab);
 h.api.activate('catalogue');assert.equal(h.api.current,'home');
 h.cat.dataset.cmsDisabled='false';h.api.activate('catalogue');assert.equal(h.api.current,'catalogue');
});
test('overflow selection scrolls only inside tab navigation',()=>{
 const h=harness();h.api.activate('news');assert.ok(h.navScrolls.length>0);assert.ok(h.nav.scrollLeft>0);assert.deepEqual(h.scrolls,[]);assert.equal(h.api.current,'news');
});
test('explicit reveal honors reduced motion and dynamic sections retain current selection',()=>{
 const h=harness({reduced:true});h.api.reveal('newsDetails',{scroll:true});assert.equal(h.scrolls.length,1);assert.equal(h.scrolls[0].id,'newsDetails');assert.notEqual(h.scrolls[0].options.behavior,'smooth');
 const extra=h.element('section','newHomeContent');h.main.append(extra);h.observers[0]();assert.equal(extra.dataset.siteTab,'home');assert.equal(extra.hidden,true);assert.equal(h.news.hidden,false);assert.equal(h.api.current,'news');
});
