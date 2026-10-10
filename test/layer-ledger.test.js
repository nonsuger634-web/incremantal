import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,advance,gather,inherit,leap,transcend,timeTravel,clearCheckpoint,timeCheckpoint,buySkill,lowerRewardBreakdown,resetProduction,nextResetReward,multiply,compare,fundedLowerAssets,syncPermanentRecord,fromLog10,BUDDHIST_GOAL_EXPONENT,TIME_SKILLS,SKILLS,INNOVATIONS,TRANSCEND_SKILLS,discoverGoalUnit,validateSave,migrateSave} from '../engine.js';

function ready(){const s=fresh();s.era=3;s.ascensions=3;s.cycles=3;s.leapUnlocked=true;s.techs[4]=s.techs[5]=s.techs[7]=true;s.earned=1e50;s.layerProduction=[1e50,1e50,1e50];return s;}

test('生産と採集を各層へ積算し、同層リセットでは累計と使用済み分を保持する',()=>{
 const s=fresh();s.owned[0]=1;advance(s,10);const before=structuredClone(s.layerProduction);gather(s);assert.ok(s.layerProduction.every((v,i)=>compare(v,before[i])>0));assert.equal(s.layerProduction[0],s.earned);
 const p=ready(),cum=p.layerProduction[0],quote=lowerRewardBreakdown(p,'inheritance');assert.ok(inherit(p));assert.equal(p.layerProduction[0],cum);assert.equal(p.memoryAwards[0],quote.reward);assert.ok(buySkill(p,0));
 p.era=3;p.earned=1e11;const snapshot=structuredClone(p);assert.equal(inherit(p),false);assert.deepEqual(p,snapshot);
 p.layerProduction[0]=1e60;const q=lowerRewardBreakdown(p,'inheritance');assert.equal(q.total,q.reward-quote.reward);assert.ok(inherit(p));assert.equal(p.memoryAwards[0],q.reward);
});

test('上位リセットは下位だけの累計・受取済み額・資産を消す',()=>{
 for(const [reset,upper] of [[leap,1],[transcend,2]]){const s=ready();s.memoryAwards=[2,2,2];const before=structuredClone(s.layerProduction);assert.ok(reset(s));for(let i=0;i<upper;i++){assert.equal(s.layerProduction[i],0);assert.equal(s.memoryAwards[i],0);}for(let i=upper;i<3;i++)assert.equal(s.layerProduction[i],before[i]);assert.equal(s.resetCounts[upper],1);}
 const s=clearCheckpoint();s.layerProduction=[1e20,1e30,1e68];assert.ok(timeTravel(s));assert.deepEqual(s.layerProduction,[0,0,0]);assert.deepEqual(s.memoryAwards,[0,0,0]);assert.equal(s.resetCounts[3],1);
});

test('永久記録後は飛躍・超越・時間跳躍でも下位累計と資産を保持する',()=>{
 for(const [reset,upper] of [[leap,1],[transcend,2],[timeTravel,3]]){
  const s=timeCheckpoint();s.timeSkills[0]=s.timeSkills[8]=s.timeSkills[10]=1;s.era=3;s.techs[4]=s.techs[5]=s.techs[7]=true;s.earned=1e80;s.lifetime=1e180;s.layerProduction=[1e150,1e150,1e150];syncPermanentRecord(s);
  if(upper<3)s.layerProduction[upper]=1e180;
  const before=structuredClone(s),funds=fundedLowerAssets(s);assert.ok(reset(s));assert.deepEqual(s.layerProduction,before.layerProduction);for(let i=0;i<upper;i++){assert.equal(s.memoryAwards[i],before.memoryAwards[i]);assert.equal(fundedLowerAssets(s)[i],funds[i]);}assert.ok(validateSave(s));
 }
});

test('全層の次報酬は台帳を含めて逆算し、累計の増加分だけを受け取る',()=>{
 for(const [kind,reset] of [['inheritance',inherit],['leap',leap],['transcend',transcend]]){
  const s=ready();assert.ok(reset(s));s.era=3;s.techs[4]=s.techs[5]=s.techs[7]=true;s.earned=1e50;s.layerProduction[['inheritance','leap','transcend'].indexOf(kind)]=1e60;
  const q=nextResetReward(s,kind);assert.ok(q);s.layerProduction[['inheritance','leap','transcend'].indexOf(kind)]=multiply(q.target,1.000000001);assert.equal(lowerRewardBreakdown(s,kind).total,q.nextGain);assert.ok(compare(q.target,resetProduction(ready(),kind))>0);
 }
});

test('旧セーブは資産を保ち、累計・生涯回数を初期化して復元する',()=>{
 const old=timeCheckpoint();old.skills[0]=3;old.points=7;delete old.layerProduction;delete old.resetCounts;delete old.goalUnitKnown;const copy=structuredClone(old),s=migrateSave(old);assert.ok(s);assert.deepEqual(old,copy);assert.deepEqual(s.skills,old.skills);assert.equal(s.points,7);assert.deepEqual(s.resetCounts,[old.cycles,old.ascensions,old.transcendences,old.timeJumps]);assert.ok(s.layerProduction.every(v=>v===old.earned));assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))),s);
 assert.equal(migrateSave({...s,layerProduction:[-1,0,0]}),null);assert.equal(migrateSave({...s,resetCounts:[1.5,0,0,0]}),null);
});

test('最終単位は目標到達前に秒給へ出現した時点で発見し、リセット後も保持する',()=>{
 const s=timeCheckpoint();s.skills=SKILLS.map(n=>n.max);s.innovations=INNOVATIONS.map(n=>n.max);s.transcendSkills=TRANSCEND_SKILLS.map(n=>n.max);s.timeSkills=TIME_SKILLS.map(n=>n.max);s.era=4;s.owned.fill(1000);s.techs.fill(true);
 assert.equal(s.goalReached,false);assert.equal(discoverGoalUnit(s),true);assert.equal(s.goalReached,false);s.timeSkills.fill(0);s.money=10;assert.equal(discoverGoalUnit(s),true);
 const p=fresh();p.money=fromLog10(Number(BUDDHIST_GOAL_EXPONENT),0.0033);assert.equal(discoverGoalUnit(p),true);assert.equal(p.goalReached,false);
});
