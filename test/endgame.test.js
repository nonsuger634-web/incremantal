import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,timeCheckpoint,buyTimeSkill,TIME_SKILLS,timeSkillCost,productionExponent,production,advance,fromLog10,log10,add,subtract,multiply,compare,validateSave,migrateSave,nextResetReward,timeGain,timeTravel,inherit,leap,transcend,transcendGain,inheritance,leapGain,leapThreshold,BUDDHIST_UNITS,BUDDHIST_GOAL_EXPONENT,checkClear,formatNumber,timeThreshold,purchaseQuote,buy,buyTech,gather,TECHS} from '../engine.js';

test('有限の計算はNumberを保持し、巨大数の加算・減算・乗算は対数で保存する',()=>{
 assert.equal(add(12,3),15);assert.equal(subtract(12,3),9);assert.equal(multiply(12,3),36);
 const huge=fromLog10(1000);assert.equal(log10(add(huge,huge)),1000+Math.log10(2));assert.equal(log10(multiply(huge,100)),1002);assert.equal(subtract(huge,huge),0);assert.equal(compare(huge,1e300),1);
});
test('v8の資産と3時空スキルを保持し、巨大値のv9セーブとオフライン進行を復元する',()=>{
 const old=timeCheckpoint();old.version=8;old.timeSkills=old.timeSkills.slice(0,3);delete old.goalReached;delete old.goalAcknowledged;delete old.goalElapsed;
 const s=migrateSave(old);assert.ok(s);assert.equal(s.version,9);assert.deepEqual(s.timeSkills,Array(11).fill(0));assert.equal(s.money,old.money);assert.deepEqual(s.owned,old.owned);
 s.chronons=100;buyTimeSkill(s,0);for(let i=0;i<5;i++)buyTimeSkill(s,3);advance(s,60);
 assert.ok(log10(s.money)>308);assert.ok(validateSave(s));const loaded=migrateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);advance(loaded,86400);assert.ok(compare(loaded.money,s.money)>0);
 assert.equal(migrateSave({...old,timeSkills:[0,0,0,0]}),null);
});
test('時間再帰のレベル価格は穏やかで、実際の生産で不可説不可説転へ到達する',()=>{
 const s=timeCheckpoint();s.chronons=100000;buyTimeSkill(s,0);
 for(let i=0;i<121;i++)assert.ok(buyTimeSkill(s,3));
 assert.equal(timeSkillCost(s,3),17);assert.ok(productionExponent(s)>1e36);advance(s,1);
 assert.ok(log10(s.money)>=Number(BUDDHIST_GOAL_EXPONENT));assert.equal(s.goalReached,true);assert.ok(validateSave(s));assert.match(formatNumber(fromLog10(Number(BUDDHIST_GOAL_EXPONENT)),'buddhist'),/不可説不可説転/);
 const cleared=s.clearScore;assert.ok(timeTravel(s));assert.equal(s.goalReached,true);assert.equal(s.clearScore,cleared);assert.equal(s.timeSkills[3],121);assert.ok(validateSave(s));
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

test('宇宙の結合から技術・時代と未使用ポイントを保持する分岐を選べる',()=>{
 const s=timeCheckpoint();s.chronons=1000;
 for(const [i,n] of [[0,1],[1,1],[2,1],[4,2],[5,2],[6,1],[8,1]])for(let j=0;j<n;j++)assert.ok(buyTimeSkill(s,i));
 assert.equal(s.era,3);assert.ok(s.techs.every(Boolean));assert.ok(validateSave(s));
 assert.ok(buyTimeSkill(s,9));assert.equal(s.era,4);assert.ok(s.owned.slice(9).every(n=>n===0));assert.ok(buyTimeSkill(s,10));
 s.points=13;s.insight=17;s.horizon=19;s.earned=1e80;assert.ok(timeTravel(s));assert.equal(s.points,13);assert.equal(s.insight,17);assert.equal(s.horizon,19);assert.ok(s.skills.every(n=>!n));assert.equal(s.era,4);assert.ok(s.techs.every(Boolean));assert.ok(validateSave(s));
});

test('技術の永久保存と宇宙の継承は下位の全リセットにも適用する',()=>{
 const source=timeCheckpoint();source.chronons=1000;
 for(const [i,n] of [[0,1],[1,1],[2,1],[4,2],[5,2],[6,1],[8,1],[9,1]])for(let j=0;j<n;j++)buyTimeSkill(source,i);
 for(const reset of [inherit,leap,transcend]){const s=structuredClone(source);s.earned=1e100;assert.ok(reset(s));assert.equal(s.era,4);assert.ok(s.techs.every(Boolean));assert.ok(s.owned.slice(0,9).every(n=>n===100));assert.ok(validateSave(s));}
});

test('飛躍の201桁・240桁境界でも圧縮された報酬と次ポイントを逆算する',()=>{
 for(const ascensions of [61,74]){const s=timeCheckpoint();s.ascensions=ascensions;s.earned=leapThreshold(s);assert.equal(leapGain(s),3);let q=nextResetReward(s,'leap');assert.ok(compare(q.target,s.earned)>0);s.earned=multiply(q.target,1.00000001);assert.equal(leapGain(s),4);
 s.earned=fromLog10(1e36);q=nextResetReward(s,'leap');assert.ok(compare(q.target,s.earned)>0);s.earned=fromLog10(log10(q.target)*(1+1e-10));assert.equal(leapGain(s),q.nextGain);
 }
});
test('巨大指数の華厳表示は科学表記で収まり、最終単位は正確に選ぶ',()=>{
 const label=formatNumber(fromLog10(1e36),'buddhist');assert.ok(label.length<45);assert.match(label,/10\^\([\d.]+×10\^\d+\)/);
 assert.match(formatNumber(fromLog10(Number(BUDDHIST_GOAL_EXPONENT)),'buddhist'),/^1 不可説不可説転$/);
});

test('八十華厳の全単位は倶胝から不可説不可説転まで指数を倍増する',()=>{
 assert.equal(BUDDHIST_UNITS.length,124);assert.equal(BUDDHIST_UNITS[0].name,'洛叉');const chain=BUDDHIST_UNITS.slice(1);
 assert.equal(chain[7].name,'摩婆羅');assert.equal(chain[31].name,'奚婆羅');assert.deepEqual(chain.slice(119).map(u=>u.name),['不可説','不可説転','不可説不可説','不可説不可説転']);
 assert.equal(chain[0].exponent,7n);for(let i=1;i<chain.length;i++)assert.equal(chain[i].exponent,chain[i-1].exponent*2n);assert.equal(chain.at(-1).exponent,BUDDHIST_GOAL_EXPONENT);
});


test('タイムマシン報酬は回数と超過生産で増え、次の1ポイントを逆算できる',()=>{
 const s=timeCheckpoint();
 for(const [j,base] of [[1,3],[2,5],[10,21]]){
  s.timeJumps=j;s.earned=timeThreshold(s);assert.equal(timeGain(s),base);
  const q=nextResetReward(s,'time');s.earned=q.target;assert.equal(timeGain(s),base+1);
 }
 s.earned=fromLog10(Number(BUDDHIST_GOAL_EXPONENT));
 for(const [kind,fn] of [['inheritance',inheritance],['leap',leapGain],['transcend',transcendGain],['time',timeGain]]){
  const q=nextResetReward(s,kind),probe=structuredClone(s);assert.ok(q);probe.earned=q.target;
  assert.equal(fn(probe),q.nextGain);assert.ok(compare(q.remaining,0)>0);
 }
});

test('巨大な文明力でも施設まとめ買い・研究・採集・保存は進行できる',()=>{
 const s=timeCheckpoint();s.era=4;s.money=fromLog10(1000);s.chronons=100;
 buyTimeSkill(s,0);for(let n=0;n<5;n++)buyTimeSkill(s,3);
 const quote=purchaseQuote(s,14,'max');assert.equal(quote.count,1000);assert.equal(quote.affordable,true);assert.ok(Number.isFinite(quote.cost));
 for(let n=0;n<quote.count;n++)assert.ok(buy(s,14));assert.equal(buy(s,14),false);
 assert.ok(buyTech(s,TECHS.findIndex(t=>t.kind==='facility'&&t.facility===14&&t.required===10)));const reward=gather(s);assert.ok(log10(reward)>308);
 assert.ok(compare(s.money,fromLog10(1000))>0);assert.ok(validateSave(s));assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))),s);
});
