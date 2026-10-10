import test from 'node:test';
import assert from 'node:assert/strict';
import {timeCheckpoint,buyTimeSkill,buyTranscendSkill,timeThreshold,timeTravel,permanentRecordQuote,syncPermanentRecord,fundedLowerAssets,validateSave,migrateSave,inherit,leap,transcend,TECHS,TIME_RESEARCH_TECHS,buyTech,buy,formatNumber,fromLog10,BUDDHIST_GOAL_EXPONENT,timeResearchPower} from '../engine.js';
function setup(record=true){const s=timeCheckpoint();s.chronons=1000;buyTimeSkill(s,0);buyTimeSkill(s,8);if(record)buyTimeSkill(s,10);return s;}

test('永久記録は下位スキル・回数・ポイントを保持し通算文明力の未受取分だけ補充する',()=>{
 const s=setup();s.skills=[3,2,1,1,1,0];s.innovations=[1,2,1,1,1];s.transcendSkills=[1,2,1,1];s.cycles=12;s.ascensions=4;s.transcendences=2;
 s.points=17;s.insight=19;s.horizon=23;s.lifetime=1e100;s.earned=timeThreshold(s);
 const before=structuredClone(s),quote=permanentRecordQuote(s);assert.ok(quote.additions[0]>0);
 assert.ok(timeTravel(s));for(const key of ['skills','innovations','transcendSkills'])assert.deepEqual(s[key],before[key]);
 for(const key of ['cycles','ascensions','transcendences'])assert.equal(s[key],before[key]);
 for(const [i,key] of ['points','insight','horizon'].entries())assert.equal(s[key],before[key]+quote.additions[i]);
 assert.ok(validateSave(s));assert.deepEqual(permanentRecordQuote(s).additions,[0,0,0]);
 const funded=[s.points,s.insight,s.horizon];s.earned=timeThreshold(s);assert.ok(timeTravel(s));assert.deepEqual([s.points,s.insight,s.horizon],funded);assert.ok(validateSave(s));
});

test('記憶の定着は通算文明力から超越ポイントを再計算し購入済み分を返還しない',()=>{
 const s=setup();s.lifetime=1e100;syncPermanentRecord(s);const total=permanentRecordQuote(s).totals[2],before=s.horizon;
 assert.ok(buyTimeSkill(s,2));assert.equal(s.horizon,before+total);assert.equal(s.memoryAwards[2],total*2);
 assert.ok(buyTranscendSkill(s,1));const spent=s.horizon;syncPermanentRecord(s);assert.equal(s.horizon,spent);
 s.lifetime=1e110;const quote=permanentRecordQuote(s);assert.ok(quote.additions[2]>0);syncPermanentRecord(s);assert.equal(s.horizon,spent+quote.additions[2]);assert.ok(validateSave(s));
});

test('通常の超越報酬も受取済みに計上し同じ通算記録から二重に補充しない',()=>{
 const s=setup();s.earned=1e100;s.lifetime=1e100;syncPermanentRecord(s);const credited=s.memoryAwards[2];
 assert.ok(transcend(s));assert.ok(s.memoryAwards[2]>credited);const horizon=s.horizon;syncPermanentRecord(s);assert.equal(s.horizon,horizon);assert.ok(validateSave(s));
});

test('旧永久記録のセーブを既存資産とスキル投資額を含めて移行する',()=>{
 const old=setup();old.skills[0]=3;old.points=7;delete old.memoryAwards;delete old.facilityArchive;delete old.fixedTimeResearch;
 const copy=structuredClone(old),s=migrateSave(old);assert.ok(s);assert.deepEqual(old,copy);assert.deepEqual(s.memoryAwards,fundedLowerAssets(s));
 syncPermanentRecord(s);const points=s.points;const loaded=migrateSave(JSON.parse(JSON.stringify(s)));syncPermanentRecord(loaded);assert.equal(loaded.points,points);
 assert.equal(migrateSave({...s,memoryAwards:[-1,0,0]}),null);assert.equal(migrateSave({...s,fixedTimeResearch:[true,false,false]}),null);
});

