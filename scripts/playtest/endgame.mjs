import {
  BUDDHIST_GOAL_EXPONENT, FACILITIES, TECHS, advance, buy, buyTech,
  buyTimeSkill, buyTranscendSkill, canEvolve, canTech, compare, evolve, subtract,
  fromLog10, log10, price, production, productionExponent,
  timeCheckpoint, timeGain, timeSkillCost, timeSkillReady, timeTravel,
  transcend, transcendGain, transcendSkillCost, transcendSkillReady,
  validateSave,
} from '../../engine.js';

const GOAL = fromLog10(Number(BUDDHIST_GOAL_EXPONENT));
const SECONDS = { '1m':60, '15m': 900, '1h': 3600, '3h': 10800 };
const BRANCHES = {
  recursive: [3, 3, 3, 1, 2, 4, 5, 6, 7, 8, 9, 10],
  balanced: [1, 2, 4, 5, 6, 3, 7, 8, 9, 10],
};
const MAIN_BRANCHES = ['recursive', 'balanced'];
const UTILITY_TARGETS = [[1,1],[2,1],[4,2],[5,2],[6,1],[8,1],[9,1],[10,1]];
const EARLY_UTILITY_TARGETS = [[8,1],[9,1],[10,1]];
const UTILITY_GROWTH = [3,7,4,5,6,1,2];
const names = ['時間航行', '因果の増幅', '記憶の定着', '時間再帰', '並行宇宙', '歴史の共鳴', '宇宙の結合', '華厳の地平', '技術の永久保存', '宇宙の継承', '文明の永久記録'];
const transNames = ['宇宙の基盤', '次元の拡張', '時空の圧縮', '無限への接続'];

function val(v) { return typeof v === 'number' ? v : `10^${Number(v.log10).toPrecision(6)}`; }
function exp(v) { return log10(v); }
function hour(s) { return s.elapsed / 3600; }
function snapshot(s) {
  return {
    hour: Number(hour(s).toFixed(3)), money: val(s.money), earned: val(s.earned),
    production: val(production(s)), productionExponent: productionExponent(s), era: s.era,
    owned: [...s.owned], techCount: s.techs.filter(Boolean).length,
    timeJumps: s.timeJumps, chronons: s.chronons, timeSkills: [...s.timeSkills],
    transcendences: s.transcendences, horizon: s.horizon, transcendSkills: [...s.transcendSkills],
    goalReached: s.goalReached, validateSave: validateSave(s),
  };
}
function purchaseTechAndEvolve(s) {
  let changed = true, loops = 0;
  while (changed && loops++ < 8) {
    changed = false;
    for (let i = 0; i < TECHS.length; i++) if (canTech(s, i) && buyTech(s, i)) changed = true;
    if (canEvolve(s) && evolve(s)) changed = true;
  }
}
function buyFacilities(s, limit, purchaseMode = 'roi') {
  if(purchaseMode==='bulk'){let count=0;for(let i=0;i<FACILITIES.length;i++)while(s.owned[i]<1000&&buy(s,i))count++;return count;}
  // Greedy individual purchases by marginal CPS/price. Recompute after each.
  let count = 0;
  const bought = new Set();
  while (count < limit) {
    let best = -1, bestRoi = -Infinity;
    for (let i = 0; i < FACILITIES.length; i++) {
      const p = FACILITIES[i];
      if ((purchaseMode === 'per-facility' && bought.has(i)) || p.era > s.era || s.owned[i] >= 1000) continue;
      // buy() itself safely compares/subtracts values that may be log-backed.
      const before = production(s);
      const cost = price(s, i);
      if (compare(s.money, cost) < 0) continue;
      const trial = { ...s, owned: [...s.owned] };
      if (!buy(trial, i)) continue;
      const after = production(trial);
      const marginal = subtract(after, before);
      if (compare(marginal, 0) <= 0) continue;
      const roi = log10(marginal) - Math.log10(cost);
      if (roi > bestRoi) { bestRoi = roi; best = i; }
    }
    if (best < 0 || !buy(s, best)) break;
    bought.add(best);
    count++;
  }
  return count;
}
function buyTimeSkills(s, branch, events) {
  const utility = branch === 'utility' || branch === 'utility-early';
  if (utility) {
    let blocked = false;
    for (const [i, target] of branch === 'utility-early' ? EARLY_UTILITY_TARGETS : UTILITY_TARGETS) {
      while (s.timeSkills[i] < target) {
        if (!timeSkillReady(s, i)) { blocked = true; break; }
        const from = s.timeSkills[i], cost = timeSkillCost(s, i);
        if (!buyTimeSkill(s, i)) { blocked = true; break; }
        events.push({ at: Number(hour(s).toFixed(3)), type: 'time-skill-batch', skill: names[i], from, to: s.timeSkills[i], spent: cost });
      }
      if (blocked) return;
    }
    // After utility nodes 8–10 are secured, continue into the production tree.
  }
  const priority = utility ? UTILITY_GROWTH : BRANCHES[branch];
  let changed = true, guard = 0;
  while (changed && guard++ < 600) {
    changed = false;
    for (const i of priority) {
      const from = s.timeSkills[i];
      let spent = 0;
      while (timeSkillReady(s, i)) {
        const cost = timeSkillCost(s, i);
        if (!buyTimeSkill(s, i)) break;
        spent += cost;
        changed = true;
      }
      if (s.timeSkills[i] > from) events.push({ at: Number(hour(s).toFixed(3)), type: 'time-skill-batch', skill: names[i], from, to: s.timeSkills[i], spent });
    }
  }
}
function buyTransSkills(s, branch, events) {
  const priority = branch === 'recursive' ? [1, 3, 2] : [1, 2, 3];
  let changed = true, guard = 0;
  while (changed && guard++ < 32) {
    changed = false;
    for (const i of priority) {
      const from = s.transcendSkills[i];
      let spent = 0;
      while (transcendSkillReady(s, i)) {
        const cost = transcendSkillCost(s, i);
        if (!buyTranscendSkill(s, i)) break;
        spent += cost;
        changed = true;
      }
      if (s.transcendSkills[i] > from) events.push({ at: Number(hour(s).toFixed(3)), type: 'trans-skill-batch', skill: transNames[i], from, to: s.transcendSkills[i], spent });
    }
  }
}

