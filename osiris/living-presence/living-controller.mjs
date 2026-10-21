/** One canonical native core and exclusive action owners; no browser globals. */
import {LivingOsirisRig} from './core/surface-roam-walk-governor-life.mjs';
import {createSpatialLocomotion,spatialPose} from './core/spatial-locomotion.mjs';
import {isRestMotionSettled} from './core/rig-kinematics.mjs';
import {createRigStretchRestCycleV2} from './core/rig-stretch-rest-cycle-v2.mjs';
const clone=r=>Object.assign(Object.create(Object.getPrototypeOf(r)),structuredClone(r));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createLivingSiteController({rig=new LivingOsirisRig({unit:1,mode:'idle',facing:1,root:{x:0,y:0}})}={}){
 if(rig.unit!==1)throw new RangeError('Site art uses the verified unit1 rig');
 const actor=createSpatialLocomotion({unit:1,rig});let stage='idle',route=null,index=0,cancelled=false,cycle=null,cycleFrame=null,intent=null,routeResult=null,error=null,paused=false,lastCompletedAction=null,lastJumpStartedAt=null,jumpStarted=false;
 const quiet=()=>{const p=rig.snapshot();return !rig.jumpState&&rig.velocity===0&&Object.values(p.contacts).every(Boolean)&&isRestMotionSettled(p);};
 function snapshot(){const p=cycle?spatialPose(cycle.snapshot(),cycleFrame,1):actor.snapshot();p.sitePresence={stage,paused,travelling:!!route,action:cycle?'stretch-rest':intent,error,routeResult,lastCompletedAction,lastJumpStartedAt,heading:p.locomotion?.heading??cycleFrame?.heading??0};return p;}
 function prepare(){actor.rest();stage='settle';}
 function nextLeg(){
  if(cancelled||!route||index>=route.length){routeResult=cancelled?'cancelled':'arrived';route=null;prepare();return;}
  const p=actor.snapshot(),target=route[index],dx=target.x-p.root.x,dz=target.z-p.root.z;
  if(Math.hypot(dx,dz)<.05){index++;nextLeg();return;}
  const heading=Math.atan2(dz,dx),delta=Math.atan2(Math.sin(heading-p.locomotion.heading),Math.cos(heading-p.locomotion.heading));
  if(Math.abs(delta)>.005){actor.turnBy(delta);stage='turn';}else stage='walk';
 }
 function cancelRoute(){if(!route)return false;cancelled=true;intent=null;if(stage!=='turn'){actor.rest();stage='brake';}return true;}
 function startRoute(points){if(cycle||rig.jumpState||actor.snapshot().locomotion.playActive||route||!Array.isArray(points)||!points.length||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.z)))return false;route=structuredClone(points);index=0;cancelled=false;routeResult=null;error=null;prepare();return true;}
 function command(name){
  const action={yarn:'play',play:'play',stretch:'stretch','lie-down':'stretch','jump-panther-short':'jump',jump:'jump',rest:'rest'}[name];if(!action||cycle||rig.jumpState||actor.snapshot().locomotion.playActive)return false;
  cancelRoute();intent=action;if(stage!=='turn')prepare();return true;
 }
 function step(dt){
  if(!Number.isFinite(dt)||dt<0||dt>1)throw new RangeError('Invalid site step');if(paused||dt===0)return snapshot();let remaining=dt;
  while(remaining>1e-10){const h=Math.min(remaining,1/120);remaining-=h;
   try{
    if(cycle){cycle.step(h);if(cycle.done){cycle=null;cycleFrame=null;stage='idle';lastCompletedAction={action:'stretch-rest',time:rig.time};}continue;}
    const before=actor.snapshot();
    if(stage==='walk'&&route){const target=route[index],f=before.body.forward,along=(target.x-before.root.x)*f.x+(target.z-before.root.z)*f.z;
     if(cancelled||along<=.035){actor.rest();stage='brake';}else actor.walk(Math.min(1.0,Math.sqrt(2*rig.acceleration*Math.max(0,along-.02))));
    }
    actor.step(h);const p=actor.snapshot();if(stage==='jump'&&rig.jumpState&&!jumpStarted){jumpStarted=true;lastJumpStartedAt=rig.time;}if(p.issues.length)throw new Error('Native IK reported unreachable pose');if(p.locomotion.error)throw new Error(p.locomotion.error);
    if(stage==='turn'&&!p.locomotion.turnActive&&!p.locomotion.preparing){if(cancelled){actor.rest();stage='brake';}else stage='walk';}
    else if(stage==='brake'&&rig.velocity===0&&Object.values(p.contacts).every(Boolean)){if(cancelled){routeResult='cancelled';route=null;cancelled=false;prepare();}else{index++;nextLeg();}}
    else if(stage==='settle'&&quiet()){
     if(route&&!cancelled){nextLeg();continue;}
     if(intent){const action=intent;intent=null;
      if(action==='stretch'){const trial=clone(rig);createRigStretchRestCycleV2(trial);cycleFrame={heading:p.locomotion.heading,pivotX:rig.root.x,position:{x:p.root.x,z:p.root.z}};cycle=createRigStretchRestCycleV2(rig);stage='stretch-rest';}
      else if(action==='play'){actor.playWithBall({limb:'LF'});stage='play';}
      else if(action==='jump'){jumpStarted=false;actor.jump({distance:.55,height:.30,duration:1.4});stage='jump';}
      else stage='idle';
     }else stage='idle';
    }else if(['play','jump'].includes(stage)&&!p.locomotion.playActive&&!p.locomotion.preparing&&!rig.jumpState){lastCompletedAction={action:stage,time:rig.time};prepare();}
   }catch(e){error={message:e.message,stage};paused=true;routeResult='failed';route=null;break;}
  }return snapshot();
 }
 return {rig,step,snapshot,startRoute,cancelRoute,command,setPaused(value){paused=!!value;},get quiet(){return stage==='idle'&&quiet();},get busy(){return !!cycle||!!rig.jumpState||actor.snapshot().locomotion.playActive;}};
}
