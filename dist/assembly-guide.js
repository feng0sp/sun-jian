/* A presentation guide on top of the shared, unchanged geometry rules. */
(function(root){
 'use strict';
 const bench={id:'bench-three-v1',prefitted:[{piece:'front-beam',direction:'yn'},{piece:'rear-beam',direction:'yn'}],steps:[{pieces:['seat'],directions:{seat:'xn'},label:'① 装座板',instruction:'先把座板沿横梁推入。接近归位时会吸附。'},{pieces:['left-pin','right-pin'],directions:{'left-pin':'zn','right-pin':'zn'},label:'② 装两枚木销',instruction:'座板已合好。两枚木销，先装哪一枚都可以。'}]};
 const pinned={id:'pinned-order-v1',prefitted:[],steps:[{pieces:['tenon'],directions:{tenon:'yn'},label:'① 归位甲 · 榫头',instruction:'先让大件沿卯口贴齐，再装入小销。'},{pieces:['pin'],directions:{pin:'zn'},label:'② 装入乙 · 穿销',instruction:'榫头已贴齐，把穿销推入对齐的销孔。'}]};
 const service={...pinned,id:'service-order-v1'};
 const clamp={id:'museum-clamp-v1',prefitted:[],steps:[
  {pieces:['apron'],directions:{apron:'yn'},label:'① 牙条落入豁口',instruction:'对齐案腿的豁口，从上方放回牙条。'},
  {pieces:['top'],directions:{top:'yn'},label:'② 落下案面边框',instruction:'牙条已贴齐。对准腿足上露出的榫头，落下案面。'}
 ],lockedText:'先放好牙条',doneText:'案面与牙条已合好。可以把复原件放回展台。'};
 const museumGuides={
  'museum-hemudu-beam':[
   {pieces:['beam'],directions:{beam:'xp'},label:'梁头入卯',instruction:'沿梁的长向推入，榫肩贴住卯座外壁。'}],
  'chair-rail-joint':[
   {pieces:['tenon'],directions:{tenon:'xn'},label:'横枨入卯',instruction:'对准腿侧的盲卯，沿横枨长向推入。'}],
  'museum-miter-corner':[
   {pieces:['front','side'],directions:{front:'xn',side:'zn'},label:'两边框各沿长向合入',instruction:'两条边框都各有卯口，先装哪一条都可以。'}],
  'museum-sliding-pin':[
   {pieces:['slide'],directions:{slide:'xp'},label:'① 滑板进槽',instruction:'从教具板边的宽口推入，宽销头贴着窄槽底部走。'},
   {pieces:['stop'],directions:{stop:'yn'},label:'② 放回限位块',instruction:'滑板归位后，从上方放回挡在宽口的限位木块。'}],
  'museum-dougong':[
   {pieces:['dou'],directions:{dou:'yn'},label:'① 合底斗',instruction:'把底斗落在立柱顶榫上。'},
   {pieces:['gong'],directions:{gong:'yn'},label:'② 安横栱',instruction:'把横栱放进底斗上方的槽。'},
   {pieces:['block-left','block-right'],directions:{'block-left':'yn','block-right':'yn'},label:'③ 放两侧小斗',instruction:'小斗落到横栱两端，各自对准下面的短榫。'},
   {pieces:['bar-left','bar-right'],directions:{'bar-left':'yn','bar-right':'yn'},label:'④ 放两侧横材',instruction:'把左右横材分别落进小斗上方的槽。'},
   {pieces:['beam'],directions:{beam:'yn'},label:'⑤ 合上梁',instruction:'最后落下上梁。梁下的卯接住两根横材上的短榫。'}]
 };
 for(const [id,steps] of Object.entries(museumGuides)){
  museumGuides[id]={id:id+'-guide-v1',steps,prefitted:[],lockedText:'先合好这一步的构件',doneText:'木件已归位，可以放回展厅。'};
 }
 const furniture={id:'entry-three-v1',prefitted:[],steps:[{pieces:['seat'],directions:{seat:'xn'},label:'① 合入主板',instruction:'支撑框架已经固定。先沿滑槽推入主板。'},{pieces:['left-pin','right-pin'],directions:{'left-pin':'zn','right-pin':'zn'},label:'② 装两枚侧销',instruction:'主板已贴齐，两侧木销任意先后。'}],lockedText:'先合好主板',doneText:'三件已合好。框架留在原处，可随时撤销或收好作品。'};
 const dovetail={id:'workshop-dovetail-v1',prefitted:[],steps:[
  {pieces:['slide'],directions:{slide:'xn'},label:'① 滑回盖板',instruction:'把宽盖板对准敞开的槽口，沿斜面推回。'},
  {pieces:['key'],directions:{key:'yn'},label:'② 装回止退木钥',instruction:'盖板已经到位。向下插回木钥，挡住滑出的那一端。'}
 ],lockedText:'先滑回盖板',doneText:'盖板和木钥都合回了，匣体留在原处。'};
 const burr={id:'workshop-burr-v1',prefitted:[],hideBlockedGhosts:true,lockedText:'先让位',doneText:'六根木条已互相扣住。可以放回工坊，也可以撤销观察。'};
 const burrSteps=new Map();
 function burrStep(removed){
  if(!removed.length)return null;
  const P=root.JointPuzzle||(typeof require==='function'?require('./puzzle-core.js'):null),key=[...removed].sort().join(',');
  if(burrSteps.has(key))return burrSteps.get(key);
  const level=P.LEVELS.find(l=>l.id==='burr-six'),directions=Object.create(null);
  for(const move of P.availableInsertions(level,removed)){
   if(directions[move.piece])continue;
   if(P.assemblyRoute(level,removed.filter(id=>id!==move.piece)))directions[move.piece]=move.direction;
  }
  const route=P.assemblyRoute(level,removed),next=level.pieces.find(p=>p.id===route?.[0]?.piece);
  const placed=6-removed.length;
  let instruction='当前木条挡住了后续入口，撤销一步再看看。';
  if(next){
   if(placed===0)instruction='先看木条上的缺口。选一根可装入的木条，沿箭头推入。';
   else if(removed.length===1)instruction='对准最后一道空槽，把剩下这根木条推到接面贴齐。';
   else instruction='看看已经合上的木条中间还空着哪道槽。选件后沿箭头推入。';
  }
  const result={pieces:Object.keys(directions),directions,next:next?.name,label:'鲁班锁复原 · '+placed+' / 6',instruction};
  burrSteps.set(key,result);return result;
 }
 function forLevel(id,mode,workshop=false){
  if(id==='museum-clamp-apron')return mode==='assemble'?clamp:null;
  if(mode==='assemble'&&(id.startsWith('museum-')||workshop)&&museumGuides[id])return museumGuides[id];
  if(workshop&&mode==='assemble'){if(id==='dovetail')return dovetail;if(id==='burr-six')return burr;}
  return id.startsWith('entry-')?furniture:id==='rain-shelter-bench'?bench:mode==='assemble'?(id==='pinned'?pinned:id==='service-access-open'?service:null):null;
 }
 const editable=(level,g)=>level.pieces.filter(p=>!p.fixed&&!g.prefitted.some(m=>m.piece===p.id));
 function step(g,removed,mode='assemble',level){
  const hasPanel=g===bench||g===furniture;
  const name=id=>level?.pieces.find(piece=>piece.id===id)?.name;
  const panel=g===bench?'座板':name('seat')||'主板';
  if(mode==='assemble'){
   if(g===burr)return burrStep(removed);
   const current=g.steps.find(s=>s.pieces.some(id=>removed.includes(id)))||null;
   if(!hasPanel||!current||!level)return current;
   if(g===furniture&&current===g.steps[0]){
    return {...current,label:'① 合入'+panel,instruction:'先把'+panel+'沿框架的滑槽推入。'};
   }
   if(current===g.steps[1]){
    const pins=current.pieces.filter(id=>removed.includes(id));
    if(pins.length===1){
     const pin=name(pins[0]);
     return {...current,label:'② 装好'+pin,instruction:'把剩下的'+pin+'推入对应的销孔。'};
    }
   }
   return current;
  }
  if(!hasPanel)return null;
  const pins=g.steps[1].pieces.filter(id=>!removed.includes(id));
  if(pins.length===2)return {pieces:pins,label:'① 取下两枚木销',instruction:'先拉出左右两枚木销，哪一枚先取都可以。'};
  if(pins.length===1)return {pieces:pins,label:'① 取下'+(name(pins[0])||'剩下的木销'),instruction:'还剩一枚木销固定着'+panel+'。沿销孔把它抽出来。'};
  if(!removed.includes('seat'))return {pieces:['seat'],label:'② 抽出'+panel,instruction:'两枚木销已取下。沿滑槽抽出'+panel+'，框架留在原处。'};
  return null;
 }
 function completionText(g,mode){
  if(mode==='dismantle')return '木销和板件都已取下，框架仍在原位。可以放回场景。';
  if(g===bench)return '座板和两枚木销都装好了。可以撤销或放回场景。';
  return g.doneText||'接头已合好。可以放回场景，也可以取回穿销再观察。';
 }
 function allowed(g,removed,id,mode){if(g.prefitted.some(m=>m.piece===id))return false;return !!step(g,removed,mode)?.pieces.includes(id);}
 function direction(g,id,removed){return g===burr?burrStep(removed)?.directions[id]:g.steps.find(s=>s.pieces.includes(id))?.directions[id];}
 function blockedText(g,removed,id,mode='assemble'){
  if(mode==='dismantle')return '先取下木销，再沿滑槽抽出。';
  if(!removed.includes(id))return '这块木已经归位了。可以撤销上一步再观察。';
  if(g===burr){const next=burrStep(removed)?.next;return next?'先给'+next+'留出进槽的空间。':'后续入口被挡住了。可以撤销一步。';}
  return g.lockedText||(g===bench?'先装好座板。':'先装好榫头。');
 }
 function workshopHistory(level,g,history){
  if(g!==burr&&g!==dovetail&&g!==clamp&&!Object.values(museumGuides).includes(g))return history;
  let removed=editable(level,g).map(p=>p.id),count=0;
  for(const move of history){
   if(!allowed(g,removed,move.piece,'assemble')||move.direction!==direction(g,move.piece,removed))break;
   removed=removed.filter(id=>id!==move.piece);count++;
  }
  return history.slice(0,count);
 }
 function normalize(level,run,mode,P,E,g=bench){
  if(g.id!==bench.id){
   const match=run?.level===level.id&&run.mode===mode;
   const old=match&&E.restoreSession(JSON.stringify(run),P);
   const history=old?workshopHistory(level,g,old.history):[];
   const data=old?{...run,history,guideId:g.id}:{version:1,level:level.id,mode,history,action:'extract',guideId:g.id};
   const recovered=!!old&&history.length!==old.history.length;
   return {run:data,legal:!recovered&&old||E.restoreSession(JSON.stringify(data),P),recovered};
  }
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
  const last=history.at(-1);if(!g||g===burr||g===dovetail||g===clamp||last?.kind!=='insert'||g.prefitted.some(p=>p.piece===last.piece)||!g.steps.at(-1).pieces.includes(last.piece))return null;
  const vector=P.DIRECTIONS.find(d=>d.id===last.direction)?.vector,direction=P.DIRECTIONS.find(d=>vector&&d.vector.every((v,i)=>v===-vector[i]))?.id;
  return direction&&P.canExtract(level,removed,last.piece,direction).ok?{piece:last.piece,direction}:null;
 }
 const api={bench,furniture,pinned,service,forLevel,editable,step,completionText,allowed,direction,blockedText,normalize,restoreSession,takeback};root.AssemblyGuide=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
