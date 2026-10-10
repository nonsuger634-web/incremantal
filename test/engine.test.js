import {test} from 'node:test';import assert from 'node:assert/strict';
import {fresh,FACILITIES,TECHS,buy,price,production,advance,buyTech,evolve,inherit,inheritance,buySkill,validateSave,formatNumber,gather,manualGain,skillCost,leapGain,leap,leapThreshold,migrateSave,buyInnovation,innovationCost,innovationReady,firstLeapCheckpoint,techUnlocked,skillUnlocked} from '../engine.js';
const techIndex=(kind,facility,required)=>TECHS.findIndex(t=>t.kind===kind&&t.facility===facility&&t.required===required);
test('購入しなければ自動生産せず、価格は整数、施設の自動購入なし',()=>{
 const s=fresh();advance(s,60);assert.equal(s.money,10);assert.ok(buy(s,0));advance(s,60);assert.equal(s.money,60);assert.equal(s.earned,60);assert.equal(price(s,0),12);
 s.money=11.99;assert.equal(buy(s,0),false);s.money=12;assert.ok(buy(s,0));assert.equal(s.money,0);assert.equal(buy(s,3),false);
 const owned=[...s.owned];advance(s,604800);assert.deepEqual(s.owned,owned);
});
test('施設数の節目は無料倍率でなく個別技術の解放と購入',()=>{
 const s=fresh();s.money=1e6;s.owned[0]=9;const id=techIndex('facility',0,10);assert.equal(techUnlocked(s,id),false);
 const before=production(s);buy(s,0);assert.equal(production(s)/before,10/9);assert.ok(techUnlocked(s,id));const base=production(s);assert.ok(buyTech(s,id));assert.equal(production(s),base*2);assert.equal(buyTech(s,id),false);
 s.owned[0]=25;const next=techIndex('facility',0,25);assert.ok(buyTech(s,next));assert.equal(production(s),100);
});
test('時代技術は関連する施設数を要求、安い施設では迂回できない',()=>{
 const s=fresh();s.money=1e6;s.earned=1e6;s.owned[0]=100;assert.equal(buyTech(s,0),false);assert.equal(evolve(s),false);
 s.owned[1]=10;assert.ok(buyTech(s,0));assert.ok(evolve(s));assert.equal(s.owned[0],100);assert.equal(s.history.maxEra,1);
});
test('クリック技術は操作実績で解放、固定量だけを強化',()=>{
 const s=fresh();const id=TECHS.findIndex(t=>t.kind==='click'&&t.era===0);for(let i=0;i<24;i++)gather(s);assert.equal(techUnlocked(s,id),false);gather(s);assert.ok(techUnlocked(s,id));assert.equal(s.history.clicks,25);assert.equal(s.history.manual,25);
 s.money=100;assert.ok(buyTech(s,id));assert.equal(manualGain(s),2);
 s.owned[2]=100;const before=manualGain(s);s.techs[id]=false;assert.equal(manualGain(s),before);
});
test('継承スキルは記録・回数・前提で解放し、ポイントを消費',()=>{
 const s=fresh();s.points=100;assert.equal(buySkill(s,0),false);s.cycles=1;s.history.maxEra=2;assert.ok(buySkill(s,0));assert.equal(s.points,99);assert.equal(skillCost(s,0),4);
 assert.equal(skillUnlocked(s,2),false);s.cycles=2;assert.ok(skillUnlocked(s,2));assert.equal(skillUnlocked(s,3),false);s.history.clicks=25;assert.ok(buySkill(s,3));
 buySkill(s,0);s.history.bestRun=1e12;s.history.maxOwned[3]=10;assert.ok(skillUnlocked(s,4));assert.ok(buySkill(s,5));
});
test('連携は伝承と両施設数で解放し、倍率は所持数100個で飽和',()=>{
 const s=fresh();s.era=1;s.money=1e12;s.owned[0]=10;s.owned[3]=10;const id=TECHS.findIndex(t=>t.kind==='synergy'&&t.source===0);assert.equal(techUnlocked(s,id),false);s.skills[5]=1;assert.ok(buyTech(s,id));
 const base=FACILITIES[3].rate*10;assert.ok(Math.abs(production(s)-(base*1.1+10*1.05))<1e-9);
 s.owned[0]=1000;s.owned[3]=1000;assert.equal(production(s),FACILITIES[3].rate*1000*2+1000*1.5);
});
test('履歴は通常継承・飛躍で保持、研究は周回でリセット',()=>{
 const s=fresh();s.money=1e9;buy(s,0);gather(s);s.era=2;s.techs[4]=true;s.earned=1e12;s.history.bestRun=1e12;
 const history=structuredClone(s.history);assert.ok(inherit(s));assert.deepEqual(s.history,history);assert.ok(s.techs.every(t=>!t));
 s.leapUnlocked=true;s.era=2;s.techs[5]=true;s.earned=1e18;assert.ok(leap(s));assert.deepEqual(s.history,history);
});
test('飛躍後は工業以前の全種類の技術を習得し、情報の技術は残す',()=>{
 const s=firstLeapCheckpoint();assert.ok(validateSave(s));TECHS.forEach((t,i)=>assert.equal(s.techs[i],t.era<=2));
 s.era=2;s.earned=1e11;inherit(s);TECHS.forEach((t,i)=>assert.equal(s.techs[i],t.era<=2));
 s.era=2;s.earned=1e24;assert.ok(leap(s));TECHS.forEach((t,i)=>assert.equal(s.techs[i],t.era<=2));
});
test('テストスキップは初回飛躍後の状態、施設なし・革新3',()=>{
 const s=firstLeapCheckpoint();assert.equal(s.money,10);assert.equal(s.era,0);assert.equal(s.insight,3);assert.equal(s.ascensions,1);assert.equal(leapThreshold(s),1e21);assert.ok(s.owned.every(n=>!n));assert.ok(s.innovations.every(n=>!n));
});
test('飛躍と情報施設の条件・価格は守られる',()=>{
 const s=fresh();s.era=2;s.earned=1e18;s.money=1e18;s.techs[5]=true;assert.equal(leapGain(s),0);assert.equal(evolve(s),false);s.leapUnlocked=true;assert.ok(leap(s));
 s.era=2;s.money=1e14;s.earned=1e14;assert.ok(evolve(s));assert.equal(buy(s,9),false);s.money=1e17;let n=0;while(buy(s,9))n++;assert.ok(n<=5);assert.equal(buy(s,10),false);
});
test('革新ポイント・スキルの前提と保持',()=>{
 const s=firstLeapCheckpoint();s.insight=100;assert.equal(buyInnovation(s,1),false);buyInnovation(s,0);buyInnovation(s,1);assert.equal(innovationCost(s,1),6);assert.equal(innovationReady(s,4),false);buyInnovation(s,1);buyInnovation(s,2);assert.ok(innovationReady(s,4));
 const nodes=[...s.innovations],points=s.insight;s.era=2;s.earned=1e11;inherit(s);assert.deepEqual(s.innovations,nodes);assert.equal(s.insight,points);
});
test('継承ポイントの桁数成長と日本式の大数表記',()=>{
 const s=fresh();s.era=2;s.techs[4]=true;s.earned=1e15;assert.equal(inheritance(s),25);
 const units=['万','億','兆','京','垓','秭','穣','溝','澗','正','載','極','恒河沙','阿僧祇','那由他','不可思議','無量大数'];units.forEach((u,i)=>assert.equal(formatNumber(10**((i+1)*4)),`1${u}`));assert.equal(formatNumber(11.99),'11');
});
test('v5移行は所持施設の既存倍率を個別技術に変換し、元データを保護',()=>{
 const old={...fresh(),version:5,skills:[2,1,1],techs:Array(8).fill(false)};delete old.history;old.owned[0]=100;const copy=structuredClone(old);const s=migrateSave(old);assert.ok(validateSave(s));assert.deepEqual(old,copy);assert.equal(s.skills.length,6);
 TECHS.forEach((t,i)=>{if(t.kind==='facility'&&t.facility===0)assert.ok(s.techs[i]);});assert.equal(s.history.maxOwned[0],100);assert.ok(migrateSave(s));
});
test('旧削除スキルの返還と、v4革新の移行',()=>{
 const old={...fresh(),version:4,techs:Array(8).fill(false),skills:[2,1,1,2,1],innovations:[1,0,0,1,1,0],points:10,insight:5,ascensions:1,leapUnlocked:true};delete old.history;const s=migrateSave(old);assert.ok(validateSave(s));assert.equal(s.points,23);assert.equal(s.insight,8);assert.deepEqual(s.innovations,[1,0,0,1,0]);
});
test('破損記録・セーブ・不正な革新前提は拒否',()=>{
 assert.equal(validateSave({...fresh(),history:{}}),false);assert.equal(migrateSave({...fresh(),money:NaN}),null);assert.equal(validateSave({...fresh(),innovations:[0,1,0,0,0]}),false);
});

