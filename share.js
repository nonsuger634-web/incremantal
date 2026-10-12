import {formatDuration,formatNumber} from './engine.js';
const GAME_URL='https://nonsuger634-web.github.io/incremantal/';
const MASKED_UNIT='？？？？？？？';
function shareDuration(seconds){return formatDuration(seconds).replace(/^0日/,'').replace(/^0時間/,'');}
function resetSummary(counts,current=false){
 const names=['継承','飛躍','超越','時間跳躍'];
 const details=counts.map((n,i)=>n?`${names[i]}${n}`:null).filter(Boolean).join('・');
 return `${current?'現在の':''}リセット${counts.reduce((a,b)=>a+b,0)}回${details?`（${details}）`:''}`;
}
export function clearShareText(s,kind='muryou'){
 const record=s.clearLog.find(r=>r.type===kind),goal=s.clearLog.some(r=>r.type==='goal');
 if(kind==='lifetime'?!s.goalReached||!goal:!record)return null;
 let title,elapsed,counts,current=false;
 if(kind==='lifetime'){
  title=`${formatNumber(s.lifetime,'buddhist').replaceAll('不可説不可説転',MASKED_UNIT).replaceAll(' '+MASKED_UNIT,MASKED_UNIT)}点を獲得した！`;
  elapsed=`プレイ時間：${shareDuration(s.elapsed)}`;counts=s.resetCounts;
 }else{
  title=kind==='goal'?`裏クリア！1${MASKED_UNIT}点を獲得した！`:'クリア！1無量大数点を獲得した！';
  elapsed=`${kind==='goal'?'裏クリア':'クリア'}時間：${shareDuration(record.elapsed)}`;
  counts=record.resetCounts??s.resetCounts;current=record.resetCounts===undefined;
 }
 return [title,elapsed,resetSummary(counts,current),'#超インクリメンタル',GAME_URL].join('\n');
}
export function clearShareUrl(s,kind='muryou'){
 const text=clearShareText(s,kind);if(!text)return null;
 return `https://x.com/intent/tweet?${new URLSearchParams({text})}`;
}
