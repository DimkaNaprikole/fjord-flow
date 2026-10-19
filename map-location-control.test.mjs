import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./map-location-control.js',import.meta.url),'utf8');
class Element{
 constructor(){this.children=[];this.events={};this.attrs={};this.isConnected=true;this.classList={add(){}};}
 append(...children){this.children.push(...children);}
 setAttribute(key,value){this.attrs[key]=value;}
 addEventListener(name,fn){this.events[name]=fn;}
 remove(){this.isConnected=false;}
}
function setup(locate){const window={FjordBrowserGeolocation:{locate},addEventListener(){},removeEventListener(){}};const host=new Element(),positions=[];vm.runInNewContext(source,{window,document:{documentElement:{lang:'en'},createElement:()=>new Element()}});const control=window.FjordMapLocation.attach(host,{locate:p=>positions.push(p)});const [button,status]=host.children[0].children;return {button,status,control,positions};}
test('map location requires a click and repeated clicks cannot start duplicate GPS requests',async()=>{
 let calls=0,resolve;const s=setup(options=>{assert.equal(options.userInitiated,true);calls++;return {promise:new Promise(r=>{resolve=r;}),cancel(){}};});assert.equal(calls,0);
 const action=s.button.events.click();assert.equal(calls,1);assert.equal(s.button.disabled,true);await s.button.events.click();assert.equal(calls,1);
 resolve({coords:{latitude:60,longitude:10,accuracy:20}});await action;assert.equal(s.positions.length,1);assert.equal(s.positions[0].latitude,60);assert.equal(s.positions[0].longitude,10);assert.equal(s.button.disabled,false);assert.equal(s.status.hidden,true);
});
test('permission denial offers a readable retry state and never invents a position',async()=>{
 const s=setup(()=>({promise:Promise.reject({code:1}),cancel(){}}));await s.button.events.click();assert.equal(s.positions.length,0);assert.equal(s.status.hidden,false);assert.match(s.status.textContent,/Allow location/);assert.equal(s.button.disabled,false);
});
test('destroy cancels a pending request and prevents late map movement',async()=>{
 let cancel=0,reject;const s=setup(()=>({promise:new Promise((_,r)=>reject=r),cancel(){cancel++;reject(Error('cancelled'));}}));const action=s.button.events.click();s.control.destroy();await action;assert.equal(cancel,1);assert.equal(s.positions.length,0);
});
test('invalid GPS coordinates never become a map origin',async()=>{
 const s=setup(()=>({promise:Promise.resolve({coords:{latitude:null,longitude:10}}),cancel(){}}));await s.button.events.click();assert.equal(s.positions.length,0);assert.equal(s.status.hidden,false);assert.match(s.status.textContent,/Could not find/);
});
