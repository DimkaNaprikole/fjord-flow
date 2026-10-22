const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');
function harness({reduced=false}={}) {
  let y=0, frames=[], animations=0, scrolls=[], now=0;
  const listeners={};
  function element(name, top=0, height=0) {
    const classes=new Set();
    return {name,id:({chapter:'about',later:'scenicRoutes',advert:'advertising',near:'collection'})[name]||'',naturalTop:top,naturalHeight:height,hidden:false,children:[],style:{},className:'',dataset:{},parent:null,
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
      setAttribute(){},addEventListener(k,fn){this[k]=fn;},
      append(node){node.remove();this.children.push(node);node.parent=this;},
      before(node){node.remove();const i=this.parent.children.indexOf(this);this.parent.children.splice(i,0,node);node.parent=this.parent;},
      remove(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}},
      animate(){animations++;},
      getBoundingClientRect(){const h=this.name==='host'?140:Number.parseFloat(this.style.height)||height;
        const next=this.parent?.children[this.parent.children.indexOf(this)+1];
        const t=this.name==='host'?(next?.naturalTop??4000):top;
        return {top:t-y,bottom:t+h-y,height:h,left:20,width:960};}
    };
  }
  const body=element('body'),header=element('header'),main=element('main');
  body.append(header);body.append(main);
  const nav=element('nav',500,60),menu=element('menu',560,60),other=element('other',560,0);
  other.hidden=true;header.append(nav);main.append(menu);main.append(other);main.append(element('advert',900,400));main.append(element('chapter',1100,600));main.append(element('near',1400,500));main.append(element('later',3000,1000));
  let host;
  const document={body,documentElement:{scrollHeight:5000},querySelector:()=>nav,querySelectorAll:selector=>selector==='.site-group-links'?[menu,other]:[],getElementById:()=>main,
    createElement:()=>{const el=element(host?'node':'host');if(!host)host=el;return el;}};
  const ctx={document,performance:{now:()=>now+=100},innerWidth:1000,innerHeight:800,get scrollY(){return y;},matchMedia:()=>({matches:reduced}),
    addEventListener:(k,fn)=>listeners[k]=fn,requestAnimationFrame:fn=>frames.push(fn),window:{scrollTo:opts=>{scrolls.push(opts);y=opts.top;}}};
  vm.runInNewContext(readFileSync(__dirname+'/follow-menu.js','utf8'),ctx);
  const flush=()=>{while(frames.length)frames.shift()();};
  return {nav,menu,other,host,header,main,scrolls,animations:()=>animations,landing:()=>host.parent?.children[host.parent.children.indexOf(host)+1]?.name,
    scroll(to){y=to;listeners.scroll();flush();},flush,resize(){listeners.resize();flush();}};
}
test('two original rows relocate together only after both disappear, then hop again',()=>{
  const h=harness();h.scroll(600);assert.equal(h.nav.parent,h.header);
  h.scroll(650);assert.equal(h.nav.parent,h.host);assert.equal(h.menu.parent,h.host);
  assert.equal(h.host.children.filter(n=>n===h.nav).length,1);
  const first=h.landing();h.scroll(1700);assert.notEqual(h.landing(),first);
  h.scroll(0);assert.equal(h.nav.parent,h.header);assert.equal(h.menu.parent,h.main);
});
test('Home and End perform immediate page jumps; reduced motion has no animation',()=>{
  const h=harness({reduced:true});h.scroll(700);
  const home=h.host.children.find(n=>n.className==='follow-menu-home');
  const end=h.host.children.find(n=>n.className==='follow-menu-end');
  assert.ok(home);assert.ok(end);
  end.children[0].click();h.flush();assert.equal(h.scrolls[0].top,5000);assert.equal(h.scrolls[0].behavior,'instant');
  home.children[0].click();h.flush();assert.equal(h.scrolls.at(-1).top,0);assert.equal(h.nav.parent,h.header);
  assert.equal(h.animations(),0);
});

test('no viewport-bottom fallback or repeated appearances before the next real boundary',()=>{
  const h=harness();h.scroll(700);h.scroll(1700);
  assert.equal(h.landing(),'later');
  const count=h.animations();h.scroll(1800);h.resize();
  assert.equal(h.landing(),'later');assert.equal(h.animations(),count);
  h.scroll(2300);assert.equal(h.animations(),count+1);
  h.scroll(2350);assert.equal(h.animations(),count+1);
});

test('advertising is never selected as a landing zone',()=>{
  const h=harness();h.scroll(650);assert.equal(h.landing(),'chapter');
});

test('nearby chapters do not cause rapid consecutive menu hops',()=>{
  const h=harness();h.scroll(650);assert.equal(h.landing(),'chapter');
  h.scroll(1250);assert.equal(h.landing(),'later');
});

 test('arrow space rejects cat overlap and nearby labels but accepts a clear lane',()=>{
  const {isSpaceFree}=require('./follow-menu.js');
  const arrow={left:300,right:376,top:400,bottom:444};
  assert.equal(isSpaceFree(arrow,[]),true);
  assert.equal(isSpaceFree(arrow,[{left:280,right:380,top:420,bottom:470}]),false);
  assert.equal(isSpaceFree(arrow,[{left:200,right:296,top:400,bottom:420}]),false);
  assert.equal(isSpaceFree(arrow,[{left:100,right:260,top:500,bottom:600}]),true);
 });
