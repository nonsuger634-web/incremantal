import {formatDuration,formatNumber} from './engine.js';
const GAME_URL='https://nonsuger634-web.github.io/incremantal/';
const MASKED_UNIT='？？？？？？？';
function shareDuration(seconds){return formatDuration(seconds).replace(/^0日/,'').replace(/^0時間/,'');}
function resetSummary(counts,prefix=''){
 const names=['継承','飛躍','超越','時間跳躍'];
 const details=counts.map((n,i)=>n?`${names[i]}${n}`:null).filter(Boolean).join('・');
 return `${prefix}リセット${counts.reduce((a,b)=>a+b,0)}回${details?`（${details}）`:''}`;
}
export function clearResetSummary(record){
 const label=record.type==='goal'?'裏クリア時点の':'クリア時点の';
 return record.resetCounts?resetSummary(record.resetCounts,label):`${label}リセット回数：未記録`;
}
export function clearShareText(s,kind='muryou'){
 const record=s.clearLog.find(r=>r.type===kind),goal=s.clearLog.some(r=>r.type==='goal');
 if(kind==='lifetime'?!s.goalReached||!goal:!record)return null;
 let title,elapsed,resets;
 if(kind==='lifetime'){
  title=`${formatNumber(s.lifetime,'buddhist').replaceAll('不可説不可説転',MASKED_UNIT).replaceAll(' '+MASKED_UNIT,MASKED_UNIT)}点を獲得した！`;
  elapsed=`プレイ時間：${shareDuration(s.elapsed)}`;resets=resetSummary(s.resetCounts,'現在の');
 }else{
  title=kind==='goal'?`裏クリア！1${MASKED_UNIT}点を獲得した！`:'クリア！1無量大数点を獲得した！';
  elapsed=`${kind==='goal'?'裏クリア':'クリア'}時間：${shareDuration(record.elapsed)}`;
  resets=record.resetCounts?clearResetSummary(record):null;
 }
 return [title,elapsed,resets,'#超インクリメンタル',GAME_URL].filter(Boolean).join('\n');
}
export function clearShareUrl(s,kind='muryou'){
 const text=clearShareText(s,kind);if(!text)return null;
 return `https://x.com/intent/tweet?${new URLSearchParams({text})}`;
}