test('全施設1000個の達成前は通常開始し、達成後にLv2を購入して全リセットを全施設1000個で開始する',()=>{
 const s=setup(false);s.era=4;s.owned.fill(1000);s.history.maxOwned.fill(1000);s.owned[14]=999;s.history.maxOwned[14]=999;s.money=1e300;
 assert.equal(s.facilityArchive,false);assert.equal(buyTimeSkill(s,8),false);assert.ok(validateSave(s));assert.ok(buy(s,14));assert.equal(s.facilityArchive,false);assert.equal(s.timeSkills[8],1);assert.ok(buyTimeSkill(s,8));assert.equal(s.timeSkills[8],2);assert.equal(s.facilityArchive,true);
 for(const reset of [inherit,leap,transcend,timeTravel]){const p=structuredClone(s);p.earned=1e300;assert.ok(reset(p));assert.equal(p.era,4);assert.ok(p.owned.every(n=>n===1000));assert.ok(validateSave(p));assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(p))),p);}
 const old=structuredClone(s);old.timeSkills[8]=1;const migrated=migrateSave(old);assert.equal(migrated.facilityArchive,true);assert.equal(migrated.timeSkills[8],2);assert.equal(old.timeSkills[8],1);
});

test('時空研究は通常技術の永久保存から除外し研究済みだけをLv.5・9・13で固定化する',()=>{
 const s=setup(false);assert.ok(s.techs.slice(0,87).every(Boolean));assert.ok(s.techs.slice(87).every(v=>!v));buyTimeSkill(s,2);
 buyTimeSkill(s,5);s.money=1e300;assert.ok(buyTech(s,87));s.earned=timeThreshold(s);assert.ok(timeTravel(s));assert.equal(s.techs[87],false);
 s.money=1e300;assert.ok(buyTech(s,87));while(s.timeSkills[5]<5)buyTimeSkill(s,5);assert.deepEqual(s.fixedTimeResearch,[true,false,false]);
 assert.equal(s.techs[88],false);assert.ok(buyTech(s,88));while(s.timeSkills[5]<9)buyTimeSkill(s,5);assert.deepEqual(s.fixedTimeResearch,[true,true,false]);
 assert.ok(buyTech(s,89));while(s.timeSkills[5]<13)assert.ok(buyTimeSkill(s,5));assert.deepEqual(s.fixedTimeResearch,[true,true,true]);assert.equal(timeResearchPower(s),2**13);
 for(const reset of [inherit,leap,transcend,timeTravel]){const p=structuredClone(s);p.earned=1e300;assert.ok(reset(p));assert.ok(p.techs.slice(87).every(Boolean));assert.ok(validateSave(p));}
});

test('巨大値は恒河沙 多婆羅のように単位を重ね、指数表示せず最終境界を選ぶ',()=>{
 assert.equal(formatNumber(fromLog10(3636),'buddhist'),'1恒河沙 多婆羅');
 assert.equal(formatNumber(1e200,'buddhist'),'1垓 無量大数 矜羯羅');
 for(const e of [1000,7220,1e36,Number(BUDDHIST_GOAL_EXPONENT)])assert.doesNotMatch(formatNumber(fromLog10(e),'buddhist'),/10\^|e[+-]\d/);
 assert.equal(formatNumber(fromLog10(Number(BUDDHIST_GOAL_EXPONENT)),'buddhist'),'1 不可説不可説転');
});

test('長い単位の積も係数から全て表示し省略記号を使わない',()=>{for(const exponent of [1e12,1e25,1e36]){const text=formatNumber(fromLog10(exponent),'buddhist');assert.match(text,/^[0-9]/);assert.doesNotMatch(text,/…|10\^|e[+-]\d/);assert.ok(text.includes(' '));}});
