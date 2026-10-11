const policies = {
  balanced:[0,1,2,4,5,6,3,7,8,9,10],
  utilityEarly:[0,8,9,10,1,2,4,5,6,3,7],
  recursive:[0,3,3,3,1,2,4,5,6,7,8,9,10],
};
const arg=(n,d)=>{const x=process.argv.find(a=>a.startsWith(`--${n}=`));return x?x.split('=')[1]:d};
const E=await import(arg('engine',new URL('../../engine.js',import.meta.url).href));
const clickRate=Number(arg('clicks','0')), policy=arg('policy','utilityEarly'), dt=Number(arg('dt','0.1')),facilityOrder=arg('facility','desc'), resetPolicy=arg('reset','immediate'), minResetGain=resetPolicy==='immediate'?0:Number(resetPolicy),lowerMode=arg('lower','greedy');
const firstCycleTarget=Number(arg('first-cycle-transcend','0'));
const s=E.fresh(), events=[];
const legacyEngine=!s.resetCounts;let legacyInheritMark=0;
const checkpoints={};
const cycleAwards={active:false,total:0,events:[]};
function snap(label){checkpoints[label]={t:s.elapsed,counts:s.resetCounts?[...s.resetCounts]:[s.cycles,s.ascensions,s.transcendences,s.timeJumps],layerProduction:s.layerProduction?[...s.layerProduction]:null,memoryAwards:s.memoryAwards?[...s.memoryAwards]:null,points:s.points,skills:[...s.skills],insight:s.insight,innovations:[...s.innovations],horizon:s.horizon,transcendSkills:[...s.transcendSkills],chronons:s.chronons,timeAwards:s.timeAwards,timeSkills:[...s.timeSkills],earned:E.log10(s.earned),lifetime:E.log10(s.lifetime),firstTimeCycleTranscendAwards:cycleAwards.total,valid:E.validateSave(s)};}
function lower(){let ch=true,guard=0;while(ch&&guard++<20){ch=false;const order=lowerMode==='roundRobin'?[0,1,3,2,4,5]:E.SKILLS.map((_,i)=>i);for(const i of order){const n=lowerMode==='greedy'?Infinity:1;for(let j=0;j<n&&E.buySkill(s,i);j++)ch=true;}for(let i=0;i<E.INNOVATIONS.length;i++)while(E.buyInnovation(s,i))ch=true;}}
function transSkills(){let ch=true,guard=0;while(ch&&guard++<20){ch=false;for(const i of [0,1,2,3])while(E.buyTranscendSkill(s,i))ch=true;}}
function timeSkills(){let ch=true,guard=0;while(ch&&guard++<40){ch=false;for(const i of policies[policy])while(E.timeSkillReady(s,i)&&E.buyTimeSkill(s,i))ch=true;}}
function usefulInheritanceGain(g){const projected={...s,cycles:s.cycles+1,points:s.points+g,skills:[...s.skills]};return s.cycles<3||s.skills.some((lv,i)=>lv<E.SKILLS[i].max&&E.skillUnlocked(projected,i)&&E.skillCost(projected,i)<=projected.points);}
function economy(){let ch=true,guard=0;while(ch&&guard++<12){ch=false;for(let i=0;i<E.TECHS.length;i++)if(E.canTech(s,i)&&E.buyTech(s,i))ch=true;if(E.canEvolve(s)&&E.evolve(s))ch=true;}
 // Bulk affordable purchases, increasing unit cost order; repeat as rates/unlocks change.
 ch=true;guard=0;while(ch&&guard++<4){ch=false;const indices=Array.from({length:E.FACILITIES.length},(_,i)=>i);if(facilityOrder==='desc')indices.reverse();for(const i of indices){let n=0;while(E.buy(s,i))n++;if(n)ch=true;}}
}
let steps=0,nextClick=clickRate>0?1/clickRate:Infinity,nextAction=1;
function upkeep(){transSkills();lower();economy();
 let g=E.timeGain(s); if(g>0&&(s.timeJumps!==1||cycleAwards.total>=firstCycleTarget)&&s.timeSkills.some((lv,i)=>lv<E.TIME_SKILLS[i].max)&&(resetPolicy==='immediate'||g>=minResetGain)){const nextJump=s.timeJumps+1;events.push({kind:'time',t:s.elapsed,g,j:s.timeJumps});if(nextJump===2&&cycleAwards.active){snap('firstTimeCycleEnd');cycleAwards.active=false;}E.timeTravel(s);if(!E.validateSave(s))throw Error('invalid after time jump');if(legacyEngine&&!s.timeSkills[10])legacyInheritMark=0;if(nextJump===1){cycleAwards.active=true;snap('firstTimeJump');}timeSkills();}
 else {g=E.transcendGain(s);if(g>0&&s.transcendSkills.some((lv,i)=>lv<E.TRANSCEND_SKILLS[i].max)&&(resetPolicy==='immediate'||g>=minResetGain)){if(cycleAwards.active&&s.timeJumps===1){cycleAwards.total+=g;cycleAwards.events.push({t:s.elapsed,g,transcendences:s.transcendences});}events.push({kind:'trans',t:s.elapsed,g,j:s.transcendences});E.transcend(s);if(!E.validateSave(s))throw Error('invalid after transcend');if(cycleAwards.active&&cycleAwards.total>=16&&!checkpoints.firstTimeCycle16)snap('firstTimeCycle16');if(legacyEngine&&!s.timeSkills[10])legacyInheritMark=0;transSkills();lower();economy();}}
 g=E.leapGain(s);if(g>0&&s.innovations.some((lv,i)=>lv<E.INNOVATIONS[i].max)&&(resetPolicy==='immediate'||g>=minResetGain)){events.push({kind:'leap',t:s.elapsed,g,j:s.ascensions});E.leap(s);if(!E.validateSave(s))throw Error('invalid after leap');if(legacyEngine&&!s.timeSkills[10])legacyInheritMark=0;lower();economy();}
 if(s.skills.some((lv,i)=>lv<E.SKILLS[i].max)){g=E.inheritance(s);if(legacyEngine&&g<=legacyInheritMark)g=0;if(g>0&&usefulInheritanceGain(g)){if(legacyEngine)legacyInheritMark=g;events.push({kind:'inherit',t:s.elapsed,g,j:s.cycles,points:s.points});E.inherit(s);if(!E.validateSave(s))throw Error('invalid after inherit');lower();economy();}}
 if(s.skills.every((lv,i)=>lv>=E.SKILLS[i].max)&&s.innovations.every((lv,i)=>lv>=E.INNOVATIONS[i].max)&&s.transcendSkills.every((lv,i)=>lv>=E.TRANSCEND_SKILLS[i].max)&&!checkpoints.allLowerMax)snap('allLowerMax');
 if(s.timeSkills.every((lv,i)=>lv>=E.TIME_SKILLS[i].max)&&!checkpoints.allTimeMax)snap('allTimeMax');
}
upkeep();
const maxHours=Number(arg('hours','12'));
while(!s.goalReached&&s.elapsed<maxHours*3600&&steps<maxHours*3600/dt+10){
  const start=s.elapsed, cps=E.production(s), before=s.money;
  E.advance(s,dt);
  while(nextClick<=s.elapsed+1e-8){E.gather(s);nextClick+=1/clickRate;}
  if(s.cleared&&!events.some(x=>x.kind==='clear')){events.push({kind:'clear',t:s.clearElapsed});snap('firstClear');}
  if(s.goalReached){events.push({kind:'goal',t:s.goalElapsed});break;}
  while(nextAction<=s.elapsed+1e-8){nextAction++;upkeep();}
  steps++;
  if(s.goalReached)events.push({kind:'goal',t:s.goalElapsed});
}
console.log(JSON.stringify({engine:arg('engine',new URL('../../engine.js',import.meta.url).href),clickRate,policy,facilityOrder,resetPolicy,lowerMode,firstCycleTarget,dt,elapsed:s.elapsed,clearElapsed:s.clearElapsed,goalElapsed:s.goalElapsed,cleared:s.cleared,goalReached:s.goalReached,steps,valid:E.validateSave(s),checkpoints,firstTimeCycleTranscendAwards:cycleAwards,events,final:{era:s.era,owned:s.owned,timeJumps:s.timeJumps,chronons:s.chronons,timeSkills:s.timeSkills,cycles:s.cycles,ascensions:s.ascensions,transcendences:s.transcendences,horizon:s.horizon,insight:s.insight,points:s.points,skills:s.skills,innovations:s.innovations,transcendSkills:s.transcendSkills,memoryAwards:s.memoryAwards,layerProduction:s.layerProduction,timeAwards:s.timeAwards,money:E.log10(s.money),earned:E.log10(s.earned),lifetime:E.log10(s.lifetime)}},null,2));
