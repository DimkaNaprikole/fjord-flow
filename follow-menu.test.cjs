const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');
function harness({reduced=false}={}) {
  let y=0, frames=[], animations=0, scrolls=[], now=0;
  const listeners={};
  function element(name, top=0, height=0) {
    const classes=new Set();
    return {name,hidden:false,children:[],style:{},className:'',dataset:{},parent:null,
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
      setAttribute(){},addEventListener(k,fn){this[k]=fn;},
      append(node){node.remove();this.children.push(node);node.parent=this;},
      before(node){node.remove();const i=this.parent.children.indexOf(this);this.parent.children.splice(i,0,node);node.parent=this.parent;},
      remove(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}},
      animate(){animations++;},
      getBoundingClientRect(){const h=this.name==='host'?140:Number.parseFloat(this.style.height)||height;
        const t=this.name==='host'?Number.parseFloat(this.style.top)||0:top;
        return {top:t-y,bottom:t+h-y,height:h,left:20,width:960};}
    };
  }
  const body=element('body'),header=element('header'),main=element('main');
  body.append(header);body.append(main);
  const nav=element('nav',500,60),menu=element('menu',560,60),other=element('other',560,0);
  other.hidden=true;header.append(nav);main.append(menu);main.append(other);main.append(element('chapter',1100,600));
  let host;
  const document={body,documentElement:{scrollHeight:5000},querySelector:()=>nav,querySelectorAll:()=>[menu,other],getElementById:()=>main,
    createElement:()=>{const el=element(host?'node':'host');if(!host)host=el;return el;}};
  const ctx={document,performance:{now:()=>now+=100},innerWidth:1000,innerHeight:800,get scrollY(){return y;},matchMedia:()=>({matches:reduced}),
    addEventListener:(k,fn)=>listeners[k]=fn,requestAnimationFrame:fn=>frames.push(fn),window:{scrollTo:opts=>{scrolls.push(opts);y=opts.top;}}};
  vm.runInNewContext(readFileSync(__dirname+'/follow-menu.js','utf8'),ctx);
  const flush=()=>{while(frames.length)frames.shift()();};
  return {nav,menu,other,host,header,main,scrolls,animations:()=>animations,
    scroll(to){y=to;listeners.scroll();flush();},flush,resize(){listeners.resize();flush();}};
}
test('two original rows relocate together only after both disappear, then hop again',()=>{
  const h=harness();h.scroll(600);assert.equal(h.nav.parent,h.header);
  h.scroll(650);assert.equal(h.nav.parent,h.host);assert.equal(h.menu.parent,h.host);
  assert.equal(h.host.children.filter(n=>n===h.nav).length,1);
  const first=h.host.style.top;h.scroll(1700);assert.notEqual(h.host.style.top,first);
  h.scroll(0);assert.equal(h.nav.parent,h.header);assert.equal(h.menu.parent,h.main);
});
test('Home and End perform immediate page jumps; reduced motion has no animation',()=>{
  const h=harness({reduced:true});h.scroll(700);
  const controls=h.menu.children.find(n=>n.className==='follow-menu-ends');
  assert.ok(controls);assert.equal(controls.children.length,2);
  controls.children[1].click();h.flush();assert.equal(h.scrolls[0].top,5000);assert.equal(h.scrolls[0].behavior,'instant');
  controls.children[0].click();h.flush();assert.equal(h.scrolls.at(-1).top,0);assert.equal(h.nav.parent,h.header);
  assert.equal(h.animations(),0);
});
