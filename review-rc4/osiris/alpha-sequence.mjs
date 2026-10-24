import {AlphaVideo} from './alpha-video.mjs';

const containedFit=(clip,width,height)=>{
 const ratio=(clip?.width||width)/(clip?.height||height);
 const h=Math.min(height,width/ratio),w=h*ratio;
 return {left:(width-w)/2,top:height-h,width:w,height:h};
};

/**
 * Two native decoders, one stable transparent stage.
 * fit(clip, width, height) returns {left, top, width, height} in stage pixels.
 * A load holds the current composite until the incoming first frame is decoded.
 * The extra detached 2D snapshot freezes a partly completed transition exactly;
 * it is not an additional video decoder.
 */
export class AlphaSequence {
 constructor(canvas,{
  fit=containedFit,transitionMs=180,
  rendererFactory=source=>new AlphaVideo(source),
  now=()=>performance.now(),
  requestFrame=callback=>requestAnimationFrame(callback),
  cancelFrame=handle=>cancelAnimationFrame(handle),
 }={}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});
  if(!this.ctx)throw Error('A transparent 2D stage is required.');
  this.fit=fit;this.transitionMs=Number.isFinite(transitionMs)?Math.max(0,transitionMs):180;
  this.now=now;this.requestFrame=requestFrame;this.cancelFrame=cancelFrame;
  this.width=Math.max(1,canvas.width||1);this.height=Math.max(1,canvas.height||1);
  this.active=null;this.pending=null;this.loading=false;this.ready=false;this.dead=false;
  this.loadVersion=0;this.playVersion=0;this.playing=false;this.endedVersion=-1;
  this.frame=null;this.transition=null;this.holding=false;this.hasPicture=false;
  const document=canvas.ownerDocument||globalThis.document;
  this.frozen=document.createElement('canvas');
  this.frozenContext=this.frozen.getContext('2d',{alpha:true});
  if(!this.frozenContext)throw Error('A transparent snapshot context is required.');
  this.slots=[];
  this.video=new EventTarget();
  for(const [key,fallback] of [['ended',false],['paused',true],['currentTime',0],['duration',NaN]]){
   Object.defineProperty(this.video,key,{enumerable:true,get:()=>this.active?.renderer.video[key]??fallback});
  }
  try{
   for(let i=0;i<2;i++){
    const source=document.createElement('canvas');
    source.hidden=true;source.style.display='none';source.setAttribute('aria-hidden','true');
    source.className='osiris-sequence-buffer';
    canvas.after(source);
    let renderer;
    try{renderer=rendererFactory(source);}catch(error){source.remove();throw error;}
    const slot={canvas:source,renderer,clip:null,loaded:false};
    slot.ended=()=>{
     if(this.dead||this.loading||!this.playing||this.active!==slot||!renderer.video.ended)return;
     if(this.endedVersion===this.playVersion)return;
     // Some browsers deliver ended before the final video-frame callback.
     // Flush that actual final decoded frame before a host starts the next load.
     renderer.draw?.();this._paint();
     this.endedVersion=this.playVersion;this.playing=false;
     this.video.dispatchEvent(new Event('ended'));
    };
    renderer.video.addEventListener('ended',slot.ended);
    this.slots.push(slot);
   }
  }catch(error){this.destroy();throw error;}
 }
 _cancelFrame(){
  if(this.frame!==null)this.cancelFrame(this.frame);
  this.frame=null;
 }
 _progress(){
  if(!this.transition)return 1;
  const transition=this.transition;
  const elapsed=transition.elapsed+(transition.paused?0:Math.max(0,this.now()-transition.started));
  return this.transitionMs?Math.max(0,Math.min(1,elapsed/this.transitionMs)):1;
 }
 _pauseFade(){
  if(this.transition&&!this.transition.paused){
   this.transition.elapsed=this._progress()*this.transitionMs;
   this.transition.paused=true;
  }
  this._cancelFrame();
 }
 _scheduleFade(){
  if(this.dead||!this.transition||this.transition.paused||this.frame!==null)return;
  this.frame=this.requestFrame(()=>{
   this.frame=null;
   if(this.dead||!this.transition||this.transition.paused)return;
   this._paint();this._scheduleFade();
  });
 }
 _resumeFade(){
  if(!this.transition)return;
  if(this.transition.paused){this.transition.paused=false;this.transition.started=this.now();}
  this._paint();this._scheduleFade();
 }
 _snapshot(){
  if(!this.hasPicture)return false;
  this.frozen.width=this.width;this.frozen.height=this.height;
  this.frozenContext.clearRect(0,0,this.width,this.height);
  this.frozenContext.drawImage(this.canvas,0,0);
  return true;
 }
 _pausePlayback(){
  this.playVersion++;this.playing=false;
  for(const slot of this.slots)slot.renderer.pause();
 }
 _abortPending(){
  if(!this.pending)return;
  this.loadVersion++;this.pending.controller.abort();this.pending=null;
  this.loading=false;this.ready=!!this.active?.loaded;
 }
 _drawActive(alpha=1){
  if(!this.active?.loaded)return;
  const box=this.fit(this.active.clip,this.width,this.height);
  if(!box||!['left','top','width','height'].every(key=>Number.isFinite(box[key]))||box.width<=0||box.height<=0){
   throw Error('Invalid character layout.');
  }
  this.ctx.globalAlpha=alpha;
  this.ctx.save();
  try{
   if(box.mirror)this.ctx.setTransform(-1,0,0,1,2*box.left+box.width,0);
   this.ctx.drawImage(this.active.canvas,box.left,box.top,box.width,box.height);
  }finally{this.ctx.restore();}
 }
 _drawFrozen(alpha=1){
  // A dock resize may change the stage aspect ratio while loading or paused.
  // Preserve the shape of the held composite, aligned to the new floor.
  const scale=Math.min(this.width/this.frozen.width,this.height/this.frozen.height);
  const width=this.frozen.width*scale,height=this.frozen.height*scale;
  this.ctx.globalAlpha=alpha;
  this.ctx.drawImage(this.frozen,(this.width-width)/2,this.height-height,width,height);
 }
 _paint(){
  if(this.dead)return;
  const ctx=this.ctx;
  ctx.save();
  try{
   ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
   ctx.clearRect(0,0,this.width,this.height);
   if(this.holding){
    if(this.hasPicture)this._drawFrozen();
    return;
   }
   if(!this.active?.loaded)return;
   const progress=this._progress();
   if(this.transition&&progress<1){
    // 'lighter' adds weighted premultiplied colours AND alpha. Source-over would
    // make coincident half-opacity silhouettes translucent during the fade.
    ctx.globalCompositeOperation='lighter';this._drawFrozen(1-progress);
    this._drawActive(progress);
   }else{
    this.transition=null;this._cancelFrame();this._drawActive();
   }
   this.hasPicture=true;
  }finally{ctx.restore();}
 }
 resize(width,height){
  if(this.dead||!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return false;
  width=Math.min(8192,Math.round(width));height=Math.min(8192,Math.round(height));
  if(width===this.width&&height===this.height)return true;
  this.width=width;this.height=height;this.canvas.width=width;this.canvas.height=height;
  this._paint();return true;
 }
 async load(src,{signal,clip}={}){
  if(this.dead||signal?.aborted)throw new DOMException('Cancelled','AbortError');
  this._abortPending();this._pausePlayback();this._pauseFade();
  const held=this._snapshot();
  this.transition=null;this.holding=held;
  const previous=this.active;
  const incoming=this.slots.find(slot=>slot!==previous)||this.slots[0];
  const version=++this.loadVersion,controller=new AbortController();
  const aborted=()=>controller.abort();
  signal?.addEventListener('abort',aborted,{once:true});
  this.pending={controller,version};this.loading=true;this.ready=false;
  incoming.loaded=false;
  try{
   await incoming.renderer.load(src,{signal:controller.signal});
   if(this.dead||version!==this.loadVersion||controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
   incoming.clip=clip||{width:incoming.canvas.width,height:incoming.canvas.height};
   incoming.loaded=true;this.active=incoming;this.ready=true;this.loading=false;this.pending=null;
   this.holding=false;this.endedVersion=-1;
   this.transition=held&&this.transitionMs?{elapsed:0,started:this.now(),paused:false}:null;
   try{this._paint();this._scheduleFade();}
   catch(error){
    this._cancelFrame();this.transition=null;this.active=previous;this.ready=!!previous?.loaded;
    this.holding=held;this._paint();throw error;
   }
  }catch(error){
   if(version===this.loadVersion&&!this.dead){
    this.loading=false;this.pending=null;this.ready=!!this.active?.loaded;
    this.holding=held;this._paint();
   }
   throw error;
  }finally{signal?.removeEventListener('abort',aborted);}
 }
 async play(onFrame=()=>{}){
  if(this.dead||!this.ready||this.loading||!this.active)throw new DOMException('Not ready','AbortError');
  this._pausePlayback();
  const version=this.playVersion,slot=this.active;
  this.playing=true;this.endedVersion=-1;
  // A failed/cancelled load may have kept a composite snapshot. An explicit play
  // resumes the previous valid native clip rather than an aborted incoming one.
  this.holding=false;this._resumeFade();
  try{
   await slot.renderer.play(time=>{
    if(this.dead||version!==this.playVersion||slot!==this.active||!this.playing)return;
    this._paint();onFrame(time);
   });
  }catch(error){
   if(!this.dead&&version===this.playVersion){this.playing=false;this._pauseFade();this._paint();}
   throw error;
  }
 }
 pause(){
  if(this.dead)return;
  this._abortPending();this._pausePlayback();this._pauseFade();this._paint();
 }
 async seek(time){
  if(!Number.isFinite(time))throw new TypeError('Seek time must be finite.');
  this.pause();
  if(this.dead||!this.ready||!this.active)throw new DOMException('Not ready','AbortError');
  const version=this.playVersion,slot=this.active;
  await slot.renderer.seek(time);
  if(this.dead||version!==this.playVersion||slot!==this.active)throw new DOMException('Cancelled','AbortError');
  this.transition=null;this.holding=false;this.endedVersion=-1;this._paint();
 }
 destroy(){
  if(this.dead)return;
  this._abortPending();this._pausePlayback();this._pauseFade();this.dead=true;this.ready=false;
  for(const slot of this.slots){
   slot.renderer.video.removeEventListener('ended',slot.ended);slot.renderer.destroy();slot.canvas.remove();
  }
  this.slots=[];this.active=null;this.transition=null;this.hasPicture=false;
  this.ctx.clearRect(0,0,this.width,this.height);this.frozen.width=this.frozen.height=1;
 }
}
