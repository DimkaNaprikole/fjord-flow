/** Procedural yarn prop in world XYZ, independent from the actor's frame. */
export function createYarnProp(THREE){
 const root=new THREE.Group();root.name='world_yarn_ball';root.visible=false;
 const material=new THREE.MeshStandardMaterial({color:0xb8382b,roughness:.92,transparent:true}),thread=new THREE.MeshStandardMaterial({color:0xe7825b,roughness:.95,transparent:true});
 const sphere=new THREE.SphereGeometry(1,24,16),ring=new THREE.TorusGeometry(.994,.025,5,64);
 const body=new THREE.Mesh(sphere,material);body.castShadow=true;body.receiveShadow=true;root.add(body);
 for(let i=0;i<7;i++){const loop=new THREE.Mesh(ring,thread);loop.rotation.set(i*.57,i*.91,i*.32);loop.castShadow=true;root.add(loop);}
 const axis=new THREE.Vector3();
 return {root,update(ball,forward={x:1,z:0}){
  root.visible=!!ball&&ball.opacity>.01;if(!root.visible)return;
  root.position.set(ball.x,ball.y,ball.z);root.scale.setScalar(ball.radius);
  axis.set(-forward.z,0,forward.x).normalize();root.quaternion.setFromAxisAngle(axis,ball.rotation??0);
  material.opacity=thread.opacity=ball.opacity;
 },dispose(){sphere.dispose();ring.dispose();material.dispose();thread.dispose();root.removeFromParent();}};
}
