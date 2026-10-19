import {readFileSync} from 'node:fs';
import vm from 'node:vm';

export const cat={left:180,right:264,top:650,bottom:758};
export function fixture(){
 class Node {
  constructor(){this.tagName='BUTTON';this.attrs={};this.tabIndex=-1;this.dataset={};this.listeners={};this.children=[];this.style={removeProperty:key=>delete this.style[key]};this.open=false;this.classes=new Set();this.classList={contains:key=>this.classes.has(key),add:key=>this.classes.add(key),remove:key=>this.classes.delete(key)}}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
  removeEventListener(){}
  emit(type,props={}){for(const fn of this.listeners[type]||[])fn({type,...props})}
  append(...nodes){this.children.push(...nodes)}
  contains(node){return this.children.some(child=>child===node||child.contains(node))}
  setAttribute(key,value){this[key]=value;this.attrs[key]=String(value);if(key==='tabindex')this.tabIndex=Number(value);if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value}
  getAttribute(key){return this.attrs[key]??null}
  hasAttribute(key){return Object.hasOwn(this.attrs,key)}
  removeAttribute(key){delete this[key];delete this.attrs[key]}
  remove(){}
  matches(){return this.focusVisible===true}
  closest(){return this.hiddenAncestor?this:null}
  getBoundingClientRect(){const rect=this.rect||cat,dx=parseFloat(this.style.translate)||0;return {...rect,left:rect.left+dx,right:rect.right+dx,width:rect.right-rect.left,height:rect.bottom-rect.top}}
  getClientRects(){return [this.getBoundingClientRect()]}
 }
 const launch=new Node(),dialog=new Node(),pet=new Node(),avatar=new Node(),about=new Node(),doc=new Node(),win=new Node(),motion=new Node(),obstacles=[],observers=[];
 motion.matches=false;pet.dataset.state='idle';doc.documentElement={lang:'ru'};doc.readyState='complete';doc.hidden=false;
 avatar.tagName='IMG';pet.append(avatar);pet.querySelector=()=>avatar;launch.append(pet);launch.querySelector=()=>pet;dialog.querySelector=()=>about;
 doc.querySelector=selector=>selector.includes('.osiris-launch')?launch:doc.foreignDialog||null;
 doc.getElementById=()=>dialog;doc.querySelectorAll=()=>obstacles;doc.createElement=()=>new Node();
 let now=0,frame,plays=0,pauses=0;
 const context={document:doc,window:win,innerWidth:390,innerHeight:800,matchMedia:()=>motion,Date:{now:()=>now},requestAnimationFrame:fn=>{frame=fn;return 1},cancelAnimationFrame(){},MutationObserver:class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){}},Audio:class{play(){plays++;return Promise.resolve()}pause(){pauses++}}};
 vm.runInNewContext(readFileSync(new URL('./osiris-presence.js',import.meta.url),'utf8'),context);
 return {launch,dialog,pet,avatar,doc,win,motion,about,toggle:about.children[0].children[0],plays:()=>plays,pauses:()=>pauses,
  tick(time){now=time;frame(time)},
  setState(state){pet.dataset.state=state;for(const observer of observers)observer.fn()},
  obstacle(rect,{inDialog=false,hidden=false,tag='button',attrs={},controls=false}={}){const node=new Node();node.tagName=tag.toUpperCase();node.controls=controls;for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);node.rect=rect;node.hiddenAncestor=hidden;obstacles.push(node);if(inDialog)dialog.append(node);return node},
  obstacles
 };
}
