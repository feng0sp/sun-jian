/* A presentation guide on top of the shared, unchanged geometry rules. */
(function(root){
 'use strict';
 const bench={id:'bench-three-v1',prefitted:[{piece:'front-beam',direction:'yn'},{piece:'rear-beam',direction:'yn'}],steps:[{pieces:['seat'],directions:{seat:'xn'},label:'① 装座板',instruction:'先把座板沿横梁推入。接近归位时会吸附。'},{pieces:['left-pin','right-pin'],directions:{'left-pin':'zn','right-pin':'zn'},label:'② 装两枚木销',instruction:'座板已合好。两枚木销，先装哪一枚都可以。'}]};
 const pinned={id:'pinned-order-v1',prefitted:[],steps:[{pieces:['tenon'],directions:{tenon:'yn'},label:'① 归位甲 · 榫头',instruction:'先让大件沿卯口贴齐，再装入小销。'},{pieces:['pin'],directions:{pin:'zn'},label:'② 装入乙 · 穿销',instruction:'榫头已贴齐，把穿销推入对齐的销孔。'}]};
 const service={...pinned,id:'service-order-v1'};
 const furniture={id:'entry-three-v1',prefitted:[],steps:[{pieces:['seat'],directions:{seat:'xn'},label:'① 合入主板',instruction:'支撑框架已经固定。先沿滑槽推入主板。'},{pieces:['left-pin','right-pin'],directions:{'left-pin':'zn','right-pin':'zn'},label:'② 装两枚侧销',instruction:'主板已贴齐，两侧木销任意先后。'}],lockedText:'先合好主板',doneText:'三件已合好。框架留在原处，可随时撤销或收好作品。'};
 function forLevel(id,mode){return id.startsWith('entry-')?furniture:id==='rain-shelter-bench'?bench:mode==='assemble'?(id==='pinned'?pinned:id==='service-access-open'?service:null):null;}
 const editable=(level,g)=>level.pieces.filter(p=>!p.fixed&&!g.prefitted.some(m=>m.piece===p.id));
 function step(g,removed,mode='assemble'){
  if(mode==='assemble')return g.steps.find(s=>s.pieces.some(id=>removed.includes(id)))||null;
  if(g.id!==bench.id&&g.id!==furniture.id)return null;
  const pins=g.steps[1].pieces;if(pins.some(id=>!removed.includes(id)))return {pieces:pins,label:'① 取下两枚木销',instruction:'先拉出左右两枚小销，哪一枚先取都可以。'};
  if(!removed.includes('seat'))return {pieces:['seat'],label:'② 抽出座板',instruction:'小销都已取下，沿横梁把座板滑出。横梁留在原处。'};
  return null;
 }
 function allowed(g,removed,id,mode){if(g.prefitted.some(m=>m.piece===id))return false;return !!step(g,removed,mode)?.pieces.includes(id);}
 function direction(g,id){return g.steps.find(s=>s.pieces.includes(id))?.directions[id];}
 function normalize(level,run,mode,P,E,g=bench){
  if(g.id!==bench.id){const legal=run?.level===level.id&&run.mode===mode&&E.restoreSession(JSON.stringify(run),P);const data=legal?{...run,history:legal.history,guideId:g.id}:{version:1,level:level.id,mode,history:[],action:'extract',guideId:g.id};return {run:data,legal:legal||E.restoreSession(JSON.stringify(data),P),recovered:false};}
  const old=run&&E.restoreSession(JSON.stringify(run),P),placed=new Set(old?level.pieces.filter(p=>!p.fixed&&!old.removed.includes(p.id)).map(p=>p.id):[]);
  let history=[],recovered=false;
  if(mode==='assemble'){
   history=g.prefitted.map(m=>({kind:'insert',...m}));
   for(const m of old?.history||[])if(direction(g,m.piece)&&placed.has(m.piece)&&(m.piece==='seat'||placed.has('seat')))history.push({kind:'insert',piece:m.piece,direction:direction(g,m.piece)});
   recovered=!!old&&!placed.has('seat')&&g.steps[1].pieces.some(id=>placed.has(id));
  }else history=(old?.history||[]).filter(m=>!g.prefitted.some(p=>p.piece===m.piece));
  const data={version:1,level:level.id,mode,history,action:'extract',...(old?{trial:old.trial}:{})};
  const legal=E.restoreSession(JSON.stringify(data),P);if(!legal)throw Error('Invalid guided assembly history');
  legal.completed=mode==='assemble'?!legal.removed.length:editable(level,g).every(p=>legal.removed.includes(p.id));
  return {run:{...data,trial:legal.trial,guideRevision:1},legal,recovered};
 }
 function restoreSession(raw,P,E){
  const legal=E.restoreSession(raw,P);if(!legal)return null;
  let saved;try{saved=JSON.parse(raw);}catch{return null;}
  if(saved.guideRevision===1&&legal.level==='rain-shelter-bench'){
   const level=P.LEVELS.find(l=>l.id===legal.level);
   legal.completed=legal.mode==='assemble'?!legal.removed.length:editable(level,bench).every(p=>legal.removed.includes(p.id));
   legal.trial.completedMs=legal.completed?legal.trial.visibleMs:null;
  }
  return legal;
 }
 function takeback(level,g,removed,history,P){
  const last=history.at(-1);if(!g||last?.kind!=='insert'||g.prefitted.some(p=>p.piece===last.piece)||!g.steps.at(-1).pieces.includes(last.piece))return null;
  const vector=P.DIRECTIONS.find(d=>d.id===last.direction)?.vector,direction=P.DIRECTIONS.find(d=>vector&&d.vector.every((v,i)=>v===-vector[i]))?.id;
  return direction&&P.canExtract(level,removed,last.piece,direction).ok?{piece:last.piece,direction}:null;
 }
 const api={bench,furniture,pinned,service,forLevel,editable,step,allowed,direction,normalize,restoreSession,takeback};root.AssemblyGuide=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
