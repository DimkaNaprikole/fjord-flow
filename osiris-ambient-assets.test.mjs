import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CHARACTER_CALIBRATION} from './osiris/character-calibration.mjs';
import {characterStage,fitCharacterClip} from './osiris/character-layout.mjs';
import {gestureFit} from './osiris/button-choreography.mjs';
import {buildMovementCatalog} from './osiris/movement-catalog.mjs';

const metadata=JSON.parse(await readFile(new URL('./media/osiris-life/metadata.json',import.meta.url),'utf8'));
const ids=['cloud-perch','run-short','descent-short'];
const clips=ids.map(id=>metadata.clips.find(clip=>clip.id===id));

test('reviewed ambient assets keep exact native durations and unique one-shot identity',async()=>{
 const catalog=buildMovementCatalog(metadata);
 assert.deepEqual(clips.map(clip=>clip.frameCount),[29,19,63]);
 for(const clip of clips){
  assert.equal(metadata.clips.filter(item=>item.id===clip.id).length,1);
  assert.equal(catalog.clips.find(item=>item.id===clip.id)?.mode,'auto');
  assert.equal(clip.oneShot,true);assert.equal(clip.loop,false);assert.equal(clip.sourceMotion,true);
  assert.equal(clip.duration,clip.frameCount/clip.fps);
  assert.equal(clip.verification.reviewedFrames,clip.frameCount);
  const media=await readFile(new URL(`./media/osiris-life/${clip.packed}`,import.meta.url));
  assert.equal(createHash('sha256').update(media).digest('hex'),clip.packedSha256);
  const poster=await readFile(new URL(`./media/osiris-life/${clip.poster}`,import.meta.url));
  assert.ok(poster.length>1000);
 }
});

test('cloud and descent do not reduce the original library physical scale',()=>{
 const stage=characterStage(240,210);
 assert.ok(Math.abs(stage.headPixels-21.924393125495886)<1e-10);
 assert.ok(Math.abs(stage.baseline-175.3059134043585)<1e-10);
 assert.equal(fitCharacterClip(metadata.clips.find(clip=>clip.id==='blink'),240,210).headPixels,stage.headPixels);
});

test('full one-shot trajectories fit narrow stages without stretching or moving their source crop',()=>{
 for(const [width,height] of [[96,120],[180,150],[240,210],[320,270],[390,200]]){
  for(const clip of clips)for(const mirrored of [false,true])for(const anchorFraction of [0,.5,1]){
   const entry=CHARACTER_CALIBRATION.clips[clip.id],u=entry.unionBounds;
   assert.equal(entry.stageScope,'one-shot');
   assert.deepEqual(u,clip.unionBounds);
   const fit=gestureFit({...clip,mirrored,anchorFraction},width,height);
   assert.ok(Math.abs(fit.width/fit.height-clip.width/clip.height)<1e-9);
   const left=fit.left+(mirrored?1-u.right:u.left)*fit.width;
   const right=fit.left+(mirrored?1-u.left:u.right)*fit.width;
   const top=fit.top+u.top*fit.height,bottom=fit.top+u.bottom*fit.height;
   assert.ok(left>=4-1e-7&&right<=width-4+1e-7,`${clip.id}: horizontal ${left}..${right}/${width}`);
   assert.ok(top>=4-1e-7&&bottom<=height-4+1e-7,`${clip.id}: vertical ${top}..${bottom}/${height}`);
   assert.ok(fit.headPixels<=characterStage(width,height).headPixels+1e-7);
   for(const point of [fit.ground,fit.endGround])assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
  }
 }
});
