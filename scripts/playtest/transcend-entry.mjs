// Copy of the repeat-leap visit model with an explicit terminal transcend path.
import {
  firstLeapCheckpoint,FACILITIES,TECHS,SKILLS,advance,production,price,buy,buyTech,evolve,
  inheritance,inherit,buySkill,skillCost,skillUnlocked,leapThreshold,leapGain,leap,
  buyInnovation,innovationCost,innovationReady,facilityRate,gather,effectiveSkillLevel,
  transcendGain,transcendThreshold,transcend,
} from '../../engine.js';

function buyInnovations(s,policy='economy'){
  if(!s.innovations[0]&&s.insight>=innovationCost(s,0))buyInnovation(s,0);
  const order=policy==='discount'?[3,1,2,4]:[1,2,3,4];let changed=true;
  while(changed){changed=false;for(const i of order)if(innovationReady(s,i)&&s.innovations[i]<[1,5,3,5,1][i]&&s.insight>=innovationCost(s,i))changed=buyInnovation(s,i)||changed;}
}
function buySkills(s){
  let count=0;while(count++<200){
    const choices=SKILLS.map((skill,i)=>({i,cost:skillUnlocked(s,i)&&effectiveSkillLevel(s,i)<skill.max?skillCost(s,i):Infinity})).sort((a,b)=>a.cost-b.cost);
    if(choices[0].cost>s.points)break;if(!buySkill(s,choices[0].i))break;
  }
}
function buyFacilities(s,limit=100){
  let k=0;for(;k<limit;k++){
    let best=-1,bestV=-1;
    for(let i=0;i<FACILITIES.length;i++){
      if(FACILITIES[i].era>s.era||s.owned[i]>=1000)continue;
      const c=price(s,i);if(c>s.money)continue;
      const old=s.owned[i];s.owned[i]++;
      const v=(facilityRate(s,i)-facilityRate({...s,owned:s.owned.map((n,j)=>j===i?n-1:n)},i))/c;
      s.owned[i]=old;if(v>bestV){best=i;bestV=v;}
    }
    if(best<0)break;buy(s,best);
  }
  return k;
}

