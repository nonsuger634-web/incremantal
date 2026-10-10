import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,TECHS,FACILITIES,migrateSave,validateSave,leapCheckpoint,transcendCheckpoint,transcend,transcendGain,transcendThreshold,buyTranscendSkill,transcendSkillCost,transcendSkillReady,productionExponent,facilityRate,canEvolve,evolve,buy,inherit,leap,MURYOUTAISUU,formatNumber,formatPowerOfTen,BUDDHIST_GOAL_EXPONENT} from '../engine.js';
const fixture=()=>JSON.parse(readFileSync(new URL('fixtures/v6-save.json',import.meta.url),'utf8'));
const ready=()=>migrateSave(fixture());

test('超越条件が足りない場合は状態を変えず、境界で初回1ポイント',()=>{
 for(const patch of [{ascensions:2},{era:2},{earned:1e30*.999},{techs:TECHS.map(()=>false)}]){
  const s={...ready(),...patch},before=structuredClone(s);assert.equal(transcendGain(s),0);assert.equal(transcend(s),false);assert.deepEqual(s,before);
 }
 const s=ready();assert.equal(transcendGain(s),1);s.earned=1e33;assert.equal(transcendGain(s),3);
});
test('超越は継承と革新をリセットし、記録と超越資産を保持する',()=>{
 const s=ready(),history=structuredClone(s.history),lifetime=s.lifetime,elapsed=s.elapsed;
 assert.ok(transcend(s));assert.equal(s.transcendences,1);assert.equal(s.horizon,1);
 assert.equal(s.ascensions,0);assert.equal(s.cycles,0);assert.equal(s.points,0);assert.equal(s.insight,0);
 assert.deepEqual(s.skills,[0,0,0,0,0,0]);assert.deepEqual(s.innovations,[1,0,0,0,0]);
 assert.equal(s.money,10);assert.equal(s.earned,0);assert.equal(s.era,0);assert.deepEqual(s.owned.slice(0,3),[10,10,10]);assert.ok(s.owned.slice(3).every(n=>n===0));
 TECHS.forEach((t,i)=>assert.equal(s.techs[i],t.era<=3&&t.kind!=='time'));assert.deepEqual(s.history,history);assert.equal(s.lifetime,lifetime);assert.equal(s.elapsed,elapsed);assert.ok(validateSave(s));
 assert.equal(transcendThreshold(s),1e40);assert.ok(buyTranscendSkill(s,0));assert.equal(s.horizon,0);assert.equal(productionExponent(s),1.2);
 s.horizon=7;const levels=[...s.transcendSkills];s.era=3;s.earned=1e60;assert.equal(transcendGain(s),13);assert.ok(transcend(s));assert.equal(s.horizon,20);assert.deepEqual(s.transcendSkills,levels);assert.equal(transcendThreshold(s),1e50);
});
test('超越スキルと未使用ポイントは継承・飛躍後も保持し、情報技術も習得済み',()=>{
 const s=transcendCheckpoint();buyTranscendSkill(s,0);s.horizon=5;s.era=3;s.earned=1e20;
 assert.ok(inherit(s));assert.equal(s.horizon,5);assert.equal(s.transcendSkills[0],1);assert.ok(s.techs[7]);assert.ok(validateSave(s));
 s.era=3;s.earned=1e20;assert.ok(leap(s));assert.equal(s.horizon,5);assert.equal(s.transcendSkills[0],1);assert.ok(s.techs[7]);assert.ok(validateSave(s));
});
test('宇宙の基盤は生産の対数へ作用し、前提と価格増加を守る',()=>{
 const s=transcendCheckpoint();s.owned.fill(0);s.owned[0]=1;
 assert.equal(buyTranscendSkill(s,1),false);assert.equal(transcendSkillReady(s,3),false);
 assert.ok(buyTranscendSkill(s,0));const control=structuredClone(s);control.transcendSkills[0]=0;assert.ok(Math.abs(Math.log10(facilityRate(s,0))-Math.log10(facilityRate(control,0))*1.2)<1e-12);
 s.horizon=100;buyTranscendSkill(s,1);assert.equal(transcendSkillCost(s,1),4);buyTranscendSkill(s,1);buyTranscendSkill(s,2);assert.ok(transcendSkillReady(s,3));buyTranscendSkill(s,3);
 assert.ok(Math.abs(productionExponent(s)-1.65)<1e-12);assert.ok(validateSave(s));
 s.transcendSkills[1]=4;s.horizon=10000;assert.equal(buyTranscendSkill(s,1),false);
 s.owned[14]=1000;assert.ok(Number.isFinite(facilityRate(s,14)));assert.ok(facilityRate(s,14)<=1e200);
});
test('宇宙時代は超越スキルと累計・費用条件を要求し、施設を手動購入する',()=>{
 const s=transcendCheckpoint();s.era=3;s.earned=1e26;s.money=5e25;
 assert.equal(canEvolve(s),false);assert.equal(buy(s,12),false);buyTranscendSkill(s,0);
 s.money=5e25-1e12;assert.equal(canEvolve(s),false);s.money=5e25;assert.ok(evolve(s));assert.equal(s.era,4);assert.equal(s.money,0);
 assert.equal(buy(s,12),false);s.money=1e28;assert.ok(buy(s,12));assert.equal(s.owned[12],1);assert.ok(validateSave(s));
 assert.equal(MURYOUTAISUU,1e68);assert.equal(formatNumber(MURYOUTAISUU),'1無量大数');
});
test('実際のv6セーブは既存69技術と資産を保持してv9へ移行する',()=>{
 const old=fixture(),copy=structuredClone(old),s=migrateSave(old);assert.deepEqual(old,copy);assert.ok(validateSave(s));assert.equal(s.version,9);
 for(const key of ['money','earned','points','insight','ascensions','skills','innovations','cycles'])assert.deepEqual(s[key],old[key]);
 assert.deepEqual(s.owned.slice(0,12),old.owned);assert.deepEqual(s.techs.slice(0,69),old.techs);assert.deepEqual(s.history.maxOwned.slice(0,12),old.history.maxOwned);
 assert.ok(s.owned.slice(12).every(n=>n===0));assert.ok(s.techs.slice(69).every(v=>!v));assert.equal(s.transcendences,0);assert.equal(s.horizon,0);assert.deepEqual(s.transcendSkills,[0,0,0,0]);assert.deepEqual(migrateSave(s),s);
 assert.equal(migrateSave({...old,era:4}),null);assert.equal(migrateSave({...old,owned:old.owned.slice(1)}),null);assert.equal(migrateSave({...old,money:NaN}),null);
 const bad=transcendCheckpoint();bad.transcendSkills=[0,1,0,0];assert.equal(validateSave(bad),false);
 const cosmic=fresh();cosmic.era=4;assert.equal(validateSave(cosmic),false);
});
test('宇宙の基盤の取得と全リセットで情報時代・工業まで各100個で始まる',()=>{
 const s=transcendCheckpoint(),beforeMoney=s.money,beforeEarned=s.earned;assert.ok(buyTranscendSkill(s,0));
 assert.equal(s.era,3);assert.deepEqual(s.owned.slice(0,9),Array(9).fill(100));assert.ok(s.owned.slice(9).every(n=>!n));
 assert.equal(s.money,beforeMoney);assert.equal(s.earned,beforeEarned);assert.deepEqual(s.history.maxOwned.slice(0,9),Array(9).fill(100));assert.ok(validateSave(s));
 for(const reset of [inherit,leap,transcend]){
  s.earned=1e60;assert.ok(reset(s));assert.equal(s.era,3);assert.equal(s.money,10);assert.equal(s.earned,0);assert.deepEqual(s.owned.slice(0,9),Array(9).fill(100));assert.ok(s.owned.slice(9).every(n=>!n));assert.ok(validateSave(s));
 }
 assert.deepEqual(migrateSave(s),s);
 const late=transcendCheckpoint();late.era=4;late.owned[0]=250;late.owned[14]=2;late.history.maxOwned[0]=250;late.history.maxOwned[14]=2;assert.ok(buyTranscendSkill(late,0));assert.equal(late.era,4);assert.equal(late.owned[0],250);assert.equal(late.owned[14],2);
});
test('宇宙施設に超越回数の解放条件を付けず、価格だけで購入を決める',()=>{
 const s=transcendCheckpoint();buyTranscendSkill(s,0);s.era=4;s.money=1e63;
 assert.ok(buy(s,13));assert.ok(buy(s,14));assert.equal(s.transcendences,1);assert.ok(validateSave(s));
});
test('選択した華厳経の単位で表示し、指数を取り違えない',()=>{
 for(const [n,label] of [[1e68,'1無量大数'],[1e72,'1京 頻波羅'],[1e112,'1 矜羯羅'],[1e136,'1秭 矜羯羅'],[1e200,'1垓 無量大数 矜羯羅'],[1e224,'1 阿伽羅'],[1e272,'1極 阿伽羅'],[1e308,'1京 無量大数 阿伽羅']])assert.equal(formatNumber(n,n>1e68?'buddhist':'japanese'),label);
 assert.match(formatNumber(1e112*.999999,'buddhist'),/恒河沙 頻波羅$/);assert.equal(formatNumber(Number.MAX_VALUE,'buddhist'),'1.79京 無量大数 阿伽羅');
 assert.equal(formatPowerOfTen(112n),'1矜羯羅');assert.equal(formatPowerOfTen(224n),'1阿伽羅');assert.equal(formatPowerOfTen(448n),'1最勝');
 assert.equal(BUDDHIST_GOAL_EXPONENT,37218383881977644441306597687849648128n);assert.equal(formatPowerOfTen(BUDDHIST_GOAL_EXPONENT),'1不可説不可説転');
});
