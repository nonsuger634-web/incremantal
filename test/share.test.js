import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,fromLog10,BUDDHIST_GOAL_EXPONENT} from '../engine.js';
import {clearShareText,clearShareUrl,clearResetSummary} from '../share.js';
function ready(){const s=fresh();s.resetCounts=[138,24,3,1];s.elapsed=2081;s.clearLog=[{type:'muryou',elapsed:1586,resetCounts:[138,24,3,0]}];return s;}
test('未達成の投稿は不可で、通常クリアは指定の文面・達成時刻・当時の回数を共有する',()=>{
 assert.equal(clearShareUrl(fresh()),null);
 const s=ready(),u=new URL(clearShareUrl(s));assert.equal(u.origin,'https://x.com');assert.equal(u.pathname,'/intent/tweet');
 const text=u.searchParams.get('text');assert.equal(text,clearShareText(s));assert.ok(text.startsWith('クリア！1無量大数点を獲得した！\n'));
 assert.match(text,/クリア時間：26分26秒/);assert.match(text,/リセット165回（継承138・飛躍24・超越3）/);assert.doesNotMatch(text,/裏クリア|時間跳躍|不可説不可説転/);
 assert.ok(text.endsWith('#超インクリメンタル\nhttps://nonsuger634-web.github.io/incremantal/'));
 assert.equal(clearShareText(s,'goal'),null);assert.equal(clearShareText(s,'lifetime'),null);
});
test('裏クリアの投稿では単位を伏せ、生涯生産の投稿では現在の累計と回数を使う',()=>{
 const s=ready();s.goalReached=true;s.lifetime=fromLog10(Number(BUDDHIST_GOAL_EXPONENT),3.5);s.clearLog.push({type:'goal',elapsed:2081,resetCounts:[176,49,7,8]});
 const goal=clearShareText(s,'goal');assert.ok(goal.startsWith('裏クリア！1？？？？？？？点を獲得した！\n'));assert.match(goal,/裏クリア時間：34分41秒/);assert.match(goal,/リセット240回/);assert.doesNotMatch(goal,/不可説不可説転/);
 s.elapsed=2200;s.resetCounts=[176,49,7,9];const life=clearShareText(s,'lifetime');assert.ok(life.startsWith('3.5？？？？？？？点を獲得した！\n'));assert.match(life,/プレイ時間：36分40秒/);assert.match(life,/リセット241回/);assert.doesNotMatch(life,/不可説不可説転/);
});
test('昔のログでは回数を捏造せず、投稿には現在の回数を代用しない',()=>{
 const s=ready();delete s.clearLog[0].resetCounts;assert.doesNotMatch(clearShareText(s),/リセット/);assert.equal(clearResetSummary(s.clearLog[0]),'クリア時点のリセット回数：未記録');
});
