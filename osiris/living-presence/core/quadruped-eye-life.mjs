/** Absolute rig time controls blinking, so pause and action handoffs never
 * reset the expression. The aperture/eye group is not scaled or relocated. */
export function blinkAmount(time){
 if(!Number.isFinite(time))throw new TypeError('Blink time must be finite');
 const t=((time%5.8)+5.8)%5.8;
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 if(t<3.6||t>=4.02)return 0;
 if(t<3.75)return smooth((t-3.6)/.15);
 if(t<=3.79)return 1;
 return 1-smooth((t-3.79)/.23);
}

export function createBlinkLids(THREE,eye,material,lidPoint,{depth=null,backDepth=null}={}){
 const meshes=[],nu=28,nv=4;
 for(const upper of [true,false]){
  const count=(nu+1)*(nv+1),positions=new Float32Array(count*3*(backDepth?2:1)),uv=[],indices=[];
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)uv.push(i/nu,j/nv);
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;indices.push(a,a+1,b,b,a+1,b+1);}
  if(backDepth){const front=[...indices];for(let i=0;i<front.length;i+=3)indices.push(front[i]+count,front[i+2]+count,front[i+1]+count);const edge=[];for(let j=0;j<=nv;j++)edge.push(j);for(let i=1;i<=nu;i++)edge.push(i*(nv+1)+nv);for(let j=nv-1;j>=0;j--)edge.push(nu*(nv+1)+j);for(let i=nu-1;i>0;i--)edge.push(i*(nv+1));for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];indices.push(a,b+count,b,a,a+count,b+count);}uv.push(...uv);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const mesh=new THREE.Mesh(geometry,material);mesh.name=upper?'living_upper_lid':'living_lower_lid';mesh.visible=false;eye.add(mesh);meshes.push({mesh,upper,positions});
 }
 function update(amount){
  const count=(nu+1)*(nv+1);
  for(const {mesh,upper,positions} of meshes){mesh.visible=amount>1e-5;if(!mesh.visible)continue;
   for(let i=0;i<=nu;i++){
    const u=-1+2*i/nu,lo=lidPoint(u,false),hi=lidPoint(u,true),boundary=upper?hi[1]+(lo[1]-hi[1])*.72*amount:lo[1]+(hi[1]-lo[1])*.28*amount;
    const start=upper?boundary:lo[1],end=upper?hi[1]:boundary;
    for(let j=0;j<=nv;j++){const v=j/nv,k=(i*(nv+1)+j)*3,x=.046+.012*(1-u*u)*Math.sin(Math.PI*v),y=start+(end-start)*v,z=.116*u;const seated=depth?depth(x,y,z):x;if(!Number.isFinite(seated))throw new RangeError('Blink depth callback returned a nonfinite depth');positions[k]=seated;positions[k+1]=y;positions[k+2]=z;if(backDepth){const back=backDepth(y,z);if(!Number.isFinite(back)||back>=seated)throw new RangeError('Blink back depth must lie behind front surface');positions[k+count*3]=back;positions[k+count*3+1]=y;positions[k+count*3+2]=z;}}
   }
   mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
  }
 }
 return {update,geometries:meshes.map(x=>x.mesh.geometry)};
}
