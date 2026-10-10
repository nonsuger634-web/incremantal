import {fresh,FACILITIES,TECHS,buy,price,production,advance,gather,buyTech,evolve,inheritance,inherit,buySkill,SKILLS,skillCost,skillUnlocked,leapGain,leap,buyInnovation} from '../engine.js';
// Deterministic reference player. Explicit check-ins, optional manual work,
// a daily sleep gap, and no hidden automatic purchases or free upgrades.
export function simulate({interval=60,days=7,clicks=0,sleep=false,purchases=100}={}){
 const s=fresh(),events=[];let firstInheritance=null,firstLeap=null,information=null,firstInformationFacility=null;
 for(let realTime=0;realTime<days*86400;){
  const dayTime=realTime%86400;
  const dt=Math.min(sleep?(dayTime>=16*3600?86400-dayTime:Math.min(interval,16*3600-dayTime)):interval,days*86400-realTime);
  advance(s,dt);realTime+=dt;
  for(let i=0;i<clicks;i++)gather(s);
  for(let i=0;i<TECHS.length;i++)if(buyTech(s,i)&&TECHS[i].kind==='era')events.push({hour:+(realTime/3600).toFixed(2),technology:TECHS[i].name});
  if(evolve(s)){events.push({hour:+(realTime/3600).toFixed(2),era:s.era});if(s.era===3)information??=realTime;}
  if(leapGain(s)&&!firstLeap){firstLeap=realTime;events.push({hour:+(realTime/3600).toFixed(2),leapInsight:leapGain(s)});leap(s);buyInnovation(s,0);}
  if(s.owned[9]>0){firstInformationFacility=realTime;break;}
  if(!s.leapUnlocked&&inheritance(s)>=10){
   firstInheritance??=realTime;events.push({hour:+(realTime/3600).toFixed(2),inheritancePoints:inheritance(s)});inherit(s);
  }
  while(true){
   const choices=SKILLS.map((skill,i)=>({i,cost:skillUnlocked(s,i)&&s.skills[i]<skill.max?skillCost(s,i):Infinity})).sort((a,b)=>a.cost-b.cost);
   if(choices[0].cost>s.points)break;if(!buySkill(s,choices[0].i))throw Error('Invalid skill strategy');
  }
  // At most a bounded number of manual bulk purchases per check-in, by marginal output/cost.
  for(let k=0;k<purchases;k++){
   const candidates=FACILITIES.map((f,i)=>{
    if(f.era>s.era||price(s,i)>s.money||s.owned[i]>=1000)return {i,value:-1};
    const next=structuredClone(s),cost=price(s,i);buy(next,i);return {i,value:(production(next)-production(s))/cost};
   }).sort((a,b)=>b.value-a.value);
   if(candidates[0].value<0)break;buy(s,candidates[0].i);
  }
 }
 const hours=v=>v===null?null:+(v/3600).toFixed(2);
 return {strategy:{intervalSeconds:interval,clicksPerVisit:clicks,eightHourSleep:sleep,purchasesPerVisit:purchases},firstInheritanceHours:hours(firstInheritance),firstLeapHours:hours(firstLeap),informationEraHours:hours(information),firstInformationFacilityHours:hours(firstInformationFacility),cycles:s.cycles,events};
}
if(process.argv[1]?.endsWith('balance.js')){
 for(const options of [{interval:60},{interval:900,clicks:3,sleep:true},{interval:10800,clicks:3,sleep:true}]){
  const result=simulate(options);console.log(JSON.stringify(result,null,2));
  if(!result.firstInformationFacilityHours)process.exitCode=1;
 }
}
