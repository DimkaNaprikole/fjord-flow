import test from 'node:test';
import assert from 'node:assert/strict';
import {planCloudApproach,createCloudSequence,decodedCloudFrame} from './osiris/cloud-approach.mjs';
const options={startGround:{x:100,y:300},approachBounds:{left:-35,right:35,top:-70,bottom:0},
 jump:{bounds:{left:10,right:170,top:0,bottom:100},ground:{x:40,y:96},endGround:{x:140,y:98},frameCount:57,landingFrame:30},
 cloud:{width:110,height:60,contact:{x:55,y:21}},viewport:{width:700,height:500},minApproach:35,maxApproach:240};
test('near and far targets vary the approach only; cloud contact and native trajectory remain exact',()=>{
 const near=planCloudApproach({...options,random:()=>0}),far=planCloudApproach({...options,random:()=>.99});
 assert.ok(near&&far);assert.ok(far.approach.distance-near.approach.distance>190);
 for(const p of [near,far]){
  assert.deepEqual(p.jump.delta,{x:100,y:2});assert.equal(p.approach.ground.y,300);
  assert.deepEqual(p.cloud.contact,p.jump.endGround);
  assert.equal(p.jump.bounds.right-p.jump.bounds.left,160);
  assert.equal(p.jump.bounds.bottom-p.jump.bounds.top,100);
  assert.ok(p.approach.path.every(point=>point.y===p.approach.from.y));
 }
});
test('full jump and cloud stay inside client viewport and avoid controls',()=>{
 const p=planCloudApproach({...options,viewport:{width:375,height:400},random:()=>.99});assert.ok(p);
 for(const b of [p.jump.bounds,p.cloud.bounds])assert.ok(b.left>=8&&b.right<=367&&b.top>=8&&b.bottom<=392);
 assert.equal(planCloudApproach({...options,obstacles:[{left:145,right:170,top:200,bottom:350}]}),null);
 assert.equal(planCloudApproach({...options,viewport:{width:200,height:150}}),null);
});
test('decoded contact is unique; a timer or a stale frame cannot cause landing',()=>{
 const s=createCloudSequence(planCloudApproach(options));assert.equal(s.decoded(56),false);
 s.approach();s.arrived();assert.equal(s.decoded(29),false);assert.equal(s.snapshot().landed,false);
 assert.equal(s.decoded(30),true);assert.equal(s.decoded(31),false);assert.equal(s.decoded(10),false);
 assert.equal(s.ended().phase,'jump');s.decoded(56);assert.equal(s.ended().phase,'hold');assert.equal(s.finish().phase,'complete');
});
test('fractional decoded time cannot claim the next contact frame early',()=>{
 const s=createCloudSequence(planCloudApproach(options));s.approach();s.arrived();
 assert.equal(decodedCloudFrame(29.6/30,30,57),29);
 assert.equal(s.decoded(decodedCloudFrame(29.999/30,30,57)),false);
 assert.equal(s.snapshot().landed,false);
 assert.equal(s.decoded(decodedCloudFrame(1,30,57)),true);
 assert.equal(decodedCloudFrame(1.9,30,57),56);
});
for(const condition of [{chatOpen:true},{hidden:true},{motion:false},{roaming:false},{dragging:true},{viewport:{width:699,height:500}}])test(`interrupt cancels without a delayed landing: ${JSON.stringify(condition)}`,()=>{
 const s=createCloudSequence(planCloudApproach(options));s.approach();s.arrived();assert.equal(s.validate(condition).phase,'cancelled');
 assert.equal(s.decoded(56),false);assert.equal(s.snapshot().landed,false);assert.equal(s.ended().phase,'cancelled');
});
test('a new obstacle cancels before contact instead of moving the source trajectory',()=>{
 const p=planCloudApproach(options),s=createCloudSequence(p);s.approach();s.arrived();
 assert.equal(s.validate({obstacles:[p.cloud.bounds]}).reason,'collision');assert.equal(s.decoded(56),false);
});
test('leftward source geometry and an asymmetric cloud preserve the measured landing',()=>{
 const jump={...options.jump,ground:{x:140,y:96},endGround:{x:40,y:98}},cloud={...options.cloud,contact:{x:31,y:21}};
 const p=planCloudApproach({...options,startGround:{x:600,y:300},jump,cloud,random:()=>.5});assert.ok(p);
 assert.ok(p.approach.to.x<p.approach.from.x);assert.deepEqual(p.jump.delta,{x:-100,y:2});
 assert.equal(p.cloud.origin.x+31,p.jump.endGround.x);assert.equal(p.cloud.origin.y+21,p.jump.endGround.y);
 assert.equal(p.jump.bounds.right-p.jump.bounds.left,160);
});
