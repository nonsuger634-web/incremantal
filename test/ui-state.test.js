import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,leapCheckpoint,timeCheckpoint} from '../engine.js';
import {discoveredFeatures,visibleGuide,resetItems} from '../ui-state.js';
test('未発見の段階をタブ・遊び方から隠し、継承後は発見した段階を維持する',()=>{
 const s=fresh();assert.equal(discoveredFeatures(s).legacy,false);
 assert.doesNotMatch(visibleGuide(s).join(''),/継承|飛躍|超越|時間跳躍|不可説不可説転/);
 s.era=2;s.history.maxEra=2;assert.equal(discoveredFeatures(s).legacy,true);
 assert.doesNotMatch(visibleGuide(s).join(''),/飛躍|超越|時間跳躍/);
 s.era=0;assert.equal(discoveredFeatures(s).legacy,true);
 const leap=discoveredFeatures(leapCheckpoint());assert.equal(leap.innovation,true);assert.equal(leap.transcendence,false);assert.equal(leap.chronology,false);
 const time=timeCheckpoint();assert.equal(discoveredFeatures(time).chronology,true);assert.doesNotMatch(visibleGuide(time).join(''),/不可説不可説転/);
});

test('リセット説明は消える資産だけを示し、永久記録後は下位資産を列挙しない',()=>{
 const s=timeCheckpoint();assert.match(resetItems(s,'time'),/超越/);
 s.timeSkills[8]=1;s.timeSkills[9]=1;s.timeSkills[10]=1;
 assert.equal(resetItems(s,'time'),'文明力・周回累計・施設・未固定の時空研究');
 assert.doesNotMatch(resetItems(s,'transcend'),/継承\/革新/);s.timeSkills[10]=0;assert.match(resetItems(s,'transcend'),/継承\/革新/);assert.doesNotMatch(resetItems(s,'inherit'),/継承|超越|保持|残る/);
});
