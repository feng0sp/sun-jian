/* Validated starting states for the independent chapter replay. */
(function(root){
 'use strict';
 const F=root.CampaignFinale||(typeof require==='function'?require('./campaign-finale.js'):null);
 const Next=root.CampaignContinuation||(typeof require==='function'?require('./campaign-continuation.js'):null);
 const Guide=root.AssemblyGuide||(typeof require==='function'?require('./assembly-guide.js'):null);
 const Furniture=root.EntryFurniture||(typeof require==='function'?require('./entry-furniture.js'):null);
 const chapters=[
  {id:'arrival',title:'循着灯光',summary:'从雨中的下山路开始，进村借宿。',phase:'arrival',frame:'mountain-rain'},
  {id:'learning',title:'灯下识木',summary:'在周伯家安顿好，看看椅子和桌上的样木。',phase:'settle',frame:'room'},
  {id:'repair',title:'修凳与离村',summary:'第二天清晨，帮周伯取料、修长凳。',phase:'morning',frame:'room'},
  {id:'workshop',title:'回去以后',summary:'返校后，带着折页去开放工坊。',phase:'complete',frame:'bench-seat',stage:'home'},
  {id:'making',title:'做成自己的作品',summary:'翻开备赛图纸，从第一件作品换鞋小凳开始。',phase:'complete',frame:'bench-seat',stage:'work-choice'},
  {id:'contest',title:'把作品摆出来',summary:'带换鞋小凳抵达省城，登记并动手展示。',phase:'complete',frame:'bench-seat',stage:'contest-arrival'},
  {id:'results',title:'第三名，还有下一页',summary:'等候公布名次，领奖并把消息告诉周伯。',phase:'complete',frame:'bench-seat',stage:'results'}
 ];
 const proofs=['entryRun','contestRun','serviceDemoRun','serviceReturnRun'];
 function cleared(save,P,E){
  const c=save.continuation;
  return save.finished&&c.endingSeen&&c.rewardRecorded&&c.resultSeen&&c.judged&&proofs.every(slot=>F.done(c,slot,P,E));
 }
 function solved(levelId,mode,P,E){
  const level=P.LEVELS.find(item=>item.id===levelId);
  if(!level)throw Error('Missing chapter model '+levelId);
  const movable=level.pieces.filter(piece=>!piece.fixed).map(piece=>piece.id);
  const prefitted=mode==='assemble'?(Guide.forLevel(levelId,mode,true)?.prefitted||[]):[];
  const history=prefitted.map(move=>({...move,kind:'insert'}));
  if(mode==='assemble'){
   const remaining=movable.filter(id=>!prefitted.some(move=>move.piece===id));
   const route=P.assemblyRoute(level,remaining);
   if(!route)throw Error('No assembly route for '+levelId);
   history.push(...route.map(move=>({...move,kind:'insert'})));
  }else{
   const removed=[];
   for(let i=0;i<movable.length;i++){
    const move=P.availableMoves(level,removed)[0];
    if(!move)throw Error('No removal route for '+levelId);
    history.push({...move,kind:'extract'});removed.push(move.piece);
   }
  }
  const run={version:1,level:levelId,mode,action:'extract',history};
  if(prefitted.length)run.guideRevision=1;
  if(!E.restoreSession(JSON.stringify(run),P)?.completed)throw Error('Invalid chapter history '+levelId);
  return run;
 }
 function start(id,D,P,E,C,preferences){
  const chapter=chapters.find(entry=>entry.id===id);
  if(!chapter)return null;
  const index=chapters.indexOf(chapter),state=D.fresh(),c=state.continuation;
  state.phase=chapter.phase;state.frame=chapter.frame;
  state.visited=D.phases.slice(0,D.phases.indexOf(state.phase)+1);
  state.settings={...preferences.settings};state.playerName=preferences.playerName;
  state.playerNameConfirmed=true;
  const complete=task=>solved(task.level,task.mode,P,E);
  if(index>=2){
   for(const t of D.tasks){state.runs[t.id]=complete(t);state.done.push(t.id);}
   state.spoken.push('night');
  }
  if(index>=3){
   for(const key of D.requiredCaveIds){
    const level=key==='mouth-latch'?'store-door-latch':C.nodes.find(node=>node.id===key).level;
    state.runs['cave:'+key]=solved(level,'dismantle',P,E);
   }
   state.runs.bench=solved('rain-shelter-bench','assemble',P,E);
   Object.assign(c,{started:true,active:true,noticeSeen:true,goodbyeSeen:true,departed:true,zhouContact:true});
  }
  if(index>=4){
   Object.assign(c,{workshopSeen:true,run:solved('pinned','assemble',P,E),reviewed:true,entryAccepted:true,
    designStarted:true,purpose:'comfort',purposeChoice:'comfort',peerMet:true,variant:'side',designReviewed:true,workshopReflected:true});
   for(const t of [...Object.values(Next.serviceTasks),...Object.values(Next.workshops)])c[t.slot]=complete(t);
   c.museum.passed=true;c.museum.introduced=true;
   F.action(c,'begin',P,E);
  }
  if(index>=5){
   F.action(c,'choose:'+Furniture.choices[0].key,P,E);
   c.entryRun=complete(F.task(c,'entry-stool-assemble'));
   for(const key of ['panel','moving','service'])F.action(c,'inspect:'+key,P,E);
   F.action(c,'records',P,E);F.action(c,'photo-noted',P,E);F.action(c,'pack',P,E);
  }
  if(index>=6){
   F.action(c,'arrived',P,E);F.action(c,'register',P,E);
   for(const id of ['contest-assemble','contest-service-out','contest-service-back']){
    const task=F.task(c,id);c[task.slot]=complete(task);
   }
   c.judgeMet=true;
   F.action(c,'presented',P,E);F.action(c,'judged',P,E);
  }
  const restored=D.restore(JSON.stringify(state),P,E,C);
  if(restored.phase!==chapter.phase||restored.frame!==chapter.frame||
    chapter.stage&&restored.continuation.stage!==chapter.stage)throw Error('Invalid starting state for '+id);
  return restored;
 }
 const api={chapters,cleared,start,solved};root.CampaignChapters=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
