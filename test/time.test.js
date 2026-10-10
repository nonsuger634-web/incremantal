import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,checkClear,clearCheckpoint,timeCheckpoint,timeGain,timeTravel,timeThreshold,buyTimeSkill,timeSkillCost,productionExponent,transcendGain,transcend,inherit,leap,migrateSave,validateSave,formatNumber} from '../engine.js';

test('クリアは所持1無量大数を厳密に超えた時だけ記録し、一度の記録を保持する',()=>{
 const s=fresh();s.earned=1e80;s.money=1e68;s.elapsed=42;
 assert.equal(checkClear(s),false);assert.equal(timeGain(s),0);
 const before=structuredClone(s);assert.equal(timeTravel(s),false);assert.deepEqual(s,before);
 s.money=1.01e68;assert.equal(checkClear(s),true);assert.equal(s.clearScore,s.money);assert.equal(s.clearElapsed,42);assert.equal(s.clearAcknowledged,false);
 s.money=0;s.elapsed=100;checkClear(s);assert.equal(s.clearScore,1.01e68);assert.equal(s.clearElapsed,42);assert.ok(validateSave(s));
});

test('タイムマシン開発は下位資産をリセットしクリア記録と時空資産を保持する',()=>{
 const s=clearCheckpoint(),clear=s.clearScore,history=structuredClone(s.history),lifetime=s.lifetime;
 s.skills[0]=4;s.points=10;s.insight=5;s.horizon=7;
 assert.equal(timeGain(s),1);assert.ok(timeTravel(s));assert.equal(s.timeJumps,1);assert.equal(s.chronons,1);
 assert.equal(s.cleared,true);assert.equal(s.clearAcknowledged,true);assert.equal(s.clearScore,clear);assert.equal(s.lifetime,lifetime);assert.deepEqual(s.history,history);
 assert.deepEqual(s.skills,[0,0,0,0,0,0]);assert.deepEqual(s.innovations,[1,0,0,0,0]);assert.deepEqual(s.transcendSkills,[1,0,0,0]);
 for(const k of ['cycles','points','ascensions','insight','transcendences','horizon','earned'])assert.equal(s[k],0);
 assert.equal(s.money,10);assert.equal(s.era,3);assert.deepEqual(s.owned.slice(0,9),Array(9).fill(100));assert.ok(s.owned.slice(9).every(n=>!n));assert.ok(s.techs.slice(0,69).every(Boolean));assert.ok(validateSave(s));
 assert.ok(buyTimeSkill(s,0));assert.equal(s.chronons,0);assert.equal(productionExponent(s),1.45);assert.equal(timeThreshold(s),1e80);
 assert.equal(buyTimeSkill(s,1),false);s.earned=1e80;s.money=1e80;assert.equal(timeGain(s),3);assert.ok(timeTravel(s));assert.equal(s.timeJumps,2);assert.equal(s.chronons,3);assert.equal(s.timeSkills[0],1);
 assert.ok(buyTimeSkill(s,1));assert.equal(timeSkillCost(s,1),6);assert.ok(Math.abs(productionExponent(s)-1.55)<1e-12);assert.ok(validateSave(s));
});

test('時空スキルとクリア記録はすべての下位リセットと再読込で維持される',()=>{
 const s=timeCheckpoint();buyTimeSkill(s,0);s.chronons=2;buyTimeSkill(s,2);
 assert.equal(transcendGain({...s,earned:1e30}),2);
 for(const reset of [inherit,leap,transcend]){
  s.earned=1e60;assert.ok(reset(s));assert.equal(s.cleared,true);assert.equal(s.timeJumps,1);assert.deepEqual(s.timeSkills,[1,0,1]);assert.equal(s.era,3);assert.ok(validateSave(s));
 }
 assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))),s);
});

test('v7の資産を変えずに移行し、既存のクリア相当セーブも記録できる',()=>{
 const old=clearCheckpoint();old.version=7;
 for(const k of ['timeJumps','chronons','timeSkills','cleared','clearAcknowledged','clearScore','clearElapsed'])delete old[k];
 const before=structuredClone(old),s=migrateSave(old);assert.deepEqual(old,before);assert.equal(s.version,8);assert.ok(validateSave(s));
 for(const k of Object.keys(old).filter(k=>k!=='version'))assert.deepEqual(s[k],old[k]);
 assert.equal(s.cleared,false);assert.ok(checkClear(s));assert.equal(s.clearAcknowledged,false);assert.ok(validateSave(s));
 assert.equal(formatNumber(1e7),'1,000万');assert.equal(formatNumber(1e7,'buddhist'),'1 倶胝');assert.equal(formatNumber(1e68,'buddhist'),'1兆 頻波羅');
 assert.equal(validateSave({...fresh(),chronons:1}),false);
});
