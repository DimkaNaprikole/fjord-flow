/** Local continuous skull relief in U; no textures, tubes or anchor changes.
 * Compact C2 masks protect nose/lips/ocular margins and the rear skull.
 */
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
const window=(x,a,b,fade)=>smooth((x-a)/fade)*smooth((b-x)/fade);
const gaussian=x=>Math.exp(-x*x);
const ridge=(q,w)=>gaussian(q/w)-.5*gaussian((q-1.5*w)/w)-.5*gaussian((q+1.5*w)/w);
export function sphynxFoldDisplacement({y,angle,z,rx,rz}){
 if(![y,angle,z,rx,rz].every(Number.isFinite)||rx<=0||rz<=0)throw new RangeError('Finite skull coordinates and positive section radii are required');
 const c=Math.cos(angle),s=Math.sin(angle),az=Math.abs(z),front=smooth((c-.15)/.5);
 const ocularRadius=Math.hypot((y-.095)/.105,(az-.232)/.125),ocular=smooth((ocularRadius-1)/.28);
 const forehead=window(y,.190,.350,.025)*smooth((.285-az)/.035);
 // Broad shallow arcs follow the forehead, with neighbouring troughs instead
 // of a raised stripe. Their heights bow slightly towards the lateral brow.
 let relief=0;for(const [height,amplitude,width]of [[.215,.0045,.018],[.258,.0055,.019],[.302,.004,.017]])relief+=forehead*amplitude*ridge(y-height-.022*(z/.24)**2,width);
 const brow=window(y,.190,.270,.025)*window(az,.045,.295,.04);
 relief+=brow*.0045*ridge(y-(.205+.035*(az/.25)**1.4),.017);
 const cheek=window(y,-.145,.015,.025)*window(az,.13,.335,.04);
 for(const centre of [-.105,-.060])relief+=cheek*.0035*ridge(y-centre+.32*(az-.23),.016);
 // Smooth analytic bound, never a discontinuous hard displacement clamp.
 const amount=.012*Math.tanh(front*ocular*relief/.012),nx=c/rx,nz=s/rz,n=Math.hypot(nx,nz);
 if(amount===0)return {x:0,y:0,z:0,amount:0};
 return {x:amount*nx/n,y:0,z:amount*nz/n,amount};
}
