import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,timeCheckpoint,buyTimeSkill,TIME_SKILLS,timeSkillCost,productionExponent,production,advance,fromLog10,log10,add,subtract,multiply,compare,validateSave,migrateSave,nextResetReward,timeGain,timeTravel,inherit,leap,transcend,transcendGain,inheritance,leapGain,leapThreshold,BUDDHIST_UNITS,BUDDHIST_GOAL_EXPONENT,checkClear,formatNumber,timeThreshold,purchaseQuote,buy,buyTech,gather,TECHS,TIME_RESEARCH_TECHS,timeResearchPower,timeFacilitySynergy,canTech} from '../engine.js';

test('有限の計算はNumberを保持し、巨大数の加算・減算・乗算は対数で保存する',()=>{
 assert.equal(add(12,3),15);assert.equal(subtract(12,3),9);assert.equal(multiply(12,3),36);
 const huge=fromLog10(1000);assert.equal(log10(add(huge,huge)),1000+Math.log10(2));assert.equal(log10(multiply(huge,100)),1002);assert.equal(subtract(huge,huge),0);assert.equal(compare(huge,1e300),1);
});
test('v8の資産と3時空スキルを保持し、巨大値のv9セーブとオフライン進行を復元する',()=>{
 const old=timeCheckpoint();old.version=8;old.timeSkills=old.timeSkills.slice(0,3);delete old.goalReached;delete old.goalAcknowledged;delete old.goalElapsed;
 const s=migrateSave(old);assert.ok(s);assert.equal(s.version,9);assert.deepEqual(s.timeSkills,Array(11).fill(0));assert.equal(s.money,old.money);assert.deepEqual(s.owned,old.owned);
 s.chronons=100;buyTimeSkill(s,0);for(let i=0;i<15;i++)buyTimeSkill(s,3);advance(s,60);
 assert.ok(log10(s.money)>308);assert.ok(validateSave(s));const loaded=migrateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);advance(loaded,86400);assert.ok(compare(loaded.money,s.money)>0);
 assert.equal(migrateSave({...old,timeSkills:[0,0,0,0]}),null);
});
test('最後の強化で全資産を揃えても不可説不可説転の生産には300秒かかる',()=>{
 const s=timeCheckpoint();s.timeSkills=TIME_SKILLS.map(n=>n.max);s.skills=[20,20,20,5,10,1];s.innovations=[1,5,3,5,1];s.transcendSkills=[1,4,4,1];s.era=4;s.owned.fill(1000);s.history.maxOwned.fill(1000);s.techs.fill(true);s.fixedTimeResearch.fill(true);s.facilityArchive=true;
 s.timeSkills[3]=121;assert.equal(timeSkillCost(s,3),17);s.timeSkills[3]=124;
 s.timeSkills[7]=7;assert.ok(log10(production(s))<Number(BUDDHIST_GOAL_EXPONENT));s.timeSkills[7]=8;
 const goal=fromLog10(Number(BUDDHIST_GOAL_EXPONENT));assert.equal(compare(multiply(production(s),300),goal),0);
 const start=s.elapsed;advance(s,299);assert.equal(s.goalReached,false);assert.ok(compare(s.money,goal)<0);gather(s);assert.equal(s.goalReached,false);
 advance(s,1);assert.equal(s.goalReached,true);assert.equal(s.goalElapsed,start+300);assert.ok(validateSave(s));
 const cleared=s.clearScore;assert.ok(timeTravel(s));assert.equal(s.goalReached,true);assert.equal(s.clearScore,cleared);assert.equal(s.timeSkills[3],124);assert.ok(validateSave(s));
});
test('各リセットの次ポイント文明力は式の逆算と一致し、超越の記憶倍率を含む',()=>{
 const s=timeCheckpoint();s.era=3;s.earned=1e90;s.techs[4]=true;s.techs[5]=true;s.techs[7]=true;s.timeSkills[0]=1;s.timeSkills[2]=1;
 for(const [kind,fn] of [['inheritance',inheritance],['leap',leapGain],['transcend',transcendGain],['time',timeGain]]){
  const q=nextResetReward(s,kind);assert.ok(q);const probe=structuredClone(s);probe.earned=multiply(q.target,1.00000000001);assert.equal(fn(probe),q.nextGain);assert.ok(compare(q.target,s.earned)>0);assert.ok(compare(q.remaining,0)>0);
 }
 s.earned=fromLog10(1e20);for(const kind of ['inheritance','leap','transcend','time']){const q=nextResetReward(s,kind);assert.ok(q);assert.ok(Number.isFinite(log10(q.target)));assert.ok(compare(q.target,s.earned)>0);}
});
test('ゴール直前はクリアしない、到達記録と時間は一度だけ記録する',()=>{
 const s=timeCheckpoint();const goal=Number(BUDDHIST_GOAL_EXPONENT);s.money=fromLog10(goal*.999);checkClear(s);assert.equal(s.goalReached,false);
 s.money=fromLog10(goal);s.elapsed=100;checkClear(s);assert.equal(s.goalReached,true);assert.equal(s.goalElapsed,100);s.elapsed=200;checkClear(s);assert.equal(s.goalElapsed,100);
});

