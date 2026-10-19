import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=name=>readFileSync(new URL(name,import.meta.url),'utf8');

test('gallery films start silently and explicit unmute yields to an active voice conversation',async()=>{
 const events={},docEvents={},players=[];
 class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.isConnected=true;this.hidden=false;}
  append(...nodes){this.children.push(...nodes);}
  prepend(node){this.children.unshift(node);}
  setAttribute(key,value){this[key]=value;}
  querySelectorAll(tag){return this.children.filter(node=>node.tagName===tag);}
  addEventListener(){}
 }
 const nodes=Object.fromEntries(['#galleryImage','#galleryCaption','.gallery-stage','#galleryDialog','#cards'].map(key=>[key,new Element('div')]));
 const document={hidden:false,createElement:tag=>new Element(tag),querySelectorAll:()=>[],addEventListener:(name,fn)=>docEvents[name]=fn};
 const window={addEventListener:(name,fn)=>events[name]=fn,YT:{Player:function(frame,{events}){
  this.frame=frame;this.events=events;this.muted=false;this.plays=0;this.pauses=0;
  this.mute=()=>{this.muted=true;};this.unMute=()=>{this.muted=false;};this.isMuted=()=>this.muted;
  this.playVideo=()=>{this.plays++;};this.pauseVideo=()=>{this.pauses++;};this.getPlayerState=()=>2;players.push(this);
 }}};
 const context={document,window,$:selector=>nodes[selector],URL,URLSearchParams,location:{origin:'https://example.test'},galleryPlace:{name:'Bergen'},galleryIndex:0,galleryPhotos:[{}],safeURL:value=>value,MutationObserver:class{observe(){}},fetch:async()=>({ok:false}),console};
 vm.createContext(context);vm.runInContext(source('./flight.js'),context);
 context.showGalleryMotion({youtubeId:'12345678901',title:'A visit',source:'https://example.test/film'});
 await Promise.resolve();await Promise.resolve();
 const player=players[0],buttons=nodes['.gallery-stage'].children[0].children[1].children;
 assert.equal(new URL(player.frame.src).searchParams.get('mute'),'1');
 player.events.onReady({target:player});assert.equal(player.muted,true);assert.equal(player.plays,0);
 buttons[0].onclick();assert.equal(player.plays,1);assert.equal(player.muted,true,'Play does not imply unmute');
 buttons[1].onclick();assert.equal(player.muted,false,'explicit Unmute remains available');
 events['fjord:voice-activity']({detail:{active:true}});assert.equal(player.muted,true);assert.equal(player.pauses,1);
 buttons[1].onclick();assert.equal(player.muted,true,'film cannot speak over an active conversation');
 events['fjord:voice-activity']({detail:{active:false}});assert.equal(player.plays,1,'no surprise audio resume after the conversation');
 buttons[1].onclick();assert.equal(player.muted,false);
 document.hidden=true;docEvents.visibilitychange();assert.equal(player.pauses,2);
});

test('welcome film starts muted, yields to voice and never resumes audio automatically',()=>{
 const code=source('./welcome-film.js'),events={},docEvents={},videoEvents={};let pauses=0;
 const video={setAttribute(){},addEventListener:(name,fn)=>videoEvents[name]=fn,pause(){pauses++;}};
 const document={hidden:false,createElement:()=>video,addEventListener:(name,fn)=>docEvents[name]=fn},window={addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(code.slice(code.indexOf("const video=document.createElement('video');"),code.indexOf('const captionTracks=[];')),{document,window});
 assert.equal(video.muted,true);assert.equal(video.defaultMuted,true);assert.equal(video.controls,true);
 video.muted=false;videoEvents.volumechange();assert.equal(video.muted,false,'native explicit sound choice works outside voice');
 events['fjord:voice-activity']({detail:{active:true}});assert.equal(video.muted,true);assert.equal(pauses,1);
 video.muted=false;videoEvents.volumechange();assert.equal(video.muted,true);
 events['fjord:voice-activity']({detail:{active:false}});assert.equal(video.muted,true,'ending voice does not restore unexpected audio');
 document.hidden=true;docEvents.visibilitychange();assert.equal(pauses,2);
});
