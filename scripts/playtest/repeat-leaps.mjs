// Diagnostic visit model; no user saves or gameplay settings are modified.
import {firstLeapCheckpoint,FACILITIES,TECHS,SKILLS,advance,production,price,buy,buyTech,evolve,inheritance,inherit,buySkill,skillCost,skillUnlocked,leapThreshold,leapGain,leap,buyInnovation,innovationCost,innovationReady,facilityRate,gather,effectiveSkillLevel} from '../../engine.js';

function buyInnovations(s, policy='economy') {
  // Base is essential. The follow-up order favors scalable output, then its exponent.
  if (!s.innovations[0] && s.insight >= innovationCost(s,0)) buyInnovation(s,0);
  const order = policy==='discount' ? [3,1,2,4] : [1,2,3,4];
  let changed=true;
  while(changed){changed=false; for(const i of order) if(innovationReady(s,i)&&s.innovations[i] < [1,5,3,5,1][i]&&s.insight>=innovationCost(s,i)) changed=buyInnovation(s,i)||changed;}
}
function buySkills(s) {
  let count=0;
  while(count++<200){
    const choices=SKILLS.map((skill,i)=>({i,cost:skillUnlocked(s,i)&&effectiveSkillLevel(s,i)<skill.max?skillCost(s,i):Infinity})).sort((a,b)=>a.cost-b.cost);
    if(choices[0].cost>s.points)break;
    if(!buySkill(s,choices[0].i))break;
  }
}
function buyFacilities(s,limit=100){
  let k=0;
  for(;k<limit;k++){
    let best=-1, bestV=-1;
    for(let i=0;i<FACILITIES.length;i++){
      if(FACILITIES[i].era>s.era||s.owned[i]>=1000)continue;
      const c=price(s,i);if(c>s.money)continue;
      const old=s.owned[i];s.owned[i]++; const v=(facilityRate(s,i)-facilityRate({...s,owned:s.owned.map((n,j)=>j===i?n-1:n)},i))/c;s.owned[i]=old;
      if(v>bestV){best=i;bestV=v;}
    }
    if(best<0)break;buy(s,best);
  }
  return k;
}
function simulate({interval=900,sleep=true,leapMultiplier=1,inheritAt=10,maxInherit=10,days=7,innovation='economy',manualClicks=3,purchaseLimit=100}){
 const s=firstLeapCheckpoint(),events=[];let t=0,visits=0,inheritCount=0,firstInfo=null,firstCalc=null,firstData=null,firstRunAt=null,stagnationStart=null,longestNoLeap=0,lastLeapAt=0,lastLeapRunEarned=0,frameGuard=0; const snapshots={};
 buyInnovations(s,innovation);
 while(t < days*86400 && frameGuard++ < 200000){
   const day=t%86400, until=days*86400-t;
   const dt=Math.min(sleep?(day>=16*3600?86400-day:Math.min(interval,16*3600-day)):interval,until);
   if(dt<=0)break;
   advance(s,dt); t+=dt; visits++;
   for(let i=0;i<manualClicks;i++)gather(s);
   let techChanged=true,guard=0;
   while(techChanged&&guard++<2){techChanged=false;for(let i=0;i<TECHS.length;i++) if(buyTech(s,i))techChanged=true;}
   let evoGuard=0;while(evolve(s)&&evoGuard++<3){}
   if(s.era===3&&!firstInfo)firstInfo=t;
   if(s.owned[9]>0&&!firstCalc)firstCalc=t;
   if(s.owned[10]>0&&!firstData)firstData=t;
   const th=leapThreshold(s);
   const target=th*leapMultiplier;
   if(s.leapUnlocked&&s.era>=2&&s.techs[5]&&s.earned>=target){
      const gain=leapGain(s), beforeSkills=s.skills.reduce((a,b)=>a+b,0), earned=s.earned, cycles=s.cycles;
      events.push({type:'leap',hour:+(t/3600).toFixed(2),ascension:s.ascensions+1,threshold:th,earned:earned.toExponential(3),insight:gain,skillsLost:beforeSkills,preEra:s.era});
      leap(s); buyInnovations(s,innovation); inheritCount=0; lastLeapAt=t;lastLeapRunEarned=earned;stagnationStart=null;
      continue;
   }
   const ig=inheritance(s);
   if(ig>=inheritAt&&inheritCount<maxInherit){
      events.push({type:'inherit',hour:+(t/3600).toFixed(2),gain:ig,earned:s.earned.toExponential(3),skills:[...s.skills]});
      inherit(s);inheritCount++;buySkills(s);
   }
   buySkills(s);
   buyFacilities(s,purchaseLimit);
   for(const d of [3,7,30])if(!snapshots[d]&&t>=d*86400)snapshots[d]={day:d,earned:s.earned,production:production(s),era:s.era,owned:[...s.owned],skills:[...s.skills],points:s.points,cycles:s.cycles,ascensions:s.ascensions,insight:s.insight,innovations:[...s.innovations],threshold:leapThreshold(s),ratio:+(s.earned/leapThreshold(s)).toFixed(5)};
   if(t-lastLeapAt>longestNoLeap)longestNoLeap=t-lastLeapAt;
 }
 const elapsed=(a)=>a==null?null:+(a/3600).toFixed(2);
 return {strategy:{interval,sleep,leapMultiplier,inheritAt,maxInherit,innovation,manualClicks,purchaseLimit,days},reachedLeaps:events.filter(x=>x.type==='leap'),snapshots,firstInformationEraHours:elapsed(firstInfo),firstCalculatorCenterHours:elapsed(firstCalc),firstDataCenterHours:elapsed(firstData),final:{hour:elapsed(t),earned:s.earned,earnedLog10:s.earned>0?+Math.log10(s.earned).toFixed(3):null,threshold:leapThreshold(s),thresholdRatio:+(s.earned/leapThreshold(s)).toFixed(4),production:production(s),productionLog10:production(s)>0?+Math.log10(production(s)).toFixed(3):null,era:s.era,owned:[...s.owned],skills:[...s.skills],points:s.points,cycles:s.cycles,ascensions:s.ascensions,insight:s.insight,innovations:[...s.innovations],nextInformationPrices:[price(s,9),price(s,10),price(s,11)],elapsedSeconds:s.elapsed,visits,historyBestRun:s.history.bestRun},events};
}

const args=process.argv.slice(2);
function arg(name, fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const interval=Number(arg('--interval','900'));
const days=Number(arg('--days','7'));
const maxArg=arg('--inherit-max','10');
const maxInherit=maxArg==='unlimited'?Infinity:Number(maxArg);
const leapMultiplier=Number(arg('--leap-multiplier','1'));
const inheritAt=Number(arg('--inherit-at','10'));
const out=simulate({interval,sleep:arg('--sleep','8h')!=='none',leapMultiplier,inheritAt,maxInherit,days,innovation:arg('--innovation','economy'),manualClicks:Number(arg('--clicks','3')),purchaseLimit:Number(arg('--purchase-limit','100'))});
console.log(JSON.stringify({...out,inheritanceEvents:out.events.filter(e=>e.type==='inherit')},null,2));
