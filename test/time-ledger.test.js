import test from 'node:test';
import assert from 'node:assert/strict';
import {clearCheckpoint,timeCheckpoint,timeThreshold,timeGain,timeTravel,timeRewardBreakdown,buyTimeSkill,fundedTimeAssets,migrateSave,validateSave,inherit,leap,transcend,fresh,refreshLeap} from '../engine.js';

test('時間跳躍は使用済みも含めた受取額との差分だけを付与する',()=>{
 const s=clearCheckpoint();assert.ok(timeTravel(s));assert.equal(s.timeAwards,1);assert.ok(buyTimeSkill(s,0));
 s.earned=timeThreshold(s);const before=structuredClone(s);
 assert.equal(timeGain(s),0);assert.equal(timeTravel(s),false);assert.deepEqual(s,before);
 s.lifetime=1e100;const q=timeRewardBreakdown(s);assert.ok(q.unclaimed>0);assert.equal(q.credited,1);assert.equal(q.total,q.reward-1);
 assert.ok(timeTravel(s));assert.equal(s.timeAwards,q.reward);assert.equal(s.chronons,q.reward-1);
 s.earned=timeThreshold(s);assert.equal(timeGain(s),0);assert.equal(timeTravel(s),false);
 for(const reset of [inherit,leap,transcend]){const p=structuredClone(s);p.earned=1e100;assert.ok(reset(p));assert.equal(p.timeAwards,s.timeAwards);}
 assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))),s);
});

test('旧セーブの時間ポイントは未使用額と全スキル購入費を受取済みとして移行する',()=>{
 const old=timeCheckpoint();old.chronons=20;buyTimeSkill(old,0);buyTimeSkill(old,8);delete old.timeAwards;
 const copy=structuredClone(old),s=migrateSave(old);assert.ok(s);assert.deepEqual(old,copy);assert.equal(s.timeAwards,fundedTimeAssets(s));
 s.earned=timeThreshold(s);assert.equal(timeGain(s),0);
 assert.equal(validateSave({...s,timeAwards:-1}),false);assert.equal(validateSave({...s,timeAwards:1.5}),false);
});

test('飛躍は継承3回と購入スキル合計8レベルの両条件で解放する',()=>{
 for(const [cycles,level,expected] of [[2,8,false],[3,7,false],[3,8,true]]){const s=fresh();s.cycles=cycles;s.skills[0]=level;refreshLeap(s);assert.equal(s.leapUnlocked,expected);}
});
