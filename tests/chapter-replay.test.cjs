'use strict';
const assert=require('node:assert/strict');
const {D,P,E,C}=require('./helpers/campaign-fixtures.cjs');
const Chapters=require('../dist/campaign-chapters.js');
const F=require('../dist/campaign-finale.js');

const start=id=>Chapters.start(id,D,P,E,C,D.fresh());
function completedJourney(){
 const save=start('results'),c=save.continuation;
 for(const action of ['award:stage','award:receive','award:photo','award:return','ending']){
  assert(F.action(c,action,P,E));
 }
 return D.restore(JSON.stringify(save),P,E,C);
}

if(require.main===module){
 const fresh=D.fresh();
 assert.deepEqual(fresh.topics,[]);
 fresh.topics.push('stay');
 assert.deepEqual(D.fresh().topics,[],'A new journey has its own dialogue choices');
 assert.deepEqual(D.restore(JSON.stringify(fresh),P,E,C).topics,['stay']);
 for(const entry of Chapters.chapters){
  const save=start(entry.id);
  assert.equal(save.phase,entry.phase);assert.equal(save.frame,entry.frame);
  if(entry.stage)assert.equal(save.continuation.stage,entry.stage);
  assert(!Chapters.cleared(save,P,E));
 }
 const complete=completedJourney();
 assert(Chapters.cleared(complete,P,E));
 assert.equal(complete.continuation.workChoice,'stool');
 complete.continuation.serviceReturnRun.history=[];
 assert(!Chapters.cleared(complete,P,E),'Flags alone cannot unlock a chapter');
 assert.equal(start('fake'),null);
 console.log('PASS seven chapter starts, first work choice, and validated full-journey unlock');
}

module.exports={start,completedJourney};
