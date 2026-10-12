// Decorative images are composed from generated atlases; catalog/save order stays intact.
function position(index,columns,rows){return `background-position:${index%columns/(columns-1)*100}% ${Math.floor(index/columns)/(rows-1)*100}%`;}
function icon(sheet,index,extra=''){return `<span class="art-icon art-${sheet} ${extra}" style="${position(index,5,sheet==='facilities'?3:5)}"></span>`;}
export function facilityArtwork(index){return `<span class="facility-art" aria-hidden="true">${icon('facilities',index)}</span>`;}
export function technologyArtwork(tech,index){
 let body;
 if(tech.kind==='facility'){
  const tier=[10,25,50,100].indexOf(tech.required);
  body=icon('facilities',tech.facility)+icon('technologies',18+tier,'art-badge');
 }else if(tech.kind==='synergy'){
  body=icon('facilities',tech.source,'art-pair-first')+icon('facilities',tech.target,'art-pair-second');
 }else{
  const n=tech.kind==='time'?15+[1,5,9].indexOf(tech.required):tech.kind==='click'?10+tech.era:index<8?index:tech.name==='恒星航行'?8:9;
  body=icon('technologies',n);
 }
 return `<span class="tech-art" aria-hidden="true">${body}</span>`;
}
export function skillArtwork(index){return `--skill-art-x:${index%6/5*100}%;--skill-art-y:${Math.floor(index/6)/4*100}%`;}
