import {ERAS,FACILITIES,TECHS,SKILLS,fresh,advance,production,manualGain,gather,facilityRate,price,buy,techCost,techRequirement,canTech,buyTech,eraRequirement,canEvolve,evolve,inheritance,inherit,skillCost,buySkill,formatNumber,validateSave,migrateSave,leapGain,leap,leapThreshold,INNOVATIONS,innovationCost,innovationReady,buyInnovation,leapCheckpoint,techUnlocked,techCondition,techEffect,skillUnlocked,skillCondition,LEAP_RULES,effectiveSkillLevel,purchaseQuote,TRANSCEND_SKILLS,transcendSkillCost,transcendSkillReady,buyTranscendSkill,transcendGain,transcendThreshold,transcend,transcendCheckpoint,productionExponent,MURYOUTAISUU,TIME_SKILLS,timeSkillCost,timeSkillReady,buyTimeSkill,timeGain,timeTravel,timeThreshold,checkClear,clearCheckpoint,timeCheckpoint,nextResetReward,timeResearchPower,add,subtract,multiply,compare,log10,fromLog10,maxValue,BUDDHIST_GOAL_EXPONENT} from './engine.js';
const KEY='fukasetsu-civilization-v9';
const BACKUP_KEY='fukasetsu-test-checkpoint-backup-v5';
const LEGACY_KEY='fukasetsu-civilization-v2';
const $=id=>document.getElementById(id);
let selectedSkill=0,selectedInnovation=0,selectedTranscend=0,selectedTime=0,skipTarget='1';
let state=fresh(),qty=1,timeQty=1,storageOK=true,testSpeed=1,workspace=window.matchMedia('(max-width: 800px)').matches?'facilities':'technologies';
function displayNumber(n){return formatNumber(n,state.cleared?'buddhist':'japanese');}
function displayExponent(n){return n<1e6?n.toFixed(3):n.toExponential(2);}
function logProgress(value,target){return Math.max(0,Math.min(100,Math.max(0,log10(maxValue(1,value)))/Math.max(1,log10(target))*100));}
function finalProgress(value){const exponent=Math.max(68,log10(maxValue(1,value)));return Math.max(0,Math.min(100,Math.log10(exponent/68)/Math.log10(Number(BUDDHIST_GOAL_EXPONENT)/68)*100));}
function rewardTarget(kind,id){const next=nextResetReward(state,kind);$(id).hidden=!next;$(id).textContent=next?`次の報酬 +${displayNumber(next.nextGain)} pt（現在 +${displayNumber(next.gain)} pt） · 周回累計 ${displayNumber(next.target)} · あと ${displayNumber(next.remaining)} 文明力`:'';}
function timeUpgradeQuote(i){
 const limit=timeQty==='max'?TIME_SKILLS[i].max:timeQty,preview={...state,timeSkills:[...state.timeSkills]};
 let count=0,cost=0;
 if(timeSkillReady(state,i))while(count<limit&&preview.timeSkills[i]<TIME_SKILLS[i].max){const next=timeSkillCost(preview,i);if(cost+next>state.chronons)break;cost+=next;count++;preview.timeSkills[i]++;}
 return {count,cost:count?cost:timeSkillCost(state,i)};
}
function notify(text){$('notice').textContent=text;$('notice').title=text;}
try{
 const raw=localStorage.getItem(KEY)||localStorage.getItem('fukasetsu-civilization-v8')||localStorage.getItem('fukasetsu-civilization-v7')||localStorage.getItem('fukasetsu-civilization-v6')||localStorage.getItem('fukasetsu-civilization-v5')||localStorage.getItem('fukasetsu-civilization-v4')||localStorage.getItem('fukasetsu-civilization-v3')||localStorage.getItem(LEGACY_KEY);
 if(raw){const loaded=migrateSave(JSON.parse(raw));if(!loaded)throw Error('save');state=loaded;const away=Math.min(604800,Math.max(0,(Date.now()-state.last)/1000));advance(state,away);notify(`おかえりなさい。${(away/3600).toFixed(1)}時間分の生産を受け取りました。`);}
}catch{notify('セーブを読み込めませんでした。新しい文明を開始します。');}
state.last=Date.now();
$('facilities').innerHTML=FACILITIES.map((f,i)=>`<article class="layer facility-row" id="facility${i}" title="${ERAS[f.era]}：${f.description}"><div class="facility-summary"><h3>${f.name} <span id="owned${i}">0</span></h3><p id="output${i}"></p></div><button id="buy${i}">購入</button></article>`).join('');
$('technologies').innerHTML=TECHS.map((t,i)=>`<article class="layer technology" id="technology${i}"><span class="number">${t.kind==='time'?'時空研究':`${ERAS[t.era]}の技術`}</span><h3>${t.name}</h3><p>${techEffect(i)}</p><div class="requirement" id="techreq${i}"></div><button id="tech${i}">研究</button></article>`).join('');
$('skills').innerHTML=SKILLS.map((s,i)=>`<article class="layer skill-node" id="skill-node${i}" data-node="${i}"><span class="number">継承スキル</span><h3><button class="tree-node-select" data-tree="skills" data-node="${i}" type="button">${s.name}</button></h3><p>${s.description}</p><p class="prerequisite">${skillCondition(state,i)}</p><div class="requirement" id="skillreq${i}"></div><button id="skill${i}">強化</button></article>`).join('');
$('innovation-tree').innerHTML=INNOVATIONS.map((n,i)=>`<article class="layer innovation" id="innovation${i}" data-node="${i}"><span class="number">${i===0?'基盤':i===4?'融合':'発展の枝'}</span><h3><button class="tree-node-select" data-tree="innovation-tree" data-node="${i}" type="button">${n.name}</button></h3><p>${n.description}</p><p class="prerequisite">${n.requires.length?n.requires.map(([j,level])=>`${INNOVATIONS[j].name} Lv.${level}`).join(' ＋ '):'最初の飛躍から購入可能'}</p><div id="innovation-req${i}" class="requirement"></div><button id="innovation-buy${i}">革新ポイントで強化</button></article>`).join('');
$('transcend-tree').innerHTML=TRANSCEND_SKILLS.map((n,i)=>`<article class="layer" id="transcend-node${i}" data-node="${i}"><h3><button class="tree-node-select" data-tree="transcend-tree" data-node="${i}" type="button">${n.name}</button></h3><div id="transcend-req${i}" class="requirement"></div><button id="transcend-buy${i}">強化する</button></article>`).join('');
$('time-tree').innerHTML=TIME_SKILLS.map((n,i)=>`<article class="layer" id="time-node${i}" data-node="${i}"><h3><button class="tree-node-select" data-tree="time-tree" data-node="${i}" type="button">${n.name}</button></h3><p>${n.description}</p><div id="time-req${i}" class="requirement"></div><button id="time-buy${i}">強化する</button></article>`).join('');
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
function update(){const now=Date.now();advance(state,Math.max(0,(now-state.last)/1000)*testSpeed);state.last=now;}
function render(){
 checkClear(state);
 if(workspace==='chronology'&&!state.cleared)setWorkspace(window.matchMedia('(max-width: 800px)').matches?'facilities':'technologies');
 document.querySelector('[data-workspace=chronology]').hidden=!state.cleared;
 $('notation-mode').textContent=state.cleared?'八十華厳の数表記':'日本式の数表記';
 if(state.goalReached&&!state.goalAcknowledged&&!$('goal-screen').open&&!$('clear-screen').open){$('goal-time').textContent=`ゲーム内 ${(state.goalElapsed/3600).toFixed(1)}時間`;$('goal-screen').showModal();save();}
 if(state.cleared&&!state.clearAcknowledged&&!$('clear-screen').open&&!$('goal-screen').open){$('clear-score').textContent=formatNumber(state.clearScore,'japanese');$('clear-time').textContent=`ゲーム内 ${(state.clearElapsed/3600).toFixed(1)}時間`;$('clear-screen').showModal();save();}

 document.body.classList.toggle('all-eras',state.era>=3&&!eraRequirement(state));
 $('score').textContent=displayNumber(state.money);$('rate').textContent=`実時間1秒で +${displayNumber(multiply(production(state),testSpeed))} 文明力${testSpeed>1?`（テスト${testSpeed}倍速）`:''}`;
 $('time').textContent=`ゲーム内 ${(state.elapsed/3600).toFixed(1)}時間 / ${state.cycles+1}代目`;
 $('test-status').textContent=testSpeed>1?`${testSpeed}倍速で進行中`:'通常速度';
 $('test-speed').value=String(testSpeed);
 $('test-mode').classList.toggle('enabled',testSpeed>1);
 $('notation').textContent=`今周回の累計 ${displayNumber(state.earned)} · 全文明の累計 ${displayNumber(state.lifetime)}`;
 $('era').textContent=ERAS[state.era];
 $('gather-label').textContent=['採集する','収穫する','生産を手伝う','知識を集める','宇宙を観測する'][state.era];
 $('gather-gain').textContent=`+${displayNumber(manualGain(state))} 文明力`;
 document.querySelectorAll('[data-era]').forEach(el=>{const era=Number(el.dataset.era);el.classList.toggle('current',era===state.era);if(era===3)el.textContent=state.ascensions||state.transcendences||state.timeJumps?'04 情報':'04 情報（飛躍）';if(era===4)el.textContent=state.transcendSkills[0]?'05 宇宙':'05 宇宙（超越）';});
 FACILITIES.forEach((f,i)=>{
  const unlocked=f.era<=state.era;$(`facility${i}`).hidden=!unlocked;
  if(!unlocked)return;
  const quote=purchaseQuote(state,i,qty);
  $(`owned${i}`).textContent=`${state.owned[i]}施設`;$(`output${i}`).textContent=`毎秒 +${displayNumber(facilityRate(state,i))}`;
  $(`buy${i}`).textContent=state.owned[i]>=1000?'上限到達':`${displayNumber(quote.cost)} / ${quote.count}施設`;
  $(`buy${i}`).setAttribute('aria-label',`${f.name}：${state.owned[i]>=1000?'上限到達':`${quote.count}施設を${displayNumber(quote.cost)}文明力で購入`}`);
  $(`buy${i}`).disabled=!quote.affordable||state.owned[i]>=1000;
 });
 const filter=$('tech-filter').value,showResearched=$('show-researched').checked;
 let visibleTechs=0;
 TECHS.forEach((t,i)=>{
  const available=techUnlocked(state,i),researched=state.techs[i];
  const firstTier=t.kind!=='facility'||!TECHS.some((prior,j)=>prior.kind==='facility'&&prior.facility===t.facility&&j<i&&!state.techs[j]);
  const relevant=t.kind==='era'||t.kind==='click'||(t.kind==='time'&&state.timeSkills[5]>0)||(t.kind==='facility'&&state.owned[t.facility]>0)||(t.kind==='synergy'&&effectiveSkillLevel(state,5)>0);
  $(`technology${i}`).hidden=t.era>state.era||(filter!=='all'&&t.kind!==filter)||(researched&&!showResearched)||(!researched&&(!firstTier||!relevant));
  if(!$(`technology${i}`).hidden)visibleTechs++;
  $(`techreq${i}`).textContent=researched?(state.timeSkills[8]?'技術の永久保存で習得済み':state.transcendences&&t.era<=3&&t.kind!=='time'?'超越で習得済み':state.ascensions&&t.era<=2?'飛躍で習得済み':'研究済み'):`${available?'解放済み':'未解放'} · ${techCondition(state,i)} · ${displayNumber(techCost(state,i))} 文明力`;
  $(`tech${i}`).disabled=!canTech(state,i);$(`tech${i}`).textContent=researched?'研究済み':available?'研究する':'条件未達';
 });
 $('tech-empty').hidden=visibleTechs>0;
 const r=eraRequirement(state);
 $('era-condition').textContent=r?`累計 ${displayNumber(r.earned)}・${TECHS[r.tech].name}の研究・${displayNumber(r.cost)} 文明力が必要`:state.era===2?'情報時代は最初の文明の飛躍で解放されます。':state.era===3?'宇宙時代は超越後に宇宙の基盤で解放。':state.cleared?'宇宙時代に到達。時間スキルを重ねて1不可説不可説転へ。':'宇宙時代に到達。1無量大数を目指しましょう。';
 $('evolve').textContent=r?`${ERAS[state.era+1]}時代へ進む`:state.era===2?'情報時代は飛躍で解放':state.era===3?'宇宙時代は超越で解放':'全時代を解放済み';$('evolve').disabled=!canEvolve(state);
 const goalKind=state.cleared?'final':state.transcendences>0?'muryou':state.ascensions>=3?'transcend':state.ascensions>0?'leap':'era';
 const goal=goalKind==='final'?fromLog10(Number(BUDDHIST_GOAL_EXPONENT)):goalKind==='muryou'?MURYOUTAISUU:goalKind==='transcend'?transcendThreshold(state):goalKind==='leap'?leapThreshold(state):r?r.earned:1e11;
 const progressValue=goalKind==='final'||goalKind==='muryou'?state.money:state.earned;
 const pct=goalKind==='final'?finalProgress(progressValue):logProgress(progressValue,goal);
 $('progress').value=pct;$('percent').textContent=`${pct.toFixed(1)}%`;$('progress-label').textContent=goalKind==='final'?`${state.goalReached?'目標達成！':'1不可説不可説転への段階進捗'} · 10^${displayExponent(Math.max(0,log10(maxValue(1,state.money))))}`:goalKind==='muryou'?`1無量大数への桁成長 · 10^${log10(maxValue(1,state.money)).toFixed(1)} / 10^68`:goalKind==='transcend'?`初回超越への累計生産 · ${displayNumber(goal)}`:goalKind==='leap'?`次の飛躍への累計生産 · ${displayNumber(goal)}`:r?'次の時代への累計生産':'継承解放への累計生産';
 for(const [kind,id] of [['inheritance','inherit-next'],['leap','leap-next'],['transcend','transcend-next'],['time','time-next']])rewardTarget(kind,id);
 $('innovation-points').textContent=displayNumber(state.insight);$('innovation-target').textContent=state.ascensions?`革新は次の飛躍で獲得。周回累計 ${displayNumber(state.earned)} / ${displayNumber(leapThreshold(state))}。条件達成で${LEAP_RULES.baseReward}ポイント、条件の10倍なら${LEAP_RULES.baseReward+1}ポイント。`:'最初の飛躍は1ポイント。基盤で生産50倍と全継承スキルの実効Lv＋2を得ます。';
 $('points').textContent=displayNumber(state.points);$('gain').textContent=inheritance(state);
 const ready=inheritance(state)>0;
 $('inherit').disabled=!ready;$('inherit').textContent=ready?'文明を継承する':'継承条件を満たしてください';
 $('inherit-condition').textContent=[
  `${state.era>=2?'✓':'未達'} 工業時代に進む（現在：${ERAS[state.era]}）`,
  `${state.techs[4]?'✓':'未達'} 機械化を研究${state.techs[4]?'':`（${techCondition(state,4)}・${displayNumber(techCost(state,4))}文明力）`}`,
  `${compare(state.earned,1e11)>=0?'✓':'未達'} 今周回の累計生産1,000億（現在：${displayNumber(state.earned)}${compare(state.earned,1e11)<0?` / あと${displayNumber(subtract(1e11,state.earned))}`:''}）`,
 ].join('\n');
 $('inherit-confirm-gain').textContent=inheritance(state);
 $('inherit-confirm-yes').disabled=!ready;
 SKILLS.forEach((s,i)=>{
  const level=effectiveSkillLevel(state,i),max=level>=s.max,bonus=level-state.skills[i];$(`skillreq${i}`).textContent=`Lv. ${state.skills[i]}${bonus?` (+${bonus})`:''} · ${max?'上限':`${displayNumber(skillCost(state,i))}pt`}`;
  $(`skill${i}`).disabled=max||!skillUnlocked(state,i)||state.points<skillCost(state,i);$(`skill${i}`).textContent=max?'最大レベル':skillUnlocked(state,i)?'強化する':'条件未達';
  $(`skill-node${i}`).classList.toggle('purchased',state.skills[i]>0);$(`skill-node${i}`).classList.toggle('bonus-granted',state.skills[i]===0&&level>0);$(`skill-node${i}`).classList.toggle('locked',!skillUnlocked(state,i));$(`skill-node${i}`).classList.toggle('available',!max&&skillUnlocked(state,i)&&state.points>=skillCost(state,i));
  $(`skill-node${i}`).classList.toggle('selected-node',selectedSkill===i);document.querySelector(`#skill-node${i} .tree-node-select`)?.setAttribute('aria-pressed',String(selectedSkill===i));
 });
 $('leap-lock').hidden=state.leapUnlocked;
 $('leap-lock').textContent=`解放条件：継承3回（${state.cycles}/3）・スキル合計8レベル（${state.skills.reduce((a,b)=>a+b,0)}/8）`;
 $('leap-content').hidden=!state.leapUnlocked;
 $('insight').textContent=state.insight;
 $('leap-gain').textContent=leapGain(state);$('leap-confirm-gain').textContent=leapGain(state);
 $('leap').disabled=!leapGain(state);$('leap-confirm-yes').disabled=!leapGain(state);
 $('leap-condition').textContent=`${state.techs[5]?'✓':'未達'} 電力網を研究\n${compare(state.earned,leapThreshold(state))>=0?'✓':'未達'} 周回累計 ${displayNumber(leapThreshold(state))}（現在 ${displayNumber(state.earned)}）`;
 $('leap-effect').textContent='革新ポイントはスキルを購入すると効果を発揮します。購入済みの革新スキルと未使用ポイントは、継承・飛躍後も保持します。';
 $('innovation-panel').hidden=false;
 INNOVATIONS.forEach((n,i)=>{
  const ready=innovationReady(state,i),max=state.innovations[i]>=n.max,cost=innovationCost(state,i);
  $(`innovation-req${i}`).textContent=`Lv.${state.innovations[i]}/${n.max} · ${max?'上限':`${displayNumber(cost)}pt`}`;
  $(`innovation-buy${i}`).disabled=!state.leapUnlocked||max||!ready||state.insight<cost;$(`innovation-buy${i}`).textContent=max?'上限':!state.leapUnlocked?'飛躍で解放':!ready?'前提未達':state.insight<cost?'ポイント不足':'強化する';
  $(`innovation${i}`).classList.toggle('locked',!state.leapUnlocked||!ready);$(`innovation${i}`).classList.toggle('purchased',state.innovations[i]>0);$(`innovation${i}`).classList.toggle('available',!max&&state.leapUnlocked&&ready&&state.insight>=cost);$(`innovation${i}`).classList.toggle('selected-node',selectedInnovation===i);document.querySelector(`#innovation${i} .tree-node-select`).setAttribute('aria-pressed',String(selectedInnovation===i));
 });

 const sk=SKILLS[selectedSkill],node=INNOVATIONS[selectedInnovation];
 $('skill-detail').querySelector('h3').textContent=sk.name;
 $('skill-detail').querySelector('p').textContent=`${sk.name}：${sk.description}。通常の解放条件：${skillCondition(state,selectedSkill)}。${state.skills[selectedSkill]===0&&effectiveSkillLevel(state,selectedSkill)>0?'革新補正で解放済み':skillUnlocked(state,selectedSkill)?'解放済み':'未解放'}。購入Lv ${state.skills[selectedSkill]}＋革新補正 ${effectiveSkillLevel(state,selectedSkill)-state.skills[selectedSkill]}＝実効Lv ${effectiveSkillLevel(state,selectedSkill)}。`;
 $('innovation-detail').querySelector('h3').textContent=node.name;
 $('innovation-detail').querySelector('p').textContent=`${node.name}：${node.description}。${node.requires.length?`前提：${node.requires.map(([j,n])=>`${INNOVATIONS[j].name} Lv.${n}`).join(' ＋ ')}`:'最初の飛躍で購入可能'}。${state.leapUnlocked?'革新ポイントで強化できます。':'継承3回・購入スキル合計8レベルで飛躍を解放してください。'}`;
 $('transcend-points').textContent=displayNumber(state.horizon);
 const tg=transcendGain(state);$('transcend').disabled=!tg;$('transcend-confirm-yes').disabled=!tg;
 $('transcend-gain').textContent=tg;$('transcend-confirm-gain').textContent=tg;
 $('transcend-condition').textContent=`${state.ascensions>=3||state.transcendences>0||state.timeJumps>0?'✓':'未達'} 飛躍3回（超越後は不要） · ${state.era>=3&&state.techs[7]?'✓':'未達'} 情報時代・知能の連鎖 · 周回 ${displayNumber(state.earned)} / ${displayNumber(transcendThreshold(state))}`;
 $('transcend-summary').textContent=`超越${state.transcendences}回 · 生産指数 ${displayExponent(productionExponent(state))} · 目標 ${state.cleared?'1不可説不可説転':'1無量大数'}`;
 TRANSCEND_SKILLS.forEach((n,i)=>{
  const ready=transcendSkillReady(state,i),max=state.transcendSkills[i]>=n.max,cost=transcendSkillCost(state,i),card=$(`transcend-node${i}`);
  $(`transcend-req${i}`).textContent=`Lv. ${state.transcendSkills[i]}/${n.max} · ${max?'上限':`${cost}pt`}`;
  $(`transcend-buy${i}`).disabled=!ready||max||state.horizon<cost;$(`transcend-buy${i}`).textContent=max?'上限':!state.transcendences&&!state.timeJumps?'超越で解放':!ready?'前提未達':state.horizon<cost?'ポイント不足':'強化する';
  card.classList.toggle('purchased',state.transcendSkills[i]>0);card.classList.toggle('locked',!ready);card.classList.toggle('available',ready&&!max&&state.horizon>=cost);card.classList.toggle('selected-node',selectedTranscend===i);card.querySelector('.tree-node-select').setAttribute('aria-pressed',String(selectedTranscend===i));
 });
 const tn=TRANSCEND_SKILLS[selectedTranscend];$('transcend-detail').querySelector('h3').textContent=tn.name;$('transcend-detail').querySelector('p').textContent=`${tn.description}。${tn.requires.length?`前提：${tn.requires.map(([j,n])=>`${TRANSCEND_SKILLS[j].name} Lv.${n}`).join(' ＋ ')}`:'初回超越で購入可能'}。超越スキルと未使用ポイントは継承・飛躍・超越で保持します。${state.timeSkills[10]?'時間跳躍ではスキルをリセットし、未使用ポイントは保持します。':'時間跳躍ではスキルと未使用ポイントをリセットします。'}`;
 $('time-points').textContent=displayNumber(state.chronons);$('time-summary').textContent=`時間跳躍 ${state.timeJumps}回 · 基礎生産指数 ${displayExponent(productionExponent(state))}`;const finalPct=finalProgress(state.money);$('time-goal-progress').value=finalPct;$('time-goal-label').textContent=`1不可説不可説転への段階進捗 ${finalPct.toFixed(1)}%${state.goalReached?' · 達成済み':''}`;
 const timeReward=timeGain(state);$('time-travel').disabled=!timeReward;$('time-confirm-yes').disabled=!timeReward;$('time-gain').textContent=timeReward;$('time-confirm-gain').textContent=timeReward;
 $('time-condition').textContent=`周回累計 ${displayNumber(state.earned)} / ${displayNumber(timeThreshold(state))}。クリア記録・時空ポイント・時間スキルを保持します。`;
 const permanentTech=state.timeSkills[8]>0,permanentCosmos=state.timeSkills[9]>0,permanentPoints=state.timeSkills[10]>0;
 const startingEra=permanentCosmos?'宇宙時代':'情報時代',startingTech=permanentTech?'全技術':'情報時代までの技術';
 document.querySelectorAll('.permanent-start').forEach(el=>{el.hidden=!permanentTech&&!permanentCosmos;el.textContent=`時間スキルの開始効果：${[permanentTech?'全技術を習得済み':null,permanentCosmos?'宇宙時代から開始':null].filter(Boolean).join('・')}。工業までの各施設100個で再開します。`;});
 $('time-permanent-effects').textContent=[permanentTech?'技術の永久保存：全リセット後も全技術を習得済み':'技術の永久保存：未取得',permanentCosmos?'宇宙の継承：全リセット後も宇宙時代から開始':'宇宙の継承：未取得',permanentPoints?'文明の永久記録：時間跳躍後も未使用の継承・革新・超越ポイントを保持':'文明の永久記録：未取得'].join(' · ');
 $('time-reset-description').textContent=`文明力・施設・継承/革新/超越のスキルと回数をリセットします。${permanentPoints?'未使用の継承・革新・超越ポイントは保持します。':'未使用の継承・革新・超越ポイントもリセットします。'}クリア記録・時間跳躍回数・未使用時空ポイント・時間スキル・通算記録は保持します。革新と宇宙の基盤を付与し、${startingEra}・工業までの各施設100個・${startingTech}習得済みで開始します。`;
 $('time-confirm-reset').textContent=permanentPoints?`下位スキルと回数をリセットします。継承 ${displayNumber(state.points)} pt・革新 ${displayNumber(state.insight)} pt・超越 ${displayNumber(state.horizon)} pt は保持し、`:'超越を含む下位資産をリセットし、';

 TIME_SKILLS.forEach((n,i)=>{
  const ready=timeSkillReady(state,i),max=state.timeSkills[i]>=n.max,cost=timeSkillCost(state,i),quote=timeUpgradeQuote(i),card=$(`time-node${i}`);
  $(`time-req${i}`).textContent=`Lv. ${state.timeSkills[i]}/${n.max} · ${max?'上限':`次Lv ${cost}pt`}`;
  $(`time-buy${i}`).disabled=!ready||max||!quote.count;$(`time-buy${i}`).textContent=max?'上限':!state.timeJumps?'時間跳躍で解放':!ready?'前提未達':!quote.count?`不足 · ${quote.cost}pt`:`Lv +${quote.count} · ${quote.cost}pt`;
  $(`time-buy${i}`).setAttribute('aria-label',`${n.name}：${max?'上限':`${quote.count}レベルを${quote.cost}ポイントで強化`}`);
  card.classList.toggle('purchased',state.timeSkills[i]>0);card.classList.toggle('locked',!ready);card.classList.toggle('available',ready&&!max&&quote.count>0);card.classList.toggle('selected-node',selectedTime===i);card.querySelector('.tree-node-select').setAttribute('aria-pressed',String(selectedTime===i));
 });
 const selectedTimeNode=TIME_SKILLS[selectedTime];const timeEffectDetail=selectedTime===4?`現在の連携充足率：${FACILITIES.map((f,i)=>`${f.name} ${(Math.min(1,state.owned.reduce((sum,n,j)=>sum+(FACILITIES[j].era!==f.era?n:0),0)/3000)*100).toFixed(0)}%`).filter((_,i)=>i%3===0).join('・')}`:selectedTime===5?`習得済み時空研究 ${TECHS.filter((t,i)=>t.kind==='time'&&state.techs[i]).length}/3。現在の研究効果 ${timeResearchPower(state)}倍の桁成長。研究は「技術」タブの時空研究から購入できます`:'';$('time-detail').querySelector('h3').textContent=selectedTimeNode.name;$('time-detail').querySelector('p').textContent=`${selectedTimeNode.description}。${timeEffectDetail?`${timeEffectDetail}。`:''}${selectedTimeNode.requires.length?`前提：${selectedTimeNode.requires.map(([j,n])=>`${TIME_SKILLS[j].name} Lv.${n}`).join(' ＋ ')}`:'初回時間跳躍で購入可能'}。${state.timeSkills[selectedTime]>=selectedTimeNode.max?'レベル上限に到達':`次の強化 ${displayNumber(timeSkillCost(state,selectedTime))} pt`}。時間スキルは全てのリセットで保持します。`;
 if(!storageOK)notify('保存できません。このタブを閉じると進行が失われます。');
 fitWorkspace();drawTrees();
}
function fitWorkspace(){
 const container=document.querySelector('.workspace'),main=document.querySelector('main');
 const tail=main.getBoundingClientRect().bottom-container.getBoundingClientRect().bottom;
 const top=container.getBoundingClientRect().top+window.scrollY;
 document.documentElement.style.setProperty('--workspace-height',`${Math.max(250,window.innerHeight-top-tail-12)}px`);
}
function setWorkspace(name){
 workspace=name;
 document.body.classList.toggle('facility-view',name==='facilities');
 document.body.classList.toggle('time-view',name==='chronology');
 const mobile=window.matchMedia('(max-width: 800px)').matches;
 document.querySelectorAll('[data-panel]').forEach(el=>el.classList.toggle('active',el.dataset.panel===name||(!mobile&&name!=='chronology'&&el.dataset.panel==='facilities')||(!mobile&&name==='facilities'&&el.dataset.panel==='technologies')));
document.querySelectorAll('[data-workspace]').forEach(el=>{el.classList.toggle('selected',el.dataset.workspace===name);el.setAttribute('aria-pressed',String(el.dataset.workspace===name));});
 drawTrees();
}
function workspaceForAction(name){setWorkspace(name);}
window.addEventListener('resize',()=>{setWorkspace(workspace);fitWorkspace();});
function action(fn){update();fn();render();save();}
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
$('gather').onclick=()=>action(()=>{const gain=gather(state);notify(`自分の働きで +${displayNumber(gain)} 文明力。施設を購入して生産を増やしましょう。`);});
FACILITIES.forEach((_,i)=>$(`buy${i}`).onclick=()=>action(()=>{let count=0;const limit=qty==='max'?1000:qty;while(count<limit&&buy(state,i))count++;if(count)notify(`${FACILITIES[i].name}を${count}個購入しました。`);}));
TECHS.forEach((t,i)=>$(`tech${i}`).onclick=()=>action(()=>{if(buyTech(state,i))notify(`${t.name}を研究。${techEffect(i)}。`);}));
SKILLS.forEach((s,i)=>$(`skill${i}`).onclick=()=>action(()=>{if(buySkill(state,i))notify(`${s.name}を強化しました。効果は通常継承で残り、飛躍でリセットされます。`);}));
$('evolve').onclick=()=>action(()=>{if(evolve(state))notify(`${ERAS[state.era]}時代が始まりました。既存の施設は引き続き生産します。`);});
$('quantity').onchange=e=>{qty=e.target.value==='max'?'max':Number(e.target.value);render();};
$('inherit').onclick=()=>{
 workspaceForAction('legacy');
 update();render();if(!inheritance(state))return;
 $('inherit-confirm').hidden=false;$('inherit-confirm-yes').focus();
};
$('inherit-confirm-no').onclick=()=>{$('inherit-confirm').hidden=true;$('inherit').focus();};
$('inherit-confirm-yes').onclick=()=>action(()=>{
 const gain=inheritance(state);if(!gain)return;
 inherit(state);$('inherit-confirm').hidden=true;
 notify(`文明を継承し、${gain}ポイントを獲得しました。継承スキルを強化できます。`);
 workspaceForAction('legacy');$('skill0').focus();
});
INNOVATIONS.forEach((n,i)=>$(`innovation-buy${i}`).onclick=()=>action(()=>{if(buyInnovation(state,i))notify(`${n.name}を強化しました。効果は飛躍後も残ります。`);}));
TRANSCEND_SKILLS.forEach((n,i)=>$(`transcend-buy${i}`).onclick=()=>action(()=>{if(buyTranscendSkill(state,i))notify(`${n.name}を強化しました。生産指数 ${displayExponent(productionExponent(state))}。`);}));
$('transcend').onclick=()=>{update();render();if(!transcendGain(state))return;$('transcend-confirm').hidden=false;$('transcend-confirm-yes').focus();};
$('transcend-confirm-no').onclick=()=>{$('transcend-confirm').hidden=true;$('transcend').focus();};
$('transcend-confirm-yes').onclick=()=>action(()=>{const gain=transcendGain(state);if(!gain)return;transcend(state);$('transcend-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;workspaceForAction('transcendence');notify(`文明を超越しました。超越 +${gain}。指数を強化して${state.cleared?'1不可説不可説転':'1無量大数'}を目指しましょう。`);});
$('leap').onclick=()=>{workspaceForAction('innovation');update();render();if(!leapGain(state))return;$('leap-confirm').hidden=false;$('leap-confirm-yes').focus();};
$('leap-confirm-no').onclick=()=>{$('leap-confirm').hidden=true;$('leap').focus();};
$('leap-confirm-yes').onclick=()=>action(()=>{
 const gain=leapGain(state);if(!gain)return;
 leap(state);$('leap-confirm').hidden=true;$('inherit-confirm').hidden=true;
 workspaceForAction('innovation');notify(`文明が飛躍しました。革新 +${gain}。情報時代が解放されました。革新ポイントでスキルを選びましょう。`);
 $('gather').focus();
});
TIME_SKILLS.forEach((n,i)=>$(`time-buy${i}`).onclick=()=>action(()=>{let count=0;const limit=timeQty==='max'?n.max:timeQty;while(count<limit&&buyTimeSkill(state,i))count++;if(count){const effect=i===4?'他時代の施設とのシナジーを強化':i===5?'技術タブで時空研究を確認できます':i===8?'全技術を習得済みで再開します':i===9?'宇宙時代から再開します':i===10?'時間跳躍で未使用の下位ポイントを保持':`基礎生産指数 ${displayExponent(productionExponent(state))}`;notify(`${n.name}を${count}レベル強化しました。${effect}。`);}}));
$('time-quantity').onchange=e=>{timeQty=e.target.value==='max'?'max':Number(e.target.value);render();};
$('time-travel').onclick=()=>{update();render();if(!timeGain(state))return;$('time-confirm').hidden=false;$('time-confirm-yes').focus();};
$('time-confirm-no').onclick=()=>{$('time-confirm').hidden=true;$('time-travel').focus();};
$('time-confirm-yes').onclick=()=>action(()=>{const gain=timeGain(state);if(!gain)return;timeTravel(state);for(const id of ['time-confirm','transcend-confirm','inherit-confirm','leap-confirm'])$(id).hidden=true;workspaceForAction('chronology');notify(`新しい時間軸へ進みました。時空 +${gain}。時間スキルを強化できます。`);});
function acknowledgeClear(openTime){state.clearAcknowledged=true;$('clear-screen').close();if(openTime)workspaceForAction('chronology');render();save();}
$('clear-continue').onclick=()=>acknowledgeClear(false);$('clear-time-travel').onclick=()=>acknowledgeClear(true);
$('clear-screen').addEventListener('close',()=>{if(state.cleared){state.clearAcknowledged=true;save();}});
$('goal-continue').onclick=()=>{state.goalAcknowledged=true;$('goal-screen').close();render();save();};
$('goal-screen').addEventListener('close',()=>{if(state.goalReached){state.goalAcknowledged=true;save();}});
$('erase').onclick=()=>{if(confirm('この文明版のセーブをすべて消しますか？旧試作のセーブは消しません。')){state=fresh();$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;$('transcend-confirm').hidden=true;$('time-confirm').hidden=true;notify('新しい文明を開始しました。採集か施設購入から始めましょう。');render();save();}};
window.addEventListener('pagehide',()=>{update();save();});document.addEventListener('visibilitychange',()=>{update();render();save();});
document.querySelectorAll('[data-workspace]').forEach(el=>el.onclick=()=>setWorkspace(el.dataset.workspace));
 document.querySelectorAll('.tree-node-select').forEach(el=>el.onclick=()=>{if(el.dataset.tree==='skills')selectedSkill=Number(el.dataset.node);else if(el.dataset.tree==='innovation-tree')selectedInnovation=Number(el.dataset.node);else if(el.dataset.tree==='time-tree')selectedTime=Number(el.dataset.node);else selectedTranscend=Number(el.dataset.node);render();if(el.dataset.tree==='time-tree'&&window.matchMedia('(max-width: 800px)').matches){$('time-inspector-title').textContent=$('time-detail').querySelector('h3').textContent;$('time-inspector-description').textContent=$('time-detail').querySelector('p').textContent;$('time-skill-inspector').showModal();$('time-inspector-close').focus();}});
$('tech-filter').onchange=render;$('show-researched').onchange=render;setWorkspace(workspace);
setInterval(()=>{update();render();},500);setInterval(save,5000);render();save();

$('time-inspector-close').onclick=()=>{$('time-skill-inspector').close();document.querySelector(`#time-node${selectedTime} .tree-node-select`).focus();};
