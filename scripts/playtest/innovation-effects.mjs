// Diagnostic player model; does not modify saves or gameplay settings.
import {INNOVATIONS} from '../../engine.js';
const log5=Math.log10(5);
function output(raw,levels){const exponent=1+.025*levels[2]+.05*levels[4];const additive=levels[0]+levels[1]*log5;return 10**Math.min(200,(Math.log10(raw)+additive)*exponent);}
const variants={mass1:[1,1,0,0,0],theory1:[1,0,1,0,0],info1:[1,0,0,1,0],legalTheoryFusion:[1,2,1,0,1]};
for(const raw of [1,1e6,1e11,1e15]){
 const base=output(raw,[1,0,0,0,0]); const vals={raw,foundationOnly:base};
 for(const [name,levels] of Object.entries(variants)) vals[name]={ratio:+(output(raw,levels)/base).toPrecision(5),totalInsightCost:levels.reduce((sum,n,i)=>sum+Array.from({length:n},(_,j)=>INNOVATIONS[i].base*INNOVATIONS[i].growth**j).reduce((a,x)=>a+x,0),0)};
 console.log(JSON.stringify(vals));
}
console.log(JSON.stringify({costSchedule:INNOVATIONS.map(x=>({name:x.name,base:x.base,growth:x.growth,max:x.max,perLevel:Array.from({length:x.max},(_,n)=>x.base*x.growth**n)})),fusionRequirements:INNOVATIONS[4].requires,informationDiscountLevels:[0,1,2,3,4,5].map(n=>({level:n,factor:.8**n,savingPercent:+((1-.8**n)*100).toFixed(3)}))}));
