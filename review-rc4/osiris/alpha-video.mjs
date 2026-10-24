// Decodes a portable side-by-side RGB/alpha video, retaining native frame timing.
// The right half stores alpha as greyscale; no colour key is applied to the cat.
// Match the WebGL smoothstep exactly in the software renderer. MP4 compression
// can lift transparent black by a few levels; displaying that raw mask leaves
// pale source-background speckles on dark pages.
const ALPHA_BYTES=Uint8ClampedArray.from({length:256},(_,value)=>{
  const t=Math.max(0,Math.min(1,(value/255-.025)/.95));
  return Math.round(255*t*t*(3-2*t));
});
export function compositePackedPixels(rgb,mask) {
  if(rgb.length!==mask.length||rgb.length%4)throw new TypeError('Packed planes must have matching RGBA dimensions.');
  for(let i=0;i<rgb.length;i+=4){
    const alpha=ALPHA_BYTES[mask[i]];rgb[i+3]=alpha;
    if(!alpha)rgb[i]=rgb[i+1]=rgb[i+2]=0;
  }
  return rgb;
}

export class AlphaVideo {
  constructor(canvas) {
    this.canvas = canvas;
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = 'auto';
    this.video.setAttribute('aria-hidden', 'true');
    this.video.className = 'osiris-decoder';
    canvas.after(this.video);
    this.frame = 0;
    this.version = 0;
    this.playGeneration = 0;
    this.ready = false;
    this.dead = false;
    this.cancelLoad = null;
    this.cancelSeek = null;
    this.gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:true, preserveDrawingBuffer:true});
    if (this.gl) this.setupGL();
    else {
      this.ctx = canvas.getContext('2d');
      this.scratch = document.createElement('canvas');
      this.sctx = this.scratch.getContext('2d', {willReadFrequently:true});
    }
  }
  setupGL() {
    const gl = this.gl;
    const shader = (type, source) => {
      const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
      return s;
    };
    this.program = gl.createProgram();
    gl.attachShader(this.program, shader(gl.VERTEX_SHADER,
      'attribute vec2 p; varying vec2 uv; void main(){uv=vec2((p.x+1.0)*0.5, (1.0-p.y)*0.5);gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(this.program, shader(gl.FRAGMENT_SHADER,
      'precision mediump float; varying vec2 uv; uniform sampler2D movie; void main(){vec3 c=texture2D(movie,vec2(uv.x*0.5,uv.y)).rgb;float a=texture2D(movie,vec2(0.5+uv.x*0.5,uv.y)).r;a=smoothstep(0.025,0.975,a);gl_FragColor=vec4(c*a,a);}'));
    gl.linkProgram(this.program); gl.useProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(this.program));
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const attr = gl.getAttribLocation(this.program, 'p');
    gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
    this.texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,this.texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }
  async load(src, {signal}={}) {
    if(this.dead)throw new DOMException('Destroyed','AbortError');
    this.cancelLoad?.();
    const version = ++this.version;
    this.pause();
    this.ready=false;this.clear();
    return new Promise((resolve,reject) => {
      let timeout;
      const clean = () => {
        clearTimeout(timeout);
        this.video.removeEventListener('loadeddata',ready);
        this.video.removeEventListener('error',error);
        signal?.removeEventListener('abort',aborted);
        if(this.cancelLoad===aborted)this.cancelLoad=null;
      };
      const ready = () => {
        if (version !== this.version || signal?.aborted||this.dead)return aborted();
        const w=this.video.videoWidth,h=this.video.videoHeight;
        if(this.video.readyState<2||!Number.isInteger(w)||w<=0||w%2||!Number.isInteger(h)||h<=0)return error();
        try {
          this.canvas.width=w/2;this.canvas.height=h;this.ready=true;
          this.draw();clean();resolve();
        }catch {error();}
      };
      const fail=reason=>{
        clean();
        if(version===this.version){this.ready=false;this.clear();}
        reject(reason);
      };
      const error = () => fail(Error('Не удалось загрузить прозрачное движение.'));
      const aborted = () => fail(new DOMException('Cancelled','AbortError'));
      this.cancelLoad=aborted;
      if (signal?.aborted) return aborted();
      timeout=setTimeout(error,30000);
      this.video.addEventListener('loadeddata',ready,{once:true});
      this.video.addEventListener('error',error,{once:true});
      signal?.addEventListener('abort',aborted,{once:true});
      this.video.src = src; this.video.load();
    });
  }
  clear() {
    if(this.gl){this.gl.clearColor(0,0,0,0);this.gl.clear(this.gl.COLOR_BUFFER_BIT);}
    else this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height);
  }
  draw() {
    if (this.dead||!this.ready||this.video.readyState < 2) return false;
    const {width:w,height:h} = this.canvas;
    if (this.gl) {
      const gl=this.gl;
      gl.viewport(0,0,w,h);
      gl.bindTexture(gl.TEXTURE_2D,this.texture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.video);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    } else {
      if(this.scratch.width!==w*2)this.scratch.width=w*2;
      if(this.scratch.height!==h)this.scratch.height=h;
      this.sctx.drawImage(this.video,0,0,w*2,h);
      const rgb=this.sctx.getImageData(0,0,w,h), alpha=this.sctx.getImageData(w,0,w,h);
      compositePackedPixels(rgb.data,alpha.data);
      this.ctx.putImageData(rgb,0,0);
    }
    return true;
  }
  async play(onFrame=()=>{}) {
    if(this.dead||!this.ready)throw new DOMException('Not ready','AbortError');
    this.pause();
    const generation=this.playGeneration;
    this.onFrame=onFrame;
    await this.video.play();
    if(generation!==this.playGeneration)return;
    const update=()=>{
      if(generation!==this.playGeneration)return;
      if(this.draw())this.onFrame?.(this.video.currentTime);
      if(!this.video.paused&&!this.video.ended) {
        if(this.video.requestVideoFrameCallback) this.frame=this.video.requestVideoFrameCallback(update);
        else this.frame=requestAnimationFrame(update);
      }
    };
    update();
  }
  pause() {
    this.playGeneration++;
    this.cancelSeek?.();
    this.video.pause();
    if (this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.frame);
    else cancelAnimationFrame(this.frame);
  }
  async seek(time) {
    this.pause();
    if(this.dead||!this.ready)throw new DOMException('Not ready','AbortError');
    if(!Number.isFinite(time))throw new TypeError('Seek time must be finite.');
    const version=this.version,target=Math.max(0,Math.min(time,Math.max(0,this.video.duration-.05)));
    if(Math.abs(this.video.currentTime-target)<0.01&&!this.video.seeking){this.draw();return;}
    await new Promise((resolve,reject)=>{
      let timeout;
      const clean=()=>{
        clearTimeout(timeout);this.video.removeEventListener('seeked',done);this.video.removeEventListener('error',failed);
        if(this.cancelSeek===cancel)this.cancelSeek=null;
      };
      const cancel=()=>{clean();reject(new DOMException('Cancelled','AbortError'));};
      const failed=()=>{clean();reject(Error('Не удалось перейти к кадру.'));};
      const done=()=>{
        if(version!==this.version||this.dead||!this.ready)return cancel();
        if(this.video.seeking||Math.abs(this.video.currentTime-target)>.1)return;
        clean();resolve();
      };
      this.cancelSeek=cancel;
      this.video.addEventListener('seeked',done);this.video.addEventListener('error',failed,{once:true});
      timeout=setTimeout(failed,5000);
      try{this.video.currentTime=target;}catch{failed();}
    });
    if(version!==this.version||this.dead||!this.ready)throw new DOMException('Cancelled','AbortError');
    this.draw();
  }
  destroy() {this.dead=true;this.cancelLoad?.();this.version++;this.pause();this.ready=false;this.clear();this.video.removeAttribute('src');this.video.load();this.video.remove();}
}
