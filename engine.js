import {add,subtract,multiply,compare,log10,fromLog10,maxValue,isValue,floorValue} from './numbers.js';
export {add,subtract,multiply,compare,log10,fromLog10,maxValue,isValue} from './numbers.js';
export const ERAS = ['狩猟', '農耕', '工業', '情報', '宇宙'];
export const FACILITIES = [
  {name:'採集隊',era:0,cost:10,rate:1,description:'野山の恵みを集める'},
  {name:'狩猟隊',era:0,cost:100,rate:6,description:'道具を手に獲物を追う'},
  {name:'狩猟拠点',era:0,cost:1000,rate:80,description:'集落で知識を共有する'},
  {name:'畑',era:1,cost:15000,rate:1200,description:'季節を越えて食料を育てる'},
  {name:'牧場',era:1,cost:150000,rate:15000,description:'安定した食料供給を築く'},
  {name:'灌漑設備',era:1,cost:1500000,rate:200000,description:'水を引き、大地を耕す'},
  {name:'工房',era:2,cost:10000000,rate:2000000,description:'手仕事を産業へ変える'},
  {name:'工場',era:2,cost:100000000,rate:30000000,description:'機械で大量生産する'},
  {name:'発電所',era:2,cost:1000000000,rate:500000000,description:'文明に新たな動力を与える'},
  {name:'計算機センター',era:3,cost:1e16,rate:1e13,description:'計算で文明の可能性を広げる'},
  {name:'データセンター',era:3,cost:1e19,rate:1e16,description:'世界の知識をつなぐ'},
  {name:'AI研究所',era:3,cost:1e22,rate:1e19,description:'知識から新たな知識を生む'},
  {name:'軌道都市',era:4,cost:1e28,rate:1e24,description:'惑星の外に文明を広げる'},
  {name:'恒星炉',era:4,cost:1e40,rate:1e34,description:'恒星のエネルギーを生産へ'},
  {name:'銀河演算網',era:4,cost:1e62,rate:1e44,description:'銀河そのものを計算機にする'},
];
const ERA_TECHS = [
  {name:'石器',era:0,cost:500,required:10,mult:3},
  {name:'火の利用',era:0,cost:3000,required:25,mult:2},
  {name:'定住',era:1,cost:1000000,required:10,mult:3},
  {name:'灌漑技術',era:1,cost:5000000,required:25,mult:3},
  {name:'機械化',era:2,cost:10000000000,required:10,mult:3},
  {name:'電力網',era:2,cost:100000000000,required:25,mult:5},
  {name:'ネットワーク',era:3,cost:1e19,required:10,mult:5},
  {name:'知能の連鎖',era:3,cost:1e23,required:25,mult:10},
];
// Stable ordering: original eight era technologies, then generated facility,
// manual-action and synergy technologies. Saved arrays use this catalog order.
const FACILITY_TECHS=FACILITIES.slice(0,12).flatMap((f,facility)=>[10,25,50,100].map((required,tier)=>({
 name:`${f.name}：${['道具の改良','作業の専門化','組織の拡張','大規模運用'][tier]}`,era:f.era,cost:f.cost*[10,100,1000,10000][tier],required,facility,kind:'facility',mult:2,
})));
const CLICK_TECHS=[25,100,250,1000].map((clicks,era)=>({name:['採集の手ほどき','収穫の熟練','作業の集中','知識の整理'][era],era,cost:[100,1e6,1e10,1e18][era],kind:'click',clicks,mult:2}));
const SYNERGY_TECHS=Array.from({length:9},(_,source)=>({name:`${FACILITIES[source].name}と${FACILITIES[source+3].name}の連携`,era:FACILITIES[source+3].era,cost:FACILITIES[source+3].cost*100,kind:'synergy',source,target:source+3,required:10,mult:1}));
// New technologies are appended: the 69 v6 catalog indices remain stable.
export const TIME_RESEARCH_TECHS=[
 {name:'歴史演算',kind:'time',era:3,cost:1e90,required:1,start:0},
 {name:'因果シミュレーション',kind:'time',era:3,cost:1e150,required:5,start:4},
 {name:'時空統一理論',kind:'time',era:3,cost:1e220,required:9,start:8},
];
export const TECHS=[...ERA_TECHS.map((t,i)=>({...t,kind:'era',facility:[1,2,3,5,7,8,10,11][i]})),...FACILITY_TECHS,...CLICK_TECHS,...SYNERGY_TECHS,
 {name:'恒星航行',kind:'era',era:4,cost:1e42,facility:12,required:10,mult:5},
 {name:'銀河文明',kind:'era',era:4,cost:1e56,facility:13,required:25,mult:10},
 ...FACILITIES.slice(12).flatMap((f,j)=>[10,25,50,100].map((required,tier)=>({name:`${f.name}：${['軌道の開拓','恒星の連携','銀河の拡張','宇宙の統合'][tier]}`,kind:'facility',facility:j+12,era:4,cost:f.cost*[10,100,1000,10000][tier],required,mult:2}))),
 {name:'宇宙の観測',kind:'click',era:4,cost:1e30,clicks:2000,mult:2},
 ...Array.from({length:3},(_,j)=>({name:`${FACILITIES[j+9].name}と${FACILITIES[j+12].name}の連携`,kind:'synergy',source:j+9,target:j+12,era:4,cost:FACILITIES[j+12].cost*100,required:10,mult:1})),
 ...TIME_RESEARCH_TECHS,
];
export const SKILLS = [
  {name:'生産の知恵',description:'生産 ×2 / Lv',base:1,growth:1.5,max:20},
  {name:'交易の知恵',description:'施設価格 ×0.85 / レベル',base:1,growth:1.5,max:20},
  {name:'開拓の記憶',description:'狩猟の各施設を5個 / レベル持って開始（購入時にも付与）',base:1,growth:1.5,max:20},
  {name:'働く手',description:'手動獲得の基礎量 ×2、秒間生産の取り分 +1% / レベル',base:2,max:5},
  {name:'都市の記憶',description:'農耕以降の施設生産 ×1.5 / レベル',base:4,growth:2,max:10},
  {name:'相乗の伝承',description:'施設を組み合わせる連携技術を解放',base:12,max:1},
];
export const INNOVATIONS = [
 {name:'革新の基盤',description:'全施設の生産 ×50、全継承スキルの実効Lv +2（各上限まで）',base:1,growth:1,max:1,requires:[]},
 {name:'量産革命',description:'全施設の生産 ×5 / レベル',base:2,growth:3,max:5,requires:[[0,1]]},
 {name:'計算理論',description:'生産の指数 +0.025 / レベル',base:3,growth:4,max:3,requires:[[0,1]]},
 {name:'情報経済',description:'情報施設の価格 ×0.8 / レベル',base:2,growth:3,max:5,requires:[[0,1]]},
 {name:'知能の融合',description:'生産の指数をさらに +0.05',base:8,growth:1,max:1,requires:[[1,2],[2,1]]},
];
export const TRANSCEND_SKILLS=[
 {name:'宇宙の基盤',description:'生産指数 +0.2。情報時代・工業までの各施設100個で開始（取得時も適用）',base:1,growth:1,max:1,requires:[]},
 {name:'次元の拡張',description:'全施設の生産指数 +0.15 / レベル',base:2,growth:2,max:4,requires:[[0,1]]},
 {name:'時空の圧縮',description:'宇宙施設の価格 ×0.65 / レベル',base:2,growth:4,max:4,requires:[[0,1]]},
 {name:'無限への接続',description:'生産指数をさらに +0.15',base:8,growth:1,max:1,requires:[[1,2],[2,1]]},
];
export function transcendSkillCost(s,i){const n=TRANSCEND_SKILLS[i];return n.base*n.growth**s.transcendSkills[i];}
export function transcendSkillReady(s,i){return (s.transcendences>0||s.timeJumps>0)&&TRANSCEND_SKILLS[i].requires.every(([j,n])=>s.transcendSkills[j]>=n);}
export function buyTranscendSkill(s,i){const cost=transcendSkillCost(s,i);if(!transcendSkillReady(s,i)||s.transcendSkills[i]>=TRANSCEND_SKILLS[i].max||s.horizon<cost)return false;s.horizon-=cost;s.transcendSkills[i]++;if(i===0)grantCosmicStart(s);return true;}
export const TIME_SKILLS=[
 {name:'時間航行',description:'生産指数 +0.25。時間を越える生産技術',base:1,growth:1,max:1,requires:[]},
 {name:'因果の増幅',description:'生産指数 +0.1 / レベル',base:2,growth:1,max:4,requires:[[0,1]]},
 {name:'記憶の定着',description:'超越ポイント ×2 / レベル。永久記録があれば通算文明力から差額も再計算',base:2,growth:1,max:3,requires:[[0,1]]},
 {name:'時間再帰',description:'生産指数 ×2.5 / Lv',base:2,max:36,requires:[[0,1]]},
 {name:'並行宇宙',description:'他時代の施設が各施設を支援。合計3000個で連携効果が最大になり、施設の生産を増幅',base:3,max:12,requires:[[1,1]]},
 {name:'歴史の共鳴',description:'Lv.1・5・9で時空研究を解放。研究済みの第1・2・3段をLv.5・9・13で固定化',base:3,max:13,requires:[[2,1]]},
 {name:'宇宙の結合',description:'生産指数 ×4 / レベル',base:5,max:12,requires:[[4,2],[5,2]]},
 {name:'華厳の地平',description:'Lv.1〜7は生産指数 ×2 / レベル、最終Lv.8はさらに ×16',base:6,max:8,requires:[[3,4],[6,1]]},
 {name:'技術の永久保存',description:'Lv.1：通常技術をすべて習得（時空研究は対象外）。Lv.2：全施設1000個の到達記録を条件に購入し、宇宙時代・全施設1000個で開始',base:2,max:2,requires:[[0,1]]},
 {name:'宇宙の継承',description:'取得時とすべてのリセット後に宇宙時代から開始',base:3,max:1,requires:[[0,1]]},
 {name:'文明の永久記録',description:'時間跳躍で継承・革新・超越のスキル、ポイント、回数を保持。通算文明力からポイントの差額を補充',base:3,max:1,requires:[[8,1]]},
];
export function timeSkillCost(s,i){const n=TIME_SKILLS[i];return i===3?n.base+2*s.timeSkills[i]:n.base+(i===0||i>=8?0:i<3?s.timeSkills[i]:Math.floor(s.timeSkills[i]/(i<6?3:2)));}
export function timeSkillReady(s,i,level=s.timeSkills[i]+1){return s.timeJumps>0&&TIME_SKILLS[i].requires.every(([j,n])=>s.timeSkills[j]>=n)&&(i!==8||level<2||s.history?.maxOwned?.every(n=>n>=1000));}
export function buyTimeSkill(s,i){const cost=timeSkillCost(s,i);if(!timeSkillReady(s,i)||s.timeSkills[i]>=TIME_SKILLS[i].max||s.chronons<cost)return false;if(i===10)s.memoryAwards=fundedLowerAssets(s);s.chronons-=cost;s.timeSkills[i]++;grantTimeLegacy(s);syncPermanentRecord(s);return true;}
export function productionExponent(s){return (1+0.025*s.innovations[2]+0.05*s.innovations[4]+0.2*s.transcendSkills[0]+0.15*s.transcendSkills[1]+0.15*s.transcendSkills[3]+0.25*s.timeSkills[0]+0.1*s.timeSkills[1])*2.5**s.timeSkills[3]*4**s.timeSkills[6]*2**Math.min(7,s.timeSkills[7])*(s.timeSkills[7]>=8?HORIZON_FINAL_MULTIPLIER:1);}
export function checkFacilityArchive(s){s.facilityArchive=s.timeSkills[8]>=2&&s.history.maxOwned.every(n=>n>=1000);}
function fixTimeResearch(s){TIME_RESEARCH_TECHS.forEach((t,i)=>{if(s.techs[TECHS.indexOf(t)]&&s.timeSkills[5]>=t.required+4)s.fixedTimeResearch[i]=true;});}
function resetTechnologies(s){fixTimeResearch(s);s.techs.fill(false);TIME_RESEARCH_TECHS.forEach((t,i)=>{if(s.fixedTimeResearch[i])s.techs[TECHS.indexOf(t)]=true;});}
export function grantTimeLegacy(s){
 if(s.timeSkills[9])s.era=4;
 if(s.timeSkills[8])TECHS.forEach((t,i)=>{if(t.kind!=='time')s.techs[i]=true;});
 fixTimeResearch(s);checkFacilityArchive(s);
 if(s.facilityArchive){s.era=4;s.owned.fill(1000);}
}
export function grantCosmicStart(s){
 if(!s.transcendSkills[0])return;
 s.era=Math.max(s.era,3);grantLegacyTech(s);
 FACILITIES.forEach((f,i)=>{if(f.era<=2){s.owned[i]=Math.max(100,s.owned[i]);s.history.maxOwned[i]=Math.max(s.history.maxOwned[i],s.owned[i]);}});
 grantTimeLegacy(s);recordProgress(s);
}
export function innovationCost(s,i){return INNOVATIONS[i].base*INNOVATIONS[i].growth**s.innovations[i];}
export function innovationReady(s,i){return INNOVATIONS[i].requires.every(([j,n])=>s.innovations[j]>=n);}
export function buyInnovation(s,i){
 const cost=innovationCost(s,i);if(!s.leapUnlocked||!innovationReady(s,i)||s.innovations[i]>=INNOVATIONS[i].max||s.insight<cost)return false;
 const start=startingFacilityCount(s);
 s.insight-=cost;s.innovations[i]++;
 grantStartingFacilities(s,startingFacilityCount(s)-start);return true;
}
export function effectiveSkillLevel(s,i){return Math.min(SKILLS[i].max,s.skills[i]+(s.innovations[0]>0?2:0));}
export function startingFacilityCount(s){return 5*effectiveSkillLevel(s,2);}
function grantStartingFacilities(s,count){
 if(count<=0)return;
 FACILITIES.forEach((f,i)=>{if(f.era===0){s.owned[i]=Math.min(1000,s.owned[i]+count);s.history.maxOwned[i]=Math.max(s.history.maxOwned[i],s.owned[i]);}});
}
export function fresh() {
  return {version:9,balanceRevision:1,money:10,earned:0,era:0,owned:Array(FACILITIES.length).fill(0),techs:Array(TECHS.length).fill(false),points:0,skills:Array(SKILLS.length).fill(0),cycles:0,ascensions:0,insight:0,innovations:Array(INNOVATIONS.length).fill(0),leapUnlocked:false,transcendences:0,horizon:0,transcendSkills:Array(TRANSCEND_SKILLS.length).fill(0),timeJumps:0,chronons:0,timeSkills:Array(TIME_SKILLS.length).fill(0),memoryAwards:[0,0,0],facilityArchive:false,fixedTimeResearch:[false,false,false],goalReached:false,goalAcknowledged:false,goalElapsed:0,cleared:false,clearAcknowledged:false,clearScore:0,clearElapsed:0,clearLog:[],lifetime:0,elapsed:0,autoTime:0,history:{maxEra:0,maxOwned:Array(FACILITIES.length).fill(0),clicks:0,manual:0,techPurchases:0,bestRun:0},last:Date.now()};
}
export function eraCount(s,era) { return s.owned.reduce((sum,n,i)=>sum+(FACILITIES[i].era===era?n:0),0); }
export function facilityRate(s,i) {
 const f=FACILITIES[i],n=s.owned[i];
 const tech=TECHS.reduce((m,t,j)=>m*(s.techs[j]&&((t.kind==='era'&&t.era===f.era)||(t.kind==='facility'&&t.facility===i))?t.mult:1),1);
 const synergy=TECHS.reduce((m,t,j)=>{
  if(!s.techs[j]||t.kind!=='synergy')return m;
  if(t.target===i)return m*(1+Math.min(100,s.owned[t.source])*.01);
  if(t.source===i)return m*(1+Math.min(100,s.owned[t.target])*.005);
  return m;
 },1);
 const raw=n*f.rate*tech*synergy*2**effectiveSkillLevel(s,0)*(f.era>=1?1.5**effectiveSkillLevel(s,4):1);
 if(!raw)return 0;
 const exponent=productionExponent(s)*timeFacilitySynergy(s,i)*timeResearchPower(s);
 if(exponent===1)return raw*50**s.innovations[0]*5**s.innovations[1];
 const outputLog=(Math.log10(raw)+s.innovations[0]*Math.log10(50)+s.innovations[1]*Math.log10(5))*exponent;
 // Reorder the final multiplier to preserve the target's relative coefficient.
 // This is the declared Lv.8 effect, without clipping output at any value.
 if(s.timeSkills[7]>=8){const withoutFinal=productionExponent({...s,timeSkills:s.timeSkills.map((lv,i)=>i===7?7:lv)})*timeFacilitySynergy(s,i)*timeResearchPower(s);const priorLog=(Math.log10(raw)+s.innovations[0]*Math.log10(50)+s.innovations[1]*Math.log10(5))*withoutFinal;return fromLog10(Number(BUDDHIST_GOAL_EXPONENT)*(priorLog/HORIZON_REFERENCE_LOG),1/FINAL_PRODUCTION_SECONDS);}
 return fromLog10(outputLog);
}
export function timeFacilitySynergy(s,i){
 const support=s.owned.reduce((sum,n,j)=>sum+(FACILITIES[j].era!==FACILITIES[i].era?n:0),0);
 return 1+(4**s.timeSkills[4]-1)*Math.min(1,support/3000);
}
export function timeResearchPower(s){
 const levels=TIME_RESEARCH_TECHS.reduce((sum,t)=>sum+(s.techs[TECHS.indexOf(t)]?Math.min(t.start===8?5:4,Math.max(0,s.timeSkills[5]-t.start)):0),0);
 return 2**levels;
}
export function production(s) {return FACILITIES.reduce((sum,_,i)=>add(sum,facilityRate(s,i)),0);}
export function manualGain(s) {
 const era=TECHS.reduce((m,t,i)=>m*(t.kind==='era'&&t.era===s.era&&s.techs[i]?t.mult:1),1);
 const clicks=TECHS.reduce((m,t,i)=>m*(t.kind==='click'&&s.techs[i]?t.mult:1),1);
 const base=[1,25,1000,100000,1e12][s.era]*2**(effectiveSkillLevel(s,0)+effectiveSkillLevel(s,3))*era*clicks;
 // Click upgrades affect the fixed amount, not the CPS-based alternative.
 const cps=production(s);return maxValue(base,floorValue(multiply(cps,(.05+.01*effectiveSkillLevel(s,3)))));
}
export function formatDuration(seconds){const n=Math.floor(Math.max(0,seconds)+1e-7);return `${Math.floor(n/86400)}日${Math.floor(n%86400/3600)}時間${Math.floor(n%3600/60)}分${n%60}秒`;}
export function checkClear(s){
 if(!s.cleared&&compare(s.money,MURYOUTAISUU)>0){s.cleared=true;s.clearScore=s.money;s.clearElapsed=s.elapsed;s.clearLog.push({type:'muryou',elapsed:s.elapsed,score:s.money});}
 if(!s.goalReached&&compare(s.money,fromLog10(Number(BUDDHIST_GOAL_EXPONENT)))>=0){s.goalReached=true;s.goalElapsed=s.elapsed;s.clearLog.push({type:'goal',elapsed:s.elapsed,score:fromLog10(Number(BUDDHIST_GOAL_EXPONENT))});}
 return s.cleared;
}
export function recordProgress(s){s.history.bestRun=maxValue(s.history.bestRun,s.earned);s.history.maxEra=Math.max(s.history.maxEra,s.era);checkClear(s);}
export function gather(s) {
 const gain=manualGain(s);s.money=add(s.money,gain);s.earned=add(s.earned,gain);s.lifetime=add(s.lifetime,gain);s.history.clicks++;s.history.manual=add(s.history.manual,gain);recordProgress(s);return gain;
}
export function price(s,i) {const era=FACILITIES[i].era;return Math.ceil(FACILITIES[i].cost*(era===4?1.5:era===3?1.4:1.15)**s.owned[i]*0.85**effectiveSkillLevel(s,1)*(era===3?0.8**s.innovations[3]:era===4?0.65**s.transcendSkills[2]:1));}
export function purchaseQuote(s,i,quantity=1){
 const requested=Math.min(1000-s.owned[i],quantity==='max'?1000:quantity),preview={...s,owned:[...s.owned]};
 let total=0,affordableCost=0,count=0,remaining=s.money;
 for(let n=0;n<requested;n++){
  const cost=price(preview,i);total+=cost;preview.owned[i]++;
  if(count===n&&compare(cost,remaining)<=0){count=n+1;affordableCost=total;remaining=subtract(remaining,cost);}
 }
 if(!count&&quantity==='max'&&requested>0)return {count:1,cost:price(s,i),affordable:false};
 return {count:count||requested,cost:count?affordableCost:total,affordable:count>0};
}
export function buy(s,i) {
  const cost=price(s,i);
  if(!facilityUnlocked(s,i)||compare(s.money,cost)<0||s.owned[i]>=1000)return false;
  s.money=subtract(s.money,cost);s.owned[i]++;s.history.maxOwned[i]=Math.max(s.history.maxOwned[i],s.owned[i]);checkFacilityArchive(s);return true;
}
export function facilityUnlocked(s,i){return FACILITIES[i].era<=s.era;}
export function techCost(s,i) {return TECHS[i].cost;}
export function techRequirement(s,i) {return TECHS[i].required;}
export function techUnlocked(s,i) {
 const t=TECHS[i];if(t.era>s.era)return false;
 if(t.kind==='time')return s.timeSkills[5]>=t.required;
 if(t.kind==='click')return s.history.clicks>=t.clicks;
 if(t.kind==='synergy')return effectiveSkillLevel(s,5)>0&&s.owned[t.source]>=t.required&&s.owned[t.target]>=t.required;
 return s.owned[t.facility]>=t.required;
}
export function techCondition(s,i){
 const t=TECHS[i];
 if(t.kind==='time')return `歴史の共鳴 Lv.${s.timeSkills[5]}/${t.required}`;
 if(t.kind==='click')return `通算手動操作 ${s.history.clicks}/${t.clicks}回`;
 if(t.kind==='synergy')return `相乗の伝承 Lv.1 ＋ ${FACILITIES[t.source].name} ${s.owned[t.source]}/${t.required}個 ＋ ${FACILITIES[t.target].name} ${s.owned[t.target]}/${t.required}個`;
 return `${FACILITIES[t.facility].name} ${s.owned[t.facility]}/${t.required}個`;
}
export function techEffect(i){const t=TECHS[i];return t.kind==='time'?`歴史の共鳴 Lv.${t.required}〜${t.start+(t.start===8?5:4)} の力を生産へ適用。歴史の共鳴Lv.${t.required+4}で研究済みなら固定化`:t.kind==='era'?`${ERAS[t.era]}施設の生産 ×${t.mult}`:t.kind==='facility'?`${FACILITIES[t.facility].name}の生産 ×2`:t.kind==='click'?'手動獲得の基礎量 ×2':'上位施設 +1%/下位施設、下位施設 +0.5%/上位施設（各100個まで）';}
export function canTech(s,i) {return !s.techs[i]&&techUnlocked(s,i)&&compare(s.money,techCost(s,i))>=0;}
export function buyTech(s,i) {if(!canTech(s,i))return false;s.money=subtract(s.money,techCost(s,i));s.techs[i]=true;s.history.techPurchases++;fixTimeResearch(s);return true;}
export function eraRequirement(s) {
  return s.era===0?{earned:10000,cost:5000,tech:0}:s.era===1?{earned:10000000,cost:5000000,tech:3}:s.era===2&&(s.ascensions>0||s.transcendences>0)?{earned:1e14,cost:5e13,tech:5}:s.era===3&&s.transcendSkills[0]>0?{earned:1e26,cost:5e25,tech:7}:null;
}
export function canEvolve(s) {const r=eraRequirement(s);return !!r&&compare(s.earned,r.earned)>=0&&compare(s.money,r.cost)>=0&&s.techs[r.tech];}
export function evolve(s) {if(!canEvolve(s))return false;s.money=subtract(s.money,eraRequirement(s).cost);s.era++;recordProgress(s);return true;}
export function inheritance(s) {
  if(s.era<2||!s.techs[4]||compare(s.earned,1e11)<0)return 0;
  return resetReward(s.earned,'inheritance');
}
export function refreshLeap(s) {if(s.cycles>=3&&s.skills.reduce((a,b)=>a+b,0)>=8)s.leapUnlocked=true;}
export const LEAP_RULES = Object.freeze({stepExponent:3});
export function leapThreshold(s) {return 10**Math.min(240,18+LEAP_RULES.stepExponent*s.ascensions);}
export function leapGain(s) {
  if(!s.leapUnlocked||s.era<2||!s.techs[5]||compare(s.earned,leapThreshold(s))<0)return 0;
  return resetReward(s.earned,'leap');
}
export function leap(s) {
  const gain=leapGain(s);if(!gain)return false;
  recordLowerAward(s,1,gain);
  s.insight+=gain;s.ascensions++;s.points=0;s.skills.fill(0);
  s.money=10;s.earned=0;s.era=0;s.owned.fill(0);resetTechnologies(s);grantLegacyTech(s);s.autoTime=0;
  grantStartingFacilities(s,startingFacilityCount(s));grantCosmicStart(s);
  return true;
}
export const MURYOUTAISUU=1e68;
export function transcendThreshold(s){return 10**Math.min(180,30+10*s.transcendences);}
export function transcendGain(s){
 if((s.ascensions<3&&s.transcendences===0&&s.timeJumps===0)||s.era<3||!s.techs[7]||compare(s.earned,transcendThreshold(s))<0)return 0;
 return resetReward(s.earned,'transcend')*2**s.timeSkills[2];
}
export function transcend(s){
 const gain=transcendGain(s);if(!gain)return false;
 recordLowerAward(s,2,gain);
 s.horizon+=gain;s.transcendences++;s.ascensions=0;s.cycles=0;s.points=0;s.skills.fill(0);s.insight=0;s.innovations.fill(0);
 // The foundation is granted after transcendence so lower eras stay playable.
 s.innovations[0]=1;s.leapUnlocked=true;
 s.money=10;s.earned=0;s.era=0;s.owned.fill(0);resetTechnologies(s);s.autoTime=0;
 grantLegacyTech(s);grantStartingFacilities(s,startingFacilityCount(s));grantCosmicStart(s);return true;
}
export function effectiveRewardLog(e){return e<=200?e:200+16*Math.log10(e/200);}
// Awards depend on production, never on an initial or repeat-run bonus.
export const RESET_REWARD_RULES=Object.freeze({
 inheritance:Object.freeze({offset:10,scale:1,power:2}),
 leap:Object.freeze({offset:16,scale:2,power:1.3}),
 transcend:Object.freeze({offset:27,scale:3,power:1}),
 time:Object.freeze({offset:60,scale:8,power:1.3}),
});
export function resetReward(value,kind){const r=RESET_REWARD_RULES[kind==='inherit'?'inheritance':kind];return Math.floor((Math.max(0,effectiveRewardLog(log10(maxValue(1,value)))-r.offset)/r.scale)**r.power+1e-10);}
export function resetRewardExponent(kind,points){const r=RESET_REWARD_RULES[kind==='inherit'?'inheritance':kind];return r.offset+r.scale*points**(1/r.power);}
export function inverseRewardLog(e){return e<=200?e:200*10**((e-200)/16);}
export function nextResetReward(s,kind){
 const fn={inheritance,inherit:inheritance,leap:leapGain,transcend:transcendGain,time:timeGain}[kind];
 if(!fn)throw new RangeError('Unknown reset');const gain=fn(s);if(!gain)return null;
 const multiplier=kind==='transcend'?2**s.timeSkills[2]:1;
 const rewardExponent=resetRewardExponent(kind,gain/multiplier+1);
 const target=fromLog10(inverseRewardLog(rewardExponent));return {gain,nextGain:gain+multiplier,target,remaining:subtract(target,kind==='time'?s.lifetime:s.earned),multiplier};
}
export function timeThreshold(s){return fromLog10(inverseRewardLog(68+12*s.timeJumps));}
export function timeRewardBreakdown(s){const reward=resetReward(s.lifetime,'time');return {reward,total:s.cleared&&compare(s.earned,timeThreshold(s))>=0?reward:0};}
export function timeGain(s){return timeRewardBreakdown(s).total;}
// Track credited funds, including skill purchases, so a refund/recalculation
// cannot award previously spent points a second time.
export function fundedLowerAssets(s,legacyCosts=false){
 const spent=(catalog,levels,growth)=>catalog.reduce((sum,n,i)=>{const g=growth??n.growth,l=levels[i];return sum+(g===1?n.base*l:n.base*(g**l-1)/(g-1));},0);
 const inheritanceSpent=SKILLS.reduce((sum,n,i)=>sum+Array.from({length:s.skills[i]},(_,lv)=>Math.ceil(n.base*(legacyCosts?4:(n.growth??4))**lv)).reduce((a,b)=>a+b,0),0);
 return [s.points+inheritanceSpent,s.insight+spent(INNOVATIONS,s.innovations),s.horizon+spent(TRANSCEND_SKILLS,s.transcendSkills)];
}
export function permanentRecordQuote(s){
 if(!s.timeSkills[10])return {totals:[0,0,0],credited:[0,0,0],additions:[0,0,0]};
 const e=effectiveRewardLog(log10(maxValue(1,s.lifetime)));
 const totals=[e<11?0:resetReward(s.lifetime,'inheritance'),e<18?0:resetReward(s.lifetime,'leap'),e<30?0:resetReward(s.lifetime,'transcend')*2**s.timeSkills[2]];
 const funds=fundedLowerAssets(s),credited=funds.map((n,i)=>Math.max(n,s.memoryAwards[i]));
 return {totals,credited,additions:totals.map((n,i)=>Math.max(0,n-credited[i]))};
}
export function syncPermanentRecord(s){
 const quote=permanentRecordQuote(s);if(!s.timeSkills[10])return quote;
 s.points+=quote.additions[0];s.insight+=quote.additions[1];s.horizon+=quote.additions[2];
 s.memoryAwards=quote.credited.map((n,i)=>n+quote.additions[i]);return quote;
}
function recordLowerAward(s,i,gain){if(s.timeSkills[10])s.memoryAwards[i]=Math.max(s.memoryAwards[i],fundedLowerAssets(s)[i])+gain;}
export function timeTravel(s){
 const gain=timeGain(s);if(!gain)return false;
 syncPermanentRecord(s);s.chronons+=gain;s.timeJumps++;
 if(!s.timeSkills[10]){s.cycles=0;s.points=0;s.skills.fill(0);s.ascensions=0;s.insight=0;s.innovations.fill(0);s.transcendences=0;s.horizon=0;s.transcendSkills.fill(0);s.memoryAwards=[0,0,0];}
 s.innovations[0]=1;s.transcendSkills[0]=1;s.leapUnlocked=true;
 s.money=10;s.earned=0;s.era=0;s.owned.fill(0);resetTechnologies(s);s.autoTime=0;s.clearAcknowledged=true;
 grantCosmicStart(s);return true;
}
export function inherit(s) {
  const gain=inheritance(s);if(!gain)return false;
  recordLowerAward(s,0,gain);
  s.points+=gain;s.cycles++;refreshLeap(s);s.money=10;s.earned=0;s.era=0;s.owned.fill(0);resetTechnologies(s);grantLegacyTech(s);s.autoTime=0;
  grantStartingFacilities(s,startingFacilityCount(s));grantCosmicStart(s);
  return true;
}
export function skillCost(s,i) {return Math.ceil(SKILLS[i].base*(SKILLS[i].growth??4)**s.skills[i]);}
export function skillUnlocked(s,i){
 if(effectiveSkillLevel(s,i)>0)return true;
 if(i===0)return s.cycles>=1;
 if(i===1)return s.cycles>=1&&s.history.maxEra>=1;
 if(i===2)return s.cycles>=2&&effectiveSkillLevel(s,0)>=1;
 if(i===3)return s.cycles>=1&&s.history.clicks>=25;
 if(i===4)return s.cycles>=2&&effectiveSkillLevel(s,0)>=2&&compare(s.history.bestRun,1e12)>=0;
 return s.cycles>=2&&effectiveSkillLevel(s,0)>=2&&s.history.maxOwned.slice(3,6).some(n=>n>=10);
}
export function skillCondition(s,i){return ['継承1回','継承1回 ＋ 農耕到達','継承2回 ＋ 生産の知恵 Lv.1','継承1回 ＋ 通算手動操作25回','継承2回 ＋ 生産の知恵 Lv.2 ＋ 周回最高1兆','継承2回 ＋ 生産の知恵 Lv.2 ＋ 農耕施設の最大所持10個'][i];}
export function buySkill(s,i) {
  const cost=skillCost(s,i);if(!skillUnlocked(s,i)||effectiveSkillLevel(s,i)>=SKILLS[i].max||s.points<cost)return false;
  s.points-=cost;s.skills[i]++;refreshLeap(s);
  if(i===2)grantStartingFacilities(s,5);
  return true;
}
export function grantLegacyTech(s){if(s.ascensions>0||s.transcendences>0||s.timeJumps>0)TECHS.forEach((t,i)=>{if(t.kind!=='time'&&t.era<=(s.transcendences>0||s.timeJumps>0?3:2))s.techs[i]=true;});}
export function firstLeapCheckpoint(){
 return leapCheckpoint(1);
}
export function leapCheckpoint(count=1){
 if(![1,2,3].includes(count))throw new RangeError('Checkpoint supports 1, 2 or 3 leaps');
 const s=fresh();s.cycles=3;s.leapUnlocked=true;
 for(let n=0;n<count;n++){
  s.era=2;s.techs[5]=true;s.earned=leapThreshold(s);s.lifetime+=s.earned;recordProgress(s);leap(s);
 }
 return s;
}
export function transcendCheckpoint(){
 const s=leapCheckpoint(3);s.era=3;s.techs[7]=true;s.earned=transcendThreshold(s);s.lifetime+=s.earned;recordProgress(s);transcend(s);return s;
}
export function clearCheckpoint(){const s=transcendCheckpoint();buyTranscendSkill(s,0);s.money=1.01e68;s.earned=s.money;s.lifetime+=s.earned;recordProgress(s);return s;}
export function timeCheckpoint(){const s=clearCheckpoint();timeTravel(s);return s;}
export function advance(s,seconds) {
 if(!Number.isFinite(seconds)||seconds<=0)return;
 seconds=Math.min(seconds,7*86400);const cps=production(s),before=s.money,start=s.elapsed,wasClear=s.cleared,wasGoal=s.goalReached;const amount=multiply(cps,seconds);
 s.money=add(s.money,amount);s.earned=add(s.earned,amount);s.lifetime=add(s.lifetime,amount);s.elapsed+=seconds;recordProgress(s);
 for(const [type,already,target,key] of [['muryou',wasClear,MURYOUTAISUU,'clearElapsed'],['goal',wasGoal,fromLog10(Number(BUDDHIST_GOAL_EXPONENT)),'goalElapsed']]){
  if(!already&&s.clearLog.some(r=>r.type===type)&&compare(cps,0)>0){const rest=subtract(target,before);const ratio=typeof rest==='object'&&typeof cps==='object'&&rest.log10===cps.log10?(rest.scale??1)/(cps.scale??1):10**(log10(rest)-log10(cps));s[key]=start+Math.min(seconds,Math.max(0,ratio));s.clearLog.find(r=>r.type===type).elapsed=s[key];}
 }

}
// Avatamsaka (華厳経) units double the decimal exponent after 倶胝 (10^7).
export const BUDDHIST_GOAL_EXPONENT=7n*2n**122n;
export const FINAL_PRODUCTION_SECONDS=300;