function run(intervalName, branch, options) {
  const s = timeCheckpoint();
  const events = [];
  const interval = SECONDS[intervalName];
  const initial = snapshot(s);
  const startValid = validateSave(s);
  // The checkpoint gives one chronon. Spend it on Time Flight before the run.
  if (buyTimeSkill(s, 0)) events.push({ at: 0, type: 'time-skill', skill: names[0], level: s.timeSkills[0], cost: 1 });
  buyTimeSkills(s, branch, events);
  const milestones = {};
  let visits = 0, steps = 0, facilitiesPurchased = 0, techPurchases = 0;
  let goalSnapshot = null;
  const endAt = options.days * 86400;
  while (!s.goalReached && s.elapsed < endAt && steps++ < 300000) {
    const intervalStart = s.elapsed;
    const moneyBefore = s.money;
    const cpsBefore = production(s);
    const elapsedInDay = s.elapsed % 86400;
    const untilEnd = endAt - s.elapsed;
    const untilSleep = 16 * 3600 - elapsedInDay;
    const dt = options.sleep ? (elapsedInDay >= 16 * 3600 ? Math.min(86400 - elapsedInDay, untilEnd) : Math.min(interval, untilSleep, untilEnd)) : Math.min(interval, untilEnd);
    if (dt <= 0) break;
    advance(s, dt);
    if (s.goalReached) {
      const toGoal = compare(GOAL, moneyBefore) > 0 ? subtract(GOAL, moneyBefore) : 0;
      const secondsToGoal = compare(toGoal, 0) > 0 ? 10 ** (log10(toGoal) - log10(cpsBefore)) : 0;
      goalSnapshot = snapshot(s);
      goalSnapshot.firstObservedHour = Number(hour(s).toFixed(3));
      goalSnapshot.estimatedCrossingHour = Number((s.goalElapsed / 3600).toPrecision(8));
      break;
    }
    if (options.sleep && Math.abs(s.elapsed % 86400 - 16 * 3600) < 1e-6) continue;
    visits++;
    const techBefore = s.history.techPurchases;
    purchaseTechAndEvolve(s);
    facilitiesPurchased += buyFacilities(s, options.purchases, options.purchaseMode);
    purchaseTechAndEvolve(s);
    techPurchases += s.history.techPurchases - techBefore;
    const gain = timeGain(s);
    if (gain > 0) {
      const before = { jumps: s.timeJumps, chronons: s.chronons, earned: val(s.earned), gain };
      timeTravel(s);
      events.push({ at: Number(hour(s).toFixed(3)), type: 'time-travel', before, after: { jumps: s.timeJumps, chronons: s.chronons } });
      if (!validateSave(s)) throw new Error(`invalid save after time travel: ${intervalName}/${branch}/${hour(s)}`);
      buyTimeSkills(s, branch, events);
    } else {
      const transGain = transcendGain(s);
      if (transGain > 0) {
        const before = { trans: s.transcendences, horizon: s.horizon, earned: val(s.earned), gain: transGain };
        transcend(s);
        events.push({ at: Number(hour(s).toFixed(3)), type: 'transcend', before, after: { trans: s.transcendences, horizon: s.horizon } });
        if (!validateSave(s)) throw new Error(`invalid save after transcend: ${intervalName}/${branch}/${hour(s)}`);
        buyTransSkills(s, branch, events);
      }
    }
    if (!milestones.h36 && s.elapsed >= 36 * 3600) milestones.h36 = snapshot(s);
    if (!milestones.h72 && s.elapsed >= 72 * 3600) milestones.h72 = snapshot(s);
  }
  const final = snapshot(s);
  const result = {
    interval: intervalName, branch, requestedDays: options.days, sleep: options.sleep ? '16:00–24:00' : 'none', purchasesPerVisitLimit: options.purchases, purchaseMode: options.purchaseMode, start: { ...initial, valid: startValid },
    goalExponent: Number(BUDDHIST_GOAL_EXPONENT), goalHours: goalSnapshot?.estimatedCrossingHour ?? null,
    goalObservedMoney: goalSnapshot ? goalSnapshot.money : null, goalSnapshot,
    visits, facilitiesPurchased, techPurchases, steps, milestones,
    resetCounts: { timeTravel: events.filter(e => e.type === 'time-travel').length, transcend: events.filter(e => e.type === 'transcend').length },
    events, final,
  };
  return result;
}

