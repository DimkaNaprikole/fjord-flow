import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('./site-auth-ui.js',import.meta.url),'utf8');
function fixture(){
 const events=new Map(),calls=[];
 const visitor={email:'visitor@example.com',idToken:'private-id-token'};
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.open=false;this.isConnected=true;}
  setAttribute(){} append(...nodes){this.children.push(...nodes)} replaceChildren(...nodes){this.children=nodes}
  addEventListener(type,listener){this.listeners[type]=listener}
  querySelector(selector){return selector==='h2'?this.children.find(x=>x.tag==='h2'):selector==='.site-account-close'?this.children.find(x=>x.className==='site-account-close'):null}
  showModal(){this.open=true}close(){this.open=false;this.listeners.close?.()}
  focus(){} getBoundingClientRect(){return {left:0,right:470,top:0,bottom:600}}
 }
 const document={documentElement:{lang:'nb'},activeElement:new Element('button'),body:new Element('body'),createElement:tag=>new Element(tag),getElementById:()=>({value:'uk'})};
 const auth={getStoredVisitor:()=>visitor,getVisitorToken:async key=>{calls.push(['token',key]);return visitor.idToken},ensureVerified:async(...args)=>{calls.push(['verify',...args]);return visitor},signOutVisitor:async()=>{calls.push(['logout']);visitor.email='';}};
 const window={addEventListener:(name,fn)=>events.set(name,fn),dispatchEvent:event=>events.get(event.type)?.()};
 const context=vm.createContext({window,document,CustomEvent:class{constructor(type){this.type=type}},fetch:async()=>({ok:true,json:async()=>({firebaseApiKey:'public-firebase-key'})}),fakeAuth:auth});
 vm.runInContext(source.replace("import('./afonya-auth.js?v=6')",'Promise.resolve(fakeAuth)'),context);
 return {window,document,calls,visitor};
}
test('shared account exposes email only and validates with Firebase before showing profile',async()=>{
 const f=fixture();await f.window.FjordSiteAuth.open('register');
 assert.deepEqual(Object.keys(f.window.FjordSiteAuth.getProfile()),['email']);
 assert.equal(f.window.FjordSiteAuth.getProfile().email,'visitor@example.com');
 const call=f.calls.find(x=>x[0]==='verify');assert.equal(call[2],'public-firebase-key');assert.equal(call[3],'uk');
 const dialog=f.document.body.children[0];assert.equal(dialog.open,true);
 const body=dialog.children.find(x=>x.className==='site-account-body');
 assert.equal(body.children[0].textContent,'visitor@example.com');
 await body.children.at(-1).listeners.click();assert.equal(dialog.open,false);assert.equal(f.window.FjordSiteAuth.getProfile(),null);
});
test('opening an account while initial config is loading still uses one safe dialog',async()=>{
 const f=fixture();const first=f.window.FjordSiteAuth.open();const second=f.window.FjordSiteAuth.open();await Promise.all([first,second]);
 assert.equal(f.document.body.children.length,1);assert.equal(f.calls.filter(x=>x[0]==='verify').length,1);
});
