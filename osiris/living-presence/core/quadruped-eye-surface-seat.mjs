/** Construction-only exact skull rays and a precomputed aperture depth grid.
 * The eye group and its aperture Y/Z are untouched. No camera is consulted.
 * Ray misses are explicit failures, never substituted by invented surfaces.
 */
export function createEyeSurfaceSeat(THREE,skullGeometry,eye,lidPoint){
 eye.updateMatrix();const geometry=skullGeometry.clone().applyMatrix4(eye.matrix.clone().invert()),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),surface=new THREE.Mesh(geometry,material),ray=new THREE.Raycaster();
 geometry.computeBoundingBox();const maxX=geometry.boundingBox.max.x+1;
 const diagnostics={rays:0,misses:0,minimumShift:Infinity,maximumShift:-Infinity,grid:[57,25]};
 const exact=(y,z)=>{ray.set(new THREE.Vector3(maxX,y,z),new THREE.Vector3(-1,0,0));const h=ray.intersectObject(surface)[0];diagnostics.rays++;if(!h){diagnostics.misses++;throw new RangeError(`Eye seat ray misses skull at eye-local y=${y}, z=${z}`);}const shift=h.point.x-.008;diagnostics.minimumShift=Math.min(diagnostics.minimumShift,shift);diagnostics.maximumShift=Math.max(diagnostics.maximumShift,shift);return shift;};
 const nu=56,nv=24,table=new Float64Array((nu+1)*(nv+1));
 try{for(let i=0;i<=nu;i++){const u=-1+2*i/nu,lo=lidPoint(u,false),hi=lidPoint(u,true);for(let j=0;j<=nv;j++)table[i*(nv+1)+j]=exact(lo[1]+(hi[1]-lo[1])*j/nv,.116*u);}}catch(e){geometry.dispose();material.dispose();throw e;}
 const interpolated=(y,z)=>{const u=Math.max(-1,Math.min(1,z/.116)),lo=lidPoint(u,false),hi=lidPoint(u,true),v=hi[1]-lo[1]>1e-10?(y-lo[1])/(hi[1]-lo[1]):0;if(Math.abs(z)>.116001||v<-.0001||v>1.0001)throw new RangeError('Blink sample outside authored aperture');const x=(u+1)*nu/2,a=Math.min(nu-1,Math.floor(x)),fx=x-a,t=Math.max(0,Math.min(nv,v*nv)),b=Math.min(nv-1,Math.floor(t)),fy=t-b;return (table[a*(nv+1)+b]*(1-fy)+table[a*(nv+1)+b+1]*fy)*(1-fx)+(table[(a+1)*(nv+1)+b]*(1-fy)+table[(a+1)*(nv+1)+b+1]*fy)*fx;};
 function seatMesh(mesh){mesh.updateMatrix();mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position,inverse=mesh.matrix.clone().invert();for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrix);v.x+=exact(v.y,v.z);v.applyMatrix4(inverse);p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 return {seatMesh,depth:(x,y,z)=>x+interpolated(y,z),diagnostics,dispose(){geometry.dispose();material.dispose();}};
}
