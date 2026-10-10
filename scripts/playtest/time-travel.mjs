// One-hour-visit diagnostic from the first time-travel checkpoint.
// Simulates only in-memory state; engine.js and user saves are untouched.
import {
  timeCheckpoint,timeSkillCost,buyTimeSkill,TIME_SKILLS,
  transcendThreshold,transcendGain,transcend,timeThreshold,timeGain,timeTravel,
  buyTranscendSkill,transcendSkillCost,transcendSkillReady,TRANSCEND_SKILLS,
  FACILITIES,TECHS,advance,production,price,buy,buyTech,evolve,facilityRate,
  facilityUnlocked,validateSave,
} from '../../engine.js';

function researchAndEvolve(s){
  for(let round=0;round<6;round++){
    let changed=false;
    for(let i=0;i<TECHS.length;i++)if(buyTech(s,i))changed=true;
    if(evolve(s))changed=true;
    if(!changed)break;
  }
}
function buyFacilities(s,limit=100){
  let count=0;
  for(;count<limit;count++){
    const baseProduction=production(s);let best=-1,bestValue=-1;
    for(let i=0;i<FACILITIES.length;i++){
      if(!facilityUnlocked(s,i)||s.owned[i]>=1000||price(s,i)>s.money)continue;
      const cost=price(s,i),old=s.owned[i];s.owned[i]++;
      const value=(production(s)-baseProduction)/cost;s.owned[i]=old;
      if(value>bestValue){best=i;bestValue=value;}
    }
    if(best<0||!buy(s,best))break;
  }
  return count;
}
function buyTranscendSkills(s,hour,events){
  const order=[1,2,3];let changed=true,guard=0;
  while(changed&&guard++<16){
    changed=false;
    for(const i of order)while(transcendSkillReady(s,i)&&s.horizon>=transcendSkillCost(s,i)){
      const cost=transcendSkillCost(s,i),before=[...s.transcendSkills];
      if(!buyTranscendSkill(s,i))break;
      events.push({type:'transcendSkill',hour:+hour.toFixed(3),skill:TRANSCEND_SKILLS[i].name,level:s.transcendSkills[i],cost,skillsBefore:before,skillsAfter:[...s.transcendSkills],horizon:s.horizon});
      changed=true;
    }
  }
}
function finiteState(s){
  return [s.money,s.earned,s.lifetime,s.elapsed,s.horizon,s.chronons,production(s),...
    s.owned,...s.skills,...s.transcendSkills,...s.timeSkills].every(Number.isFinite);
}

function buyTimePrioritySkill(s,priority,hour,events){
  const i=priority==='causal'?1:2;
  while(s.chronons>=timeSkillCost(s,i)&&s.timeSkills[i]<TIME_SKILLS[i].max){
    const cost=timeSkillCost(s,i);
    if(!buyTimeSkill(s,i))break;
    events.push({type:'buyTimeSkill',hour:+hour.toFixed(3),skill:TIME_SKILLS[i].name,index:i,cost,level:s.timeSkills[i],chronons:s.chronons,timeSkills:[...s.timeSkills],production:production(s)});
  }
}

