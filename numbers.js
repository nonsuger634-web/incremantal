// Finite values retain ordinary Number arithmetic. Beyond it, store base-ten logs.
export const isValue = n => typeof n==='number'?Number.isFinite(n)&&n>=0:!!n&&typeof n==='object'&&Object.keys(n).length===1&&Number.isFinite(n.log10)&&n.log10>308;
export const log10 = n => typeof n==='number'?Math.log10(n):n.log10;
export function fromLog10(e){if(e===-Infinity)return 0;if(!Number.isFinite(e))throw new RangeError('Nonfinite exponent');return e<=308?10**e:{log10:e};}
export function compare(a,b){if(typeof a==='number'&&typeof b==='number')return Math.sign(a-b);return Math.sign(log10(a)-log10(b));}
export function add(a,b){if(typeof a==='number'&&typeof b==='number'&&Number.isFinite(a+b))return a+b;const x=log10(a),y=log10(b),hi=Math.max(x,y),lo=Math.min(x,y);return fromLog10(hi+Math.log10(1+10**(lo-hi)));}
export function subtract(a,b){if(compare(a,b)<=0)return 0;if(typeof a==='number'&&typeof b==='number')return a-b;const x=log10(a),y=log10(b);return fromLog10(x+Math.log10(1-10**(y-x)));}
export function multiply(a,b){if(a===0||b===0)return 0;if(typeof a==='number'&&typeof b==='number'&&Number.isFinite(a*b))return a*b;return fromLog10(log10(a)+log10(b));}
export const maxValue=(a,b)=>compare(a,b)>=0?a:b;
export const floorValue=n=>typeof n==='number'?Math.floor(n):n;
