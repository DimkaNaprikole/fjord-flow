import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './osiris-presence.fixture.mjs';

function speaking(compact=true){
 const f=fixture();f.dialog.open=true;if(compact)f.dialog.classList.add('osiris-compact');
 f.win.emit('fjord:voice-activity',{detail:{active:true}});f.setState('speaking');return f;
}
test('listening and thinking are stationary, including the transition from an answer',()=>{
 const f=speaking();f.setState('listening');f.tick(1000);assert.equal(f.launch.style.translate,undefined);
 f.setState('thinking');f.tick(1100);assert.equal(f.launch.style.translate,undefined);
 f.setState('speaking');f.tick(1200);assert.equal(f.launch['data-osiris-walking'],'true');
 const position=f.launch.style.translate;f.setState('listening');
 assert.equal(f.launch['data-osiris-walking'],undefined,'state change stops walking before the next frame');
 f.tick(1300);f.tick(20000);assert.equal(f.launch.style.translate,position,'listening does not return or drift');
 f.setState('speaking');f.tick(20100);assert.notEqual(f.launch.style.translate,position,'the next answer resumes walking');
 assert.equal(f.plays(),0);
});
test('an answer turns around instead of stopping after the first short walk',()=>{
 const f=speaking();const positions=[];
 for(let time=100;time<=10000;time+=100){f.tick(time);positions.push(parseFloat(f.launch.style.translate));}
 assert.ok(positions.some((x,i)=>i>0&&x>positions[i-1]),'returns to the right');
 assert.ok(positions.some((x,i)=>i>0&&x<positions[i-1]),'walks to the left');
 assert.ok(positions.every(x=>Math.abs(x)<=36),'the bottom dock bounds are kept');
 assert.equal(f.launch['data-osiris-walking'],'true');
});
test('chat controls block the swept path in both full and compact modes',()=>{
 for(const compact of [true,false]){
  const f=speaking(compact);
  f.obstacle({left:169,right:180,top:660,bottom:740},{inDialog:true});
  f.tick(100);assert.equal(f.launch.style.translate,undefined,'does not walk over an overlapping own control');
  f.obstacles.length=0;f.tick(200);assert.notEqual(f.launch.style.translate,undefined);
  const position=f.launch.style.translate;f.doc.foreignDialog={};f.tick(300);assert.equal(f.launch.style.translate,position,'another dialog freezes the cat');
 }
});
test('a nearby button causes a safe reversal and hidden controls do not block movement',()=>{
 const f=speaking();f.obstacle({left:145,right:155,top:660,bottom:740},{inDialog:true});
 let minimum=Infinity,sawReturn=false,previous=0;
 for(let time=100;time<=3000;time+=100){f.tick(time);const position=parseFloat(f.launch.style.translate);minimum=Math.min(minimum,position);if(position>previous)sawReturn=true;previous=position;}
 assert.ok(minimum>=-15,'keeps the 10px clearance around the nearby button');assert.ok(sawReturn);
 const g=speaking();g.obstacle({left:169,right:190,top:660,bottom:740},{inDialog:true,hidden:true});g.tick(100);assert.notEqual(g.launch.style.translate,undefined);
});
test('hidden page, reduced motion and a stopped conversation never keep walking',()=>{
 const f=speaking();f.tick(100);let position=f.launch.style.translate;
 f.doc.hidden=true;f.tick(200);assert.equal(f.launch.style.translate,position);assert.equal(f.launch['data-osiris-walking'],undefined);
 f.doc.hidden=false;f.motion.matches=true;f.tick(300);assert.equal(f.launch.style.translate,position);
 f.motion.matches=false;f.win.emit('fjord:voice-activity',{detail:{active:false}});f.tick(400);assert.equal(f.launch.style.translate,position);
 f.setState('idle');f.dialog.open=false;f.tick(100000);assert.equal(f.launch.style.translate,position);assert.equal(f.plays(),0);
});
test('decorative hero video and negative-tabindex containers do not pin a speaking cat',()=>{
 const f=speaking(),cover={left:0,right:390,top:0,bottom:800};
 // This is the markup constructed for the two silent background films.
 f.obstacle(cover,{tag:'video',attrs:{'aria-hidden':'true',tabindex:'-1'}});
 f.obstacle(cover,{tag:'section',attrs:{tabindex:'-1'}});
 f.obstacle(cover,{tag:'div',attrs:{tabindex:'-2'}});
 f.tick(100);assert.notEqual(f.launch.style.translate,undefined);
 f.setState('listening');const position=f.launch.style.translate;f.tick(200);assert.equal(f.launch.style.translate,position);
});
test('controlled video, real player iframes and explicit no-roam zones remain protected',()=>{
 const cover={left:0,right:390,top:0,bottom:800};
 for(const options of [
  {tag:'video',controls:true,attrs:{tabindex:'-1'}},
  {tag:'iframe',attrs:{src:'https://www.youtube-nocookie.com/embed/test'}},
  {tag:'section',attrs:{'data-osiris-no-roam':'',tabindex:'-1'}},
  {tag:'button',attrs:{tabindex:'-1'}},
  {tag:'a',attrs:{href:'#homePanel',tabindex:'-1'}},
  {tag:'div',attrs:{role:'button',tabindex:'-1'}},
  {tag:'div',attrs:{tabindex:'0'}}
 ]){const f=speaking();f.obstacle(cover,options);f.tick(100);assert.equal(f.launch.style.translate,undefined,JSON.stringify(options));}
});