function simulate({priority,days,targetTimeJumps}){
  const s=timeCheckpoint();
  const initial={timeJumps:s.timeJumps,chronons:s.chronons,timeSkills:[...s.timeSkills],transcendences:s.transcendences,horizon:s.horizon,transcendSkills:[...s.transcendSkills],cleared:s.cleared,clearScore:s.clearScore,clearElapsed:s.clearElapsed,clearAcknowledged:s.clearAcknowledged,money:s.money,earned:s.earned,era:s.era,owned:[...s.owned],techCount:s.techs.filter(Boolean).length,valid:validateSave(s)};
  if(s.timeJumps!==1||s.chronons!==1||s.cleared!==true)throw new Error(`Unexpected time checkpoint: ${JSON.stringify(initial)}`);
  const events=[],firstSkillCost=timeSkillCost(s,0);
  if(!buyTimeSkill(s,0))throw new Error('Unable to buy initial time skill');
  events.push({type:'buyTimeSkill',hour:0,skill:TIME_SKILLS[0].name,index:0,cost:firstSkillCost,timeSkills:[...s.timeSkills],production:production(s)});

  const interval=3600,cap=days*86400;
  let t=0,visits=0,guard=0,nonFiniteAt=null;
  const timeTravelEvents=[],transEvents=[],snapshots={};
  while(t<cap&&s.timeJumps<targetTimeJumps&&guard++<200000){
    const dt=Math.min(interval,cap-t);
    advance(s,dt);t+=dt;visits++;
    if(!finiteState(s)){nonFiniteAt=t;break;}
    researchAndEvolve(s);
    const facilitiesBought=buyFacilities(s,100);
    researchAndEvolve(s);
    if(facilitiesBought&&s.era===4&&s.owned.slice(12,15).some(n=>n>0)&&!events.some(e=>e.type==='firstCosmicFacilities'))events.push({type:'firstCosmicFacilities',hour:+(t/3600).toFixed(3),owned:s.owned.slice(12,15)});

    // Favor an actual time jump when possible; use lower transcends between jumps.
    const tg=timeGain(s);
    if(tg>0){
      const before={timeJumps:s.timeJumps,chronons:s.chronons,timeThreshold:timeThreshold(s),timeGain:tg,earned:s.earned,cleared:s.cleared,clearScore:s.clearScore,clearElapsed:s.clearElapsed,clearAcknowledged:s.clearAcknowledged,timeSkills:[...s.timeSkills],transcendences:s.transcendences,horizon:s.horizon,transcendSkills:[...s.transcendSkills]};
      if(!timeTravel(s))throw new Error('timeGain was positive but timeTravel failed');
      const after={timeJumps:s.timeJumps,chronons:s.chronons,timeThreshold:timeThreshold(s),money:s.money,earned:s.earned,cleared:s.cleared,clearScore:s.clearScore,clearElapsed:s.clearElapsed,clearAcknowledged:s.clearAcknowledged,timeSkills:[...s.timeSkills],transcendences:s.transcendences,horizon:s.horizon,transcendSkills:[...s.transcendSkills],era:s.era,owned:[...s.owned],techCount:s.techs.filter(Boolean).length,production:production(s),valid:validateSave(s)};
      const record={hour:+(t/3600).toFixed(3),before,after};
      timeTravelEvents.push(record);events.push({type:'timeTravel',...record});
      if(s.timeJumps<targetTimeJumps)buyTimePrioritySkill(s,priority,t/3600,events);
      if(!finiteState(s)){nonFiniteAt=t;break;}
      continue;
    }
    const lowerGain=transcendGain(s);
    if(lowerGain>0){
      const before={transcendences:s.transcendences,gain:lowerGain,threshold:transcendThreshold(s),earned:s.earned,era:s.era,techCount:s.techs.filter(Boolean).length,owned:[...s.owned],horizon:s.horizon,transcendSkills:[...s.transcendSkills],timeJumps:s.timeJumps,chronons:s.chronons,timeSkills:[...s.timeSkills]};
      if(!transcend(s))throw new Error('transcendGain was positive but transcend failed');
      const after={money:s.money,earned:s.earned,era:s.era,techCount:s.techs.filter(Boolean).length,owned:[...s.owned],maxOwned:[...s.history.maxOwned],transcendences:s.transcendences,horizon:s.horizon,transcendSkills:[...s.transcendSkills],timeJumps:s.timeJumps,chronons:s.chronons,timeSkills:[...s.timeSkills],cleared:s.cleared,clearScore:s.clearScore,clearElapsed:s.clearElapsed,clearAcknowledged:s.clearAcknowledged,finite:finiteState(s),valid:validateSave(s)};
      const record={hour:+(t/3600).toFixed(3),before,after};
      transEvents.push(record);events.push({type:'lowerTranscend',...record});
      buyTranscendSkills(s,t/3600,events);
    }
    for(const d of [1,3,7,14,30])if(!snapshots[d]&&t>=d*86400)snapshots[d]={day:d,hour:+(t/3600).toFixed(3),earned:s.earned,production:production(s),era:s.era,transcendences:s.transcendences,horizon:s.horizon,owned:s.owned.slice(9,15),chronons:s.chronons,timeSkills:[...s.timeSkills]};
  }
  return {strategy:{checkpoint:'timeCheckpoint()',visitIntervalSeconds:interval,sleep:false,manualClicks:0,normalInheritance:false,normalLeap:false,facilityPurchasesPerVisit:100,lowerTranscendence:'automatic when available; spend Horizon on dimension then price discount',timeSkillPriority:priority,targetTimeJumps,days},initial,initialTimeSkillPurchase:events[0],milestones:{timeTravelHours:timeTravelEvents.map(x=>x.hour),lowerTranscendenceHours:transEvents.map(x=>x.hour),nextTimeThreshold:timeThreshold(s)},timeTravels:timeTravelEvents,lowerTranscendences:transEvents,snapshots,finite:nonFiniteAt===null&&finiteState(s),nonFiniteAtHour:nonFiniteAt===null?null:+(nonFiniteAt/3600).toFixed(3),final:{hour:+(t/3600).toFixed(3),visits,timeJumps:s.timeJumps,chronons:s.chronons,timeSkills:[...s.timeSkills],transcendences:s.transcendences,horizon:s.horizon,transcendSkills:[...s.transcendSkills],money:s.money,earned:s.earned,production:production(s),era:s.era,owned:[...s.owned],maxOwned:[...s.history.maxOwned],techCount:s.techs.filter(Boolean).length,cleared:s.cleared,clearScore:s.clearScore,clearElapsed:s.clearElapsed,clearAcknowledged:s.clearAcknowledged,valid:validateSave(s)},events};
}

const args=process.argv.slice(2),dayIndex=args.indexOf('--days'),jumpIndex=args.indexOf('--jumps');
const days=Number(dayIndex<0?'30':args[dayIndex+1]),targetTimeJumps=Number(jumpIndex<0?'3':args[jumpIndex+1]);
const results=['causal','memory'].map(priority=>simulate({priority,days,targetTimeJumps}));
console.log(JSON.stringify(results,null,2));
