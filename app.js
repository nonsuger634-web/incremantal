import {ERAS,FACILITIES,TECHS,SKILLS,fresh,advance,production,manualGain,gather,facilityRate,price,buy,techCost,techRequirement,canTech,buyTech,eraRequirement,canEvolve,evolve,inheritance,inherit,skillCost,buySkill,formatNumber,validateSave,migrateSave,leapGain,leap,leapThreshold,INNOVATIONS,innovationCost,innovationReady,buyInnovation,leapCheckpoint,techUnlocked,techCondition,techEffect,skillUnlocked,skillCondition,LEAP_RULES,effectiveSkillLevel,purchaseQuote,TRANSCEND_SKILLS,transcendSkillCost,transcendSkillReady,buyTranscendSkill,transcendGain,transcendThreshold,transcend,transcendCheckpoint,productionExponent,MURYOUTAISUU} from './engine.js';
const KEY='fukasetsu-civilization-v7';
const BACKUP_KEY='fukasetsu-test-checkpoint-backup-v5';
const LEGACY_KEY='fukasetsu-civilization-v2';
const $=id=>document.getElementById(id);
let selectedSkill=0,selectedInnovation=0,selectedTranscend=0,skipTarget='1';
let state=fresh(),qty=1,storageOK=true,testSpeed=1,workspace=window.matchMedia('(max-width: 800px)').matches?'facilities':'technologies';
function notify(text){$('notice').textContent=text;$('notice').title=text;}
try{
 const raw=localStorage.getItem(KEY)||localStorage.getItem('fukasetsu-civilization-v6')||localStorage.getItem('fukasetsu-civilization-v5')||localStorage.getItem('fukasetsu-civilization-v4')||localStorage.getItem('fukasetsu-civilization-v3')||localStorage.getItem(LEGACY_KEY);
 if(raw){const loaded=migrateSave(JSON.parse(raw));if(!loaded)throw Error('save');state=loaded;const away=Math.min(604800,Math.max(0,(Date.now()-state.last)/1000));advance(state,away);notify(`おかえりなさい。${(away/3600).toFixed(1)}時間分の生産を受け取りました。`);}
}catch{notify('セーブを読み込めませんでした。新しい文明を開始します。');}
state.last=Date.now();
$('facilities').innerHTML=FACILITIES.map((f,i)=>`<article class="layer facility-row" id="facility${i}" title="${ERAS[f.era]}：${f.description}"><div class="facility-summary"><h3>${f.name} <span id="owned${i}">0</span></h3><p id="output${i}"></p></div><button id="buy${i}">購入</button></article>`).join('');
$('technologies').innerHTML=TECHS.map((t,i)=>`<article class="layer technology" id="technology${i}"><span class="number">${ERAS[t.era]}の技術</span><h3>${t.name}</h3><p>${techEffect(i)}</p><div class="requirement" id="techreq${i}"></div><button id="tech${i}">研究</button></article>`).join('');
$('skills').innerHTML=SKILLS.map((s,i)=>`<article class="layer skill-node" id="skill-node${i}" data-node="${i}"><span class="number">継承スキル</span><h3><button class="tree-node-select" data-tree="skills" data-node="${i}" type="button">${s.name}</button></h3><p>${s.description}</p><p class="prerequisite">${skillCondition(state,i)}</p><div class="requirement" id="skillreq${i}"></div><button id="skill${i}">強化</button></article>`).join('');
$('innovation-tree').innerHTML=INNOVATIONS.map((n,i)=>`<article class="layer innovation" id="innovation${i}" data-node="${i}"><span class="number">${i===0?'基盤':i===4?'融合':'発展の枝'}</span><h3><button class="tree-node-select" data-tree="innovation-tree" data-node="${i}" type="button">${n.name}</button></h3><p>${n.description}</p><p class="prerequisite">${n.requires.length?n.requires.map(([j,level])=>`${INNOVATIONS[j].name} Lv.${level}`).join(' ＋ '):'最初の飛躍から購入可能'}</p><div id="innovation-req${i}" class="requirement"></div><button id="innovation-buy${i}">革新ポイントで強化</button></article>`).join('');
$('transcend-tree').innerHTML=TRANSCEND_SKILLS.map((n,i)=>`<article class="layer" id="transcend-node${i}" data-node="${i}"><h3><button class="tree-node-select" data-tree="transcend-tree" data-node="${i}" type="button">${n.name}</button></h3><div id="transcend-req${i}" class="requirement"></div><button id="transcend-buy${i}">強化する</button></article>`).join('');
for(const id of ['skills','innovation-tree','transcend-tree']){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('tree-connections');svg.setAttribute('aria-hidden','true');$(id).prepend(svg);
}
function drawTrees(){
 for(const [id,edges] of [['skills',[[0,2],[0,4],[0,5]]],['innovation-tree',[[0,1],[0,2],[0,3],[1,4],[2,4]]],['transcend-tree',[[0,1],[0,2],[1,3],[2,3]]]]){
  const tree=$(id),svg=tree.querySelector('svg');if(!tree.offsetWidth)continue;
  const box=tree.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${tree.offsetWidth} ${tree.offsetHeight}`);
  svg.innerHTML=edges.map(([source,target])=>{
   const from=tree.querySelector(`[data-node="${source}"]`),to=tree.querySelector(`[data-node="${target}"]`),a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
   const x=a.left+a.width/2-box.left,y=a.bottom-box.top,tx=b.left+b.width/2-box.left,ty=b.top-box.top;
   const mid=ty-12;
   const route=`M ${x} ${y} V ${mid} H ${tx} V ${ty}`;
   return `<path class="${(to.classList.contains('purchased')||to.classList.contains('bonus-granted'))?'completed':''}" d="${route}"/>`;
  }).join('');
 }
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;notify('保存できません。このタブを閉じると進行が失われます。');}}
function update(){const now=Date.now();advance(state,Math.max(0,(now-state.last)/1000)*testSpeed);state.last=now;}
function render(){
 document.body.classList.toggle('all-eras',state.era>=3&&!eraRequirement(state));
 $('score').textContent=formatNumber(state.money);$('rate').textContent=`実時間1秒で +${formatNumber(production(state)*testSpeed)} 文明力${testSpeed>1?`（テスト${testSpeed}倍速）`:''}`;
 $('time').textContent=`ゲーム内 ${(state.elapsed/3600).toFixed(1)}時間 / ${state.cycles+1}代目`;
 $('test-status').textContent=testSpeed>1?`${testSpeed}倍速で進行中`:'通常速度';
 $('test-speed').value=String(testSpeed);
 $('test-mode').classList.toggle('enabled',testSpeed>1);
 $('notation').textContent=`今周回の累計 ${formatNumber(state.earned)} · 全文明の累計 ${formatNumber(state.lifetime)}`;
 $('era').textContent=ERAS[state.era];
 $('gather-label').textContent=['採集する','収穫する','生産を手伝う','知識を集める','宇宙を観測する'][state.era];
 $('gather-gain').textContent=`+${formatNumber(manualGain(state))} 文明力`;
 document.querySelectorAll('[data-era]').forEach(el=>{const era=Number(el.dataset.era);el.classList.toggle('current',era===state.era);if(era===3)el.textContent=state.ascensions||state.transcendences?'04 情報':'04 情報（飛躍）';if(era===4)el.textContent=state.transcendSkills[0]?'05 宇宙':'05 宇宙（超越）';});
 FACILITIES.forEach((f,i)=>{
  const unlocked=f.era<=state.era;$(`facility${i}`).hidden=!unlocked;
  if(!unlocked)return;
  const quote=purchaseQuote(state,i,qty);
  $(`owned${i}`).textContent=`${state.owned[i]}施設`;$(`output${i}`).textContent=`毎秒 +${formatNumber(facilityRate(state,i))}`;
  $(`buy${i}`).textContent=state.owned[i]>=1000?'上限到達':`${formatNumber(quote.cost)} / ${quote.count}施設`;
  $(`buy${i}`).setAttribute('aria-label',`${f.name}：${state.owned[i]>=1000?'上限到達':`${quote.count}施設を${formatNumber(quote.cost)}文明力で購入`}`);
  $(`buy${i}`).disabled=!quote.affordable||state.owned[i]>=1000;
 });
 const filter=$('tech-filter').value,showResearched=$('show-researched').checked;
 let visibleTechs=0;
 TECHS.forEach((t,i)=>{
  const available=techUnlocked(state,i),researched=state.techs[i];
  const firstTier=t.kind!=='facility'||!TECHS.some((prior,j)=>prior.kind==='facility'&&prior.facility===t.facility&&j<i&&!state.techs[j]);
  const relevant=t.kind==='era'||t.kind==='click'||(t.kind==='facility'&&state.owned[t.facility]>0)||(t.kind==='synergy'&&effectiveSkillLevel(state,5)>0);
  $(`technology${i}`).hidden=t.era>state.era||(filter!=='all'&&t.kind!==filter)||(researched&&!showResearched)||(!researched&&(!firstTier||!relevant));
  if(!$(`technology${i}`).hidden)visibleTechs++;
  $(`techreq${i}`).textContent=researched?(state.transcendences&&t.era<=3?'超越で習得済み':state.ascensions&&t.era<=2?'飛躍で習得済み':'研究済み'):`${available?'解放済み':'未解放'} · ${techCondition(state,i)} · ${formatNumber(techCost(state,i))} 文明力`;
  $(`tech${i}`).disabled=!canTech(state,i);$(`tech${i}`).textContent=researched?'研究済み':available?'研究する':'条件未達';
 });
 $('tech-empty').hidden=visibleTechs>0;
 const r=eraRequirement(state);
 $('era-condition').textContent=r?`累計 ${formatNumber(r.earned)}・${TECHS[r.tech].name}の研究・${formatNumber(r.cost)} 文明力が必要`:state.era===2?'情報時代は最初の文明の飛躍で解放されます。':state.era===3?'宇宙時代は超越後に宇宙の基盤で解放。':'宇宙時代に到達。1無量大数を目指しましょう。';
 $('evolve').textContent=r?`${ERAS[state.era+1]}時代へ進む`:state.era===2?'情報時代は飛躍で解放':state.era===3?'宇宙時代は超越で解放':'全時代を解放済み';$('evolve').disabled=!canEvolve(state);
 const goalKind=state.transcendences>0?'muryou':state.ascensions>=3?'transcend':state.ascensions>0?'leap':'era';
 const goal=goalKind==='muryou'?MURYOUTAISUU:goalKind==='transcend'?transcendThreshold(state):goalKind==='leap'?leapThreshold(state):r?r.earned:1e11;
 const pct=goalKind==='muryou'?Math.max(0,Math.min(100,Math.log10(Math.max(1,state.earned))/68*100)):Math.min(100,state.earned/goal*100);
 $('progress').value=pct;$('percent').textContent=`${pct.toFixed(1)}%`;$('progress-label').textContent=goalKind==='muryou'?state.earned>=MURYOUTAISUU?'1無量大数の累計生産を達成！':`1無量大数への桁成長 · 10^${Math.log10(Math.max(1,state.earned)).toFixed(1)} / 10^68`:goalKind==='transcend'?`初回超越への累計生産 · ${formatNumber(goal)}`:goalKind==='leap'?`次の飛躍への累計生産 · ${formatNumber(goal)} · ${leapGain(state)?`獲得可 ${leapGain(state)}`:`条件達成で ${LEAP_RULES.baseReward}`}革新ポイント`:r?'次の時代への累計生産':'継承解放への累計生産';
 $('innovation-points').textContent=formatNumber(state.insight);$('innovation-target').textContent=state.ascensions?`革新は次の飛躍で獲得。周回累計 ${formatNumber(state.earned)} / ${formatNumber(leapThreshold(state))}。条件達成で${LEAP_RULES.baseReward}ポイント、条件の10倍なら${LEAP_RULES.baseReward+1}ポイント。`:'最初の飛躍は1ポイント。基盤で生産50倍と全継承スキルの実効Lv＋2を得ます。';
 $('points').textContent=formatNumber(state.points);$('gain').textContent=inheritance(state);
 const ready=inheritance(state)>0;
 $('inherit').disabled=!ready;$('inherit').textContent=ready?'文明を継承する':'継承条件を満たしてください';
 $('inherit-condition').textContent=[
  `${state.era>=2?'✓':'未達'} 工業時代に進む（現在：${ERAS[state.era]}）`,
  `${state.techs[4]?'✓':'未達'} 機械化を研究${state.techs[4]?'':`（${techCondition(state,4)}・${formatNumber(techCost(state,4))}文明力）`}`,
  `${state.earned>=1e11?'✓':'未達'} 今周回の累計生産1,000億（現在：${formatNumber(state.earned)}${state.earned<1e11?` / あと${formatNumber(1e11-state.earned)}`:''}）`,
 ].join('\n');
 $('inherit-confirm-gain').textContent=inheritance(state);
 $('inherit-confirm-yes').disabled=!ready;
 SKILLS.forEach((s,i)=>{
  const level=effectiveSkillLevel(state,i),max=level>=s.max,bonus=level-state.skills[i];$(`skillreq${i}`).textContent=`Lv. ${state.skills[i]}${bonus?` (+${bonus})`:''} · ${max?'上限':`${formatNumber(skillCost(state,i))}pt`}`;
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
 $('leap-condition').textContent=`${state.techs[5]?'✓':'未達'} 電力網を研究\n${state.earned>=leapThreshold(state)?'✓':'未達'} 周回累計 ${formatNumber(leapThreshold(state))}（現在 ${formatNumber(state.earned)}）`;
 $('leap-effect').textContent='革新ポイントはスキルを購入すると効果を発揮します。購入済みの革新スキルと未使用ポイントは、継承・飛躍後も保持します。';
 $('innovation-panel').hidden=false;
 INNOVATIONS.forEach((n,i)=>{
  const ready=innovationReady(state,i),max=state.innovations[i]>=n.max,cost=innovationCost(state,i);
  $(`innovation-req${i}`).textContent=`Lv.${state.innovations[i]}/${n.max} · ${max?'上限':`${formatNumber(cost)}pt`}`;
  $(`innovation-buy${i}`).disabled=!state.leapUnlocked||max||!ready||state.insight<cost;$(`innovation-buy${i}`).textContent=max?'上限':!state.leapUnlocked?'飛躍で解放':!ready?'前提未達':state.insight<cost?'ポイント不足':'強化する';
  $(`innovation${i}`).classList.toggle('locked',!state.leapUnlocked||!ready);$(`innovation${i}`).classList.toggle('purchased',state.innovations[i]>0);$(`innovation${i}`).classList.toggle('available',!max&&state.leapUnlocked&&ready&&state.insight>=cost);$(`innovation${i}`).classList.toggle('selected-node',selectedInnovation===i);document.querySelector(`#innovation${i} .tree-node-select`).setAttribute('aria-pressed',String(selectedInnovation===i));
 });

 const sk=SKILLS[selectedSkill],node=INNOVATIONS[selectedInnovation];
 $('skill-detail').querySelector('h3').textContent=sk.name;
 $('skill-detail').querySelector('p').textContent=`${sk.name}：${sk.description}。通常の解放条件：${skillCondition(state,selectedSkill)}。${state.skills[selectedSkill]===0&&effectiveSkillLevel(state,selectedSkill)>0?'革新補正で解放済み':skillUnlocked(state,selectedSkill)?'解放済み':'未解放'}。購入Lv ${state.skills[selectedSkill]}＋革新補正 ${effectiveSkillLevel(state,selectedSkill)-state.skills[selectedSkill]}＝実効Lv ${effectiveSkillLevel(state,selectedSkill)}。`;
 $('innovation-detail').querySelector('h3').textContent=node.name;
 $('innovation-detail').querySelector('p').textContent=`${node.name}：${node.description}。${node.requires.length?`前提：${node.requires.map(([j,n])=>`${INNOVATIONS[j].name} Lv.${n}`).join(' ＋ ')}`:'最初の飛躍で購入可能'}。${state.leapUnlocked?'革新ポイントで強化できます。':'継承3回・購入スキル合計8レベルで飛躍を解放してください。'}`;
 $('transcend-points').textContent=formatNumber(state.horizon);
 const tg=transcendGain(state);$('transcend').disabled=!tg;$('transcend-confirm-yes').disabled=!tg;
 $('transcend-gain').textContent=tg;$('transcend-confirm-gain').textContent=tg;
 $('transcend-condition').textContent=`${state.ascensions>=3||state.transcendences>0?'✓':'未達'} 飛躍3回（超越後は不要） · ${state.era>=3&&state.techs[7]?'✓':'未達'} 情報時代・知能の連鎖 · 周回 ${formatNumber(state.earned)} / ${formatNumber(transcendThreshold(state))}`;
 $('transcend-summary').textContent=`超越${state.transcendences}回 · 生産指数 ${productionExponent(state).toFixed(3)} · 目標 1無量大数`;
 TRANSCEND_SKILLS.forEach((n,i)=>{
  const ready=transcendSkillReady(state,i),max=state.transcendSkills[i]>=n.max,cost=transcendSkillCost(state,i),card=$(`transcend-node${i}`);
  $(`transcend-req${i}`).textContent=`Lv. ${state.transcendSkills[i]}/${n.max} · ${max?'上限':`${cost}pt`}`;
  $(`transcend-buy${i}`).disabled=!ready||max||state.horizon<cost;$(`transcend-buy${i}`).textContent=max?'上限':!state.transcendences?'超越で解放':!ready?'前提未達':state.horizon<cost?'ポイント不足':'強化する';
  card.classList.toggle('purchased',state.transcendSkills[i]>0);card.classList.toggle('locked',!ready);card.classList.toggle('available',ready&&!max&&state.horizon>=cost);card.classList.toggle('selected-node',selectedTranscend===i);card.querySelector('.tree-node-select').setAttribute('aria-pressed',String(selectedTranscend===i));
 });
 const tn=TRANSCEND_SKILLS[selectedTranscend];$('transcend-detail').querySelector('h3').textContent=tn.name;$('transcend-detail').querySelector('p').textContent=`${tn.description}。${tn.requires.length?`前提：${tn.requires.map(([j,n])=>`${TRANSCEND_SKILLS[j].name} Lv.${n}`).join(' ＋ ')}`:'初回超越で購入可能'}。超越スキルと未使用ポイントは全てのリセットで保持します。`;
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
 const mobile=window.matchMedia('(max-width: 800px)').matches;
 document.querySelectorAll('[data-panel]').forEach(el=>el.classList.toggle('active',el.dataset.panel===name||(!mobile&&el.dataset.panel==='facilities')||(!mobile&&name==='facilities'&&el.dataset.panel==='technologies')));
