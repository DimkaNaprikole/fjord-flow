/** Depth-aware locomotion adapter: canonical anatomy is never mirrored.
 * A turn updates a world frame, while the same profile rig, phase, limb IDs
 * and paw stance survive. All outputs are explicit XYZ for the 3D avatar.
 */
import {createOsirisRig,isRestMotionSettled} from './rig-kinematics.mjs';
import {createQuadrupedStepTurn} from './quadruped-step-turn.mjs';
import {createRigPlay} from './rig-play.mjs';
const ids=['RF','LF','RH','LH'];
const rotate=(p,a)=>({x:p.x*Math.cos(a)-(p.z??0)*Math.sin(a),y:p.y,z:p.x*Math.sin(a)+(p.z??0)*Math.cos(a)});
export function spatialPose(s,{heading=0,pivotX=0,position={x:0,z:0}}={},unit=1){
 const vector=p=>rotate(p,heading),point=(p,z=0)=>{const q=vector({x:p.x-pivotX,y:p.y,z:p.z??z});return {...q,x:q.x+position.x,z:q.z+position.z};};
 const f=s.body.forward,d=s.body.dorsal;
 const lateral=s.body.lateral??{x:f.y*(d.z??0)-(f.z??0)*d.y,y:(f.z??0)*d.x-f.x*(d.z??0),z:f.x*d.y-f.y*d.x};
 const side=id=>(id.startsWith('L')?1:-1)*(id.endsWith('F')?.32:.37)*unit*Math.sign(lateral.z);
 const body={};for(const [key,p] of Object.entries(s.body))body[key]=p&&Number.isFinite(p.x)?point(p):p;
 body.forward=vector(s.body.forward);body.dorsal=vector(s.body.dorsal);body.lateral=vector(lateral);
 const joints={};for(const [key,p] of Object.entries(s.joints)){
  if(ids.includes(key))joints[key]=Object.fromEntries(Object.entries(p).map(([name,p])=>[name,point(p,s.spatial?0:side(key))]));
  else if(Array.isArray(p))joints[key]=p.map(p=>point(p));else joints[key]=point(p);
 }
 const legs={};for(const id of ids){const leg=s.legs[id],z=s.spatial?0:side(id);legs[id]={...leg,joints:joints[id],targetPaw:point(leg.targetPaw,z),contactPoint:leg.contactPoint?point(leg.contactPoint,z):null,soleAxis:vector(leg.soleAxis??s.body.forward)};}
 const segments=s.segments.map(seg=>{const id=seg.limb??seg.id.split('.')[0],z=!s.spatial&&ids.includes(id)?side(id):0;return {...seg,from:point(seg.from,z),to:point(seg.to,z)};});
 const play=s.play?{...s.play,ball:{...s.play.ball,...point(s.play.ball,side(s.play.limb??'LF'))},focus:point(s.play.focus,side(s.play.limb??'LF')),touchPoint:point(s.play.touchPoint,side(s.play.limb??'LF'))}:undefined;
 const buttonPress=s.buttonPress?{...s.buttonPress,target:point(s.buttonPress.target,side(s.buttonPress.limb??'RF')),focus:point(s.buttonPress.focus,side(s.buttonPress.limb??'RF')),touchPoint:point(s.buttonPress.touchPoint,side(s.buttonPress.limb??'RF')),events:s.buttonPress.events.map(e=>({...e,target:point(e.target,side(e.limb??'RF'))}))}:undefined;
 return {...s,...(play?{play}:{}),...(buttonPress?{buttonPress}:{}),spatial:true,root:point(s.root),body,joints,legs,segments,worldRootSpeed:s.worldRootSpeed?vector(s.worldRootSpeed):{x:0,y:0,z:0}};
}
export function createSpatialLocomotion({unit=1,position={x:0,z:0},heading=0,rig=createOsirisRig({unit,root:{x:0,y:0}})}={}){
 if(rig.facing!==1||rig.basisMode!=='walk')throw new Error('A canonical right-facing floor rig is required');
 let frame={heading,pivotX:rig.root.x,position:{...position}},speed=0,pending=null,turn=null,play=null,paused=false,afterTurn=null,error=null,handoffs=[],toy=null;
 const planted=s=>s.mode!=='jump'&&s.velocity<.01&&Object.values(s.contacts).every(Boolean);
 // Active toy coordinates live in .play; completed toys are frozen world XYZ.
 // Never feed the completed prop back through the actor's changing frame.
 const snapshot=()=>{const s=spatialPose(turn?turn.snapshot():play?play.snapshot():rig.snapshot(),frame,unit);s.toys=toy?[{...toy.ball,opacity:Math.max(0,1-Math.max(0,toy.age-2)/2)}]:[];s.locomotion={heading:frame.heading,action:turn?'turn':play?'play':pending?.type??(speed?'walk':'rest'),turnActive:!!turn,playActive:!!play,preparing:pending?.type??null,paused,error,handoffs:[...handoffs]};return s;};
 function recordHandoff(before,after,action){let maxJointGap=0;for(const id of ids)for(const [name,a] of Object.entries(before.joints[id])){const b=after.joints[id][name];maxJointGap=Math.max(maxJointGap,Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z));}handoffs.push({time:rig.time,action,maxJointGap});if(handoffs.length>8)handoffs.shift();}
 function command(intent){error=null;
  if(turn||play){if(intent.type==='rest'){paused=true;afterTurn=null;}else{paused=false;afterTurn=intent;}return;}
  if(intent.type==='walk'){pending=null;speed=intent.speed;rig.step(0,{mode:'walk'});}
  else{pending=intent.type==='rest'?null:intent;speed=0;rig.step(0,{mode:'idle'});}
 }
 function step(dt){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');
  if(dt===0)return snapshot();let remaining=dt;
  while(remaining>1e-10){const h=Math.min(remaining,1/120);remaining-=h;
   if((turn||play)&&paused)break;
   if(toy){toy.age+=h;if(toy.age>=4)toy=null;}
   if(play){play.step(h);if(play.done){
     const before=spatialPose(play.snapshot(),frame,unit);toy={ball:{...before.play.ball},age:0};play=null;
     recordHandoff(before,spatialPose(rig.snapshot(),frame,unit),'play');
     if(afterTurn){const next=afterTurn;afterTurn=null;command(next);}
    }continue;
   }
   if(turn){if(paused)break;turn.step(h);if(turn.done){
     const before=spatialPose(turn.snapshot(),frame,unit),angle=turn.snapshot().turn.angle;
     rig.time=turn.snapshot().time;frame.heading+=angle;turn=null;
     recordHandoff(before,spatialPose(rig.snapshot(),frame,unit),'turn');
     if(afterTurn){const next=afterTurn;afterTurn=null;command(next);}
    }continue;
   }
   if(pending){rig.step(h,{mode:'idle',speed:0});const s=rig.snapshot();
    if(planted(s)&&(!['turn','play'].includes(pending.type)||isRestMotionSettled(s))){
     const intent=pending;pending=null;
     try{if(intent.type==='jump')rig.jump(intent);
      else if(intent.type==='play')play=createRigPlay(rig,{limb:intent.limb});
      else{const p=spatialPose(s,frame,unit).root;frame={heading:frame.heading,pivotX:s.root.x,position:{x:p.x,z:p.z}};
       turn=createQuadrupedStepTurn(s,{unit,radians:Math.abs(intent.delta),direction:Math.sign(intent.delta),duration:1.3+3.7*Math.abs(intent.delta)/Math.PI});}
     }catch(e){error=e.message;speed=0;}
    }
   }else rig.step(h,{mode:speed?'walk':'idle',speed});
  }
  return snapshot();
 }
 return {step,snapshot,
  walk(nextSpeed=.72*unit){if(!Number.isFinite(nextSpeed)||nextSpeed<0)throw new RangeError('Invalid speed');command({type:'walk',speed:nextSpeed});},
  rest(){command({type:'rest'});},
  // Continue the controller already holding the paw; do not enqueue a new action.
  resume(){paused=false;},
  playWithBall({limb='LF'}={}){if(!['LF','RF'].includes(limb))throw new RangeError('Toy play requires a front paw');command({type:'play',limb});},
  jump({distance=1.3*unit,height=.6*unit,duration=1.5}={}){if(!Number.isFinite(distance)||distance<0||distance>3*unit||!Number.isFinite(height)||height<=0||height>1.5*unit||!Number.isFinite(duration)||duration<=0)throw new RangeError('Invalid jump parameters');command({type:'jump',distance,height,duration});},
  turnBy(delta){if(!Number.isFinite(delta))throw new RangeError('Invalid angle');delta=Math.atan2(Math.sin(delta),Math.cos(delta));if(Math.abs(delta)<1e-6)return;command({type:'turn',delta});},
  get rig(){return rig;}};
}
