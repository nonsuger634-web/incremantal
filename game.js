(() => {
const ERAS = ['狩猟', '農耕', '工業', '情報'];
const FACILITIES = [
  {name:'採集隊',era:0,cost:10,rate:1,description:'野山の恵みを集める'},
  {name:'狩猟隊',era:0,cost:100,rate:6,description:'道具を手に獲物を追う'},
  {name:'狩猟拠点',era:0,cost:1000,rate:80,description:'集落で知識を共有する'},
  {name:'畑',era:1,cost:15000,rate:1200,description:'季節を越えて食料を育てる'},
  {name:'牧場',era:1,cost:150000,rate:15000,description:'安定した食料供給を築く'},
  {name:'灌漑設備',era:1,cost:1500000,rate:200000,description:'水を引き、大地を耕す'},
  {name:'工房',era:2,cost:10000000,rate:2000000,description:'手仕事を産業へ変える'},
  {name:'工場',era:2,cost:100000000,rate:30000000,description:'機械で大量生産する'},
  {name:'発電所',era:2,cost:1000000000,rate:500000000,description:'文明に新たな動力を与える'},
  {name:'計算機センター',era:3,cost:1e16,rate:1e11,description:'計算で文明の可能性を広げる'},
  {name:'データセンター',era:3,cost:1e19,rate:1e13,description:'世界の知識をつなぐ'},
  {name:'AI研究所',era:3,cost:1e22,rate:1e15,description:'知識から新たな知識を生む'},
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
const FACILITY_TECHS=FACILITIES.flatMap((f,facility)=>[10,25,50,100].map((required,tier)=>({
 name:`${f.name}：${['道具の改良','作業の専門化','組織の拡張','大規模運用'][tier]}`,era:f.era,cost:f.cost*[10,100,1000,10000][tier],required,facility,kind:'facility',mult:2,
})));
const CLICK_TECHS=[25,100,250,1000].map((clicks,era)=>({name:['採集の手ほどき','収穫の熟練','作業の集中','知識の整理'][era],era,cost:[100,1e6,1e10,1e18][era],kind:'click',clicks,mult:2}));
const SYNERGY_TECHS=Array.from({length:9},(_,source)=>({name:`${FACILITIES[source].name}と${FACILITIES[source+3].name}の連携`,era:FACILITIES[source+3].era,cost:FACILITIES[source+3].cost*100,kind:'synergy',source,target:source+3,required:10,mult:1}));
const TECHS=[...ERA_TECHS.map((t,i)=>({...t,kind:'era',facility:[1,2,3,5,7,8,10,11][i]})),...FACILITY_TECHS,...CLICK_TECHS,...SYNERGY_TECHS];
const SKILLS = [
  {name:'生産の知恵',description:'全施設の生産 ×2 / レベル',base:1,max:20},
  {name:'交易の知恵',description:'施設価格 ×0.85 / レベル',base:1,max:20},
  {name:'開拓の記憶',description:'開始文明力 +100 / レベル',base:1,max:20},
  {name:'働く手',description:'手動獲得の基礎量 ×2、秒間生産の取り分 +1% / レベル',base:2,max:5},
  {name:'都市の記憶',description:'農耕以降の施設生産 ×1.5 / レベル',base:4,max:10},
  {name:'相乗の伝承',description:'施設を組み合わせる連携技術を解放',base:12,max:1},
];
const INNOVATIONS = [
 {name:'革新の基盤',description:'全施設の生産 ×10',base:1,growth:1,max:1,requires:[]},
 {name:'量産革命',description:'全施設の生産 ×5 / レベル',base:2,growth:3,max:5,requires:[[0,1]]},
 {name:'計算理論',description:'生産の指数 +0.025 / レベル',base:3,growth:4,max:3,requires:[[0,1]]},
 {name:'情報経済',description:'情報施設の価格 ×0.8 / レベル',base:2,growth:3,max:5,requires:[[0,1]]},
 {name:'知能の融合',description:'生産の指数をさらに +0.05',base:8,growth:1,max:1,requires:[[1,2],[2,1]]},
];
function innovationCost(s,i){return INNOVATIONS[i].base*INNOVATIONS[i].growth**s.innovations[i];}
function innovationReady(s,i){return INNOVATIONS[i].requires.every(([j,n])=>s.innovations[j]>=n);}
function buyInnovation(s,i){
 const cost=innovationCost(s,i);if(!s.leapUnlocked||!innovationReady(s,i)||s.innovations[i]>=INNOVATIONS[i].max||s.insight<cost)return false;
 s.insight-=cost;s.innovations[i]++;return true;
}
function fresh() {
  return {version:6,money:10,earned:0,era:0,owned:Array(FACILITIES.length).fill(0),techs:Array(TECHS.length).fill(false),points:0,skills:Array(SKILLS.length).fill(0),cycles:0,ascensions:0,insight:0,innovations:Array(INNOVATIONS.length).fill(0),leapUnlocked:false,lifetime:0,elapsed:0,autoTime:0,history:{maxEra:0,maxOwned:Array(FACILITIES.length).fill(0),clicks:0,manual:0,techPurchases:0,bestRun:0},last:Date.now()};
}
function eraCount(s,era) { return s.owned.reduce((sum,n,i)=>sum+(FACILITIES[i].era===era?n:0),0); }
function facilityRate(s,i) {
 const f=FACILITIES[i],n=s.owned[i];
 const tech=TECHS.reduce((m,t,j)=>m*(s.techs[j]&&((t.kind==='era'&&t.era===f.era)||(t.kind==='facility'&&t.facility===i))?t.mult:1),1);
 const synergy=TECHS.reduce((m,t,j)=>{
  if(!s.techs[j]||t.kind!=='synergy')return m;
  if(t.target===i)return m*(1+Math.min(100,s.owned[t.source])*.01);
  if(t.source===i)return m*(1+Math.min(100,s.owned[t.target])*.005);
  return m;
 },1);
 const raw=n*f.rate*tech*synergy*2**s.skills[0]*(f.era>=1?1.5**s.skills[4]:1);
 if(!raw||!s.innovations.some(n=>n>0))return raw;
 const exponent=1+0.025*s.innovations[2]+0.05*s.innovations[4];
 if(exponent===1)return Math.min(1e200,raw*10**s.innovations[0]*5**s.innovations[1]);
 return 10**Math.min(200,(Math.log10(raw)+s.innovations[0]+s.innovations[1]*Math.log10(5))*exponent);
}
function production(s) {return FACILITIES.reduce((sum,_,i)=>sum+facilityRate(s,i),0);}
function manualGain(s) {
 const era=TECHS.reduce((m,t,i)=>m*(t.kind==='era'&&t.era===s.era&&s.techs[i]?t.mult:1),1);
 const clicks=TECHS.reduce((m,t,i)=>m*(t.kind==='click'&&s.techs[i]?t.mult:1),1);
 const base=[1,25,1000,100000][s.era]*2**(s.skills[0]+s.skills[3])*era*clicks;
 // Click upgrades affect the fixed amount, not the CPS-based alternative.
 return Math.max(base,Math.floor(production(s)*(.05+.01*s.skills[3])));
}
function recordProgress(s){s.history.bestRun=Math.max(s.history.bestRun,s.earned);s.history.maxEra=Math.max(s.history.maxEra,s.era);}
function gather(s) {
 const gain=manualGain(s);s.money+=gain;s.earned+=gain;s.lifetime+=gain;s.history.clicks++;s.history.manual+=gain;recordProgress(s);return gain;
}
function price(s,i) {return Math.ceil(FACILITIES[i].cost*(FACILITIES[i].era===3?1.4:1.15)**s.owned[i]*0.85**s.skills[1]*(FACILITIES[i].era===3?0.8**s.innovations[3]:1));}
function buy(s,i) {
  const cost=price(s,i);
  if(FACILITIES[i].era>s.era||s.money<cost||s.owned[i]>=1000)return false;
  s.money=Math.max(0,s.money-cost);s.owned[i]++;s.history.maxOwned[i]=Math.max(s.history.maxOwned[i],s.owned[i]);return true;
}
function techCost(s,i) {return TECHS[i].cost;}
function techRequirement(s,i) {return TECHS[i].required;}
function techUnlocked(s,i) {
 const t=TECHS[i];if(t.era>s.era)return false;
 if(t.kind==='click')return s.history.clicks>=t.clicks;
 if(t.kind==='synergy')return s.skills[5]>0&&s.owned[t.source]>=t.required&&s.owned[t.target]>=t.required;
 return s.owned[t.facility]>=t.required;
}
function techCondition(s,i){
 const t=TECHS[i];
 if(t.kind==='click')return `通算手動操作 ${s.history.clicks}/${t.clicks}回`;
 if(t.kind==='synergy')return `相乗の伝承 Lv.1 ＋ ${FACILITIES[t.source].name} ${s.owned[t.source]}/${t.required}個 ＋ ${FACILITIES[t.target].name} ${s.owned[t.target]}/${t.required}個`;
 return `${FACILITIES[t.facility].name} ${s.owned[t.facility]}/${t.required}個`;
}
function techEffect(i){const t=TECHS[i];return t.kind==='era'?`${ERAS[t.era]}施設の生産 ×${t.mult}`:t.kind==='facility'?`${FACILITIES[t.facility].name}の生産 ×2`:t.kind==='click'?'手動獲得の基礎量 ×2':'上位施設 +1%/下位施設、下位施設 +0.5%/上位施設（各100個まで）';}
function canTech(s,i) {return !s.techs[i]&&techUnlocked(s,i)&&s.money>=techCost(s,i);}
function buyTech(s,i) {if(!canTech(s,i))return false;s.money-=techCost(s,i);s.techs[i]=true;s.history.techPurchases++;return true;}
function eraRequirement(s) {
  return s.era===0?{earned:10000,cost:5000,tech:0}:s.era===1?{earned:10000000,cost:5000000,tech:3}:s.era===2&&s.ascensions>0?{earned:1e14,cost:5e13,tech:5}:null;
}
function canEvolve(s) {const r=eraRequirement(s);return !!r&&s.earned>=r.earned&&s.money>=r.cost&&s.techs[r.tech];}
function evolve(s) {if(!canEvolve(s))return false;s.money-=eraRequirement(s).cost;s.era++;recordProgress(s);return true;}
function inheritance(s) {
  if(s.era<2||!s.techs[4]||s.earned<1e11)return 0;
  return Math.floor((1+Math.log10(s.earned/1e11))**2+1e-10);
}
function refreshLeap(s) {if(s.cycles>=3&&s.skills.reduce((a,b)=>a+b,0)>=8)s.leapUnlocked=true;}
const LEAP_RULES = Object.freeze({stepExponent:3,baseReward:3,bonusExponent:1.3});
function leapThreshold(s) {return 10**Math.min(240,18+LEAP_RULES.stepExponent*s.ascensions);}
function leapGain(s) {
  if(!s.leapUnlocked||s.era<2||!s.techs[5]||s.earned<leapThreshold(s))return 0;
  return Math.floor(LEAP_RULES.baseReward+Math.log10(s.earned/leapThreshold(s))**LEAP_RULES.bonusExponent+1e-10);
}
function leap(s) {
  const gain=leapGain(s);if(!gain)return false;
  s.insight+=gain;s.ascensions++;s.points=0;s.skills.fill(0);
  s.money=10;s.earned=0;s.era=0;s.owned.fill(0);s.techs.fill(false);grantLegacyTech(s);s.autoTime=0;
  return true;
}
function inherit(s) {
  const gain=inheritance(s);if(!gain)return false;
  s.points+=gain;s.cycles++;refreshLeap(s);s.money=10+100*s.skills[2];s.earned=0;s.era=0;s.owned.fill(0);s.techs.fill(false);grantLegacyTech(s);s.autoTime=0;
  return true;
}
function skillCost(s,i) {return SKILLS[i].base*4**s.skills[i];}
function skillUnlocked(s,i){
 if(s.skills[i]>0)return true;
 if(i===0)return s.cycles>=1;
 if(i===1)return s.cycles>=1&&s.history.maxEra>=1;
 if(i===2)return s.cycles>=2&&s.skills[0]>=1;
 if(i===3)return s.cycles>=1&&s.history.clicks>=25;
 if(i===4)return s.cycles>=2&&s.skills[0]>=2&&s.history.bestRun>=1e12;
 return s.cycles>=2&&s.skills[0]>=2&&s.history.maxOwned.slice(3,6).some(n=>n>=10);
}
function skillCondition(s,i){return ['継承1回','継承1回 ＋ 農耕到達','継承2回 ＋ 生産の知恵 Lv.1','継承1回 ＋ 通算手動操作25回','継承2回 ＋ 生産の知恵 Lv.2 ＋ 周回最高1兆','継承2回 ＋ 生産の知恵 Lv.2 ＋ 農耕施設の最大所持10個'][i];}
function buySkill(s,i) {
  const cost=skillCost(s,i);if(!skillUnlocked(s,i)||s.skills[i]>=SKILLS[i].max||s.points<cost)return false;
  s.points-=cost;s.skills[i]++;refreshLeap(s);
  // A starting-resource upgrade also grants its increment immediately.
  if(i===2)s.money+=100;
  return true;
}
function grantLegacyTech(s){if(s.ascensions>0)TECHS.forEach((t,i)=>{if(t.era<=2)s.techs[i]=true;});}
function firstLeapCheckpoint(){
 const s=fresh();s.cycles=3;s.leapUnlocked=true;s.era=2;s.techs[5]=true;s.earned=1e18;s.lifetime=1e18;s.history.maxEra=2;s.history.bestRun=1e18;
 leap(s);return s;
}
function advance(s,seconds) {
 if(!Number.isFinite(seconds)||seconds<=0)return;
 seconds=Math.min(seconds,7*86400);const amount=production(s)*seconds;
 s.money+=amount;s.earned+=amount;s.lifetime+=amount;s.elapsed+=seconds;recordProgress(s);
}
function formatNumber(n) {
  if(n<1e4)return Math.floor(n).toLocaleString('ja-JP',{maximumFractionDigits:0});
  if(n>=1e72)return n.toExponential(2);
  const units=['','万','億','兆','京','垓','秭','穣','溝','澗','正','載','極','恒河沙','阿僧祇','那由他','不可思議','無量大数'];
  let step=1;
  while(step<units.length-1&&n>=10**((step+1)*4))step++;
  // Truncate rather than round across the next unit's boundary.
  const coefficient=Math.floor(n/10**(step*4)*100)/100;
  return `${coefficient.toLocaleString('ja-JP',{maximumFractionDigits:2})}${units[step]}`;
}
function validateSave(s) {
  const nums=['money','earned','points','cycles','lifetime','elapsed','autoTime','last','ascensions','insight'];
  return !!s&&s.version===6&&nums.every(k=>Number.isFinite(s[k])&&s[k]>=0)&&s.money<=Number.MAX_VALUE/100&&s.earned<=Number.MAX_VALUE/100&&s.autoTime<60
    &&Number.isInteger(s.era)&&s.era>=0&&s.era<=3&&(s.era<3||s.ascensions>0)&&Number.isSafeInteger(s.points)&&Number.isSafeInteger(s.cycles)&&Number.isSafeInteger(s.ascensions)&&Number.isSafeInteger(s.insight)&&typeof s.leapUnlocked==='boolean'&&(s.ascensions===0||s.leapUnlocked)
    &&Array.isArray(s.owned)&&s.owned.length===FACILITIES.length&&s.owned.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=1000&&(FACILITIES[i].era<=s.era||n===0))
    &&Array.isArray(s.techs)&&s.techs.length===TECHS.length&&s.techs.every((v,i)=>typeof v==='boolean'&&(!v||TECHS[i].era<=s.era||(TECHS[i].era<=2&&s.ascensions>0)))
    &&Array.isArray(s.innovations)&&s.innovations.length===INNOVATIONS.length&&s.innovations.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=INNOVATIONS[i].max&&(!n||innovationReady(s,i)))
    &&s.history&&Number.isInteger(s.history.maxEra)&&s.history.maxEra>=0&&s.history.maxEra<=3&&['clicks','manual','techPurchases','bestRun'].every(k=>Number.isFinite(s.history[k])&&s.history[k]>=0)&&Number.isSafeInteger(s.history.clicks)&&Number.isSafeInteger(s.history.techPurchases)&&Array.isArray(s.history.maxOwned)&&s.history.maxOwned.length===FACILITIES.length&&s.history.maxOwned.every(n=>Number.isInteger(n)&&n>=0&&n<=1000)
    &&Array.isArray(s.skills)&&s.skills.length===SKILLS.length&&s.skills.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=SKILLS[i].max);
}