test('時間ツリーで技術・時代と未使用ポイントを保持する分岐を選べる',()=>{
 const s=timeCheckpoint();s.chronons=1000;
 for(const [i,n] of [[0,1],[1,1],[2,1],[4,2],[5,2],[6,1],[8,1]])for(let j=0;j<n;j++)assert.ok(buyTimeSkill(s,i));
 assert.equal(s.era,3);assert.ok(s.techs.slice(0,87).every(Boolean));assert.ok(validateSave(s));
 assert.ok(buyTimeSkill(s,9));assert.equal(s.era,4);assert.ok(s.owned.slice(9).every(n=>n===0));assert.ok(buyTimeSkill(s,10));
 s.points=13;s.insight=17;s.horizon=19;s.earned=1e80;assert.ok(timeTravel(s));assert.equal(s.points,13);assert.equal(s.insight,17);assert.equal(s.horizon,19);assert.ok(s.skills.every(n=>!n));assert.equal(s.era,4);assert.ok(s.techs.slice(0,87).every(Boolean));assert.ok(validateSave(s));
});

test('技術保存とポイント保持を宇宙の結合より前に購入し、時間跳躍で維持する',()=>{
 const s=timeCheckpoint();s.chronons=3;
 assert.equal(buyTimeSkill(s,8),false);
 assert.ok(buyTimeSkill(s,0));assert.ok(buyTimeSkill(s,8));
 assert.equal(s.chronons,0);assert.ok(s.techs.slice(0,87).every(Boolean));assert.equal(s.era,3);
 assert.equal(buyTimeSkill(s,10),false);s.chronons=3;assert.ok(buyTimeSkill(s,10));
 assert.equal(s.timeSkills[6],0);assert.equal(s.timeSkills[9],0);
 s.points=13;s.insight=17;s.horizon=19;s.earned=timeThreshold(s);
 assert.ok(timeTravel(s));assert.equal(s.points,13);assert.equal(s.insight,17);assert.equal(s.horizon,19);
 assert.ok(s.techs.slice(0,87).every(Boolean));assert.equal(s.era,3);assert.ok(validateSave(s));
 assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))),s);
});

test('宇宙継承を時間航行の直後に購入し、施設購入前から宇宙時代で再開する',()=>{
 const s=timeCheckpoint();s.chronons=4;assert.ok(buyTimeSkill(s,0));assert.ok(buyTimeSkill(s,9));
 assert.equal(s.era,4);assert.ok(s.owned.slice(12).every(n=>n===0));assert.equal(s.timeSkills[6],0);
 s.earned=timeThreshold(s);assert.ok(timeTravel(s));assert.equal(s.era,4);assert.ok(validateSave(s));
});

test('並行宇宙の支援は同時代の施設で増えず、他時代の施設数で最大まで伸びる',()=>{
 const s=timeCheckpoint();s.timeSkills[0]=1;s.timeSkills[1]=1;s.timeSkills[4]=2;
 s.owned.fill(0);s.owned[0]=1000;assert.equal(timeFacilitySynergy(s,0),1);
 s.owned[3]=1000;assert.equal(timeFacilitySynergy(s,0),6);
 s.owned[4]=1000;s.owned[5]=1000;assert.equal(timeFacilitySynergy(s,0),16);
 const boosted=log10(production(s));s.timeSkills[4]=0;assert.ok(boosted>log10(production(s)));
});

test('時空研究は購入して初めて生産に反映され、技術保存と旧セーブ移行でも習得する',()=>{
 const s=timeCheckpoint();s.chronons=100;buyTimeSkill(s,0);buyTimeSkill(s,2);
 for(let i=0;i<5;i++)assert.ok(buyTimeSkill(s,5));
 assert.equal(timeResearchPower(s),1);const ids=TIME_RESEARCH_TECHS.map(t=>TECHS.indexOf(t));
 s.money=1e200;assert.ok(buyTech(s,ids[0]));assert.equal(timeResearchPower(s),16);
 assert.ok(buyTech(s,ids[1]));assert.equal(timeResearchPower(s),32);assert.equal(canTech(s,ids[2]),false);
 const old=structuredClone(s);old.techs=old.techs.slice(0,87);
 assert.ok(buyTimeSkill(s,8));assert.deepEqual(ids.map(i=>s.techs[i]),[true,true,false]);assert.equal(timeResearchPower(s),32);
 const loaded=migrateSave(old);assert.ok(loaded);assert.equal(loaded.techs[ids[0]],true);assert.equal(loaded.techs[ids[1]],true);assert.equal(loaded.techs[ids[2]],false);
 assert.equal(timeResearchPower(loaded),32);assert.ok(validateSave(loaded));
});

