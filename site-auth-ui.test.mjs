import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('./site-auth-ui.js',import.meta.url),'utf8');
function fixture(){
 const events=new Map(),calls=[];
 const visitor={email:'visitor@example.com',idToken:'private-id-token'};
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.open=false;this.isConnected=true;this.dataset={};}
  setAttribute(){} append(...nodes){this.children.push(...nodes)} replaceChildren(...nodes){this.children=nodes}
  addEventListener(type,listener){this.listeners[type]=listener}
  querySelector(selector){let root=this;for(const part of selector.split(' ')){const match=n=>part.startsWith('.')?String(n.className||'').split(' ').includes(part.slice(1)):n.tag===part;const find=n=>n.children.map(c=>match(c)?c:find(c)).find(Boolean);root=find(root);if(!root)return null;}return root}
  showModal(){this.open=true}close(){this.open=false;this.listeners.close?.()}
  focus(){} getBoundingClientRect(){return {left:0,right:470,top:0,bottom:600}}
 }
 const document={documentElement:{lang:'nb'},activeElement:new Element('button'),body:new Element('body'),createElement:tag=>new Element(tag),getElementById:()=>({value:'uk'})};
 const auth={getStoredVisitor:()=>visitor,getVisitorToken:async key=>{calls.push(['token',key]);return visitor.idToken},ensureVerified:async(...args)=>{calls.push(['verify',...args]);return visitor},signOutVisitor:async()=>{calls.push(['logout']);visitor.email='';}};
 const window={FjordI18n:{language:'uk'},addEventListener:(name,fn)=>events.set(name,fn),dispatchEvent:event=>events.get(event.type)?.()};
 const context=vm.createContext({window,document,CustomEvent:class{constructor(type){this.type=type}},fetch:async()=>({ok:true,json:async()=>({firebaseApiKey:'public-firebase-key'})}),fakeAuth:auth});
 vm.runInContext(source.replace(/import\(['"]\.\/afonya-auth\.js(?:\?[^'"]*)?['"]\)/g,'Promise.resolve(fakeAuth)'),context);
 return {window,document,calls,visitor,events,auth};
}
test('successful registration closes the dialog; explicit profile still offers sign out',async()=>{
 const f=fixture();await f.window.FjordSiteAuth.open('register');
 assert.deepEqual(Object.keys(f.window.FjordSiteAuth.getProfile()),['email']);
 assert.equal(f.window.FjordSiteAuth.getProfile().email,'visitor@example.com');
 const call=f.calls.find(x=>x[0]==='verify');assert.equal(call[2],'public-firebase-key');assert.equal(call[3],'uk');
 assert.equal(call[4].mode,'register');
 const dialog=f.document.body.children[0];assert.equal(dialog.open,false);
 await f.window.FjordSiteAuth.open('profile');assert.equal(dialog.open,true);
 const body=dialog.children.find(x=>x.className==='site-account-body');
 assert.equal(body.children[0].textContent,'visitor@example.com');
 await body.children.at(-1).listeners.click();assert.equal(dialog.open,false);assert.equal(f.window.FjordSiteAuth.getProfile(),null);
});
test('opening an account while initial config is loading still uses one safe dialog',async()=>{
 const f=fixture();const first=f.window.FjordSiteAuth.open();const second=f.window.FjordSiteAuth.open();await Promise.all([first,second]);
 assert.equal(f.document.body.children.length,1);assert.equal(f.calls.filter(x=>x[0]==='verify').length,1);
});

test('social auth event does not replace the verification form before login finishes',async()=>{
 const f=fixture();let bodyDuringEvent;
 f.auth.ensureVerified=async()=>{
  f.events.get('fjord:auth-changed')();
  bodyDuringEvent=f.document.body.children[0].children.find(x=>x.className==='site-account-body').children.length;
  return f.visitor;
 };
 await f.window.FjordSiteAuth.open('login');
 assert.equal(bodyDuringEvent,0);
 assert.equal(f.document.body.children[0].open,false);
 assert.equal(f.window.FjordSiteAuth.getProfile().email,'visitor@example.com');
});

test('unsuccessful verification keeps the dialog open and does not show sign out',async()=>{
 const f=fixture();f.auth.ensureVerified=async()=>null;
 await f.window.FjordSiteAuth.open('login');
 const dialog=f.document.body.children[0];assert.equal(dialog.open,true);
 assert.equal(dialog.children.find(x=>x.className==='site-account-body').children.length,0);
});

test('owner account gets an inbox entry while ordinary profiles do not',async()=>{
 const f=fixture();await f.window.FjordSiteAuth.open('profile');const body=f.document.body.children[0].children.find(x=>x.className==='site-account-body');
 assert.equal(body.children.some(x=>x.className==='site-account-owner-inbox'),false);
 f.visitor.email='Laurkent123@gmail.com';f.events.get('fjord:auth-changed')();
 const link=body.children.find(x=>x.className==='site-account-owner-inbox');assert.equal(link.href,'admin-cabinet.html');
 f.visitor.email='visitor@example.com';f.events.get('fjord:auth-changed')();assert.equal(body.children.some(x=>x.className==='site-account-owner-inbox'),false);
});

test('account artwork follows explicit interface language without changing the authenticated visitor',async()=>{
 const f=fixture();await f.window.FjordSiteAuth.open('profile');const dialog=f.document.body.children[0],profile=f.window.FjordSiteAuth.getProfile();
 for(const [lang,caption]of [['uk','Wake up Украина'],['nb','Wake up Norway'],['en','Wake up USA']]){f.window.FjordI18n.language=lang;f.events.get('fjordlanguagechange')();assert.equal(dialog.querySelector('.site-account-cover').dataset.language,lang);assert.equal(dialog.querySelector('.site-account-pledge span').textContent,caption);assert.equal(f.window.FjordSiteAuth.getProfile().email,profile.email);}
 assert.equal(f.calls.filter(x=>x[0]==='verify').length,1);assert.equal(dialog.querySelector('.site-account-brand').src,'images/friendship-wordmark-no-slash.webp');
});
