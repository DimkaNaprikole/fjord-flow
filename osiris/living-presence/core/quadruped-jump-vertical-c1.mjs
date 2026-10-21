/** Isolated bounded C1 envelope; ballistic flight and its height stay exact.
 * Higher jumps deepen the preparatory crouch just enough for a monotone push.
 * Candidate real-chain preflight still decides whether that stance is feasible.
 */
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(10+t*(-15+6*t));};
export function boundedJumpVertical({progress,height,duration,unit=1}){
 if(![progress,height,duration,unit].every(Number.isFinite)||height<=0||duration<=0||unit<=0)throw new RangeError('Invalid C1 jump envelope');
 if(height>1.5*unit)throw Object.assign(new RangeError('C1 jump exceeds the core height envelope of 1.5U'),{code:'jump-c1-height'});
 const t=Math.max(0,Math.min(1,progress)),V=4*height/(.42*duration),C=Math.max(.23*unit,V*.12*duration/3);
 let lift=0,compression=0;
 if(t<.18)compression=-C*smooth(t/.18);
 else if(t<.30){const s=(t-.18)/.12,M=V*.12*duration;compression=-C+(3*C-M)*s*s+(M-2*C)*s*s*s;}
 else if(t<.72){const z=(t-.30)/.42;lift=4*height*z*(1-z);}
 else{const stopTime=Math.min(.08*duration,.36*unit/V),depth=.5*V*stopTime,elapsed=(t-.72)*duration;
  compression=elapsed<stopTime?-V*elapsed+.5*V/stopTime*elapsed*elapsed:-depth*(1-smooth((elapsed-stopTime)/(.28*duration-stopTime)));
 }
 return {lift,compression,jumpPhase:t<.18?'prepare':t<.30?'push':t<.72?'flight':t<.84?'front-land':'hind-settle'};
}
