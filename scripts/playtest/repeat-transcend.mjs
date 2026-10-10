// Repeat-transcend diagnostic. Uses in-memory state and the current engine rules.
import {
  transcendCheckpoint,FACILITIES,TECHS,advance,production,price,buy,buyTech,evolve,
  buyTranscendSkill,transcendSkillReady,transcendSkillCost,transcendThreshold,
  transcendGain,transcend,facilityRate,TRANSCEND_SKILLS,facilityUnlocked,productionExponent,
} from '../../engine.js';

function buyFacility(s,i){
  if(!facilityUnlocked(s,i))return false;
  return buy(s,i);
}

function buyTranscendSkills(s,priority,atHour,events){
  const order=priority==='discount'?[0,2,1,3]:[0,1,2,3];
  let changed=true,guard=0;
  while(changed&&guard++<20){
    changed=false;
    for(const i of order){
      while(transcendSkillReady(s,i)&&transcendSkillCost(s,i)<=s.horizon){
        const before=s.horizon,beforeProduction=production(s),beforeExponent=productionExponent(s);
        if(!buyTranscendSkill(s,i))break;
        events.push({type:'buyTranscendSkill',hour:+atHour.toFixed(3),node:TRANSCEND_SKILLS[i].name,index:i,level:s.transcendSkills[i],cost:before-s.horizon,horizonRemaining:s.horizon,productionBefore:beforeProduction,productionAfter:production(s),exponentBefore:beforeExponent,exponentAfter:productionExponent(s)});
        changed=true;
      }
    }
  }
}

function researchAndEvolve(s){
  for(let round=0;round<5;round++){
    let changed=false;
    for(let i=0;i<TECHS.length;i++)if(buyTech(s,i))changed=true;
    if(evolve(s))changed=true;
    if(!changed)break;
  }
}

function buyFacilities(s,limit=100){
  let purchases=0;
  for(let n=0;n<limit;n++){
    const oldProduction=production(s);let best=-1,bestValue=-1;
    for(let i=0;i<FACILITIES.length;i++){
      if(!facilityUnlocked(s,i)||FACILITIES[i].era>s.era||s.owned[i]>=1000||price(s,i)>s.money)continue;
      const cost=price(s,i),old=s.owned[i];s.owned[i]++;
      const value=(production(s)-oldProduction)/cost;s.owned[i]=old;
      if(value>bestValue){best=i;bestValue=value;}
    }
    if(best<0||!buyFacility(s,best))break;
    purchases++;
  }
  return purchases;
}

function simulate({interval,days,sleep,priority,purchaseLimit}){
  const s=transcendCheckpoint(),events=[],facilityEvents=[];
  const startedAt=s.elapsed,initialTranscendences=s.transcendences;
  buyTranscendSkills(s,priority,0,events);
  let t=0,visits=0,guard=0,goal=null;
  const transEvents=[];
  const cap=days*86400;
  while(t<cap&&guard++<200000){
    const day=t%86400,until=cap-t;
    const dt=Math.min(sleep?(day>=16*3600?86400-day:Math.min(interval,16*3600-day)):interval,until);
    if(dt<=0)break;
    const beforeMoney=s.money,rate=production(s);
    if(goal===null&&rate>0&&beforeMoney<1e68&&beforeMoney+rate*dt>=1e68){
      const dtToGoal=(1e68-beforeMoney)/rate;
      goal={hour:+((t+dtToGoal)/3600).toFixed(6),transcendences:s.transcendences,transcendenceCountFromCheckpoint:s.transcendences-initialTranscendences};
      advance(s,dtToGoal);t+=dtToGoal;break;
    }
    advance(s,dt);t+=dt;
    if(sleep&&Math.abs(t%86400-16*3600)<1e-6)continue;
    visits++;
    researchAndEvolve(s);
    const before=[...s.owned],beforeEra=s.era;
    const bought=buyFacilities(s,purchaseLimit);
    researchAndEvolve(s);
    if(bought){
      const event={type:'facilityVisit',hour:+(t/3600).toFixed(3),era:s.era,beforeCosmic:before.slice(12,15),afterCosmic:s.owned.slice(12,15),purchases:bought,unlockedCosmic:[12,13,14].filter(i=>facilityUnlocked(s,i))};
      facilityEvents.push(event);
    }
    if(s.era!==beforeEra)events.push({type:'era',hour:+(t/3600).toFixed(3),era:s.era});
    const gain=transcendGain(s);
    if(gain>0){
      const record={hour:+(t/3600).toFixed(3),fromTranscendences:s.transcendences,gain,threshold:transcendThreshold(s),earned:s.earned,earnedOverThreshold:s.earned/transcendThreshold(s),skills:[...s.transcendSkills],horizonBefore:s.horizon};
      if(!transcend(s))throw new Error('transcendGain was positive but transcend failed');
      record.toTranscendences=s.transcendences;transEvents.push(record);
      events.push({type:'transcend',...record});
      buyTranscendSkills(s,priority,t/3600,events);
    }
    if(goal!==null)break;
  }
  return {
    strategy:{intervalSeconds:interval,days,sleep,skillPriority:priority,facilityPurchase:'greedy marginal production per price',purchaseLimitPerVisit:purchaseLimit,normalInheritance:false,normalLeap:false,goal:'money >= 1e68'},
    candidateValues:{transcendSkills:TRANSCEND_SKILLS.map(x=>({name:x.name,description:x.description,base:x.base,growth:x.growth,max:x.max})),thresholdForNextTranscend:transcendThreshold(s),facilityUnlockThresholds:FACILITIES.map((f,i)=>({i,name:f.name,transcendRequired:f.transcendRequired||0})).filter(x=>x.transcendRequired>0)},
    goal,transcends:transEvents,events,facilityEvents,
    final:{hour:+(t/3600).toFixed(3),visits,transcendences:s.transcendences,transcendencesSinceCheckpoint:s.transcendences-initialTranscendences,horizon:s.horizon,transcendSkills:[...s.transcendSkills],money:s.money,earned:s.earned,production:production(s),productionLog10:production(s)>0?+Math.log10(production(s)).toFixed(4):null,era:s.era,owned:[...s.owned],cosmicOwned:s.owned.slice(12,15),unlockedCosmic:[12,13,14].filter(i=>facilityUnlocked(s,i)),elapsedSeconds:s.elapsed+startedAt},
  };
}

const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const interval=Number(arg('--interval','3600')),days=Number(arg('--days','90')),sleep=arg('--sleep','8h')!=='none',purchaseLimit=Number(arg('--purchase-limit','100'));
const priorities=['dimension','discount'];
const results=priorities.map(priority=>simulate({interval,days,sleep,priority,purchaseLimit}));
console.log(JSON.stringify(results,null,2));