function migrateSave(old) {
 if(old?.version===6)return validateSave(old)?structuredClone(old):null;
 if(!old||![2,3,4,5].includes(old.version)||!Array.isArray(old.skills)||old.skills.length!==(old.version===5?3:5)||old.skills.some((n,i)=>!Number.isInteger(n)||n<0||n>(i===4?1:i===3?10:20)))return null;
 if(!Array.isArray(old.owned)||!Array.isArray(old.techs)||old.owned.length!==(old.version===2?9:12)||old.techs.length!==(old.version===2?6:8))return null;
 const expected=old.version===4?6:5;
 if(old.version>=4&&(!Array.isArray(old.innovations)||old.innovations.length!==expected||old.innovations.some((n,i)=>!Number.isInteger(n)||n<0||n>(old.version===4?[1,5,3,5,1,1]:[1,5,3,5,1])[i])))return null;
 const s={...fresh(),...structuredClone(old),version:6,skills:[...old.skills.slice(0,3),0,0,0],innovations:old.version===4?[...old.innovations.slice(0,4),old.innovations[5]]:old.version===5?[...old.innovations]:Array(INNOVATIONS.length).fill(0)};
 if(old.version===2){s.owned.push(0,0,0);s.techs.push(false,false);s.ascensions=0;s.insight=0;s.leapUnlocked=false;}
 s.techs.push(...Array(TECHS.length-8).fill(false));
 if(old.version<5){s.points+=(old.version===2?2*(2**old.skills[3]-1):2*(4**old.skills[3]-1)/3)+3*old.skills[4];if(old.version===4)s.insight+=3*old.innovations[4];}
 // Older versions gave free quantity multipliers; preserve them as purchased
 // facility technologies so updating does not remove an earned production tier.
 TECHS.forEach((t,i)=>{if(t.kind==='facility'&&s.owned[t.facility]>=t.required)s.techs[i]=true;});
 s.history={maxEra:Math.max(s.era,s.cycles>0||s.ascensions>0?2:0),maxOwned:[...s.owned],clicks:0,manual:0,techPurchases:0,bestRun:s.earned};
 if(!validateSave(s))return null;
 grantLegacyTech(s);refreshLeap(s);return s;
}

