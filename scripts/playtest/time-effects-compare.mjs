// Compare a committed baseline with the current working engine using the endgame
// playtest's huge-number-safe purchase and progression routines.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const baselineRef = process.argv[2] || '1089818';
const repo = resolve(new URL('../..', import.meta.url).pathname);
const source = readFileSync(join(repo, 'scripts/playtest/endgame.mjs'), 'utf8');
const importBlock = /import \{([\s\S]*?)\} from '\.\.\/\.\.\/engine\.js';/;
if (!importBlock.test(source)) throw new Error('Could not locate endgame engine import');
const transformed = source
  .replace(importBlock, 'const {$1} = await import(process.env.TIME_COMPARE_ENGINE);')
  .replace(/const options = args\(process\.argv\.slice\(2\)\);/, "const options = args(['--days','365','--purchases','100','--sleep','8h']);")
;
const temp = mkdtempSync(join(tmpdir(), 'time-effects-compare-'));
const runner = join(temp, 'endgame-runner.mjs');
writeFileSync(runner, transformed);
const baseline = join(temp, 'baseline');
execFileSync('mkdir', ['-p', baseline]);
for (const file of ['engine.js', 'numbers.js']) {
  const contents = execFileSync('git', ['show', `${baselineRef}:${file}`], { cwd: repo, encoding: 'utf8' });
  writeFileSync(join(baseline, file), contents);
}
const engines = {
  baseline: pathToFileURL(join(baseline, 'engine.js')).href,
  working: pathToFileURL(join(repo, 'engine.js')).href,
};
const results = {};
for (const [label, engine] of Object.entries(engines)) {
  results[label] = JSON.parse(execFileSync(process.execPath, [runner], {
    cwd: repo,
    env: { ...process.env, TIME_COMPARE_ENGINE: engine },
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  }));
}
const baselineByCase = new Map(results.baseline.cases.map(c => [`${c.interval}/${c.branch}`, c]));
const cases = results.working.cases.map(after => {
  const before = baselineByCase.get(`${after.interval}/${after.branch}`);
  const deltaHours = before?.goalHours != null && after.goalHours != null ? after.goalHours - before.goalHours : null;
  return {
    interval: after.interval,
    strategy: after.branch,
    baselineHours: before?.goalHours ?? null,
    workingHours: after.goalHours,
    deltaHours,
    deltaPercent: deltaHours != null && before.goalHours !== 0 ? 100 * deltaHours / before.goalHours : null,
    baselineObservedHour: before?.goalSnapshot?.firstObservedHour ?? null,
    workingObservedHour: after.goalSnapshot?.firstObservedHour ?? null,
    baselineReached: before?.goalSnapshot != null,
    workingReached: after.goalSnapshot != null,
    baselineValid: before?.final?.validateSave ?? false,
    workingValid: after.final?.validateSave ?? false,
    baselineResetCounts: before?.resetCounts ?? null,
    workingResetCounts: after.resetCounts,
  };
});
console.log(JSON.stringify({baselineRef,goalExponent: results.working.goalExponent, schedule:{sleep:'8h per day',facilityPurchasesPerVisit:100}, cases}, null, 2));
