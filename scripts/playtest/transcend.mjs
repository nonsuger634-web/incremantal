// Natural post-transcend diagnostic. Runs only a simulated save in memory.
import {
  transcendCheckpoint, FACILITIES, TECHS, advance, production, price, buy,
  buyTech, evolve, buyTranscendSkill, gather,
} from '../../engine.js';

function parseArgs(args) {
  const get=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]};
  return {
    interval:Number(get('--interval','3600')),
    days:Number(get('--days','30')),
    sleep:get('--sleep','8h')!=='none',
    policy:get('--policy','both'),
    clicks:Number(get('--clicks','0')),
  };
}

function researchAndEvolve(s) {
  for(let round=0;round<5;round++){
    let changed=false;
    for(let i=0;i<TECHS.length;i++) if(buyTech(s,i)) changed=true;
    if(evolve(s)) changed=true;
    if(!changed)break;
  }
}

function buyFacilities(s,policy) {
  let purchases=0;
  if(policy==='human'){
    // Human-oriented rule: research/evolve, then buy at most ten of each
    // currently available facility in newest-era-first order per visit.
    for(let i=FACILITIES.length-1;i>=0;i--){
      if(FACILITIES[i].era>s.era)continue;
      for(let n=0;n<10&&s.owned[i]<1000&&price(s,i)<=s.money;n++){
        if(!buy(s,i))break;
        purchases++;
      }
    }
    return purchases;
  }
  // ROI policy: greedily buy the affordable facility with the greatest
  // immediate production gain per cost, up to 100 purchases per visit.
  for(let n=0;n<100;n++){
    const oldProduction=production(s);
    let best=-1,bestValue=-1;
    for(let i=0;i<FACILITIES.length;i++){
      if(FACILITIES[i].era>s.era||s.owned[i]>=1000||price(s,i)>s.money)continue;
      const c=price(s,i),old=s.owned[i];
      s.owned[i]++;
      const value=(production(s)-oldProduction)/c;
      s.owned[i]=old;
      if(value>bestValue){best=i;bestValue=value;}
    }
    if(best<0||!buy(s,best))break;
    purchases++;
  }
  return purchases;
}

function simulate({interval,days,sleep,policy,clicks}) {
  const s=transcendCheckpoint();
  if(s.horizon!==1||s.transcendences!==1||s.era!==0)throw new Error('Unexpected transcend checkpoint');
  buyTranscendSkill(s,0);
  const cap=days*86400, marks={universeEra:null,cosmicOne:{},cosmicTen:{},cosmicTwentyFive:{},goal:null};
  const snapshots={}, events=[];
  let t=0,visits=0,guard=0;
  const markOwned=(i,before)=>{
    const f=FACILITIES[i], hour=+(t/3600).toFixed(3);
    if(f.era===4&&before<1&&s.owned[i]>=1&&!marks.cosmicOne[f.name])marks.cosmicOne[f.name]=hour;
    if(f.era===4&&before<10&&s.owned[i]>=10&&!marks.cosmicTen[f.name])marks.cosmicTen[f.name]=hour;
    if(f.era===4&&before<25&&s.owned[i]>=25&&!marks.cosmicTwentyFive[f.name])marks.cosmicTwentyFive[f.name]=hour;
  };
  // At each visit: purchase any affordable research/evolutions, buy facilities,
  // then repeat research/evolution once more to capture newly met conditions.
  while(t<cap&&guard++<200000){
    const day=t%86400;
    let dt;
    if(sleep&&day>=16*3600)dt=Math.min(86400-day,cap-t);
    else if(sleep)dt=Math.min(interval,16*3600-day,cap-t);
    else dt=Math.min(interval,cap-t);
    if(dt<=0)break;
    const beforeMoney=s.money, beforeRate=production(s);
    if(marks.goal===null&&beforeRate>0&&beforeMoney<1e68&&beforeMoney+beforeRate*dt>=1e68)
      marks.goal=+( (t+(1e68-beforeMoney)/beforeRate)/3600 ).toFixed(6);
    advance(s,dt);t+=dt;
    const dayNow=t%86400;
    if(sleep&&Math.abs(dayNow-16*3600)<1e-6)continue; // sleep starts at 16:00; no boundary visit
    visits++;
    for(let i=0;i<clicks;i++)gather(s);
    researchAndEvolve(s);
    if(s.era===4&&marks.universeEra===null){marks.universeEra=+(t/3600).toFixed(3);events.push({type:'era',era:s.era,hour:marks.universeEra});}
    // Record pre-purchase quantities so milestone crossings are exact.
    const before=[...s.owned];
    const bought=buyFacilities(s,policy);
    for(let i=12;i<15;i++)markOwned(i,before[i]);
    researchAndEvolve(s);
    if(s.money>=1e68&&marks.goal===null){marks.goal=+(t/3600).toFixed(3);events.push({type:'goal',hour:marks.goal,money:s.money});}
    if(bought)events.push({type:'visitPurchases',hour:+(t/3600).toFixed(3),count:bought,era:s.era,owned:[...s.owned.slice(12,15)]});
    for(const d of [1,3,7,30]) if(!snapshots[d]&&t>=d*86400)snapshots[d]={day:d,hour:+(t/3600).toFixed(3),money:s.money,earned:s.earned,production:production(s),era:s.era,cosmicOwned:s.owned.slice(12,15),transcendSkills:[...s.transcendSkills]};
    if(marks.goal!==null)break;
  }
  const elapsedHours=+(t/3600).toFixed(3);
  return {
    strategy:{intervalSeconds:interval,sleep,policy,clicks,requestedDays:days,endingHour:elapsedHours},
    checkpoint:{transcendences:s.transcendences,horizon:s.horizon,foundation:s.innovations[0],transcendSkills:s.transcendSkills},
    marks,snapshots,
    final:{hour:elapsedHours,money:s.money,earned:s.earned,production:production(s),productionLog10:production(s)>0?+Math.log10(production(s)).toFixed(4):null,era:s.era,eraName:['狩猟','農耕','工業','情報','宇宙'][s.era],owned:[...s.owned],cosmicOwned:s.owned.slice(12,15),techCount:s.techs.filter(Boolean).length,visits,elapsedSeconds:s.elapsed},
    events,
  };
}

const cfg=parseArgs(process.argv.slice(2));
const policies=cfg.policy==='both'?['human','roi']:[cfg.policy];
if(!Number.isFinite(cfg.interval)||cfg.interval<=0||!Number.isFinite(cfg.days)||cfg.days<=0||!['human','roi'].includes(policies[0]))throw new Error('Invalid CLI arguments');
const results=policies.map(policy=>simulate({...cfg,policy}));
console.log(JSON.stringify(results.length===1?results[0]:results,null,2));