function args(argv) {
  const out = { days: 14, intervals: ['15m','1h','3h'], branches: MAIN_BRANCHES, purchases: 100, purchaseMode: 'roi', sleep: true };
  for (let i = 0; i < argv.length; i++) {
    const [key, inline] = argv[i].split('=', 2);
    const value = inline ?? argv[++i];
    if (key === '--days') out.days = Number(value);
    else if (key === '--intervals') out.intervals = value.split(',');
    else if (key === '--interval') out.intervals = [value];
    else if (key === '--branches') out.branches = value.split(',');
    else if (key === '--branch') out.branches = [value];
    else if (key === '--purchases' || key === '--purchase-limit') {
      if(value==='bulk'){out.purchaseMode='bulk';out.purchases=FACILITIES.length*1000;}
      else if (value === 'per-facility') { out.purchaseMode = 'per-facility'; out.purchases = FACILITIES.length; }
      else { out.purchaseMode = 'roi'; out.purchases = Number(value); }
    }
    else if (key === '--sleep') out.sleep = value !== 'none';
  }
  if (!(out.days > 0 && Number.isFinite(out.days)) || !(out.purchases > 0 && Number.isInteger(out.purchases))) throw new Error('--days and --purchases must be positive');
  return out;
}

const options = args(process.argv.slice(2));
const cases = [];
for (const interval of options.intervals) for (const branch of options.branches) {
  if (!SECONDS[interval] || (!BRANCHES[branch] && !['utility', 'utility-early'].includes(branch))) throw new Error(`unknown case: ${interval}/${branch}`);
  cases.push(run(interval, branch, options));
}
console.log(JSON.stringify({ goalExponent: Number(BUDDHIST_GOAL_EXPONENT), days: options.days, sleep: options.sleep ? '16:00–24:00' : 'none', purchasesPerVisitLimit: options.purchases, purchaseMode: options.purchaseMode, cases }, null, 2));
