/** Optional local head/ear attention decorator; no cursor capture or rig drive.
 * createAttentionAvatar(THREE, base).update(pose,{targetWorld,dt,enabled:true})
 * returns the base avatar's unchanged update report. This is visual head/ear
 * response, not separate pupil tracking or Windows control.
 */
const wrapped=new WeakSet();
const clamp=(v,limit)=>Math.max(-limit,Math.min(limit,v));
const damp=(value,target,dt,tau)=>{const next=target+(value-target)*Math.exp(-dt/tau);return target===0&&Math.abs(next)<1e-9?0:next;};
function permitted(pose){
 if(!pose?.spatial)return 'non-spatial';
 if(pose.basisMode!=='walk'||!['idle','walk','rest'].includes(pose.mode))return 'busy-mode';
 if(pose.issues?.length||!['LF','RF','LH','RH'].every(id=>pose.contacts?.[id]===true))return 'unsupported-contact';
 if(pose.play||pose.turn||(pose.dock&&!pose.dock.complete)||pose.locomotion?.turnActive||pose.locomotion?.playActive||pose.locomotion?.preparing||['turn','jump','play'].includes(pose.locomotion?.action))return 'busy-action';
 const speed=Number.isFinite(pose.velocity)?Math.abs(pose.velocity):Math.hypot(pose.worldRootSpeed?.x??0,pose.worldRootSpeed?.y??0,pose.worldRootSpeed?.z??0);
 return speed<=.5?'eligible':'fast-walk';
}
export function createAttentionAvatar(THREE,baseAvatar){
 if(!baseAvatar?.root?.getObjectByName||typeof baseAvatar.update!=='function'||typeof baseAvatar.dispose!=='function')throw new TypeError('An existing quadruped avatar is required');
 if(wrapped.has(baseAvatar))throw new Error('Avatar already has an attention owner');
 const head=baseAvatar.root.getObjectByName('sphynx_head'),ears=[-1,1].map(side=>baseAvatar.root.getObjectByName(`cupped_ear_${side}`));
 if(!head||ears.some(ear=>!ear))throw new Error('Attention requires the existing head and both ear groups');
 wrapped.add(baseAvatar);
 const headBase=head.quaternion.clone(),earBases=ears.map(ear=>ear.quaternion.clone()),target=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),sideAxis=new THREE.Vector3(0,0,1),yawQ=new THREE.Quaternion(),pitchQ=new THREE.Quaternion(),offset=new THREE.Quaternion();
 let yaw=0,pitch=0,earYaw=0,earPitch=0,clock=0,engaged=0,tracking=false,disposed=false;
 let diagnostics={clock:0,enabled:false,tracking:false,reason:'disabled',yaw:0,pitch:0,earYaw:0,earPitch:0,desiredYaw:0,desiredPitch:0};
 function restore(){head.quaternion.copy(headBase);ears.forEach((ear,i)=>ear.quaternion.copy(earBases[i]));}
 function applyRotation(object,base,y,p){if(y===0&&p===0)return;yawQ.setFromAxisAngle(up,y);pitchQ.setFromAxisAngle(sideAxis,p);offset.copy(yawQ).multiply(pitchQ);object.quaternion.copy(base).multiply(offset);}
 function update(pose,{targetWorld=null,dt=1/60,enabled=false}={}){
  if(disposed)throw new Error('Attention avatar is disposed');
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Attention dt must be finite and nonnegative');
  if(typeof enabled!=='boolean')throw new TypeError('Attention enabled must be boolean');
  if(targetWorld!==null&&(!targetWorld||!Number.isFinite(targetWorld.x)||!Number.isFinite(targetWorld.y)||!Number.isFinite(targetWorld.z)))throw new TypeError('Attention targetWorld must be finite XYZ or null');
  // Remove last frame's offsets before asking the base to author this frame.
  // In particular, the base does not normally rewrite static ear rotations.
  restore();const report=baseAvatar.update(pose);headBase.copy(head.quaternion);ears.forEach((ear,i)=>earBases[i].copy(ear.quaternion));
  if(dt>0){
   clock+=dt;let reason=enabled?permitted(pose):'disabled',desiredYaw=0,desiredPitch=0,active=false;
   if(enabled&&reason==='eligible'&&targetWorld){
    head.updateWorldMatrix(true,false);target.set(targetWorld.x,targetWorld.y,targetWorld.z);head.worldToLocal(target);
    if(target.lengthSq()>1e-12){desiredYaw=clamp(-Math.atan2(target.z,target.x),.25);desiredPitch=clamp(Math.atan2(target.y,Math.hypot(target.x,target.z)),.16);active=true;}else reason='target-at-pivot';
   }else if(enabled&&reason==='eligible')reason='no-target';
   if(!enabled){yaw=0;pitch=0;earYaw=0;earPitch=0;engaged=0;tracking=false;}
   else{
    const previous=tracking?engaged:0;engaged=active?previous+dt:0;
    // The ears start immediately; the head follows after 60ms on acquisition.
    const headDt=active?Math.max(0,engaged-.06)-Math.max(0,previous-.06):dt;
    earYaw=damp(earYaw,desiredYaw/.25*.045,dt,.07);earPitch=damp(earPitch,desiredPitch/.16*.025,dt,.07);
    yaw=damp(yaw,desiredYaw,headDt,.18);pitch=damp(pitch,desiredPitch,headDt,.18);tracking=active;
   }
   diagnostics={clock,enabled,tracking,reason,yaw,pitch,earYaw,earPitch,desiredYaw,desiredPitch};
  }
  applyRotation(head,headBase,yaw,pitch);
  // Extra ear offsets use the head's local axes, rather than each pinna's
  // already tilted anatomical axes. Their pivots and geometry are unchanged.
  if(earYaw!==0||earPitch!==0){yawQ.setFromAxisAngle(up,earYaw);pitchQ.setFromAxisAngle(sideAxis,earPitch);offset.copy(yawQ).multiply(pitchQ);ears.forEach((ear,i)=>ear.quaternion.copy(earBases[i]).premultiply(offset));}
  return report;
 }
 function dispose(){if(disposed)return;disposed=true;restore();wrapped.delete(baseAvatar);baseAvatar.dispose();}
 return {...baseAvatar,update,dispose,get attentionDiagnostics(){return {...diagnostics,disposed};}};
}
