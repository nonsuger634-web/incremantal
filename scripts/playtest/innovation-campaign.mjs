// Diagnostic player model; does not modify saves or gameplay settings.
import {firstLeapCheckpoint,FACILITIES,TECHS,SKILLS,buy,price,production,advance,gather,buyTech,evolve,inherit,inheritance,buySkill,skillCost,skillUnlocked,buyInnovation,INNOVATIONS,leapGain,effectiveSkillLevel} from '../../engine.js';
const interval=900,clicks=3,sleep=true,days=14,purchases=100;
const routes={mass:[1],theory:[2],info:[3],fusion:[1,2,4]};
function invest(s,points,route){s.insight+=points;const seq=routes[route];let changed=true;while(changed){changed=false;for(const i of seq)if(buyInnovation(s,i))changed=true;}}
function simulate(extra,route){
 const s=firstLeapCheckpoint();buyInnovation(s,0);invest(s,extra,route);const startingInnovation=[...s.innovations];
 let infoEra=null,infoBuilding=null,nextLeap=null,realTime=0;
 while(realTime<days*86400){
  const dayTime=realTime%86400;const dt=Math.min(sleep?(dayTime>=16*3600?86400-dayTime:Math.min(interval,16*3600-dayTime)):interval,days*86400-realTime);
  advance(s,dt);realTime+=dt;for(let i=0;i<clicks;i++)gather(s);
  for(let i=0;i<TECHS.length;i++)buyTech(s,i);
  if(evolve(s)&&s.era===3)infoEra??=realTime;
  if(leapGain(s)>0){nextLeap=realTime;break;}
  if(s.owned[9]>0)infoBuilding??=realTime;
  // This benchmark deliberately does not take normal inheritances after the leap.
  while(true){const choices=SKILLS.map((sk,i)=>({i,cost:skillUnlocked(s,i)&&effectiveSkillLevel(s,i)<sk.max?skillCost(s,i):Infinity})).sort((a,b)=>a.cost-b.cost);if(choices[0].cost>s.points)break;buySkill(s,choices[0].i);}
  for(let k=0;k<purchases;k++){
   const candidates=FACILITIES.map((f,i)=>{if(f.era>s.era||price(s,i)>s.money||s.owned[i]>=1000)return{i,value:-1};const next=structuredClone(s),cost=price(s,i);buy(next,i);return{i,value:(production(next)-production(s))/cost};}).sort((a,b)=>b.value-a.value);
   if(candidates[0].value<0)break;buy(s,candidates[0].i);
  }
 }
 return {extraInsight:extra,route,startingInnovation,startingInsight:s.insight,informationEraHours:infoEra===null?null:+(infoEra/3600).toFixed(2),firstInformationFacilityHours:infoBuilding===null?null:+(infoBuilding/3600).toFixed(2),nextLeapHours:nextLeap===null?null:+(nextLeap/3600).toFixed(2),elapsedHours:+(realTime/3600).toFixed(2),elapsedDays:days,earned:s.earned,productionPerSecond:production(s)};
}
for(const extra of [3,8,19])for(const route of extra===19?['mass','theory','info','fusion']:['mass','theory','info'])console.log(JSON.stringify(simulate(extra,route)));