test('技術の永久保存と宇宙の継承は下位の全リセットにも適用する',()=>{
 const source=timeCheckpoint();source.chronons=1000;
 for(const [i,n] of [[0,1],[1,1],[2,1],[4,2],[5,2],[6,1],[8,1],[9,1]])for(let j=0;j<n;j++)buyTimeSkill(source,i);
 for(const reset of [inherit,leap,transcend]){const s=structuredClone(source);s.earned=1e100;assert.ok(reset(s));assert.equal(s.era,4);assert.ok(s.techs.slice(0,87).every(Boolean));assert.ok(s.owned.slice(0,9).every(n=>n===100));assert.ok(validateSave(s));}
});

test('飛躍の201桁・240桁境界でも圧縮された報酬と次ポイントを逆算する',()=>{
 for(const ascensions of [61,74]){const s=timeCheckpoint();s.ascensions=ascensions;s.earned=leapThreshold(s);assert.equal(leapGain(s),3);let q=nextResetReward(s,'leap');assert.ok(compare(q.target,s.earned)>0);s.earned=multiply(q.target,1.00000001);assert.equal(leapGain(s),4);
 s.earned=fromLog10(1e36);q=nextResetReward(s,'leap');assert.ok(compare(q.target,s.earned)>0);s.earned=fromLog10(log10(q.target)*(1+1e-10));assert.equal(leapGain(s),q.nextGain);
 }
});
test('巨大数は単位を重ねて表し、最終単位は正確に選ぶ',()=>{
 const label=formatNumber(fromLog10(1e36),'buddhist');assert.ok(label.length<45);assert.doesNotMatch(label,/10\^|e[+-]\d/);assert.match(label,/不可/);
 assert.match(formatNumber(fromLog10(Number(BUDDHIST_GOAL_EXPONENT)),'buddhist'),/^1 不可説不可説転$/);
});

test('八十華厳の全単位は倶胝から不可説不可説転まで指数を倍増する',()=>{
 assert.equal(BUDDHIST_UNITS.length,124);assert.equal(BUDDHIST_UNITS[0].name,'洛叉');const chain=BUDDHIST_UNITS.slice(1);
 assert.equal(chain[7].name,'摩婆羅');assert.equal(chain[31].name,'奚婆羅');assert.deepEqual(chain.slice(119).map(u=>u.name),['不可説','不可説転','不可説不可説','不可説不可説転']);
 assert.equal(chain[0].exponent,7n);for(let i=1;i<chain.length;i++)assert.equal(chain[i].exponent,chain[i-1].exponent*2n);assert.equal(chain.at(-1).exponent,BUDDHIST_GOAL_EXPONENT);
});


test('時間跳躍の報酬は周回累計だけで算出し、支出・通算累計・回数で増減しない',()=>{
 const s=timeCheckpoint();
 s.earned=1e150;const reward=timeGain(s);assert.ok(reward>1);
 for(const j of [1,2,3,4]){s.timeJumps=j;s.money=0;s.lifetime=fromLog10(1e20);assert.equal(timeGain(s),reward);const q=nextResetReward(s,'time');const probe=structuredClone(s);probe.earned=q.target;assert.equal(timeGain(probe),reward+1);}
 s.timeJumps=1;s.earned=1e79;assert.equal(timeGain(s),0);s.earned=1e80;assert.equal(timeGain(s),3);
 s.earned=fromLog10(Number(BUDDHIST_GOAL_EXPONENT));
 for(const [kind,fn] of [['inheritance',inheritance],['leap',leapGain],['transcend',transcendGain],['time',timeGain]]){
  const q=nextResetReward(s,kind),probe=structuredClone(s);assert.ok(q);probe.earned=q.target;
  assert.equal(fn(probe),q.nextGain);assert.ok(compare(q.remaining,0)>0);
 }
});

test('巨大な文明力でも施設まとめ買い・研究・採集・保存は進行できる',()=>{
 const s=timeCheckpoint();s.era=4;s.money=fromLog10(1000);s.chronons=100;
 buyTimeSkill(s,0);for(let n=0;n<15;n++)buyTimeSkill(s,3);
 const quote=purchaseQuote(s,14,'max');assert.equal(quote.count,1000);assert.equal(quote.affordable,true);assert.ok(Number.isFinite(quote.cost));
 for(let n=0;n<quote.count;n++)assert.ok(buy(s,14));assert.equal(buy(s,14),false);
 assert.ok(buyTech(s,TECHS.findIndex(t=>t.kind==='facility'&&t.facility===14&&t.required===10)));const reward=gather(s);assert.ok(log10(reward)>308);
 assert.ok(compare(s.money,fromLog10(1000))>0);assert.ok(validateSave(s));assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))),s);
});