// 八十華厳経・阿僧祇品の数詞。倶胝以降は各単位の指数を倍にする。
export const BUDDHIST_UNITS=[{name:'洛叉',exponent:5n},...['倶胝', '阿庾多', '那由他', '頻波羅', '矜羯羅', '阿伽羅', '最勝', '摩婆羅', '阿婆羅', '多婆羅', '界分', '普摩', '禰摩', '阿婆鈐', '弥伽婆', '毘攞伽', '毘伽婆', '僧羯邏', '毘薩羅', '毘贍婆', '毘盛伽', '毘素陀', '毘婆訶', '毘薄底', '毘佉擔', '称量', '一持', '異路', '顛倒', '三末耶', '毘睹羅', '奚婆羅', '伺察', '周廣', '高出', '最妙', '泥羅婆', '訶理婆', '一動', '訶理蒲', '訶理三', '奚魯伽', '達攞步陀', '訶魯那', '摩魯陀', '懺慕陀', '瑿攞陀', '摩魯摩', '調伏', '離憍慢', '不動', '極量', '阿麼怛羅', '勃麼怛羅', '伽麼怛羅', '那麼怛羅', '奚麼怛羅', '鞞麼怛羅', '鉢羅麼怛羅', '尸婆麼怛羅', '翳羅', '薜羅', '諦羅', '偈羅', '窣步羅', '泥羅', '計羅', '細羅', '睥羅', '謎羅', '娑攞荼', '謎魯陀', '契魯陀', '摩睹羅', '娑母羅', '阿野娑', '迦麼羅', '摩伽婆', '阿怛羅', '醯魯耶', '薜魯婆', '羯羅波', '訶婆婆', '毘婆羅', '那婆羅', '摩羅羅', '娑婆羅', '迷羅普', '者麼羅', '駄麼羅', '鉢攞麼陀', '毘迦摩', '烏波跋多', '演説', '無盡', '出生', '無我', '阿畔多', '青蓮華', '鉢頭摩', '僧祇', '趣', '至', '阿僧祇', '阿僧祇転', '無量', '無量転', '無邊', '無邊転', '無等', '無等転', '不可數', '不可數転', '不可稱', '不可稱転', '不可思', '不可思転', '不可量', '不可量転', '不可説', '不可説転', '不可説不可説', '不可説不可説転'].map((name,i)=>({name,exponent:7n*2n**BigInt(i)}))];
const JAPANESE_UNITS=['万','億','兆','京','垓','秭','穣','溝','澗','正','載','極','恒河沙','阿僧祇','那由他','不可思議','無量大数'].map((name,i)=>({name,exponent:BigInt((i+1)*4)}));
function unitStack(exponent,fraction=0,notation='buddhist'){
 let rest=BigInt(exponent),parts=[];
 const outer=notation==='buddhist'?BUDDHIST_UNITS.findLast(u=>u.exponent<=rest):rest>68n?BUDDHIST_UNITS.findLast(u=>u.exponent<=rest):null;
 if(outer){parts.push(outer.name);rest-=outer.exponent;}
 while(rest>=4n){
  const unit=rest>=112n?BUDDHIST_UNITS.findLast(u=>u.exponent<=rest):JAPANESE_UNITS.findLast(u=>u.exponent<=rest);
  if(!unit)break;
  parts.push(unit.name);rest-=unit.exponent;
 }
 const value=10**(Number(rest)+fraction),coefficient=Math.floor(value*(value<1?10000:100)+1e-8)/(value<1?10000:100);
 const label=coefficient.toLocaleString('ja-JP',{maximumFractionDigits:coefficient<1?4:2});
 const ordered=parts.reverse();return ordered.length?`${label}${JAPANESE_UNITS.some(u=>u.name===ordered[0])?'':' '}${ordered.join(' ')}`:label;
}
export function formatPowerOfTen(exponent){const e=BigInt(exponent);if(e<0n)throw new RangeError('Exponent must be nonnegative');return unitStack(e).replace(/^1 /,'1');}
export function formatNumber(n,notation='japanese'){
 if(typeof n==='number'&&n<(notation==='buddhist'?1e5:1e4))return Math.floor(n).toLocaleString('ja-JP');
 const e=log10(n);if(!Number.isFinite(e))return n===0?'0':'∞';
 const whole=Math.floor(e),extra=typeof n==='object'&&e===n.log10?Math.log10(n.scale??1):0;return unitStack(BigInt(whole),e-whole+extra,notation);
}
export function validateSave(s) {
  const nums=['points','cycles','elapsed','autoTime','last','ascensions','insight','transcendences','horizon','timeJumps','chronons','clearElapsed','goalElapsed'];
  return !!s&&s.version===9&&s.balanceRevision===1&&nums.every(k=>Number.isFinite(s[k])&&s[k]>=0)&&[s.money,s.earned,s.lifetime,s.clearScore].every(isValue)&&s.autoTime<60
    &&Number.isInteger(s.era)&&s.era>=0&&s.era<=4&&(s.era<3||s.ascensions>0||s.transcendences>0||s.timeJumps>0)&&(s.era<4||s.transcendSkills?.[0]>0)&&Number.isSafeInteger(s.points)&&Number.isSafeInteger(s.cycles)&&Number.isSafeInteger(s.ascensions)&&Number.isSafeInteger(s.insight)&&Number.isSafeInteger(s.transcendences)&&Number.isSafeInteger(s.horizon)&&Number.isSafeInteger(s.timeJumps)&&Number.isSafeInteger(s.chronons)&&typeof s.leapUnlocked==='boolean'&&(!(s.ascensions||s.transcendences||s.timeJumps)||s.leapUnlocked)
    &&Array.isArray(s.clearLog)&&s.clearLog.length<=2&&s.clearLog.every(r=>r&&['muryou','goal'].includes(r.type)&&Number.isFinite(r.elapsed)&&r.elapsed>=0&&isValue(r.score))&&new Set(s.clearLog.map(r=>r.type)).size===s.clearLog.length
    &&typeof s.goalReached==='boolean'&&typeof s.goalAcknowledged==='boolean'&&(!s.goalAcknowledged||s.goalReached)&&(!s.goalReached||s.cleared)&&typeof s.cleared==='boolean'&&typeof s.clearAcknowledged==='boolean'&&(s.cleared?compare(s.clearScore,MURYOUTAISUU)>0:s.clearScore===0&&s.clearElapsed===0&&!s.clearAcknowledged&&!s.timeJumps&&!s.chronons)
    &&Array.isArray(s.timeSkills)&&s.timeSkills.length===TIME_SKILLS.length&&s.timeSkills.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=TIME_SKILLS[i].max&&(!n||timeSkillReady(s,i,n)))
    &&typeof s.facilityArchive==='boolean'&&(!s.facilityArchive||(s.timeSkills[8]>=2&&s.history?.maxOwned?.every(n=>n>=1000)))
    &&Array.isArray(s.fixedTimeResearch)&&s.fixedTimeResearch.length===3&&s.fixedTimeResearch.every((v,i)=>typeof v==='boolean'&&(!v||(s.timeSkills[5]>=TIME_RESEARCH_TECHS[i].required+4&&s.techs[TECHS.indexOf(TIME_RESEARCH_TECHS[i])])))
    &&Array.isArray(s.memoryAwards)&&s.memoryAwards.length===3&&s.memoryAwards.every(n=>Number.isSafeInteger(n)&&n>=0)
    &&Array.isArray(s.owned)&&s.owned.length===FACILITIES.length&&s.owned.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=1000&&(FACILITIES[i].era<=s.era||n===0))
    &&Array.isArray(s.techs)&&s.techs.length===TECHS.length&&s.techs.every((v,i)=>typeof v==='boolean'&&(!v||s.timeSkills?.[8]>0||TECHS[i].era<=s.era||(TECHS[i].era<=2&&s.ascensions>0)||(TECHS[i].era<=3&&(s.transcendences>0||s.timeJumps>0))))
    &&Array.isArray(s.innovations)&&s.innovations.length===INNOVATIONS.length&&s.innovations.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=INNOVATIONS[i].max&&(!n||innovationReady(s,i)))
    &&Array.isArray(s.transcendSkills)&&s.transcendSkills.length===TRANSCEND_SKILLS.length&&s.transcendSkills.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=TRANSCEND_SKILLS[i].max&&(!n||transcendSkillReady(s,i)))
    &&s.history&&Number.isInteger(s.history.maxEra)&&s.history.maxEra>=0&&s.history.maxEra<=4&&['clicks','techPurchases'].every(k=>Number.isFinite(s.history[k])&&s.history[k]>=0)&&isValue(s.history.manual)&&isValue(s.history.bestRun)&&Number.isSafeInteger(s.history.clicks)&&Number.isSafeInteger(s.history.techPurchases)&&Array.isArray(s.history.maxOwned)&&s.history.maxOwned.length===FACILITIES.length&&s.history.maxOwned.every(n=>Number.isInteger(n)&&n>=0&&n<=1000)
    &&Array.isArray(s.skills)&&s.skills.length===SKILLS.length&&s.skills.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=SKILLS[i].max);
}

