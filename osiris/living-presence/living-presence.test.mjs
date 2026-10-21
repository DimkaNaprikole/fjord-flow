import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './core/quadruped-vendor/three.module.js';
import {createScreenSpace,ndcRect,fitRectShift,presenceGate} from './screen-space.mjs';
import {createLivingSiteController} from './living-controller.mjs';
test('fixed ortho floor projection is invertible and exactly matches the real THREE camera, including diagonal routes',()=>{
 for(const [width,height]of [[360,800],[1440,900],[900,500]]){const m=createScreenSpace({width,height}),c=new THREE.OrthographicCamera(-width/116,width/116,height/116,-height/116,.1,200);c.position.set(m.cameraPosition.x,m.cameraPosition.y,m.cameraPosition.z);c.lookAt(0,0,0);c.updateMatrixWorld(true);
  for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){const p={x:x*.61,y:0,z:z*.53},q=m.project(p),r=m.floor(q);assert.ok(Math.hypot(r.x-p.x,r.z-p.z)<1e-12);const v=new THREE.Vector3(p.x,p.y,p.z).project(c);assert.ok(Math.abs(q.x-(v.x+1)*width/2)<1e-10);assert.ok(Math.abs(q.y-(1-v.y)*height/2)<1e-10);}
 }
});
test('actual projected bounds are fitted as a whole; voice/conversation does not silently freeze explicit action',()=>{
 const r=ndcRect({minX:-1.1,maxX:-.2,minY:-.8,maxY:.7},1000,600),shift=fitRectShift(r,{width:1000,height:600});assert.equal(shift.x,58.00000000000004);assert.equal(shift.y,0);assert.equal(shift.fits,true);
 assert.deepEqual(presenceGate({voice:true,state:'speaking',typing:true}),{blocked:false,busy:true});for(const k of ['paused','hidden','reduced'])assert.equal(presenceGate({[k]:true}).blocked,true);assert.equal(presenceGate({animations:false}).blocked,true);
});
test('same native rig actually turns then walks diagonally with distance phase and reaches the route without IK faults',()=>{
 const c=createLivingSiteController(),rig=c.rig,start=rig.snapshot();assert.equal(c.startRoute([{x:1,z:1},{x:.2,z:1.8}]),true);let turns=0,walks=0,p;
 for(let i=0;i<5000;i++){p=c.step(1/120);assert.equal(c.rig,rig);assert.equal(p.sitePresence.error,null);assert.deepEqual(p.issues,[]);if(p.sitePresence.stage==='turn')turns++;if(p.sitePresence.stage==='walk')walks++;if(p.sitePresence.routeResult==='arrived')break;}
 assert.ok(turns>100&&walks>100);assert.equal(p.sitePresence.routeResult,'arrived');assert.ok(Math.hypot(p.root.x-.2,p.root.z-1.8)<.04);assert.ok(p.phase>start.phase+.5);assert.equal(c.command('knead'),false);assert.equal(c.command('arbitrary-dom-click'),false);
});
test('pause holds all native points/clock; cancelling during turn finishes it and returns to four planted supports',()=>{
 const c=createLivingSiteController();c.startRoute([{x:-1,z:1}]);for(let i=0;i<1500&&c.snapshot().sitePresence.stage!=='turn';i++)c.step(1/120);for(let i=0;i<40;i++)c.step(1/120);const before=c.snapshot(),rig=structuredClone(c.rig);c.setPaused(true);const held=c.snapshot();assert.deepEqual(c.step(1),held);assert.deepEqual(structuredClone(c.rig),rig);c.cancelRoute();c.setPaused(false);
 let p;for(let i=0;i<2000;i++){p=c.step(1/120);assert.equal(p.sitePresence.error,null);if(c.quiet)break;}assert.ok(c.quiet);assert.equal(p.sitePresence.routeResult,'cancelled');assert.ok(p.time>before.time);assert.ok(Object.values(p.contacts).every(Boolean));
});
test('genuine stretch-rest and yarn use the same core and preserve native stance/phase through complete actions',()=>{
 const c=createLivingSiteController(),rig=c.rig;for(let i=0;i<1200;i++)c.step(1/120);const before=rig.snapshot();assert.equal(c.command('stretch'),true);let sawHold=false,sawLie=false;
 for(let i=0;i<4000;i++){const p=c.step(1/120);assert.equal(c.rig,rig);assert.equal(p.sitePresence.error,null);assert.deepEqual(p.issues,[]);if(p.stretchRestCycle?.phase==='stretch-hold')sawHold=true;if(p.stretchRestCycle?.phase==='lying')sawLie=true;if(sawLie&&c.quiet)break;}
 assert.ok(sawHold&&sawLie);assert.equal(rig.phase,before.phase);assert.ok(Math.hypot(rig.snapshot().joints.RF.paw.x-before.joints.RF.paw.x,rig.snapshot().joints.RF.paw.y-before.joints.RF.paw.y)<1e-12);assert.equal(c.command('yarn'),true);let seen=false,ball=null;
 for(let i=0;i<1500;i++){const p=c.step(1/120);assert.equal(p.sitePresence.error,null);if(p.play){seen=true;ball=p.play.ball;}if(seen&&c.quiet)break;}assert.ok(seen&&ball);assert.equal(rig.phase,before.phase);
});
