import {ERAS,FACILITIES,TECHS,SKILLS,fresh,advance,production,manualGain,gather,facilityRate,price,buy,techCost,techRequirement,canTech,buyTech,eraRequirement,canEvolve,evolve,inheritance,inherit,skillCost,buySkill,formatNumber,validateSave,migrateSave,leapGain,leap,leapThreshold,INNOVATIONS,innovationCost,innovationReady,buyInnovation,firstLeapCheckpoint,techUnlocked,techCondition,techEffect,skillUnlocked,skillCondition,LEAP_RULES} from './engine.js';
const KEY='fukasetsu-civilization-v6';
const BACKUP_KEY='fukasetsu-test-checkpoint-backup-v5';
const LEGACY_KEY='fukasetsu-civilization-v2';
const $=id=>document.getElementById(id);
let state=fresh(),qty=1,storageOK=true,testSpeed=1,workspace=window.matchMedia('(max-width: 800px)').matches?'facilities':'technologies';
function notify(text){$('notice').textContent=text;}
try{
 const raw=localStorage.getItem(KEY)||localStorage.getItem('fukasetsu-civilization-v5')||localStorage.getItem('fukasetsu-civilization-v4')||localStorage.getItem('fukasetsu-civilization-v3')||localStorage.getItem(LEGACY_KEY);
 if(raw){const loaded=migrateSave(JSON.parse(raw));if(!loaded)throw Error('save');state=loaded;const away=Math.min(604800,Math.max(0,(Date.now()-state.last)/1000));advance(state,away);notify(`おかえりなさい。${(away/3600).toFixed(1)}時間分の生産を受け取りました。`);}
}catch{notify('セーブを読み込めませんでした。新しい文明を開始します。');}
state.last=Date.now();
$('facilities').innerHTML=FACILITIES.map((f,i)=>`<article class="layer" id="facility${i}"><span class="number">${ERAS[f.era]}</span><h3>${f.name}</h3><p>${f.description}</p><div class="resource"><strong id="owned${i}">0</strong> <span>施設</span></div><p id="output${i}"></p><div class="requirement" id="cost${i}"></div><button id="buy${i}">購入</button></article>`).join('');
$('technologies').innerHTML=TECHS.map((t,i)=>`<article class="layer technology" id="technology${i}"><span class="number">${ERAS[t.era]}の技術</span><h3>${t.name}</h3><p>${techEffect(i)}</p><div class="requirement" id="techreq${i}"></div><button id="tech${i}">研究</button></article>`).join('');
$('skills').innerHTML=SKILLS.map((s,i)=>`<article class="layer"><span class="number">継承スキル</span><h3>${s.name}</h3><p>${s.description}</p><div class="requirement" id="skillreq${i}"></div><button id="skill${i}">強化</button></article>`).join('');
$('innovation-tree').innerHTML=INNOVATIONS.map((n,i)=>`<article class="layer innovation" id="innovation${i}"><span class="number">${i===0?'基盤':i===4?'融合':'発展の枝'}</span><h3>${n.name}</h3><p>${n.description}</p><p class="prerequisite">${n.requires.length?n.requires.map(([j,level])=>`${INNOVATIONS[j].name} Lv.${level}`).join(' ＋ '):'最初の飛躍から購入可能'}</p><div id="innovation-req${i}" class="requirement"></div><button id="innovation-buy${i}">革新ポイントで強化</button></article>`).join('');
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;notify('保存できません。このタブを閉じると進行が失われます。');}}
function update(){const now=Date.now();advance(state,Math.max(0,(now-state.last)/1000)*testSpeed);state.last=now;}
function render(){
 $('score').textContent=formatNumber(state.money);$('rate').textContent=`実時間1秒で +${formatNumber(production(state)*testSpeed)} 文明力${testSpeed===10?'（テスト10倍速）':''}`;
 $('time').textContent=`ゲーム内 ${(state.elapsed/3600).toFixed(1)}時間 / ${state.cycles+1}代目`;
 $('test-status').textContent=testSpeed===10?'10倍速で進行中':'通常速度';
 $('test-speed').checked=testSpeed===10;
 $('test-mode').classList.toggle('enabled',testSpeed===10);
 $('notation').textContent=`今周回の累計 ${formatNumber(state.earned)} · 全文明の累計 ${formatNumber(state.lifetime)}`;
 $('era').textContent=ERAS[state.era];
 $('gather-label').textContent=['採集する','収穫する','生産を手伝う','知識を集める'][state.era];
 $('gather-gain').textContent=`+${formatNumber(manualGain(state))} 文明力`;
 document.querySelectorAll('[data-era]').forEach(el=>{el.classList.toggle('current',Number(el.dataset.era)===state.era);if(Number(el.dataset.era)===3)el.textContent=state.ascensions?'04 情報':'04 情報（飛躍で解放）';});
 FACILITIES.forEach((f,i)=>{
  const unlocked=f.era<=state.era;$(`facility${i}`).hidden=!unlocked;
  $(`owned${i}`).textContent=state.owned[i];$(`output${i}`).textContent=`毎秒 ${formatNumber(facilityRate(state,i))} · 10/25/50/100個で個別技術が解放`;
  $(`cost${i}`).textContent=`次の1個 ${formatNumber(price(state,i))} 文明力`;
  $(`buy${i}`).textContent=state.owned[i]>=1000?'上限到達':qty==='max'?'買えるだけ購入':`${qty}個まで購入`;
  $(`buy${i}`).disabled=!unlocked||state.money<price(state,i)||state.owned[i]>=1000;
 });
 const filter=$('tech-filter').value,showResearched=$('show-researched').checked;
 let visibleTechs=0;
 TECHS.forEach((t,i)=>{
  const available=techUnlocked(state,i),researched=state.techs[i];
  const firstTier=t.kind!=='facility'||!TECHS.some((prior,j)=>prior.kind==='facility'&&prior.facility===t.facility&&j<i&&!state.techs[j]);
  const relevant=t.kind==='era'||t.kind==='click'||(t.kind==='facility'&&state.owned[t.facility]>0)||(t.kind==='synergy'&&state.skills[5]>0);
  $(`technology${i}`).hidden=t.era>state.era||(filter!=='all'&&t.kind!==filter)||(researched&&!showResearched)||(!researched&&(!firstTier||!relevant));
  if(!$(`technology${i}`).hidden)visibleTechs++;
  $(`techreq${i}`).textContent=researched?(state.ascensions&&t.era<=2?'飛躍で習得済み':'研究済み'):`${available?'解放済み':'未解放'} · ${techCondition(state,i)} · ${formatNumber(techCost(state,i))} 文明力`;
  $(`tech${i}`).disabled=!canTech(state,i);$(`tech${i}`).textContent=researched?'研究済み':available?'研究する':'条件未達';
 });
 $('tech-empty').hidden=visibleTechs>0;
 const r=eraRequirement(state);
 $('era-condition').textContent=r?`累計 ${formatNumber(r.earned)}・${TECHS[r.tech].name}の研究・${formatNumber(r.cost)} 文明力が必要`:state.era===2?'情報時代は最初の文明の飛躍で解放されます。':'情報時代に到達。文明の飛躍で桁の成長を強めましょう。';
 $('evolve').textContent=r?`${ERAS[state.era+1]}時代へ進む`:state.era===2?'情報時代は飛躍で解放':'全時代を解放済み';$('evolve').disabled=!canEvolve(state);
 const leapGoal=state.ascensions>0;const goal=leapGoal?leapThreshold(state):r?r.earned:1e11;const pct=Math.min(100,state.earned/goal*100);
 $('progress').value=pct;$('percent').textContent=`${pct.toFixed(1)}%`;$('progress-label').textContent=leapGoal?`次の飛躍への累計生産 · ${formatNumber(goal)} · ${leapGain(state)?`獲得可 ${leapGain(state)}`:`条件達成で ${LEAP_RULES.baseReward}`}革新ポイント`:r?'次の時代への累計生産':'継承解放への累計生産';
 $('innovation-points').textContent=formatNumber(state.insight);$('innovation-target').textContent=state.ascensions?`革新は次の飛躍で獲得。周回累計 ${formatNumber(state.earned)} / ${formatNumber(leapThreshold(state))}。条件達成で${LEAP_RULES.baseReward}ポイント、条件の10倍なら${LEAP_RULES.baseReward+1}ポイント。`:'最初の飛躍で3ポイントを獲得。基盤を購入したあと、量産革命か情報経済を選べます。';
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
  const max=state.skills[i]>=s.max;$(`skillreq${i}`).textContent=`Lv.${state.skills[i]} / ${s.max} · ${max?'最大レベル':`${formatNumber(skillCost(state,i))}ポイント`}`;
  $(`skill${i}`).disabled=max||!skillUnlocked(state,i)||state.points<skillCost(state,i);$(`skill${i}`).textContent=max?'最大レベル':skillUnlocked(state,i)?'強化する':'条件未達';
  $(`skillreq${i}`).textContent+=` · ${skillUnlocked(state,i)?'解放済み':skillCondition(state,i)}`;
 });
 $('leap-lock').hidden=state.leapUnlocked;
 $('leap-lock').textContent=`解放条件：継承3回（${state.cycles}/3）・スキル合計8レベル（${state.skills.reduce((a,b)=>a+b,0)}/8）`;
 $('leap-content').hidden=!state.leapUnlocked;
 $('insight').textContent=state.insight;
 $('leap-gain').textContent=leapGain(state);$('leap-confirm-gain').textContent=leapGain(state);
 $('leap').disabled=!leapGain(state);$('leap-confirm-yes').disabled=!leapGain(state);
 $('leap-condition').textContent=`${state.techs[5]?'✓':'未達'} 電力網を研究\n${state.earned>=leapThreshold(state)?'✓':'未達'} 周回累計 ${formatNumber(leapThreshold(state))}（現在 ${formatNumber(state.earned)}）`;
 $('leap-effect').textContent='革新ポイントはスキルを購入すると効果を発揮します。購入済みの革新スキルと未使用ポイントは、継承・飛躍後も保持します。';
 $('innovation-panel').hidden=!state.leapUnlocked;
 INNOVATIONS.forEach((n,i)=>{
  const ready=innovationReady(state,i),max=state.innovations[i]>=n.max,cost=innovationCost(state,i);
  $(`innovation-req${i}`).textContent=`Lv.${state.innovations[i]}/${n.max} · ${max?'最大レベル':`${formatNumber(cost)}革新ポイント`}${ready?'':' · 前提スキルが必要'}`;
  $(`innovation-buy${i}`).disabled=max||!ready||state.insight<cost;
  $(`innovation${i}`).classList.toggle('locked',!ready);
 });

 if(!storageOK)notify('保存できません。このタブを閉じると進行が失われます。');
 fitWorkspace();
}
function fitWorkspace(){
 const container=document.querySelector('.workspace'),main=document.querySelector('main');
 const tail=main.getBoundingClientRect().bottom-container.getBoundingClientRect().bottom;
 const top=container.getBoundingClientRect().top+window.scrollY;
 document.documentElement.style.setProperty('--workspace-height',`${Math.max(250,window.innerHeight-top-tail-12)}px`);
}
function setWorkspace(name){
 workspace=name;
 const mobile=window.matchMedia('(max-width: 800px)').matches;
 document.querySelectorAll('[data-panel]').forEach(el=>el.classList.toggle('active',el.dataset.panel===name||(!mobile&&el.dataset.panel==='facilities')||(!mobile&&name==='facilities'&&el.dataset.panel==='technologies')));
 document.querySelectorAll('[data-workspace]').forEach(el=>{el.classList.toggle('selected',el.dataset.workspace===name);el.setAttribute('aria-pressed',String(el.dataset.workspace===name));});
}
function workspaceForAction(name){setWorkspace(name);}
window.addEventListener('resize',()=>{setWorkspace(workspace);fitWorkspace();});
function action(fn){update();fn();render();save();}
$('test-skip').onclick=()=>{$('test-skip-confirm').hidden=false;$('test-skip-yes').focus();};
$('test-skip-no').onclick=()=>{$('test-skip-confirm').hidden=true;$('test-skip').focus();};
$('test-skip-yes').onclick=()=>{
 update();
 try{localStorage.setItem(BACKUP_KEY,JSON.stringify(state));}catch{notify('進行を退避できないため、スキップを中止しました。');return;}
 state=firstLeapCheckpoint();testSpeed=1;qty=1;$('quantity').value='1';
 $('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;
 $('test-restore').disabled=false;workspaceForAction('innovation');notify(`初回飛躍直後へ移動しました。工業までの技術は習得済み、革新ポイントは${state.insight}です。`);render();save();
};
$('test-restore').onclick=()=>{
 try{const restored=migrateSave(JSON.parse(localStorage.getItem(BACKUP_KEY)));if(!restored)throw Error('backup');state=restored;state.last=Date.now();testSpeed=1;$('test-skip-confirm').hidden=true;$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;notify('スキップ前の進行に戻しました。');render();save();}catch{notify('退避した進行を読み込めませんでした。');}
};
try{$('test-restore').disabled=!localStorage.getItem(BACKUP_KEY);}catch{}
$('test-speed').onchange=()=>action(()=>{testSpeed=$('test-speed').checked?10:1;notify(testSpeed===10?'テスト用10倍速を開始しました。生産とゲーム内時間が10倍で進みます。':'通常速度に戻しました。');});
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
$('leap').onclick=()=>{workspaceForAction('legacy');update();render();if(!leapGain(state))return;$('leap-confirm').hidden=false;$('leap-confirm-yes').focus();};
$('leap-confirm-no').onclick=()=>{$('leap-confirm').hidden=true;$('leap').focus();};
$('leap-confirm-yes').onclick=()=>action(()=>{
 const gain=leapGain(state);if(!gain)return;
 leap(state);$('leap-confirm').hidden=true;$('inherit-confirm').hidden=true;
 workspaceForAction('innovation');notify(`文明が飛躍しました。革新 +${gain}。情報時代が解放されました。革新ポイントでスキルを選びましょう。`);
 $('gather').focus();
});
$('erase').onclick=()=>{if(confirm('この文明版のセーブをすべて消しますか？旧試作のセーブは消しません。')){state=fresh();$('inherit-confirm').hidden=true;$('leap-confirm').hidden=true;notify('新しい文明を開始しました。採集か施設購入から始めましょう。');render();save();}};
window.addEventListener('pagehide',()=>{update();save();});document.addEventListener('visibilitychange',()=>{update();render();save();});
document.querySelectorAll('[data-workspace]').forEach(el=>el.onclick=()=>setWorkspace(el.dataset.workspace));
$('tech-filter').onchange=render;$('show-researched').onchange=render;setWorkspace(workspace);
setInterval(()=>{update();render();},500);setInterval(save,5000);render();save();