export function migrateSave(old) {
 if(old?.version===9){
  const s=structuredClone(old);
  if(s.balanceRevision===undefined){
   if(s.memoryAwards===undefined&&s.timeSkills?.[10]&&[s.skills,s.innovations,s.transcendSkills].every(Array.isArray))s.memoryAwards=fundedLowerAssets(s,true);
   const level=s.timeSkills?.[3];if(!Number.isInteger(level)||level<0||level>124)return null;
   s.timeSkills[3]=Math.min(36,Math.ceil(level*Math.log(1.3)/Math.log(2.5)));s.balanceRevision=1;
  }
  if(s.clearLog===undefined)s.clearLog=[...(s.cleared?[{type:'muryou',elapsed:s.clearElapsed,score:s.clearScore}]:[]),...(s.goalReached?[{type:'goal',elapsed:s.goalElapsed,score:fromLog10(Number(BUDDHIST_GOAL_EXPONENT))}]:[])];
  if(s.memoryAwards===undefined)s.memoryAwards=s.timeSkills?.[10]&&[s.skills,s.innovations,s.transcendSkills].every(Array.isArray)?fundedLowerAssets(s):[0,0,0];
  if(Array.isArray(s.techs)&&s.techs.length===87){
   // Existing time-research levels keep their earned production after the update.
   s.techs.push(...TIME_RESEARCH_TECHS.map(t=>s.timeSkills?.[8]>0||s.timeSkills?.[5]>=t.required));
  }
  // Keep the already-earned automatic archive effect as Lv.2 on old saves.
  if(s.facilityArchive===true&&s.timeSkills?.[8]===1&&s.history?.maxOwned?.every(n=>n>=1000))s.timeSkills[8]=2;
  if(s.facilityArchive===undefined)s.facilityArchive=!!(s.timeSkills?.[8]>=2&&s.history?.maxOwned?.every(n=>n>=1000));
  if(s.fixedTimeResearch===undefined){
   s.fixedTimeResearch=TIME_RESEARCH_TECHS.map((t,i)=>!!(s.techs?.[TECHS.indexOf(t)]&&s.timeSkills?.[5]>=t.required+4));
   TIME_RESEARCH_TECHS.forEach(t=>{const i=TECHS.indexOf(t);if(s.timeSkills?.[8]&&s.timeSkills?.[5]<t.required)s.techs[i]=false;});
  }
  return validateSave(s)?s:null;
 }
 if(old?.version===8){if(!Array.isArray(old.timeSkills)||old.timeSkills.length!==3)return null;const s={...fresh(),...structuredClone(old),version:9,timeSkills:[...old.timeSkills,...Array(TIME_SKILLS.length-3).fill(0)]};return migrateSave(s);}
 if(old?.version===7){const s={...fresh(),...structuredClone(old),version:9,timeJumps:0,chronons:0,timeSkills:Array(TIME_SKILLS.length).fill(0),goalReached:false,goalAcknowledged:false,goalElapsed:0,cleared:false,clearAcknowledged:false,clearScore:0,clearElapsed:0};return migrateSave(s);}
 if(old?.version===6){
  if(old.owned?.length!==12||old.techs?.length!==69||old.history?.maxOwned?.length!==12||old.era>3||old.history.maxEra>3)return null;
  const s={...fresh(),...structuredClone(old),version:9,transcendences:0,horizon:0,transcendSkills:[0,0,0,0],owned:[...old.owned,0,0,0],techs:[...old.techs,...Array(TECHS.length-69).fill(false)],history:{...structuredClone(old.history),maxOwned:[...old.history.maxOwned,0,0,0]}};
  return validateSave(s)?s:null;
 }
 if(!old||![2,3,4,5].includes(old.version)||!Array.isArray(old.skills)||old.skills.length!==(old.version===5?3:5)||old.skills.some((n,i)=>!Number.isInteger(n)||n<0||n>(i===4?1:i===3?10:20)))return null;
 if(!Array.isArray(old.owned)||!Array.isArray(old.techs)||old.owned.length!==(old.version===2?9:12)||old.techs.length!==(old.version===2?6:8))return null;
 const expected=old.version===4?6:5;
 if(old.version>=4&&(!Array.isArray(old.innovations)||old.innovations.length!==expected||old.innovations.some((n,i)=>!Number.isInteger(n)||n<0||n>(old.version===4?[1,5,3,5,1,1]:[1,5,3,5,1])[i])))return null;
 const s={...fresh(),...structuredClone(old),version:9,transcendences:0,horizon:0,transcendSkills:[0,0,0,0],skills:[...old.skills.slice(0,3),0,0,0],innovations:old.version===4?[...old.innovations.slice(0,4),old.innovations[5]]:old.version===5?[...old.innovations]:Array(INNOVATIONS.length).fill(0)};
 if(old.version===2){s.owned.push(0,0,0);s.techs.push(false,false);s.ascensions=0;s.insight=0;s.leapUnlocked=false;}
 s.owned.push(0,0,0);
 s.techs.push(...Array(TECHS.length-8).fill(false));
 if(old.version<5){s.points+=(old.version===2?2*(2**old.skills[3]-1):2*(4**old.skills[3]-1)/3)+3*old.skills[4];if(old.version===4)s.insight+=3*old.innovations[4];}
 // Older versions gave free quantity multipliers; preserve them as purchased
 // facility technologies so updating does not remove an earned production tier.
 TECHS.forEach((t,i)=>{if(t.kind==='facility'&&s.owned[t.facility]>=t.required)s.techs[i]=true;});
 s.history={maxEra:Math.max(s.era,s.cycles>0||s.ascensions>0?2:0),maxOwned:[...s.owned],clicks:0,manual:0,techPurchases:0,bestRun:s.earned};
 if(!validateSave(s))return null;
 grantLegacyTech(s);refreshLeap(s);return s;
}

// Calibrate a skill effect against the actual complete facility/technology set.
// No runtime maximum is imposed; stronger hypothetical inputs produce more.
const referenceState=fresh();referenceState.skills=SKILLS.map(n=>n.max);referenceState.innovations=INNOVATIONS.map(n=>n.max);referenceState.transcendSkills=TRANSCEND_SKILLS.map(n=>n.max);referenceState.timeSkills=TIME_SKILLS.map(n=>n.max);referenceState.timeSkills[7]=7;referenceState.owned.fill(1000);referenceState.techs.fill(true);
const HORIZON_REFERENCE_LOG=log10(production(referenceState));
export const HORIZON_FINAL_MULTIPLIER=Number(BUDDHIST_GOAL_EXPONENT)/HORIZON_REFERENCE_LOG;
TIME_SKILLS[7].description=`Lv.1〜7：生産指数 ×2 / Lv。Lv.8：生産指数 ×${HORIZON_FINAL_MULTIPLIER.toPrecision(12)}、生産量 ×1/300`;