const KEY='fukasetsu-civilization-v6';
const BACKUP_KEY='fukasetsu-test-checkpoint-backup-v5';
const LEGACY_KEY='fukasetsu-civilization-v2';
const $=id=>document.getElementById(id);
let state=fresh(),qty=1,storageOK=true,testSpeed=1,workspace=window.matchMedia('(max-width: 800px)').matches?'facilities':'technologies';
function notify(text){$('notice').textContent=text;}
try{
 const raw=localStorage.getItem(KEY)||localStorage.getItem('fukasetsu-civilization-v5')||localStorage.getItem('fukasetsu-civilization-v4')||localStorage.getItem('fukasetsu-civilization-v3')||localStorage.getItem(LEGACY_KEY);
 if(raw){const loaded=migrateSave(JSON.parse(raw));if(!loaded)throw Error('save');state=loaded;const away=Math.min(604800,Math.max(0,(Date.now()-state.last)/1000));advance(state,away);notify(`おかえりなさい。${(away/3600).toFixed(1)}時間分の生産を受け取りました。`);}
}catch{notify('セーブを読み込めませんでした。新しい文明を開始します。');}
state.last=Date.now();
$('facilities').innerHTML=FACILITIES.map((f,i)=>`<article class="layer" id="facility${i}"><span class="number">${ERAS[f.era]}</span><h3>${f.name}</h3><p>${f.description}</p><div class="resource"><strong id="owned${i}">0</strong> <span>施設</span></div><p id="output${i}"></p><div class="requirement" id="cost${i}"></div><button id="buy${i}">購入</button></article>`).join('');
$('technologies').innerHTML=TECHS.map((t,i)=>`<article class="layer technology" id="technology${i}"><span class="number">${ERAS[t.era]}の技術</span><h3>${t.name}</h3><p>${techEffect(i)}</p><div class="requirement" id="techreq${i}"></div><button id="tech${i}">研究</button></article>`).join('');
$('skills').innerHTML=SKILLS.map((s,i)=>`<article class="layer"><span class="number">継承スキル</span><h3>${s.name}</h3><p>${s.description}</p><div class="requirement" id="skillreq${i}"></div><button id="skill${i}">強化</button></article>`).join('');
$('innovation-tree').innerHTML=INNOVATIONS.map((n,i)=>`<article class="layer innovation" id="innovation${i}"><span class="number">${i===0?'基盤':i===4?'融合':'発展の枝'}</span><h3>${n.name}</h3><p>${n.description}</p><p class="prerequisite">${n.requires.length?n.requires.map(([j,level])=>`${INNOVATIONS[j].name} Lv.${level}`).join(' ＋ '):'最初の飛躍から購入可能'}</p><div id="innovation-req${i}" class="requirement"></div><button id="innovation-buy${i}">革新ポイントで強化</button></article>`).join('');
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;notify('保存できません。このタブを閉じると進行が失われます。');}}
function update(){const now=Date.now();advance(state,Math.max(0,(now-state.last)/1000)*testSpeed);state.last=now;}
function render(){
 $('score').textContent=formatNumber(state.money);$('rate').textContent=`実時間1秒で +${formatNumber(production(state)*testSpeed)} 文明力${testSpeed===10?'（テスト10倍速）':''}`;
 $('time').textContent=`ゲーム内 ${(state.elapsed/3600).toFixed(1)}時間 / ${state.cycles+1}代目`;
 $('test-status').textContent=testSpeed===10?'10倍速で進行中':'通常速度';
 $('test-speed').checked=testSpeed===10;
 $('test-mode').classList.toggle('enabled',testSpeed===10);
 $('notation').textContent=`今周回の累計 ${formatNumber(state.earned)} · 全文明の累計 ${formatNumber(state.lifetime)}`;
 $('era').textContent=ERAS[state.era];
 $('gather-label').textContent=['採集する','収穫する','生産を手伝う','知識を集める'][state.era];
 $('gather-gain').textContent=`+${formatNumber(manualGain(state))} 文明力`;
 document.querySelectorAll('[data-era]').forEach(el=>{el.classList.toggle('current',Number(el.dataset.era)===state.era);if(Number(el.dataset.era)===3)el.textContent=state.ascensions?'04 情報':'04 情報（飛躍で解放）';});
 FACILITIES.forEach((f,i)=>{
  const unlocked=f.era<=state.era;$(`facility${i}`).hidden=!unlocked;
  $(`owned${i}`).textContent=state.owned[i];$(`output${i}`).textContent=`毎秒 ${formatNumber(facilityRate(state,i))} · 10/25/50/100個で個別技術が解放`;
  $(`cost${i}`).textContent=`次の1個 ${formatNumber(price(state,i))} 文明力`;
  $(`buy${i}`).textContent=state.owned[i]>=1000?'上限到達':qty==='max'?'買えるだけ購入':`${qty}個まで購入`;
  $(`buy${i}`).disabled=!unlocked||state.money<price(state,i)||state.owned[i]>=1000;
 });
 const filter=$('tech-filter').value,showResearched=$('show-researched').checked;
 let visibleTechs=0;
 TECHS.forEach((t,i)=>{
  const available=techUnlocked(state,i),researched=state.techs[i];
  const firstTier=t.kind!=='facility'||!TECHS.some((prior,j)=>prior.kind==='facility'&&prior.facility===t.facility&&j<i&&!state.techs[j]);
  const relevant=t.kind==='era'||t.kind==='click'||(t.kind==='facility'&&state.owned[t.facility]>0)||(t.kind==='synergy'&&state.skills[5]>0);
  $(`technology${i}`).hidden=t.era>state.era||(filter!=='all'&&t.kind!==filter)||(researched&&!showResearched)||(!researched&&(!firstTier||!relevant));
  if(!$(`technology${i}`).hidden)visibleTechs++;
  $(`techreq${i}`).textContent=researched?(state.ascensions&&t.era<=2?'飛躍で習得済み':'研究済み'):`${available?'解放済み':'未解放'} · ${techCondition(state,i)} · ${formatNumber(techCost(state,i))} 文明力`;
  $(`tech${i}`).disabled=!canTech(state,i);$(`tech${i}`).textContent=researched?'研究済み':available?'研究する':'条件未達';
 });
 $('tech-empty').hidden=visibleTechs>0;
 const r=eraRequirement(state);
 $('era-condition').textContent=r?`累計 ${formatNumber(r.earned)}・${TECHS[r.tech].name}の研究・${formatNumber(r.cost)} 文明力が必要`:state.era===2?'情報時代は最初の文明の飛躍で解放されます。':'情報時代に到達。文明の飛躍で桁の成長を強めましょう。';
 $('evolve').textContent=r?`${ERAS[state.era+1]}時代へ進む`:state.era===2?'情報時代は飛躍で解放':'全時代を解放済み';$('evolve').disabled=!canEvolve(state);
 const leapGoal=state.ascensions>0;const goal=leapGoal?leapThreshold(state):r?r.earned:1e11;const pct=Math.min(100,state.earned/goal*100);
 $('progress').value=pct;$('percent').textContent=`${pct.toFixed(1)}%`;$('progress-label').textContent=leapGoal?`次の飛躍への累計生産 · ${formatNumber(goal)} · ${leapGain(state)?`獲得可 ${leapGain(state)}`:`条件達成で ${LEAP_RULES.baseReward}`}革新ポイント`:r?'次の時代への累計生産':'継承解放への累計生産';
 $('innovation-points').textContent=formatNumber(state.insight);$('innovation-target').textContent=state.ascensions?`革新は次の飛躍で獲得。周回累計 ${formatNumber(state.earned)} / ${formatNumber(leapThreshold(state))}。条件達成で${LEAP_RULES.baseReward}ポイント、条件の10倍なら${LEAP_RULES.baseReward+1}ポイント。`:'最初の飛躍で3ポイントを獲得。基盤を購入したあと、量産革命か情報経済を選べます。';
 $('points').textContent=formatNumber(state.points);$('gain').textContent=inheritance(state);
 const ready=inheritance(state)>0;
 $('inherit').disabled=!ready;$('inherit').textContent=ready?'文明を継承する':'継承条件を満たしてください';
 $('inherit-condition').textContent=[
  `${state.era>=2?'✓':'未達'} 工業時代に進む（現在：${ERAS[state.era]}）`,
  `${state.techs[4]?'✓':'未達'} 機械化を研究${state.techs[4]?'':`（${techCondition(state,4)}・${formatNumber(techCost(state,4))}文明力）`}`,
  `${state.earned>=1e11?'✓':'未達'} 今周回の累計生産1,000億（現在：${formatNumber(state.earned)}${state.earned<1e11?` / あと${formatNumber(1e11-state.earned)}`:''}）`,
 ].join('\n');
 $('inherit-confirm-gain').textContent=inheritance(state);
 $('inherit-confirm-yes').disabled=!ready;
 SKILLS.forEach((s,i)=>{
  const max=state.skills[i]>=s.max;$(`skillreq${i}`).textContent=`Lv.${state.skills[i]} / ${s.max} · ${max?'最大レベル':`${formatNumber(skillCost(state,i))}ポイント`}`;
  $(`skill${i}`).disabled=max||!skillUnlocked(state,i)||state.points<skillCost(state,i);$(`skill${i}`).textContent=max?'最大レベル':skillUnlocked(state,i)?'強化する':'条件未達';
  $(`skillreq${i}`).textContent+=` · ${skillUnlocked(state,i)?'解放済み':skillCondition(state,i)}`;
 });
 $('leap-lock').hidden=state.leapUnlocked;
 $('leap-lock').textContent=`解放条件：継承3回（${state.cycles}/3）・スキル合計8レベル（${state.skills.reduce((a,b)=>a+b,0)}/8）`;
 $('leap-content').hidden=!state.leapUnlocked;
 $('insight').textContent=state.insight;
 $('leap-gain').textContent=leapGain(state);$('leap-confirm-gain').textContent=leapGain(state);
 $('leap').disabled=!leapGain(state);$('leap-confirm-yes').disabled=!leapGain(state);
 $('leap-condition').textContent=`${state.techs[5]?'✓':'未達'} 電力網を研究\n${state.earned>=leapThreshold(state)?'✓':'未達'} 周回累計 ${formatNumber(leapThreshold(state))}（現在 ${formatNumber(state.earned)}）`;
 $('leap-effect').textContent='革新ポイントはスキルを購入すると効果を発揮します。購入済みの革新スキルと未使用ポイントは、継承・飛躍後も保持します。';
 $('innovation-panel').hidden=!state.leapUnlocked;
 INNOVATIONS.forEach((n,i)=>{
  const ready=innovationReady(state,i),max=state.innovations[i]>=n.max,cost=innovationCost(state,i);
  $(`innovation-req${i}`).textContent=`Lv.${state.innovations[i]}/${n.max} · ${max?'最大レベル':`${formatNumber(cost)}革新ポイント`}${ready?'':' · 前提スキルが必要'}`;
  $(`innovation-buy${i}`).disabled=max||!ready||state.insight<cost;
  $(`innovation${i}`).classList.toggle('locked',!ready);
 });

 if(!storageOK)notify('保存できません。このタブを閉じると進行が失われます。');
 fitWorkspace();
}
function fitWorkspace(){
 const container=document.querySelector('.workspace'),main=document.querySelector('main');
 const tail=main.getBoundingClientRect().bottom-container.getBoundingClientRect().bottom;
 const top=container.getBoundingClientRect().top+window.scrollY;
 document.documentElement.style.setProperty('--workspace-height',`${Math.max(250,window.innerHeight-top-tail-12)}px`);
}
function setWorkspace(name){
 workspace=name;
 const mobile=window.matchMedia('(max-width: 800px)').matches;
 document.querySelectorAll('[data-panel]').forEach(el=>el.classList.toggle('active',el.dataset.panel===name||(!mobile&&el.dataset.panel==='facilities')||(!mobile&&name==='facilities'&&el.dataset.panel==='technologies')));
 document.querySelectorAll('[data-workspace]').forEach(el=>{el.classList.toggle('selected',el.dataset.workspace===name);el.setAttribute('aria-pressed',String(el.dataset.workspace===name));});
}
function workspaceForAction(name){setWorkspace(name);}
window.addEventListener('resize',()=>{setWorkspace(workspace);fitWorkspace();});
function action(fn){update();fn();render();save();}
$('test-skip').onclick=()=>{$('test-skip-confirm').hidden=false;$('test-skip-yes').focus();};
$('test-skip-no').onclick=()=>{$('test-skip-confirm').hidden=true;$('test-skip').focus();};
$('test-skip-yes').onclick=()=>{
 update();
 try{localStorage.setItem(BACKUP_KEY,JSON.stringify(state));}catch{notify('進行を退避できないため、スキップを中止しました。');return;}
 state=firstLeapCheckpoint();testSpeed=1;qty=1;$('quantity').value='1';
 $('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;
 $('test-restore').disabled=false;workspaceForAction('innovation');notify(`初回飛躍直後へ移動しました。工業までの技術は習得済み、革新ポイントは${state.insight}です。`);render();save();
};
$('test-restore').onclick=()=>{
 try{const restored=migrateSave(JSON.parse(localStorage.getItem(BACKUP_KEY)));if(!restored)throw Error('backup');state=restored;state.last=Date.now();testSpeed=1;$('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;notify('スキップ前の進行に戻しました。');render();save();}catch{notify('退避した進行を読み込めませんでした。');}
};
try{$('test-restore').disabled=!localStorage.getItem(BACKUP_KEY);}catch{}
$('test-speed').onchange=()=>action(()=>{testSpeed=$('test-speed').checked?10:1;notify(testSpeed===10?'テスト用10倍速を開始しました。生産とゲーム内時間が10倍で進みます。':'通常速度に戻しました。');});
$('gather').onclick=()=>action(()=>{const gain=gather(state);notify(`自分の働きで +${formatNumber(gain)} 文明力。施設を購入して生産を増やしましょう。`);});
FACILITIES.forEach((_,i)=>$(`buy${i}`).onclick=()=>action(()=>{let count=0;const limit=qty==='max'?1000:qty;while(count<limit&&buy(state,i))count++;if(count)notify(`${FACILITIES[i].name}を${count}個購入しました。`);}));
TECHS.forEach((t,i)=>$(`tech${i}`).onclick=()=>action(()=>{if(buyTech(state,i))notify(`${t.name}を研究。${techEffect(i)}。`);}));
SKILLS.forEach((s,i)=>$(`skill${i}`).onclick=()=>action(()=>{if(buySkill(state,i))notify(`${s.name}を強化しました。効果は通常継承で残り、飛躍でリセットされます。`);}));
$('evolve').onclick=()=>action(()=>{if(evolve(state))notify(`${ERAS[state.era]}時代が始まりました。既存の施設は引き続き生産します。`);});
$('quantity').onchange=e=>{qty=e.target.value==='max'?'max':Number(e.target.value);render();};
$('inherit').onclick=()=>{
 workspaceForAction('legacy');
 update();render();if(!inheritance(state))return;
 $('inherit-confirm').hidden=false;$('inherit-confirm-yes').focus();
};
$('inherit-confirm-no').onclick=()=>{$('inherit-confirm').hidden=true;$('inherit').focus();};
$('inherit-confirm-yes').onclick=()=>action(()=>{
 const gain=inheritance(state);if(!gain)return;
 inherit(state);$('inherit-confirm').hidden=true;
 notify(`文明を継承し、${gain}ポイントを獲得しました。継承スキルを強化できます。`);
 workspaceForAction('legacy');$('skill0').focus();
});
INNOVATIONS.forEach((n,i)=>$(`innovation-buy${i}`).onclick=()=>action(()=>{if(buyInnovation(state,i))notify(`${n.name}を強化しました。効果は飛躍後も残ります。`);}));
$('leap').onclick=()=>{workspaceForAction('legacy');update();render();if(!leapGain(state))return;$('leap-confirm').hidden=false;$('leap-confirm-yes').focus();};
$('leap-confirm-no').onclick=()=>{$('leap-confirm').hidden=true;$('leap').focus();};
$('leap-confirm-yes').onclick=()=>action(()=>{
 const gain=leapGain(state);if(!gain)return;
 leap(state);$('leap-confirm').hidden=true;$('inherit-confirm').hidden=true;
 workspaceForAction('innovation');notify(`文明が飛躍しました。革新 +${gain}。情報時代が解放されました。革新ポイントでスキルを選びましょう。`);
 $('gather').focus();
});
$('erase').onclick=()=>{if(confirm('この文明版のセーブをすべて消しますか？旧試作のセーブは消しません。')){state=fresh();$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;notify('新しい文明を開始しました。採集か施設購入から始めましょう。');render();save();}};
window.addEventListener('pagehide',()=>{update();save();});document.addEventListener('visibilitychange',()=>{update();render();save();});
document.querySelectorAll('[data-workspace]').forEach(el=>el.onclick=()=>setWorkspace(el.dataset.workspace));
$('tech-filter').onchange=render;$('show-researched').onchange=render;setWorkspace(workspace);
setInterval(()=>{update();render();},500);setInterval(save,5000);render();save();

})();
