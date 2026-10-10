// Presentation reveals only the mechanics the player has discovered.
export function discoveredFeatures(s){
 const later=s.ascensions>0||s.transcendences>0||s.timeJumps>0;
 return {
  facilities:true,technologies:true,
  legacy:s.era>=2||s.history.maxEra>=2||s.cycles>0||later,
  innovation:s.leapUnlocked||later,
  transcendence:s.ascensions>=3||s.transcendences>0||s.timeJumps>0,
  chronology:s.cleared,
  information:later||s.history.maxEra>=3,
  cosmic:s.ascensions>=3||s.transcendences>0||s.timeJumps>0||s.history.maxEra>=4,
 };
}
export function visibleGuide(s){
 const known=discoveredFeatures(s),text=[
  '採集で文明力を得る → 施設を買う → 技術を研究する → 次の時代へ。施設は操作しなくても生産を続けます。',
  '文明力の単位は「点」。万・億・兆などの単位を使い、大きい数は単位を重ねて表示します。長い数値は折り返して表示します。',
 ];
 if(known.legacy)text.push('継承は工業時代・機械化の研究・周回累計1000億点で実行できます。施設や技術をリセットして、継承ポイントでスキルを強化します。');
 if(known.innovation)text.push(`飛躍は電力網の研究と必要な周回累計で実行できます。革新ポイントでスキルを強化します。${s.timeSkills[10]?'永久記録後は下位のポイント・スキル・回数を保ちます。':'継承ポイントとスキルはリセットされます。'}`);
 if(known.transcendence)text.push(`超越は情報時代・知能の連鎖の研究・必要な周回累計で実行できます。超越スキルを育て、宇宙へ文明を広げて1無量大数を目指します。${s.timeSkills[10]?'永久記録後は下位のポイント・スキル・回数を保ちます。':'継承・革新のポイント、スキル、回数はリセットされます。'}`);
 if(known.chronology)text.push(`時間跳躍で時空ポイントを得て、時間スキルと時空研究を育てます。${s.timeSkills[10]?'永久記録後は継承・革新・超越のポイント、スキル、回数も保ちます。':'時間跳躍では下位のポイント、スキル、回数もリセットされます。'}八十華厳の単位で新しい目標を目指しましょう。`);
 text.push('画面を閉じている間も最大7日分の生産を受け取れます。進行はこのブラウザに自動保存されます。');
 return text;
}

export function resetItems(s,kind){
 const items=['文明力','周回累計','施設',s.timeSkills[8]?'未固定の時空研究':'技術'];
 if(!s.timeSkills[9]&&!s.facilityArchive)items.push('時代');
 if(!s.timeSkills[10]&&kind==='leap')items.push('継承ポイント','継承スキル','継承の累計・受取済み額');
 if(!s.timeSkills[10]&&kind==='transcend')items.push('継承/革新のスキル・ポイント・回数・累計・受取済み額');
 if(!s.timeSkills[10]&&kind==='time')items.push('継承/革新/超越のスキル・ポイント・回数・累計・受取済み額');
 return items.join('・');
}
