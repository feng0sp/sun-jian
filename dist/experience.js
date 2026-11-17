/* Browser-local progress migration and playtest records. No network access. */
(function(root){
 'use strict';
 function migrate(raw,P){
  let s={},existing=false;try{if(raw){s=JSON.parse(raw);existing=!!s&&typeof s==='object'&&!Array.isArray(s);if(!existing)s={};}}catch{}
  const list=(values,levels)=>[...new Set((Array.isArray(values)?values:[]).filter(id=>levels.some(l=>l.id===id)))];
  const cleared=list(s.cleared,P.MAIN_LEVELS),assembled=list(s.assembled,P.MAIN_LEVELS);
  const tutorialCleared=list([...(Array.isArray(s.cleared)?s.cleared:[]),...(Array.isArray(s.tutorialCleared)?s.tutorialCleared:[])],P.TUTORIALS);
  const tutorialAssembled=list([...(Array.isArray(s.assembled)?s.assembled:[]),...(Array.isArray(s.tutorialAssembled)?s.tutorialAssembled:[])],P.TUTORIALS);
  const tutorialStatus=tutorialCleared.length===P.TUTORIALS.length?'completed':['started','skipped','completed'].includes(s.tutorialStatus)?s.tutorialStatus:existing?'skipped':'new';
  return {cleared,assembled,tutorialCleared,tutorialAssembled,tutorialStatus,sound:s.sound===true,experimentCleared:s.experimentCleared===true};
 }
 function trial(level,mode){return {id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),level,mode,visibleMs:0,firstSuccessMs:null,completedMs:null,attempts:0,blocked:0,hintLevel:0,inputs:{drag:0,button:0,keyboard:0},started:false,sinceProgressMs:0,blockedSinceProgress:0,nudged:false};}
 function advance(t,ms,visible){if(!visible||t.completedMs!==null)return;t.visibleMs+=ms;if(t.started)t.sinceProgressMs+=ms;}
 function action(t,input){t.started=true;t.attempts++;if(input in t.inputs)t.inputs[input]++;}
 function success(t){if(t.firstSuccessMs===null)t.firstSuccessMs=t.visibleMs;t.sinceProgressMs=0;t.blockedSinceProgress=0;t.nudged=false;}
 function shouldNudge(t){return t.started&&!t.nudged&&t.completedMs===null&&(t.blockedSinceProgress>=3||t.sinceProgressMs>=45000);}
 // Rebuild only committed moves through the rule engine. A preview or stale offset
 // can never become a saved piece position, including in the borrowing experiment.
 function restoreSession(raw,P){
  try{
   const s=JSON.parse(raw);if(s?.version!==1||!['dismantle','assemble'].includes(s.mode)||!Array.isArray(s.history)||s.history.length>200)return null;
   const l=[...P.LEVELS,P.EXPERIMENT].find(l=>l.id===s.level);if(!l||(l===P.EXPERIMENT&&s.mode==='assemble'))return null;
   let removed=s.mode==='assemble'?l.pieces.filter(p=>!p.fixed).map(p=>p.id):[];const offsets={},history=[];
   for(const move of s.history){
    if(!move||!P.DIRECTIONS.some(d=>d.id===move.direction)||!l.pieces.some(p=>p.id===move.piece&&!p.fixed))return null;
    const {piece,direction}=move;
    if(move.kind==='shift'){
     if(l!==P.EXPERIMENT||!P.canTranslate(l,removed,piece,direction,l.step,offsets).ok)return null;
     const from=offsets[piece]||[0,0,0],d=P.DIRECTIONS.find(d=>d.id===direction),to=from.map((v,i)=>v+d.vector[i]*l.step);offsets[piece]=to;history.push({kind:'shift',piece,direction,from,to});
    }else if(move.kind===(s.mode==='assemble'?'insert':'extract')){
     if(!(s.mode==='assemble'?P.canInsert:P.canExtract)(l,removed,piece,direction,offsets).ok)return null;
     removed=s.mode==='assemble'?removed.filter(id=>id!==piece):[...removed,piece];history.push({kind:move.kind,piece,direction});
    }else return null;
   }
   const count=l.pieces.filter(p=>!p.fixed).length,completed=s.mode==='assemble'?removed.length===0:removed.length===count;
   const t=trial(l.id,s.mode),input=s.trial||{},number=(v,max=604800000)=>Number.isFinite(v)&&v>=0?Math.min(v,max):0;
   if(typeof input.id==='string'&&input.id.length<80)t.id=input.id;
   t.visibleMs=number(input.visibleMs);t.firstSuccessMs=history.length?Math.min(number(input.firstSuccessMs),t.visibleMs):null;t.completedMs=completed?t.visibleMs:null;
   for(const key of ['attempts','blocked','blockedSinceProgress'])t[key]=Math.floor(number(input[key],100000));
   t.hintLevel=Math.min(3,Math.floor(number(input.hintLevel,3)));t.sinceProgressMs=number(input.sinceProgressMs);t.started=input.started===true||history.length>0;t.nudged=input.nudged===true;
   for(const key of Object.keys(t.inputs))t.inputs[key]=Math.floor(number(input.inputs?.[key],100000));
   return {level:l.id,experiment:l===P.EXPERIMENT,mode:s.mode,action:l===P.EXPERIMENT&&s.action==='step'?'step':'extract',removed,offsets,history,trial:t,completed};
  }catch{return null;}
 }
 const api={migrate,trial,advance,action,success,shouldNudge,restoreSession};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PuzzleExperience=api;
})(typeof window==='undefined'?globalThis:window);
