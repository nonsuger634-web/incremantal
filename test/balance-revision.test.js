import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,timeCheckpoint,TIME_SKILLS,SKILLS,INNOVATIONS,TRANSCEND_SKILLS,buySkill,skillCost,inheritance,inherit,migrateSave,validateSave,production,log10,fromLog10,BUDDHIST_GOAL_EXPONENT,HORIZON_FINAL_MULTIPLIER,productionExponent} from '../engine.js';
function full(){const s=timeCheckpoint();s.timeSkills=TIME_SKILLS.map(n=>n.max);s.skills=SKILLS.map(n=>n.max);s.innovations=INNOVATIONS.map(n=>n.max);s.transcendSkills=TRANSCEND_SKILLS.map(n=>n.max);s.era=4;s.history.maxEra=4;s.owned.fill(1000);s.history.maxOwned.fill(1000);s.techs.fill(true);s.fixedTimeResearch.fill(true);s.facilityArchive=true;return s;}
test('生産の知恵Lv20へ周回累計報酬だけで到達できる',()=>{
 const s=fresh();s.era=2;s.techs[4]=true;s.earned=1e92;
 let cost=0;for(let i=0;i<20;i++){const p={...s,skills:[i,0,0,0,0,0]};cost+=skillCost(p,0);}
 assert.ok(inheritance(s)>=cost);assert.ok(inherit(s));
 for(let i=0;i<20;i++)assert.ok(buySkill(s,0));assert.equal(s.skills[0],20);assert.equal(buySkill(s,0),false);
});
test('旧124レベルの時間再帰を効果を下げずに36レベルへ移行する',()=>{
 const s=full();delete s.balanceRevision;s.timeSkills[3]=124;const old=structuredClone(s);
 const loaded=migrateSave(s);assert.ok(loaded);assert.equal(loaded.timeSkills[3],36);assert.ok(2.5**36>=1.3**124);assert.deepEqual(s,old);assert.ok(validateSave(loaded));
 assert.equal(migrateSave({...s,timeSkills:s.timeSkills.map((n,i)=>i===3?125:n)}),null);
});
test('最終生産は施設の計算に従い、最終スキルの表示倍率と一致する',()=>{
 const s=full(),goal=Number(BUDDHIST_GOAL_EXPONENT);const rate=production(s);
 assert.equal(rate.scale,1/300);assert.equal(log10(rate),goal);
 s.timeSkills[7]=7;const before=log10(production(s));assert.ok(Math.abs(before*HORIZON_FINAL_MULTIPLIER/goal-1)<1e-14);
 const prior=productionExponent(s);s.timeSkills[7]=8;assert.ok(Math.abs(productionExponent(s)/prior/HORIZON_FINAL_MULTIPLIER-1)<1e-14);
 s.owned[14]=500;assert.ok(log10(production(s))<goal);
});
