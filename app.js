import {discoveredFeatures,visibleGuide,resetItems} from './ui-state.js';
import {ERAS,FACILITIES,TECHS,SKILLS,fresh,advance,production,manualGain,gather,facilityRate,price,buy,techCost,techRequirement,canTech,buyTech,eraRequirement,canEvolve,evolve,inheritance,inherit,skillCost,buySkill,formatNumber,validateSave,migrateSave,leapGain,leap,leapThreshold,INNOVATIONS,innovationCost,innovationReady,buyInnovation,leapCheckpoint,techUnlocked,techCondition,techEffect,skillUnlocked,skillCondition,effectiveSkillLevel,purchaseQuote,TRANSCEND_SKILLS,transcendSkillCost,transcendSkillReady,buyTranscendSkill,transcendGain,transcendThreshold,transcend,transcendCheckpoint,productionExponent,MURYOUTAISUU,TIME_SKILLS,timeSkillCost,timeSkillReady,buyTimeSkill,timeGain,timeRewardBreakdown,timeTravel,timeThreshold,checkClear,discoverGoalUnit,formatDuration,clearCheckpoint,timeCheckpoint,nextResetReward,permanentRecordQuote,timeResearchPower,resetProduction,lowerRewardBreakdown,add,subtract,multiply,compare,log10,fromLog10,maxValue,BUDDHIST_GOAL_EXPONENT} from './engine.js';
const KEY='fukasetsu-civilization-v9';
const BACKUP_KEY='fukasetsu-test-checkpoint-backup-v5';
const LEGACY_KEY='fukasetsu-civilization-v2';
const $=id=>document.getElementById(id);
const resetIds=['inherit-confirm','leap-confirm','transcend-confirm','time-confirm'];
for(const id of resetIds)$('reset-vignette').append($(id));
function showResetConfirmation(id){resetIds.forEach(x=>$(x).hidden=x!==id);$('reset-vignette').setAttribute('aria-labelledby',$(id).querySelector('h2').id||'reset-title');$('reset-vignette').showModal();$(`${id}-yes`).focus();}
$('reset-vignette').addEventListener('close',()=>resetIds.forEach(id=>$(id).hidden=true));
$('reset-vignette').addEventListener('click',()=>{if(resetIds.every(id=>$(id).hidden))$('reset-vignette').close();});
let inspectorOpener=null;
let selectedSkill=0,selectedInnovation=0,selectedTranscend=0,selectedTime=0,skipTarget='1';
let state=fresh(),qty=1,storageOK=true,testSpeed=1,workspace='technologies';
function goalKnown(){return !!(state.goalUnitKnown||state.goalReached);}
function goalLabel(){return goalKnown()?'不可説不可説転':'？？？？？？？';}
function displayNumber(n){const text=formatNumber(n,state.cleared?'buddhist':'japanese');return goalKnown()?text:text.replaceAll('不可説不可説転','？？？？？？？');}
const shortEffects={skills:['生産 ×2 / Lv','施設価格 ×0.85 / Lv','狩猟施設各5個 / Lvで開始','手動獲得 ×2・生産の取り分 +1% / Lv','農耕以降の生産 ×1.5 / Lv','施設の連携技術を解放'],innovations:['生産 ×50 · 継承Lv +2','生産 ×5 / Lv','生産指数 +0.025 / Lv','情報施設価格 ×0.8 / Lv','生産指数 +0.05'],transcend:['指数 +0.2 · 工業施設各100で開始','生産指数 +0.15 / Lv','宇宙施設価格 ×0.65 / Lv','生産指数 +0.15'],time:['生産指数 +0.25','生産指数 +0.1 / Lv','超越報酬 ×2 / Lv','生産指数 ×2.5 / Lv','施設の指数 ×最大4 / Lv','時空研究を解放・固定化','生産指数 ×4 / Lv','指数 ×2 / Lv · 最終Lv ×3.459、量 ×0.0033','全技術習得 → 全施設1000で開始','宇宙時代で開始','下位スキル・ポイント・回数を保存']};
function pointNumber(n){return n.toLocaleString('ja-JP',{maximumFractionDigits:0,useGrouping:true});}
function scoreNumber(n){return `${displayNumber(n)}点`;}
function displayExponent(n){return n<1e6?n.toFixed(3):formatNumber(n,'japanese');}
function logProgress(value,target){return Math.max(0,Math.min(100,Math.max(0,log10(maxValue(1,value)))/Math.max(1,log10(target))*100));}
function finalProgress(value){if(typeof value==='object'&&value.log10===Number(BUDDHIST_GOAL_EXPONENT))return 99+Math.min(1,value.scale??1);const exponent=Math.max(68,log10(maxValue(1,value)));return Math.max(0,Math.min(100,Math.log10(exponent/68)/Math.log10(Number(BUDDHIST_GOAL_EXPONENT)/68)*100));}
function rewardTarget(kind,id){const next=nextResetReward(state,kind),label=kind==='time'?'全文明の累計生産':`${{inheritance:'継承',leap:'飛躍',transcend:'超越'}[kind]}の累計生産`,total=resetProduction(state,kind);$(id).hidden=!next;$(id).textContent=next?`次の報酬 +${pointNumber(next.nextGain)} pt（現在 +${pointNumber(next.gain)} pt） · ${label} ${scoreNumber(total)} → ${scoreNumber(next.target)} · あと ${scoreNumber(next.remaining)}`:'';}
function resetProductionText(kind,label){const total=resetProduction(state,kind),b=kind==='time'?timeRewardBreakdown(state):lowerRewardBreakdown(state,kind);return `${label}：${scoreNumber(total)} · 算出 ${pointNumber(b.reward)} pt − 受取済み ${pointNumber(b.credited)} pt = 未受取 ${pointNumber(b.unclaimed)} pt`;}
function resetCountText(){const counts=state.resetCounts??[state.cycles,state.ascensions,state.transcendences,state.timeJumps];const total=counts.reduce((a,b)=>a+b,0);return `生涯リセット ${total}回（継承 ${counts[0]}・飛躍 ${counts[1]}・超越 ${counts[2]}・時間 ${counts[3]}）`;}
function notify(text){if(!/保存できません|セーブを読み込めません|退避した進行を読み込めません/.test(text))return;$('storage-warning').textContent=text;$('storage-warning').hidden=false;}
try{
 const raw=localStorage.getItem(KEY)||localStorage.getItem('fukasetsu-civilization-v8')||localStorage.getItem('fukasetsu-civilization-v7')||localStorage.getItem('fukasetsu-civilization-v6')||localStorage.getItem('fukasetsu-civilization-v5')||localStorage.getItem('fukasetsu-civilization-v4')||localStorage.getItem('fukasetsu-civilization-v3')||localStorage.getItem(LEGACY_KEY);
 if(raw){const loaded=migrateSave(JSON.parse(raw));if(!loaded)throw Error('save');state=loaded;const away=Math.min(604800,Math.max(0,(Date.now()-state.last)/1000));advance(state,away);notify(`おかえりなさい。${(away/3600).toFixed(1)}時間分の生産を受け取りました。`);}
}catch{notify('セーブを読み込めませんでした。新しい文明を開始します。');}
state.last=Date.now();
const timeRules=$('time-reset-description').closest('details');timeRules.prepend($('time-record-bonus'));
$('facilities').innerHTML=FACILITIES.map((f,i)=>`<article class="layer facility-row" id="facility${i}" title="${ERAS[f.era]}：${f.description}"><div class="facility-summary"><h3>${f.name} <span id="owned${i}">0</span></h3><p id="output${i}"></p></div><button id="buy${i}">購入</button></article>`).join('');
$('technologies').innerHTML=TECHS.map((t,i)=>`<article class="layer technology" id="technology${i}"><span class="number">${t.kind==='time'?'時空研究':`${ERAS[t.era]}の技術`}</span><h3>${t.name}</h3><p>${techEffect(i)}</p><div class="requirement" id="techreq${i}"></div><button id="tech${i}">研究</button></article>`).join('');
$('skills').innerHTML=SKILLS.map((s,i)=>`<article class="layer skill-node" id="skill-node${i}" data-node="${i}"><span class="number">継承スキル</span><h3><button class="tree-node-select" data-tree="skills" data-node="${i}" type="button">${s.name}</button></h3><p class="skill-effect">${shortEffects.skills[i]}</p><p class="prerequisite">${skillCondition(state,i)}</p><div class="requirement" id="skillreq${i}"></div><button id="skill${i}">強化</button></article>`).join('');
$('innovation-tree').innerHTML=INNOVATIONS.map((n,i)=>`<article class="layer innovation" id="innovation${i}" data-node="${i}"><span class="number">${i===0?'基盤':i===4?'融合':'発展の枝'}</span><h3><button class="tree-node-select" data-tree="innovation-tree" data-node="${i}" type="button">${n.name}</button></h3><p class="skill-effect">${shortEffects.innovations[i]}</p><p class="prerequisite">${n.requires.length?n.requires.map(([j,level])=>`${INNOVATIONS[j].name} Lv.${level}`).join(' ＋ '):'最初の飛躍から購入可能'}</p><div id="innovation-req${i}" class="requirement"></div><button id="innovation-buy${i}">革新ポイントで強化</button></article>`).join('');
$('transcend-tree').innerHTML=TRANSCEND_SKILLS.map((n,i)=>`<article class="layer" id="transcend-node${i}" data-node="${i}"><h3><button class="tree-node-select" data-tree="transcend-tree" data-node="${i}" type="button">${n.name}</button></h3><p class="skill-effect">${shortEffects.transcend[i]}</p><div id="transcend-req${i}" class="requirement"></div><button id="transcend-buy${i}">強化する</button></article>`).join('');
$('time-tree').innerHTML=TIME_SKILLS.map((n,i)=>`<article class="layer" id="time-node${i}" data-node="${i}"><h3><button class="tree-node-select" data-tree="time-tree" data-node="${i}" type="button">${n.name}</button></h3><p class="skill-effect">${shortEffects.time[i]}</p><div id="time-req${i}" class="requirement"></div><button id="time-buy${i}">強化する</button></article>`).join('');
for(const id of ['skills','innovation-tree','transcend-tree','time-tree']){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('tree-connections');svg.setAttribute('aria-hidden','true');$(id).prepend(svg);
}
function drawTrees(){
 for(const [id,edges] of [['skills',[[0,2],[0,4],[0,5]]],['innovation-tree',[[0,1],[0,2],[0,3],[1,4],[2,4]]],['transcend-tree',[[0,1],[0,2],[1,3],[2,3]]],['time-tree',TIME_SKILLS.flatMap((n,i)=>n.requires.map(([j])=>[j,i]))]]){
  const tree=$(id),svg=tree.querySelector('svg');if(!tree.offsetWidth)continue;
  const box=tree.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${tree.offsetWidth} ${tree.offsetHeight}`);
  svg.innerHTML=edges.map(([source,target])=>{
   const from=tree.querySelector(`[data-node="${source}"]`),to=tree.querySelector(`[data-node="${target}"]`),a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
   const x=a.left+a.width/2-box.left,y=a.bottom-box.top,tx=b.left+b.width/2-box.left,ty=b.top-box.top;
   const mid=ty-12;
   const timeGutters={'0:8':-4,'0:9':tree.offsetWidth+4,'3:7':-9};
   const gutter=id==='time-tree'?timeGutters[`${source}:${target}`]:undefined;
   const route=gutter===undefined?`M ${x} ${y} V ${mid} H ${tx} V ${ty}`:`M ${x} ${y} V ${y+10} H ${gutter} V ${mid} H ${tx} V ${ty}`;
   return `<path class="${(to.classList.contains('purchased')||to.classList.contains('bonus-granted'))?'completed':''}" d="${route}"/>`;
  }).join('');
 }
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;notify('保存できません。このタブを閉じると進行が失われます。');}}
function isPaused(){return [...document.querySelectorAll('dialog')].some(dialog=>dialog.open);}
function update(){const now=Date.now();if(!isPaused())advance(state,Math.max(0,(now-state.last)/1000)*testSpeed);state.last=now;}
function nextGoal(){
 const levels=state.skills.reduce((a,b)=>a+b,0);
 if(state.goalReached)return {title:'最終目標達成',detail:`1${goalLabel()}に到達しました。`,pct:100};
 if(state.cleared)return {title:`1${goalLabel()}に到達する`,detail:'時間スキルで生産指数を強化しましょう。',pct:finalProgress(state.money)};
 if((state.transcendences||state.timeJumps)&&!state.transcendSkills[0])return {title:'宇宙の基盤を取得する',detail:'超越ポイントで宇宙の基盤を強化しましょう。',pct:0};
 if((state.transcendences||state.timeJumps)&&state.history.maxEra<4)return {title:'宇宙を解放する',detail:'情報時代・知能の連鎖の研究・周回累計100秭・所持50秭点',pct:Math.min(state.era>=3?100:0,state.techs[7]?100:0,logProgress(state.earned,1e26))};
 if(state.transcendences||state.timeJumps)return {title:'タイムマシン開発を解放する',detail:'所持文明力1無量大数を突破しましょう。',pct:logProgress(state.money,MURYOUTAISUU)};
 if(!state.ascensions&&state.history.maxEra<2){const era=state.era===0?1:2,r=eraRequirement(state);return {title:`${ERAS[era]}を解放する`,detail:`周回累計 ${displayNumber(r.earned)}・${TECHS[r.tech].name}の研究・所持 ${displayNumber(r.cost)} 文明力`,pct:Math.min(logProgress(state.earned,r.earned),logProgress(state.money,r.cost),state.techs[r.tech]?100:0)};}
 if(!state.ascensions&&!state.leapUnlocked){
  if(!state.cycles)return {title:'継承を解放する',detail:'工業時代・機械化の研究・周回累計1,000億',pct:Math.min(state.era>=2?100:0,state.techs[4]?100:0,logProgress(state.earned,1e11))};
  if(state.cycles<3)return {title:'継承を3回行う',detail:`現在 ${state.cycles} / 3回`,pct:state.cycles/3*100};
  return {title:'飛躍を解放する',detail:`継承スキルを合計8レベルにする（現在 ${levels} / 8）`,pct:Math.min(100,levels/8*100)};
 }
 if(!state.ascensions)return {title:'最初の飛躍を行う',detail:'工業時代・電力網の研究・周回累計100京',pct:Math.min(state.era>=2?100:0,state.techs[5]?100:0,logProgress(state.earned,leapThreshold(state)))};
 if(state.history.maxEra<3)return {title:'情報を解放する',detail:'工業時代・電力網の研究・周回累計100兆・所持50兆点',pct:Math.min(state.era>=2?100:0,state.techs[5]?100:0,logProgress(state.earned,1e14))};
 if(state.ascensions<3)return {title:'飛躍を3回行う',detail:`現在 ${state.ascensions} / 3回。次の飛躍条件は継承・飛躍タブで確認できます。`,pct:state.ascensions/3*100};
 return {title:'超越を解放する',detail:'情報時代・知能の連鎖の研究・周回累計100穣',pct:Math.min(state.era>=3?100:0,state.techs[7]?100:0,logProgress(state.earned,transcendThreshold(state)))};
}
function explainUnlock(){
 if(isPaused())return;
 const unlockSeen=Array.isArray(state.explainedUnlocks)?state.explainedUnlocks:[];
 const events=[
 ['agriculture',state.history.maxEra>=1,'農耕時代を解放','農耕の施設と技術が使えます。既存の施設も生産を続けます。次は工業時代を目指しましょう。'],
 ['industry',state.history.maxEra>=2,'工業時代を解放','工業の施設と技術が使えます。機械化を研究し、周回累計1,000億に達すると文明を継承できます。'],
 ['inheritance',inheritance(state)>0||state.cycles>0||state.ascensions>0||state.transcendences>0||state.timeJumps>0,'文明の継承を解放','周回の施設・技術・文明力をリセットし、累計に応じた継承ポイントを得ます。継承スキルで次の周回を強化できます。継承3回とスキル合計8レベルで飛躍を解放します。'],
 ['leap',state.leapUnlocked,'文明の飛躍を解放','電力網を研究し、必要な周回累計に達すると飛躍できます。継承資産をリセットして革新ポイントを獲得し、情報時代を解放します。'],
 ['information',state.ascensions>0||state.transcendences>0||state.timeJumps>0,'革新と情報時代を解放','革新ポイントをスキルに投資すると生産を大きく伸ばせます。工業までの技術は習得済みで再開します。飛躍3回の後、超越を目指しましょう。'],
 ['transcendence',state.ascensions>=3||state.transcendences>0||state.timeJumps>0,'文明の超越を解放','情報時代で知能の連鎖を研究し、周回累計100穣で初回超越が可能です。継承・革新資産をリセットし、超越スキルで生産指数を強化できます。'],
 ['cosmos',state.transcendSkills[0]>0,'宇宙時代への道を解放','宇宙の基盤を取得しました。情報時代の条件を満たして宇宙へ進み、1無量大数を目指しましょう。'],
 ['chronology',state.cleared,'時間跳躍を解放','タイムマシン開発で文明を巻き戻し、時空ポイントを得られます。時間スキルの指数強化で次の目標を目指します。'],
 ['time-research',state.timeSkills[5]>0,'時空研究を解放','技術タブに時空研究が追加されました。周回累計の条件を満たし、文明力を支払って研究すると生産を強化できます。固定した研究は時間跳躍後も残ります。']
 ];
 const event=events.find(([id,ready])=>ready&&!unlockSeen.includes(id));if(!event)return;
 $('unlock-title').textContent=event[2];$('unlock-description').textContent=event[3];$('unlock-screen').dataset.unlock=event[0];$('unlock-screen').showModal();state.last=Date.now();
}
function render(){
 discoverGoalUnit(state);
 checkClear(state);
 $('clear-log').replaceChildren(...state.clearLog.map(r=>{const p=document.createElement('p');p.textContent=`${r.type==='muryou'?'無量大数クリア':'不可説不可説転到達'} · ${formatDuration(r.elapsed)} · ${formatNumber(r.score,r.type==='muryou'?'japanese':'buddhist')}点`;return p;}));
 $('clear-log-download').disabled=!state.clearLog.length;
 const known=discoveredFeatures(state);
 for(const el of document.querySelectorAll('[data-workspace]'))el.hidden=!known[el.dataset.workspace];
 if(!known[workspace])setWorkspace('technologies');
 document.querySelector('[data-era="3"]').hidden=!known.information;document.querySelector('[data-era="4"]').hidden=!known.cosmic;
 document.querySelector('#tech-filter option[value="time"]').hidden=!known.chronology;
 if(!known.chronology&&$('tech-filter').value==='time')$('tech-filter').value='all';
 $('game-guide').replaceChildren(...visibleGuide(state).map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
 document.querySelector('.clear-history').hidden=!state.cleared;
 const reveal=$('test-reveal').checked;let availableCheckpoint=false;
 for(const option of $('test-checkpoint').options){option.hidden=!reveal&&!(option.value==='time'||option.value==='clear'?known.chronology:option.value==='transcend'?known.transcendence:known.innovation);if(!option.hidden)availableCheckpoint=true;}
 $('test-checkpoint').disabled=!availableCheckpoint;$('test-skip').disabled=!availableCheckpoint;
 if(availableCheckpoint&&$('test-checkpoint').selectedOptions[0].hidden)$('test-checkpoint').value=[...$('test-checkpoint').options].find(o=>!o.hidden).value;
 $('notation-mode').textContent=state.cleared?'八十華厳の数表記':'日本式の数表記';
 if(!isPaused()&&state.goalReached&&!state.goalAcknowledged&&!$('goal-screen').open&&!$('clear-screen').open){$('goal-time').textContent=`プレイ時間 ${formatDuration(state.goalElapsed)}`;$('goal-screen').showModal();save();}
 if(!isPaused()&&state.cleared&&!state.clearAcknowledged&&!$('clear-screen').open&&!$('goal-screen').open){$('clear-score').textContent=`${formatNumber(state.clearScore,'japanese')}点`;$('clear-time').textContent=`プレイ時間 ${formatDuration(state.clearElapsed)}`;$('clear-screen').showModal();save();}

 document.body.classList.toggle('all-eras',state.era>=3&&!eraRequirement(state));
 $('score').textContent=scoreNumber(state.money);$('score').classList.toggle('long-score',$('score').textContent.length>45);$('score').title=$('score').textContent;$('production-effects').textContent=`スキル生産 ×${displayNumber(2**effectiveSkillLevel(state,0)*50**state.innovations[0]*5**state.innovations[1])}${productionExponent(state)!==1?` · 生産指数 ${displayExponent(productionExponent(state))}`:''} · 施設価格 ×${(0.85**effectiveSkillLevel(state,1)).toFixed(3)}`;$('rate').textContent=`実時間1秒で +${scoreNumber(multiply(production(state),testSpeed))}${testSpeed>1?`（テスト${testSpeed}倍速）`:''}`;
 $('time').textContent=`${resetCountText()} · プレイ時間 ${formatDuration(state.elapsed)}`;
 $('test-status').textContent=testSpeed>1?`${testSpeed}倍速で進行中`:'通常速度';
 $('test-speed').value=String(testSpeed);
 $('test-mode').classList.toggle('enabled',testSpeed>1);
 $('run-total').textContent=scoreNumber(state.earned);$('lifetime-total').textContent=scoreNumber(state.lifetime);
 $('era').textContent=ERAS[state.era];
 $('gather-label').textContent=['採集する','収穫する','生産を手伝う','知識を集める','宇宙を観測する'][state.era];
 $('gather-gain').textContent=`+${scoreNumber(manualGain(state))}`;
 document.querySelectorAll('[data-era]').forEach(el=>{const era=Number(el.dataset.era);el.classList.toggle('current',era===state.era);el.textContent=ERAS[era];});
 FACILITIES.forEach((f,i)=>{
  const unlocked=f.era<=state.era;$(`facility${i}`).hidden=!unlocked;
  if(!unlocked)return;
  const quote=purchaseQuote(state,i,qty);
  $(`owned${i}`).textContent=`${state.owned[i]}施設`;$(`output${i}`).textContent=`毎秒 +${scoreNumber(facilityRate(state,i))}`;
  $(`buy${i}`).textContent=state.owned[i]>=1000?'上限到達':`${scoreNumber(quote.cost)} / ${quote.count}施設`;
  $(`buy${i}`).setAttribute('aria-label',`${f.name}：${state.owned[i]>=1000?'上限到達':`${quote.count}施設を${scoreNumber(quote.cost)}で購入`}`);
  $(`buy${i}`).disabled=!quote.affordable||state.owned[i]>=1000;$(`facility${i}`).classList.toggle('available',quote.affordable&&state.owned[i]<1000);$(`facility${i}`).classList.toggle('purchased',state.owned[i]>=1000);$(`output${i}`).title=$(`output${i}`).textContent;
 });
 const filter=$('tech-filter').value,showResearched=$('show-researched').checked;
 let visibleTechs=0;
 TECHS.forEach((t,i)=>{
  const available=techUnlocked(state,i),researched=state.techs[i];
  const firstTier=t.kind!=='facility'||!TECHS.some((prior,j)=>prior.kind==='facility'&&prior.facility===t.facility&&j<i&&!state.techs[j]);
  const relevant=t.kind==='era'||t.kind==='click'||(t.kind==='time'&&state.timeSkills[5]>0)||(t.kind==='facility'&&state.owned[t.facility]>0)||(t.kind==='synergy'&&effectiveSkillLevel(state,5)>0);
  $(`technology${i}`).hidden=t.era>state.era||(filter!=='all'&&t.kind!==filter)||(researched&&!showResearched)||(!researched&&(!firstTier||!relevant));
  if(!$(`technology${i}`).hidden)visibleTechs++;
  $(`techreq${i}`).textContent=researched?(state.timeSkills[8]&&t.kind!=='time'?'技術の永久保存で習得済み':state.transcendences&&t.era<=3&&t.kind!=='time'?'超越で習得済み':state.ascensions&&t.era<=2?'飛躍で習得済み':'研究済み'):`${available?'解放済み':'未解放'} · ${techCondition(state,i)} · ${scoreNumber(techCost(state,i))}`;
  $(`tech${i}`).disabled=!canTech(state,i);$(`tech${i}`).textContent=researched?'✓ 研究済み':available?`研究 · ${scoreNumber(techCost(state,i))}`:'条件未達';$(`technology${i}`).classList.toggle('purchased',researched);$(`technology${i}`).classList.toggle('available',canTech(state,i));$(`technology${i}`).classList.toggle('locked',!researched&&!available);
 });
 $('tech-empty').hidden=visibleTechs>0;
 const r=eraRequirement(state);
 $('era-condition').textContent=r?`周回累計 ${scoreNumber(r.earned)}・${TECHS[r.tech].name}の研究・${scoreNumber(r.cost)}が必要`:state.era===2?(known.innovation?'新しい時代への道は、文明の飛躍から開けます。':'施設と技術を育て、知恵を次の世代に残しましょう。'):state.era===3?(known.transcendence?'宇宙の基盤を育てると、新たな時代へ進めます。':'知識と施設を育て、文明をさらに発展させましょう。'):known.chronology?`時間スキルを育て、1${goalLabel()}を目指しましょう。`:'宇宙の施設を育て、1無量大数を目指しましょう。';
 $('evolve').textContent=r?`${ERAS[state.era+1]}時代へ進む`:'この時代を発展させる';$('evolve').disabled=!canEvolve(state);$('evolve').hidden=!r;

 const goal=nextGoal();$('progress').value=goal.pct;$('percent').textContent=`${goal.pct.toFixed(1)}%`;$('progress-label').textContent=`次の目標：${goal.title}`;$('goal-detail').textContent=goal.detail;
 for(const [kind,id] of [['inheritance','inherit-next'],['leap','leap-next'],['transcend','transcend-next'],['time','time-next']])rewardTarget(kind,id);
 $('innovation-points').textContent=`残り ${pointNumber(state.insight)} pt`;$('innovation-target').textContent=`飛躍の累計生産 ${scoreNumber(resetProduction(state,'leap'))} → 革新 +${pointNumber(leapGain(state))} pt`;
 $('points').textContent=`残り ${pointNumber(state.points)} pt`;
 $('inherit-production').textContent=resetProductionText('inheritance','継承の累計生産');
 const ready=inheritance(state)>0;
 $('inherit').disabled=!ready;
 $('inherit-condition').textContent=[
  `${state.era>=2?'✓':'未達'} 工業時代に進む（現在：${ERAS[state.era]}）`,
  `${state.techs[4]?'✓':'未達'} 機械化を研究${state.techs[4]?'':`（${techCondition(state,4)}・${scoreNumber(techCost(state,4))}）`}`,
  `${compare(state.earned,1e11)>=0?'✓':'未達'} 今周回の累計生産1,000億（現在：${scoreNumber(state.earned)}${compare(state.earned,1e11)<0?` / あと${scoreNumber(subtract(1e11,state.earned))}`:''}）`,
 ].join('\n');
 $('gain').textContent=pointNumber(inheritance(state));$('inherit-confirm-gain').textContent=pointNumber(inheritance(state));
 $('inherit-confirm-yes').disabled=!ready;
 SKILLS.forEach((s,i)=>{
  const level=effectiveSkillLevel(state,i),max=state.skills[i]>=s.max,bonus=level-state.skills[i];$(`skillreq${i}`).textContent=`Lv. ${state.skills[i]}/${s.max}${bonus?` (+${bonus})`:''} · ${max?'上限':`${pointNumber(skillCost(state,i))}pt`}`;
  $(`skill${i}`).disabled=max||!skillUnlocked(state,i)||state.points<skillCost(state,i);$(`skill${i}`).textContent=max?'最大レベル':skillUnlocked(state,i)?'強化する':'条件未達';
  $(`skill-node${i}`).classList.toggle('purchased',state.skills[i]>0);$(`skill-node${i}`).classList.toggle('bonus-granted',state.skills[i]===0&&level>0);$(`skill-node${i}`).classList.toggle('locked',!skillUnlocked(state,i));$(`skill-node${i}`).classList.toggle('available',!max&&skillUnlocked(state,i)&&state.points>=skillCost(state,i));
  $(`skill-node${i}`).classList.toggle('selected-node',selectedSkill===i);document.querySelector(`#skill-node${i} .tree-node-select`)?.setAttribute('aria-pressed',String(selectedSkill===i));
 });
 $('leap-lock').hidden=state.leapUnlocked;
 $('leap-lock').textContent=`解放条件：継承3回（${state.cycles}/3）・スキル合計8レベル（${state.skills.reduce((a,b)=>a+b,0)}/8）`;
 $('leap-content').hidden=!state.leapUnlocked;
 $('leap-gain').textContent=pointNumber(leapGain(state));$('leap-confirm-gain').textContent=pointNumber(leapGain(state));
 $('leap').disabled=!leapGain(state);$('leap-confirm-yes').disabled=!leapGain(state);
 $('leap-condition').textContent=`${state.leapUnlocked?'✓':'未達'} 継承3回・スキル合計8レベル${state.leapUnlocked?'（解放済み）':''}\n${state.era>=2?'✓':'未達'} 工業時代に進む（現在：${ERAS[state.era]}）\n${state.techs[5]?'✓':'未達'} 電力網を研究\n${compare(state.earned,leapThreshold(state))>=0?'✓':'未達'} 今周回の累計生産 ${scoreNumber(leapThreshold(state))}（現在：${scoreNumber(state.earned)}）`;
 $('leap-production').textContent=resetProductionText('leap','飛躍の累計生産');
 $('leap-effect').textContent='飛躍の累計生産に応じて革新ポイントを獲得し、革新スキルを強化します。';
 $('innovation-panel').hidden=false;
 INNOVATIONS.forEach((n,i)=>{
  const ready=innovationReady(state,i),max=state.innovations[i]>=n.max,cost=innovationCost(state,i);
  $(`innovation-req${i}`).textContent=`Lv.${state.innovations[i]}/${n.max} · ${max?'上限':`${pointNumber(cost)}pt`}`;
  $(`innovation-buy${i}`).disabled=!state.leapUnlocked||max||!ready||state.insight<cost;$(`innovation-buy${i}`).textContent=max?'上限':!state.leapUnlocked?'飛躍で解放':!ready?'前提未達':state.insight<cost?'ポイント不足':'強化する';
  $(`innovation${i}`).classList.toggle('locked',!state.leapUnlocked||!ready);$(`innovation${i}`).classList.toggle('purchased',state.innovations[i]>0);$(`innovation${i}`).classList.toggle('available',!max&&state.leapUnlocked&&ready&&state.insight>=cost);$(`innovation${i}`).classList.toggle('selected-node',selectedInnovation===i);document.querySelector(`#innovation${i} .tree-node-select`).setAttribute('aria-pressed',String(selectedInnovation===i));
 });

 const sk=SKILLS[selectedSkill],node=INNOVATIONS[selectedInnovation];
 $('skill-detail').querySelector('h3').textContent=sk.name;
 $('skill-detail').querySelector('p').textContent=`${sk.name}：${sk.description}。解放条件：${skillCondition(state,selectedSkill)}。${state.skills[selectedSkill]===0&&effectiveSkillLevel(state,selectedSkill)>0?'補正で解放済み':skillUnlocked(state,selectedSkill)?'解放済み':'未解放'}。購入Lv. ${state.skills[selectedSkill]}${known.innovation?` ＋ 革新補正 ${effectiveSkillLevel(state,selectedSkill)-state.skills[selectedSkill]} ＝ 実効Lv. ${effectiveSkillLevel(state,selectedSkill)}`:''}。`;

 $('innovation-detail').querySelector('h3').textContent=node.name;
 $('innovation-detail').querySelector('p').textContent=`${node.name}：${node.description}。${node.requires.length?`前提：${node.requires.map(([j,n])=>`${INNOVATIONS[j].name} Lv.${n}`).join(' ＋ ')}`:'最初の飛躍で購入可能'}。${state.leapUnlocked?'革新ポイントで強化できます。':'継承3回・購入スキル合計8レベルで飛躍を解放してください。'}`;
 $('transcend-points').textContent=`残り ${pointNumber(state.horizon)} pt`;
 const tg=transcendGain(state);$('transcend').disabled=!tg;$('transcend-confirm-yes').disabled=!tg;
 $('transcend-gain').textContent=pointNumber(tg);$('transcend-confirm-gain').textContent=pointNumber(tg);
 $('transcend-condition').textContent=`${state.ascensions>=3||state.transcendences>0||state.timeJumps>0?'✓':'未達'} 飛躍3回（超越後は不要）\n${state.era>=3?'✓':'未達'} 情報時代に進む（現在：${ERAS[state.era]}）\n${state.techs[7]?'✓':'未達'} 知能の連鎖を研究\n${compare(state.earned,transcendThreshold(state))>=0?'✓':'未達'} 今周回の累計生産 ${scoreNumber(transcendThreshold(state))}（現在：${scoreNumber(state.earned)}）`;
 $('transcend-production').textContent=resetProductionText('transcend','超越の累計生産');
 TRANSCEND_SKILLS.forEach((n,i)=>{
  const ready=transcendSkillReady(state,i),max=state.transcendSkills[i]>=n.max,cost=transcendSkillCost(state,i),card=$(`transcend-node${i}`);
  $(`transcend-req${i}`).textContent=`Lv. ${state.transcendSkills[i]}/${n.max} · ${max?'上限':`${pointNumber(cost)}pt`}`;
  $(`transcend-buy${i}`).disabled=!ready||max||state.horizon<cost;$(`transcend-buy${i}`).textContent=max?'上限':!state.transcendences&&!state.timeJumps?'超越で解放':!ready?'前提未達':state.horizon<cost?'ポイント不足':'強化する';
  card.classList.toggle('purchased',state.transcendSkills[i]>0);card.classList.toggle('locked',!ready);card.classList.toggle('available',ready&&!max&&state.horizon>=cost);card.classList.toggle('selected-node',selectedTranscend===i);card.querySelector('.tree-node-select').setAttribute('aria-pressed',String(selectedTranscend===i));
 });
 const tn=TRANSCEND_SKILLS[selectedTranscend];$('transcend-detail').querySelector('h3').textContent=tn.name;$('transcend-detail').querySelector('p').textContent=`${tn.description}。${tn.requires.length?`前提：${tn.requires.map(([j,n])=>`${TRANSCEND_SKILLS[j].name} Lv.${n}`).join(' ＋ ')}`:'初回超越で購入可能'}。`;
 $('time-points').textContent=`残り ${pointNumber(state.chronons)} pt`;const finalPct=finalProgress(state.money);$('time-goal-progress').value=finalPct;$('time-goal-label').textContent=`1${goalLabel()}への進捗 ${finalPct.toFixed(1)}%${state.goalReached?' · 達成済み':typeof state.money==='object'&&state.money.log10===Number(BUDDHIST_GOAL_EXPONENT)?` · 最終生産 ${((state.money.scale??1)*100).toFixed(1)}%（最大生産で約5分）`:''}`;
 const timeReward=timeGain(state);$('time-travel').disabled=!timeReward;$('time-confirm-yes').disabled=!timeReward;$('time-gain').textContent=pointNumber(timeReward);$('time-production').textContent=resetProductionText('time','全文明の累計生産');$('time-confirm-gain').textContent=pointNumber(timeReward);
 $('time-condition').textContent=`${state.cleared?'✓':'未達'} 1無量大数を突破\n${compare(state.earned,timeThreshold(state))>=0?'✓':'未達'} 今周回の累計生産 ${scoreNumber(timeThreshold(state))}（現在：${scoreNumber(state.earned)}）`;
 const permanentTech=state.timeSkills[8]>0,permanentCosmos=state.timeSkills[9]>0,permanentPoints=state.timeSkills[10]>0;
 const startingEra=permanentCosmos||state.facilityArchive?'宇宙時代':'情報時代',startingTech=permanentTech?'通常の全技術':'情報時代までの技術';const startFacilities=state.facilityArchive?'全施設各1000個':'工業までの各施設100個';const recordQuote=permanentRecordQuote(state),recordBonus=`各層の累計生産からの追加：継承 +${pointNumber(recordQuote.additions[0])}・革新 +${pointNumber(recordQuote.additions[1])}・超越 +${pointNumber(recordQuote.additions[2])} pt`;
 document.querySelectorAll('.permanent-start').forEach(el=>el.hidden=true);
 $('time-permanent-effects').textContent=`開始：${startingEra}・${startFacilities}・${startingTech}`;
 const resetList=resetItems(state,'time');
 for(const kind of ['inherit','leap','transcend'])$(`${kind}-reset-items`).textContent=resetItems(state,kind);
 for(const el of document.querySelectorAll('[data-reset-kind]'))el.textContent=`リセット：${resetItems(state,el.dataset.resetKind)}`;
 $('time-reset-description').textContent=`リセット：${resetList}`;
 $('time-confirm-reset').textContent=`リセット：${resetList}。獲得：`;
 $('time-record-bonus').hidden=!permanentPoints;$('time-record-bonus').textContent=recordBonus;


 TIME_SKILLS.forEach((n,i)=>{
  const ready=timeSkillReady(state,i),max=state.timeSkills[i]>=n.max,cost=timeSkillCost(state,i),card=$(`time-node${i}`);
  $(`time-req${i}`).textContent=`Lv. ${state.timeSkills[i]}/${n.max} · ${max?'上限':`次Lv ${pointNumber(cost)}pt`}${i===8&&state.timeSkills[8]===1?` · Lv.2条件 ${state.history.maxOwned.filter(n=>n>=1000).length}/${FACILITIES.length}施設が1000個到達`:''}`;
  $(`time-buy${i}`).disabled=!ready||max||state.chronons<cost;$(`time-buy${i}`).textContent=max?'上限':!state.timeJumps?'時間跳躍で解放':!ready?'前提未達':state.chronons<cost?`不足 · ${pointNumber(cost)}pt`:`強化 · ${pointNumber(cost)}pt`;
  $(`time-buy${i}`).setAttribute('aria-label',`${n.name}：${max?'上限':`1レベルを${pointNumber(cost)}ポイントで強化`}`);
  card.classList.toggle('purchased',state.timeSkills[i]>0);card.classList.toggle('locked',!ready);card.classList.toggle('available',ready&&!max&&state.chronons>=cost);card.classList.toggle('selected-node',selectedTime===i);card.querySelector('.tree-node-select').setAttribute('aria-pressed',String(selectedTime===i));
 });
 const selectedTimeNode=TIME_SKILLS[selectedTime];const timeEffectDetail=selectedTime===4?`現在の連携充足率：${FACILITIES.map((f,i)=>`${f.name} ${(Math.min(1,state.owned.reduce((sum,n,j)=>sum+(FACILITIES[j].era!==f.era?n:0),0)/3000)*100).toFixed(0)}%`).filter((_,i)=>i%3===0).join('・')}`:selectedTime===5?`習得済み時空研究 ${TECHS.filter((t,i)=>t.kind==='time'&&state.techs[i]).length}/3。固定化 ${state.fixedTimeResearch.filter(Boolean).length}/3（Lv.5・9・13）。現在の研究効果 ${timeResearchPower(state)}倍の桁成長。研究は「技術」タブの時空研究から購入できます`:selectedTime===8?`全施設1000個の到達記録 ${state.history.maxOwned.filter(n=>n>=1000).length}/${FACILITIES.length}種類。${state.facilityArchive?'全施設1000個で再開する効果を達成済み':'記録達成後にLv.2を購入すると、宇宙時代・全施設各1000個で開始'}`:selectedTime===10?`${recordBonus}。購入に使ったポイントと過去の受取分は差し引きます`:'';$('time-detail').querySelector('h3').textContent=selectedTimeNode.name;$('time-detail').querySelector('p').textContent=`${selectedTimeNode.description}。${timeEffectDetail?`${timeEffectDetail}。`:''}${selectedTimeNode.requires.length?`前提：${selectedTimeNode.requires.map(([j,n])=>`${TIME_SKILLS[j].name} Lv.${n}`).join(' ＋ ')}`:'初回時間跳躍で購入可能'}。${state.timeSkills[selectedTime]>=selectedTimeNode.max?'レベル上限に到達':`次の強化 ${pointNumber(timeSkillCost(state,selectedTime))} pt`}。`;
 const ordered=TECHS.map((t,i)=>({i,ready:techUnlocked(state,i)&&!state.techs[i],cost:techCost(state,i)})).sort((a,b)=>Number(b.ready)-Number(a.ready)||compare(a.cost,b.cost)||a.i-b.i);
 ordered.forEach(({i},rank)=>$(`technology${i}`).style.order=rank);
 const cheapest=ordered.find(({i})=>!$(`technology${i}`).hidden&&canTech(state,i));$('research-next').disabled=!cheapest;$('research-next').textContent=cheapest?`${TECHS[cheapest.i].name}を研究 · ${scoreNumber(cheapest.cost)}`:'購入できる研究はありません';
 explainUnlock();
 if(!storageOK)notify('保存できません。このタブを閉じると進行が失われます。');
 for(const tree of ['skills','innovation-tree','transcend-tree','time-tree'])for(const card of $(tree).querySelectorAll('article')){
  let label=card.querySelector('.node-status');if(!label){label=document.createElement('span');label.className='node-status';card.querySelector('h3').after(label);}
  const button=card.querySelector('button:not(.tree-node-select)');label.textContent=button.textContent.includes('上限')||button.textContent==='最大レベル'?'✓ 上限':!button.disabled?'＋ 強化可':card.classList.contains('bonus-granted')?'補正あり':card.classList.contains('purchased')?'✓ 習得済み':card.classList.contains('locked')?'条件未達':'ポイント不足';
 }
 drawTrees();
}
function setWorkspace(name){
 workspace=discoveredFeatures(state)[name]?name:'technologies';name=workspace;
 document.body.classList.remove('facility-view');
 document.body.classList.toggle('time-view',name==='chronology');
 document.querySelectorAll('[data-panel]').forEach(el=>el.classList.toggle('active',el.dataset.panel==='facilities'||el.dataset.panel===name));
document.querySelectorAll('[data-workspace]').forEach(el=>{el.classList.toggle('selected',el.dataset.workspace===name);el.setAttribute('aria-pressed',String(el.dataset.workspace===name));});
 drawTrees();
}
function workspaceForAction(name){setWorkspace(name);}
window.addEventListener('resize',()=>{setWorkspace(workspace);});
function action(fn){if($('unlock-screen').open)return;update();fn();render();save();}
function checkpointLabel(target){return target==='clear'?'クリア直後':target==='time'?'初回時間跳躍直後':target==='transcend'?'初回超越直後':`${target}回目の飛躍直後`;}
function makeCheckpoint(target){return target==='clear'?clearCheckpoint():target==='time'?timeCheckpoint():target==='transcend'?transcendCheckpoint():leapCheckpoint(Number(target));}
$('test-skip').onclick=()=>{skipTarget=$('test-checkpoint').value;$('test-skip-title').textContent=`${checkpointLabel(skipTarget)}へ移動しますか？`;$('test-skip-description').textContent=`現在の進行を退避して${checkpointLabel(skipTarget)}のテスト状態へ移動します。「スキップ前へ戻す」で復元できます。クリア直後はクリア画面も表示し、初回時間跳躍直後は時空1ポイント・情報時代・工業まで各100施設で開始します。`;$('test-skip-confirm').hidden=false;$('test-skip-yes').focus();};
$('test-skip-no').onclick=()=>{$('test-skip-confirm').hidden=true;$('test-skip').focus();};
$('test-skip-yes').onclick=()=>{
 update();
 try{localStorage.setItem(BACKUP_KEY,JSON.stringify(state));}catch{notify('進行を退避できないため、スキップを中止しました。');return;}
 state=makeCheckpoint(skipTarget);testSpeed=1;qty=1;$('quantity').value='1';
 $('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;
 $('transcend-confirm').hidden=true;$('time-confirm').hidden=true;$('test-restore').disabled=false;workspaceForAction(['clear','time'].includes(skipTarget)?'chronology':skipTarget==='transcend'?'transcendence':'innovation');notify(`${checkpointLabel(skipTarget)}へ移動しました。ポイントでスキルを強化できます。`);render();save();
};
$('test-restore').onclick=()=>{
 try{const restored=migrateSave(JSON.parse(localStorage.getItem(BACKUP_KEY)));if(!restored)throw Error('backup');state=restored;state.last=Date.now();testSpeed=1;$('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;$('transcend-confirm').hidden=true;$('time-confirm').hidden=true;notify('スキップ前の進行に戻しました。');render();save();}catch{notify('退避した進行を読み込めませんでした。');}
};
try{$('test-restore').disabled=!localStorage.getItem(BACKUP_KEY);}catch{}
$('test-speed').onchange=()=>{const nextSpeed=Number($('test-speed').value);action(()=>{testSpeed=[1,10,100].includes(nextSpeed)?nextSpeed:1;notify(testSpeed>1?`テスト用${testSpeed}倍速を開始しました。生産とゲーム内時間が${testSpeed}倍で進みます。`:'通常速度に戻しました。');});};
$('research-next').onclick=()=>action(()=>{const candidates=TECHS.map((t,i)=>i).filter(i=>!$(`technology${i}`).hidden&&canTech(state,i)).sort((a,b)=>compare(techCost(state,a),techCost(state,b))||a-b);if(candidates.length)buyTech(state,candidates[0]);});
$('unlock-continue').onclick=()=>{$('unlock-screen').close();};
$('unlock-screen').addEventListener('close',()=>{const id=$('unlock-screen').dataset.unlock;const unlockSeen=Array.isArray(state.explainedUnlocks)?state.explainedUnlocks:[];if(id&&!unlockSeen.includes(id))unlockSeen.push(id);state.explainedUnlocks=unlockSeen;state.last=Date.now();render();save();});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>{state.last=Date.now();}));
$('gather').onclick=()=>action(()=>{const gain=gather(state);notify(`自分の働きで +${scoreNumber(gain)}。施設を購入して生産を増やしましょう。`);});
FACILITIES.forEach((_,i)=>$(`buy${i}`).onclick=()=>action(()=>{let count=0;const limit=qty==='max'?1000:qty;while(count<limit&&buy(state,i))count++;if(count)notify(`${FACILITIES[i].name}を${count}個購入しました。`);}));
TECHS.forEach((t,i)=>$(`tech${i}`).onclick=()=>action(()=>{if(buyTech(state,i))notify(`${t.name}を研究。${techEffect(i)}。`);}));
SKILLS.forEach((s,i)=>$(`skill${i}`).onclick=()=>action(()=>{if(buySkill(state,i))notify(`${s.name}を強化しました。`);}));
$('evolve').onclick=()=>action(()=>{if(evolve(state))notify(`${ERAS[state.era]}時代が始まりました。既存の施設は引き続き生産します。`);});
$('quantity').onchange=e=>{qty=e.target.value==='max'?'max':Number(e.target.value);render();};
$('inherit').onclick=()=>{
 workspaceForAction('legacy');
 update();render();if(!inheritance(state))return;
 showResetConfirmation('inherit-confirm');
};
$('inherit-confirm-no').onclick=()=>{$('reset-vignette').close();$('inherit-confirm').hidden=true;$('inherit').focus();};
$('inherit-confirm-yes').onclick=()=>action(()=>{
 const gain=inheritance(state);if(!gain)return;
 $('reset-vignette').close();inherit(state);$('inherit-confirm').hidden=true;
 notify(`文明を継承し、継承ポイント +${pointNumber(gain)} ptを獲得しました。継承スキルを強化できます。`);
 workspaceForAction('legacy');$('skill0').focus();
});
INNOVATIONS.forEach((n,i)=>$(`innovation-buy${i}`).onclick=()=>action(()=>{if(buyInnovation(state,i))notify(`${n.name}を強化しました。`);}));
TRANSCEND_SKILLS.forEach((n,i)=>$(`transcend-buy${i}`).onclick=()=>action(()=>{if(buyTranscendSkill(state,i))notify(`${n.name}を強化しました。生産指数 ${displayExponent(productionExponent(state))}。`);}));
$('transcend').onclick=()=>{update();render();if(!transcendGain(state))return;showResetConfirmation('transcend-confirm');};
$('transcend-confirm-no').onclick=()=>{$('reset-vignette').close();$('transcend-confirm').hidden=true;$('transcend').focus();};
$('transcend-confirm-yes').onclick=()=>action(()=>{const gain=transcendGain(state);if(!gain)return;$('reset-vignette').close();transcend(state);$('transcend-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;workspaceForAction('transcendence');notify(`文明を超越し、超越ポイント +${pointNumber(gain)} ptを獲得しました。指数を強化して${state.cleared?`1${goalLabel()}`:'1無量大数'}を目指しましょう。`);});
$('leap').onclick=()=>{workspaceForAction('innovation');update();render();if(!leapGain(state))return;showResetConfirmation('leap-confirm');};
$('leap-confirm-no').onclick=()=>{$('reset-vignette').close();$('leap-confirm').hidden=true;$('leap').focus();};
$('leap-confirm-yes').onclick=()=>action(()=>{
 const gain=leapGain(state);if(!gain)return;
 $('reset-vignette').close();leap(state);$('leap-confirm').hidden=true;$('inherit-confirm').hidden=true;
 workspaceForAction('innovation');notify(`文明が飛躍し、革新ポイント +${pointNumber(gain)} ptを獲得しました。情報時代が解放されました。革新ポイントでスキルを選びましょう。`);
 $('gather').focus();
});
TIME_SKILLS.forEach((n,i)=>$(`time-buy${i}`).onclick=()=>action(()=>{if(!buyTimeSkill(state,i))return;const effect=i===4?'他時代の施設とのシナジーを強化':i===5?'技術タブで時空研究を確認できます':i===8?(state.timeSkills[8]>=2?'全施設1000個で再開します':'通常技術を習得済みで再開します'):i===9?'宇宙時代から再開します':i===10?'時間跳躍で下位スキル・ポイント・回数を保持':`基礎生産指数 ${displayExponent(productionExponent(state))}`;notify(`${n.name}を1レベル強化しました。${effect}。`);}));
$('time-travel').onclick=()=>{update();render();if(!timeGain(state))return;showResetConfirmation('time-confirm');};
$('time-confirm-no').onclick=()=>{$('reset-vignette').close();$('time-confirm').hidden=true;$('time-travel').focus();};
$('time-confirm-yes').onclick=()=>action(()=>{const gain=timeGain(state);if(!gain)return;$('reset-vignette').close();timeTravel(state);for(const id of ['time-confirm','transcend-confirm','inherit-confirm','leap-confirm'])$(id).hidden=true;workspaceForAction('chronology');notify(`新しい時間軸へ進み、時空ポイント +${pointNumber(gain)} ptを獲得しました。時間スキルを強化できます。`);});
function acknowledgeClear(openTime){state.clearAcknowledged=true;$('clear-screen').close();if(openTime)workspaceForAction('chronology');render();save();}
$('clear-continue').onclick=()=>acknowledgeClear(false);$('clear-time-travel').onclick=()=>acknowledgeClear(true);
$('clear-screen').addEventListener('close',()=>{if(state.cleared){state.clearAcknowledged=true;save();}});
$('goal-continue').onclick=()=>{state.goalAcknowledged=true;$('goal-screen').close();render();save();};
$('goal-screen').addEventListener('close',()=>{if(state.goalReached){state.goalAcknowledged=true;save();}});
$('erase').onclick=()=>{if(confirm('このゲームのセーブを初期化しますか？進行は元に戻せません。')){state=fresh();$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;$('transcend-confirm').hidden=true;$('time-confirm').hidden=true;notify('新しい文明を開始しました。採集か施設購入から始めましょう。');render();save();}};
window.addEventListener('pagehide',()=>{update();save();});document.addEventListener('visibilitychange',()=>{update();render();save();});
document.querySelectorAll('[data-workspace]').forEach(el=>el.onclick=()=>setWorkspace(el.dataset.workspace));
document.querySelectorAll('.tree-node-select').forEach(el=>el.onclick=()=>{
 const tree=el.dataset.tree,index=Number(el.dataset.node);
 if(tree==='skills')selectedSkill=index;else if(tree==='innovation-tree')selectedInnovation=index;else if(tree==='time-tree')selectedTime=index;else selectedTranscend=index;
 render();const detail=$({'skills':'skill-detail','innovation-tree':'innovation-detail','time-tree':'time-detail','transcend-tree':'transcend-detail'}[tree]);
 inspectorOpener=el;$('time-inspector-title').textContent=detail.querySelector('h3').textContent;$('time-inspector-description').textContent=detail.querySelector('p').textContent;$('time-skill-inspector').showModal();$('time-inspector-close').focus();
});
$('tech-filter').onchange=render;$('show-researched').onchange=render;setWorkspace(workspace);
setInterval(()=>{update();render();},500);setInterval(save,5000);render();save();

$('time-inspector-close').onclick=()=>{$('time-skill-inspector').close();};
$('time-skill-inspector').addEventListener('close',()=>inspectorOpener?.focus());
$('test-reveal').onchange=render;

$('clear-log-download').onclick=()=>{const text=['文明のクリアログ',`現在のプレイ時間：${formatDuration(state.elapsed)}`,...state.clearLog.map(r=>`${r.type==='muryou'?'無量大数クリア':'不可説不可説転到達'}：${formatDuration(r.elapsed)} / ${formatNumber(r.score,r.type==='muryou'?'japanese':'buddhist')}点`)].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='文明クリアログ.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