test('飛躍は3桁ずつ厳しくなり、条件達成で3点、10倍で4点を得る',()=>{
 const s=fresh();s.leapUnlocked=true;s.era=2;s.techs[5]=true;
 for(const [ascensions,threshold] of [[0,1e18],[1,1e21],[2,1e24],[3,1e27]]){
  s.ascensions=ascensions;assert.equal(leapThreshold(s),threshold);
  s.earned=threshold*.999;assert.equal(leapGain(s),0);
  s.earned=threshold;assert.equal(leapGain(s),3);
  s.earned=threshold*10;assert.equal(leapGain(s),4);
  s.earned=threshold*100;assert.equal(leapGain(s),5);
 }
 s.ascensions=100;assert.ok(Number.isFinite(leapThreshold(s)));
});
test('初回報酬は基盤に加えて量産か情報経済を選べるが両方は買えない',()=>{
 for(const branch of [1,3]){const s=firstLeapCheckpoint();assert.ok(buyInnovation(s,0));assert.equal(s.insight,2);assert.ok(buyInnovation(s,branch));assert.equal(s.insight,0);assert.equal(buyInnovation(s,branch===1?3:1),false);}
 const s=firstLeapCheckpoint();buyInnovation(s,0);assert.equal(buyInnovation(s,2),false);
});
test('v6既存セーブの資産は変えずに新しい飛躍条件を適用する',()=>{
 const old=firstLeapCheckpoint();old.insight=0;old.innovations[0]=1;
 const copy=structuredClone(old),s=migrateSave(old);assert.deepEqual(s,copy);assert.deepEqual(old,copy);assert.equal(leapThreshold(s),1e21);
 s.era=2;s.earned=1e21;assert.equal(leapGain(s),3);assert.ok(leap(s));assert.equal(s.insight,3);assert.equal(s.innovations[0],1);
});
