/** Portable native3D presence adapter. No chat/voice/AI/provider implementation. */
import * as THREE from './core/quadruped-vendor/three.module.js';
import {createQuadrupedAvatar} from './core/quadruped-avatar-head-shape-v1.mjs';
import {loadContinuousQuadrupedSkinFactory} from './core/sole-skin-v2-cache.mjs';
import {projectedSurfaceBounds} from './core/projected-surface-bounds.mjs';
import {createYarnProp} from './core/quadruped-yarn-prop.mjs';
import {loadQuadrupedSkin} from './core/quadruped-skin.mjs';
import {createAttentionAvatar} from './core/quadruped-cursor-attention.mjs';
import {createLivingSiteController} from './living-controller.mjs';
import {createScreenSpace,ndcRect,fitRectShift,presenceGate} from './screen-space.mjs';
import {planRoute,clampCenter} from '../viewport-roaming.mjs';
const VERSION='living3d-20261021-v1';
export async function mountLivingSitePresence({launch,dialog,pet,random=Math.random}={}){
 if(!launch||!dialog||!pet||launch.dataset.osirisLife)return null;
 launch.dataset.osirisLife='loading';launch.dataset.osirisPresence='fallback';
 const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),20000),startAbort=()=>abort.abort();window.addEventListener('pagehide',startAbort,{once:true});
 let skinFactory,skinTexture,startupFailed=false;
 try{[skinFactory,skinTexture]=await Promise.all([loadContinuousQuadrupedSkinFactory(THREE,{fetchImpl:(url,options={})=>fetch(url,{...options,signal:abort.signal})}),loadQuadrupedSkin(THREE).then(texture=>{if(startupFailed||abort.signal.aborted||!pet.isConnected){texture.dispose();throw new DOMException('Living presence mount cancelled','AbortError');}skinTexture=texture;return texture;})]);if(abort.signal.aborted||!pet.isConnected)throw new DOMException('Living presence mount cancelled','AbortError');}
 catch(e){startupFailed=true;skinTexture?.dispose();delete launch.dataset.osirisLife;if(abort.signal.aborted)throw new DOMException('Living presence mount cancelled','AbortError');throw e;}finally{clearTimeout(timeout);window.removeEventListener('pagehide',startAbort);}
 const canvas=document.createElement('canvas'),hitbox=document.createElement('button'),nameLabel=document.createElement('span'),originalName=launch.querySelector('.fjord-ai-pet-name');canvas.className='osiris-living-canvas';canvas.setAttribute('aria-hidden','true');
 const originalNameVisibility=originalName?.style.visibility;nameLabel.className='osiris-living-name';nameLabel.setAttribute('aria-hidden','true');nameLabel.textContent=originalName?.textContent||'Osiris';Object.assign(nameLabel.style,{position:'fixed',zIndex:'2147482002',pointerEvents:'none',transform:'translateX(-50%)',padding:'3px 9px',border:'1px solid #b2ccd5',borderRadius:'20px',background:'#12384df2',color:'#fff',font:'700 11px/1.2 Manrope,sans-serif',whiteSpace:'nowrap'});
 Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'2147482000',pointerEvents:'none',background:'transparent'});
 hitbox.type='button';hitbox.tabIndex=-1;hitbox.setAttribute('aria-hidden','true');hitbox.className='osiris-living-hitbox';
 Object.assign(hitbox.style,{position:'fixed',zIndex:'2147482001',margin:'0',padding:'0',border:'0',background:'transparent',opacity:'0',cursor:'grab',touchAction:'none'});
 let renderer,avatar;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;avatar=createAttentionAvatar(THREE,createQuadrupedAvatar(THREE,{skinTexture,continuousSurface:true,skinFactory}));}
 catch(e){renderer?.dispose();avatar?.dispose();skinTexture?.dispose();delete launch.dataset.osirisLife;throw e;}
 canvas.dataset.osirisVersion=VERSION;canvas.dataset.osirisContext='webgl';canvas.dataset.osirisTexture='osiris-rig-parts-v1';document.body.append(canvas,hitbox,nameLabel);if(originalName)originalName.style.visibility='hidden';
 const scene=new THREE.Scene(),stage=new THREE.Group(),yarn=createYarnProp(THREE);stage.add(avatar.root);scene.add(stage,yarn.root);
 scene.add(new THREE.HemisphereLight(0xffffff,0x827474,2.2));const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(4,7,8);scene.add(key);const fill=new THREE.DirectionalLight(0xe7eafb,.7);fill.position.set(-5,3,-2);scene.add(fill);
 const controller=createLivingSiteController(),camera=new THREE.OrthographicCamera(),offset={x:0,y:0,z:0},events=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pointer=new THREE.Vector2(),lookRay=new THREE.Raycaster(),lookPlane=new THREE.Plane(),lookPoint=new THREE.Vector3(),lookNormal=new THREE.Vector3();let pointerActive=false,drawDt=0;
 const originalVisibility=pet.style.visibility,originalLife=launch.dataset.osirisMotion;
 let mapping,last=performance.now(),lastDiagnostics=-Infinity,raf=0,dead=false,paused=false,voice=false,hover=false,drag=null,movement=null,nextAmbient=8,ambientClock=0,lastAction='',lastBounds=null,lastMeshBounds=null,gate={blocked:false,busy:false},docked=false,suspended=false,errors=[],lastReport=null,initial=true,dockShift=null,toyRecord=null,dirty=true;
 const preferences={roaming:window.OsirisSettings?.preferences?.roaming!==false,animations:window.OsirisSettings?.preferences?.animations!==false,siteActions:window.OsirisSettings?.preferences?.siteActions!==false};
 const navigation={attempts:0,rejected:0,last:null};
 const listen=(node,event,fn,options)=>{node.addEventListener(event,fn,options);events.push(()=>node.removeEventListener(event,fn,options));};
 function resize(){if(mapping?.width===innerWidth&&mapping?.height===innerHeight)return;dirty=true;mapping=createScreenSpace({width:Math.max(1,innerWidth),height:Math.max(1,innerHeight),pixelsPerUnit:Math.max(1,Math.min(58,(innerWidth-24)/5.8,(innerHeight-24)/3.3))});camera.left=-innerWidth/(2*mapping.pixelsPerUnit);camera.right=-camera.left;camera.top=innerHeight/(2*mapping.pixelsPerUnit);camera.bottom=-camera.top;camera.near=.1;camera.far=200;camera.position.set(...['x','y','z'].map(k=>mapping.cameraPosition[k]));camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderer.setSize(innerWidth,innerHeight,false);if(movement)cancelMove();}
 function sync(){
  const focused=document.activeElement,previousDocked=docked;
  docked=!!(dialog.open&&!dialog.classList.contains('osiris-compact')&&!dialog.classList.contains('fjord-ai-auth-pending')||!launch.contains(pet)||launch.hidden);
  const previousBlocked=gate.blocked;gate=presenceGate({paused,hidden:document.hidden||suspended,reduced:reduced.matches,animations:preferences.animations,docked,voice,typing:dialog.contains(focused)&&/^(INPUT|TEXTAREA)$/.test(focused?.tagName||''),state:pet.dataset.state});
  if(gate.blocked!==previousBlocked||docked!==previousDocked)dirty=true;
  if(gate.blocked&&!previousBlocked)cancelMove();
  controller.setPaused(gate.blocked||!!drag?.active);
  launch.dataset.osirisLife=gate.blocked?'paused':gate.busy?'conversation':'ready';
  if(docked){if(movement)cancelMove();if(canvas.parentNode!==dialog)dialog.append(canvas);}else if(canvas.parentNode!==document.body)document.body.append(canvas);
  hitbox.hidden=nameLabel.hidden=docked||document.hidden;pet.style.visibility='hidden';
 }
 function obstacles(hardOnly=false){const found=[];for(const node of document.querySelectorAll('a[href],button,input,select,textarea,summary,[data-osiris-no-roam]')){if(node===hitbox||node===launch||launch.contains(node)||node.closest('dialog:not([open]),[hidden]'))continue;const hard=node.hasAttribute('data-osiris-no-roam');if(hardOnly&&!hard)continue;for(const r of node.getClientRects())if(r.width&&r.height&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight&&(hard||r.width<=240&&r.height<=96))found.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom});}return found;}
 function finishMove(success){const previous=movement;if(!previous)return;movement=null;previous.signal?.removeEventListener('abort',previous.abort);previous.resolve(success);nextAmbient=ambientClock+8;}
 function cancelMove(){const had=!!movement;controller.cancelRoute();finishMove(false);return had;}
 function screenRoot(){const p=controller.snapshot().root;return mapping.project({x:p.x+offset.x,y:0,z:p.z+offset.z});}
 function moveTo(target,{reason='command',signal}={}){
  if(dead||gate.blocked||docked||drag||signal?.aborted||!Number.isFinite(target?.x)||!Number.isFinite(target?.y)||(reason==='ambient'&&!preferences.roaming))return Promise.resolve(false);
  if(movement||controller.busy)return Promise.resolve(false);
  // Actual full-surface extent plus route reserve. Large clickable content cards
  // are page content, not physical walls for an overlaid screen mascot.
  const footprint={width:(lastBounds?.width??240)+20,height:(lastBounds?.height??160)+20},view={width:innerWidth,height:innerHeight},actualStart=lastBounds?{x:lastBounds.x,y:lastBounds.y}:screenRoot(),start=clampCenter(actualStart,footprint,view,12),goal=clampCenter(target,footprint,view,12),controls=obstacles();
  navigation.attempts++;let policy='avoid-controls',path=goal&&planRoute({start,target:goal,footprint,viewport:view,obstacles:controls,clearance:12});
  if(!path&&goal){policy='content-overlay-escape';path=planRoute({start,target:goal,footprint,viewport:view,obstacles:obstacles(true),clearance:12});}
  navigation.last={actualStart,start:{...start},goal,footprint,obstacles:controls.length,policy,accepted:!!path};if(!path){navigation.rejected++;return Promise.resolve(false);}
  if(Math.hypot(start.x-actualStart.x,start.y-actualStart.y)>1)path.unshift(start);if(!path.length)return Promise.resolve(true);
  const root=screenRoot(),bias={x:root.x-actualStart.x,y:root.y-actualStart.y};
  const world=path.map(p=>{const q=mapping.floor({x:p.x+bias.x,y:p.y+bias.y});return {x:q.x-offset.x,z:q.z-offset.z};});if(!controller.startRoute(world))return Promise.resolve(false);
  nextAmbient=ambientClock+12;
  return new Promise(resolve=>{const onAbort=()=>cancelMove();movement={resolve,signal,abort:onAbort,reason,target:{...goal}};signal?.addEventListener('abort',onAbort,{once:true});});
 }
 function actionRoom(){const p=screenRoot(),r=190;return p.x>r&&p.x<innerWidth-r&&p.y>170&&p.y<innerHeight-100;}
 function command(id){if(dead||gate.blocked||docked)return false;if(!['yarn','play','stretch','lie-down','jump-panther-short','jump','rest'].includes(id))return false;if(id!=='rest'&&!actionRoom())return false;cancelMove();const accepted=controller.command(id);if(accepted){lastAction=id;nextAmbient=ambientClock+30;}return accepted;}
 function setPaused(value){if(dead)return;paused=!!value;sync();}
 function setPreferences(value={}){if(dead)return;for(const k of ['roaming','animations','siteActions'])if(typeof value?.[k]==='boolean')preferences[k]=value[k];if(!preferences.siteActions||!preferences.roaming&&movement?.reason==='ambient')cancelMove();sync();}
 function draw(){
  const p=controller.snapshot();stage.position.set(offset.x,offset.y,offset.z);
  let targetWorld=null;if(pointerActive&&!docked){camera.getWorldDirection(lookNormal);lookPlane.setFromNormalAndCoplanarPoint(lookNormal,lookPoint.set(p.body.head.x+offset.x,p.body.head.y,p.body.head.z+offset.z));lookRay.setFromCamera(pointer,camera);if(lookRay.ray.intersectPlane(lookPlane,lookPoint))targetWorld={x:lookPoint.x,y:lookPoint.y,z:lookPoint.z};}
  lastReport=avatar.update(p,{targetWorld,dt:drawDt,enabled:true});if(lastReport.skinWarnings?.length)throw new Error(lastReport.skinWarnings.join('; '));
  const activeBall=p.play?.ball,completed=p.toys?.[0];
  if(activeBall)toyRecord={key:null,ball:{...activeBall,x:activeBall.x+offset.x,z:activeBall.z+offset.z,opacity:1}};
  else if(completed){const key=`${completed.x}:${completed.y}:${completed.z}`;if(toyRecord?.key!==key)toyRecord={key,ball:{...completed,x:completed.x+offset.x,z:completed.z+offset.z}};toyRecord.ball.opacity=completed.opacity;}
  else toyRecord=null;yarn.update(toyRecord?.ball??null,p.body.forward);
  stage.updateMatrixWorld(true);let bounds=projectedSurfaceBounds(THREE,stage,camera),rect=ndcRect(bounds,innerWidth,innerHeight);
  if(initial){const anchor=pet.getBoundingClientRect(),goal=clampCenter({x:anchor.left+anchor.width/2,y:anchor.top+anchor.height/2},{width:Math.max(280,rect.width),height:Math.max(230,rect.height)},{width:innerWidth,height:innerHeight},12),a=mapping.floor(goal),b=mapping.floor({x:rect.x,y:rect.y});offset.x+=a.x-b.x;offset.z+=a.z-b.z;initial=false;stage.position.set(offset.x,0,offset.z);bounds=projectedSurfaceBounds(THREE,stage,camera);rect=ndcRect(bounds,innerWidth,innerHeight);}
  if(docked){const anchor=pet.getBoundingClientRect(),a=mapping.floor({x:anchor.left+anchor.width/2,y:anchor.top+anchor.height/2}),b=mapping.floor({x:rect.x,y:rect.y});dockShift={x:a.x-b.x,z:a.z-b.z};stage.position.x+=dockShift.x;stage.position.z+=dockShift.z;rect={...rect,left:rect.left+anchor.left+anchor.width/2-rect.x,right:rect.right+anchor.left+anchor.width/2-rect.x,top:rect.top+anchor.top+anchor.height/2-rect.y,bottom:rect.bottom+anchor.top+anchor.height/2-rect.y,x:anchor.left+anchor.width/2,y:anchor.top+anchor.height/2};}
  else{dockShift=null;const shift=fitRectShift(rect,{width:innerWidth,height:innerHeight},8);if(shift.x||shift.y){const a=mapping.floor({x:shift.x,y:shift.y}),b=mapping.floor({x:0,y:0});offset.x+=a.x-b.x;offset.z+=a.z-b.z;stage.position.set(offset.x,0,offset.z);rect={...rect,left:rect.left+shift.x,right:rect.right+shift.x,top:rect.top+shift.y,bottom:rect.bottom+shift.y,x:rect.x+shift.x,y:rect.y+shift.y};}}
  if(bounds.invalid||bounds.clippedDepth)throw new Error('Invalid/depth-clipped actual avatar bounds');lastBounds=rect;lastMeshBounds={...bounds,minX:rect.left/innerWidth*2-1,maxX:rect.right/innerWidth*2-1,minY:1-rect.bottom/innerHeight*2,maxY:1-rect.top/innerHeight*2,overflow:rect.left<0||rect.right>innerWidth||rect.top<0||rect.bottom>innerHeight};
  Object.assign(hitbox.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});Object.assign(nameLabel.style,{left:`${rect.x}px`,top:`${Math.min(innerHeight-24,rect.bottom+2)}px`});renderer.render(scene,camera);
  launch.dataset.osirisScene=p.sitePresence.stage;return p;
 }
 function tick(now){if(dead)return;const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;
  try{
   sync();drawDt=gate.blocked||drag?.active?0:dt;if(!gate.blocked&&!drag?.active){controller.step(dt);ambientClock+=dt;dirty=true;}
   const p=controller.snapshot();if(p.sitePresence.error){if(!errors.some(e=>e.message===p.sitePresence.error.message))errors.push({...p.sitePresence.error,time:p.time});paused=true;sync();}if(movement&&['arrived','cancelled','failed'].includes(p.sitePresence.routeResult)&&!p.sitePresence.travelling)finishMove(p.sitePresence.routeResult==='arrived');
   if(!gate.blocked&&!gate.busy&&!hover&&!drag&&!movement&&controller.quiet&&preferences.roaming&&ambientClock>=nextAmbient){nextAmbient=ambientClock+10+random()*8;if(random()<.30&&actionRoom())command(lastAction==='stretch'?'yarn':'stretch');else{const zones=[[.25,.25],[.50,.25],[.75,.25],[.25,.5],[.50,.5],[.75,.5],[.25,.75],[.50,.75],[.75,.75]],first=Math.floor(random()*zones.length);for(let i=0;i<zones.length&&!movement;i++){const q=zones[(first+i)%zones.length];if(lastBounds&&Math.hypot(innerWidth*q[0]-lastBounds.x,innerHeight*q[1]-lastBounds.y)<90)continue;void moveTo({x:innerWidth*q[0],y:innerHeight*q[1]},{reason:'ambient'});}if(!movement)nextAmbient=ambientClock+4;}}
   if(dirty&&!document.hidden){draw();dirty=false;}
  }catch(e){dirty=false;if(errors.length<8)errors.push({message:e.message,time:controller.rig.time});paused=true;controller.setPaused(true);finishMove(false);launch.dataset.osirisLife='paused';}
  updateDiagnostics(now);raf=requestAnimationFrame(tick);
 }
 function endDrag(){if(!drag)return;const was=drag.active;drag=null;if(was){hitbox.style.cursor='grab';nextAmbient=ambientClock+12;sync();}}
 listen(hitbox,'pointerdown',e=>{if(e.isPrimary===false||e.button!==0||docked)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,offset:{...offset},active:false};hitbox.setPointerCapture?.(e.pointerId);});
 listen(hitbox,'pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.active&&Math.hypot(dx,dy)<6)return;if(!drag.active){drag.active=true;cancelMove();sync();hitbox.style.cursor='grabbing';}e.preventDefault();const a=mapping.floor({x:dx,y:dy}),b=mapping.floor({x:0,y:0});offset.x=drag.offset.x+a.x-b.x;offset.z=drag.offset.z+a.z-b.z;dirty=true;});
 listen(hitbox,'pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const active=drag.active;endDrag();if(!active){launch.focus();launch.click();}});
 listen(hitbox,'pointercancel',endDrag);listen(hitbox,'lostpointercapture',endDrag);listen(hitbox,'pointerenter',()=>{hover=true;});listen(hitbox,'pointerleave',()=>{hover=false;});
 listen(window,'pointermove',e=>{pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);pointerActive=true;});listen(window,'blur',()=>{pointerActive=false;});listen(window,'pointerout',e=>{if(!e.relatedTarget)pointerActive=false;});
 listen(window,'resize',()=>{resize();sync();});listen(document,'visibilitychange',sync);listen(reduced,'change',sync);listen(dialog,'focusin',sync);listen(dialog,'focusout',()=>queueMicrotask(sync));
 listen(window,'fjord:voice-activity',e=>{voice=e.detail?.active===true;sync();});listen(window,'osiris:settings-changed',e=>setPreferences(e.detail?.preferences));
 listen(document,'keydown',e=>{if(e.key==='Escape'){endDrag();cancelMove();setPaused(true);}});
 const observer=new MutationObserver(sync);observer.observe(pet,{attributes:true,attributeFilter:['data-state']});observer.observe(dialog,{attributes:true,attributeFilter:['class','open']});observer.observe(launch,{attributes:true,attributeFilter:['hidden']});
 function destroy(){if(dead)return;dead=true;cancelMove();cancelAnimationFrame(raf);events.forEach(off=>off());observer.disconnect();avatar.dispose();skinTexture.dispose();yarn.dispose();renderer.dispose();canvas.remove();hitbox.remove();nameLabel.remove();if(originalName)originalName.style.visibility=originalNameVisibility;pet.style.visibility=originalVisibility;delete launch.dataset.osirisLife;delete launch.dataset.osirisScene;delete launch.dataset.osirisLivingVersion;if(originalLife===undefined)delete launch.dataset.osirisMotion;else launch.dataset.osirisMotion=originalLife;if(window.OsirisPresence===api)delete window.OsirisPresence;}
 listen(window,'pagehide',e=>{if(!e.persisted)destroy();else{suspended=true;sync();}});listen(window,'pageshow',()=>{suspended=false;last=performance.now();sync();});
 const api={command,setPaused,setPreferences,moveTo,interactWith:async()=>{cancelMove();return false;},cancelMove,destroy,snapshot:()=>{const p=controller.snapshot();return {version:VERSION,kind:'native3d',paused,blocked:gate.blocked,conversation:gate.busy,ready:true,loading:false,held:gate.blocked,walking:p.sitePresence.stage==='walk',roaming:preferences.roaming,animations:preferences.animations,dragging:!!drag?.active,travelling:!!movement,interaction:null,position:lastBounds?{...lastBounds}:null,target:movement?{...movement.target}:null,scene:p.sitePresence.stage,heading:p.sitePresence.heading,phase:p.phase,time:p.time,root:{...p.root},bounds:lastMeshBounds,diagnostics:{skinWarnings:lastReport?.skinWarnings??[],errors:[...errors],controller:p.sitePresence,limitations:['DOM paw interaction declines safely; site-actions retains its ordinary handler.','No automatic climbing on page elements.']}};}};
 function updateDiagnostics(now){if(now-lastDiagnostics<500)return;lastDiagnostics=now;const s=api.snapshot();canvas.dataset.osirisSnapshot=JSON.stringify({version:s.version,context:'webgl',time:s.time,phase:s.phase,scene:s.scene,heading:s.heading,root:s.root,offset:{...offset},position:s.position,bounds:s.bounds,paused:s.paused,blocked:s.blocked,conversation:s.conversation,travelling:s.travelling,dragging:s.dragging,attention:avatar.attentionDiagnostics,navigation,lastCompletedAction:s.diagnostics.controller.lastCompletedAction,lastJumpStartedAt:s.diagnostics.controller.lastJumpStartedAt,errors:s.diagnostics.errors,skinWarnings:s.diagnostics.skinWarnings});}
 try{resize();sync();draw();}catch(e){destroy();throw e;}
 launch.dataset.osirisMotion='native3d';launch.dataset.osirisPresence='ready';launch.dataset.osirisLivingVersion=VERSION;window.OsirisPresence=api;updateDiagnostics(performance.now());window.dispatchEvent(new Event('osiris:presence-ready'));raf=requestAnimationFrame(tick);return api;
}
