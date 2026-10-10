// Diagnostic player model; does not modify saves or gameplay settings.
import {firstLeapCheckpoint,FACILITIES,TECHS,production,price,buy,buyTech,evolve,advance,buyInnovation} from '../../engine.js';
const args=Object.fromEntries(process.argv.slice(2).map(x=>{const [k,...v]=x.replace(/^--/,'').split('=');return [k,v.join('=')]}));
const days=Number(args.days??3),interval=Number(args.interval??3600),sleep=(args.sleep??'false')==='true',policy=args.policy??'human';
if(!Number.isFinite(days)||days<=0||!Number.isFinite(interval)||interval<=0||!['human','roi'].includes(policy))throw Error('Use --days=N --interval=SECONDS --sleep=true|false --policy=human|roi');
function research(s){let did=true;while(did){did=false;for(let i=0;i<TECHS.length;i++)if(buyTech(s,i))did=true;if(evolve(s))did=true;}}
function score(s,i){const cost=price(s,i);if(cost>s.money)return -1;const clone=structuredClone(s);buy(clone,i);return (production(clone)-production(s))/cost;}
function buyRoi(s){for(let n=0;n<100;n++){let best=-1,bestScore=-1;for(let i=0;i<FACILITIES.length;i++)if(FACILITIES[i].era<=s.era){const v=score(s,i);if(v>bestScore){bestScore=v;best=i;}}if(best<0)break;buy(s,best);}}
function buyHuman(s){for(let slot=0;slot<4;slot++){let chosen=-1;for(let i=FACILITIES.length-1;i>=0;i--)if(FACILITIES[i].era<=s.era&&price(s,i)<=s.money){chosen=i;break;}if(chosen<0)break;for(let j=0;j<10&&price(s,chosen)<=s.money;j++)buy(s,chosen);}}
function run(){
 const s=firstLeapCheckpoint();buyInnovation(s,0);let t=0,visits=0;const mark={era:null,facility:null,ten:{},twentyfive:{}};const cap=days*86400;
 const markProgress=()=>{if(s.era===3&&mark.era===null)mark.era=t;if(s.owned[9]>0&&mark.facility===null)mark.facility=t;for(let i=0;i<3;i++){if(s.owned[9+i]>=10&&mark.ten[i]===undefined)mark.ten[i]=t;if(s.owned[9+i]>=25&&mark.twentyfive[i]===undefined)mark.twentyfive[i]=t;}};
 while(t<cap){const day=t%86400;let dt=interval;if(sleep){if(day>=16*3600)dt=86400-day;else dt=Math.min(interval,16*3600-day);}dt=Math.min(dt,cap-t);advance(s,dt);t+=dt;
   // Production runs during sleep. Waking at midnight is a visit; reaching 16:00 starts sleep without a visit.
   if(sleep&&t%86400===16*3600)continue;
   visits++;research(s);markProgress();if(policy==='human')buyHuman(s);else buyRoi(s);research(s);markProgress();
 }
 const hrs=x=>x===undefined||x===null?null:+(x/3600).toFixed(2);
 const times=(obj)=>Object.fromEntries(Object.entries(obj).map(([i,v])=>[FACILITIES[9+Number(i)].name,hrs(v)]));
 return {policy,intervalSeconds:interval,sleep,eightHourSleep: sleep,ordinaryInheritance:false,horizonDays:days,elapsedHours:+(t/3600).toFixed(2),visits,infoEraHours:hrs(mark.era),firstInformationFacilityHours:hrs(mark.facility),tenHours:times(mark.ten),twentyfiveHours:times(mark.twentyfive),end:{era:s.era,owned:Object.fromEntries(FACILITIES.slice(9).map((f,i)=>[f.name,s.owned[9+i]])),money:+s.money.toPrecision(6),productionPerSecond:+production(s).toPrecision(6),innovation:s.innovations}};
}
console.log(JSON.stringify(run()));
