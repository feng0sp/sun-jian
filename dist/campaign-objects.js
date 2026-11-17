/* The physical sample on the table has one position, separate from lesson proof. */
(function(root){
 'use strict';
 const P=root.JointPuzzle||(typeof require==='function'?require('./puzzle-core.js'):null);
 const E=root.PuzzleExperience||(typeof require==='function'?require('./experience.js'):null);
 if(typeof module!=='undefined')require('./context-puzzles.js');
 const levels=['straight','lap','pinned','chair-rail-joint','offcut-corner-lap'];
 const names={straight:'直榫样木',lap:'半榫木条',pinned:'带销样木','chair-rail-joint':'椅腿与横枨试配件','offcut-corner-lap':'端部搭接试配料'};
 const freshRun=(level,mode='dismantle')=>({version:1,level,mode,history:[],action:'extract'});
 function valid(run,level){
  return run?.level===level&&E.restoreSession(JSON.stringify(run),P);
 }
 function restore(raw,state){
  const result={};
  for(const level of levels){
   const run=raw?.[level];
   if(valid(run,level)){result[level]={...run,history:valid(run,level).history};continue;}
   const back=level==='straight'&&state.runs?.['learn-straight-back'];
   const out=state.runs?.['learn-'+level+'-out'];
   result[level]=valid(back,level)?back:valid(out,level)?out:freshRun(level);
  }
  return result;
 }
 function position(state,level){
  const run=state.roomObjects?.[level]||freshRun(level);
  const legal=valid(run,level)||valid(freshRun(level),level);
  return {level,removed:legal.removed,mode:legal.mode,completed:legal.completed,history:legal.history};
 }
 function next(state,level){
  if(!levels.includes(level))return null;
  const run=state.roomObjects?.[level]||freshRun(level),legal=valid(run,level);
  const mode=legal?.completed?(legal.mode==='dismantle'?'assemble':'dismantle'):legal?.mode||'dismantle';
  return {id:'object:'+level,level,mode,roomObject:level,replay:true,name:names[level],
   goal:mode==='assemble'?'把取下的木件合回原来的接面。':'沿接面试着分开木件。'};
 }
 function begin(state,task){
  const old=state.roomObjects[task.roomObject];
  if(!valid(old,task.level)||old.mode!==task.mode||valid(old,task.level).completed)state.roomObjects[task.roomObject]=freshRun(task.level,task.mode);
  return state.roomObjects[task.roomObject];
 }
 function capture(state,level,run){
  if(!levels.includes(level)||!valid(run,level))return false;
  state.roomObjects[level]={...run,history:valid(run,level).history};return true;
 }
 function doorRun(run){
  if(!run||!['pinned','store-door-latch'].includes(run.level)||run.mode!=='dismantle')return null;
  const legal=valid(run,run.level);if(!legal)return null;
  // A finished old mechanism remains valid evidence of opening that same door.
  if(legal.completed||run.level==='store-door-latch')return {run,legal,recovered:false};
  const converted={...run,level:'store-door-latch',history:legal.history.filter(m=>m.piece==='pin')};
  const proof=valid(converted,'store-door-latch');
  if(proof)return {run:converted,legal:proof,recovered:false};
  const clean=freshRun('store-door-latch');
  return {run:clean,legal:valid(clean,'store-door-latch'),recovered:legal.history.length>0};
 }
 const api={levels,names,freshRun,restore,position,next,begin,capture,doorRun};
 root.CampaignObjects=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
