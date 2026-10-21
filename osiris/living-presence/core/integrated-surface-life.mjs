/** Isolated continuous surface-route candidate. All visible poses retain one
 * core instance and limb IDs; dock target rigs are verified planning states
 * adopted into that object, never replacement actors. Geometry only: neither
 * adhesion, balance, force nor obstacle collision is simulated.
 */
import {createOsirisRig,isRestMotionSettled} from './rig-kinematics.mjs';
import {spatialPose} from './spatial-locomotion.mjs';
import {createFloorWallDock} from './rig-floor-wall-dock.mjs';
import {createWallFloorDock} from './rig-wall-floor-dock.mjs';
import {createRigWallTurn} from './quadruped-wall-turn.mjs';
import {createRigPlay} from './rig-play.mjs';
const ids=['RF','LF','RH','LH'];
const copy=x=>structuredClone(x);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z??0)-(b.z??0));
function poseGap(a,b){let gap=0;for(const id of ids)for(const [name,p] of Object.entries(a.joints[id]))gap=Math.max(gap,distance(p,b.joints[id][name]));for(const key of ['centre','chest','pelvis','head','neck','nose','tailRoot'])gap=Math.max(gap,distance(a.body[key],b.body[key]));for(let i=0;i<a.joints.tail.length;i++)gap=Math.max(gap,distance(a.joints.tail[i],b.joints.tail[i]));return gap;}
const stopped=s=>s.velocity===0&&Object.values(s.contacts).every(Boolean);

export function createSurfaceLife({unit=1,wallX=0,floorY=0,root={x:wallX+1.6*unit,y:floorY},rig=createOsirisRig({unit,facing:-1,root,wallX}),climbHeight=4.1*unit,exitHeight=1.9*unit,direction=1}={}){
 if(!Number.isFinite(unit)||unit<=0||!Number.isFinite(wallX)||!Number.isFinite(floorY)||!Number.isFinite(climbHeight)||!Number.isFinite(exitHeight)||exitHeight<1.7*unit||exitHeight>2.5*unit||climbHeight<=exitHeight||![1,-1].includes(direction)||Math.abs(rig.unit-unit)>1e-8||Math.abs(rig.root.y-floorY)>1e-8)throw new RangeError('Invalid surface route configuration');
 // The concrete initial native stance passes the unchanged entry gate before
 // any source state or animation clock is modified.
 let dock=createFloorWallDock(rig.snapshot(),{unit,wallX,duration:3.2}),turn=null,play=null;
 let phase='ready',paused=true,error=null,elapsed=0,toy=null,rejectedPose=null;
 const history=['ready'],handoffs=[];
 function transition(next){phase=next;elapsed=0;history.push(next);}
 const native=()=>spatialPose(rig.snapshot(),{},unit);
 function current(){return rejectedPose??(turn?turn.snapshot():play?spatialPose(play.snapshot(),{},unit):dock&&['floor-wall','wall-floor'].includes(phase)?spatialPose(dock.snapshot(),{},unit):native());}
 function snapshot(){const s=copy(current());s.toys=toy?[{...toy.ball,opacity:Math.max(0,1-Math.max(0,toy.age-2)/2)}]:[];s.surfaceLife={phase,history:[...history],handoffs:copy(handoffs),paused,error:copy(error),geometryOnly:true};return s;}
 function record(action,before,after,details={}){const gap=poseGap(before,after);if(gap>1e-6*unit)throw Object.assign(new Error('Surface action endpoint does not match the next owner'),{code:'handoff-gap',diagnostics:{action,maxJointGap:gap}});handoffs.push({action,time:after.time,phase:after.phase,maxJointGap:gap,...details});}
 function adoptDock(action){
  const before=spatialPose(dock.snapshot(),{},unit),target=spatialPose(dock.targetRig.snapshot(),{},unit);
  record(action,before,target,{orderOrigin:dock.targetRig.orderOrigin,nextLift:dock.targetRig.nextLift});
  // This assignment preserves the live object's prototype and identity.
  Object.assign(rig,copy(dock.targetRig));dock=null;
 }
 function fail(e){rejectedPose=copy(current());error={message:e.message,code:e.code??'preflight',diagnostics:copy(e.diagnostics??null)};paused=true;transition('rejected');}
 function step(dt){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');
  if(paused||dt===0)return snapshot();let remaining=dt;
  while(remaining>1e-10){const h=Math.min(remaining,1/120);remaining-=h;
   try{
    if(toy){toy.age+=h;if(toy.age>=4)toy=null;}
    if(phase==='floor-wall'||phase==='wall-floor'){
     const s=dock.step(h);if(s.issues.length)throw Object.assign(new Error('Dock reported unreachable support'),{diagnostics:s.issues});rig.time=s.time;
     if(dock.done){const entry=phase==='floor-wall';adoptDock(phase);transition(entry?'climb':'walk');}
    }else if(phase==='wall-turn'){
     turn.step(h);if(turn.done){const before=turn.snapshot();record('wall-turn',before,native(),{...turn.diagnostics});turn=null;transition('descend');}
    }else if(phase==='play'){
     play.step(h);if(play.done){const before=spatialPose(play.snapshot(),{},unit);toy={ball:{...before.play.ball},age:0};record('play',before,native());play=null;transition('complete');}
    }else{
     const moving=phase==='climb'||phase==='descend'||phase==='walk';
     const mode=phase==='climb'?'climb':phase==='descend'?'descend':phase==='walk'?'walk':'idle';
     const s=rig.step(h,{mode,speed:moving?(phase==='walk'?.45:phase==='climb'?.32:.4)*unit:0});elapsed+=h;
     if(s.issues.length)throw Object.assign(new Error('Core route reported unreachable support'),{diagnostics:{phase,issues:s.issues}});
     if(phase==='climb'&&rig.root.y>=floorY+climbHeight){rig.step(0,{mode:'idle'});transition('climb-settle');}
     else if(phase==='climb-settle'&&stopped(s)){
      const before=native();turn=createRigWallTurn(rig,{direction});record('wall-turn-start',before,turn.snapshot());transition('wall-turn');
     }else if(phase==='descend'&&rig.root.y<=floorY+exitHeight){rig.step(0,{mode:'idle'});transition('descend-settle');}
     else if(phase==='descend-settle'&&stopped(s)){
      const candidate=createWallFloorDock(s,{unit,wallX,floorY,duration:3.2});record('wall-floor-start',native(),spatialPose(candidate.snapshot(),{},unit));dock=candidate;transition('wall-floor');
     }else if(phase==='walk'&&elapsed>=2){rig.step(0,{mode:'idle'});transition('walk-settle');}
     else if(phase==='walk-settle'&&stopped(s)){rig.jump({distance:1.1*unit,height:.55*unit,duration:1.5});transition('jump');}
     else if(phase==='jump'&&!rig.jumpState){transition('post-jump-rest');}
     else if(phase==='post-jump-rest'&&stopped(s)&&isRestMotionSettled(s)){
      const before=native();const candidate=createRigPlay(rig);record('play-start',before,spatialPose(candidate.snapshot(),{},unit));play=candidate;transition('play');
     }
    }
   }catch(e){fail(e);break;}
  }return snapshot();
 }
 return {step,snapshot,start(){if(error)return;if(phase==='ready'){record('floor-wall-start',native(),spatialPose(dock.snapshot(),{},unit));transition('floor-wall');}paused=false;},resume(){if(!error)paused=false;},hold(){paused=true;},rest(){paused=true;},get rig(){return rig;},get done(){return phase==='complete';}};
}
