// Ordinary finite values use Number. Huge values use decimal logs, plus a
// relative scale when adding that scale's log would be lost to float precision.
export const isValue=n=>typeof n==='number'?Number.isFinite(n)&&n>=0:!!n&&typeof n==='object'&&Object.keys(n).every(k=>['log10','scale'].includes(k))&&Number.isFinite(n.log10)&&n.log10>308&&(n.scale===undefined||(Number.isFinite(n.scale)&&n.scale>0));
const exponent=n=>typeof n==='number'?Math.log10(n):n.log10;
const scale=n=>typeof n==='number'?1:(n.scale??1);
export const log10=n=>exponent(n)+Math.log10(scale(n));
export function fromLog10(e,factor=1){
 if(e===-Infinity||factor===0)return 0;if(!Number.isFinite(e)||!Number.isFinite(factor)||factor<0)throw new RangeError('Nonfinite exponent or scale');
 if(Math.abs(factor-1)<1e-14)factor=1;
 const normalized=e+Math.log10(factor);if(normalized<=308)return 10**normalized;
 return normalized!==e||factor===1?{log10:normalized}:{log10:e,scale:factor};
}
export function compare(a,b){if(typeof a==='number'&&typeof b==='number')return Math.sign(a-b);const x=log10(a),y=log10(b);if(x!==y)return Math.sign(x-y);const sa=scale(a),sb=scale(b);return Math.abs(sa-sb)<=1e-12*Math.max(sa,sb)?0:Math.sign(sa-sb);}
export function add(a,b){if(typeof a==='number'&&typeof b==='number'&&Number.isFinite(a+b))return a+b;const x=exponent(a),y=exponent(b);return x>=y?fromLog10(x,scale(a)+scale(b)*10**(y-x)):fromLog10(y,scale(b)+scale(a)*10**(x-y));}
export function subtract(a,b){if(compare(a,b)<=0)return 0;if(typeof a==='number'&&typeof b==='number')return a-b;const x=exponent(a),y=exponent(b);return fromLog10(x,scale(a)-scale(b)*10**(y-x));}
export function multiply(a,b){if(a===0||b===0)return 0;if(typeof a==='number'&&typeof b==='number'&&Number.isFinite(a*b))return a*b;if(typeof a==='number')return fromLog10(exponent(b),scale(b)*a);if(typeof b==='number')return fromLog10(exponent(a),scale(a)*b);return fromLog10(exponent(a)+exponent(b),scale(a)*scale(b));}
export const maxValue=(a,b)=>compare(a,b)>=0?a:b;
export const floorValue=n=>typeof n==='number'?Math.floor(n):n;
