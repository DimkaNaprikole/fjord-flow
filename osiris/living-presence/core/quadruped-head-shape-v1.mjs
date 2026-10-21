/** Isolated C2 skull-only shape map. X is unchanged; Y is strictly monotonic
 * at fixed X, and Z has positive local scale. No jaw pinch or anchor mapping.
 */
function ramp(t){if(t<=0)return {w:0,d:0};if(t>=1)return {w:1,d:0};return {w:t*t*t*(10+t*(-15+6*t)),d:30*t*t*(t-1)*(t-1)};}
function weights(x,y){
 const a=ramp((x+.16)/.24),b=ramp((y-.190)/.14),c=ramp((.15-x)/.20),lo=ramp((y+.310)/.10),hi=ramp((.015-y)/.10);
 return {roof:a.w*b.w,roofX:a.d/.24*b.w,roofY:a.w*b.d/.14,lower:c.w*lo.w*hi.w,lowerX:-c.d/.20*lo.w*hi.w,lowerY:c.w*(lo.d/.10*hi.w-lo.w*hi.d/.10)};
}
const valid=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
export function headShapeDisplacement(p){
 if(!valid(p))throw new RangeError('Finite skull coordinates required');const w=weights(p.x,p.y);
 return {x:0,y:(-.040*w.roof+.020*w.lower)||0,z:(-.065*p.z*w.lower)||0};
}
export function headShapeJacobian(p){
 if(!valid(p))throw new RangeError('Finite skull coordinates required');const w=weights(p.x,p.y);
 const matrix=[[1,0,0],[-.040*w.roofX+.020*w.lowerX,1-.040*w.roofY+.020*w.lowerY,0],[-.065*p.z*w.lowerX,-.065*p.z*w.lowerY,1-.065*w.lower]];
 return {matrix,determinant:matrix[1][1]*matrix[2][2]};
}
export const headShapeParameters=Object.freeze({roofLower:.040,lowerLift:.020,lowerWidthFraction:.065,protectedEyeBand:[.015,.190],jacobianDeterminantLowerBound:1-.040*1.875/.14});
