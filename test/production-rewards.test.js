import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,inheritance,leapGain,transcendGain,nextResetReward,resetReward,fromLog10,multiply,compare,permanentRecordQuote,buyTimeSkill,timeCheckpoint,validateSave} from '../engine.js';
test('継承・飛躍・超越は同じ周回累計なら回数や所持残高で報酬を変えない',()=>{
 const s=fresh();s.era=3;s.leapUnlocked=true;s.techs[4]=s.techs[5]=s.techs[7]=true;s.earned=1e150;
 const functions=[inheritance,leapGain,transcendGain];s.ascensions=3;const expected=functions.map(fn=>fn(s));
 for(const count of [0,1,3,7,10]){s.cycles=count;s.ascensions=count;s.transcendences=count;s.timeJumps=1;s.money=count?0:1e200;s.lifetime=fromLog10(1e30);assert.deepEqual(functions.map(fn=>fn(s)),expected);}
 s.earned=1e153;assert.ok(functions.every((fn,i)=>fn(s)>expected[i]));
});
test('初回に必要な基盤は周回累計からの1ポイントで買え、積算しない報酬は0',()=>{
 for(const kind of ['inheritance','leap','transcend','time'])assert.equal(resetReward(0,kind),0);
 const s=fresh();s.era=3;s.ascensions=3;s.leapUnlocked=true;s.techs[4]=s.techs[5]=s.techs[7]=true;
 for(const [fn,threshold] of [[inheritance,1e11],[leapGain,1e27],[transcendGain,1e30]]){s.earned=multiply(threshold,.999);assert.equal(fn(s),0);s.earned=threshold;assert.ok(fn(s)>=1);}
 s.ascensions=0;s.earned=1e18;assert.equal(leapGain(s),1);s.ascensions=3;s.earned=1e30;assert.equal(transcendGain(s),1);
});
test('各報酬の次ポイント表示は圧縮の前後と記憶倍率を含めて境界を示す',()=>{
 const s=timeCheckpoint();s.timeSkills[0]=1;s.timeSkills[2]=3;s.ascensions=3;s.era=3;s.techs[4]=s.techs[5]=s.techs[7]=true;
 for(const earned of [1e30,1e150,fromLog10(220),fromLog10(1e30)]){s.earned=earned;for(const [kind,fn] of [['inheritance',inheritance],['leap',leapGain],['transcend',transcendGain]]){
  const q=nextResetReward(s,kind);if(!q)continue;const probe=structuredClone(s);probe.earned=fromLog10(q.target.log10??Math.log10(q.target));assert.equal(fn(probe),q.nextGain);assert.ok(compare(q.target,earned)>0);
 }}
});
test('永久記録も同じ文明力の報酬式を使い既存資産は削らない',()=>{const s=timeCheckpoint();s.chronons=20;buyTimeSkill(s,0);buyTimeSkill(s,8);buyTimeSkill(s,10);s.layerProduction=[1e100,1e100,1e100];s.lifetime=1e100;const q=permanentRecordQuote(s);assert.deepEqual(q.totals,['inheritance','leap','transcend'].map(kind=>resetReward(s.lifetime,kind)));s.insight=9999;s.earned=1e80;assert.equal(permanentRecordQuote(s).additions[1],0);assert.ok(validateSave(s));});
