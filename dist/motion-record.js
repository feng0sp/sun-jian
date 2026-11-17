/* A read-only reconstruction of the player's committed moves, never a solver. */
(function(root){
 'use strict';
 function build(raw,P,E){
  const run=E.restoreSession(JSON.stringify(raw),P);if(!run?.history.length)return null;
  const level=[...P.LEVELS,P.EXPERIMENT].find(l=>l.id===run.level),steps=[];
  let removed=run.mode==='assemble'?level.pieces.filter(p=>!p.fixed).map(p=>p.id):[],offsets={};
  for(const move of run.history){
   const vector=P.DIRECTIONS.find(d=>d.id===move.direction).vector,origin=[...(offsets[move.piece]||[0,0,0])];
   const distance=move.kind==='shift'?level.step:move.kind==='insert'?P.insertionRange(level,removed,move.piece,move.direction).distance:P.motionRange(level,removed,move.piece,move.direction,offsets).exitDistance;
   const start=move.kind==='insert'?vector.map(v=>-v*distance):origin;
   steps.push({...move,start,distance,vector,before:{removed:[...removed],offsets:JSON.parse(JSON.stringify(offsets))}});
   if(move.kind==='shift')offsets[move.piece]=[...move.to];
   else removed=move.kind==='insert'?removed.filter(id=>id!==move.piece):[...removed,move.piece];
  }
  const final={removed,offsets},points=[];
  // Frame the whole recorded path once. Scrubbing must not pump the camera zoom.
  for(const piece of level.pieces){const poses=[[0,0,0],...steps.filter(s=>s.piece===piece.id).flatMap(s=>[s.start,s.start.map((v,i)=>v+s.vector[i]*s.distance)])];for(const pose of poses)for(const shape of piece.shapes)for(const v of shape.vertices)points.push(v.map((x,i)=>x+pose[i]));}
  function frame(value){
   const progress=Math.max(0,Math.min(steps.length,Number.isFinite(value)?value:0)),index=Math.floor(progress),step=steps[index],fraction=progress-index,base=step?.before||final;
   const result={removed:[...base.removed],offsets:JSON.parse(JSON.stringify(base.offsets)),active:step?.piece||null,index,fraction,progress};
   if(step){result.removed=result.removed.filter(id=>id!==step.piece);result.offsets[step.piece]=step.start.map((v,i)=>v+step.vector[i]*step.distance*fraction);}
   return result;
  }
  return {level,mode:run.mode,steps,points,frame};
 }
 const api={build};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.JointMotionRecord=api;
})(typeof window==='undefined'?globalThis:window);
