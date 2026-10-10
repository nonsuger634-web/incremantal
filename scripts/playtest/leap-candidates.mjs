// Compare isolated rule variants without touching game files or user saves.
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const days=Number(option('--days','7')),inheritMax=option('--inherit-max','3');
const intervals=option('--intervals','900,3600,10800').split(',').map(Number);
if(!Number.isFinite(days)||days<=0||intervals.some(n=>!Number.isFinite(n)||n<=0))throw Error('Invalid days or intervals');
const root=new URL('../../',import.meta.url),source=await readFile(new URL('engine.js',root),'utf8'),runner=await readFile(new URL('scripts/playtest/repeat-leaps.mjs',root),'utf8');
const variants=[{name:'A',stepExponent:3,baseReward:3},{name:'B',stepExponent:4,baseReward:3},{name:'C',stepExponent:4,baseReward:5}];
const work=await mkdtemp(join(tmpdir(),'civilization-candidates-'));
try{
 for(const variant of variants){
  const rules=`export const LEAP_RULES = Object.freeze({stepExponent:${variant.stepExponent},firstReward:1,baseReward:${variant.baseReward},bonusExponent:1.3});`;
  const modified=source.replace(/export const LEAP_RULES = Object\.freeze\(\{[^\n]+\}\);/,rules);
  if(modified===source&&variant.name!=='A')throw Error('Rule replacement failed');
  const enginePath=join(work,`engine-${variant.name}.mjs`),runPath=join(work,`run-${variant.name}.mjs`);
  await writeFile(enginePath,modified);
  await writeFile(runPath,runner.replace("'../../engine.js'",JSON.stringify(pathToFileURL(enginePath).href)));
  for(const interval of intervals){
   const result=JSON.parse(execFileSync(process.execPath,[runPath,'--interval',String(interval),'--days',String(days),'--inherit-max',inheritMax,'--innovation',option('--innovation','economy'),'--leap-multiplier',option('--leap-multiplier','1')],{encoding:'utf8',maxBuffer:8*1024*1024}));
   console.log(JSON.stringify({variant,strategy:result.strategy,reachedLeaps:result.reachedLeaps,snapshots:result.snapshots,final:result.final}));
  }
 }
}finally{await rm(work,{recursive:true,force:true});}
