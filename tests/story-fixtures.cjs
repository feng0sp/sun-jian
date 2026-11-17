const D=require('../dist/story-data'),P=require('../dist/puzzle-core'),E=require('../dist/experience');
function finishedStory(count=4){
 const s=D.fresh();Object.assign(s,{active:true,openingSeen:true,arrivalDone:true,learningAccepted:true,heritageKnown:true,beat:count===4?9:count*2+1,talk:null});
 for(const t of D.tasks.slice(0,count)){
  const l=P.LEVELS.find(l=>l.id===t.levelId),history=[];let removed=t.mode==='assemble'?l.pieces.filter(p=>!p.fixed).map(p=>p.id):[];
  while(t.mode==='assemble'?removed.length:P.availableMoves(l,removed).length){const m=(t.mode==='assemble'?P.availableInsertions:P.availableMoves)(l,removed)[0];history.push({kind:t.mode==='assemble'?'insert':'extract',...m});removed=t.mode==='assemble'?removed.filter(id=>id!==m.piece):[...removed,m.piece];}
  s.completed.push(t.id);s.runs[t.id]={version:1,level:t.levelId,mode:t.mode,history,action:'extract',trial:E.trial(t.levelId,t.mode)};
 }
 // Exercise the upgrade from an existing revision 3 story save.
 delete s.study;delete s.studyRuns;return s;
}
module.exports={finishedStory};