document.querySelectorAll('[data-workspace]').forEach(el=>{el.classList.toggle('selected',el.dataset.workspace===name);el.setAttribute('aria-pressed',String(el.dataset.workspace===name));});
 drawTrees();
}
function workspaceForAction(name){setWorkspace(name);}
window.addEventListener('resize',()=>{setWorkspace(workspace);fitWorkspace();});
function action(fn){update();fn();render();save();}
$('test-skip').onclick=()=>{skipTarget=$('test-checkpoint').value;const upper=skipTarget==='transcend';$('test-skip-title').textContent=upper?'初回超越直後へ移動しますか？':`${skipTarget}回目の飛躍直後へ移動しますか？`;$('test-skip-description').textContent=upper?'現在の進行を退避し、初回超越直後・未使用超越1ポイント・革新の基盤あり・狩猟各10施設・情報までの技術習得済みへ移動します。宇宙の基盤を購入して指数成長を試せます。「スキップ前へ戻す」で復元できます。':`現在の進行を退避し、狩猟時代・施設なし・文明力10・革新ポイント${1+(Number(skipTarget)-1)*LEAP_RULES.baseReward}・工業までの技術習得済みへ移動します。革新スキルは未購入です。「スキップ前へ戻す」で復元できます。`;$('test-skip-confirm').hidden=false;$('test-skip-yes').focus();};
$('test-skip-no').onclick=()=>{$('test-skip-confirm').hidden=true;$('test-skip').focus();};
$('test-skip-yes').onclick=()=>{
 update();
 try{localStorage.setItem(BACKUP_KEY,JSON.stringify(state));}catch{notify('進行を退避できないため、スキップを中止しました。');return;}
 state=skipTarget==='transcend'?transcendCheckpoint():leapCheckpoint(Number(skipTarget));testSpeed=1;qty=1;$('quantity').value='1';
 $('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;
 $('transcend-confirm').hidden=true;$('test-restore').disabled=false;workspaceForAction(skipTarget==='transcend'?'transcendence':'innovation');notify(skipTarget==='transcend'?'初回超越直後へ移動しました。超越1ポイントで宇宙の基盤を購入できます。':`${skipTarget}回目の飛躍直後へ移動しました。革新ポイントは${state.insight}です。`);render();save();
};
$('test-restore').onclick=()=>{
 try{const restored=migrateSave(JSON.parse(localStorage.getItem(BACKUP_KEY)));if(!restored)throw Error('backup');state=restored;state.last=Date.now();testSpeed=1;$('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;$('transcend-confirm').hidden=true;notify('スキップ前の進行に戻しました。');render();save();}catch{notify('退避した進行を読み込めませんでした。');}
};
try{$('test-restore').disabled=!localStorage.getItem(BACKUP_KEY);}catch{}
$('test-speed').onchange=()=>{const nextSpeed=Number($('test-speed').value);action(()=>{testSpeed=[1,10,100].includes(nextSpeed)?nextSpeed:1;notify(testSpeed>1?`テスト用${testSpeed}倍速を開始しました。生産とゲーム内時間が${testSpeed}倍で進みます。`:'通常速度に戻しました。');});};
$('gather').onclick=()=>action(()=>{const gain=gather(state);notify(`自分の働きで +${formatNumber(gain)} 文明力。施設を購入して生産を増やしましょう。`);});
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
TRANSCEND_SKILLS.forEach((n,i)=>$(`transcend-buy${i}`).onclick=()=>action(()=>{if(buyTranscendSkill(state,i))notify(`${n.name}を強化しました。生産指数 ${productionExponent(state).toFixed(3)}。`);}));
$('transcend').onclick=()=>{update();render();if(!transcendGain(state))return;$('transcend-confirm').hidden=false;$('transcend-confirm-yes').focus();};
$('transcend-confirm-no').onclick=()=>{$('transcend-confirm').hidden=true;$('transcend').focus();};
$('transcend-confirm-yes').onclick=()=>action(()=>{const gain=transcendGain(state);if(!gain)return;transcend(state);$('transcend-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;workspaceForAction('transcendence');notify(`文明を超越しました。超越 +${gain}。指数を強化して1無量大数を目指しましょう。`);});
$('leap').onclick=()=>{workspaceForAction('legacy');update();render();if(!leapGain(state))return;$('leap-confirm').hidden=false;$('leap-confirm-yes').focus();};
$('leap-confirm-no').onclick=()=>{$('leap-confirm').hidden=true;$('leap').focus();};
$('leap-confirm-yes').onclick=()=>action(()=>{
 const gain=leapGain(state);if(!gain)return;
 leap(state);$('leap-confirm').hidden=true;$('inherit-confirm').hidden=true;
 workspaceForAction('innovation');notify(`文明が飛躍しました。革新 +${gain}。情報時代が解放されました。革新ポイントでスキルを選びましょう。`);
 $('gather').focus();
});
$('erase').onclick=()=>{if(confirm('この文明版のセーブをすべて消しますか？旧試作のセーブは消しません。')){state=fresh();$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;$('transcend-confirm').hidden=true;notify('新しい文明を開始しました。採集か施設購入から始めましょう。');render();save();}};
window.addEventListener('pagehide',()=>{update();save();});document.addEventListener('visibilitychange',()=>{update();render();save();});
document.querySelectorAll('[data-workspace]').forEach(el=>el.onclick=()=>setWorkspace(el.dataset.workspace));
 document.querySelectorAll('.tree-node-select').forEach(el=>el.onclick=()=>{if(el.dataset.tree==='skills')selectedSkill=Number(el.dataset.node);else if(el.dataset.tree==='innovation-tree')selectedInnovation=Number(el.dataset.node);else selectedTranscend=Number(el.dataset.node);render();});
$('tech-filter').onchange=render;$('show-researched').onchange=render;setWorkspace(workspace);
setInterval(()=>{update();render();},500);setInterval(save,5000);render();save();