function simulate({interval=3600,sleep=true,inheritAt=10,maxInherit=3,days=30,innovation='economy',manualClicks=3,purchaseLimit=100}){
  const s=firstLeapCheckpoint(),events=[];let t=0,visits=0,inheritCount=0,frameGuard=0;
  let firstInfo=null,firstCalc=null,firstData=null,asc3At=null,post3Info=null,post3Calc=null,post3Data=null,tech7At=null,transAt=null;
  buyInnovations(s,innovation);
  const cap=days*86400,snapshots={};
  while(t<cap&&frameGuard++<200000){
    const day=t%86400,until=cap-t;
    const dt=Math.min(sleep?(day>=16*3600?86400-day:Math.min(interval,16*3600-day)):interval,until);
    if(dt<=0)break;
    advance(s,dt);t+=dt;
    // Treat the sleep start as no-visit time; idle production continues.
    if(sleep&&Math.abs(t%86400-16*3600)<1e-6)continue;
    visits++;
    for(let i=0;i<manualClicks;i++)gather(s);
    let techChanged=true,guard=0;
    while(techChanged&&guard++<2){techChanged=false;for(let i=0;i<TECHS.length;i++)if(buyTech(s,i))techChanged=true;}
    let evoGuard=0;while(evolve(s)&&evoGuard++<3){}
    if(s.era===3&&firstInfo===null){firstInfo=t;events.push({type:'era',era:s.era,hour:+(t/3600).toFixed(3)});}
    if(s.owned[9]>0&&firstCalc===null)firstCalc=t;
    if(s.owned[10]>0&&firstData===null)firstData=t;
    if(s.ascensions>=3&&s.era===3&&post3Info===null)post3Info=t;
    if(s.ascensions>=3&&s.owned[9]>0&&post3Calc===null)post3Calc=t;
    if(s.ascensions>=3&&s.owned[10]>0&&post3Data===null)post3Data=t;
    if(s.ascensions>=3&&asc3At===null){asc3At=t;events.push({type:'ascensions3',hour:+(t/3600).toFixed(3)});}
    if(s.ascensions>=3&&s.techs[7]&&tech7At===null)tech7At=t;

    // At ascension 3+, stop ordinary leaps and prioritize the first available transcend.
    if(s.ascensions>=3){
      const gain=transcendGain(s);
      if(gain>0){
        const earned=s.earned,threshold=transcendThreshold(s);
        events.push({type:'transcend',hour:+(t/3600).toFixed(3),gain,earned:earned.toExponential(3),threshold,era:s.era,tech7:s.techs[7]});
        transAt=t;transcend(s);break;
      }
    }else{
      const threshold=leapThreshold(s);
      if(s.leapUnlocked&&s.era>=2&&s.techs[5]&&s.earned>=threshold){
        const gain=leapGain(s),earned=s.earned,beforeSkills=s.skills.reduce((a,b)=>a+b,0);
        events.push({type:'leap',hour:+(t/3600).toFixed(3),ascension:s.ascensions+1,threshold,earned:earned.toExponential(3),insight:gain,skillsLost:beforeSkills,preEra:s.era});
        leap(s);buyInnovations(s,innovation);inheritCount=0;continue;
      }
    }

    const inheritanceGain=inheritance(s);
    if(inheritanceGain>=inheritAt&&inheritCount<maxInherit){
      events.push({type:'inherit',hour:+(t/3600).toFixed(3),gain:inheritanceGain,earned:s.earned.toExponential(3),skills:[...s.skills],ascensions:s.ascensions});
      inherit(s);inheritCount++;buySkills(s);
    }
    buySkills(s);buyFacilities(s,purchaseLimit);
    for(const d of [3,7,30])if(!snapshots[d]&&t>=d*86400)snapshots[d]={day:d,hour:+(t/3600).toFixed(3),earned:s.earned,production:production(s),era:s.era,owned:[...s.owned],skills:[...s.skills],points:s.points,cycles:s.cycles,ascensions:s.ascensions,insight:s.insight,innovations:[...s.innovations],leapThreshold:leapThreshold(s),transcendThreshold:transcendThreshold(s),inheritanceCount:inheritCount};
  }
  const productionNow=production(s);
  return {
    strategy:{intervalSeconds:interval,sleep,inheritAt,maxInheritPerLeapRun:maxInherit,days,innovation,manualClicks,purchaseLimit,postAscension3:'stop ordinary leaps; use transcend as soon as available'},
    milestones:{ascensions3Hour:asc3At===null?null:+(asc3At/3600).toFixed(3),informationEraHour:firstInfo===null?null:+(firstInfo/3600).toFixed(3),firstCalculatorHour:firstCalc===null?null:+(firstCalc/3600).toFixed(3),firstDataCenterHour:firstData===null?null:+(firstData/3600).toFixed(3),postAscension3InformationEraHour:post3Info===null?null:+(post3Info/3600).toFixed(3),postAscension3CalculatorHour:post3Calc===null?null:+(post3Calc/3600).toFixed(3),postAscension3DataCenterHour:post3Data===null?null:+(post3Data/3600).toFixed(3),postAscension3Tech7Hour:tech7At===null?null:+(tech7At/3600).toFixed(3),transcendHour:transAt===null?null:+(transAt/3600).toFixed(3)},
    leaps:events.filter(e=>e.type==='leap'),inheritances:events.filter(e=>e.type==='inherit'),transcend:events.find(e=>e.type==='transcend')??null,snapshots,
    final:{hour:+(t/3600).toFixed(3),money:s.money,earned:s.earned,earnedLog10:s.earned>0?+Math.log10(s.earned).toFixed(4):null,production:productionNow,productionLog10:productionNow>0?+Math.log10(productionNow).toFixed(4):null,era:s.era,eraName:['狩猟','農耕','工業','情報','宇宙'][s.era],owned:[...s.owned],skills:[...s.skills],points:s.points,cycles:s.cycles,ascensions:s.ascensions,insight:s.insight,innovations:[...s.innovations],transcendences:s.transcendences,horizon:s.horizon,transcendSkills:[...s.transcendSkills],visits,elapsedSeconds:s.elapsed,transcendThreshold:transcendThreshold(s)},events,
  };
}

const args=process.argv.slice(2);function arg(name,fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const interval=Number(arg('--interval','3600')),days=Number(arg('--days','30')),maxArg=arg('--inherit-max','3');
const maxInherit=maxArg==='unlimited'?Infinity:Number(maxArg);
const result=simulate({interval,days,maxInherit,sleep:arg('--sleep','8h')!=='none',inheritAt:Number(arg('--inherit-at','10')),innovation:arg('--innovation','economy'),manualClicks:Number(arg('--clicks','3')),purchaseLimit:Number(arg('--purchase-limit','100'))});
console.log(JSON.stringify(result,null,2));
