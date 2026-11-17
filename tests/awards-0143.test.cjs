const assert=require('node:assert/strict');
const A=require('../dist/campaign-awards.js'),F=require('../dist/campaign-finale.js'),D=require('../dist/campaign-data.js');
const {P,E,C}=require('./helpers/campaign-fixtures.cjs'),{base,path}=require('./finale-state.test.cjs');
const restore=s=>D.restore(JSON.stringify(s),P,E,C);
assert.equal(A.name('  '),'陈屿');assert.equal(A.name('😀'.repeat(15)),'😀'.repeat(12));assert(!A.certificate('<img>','桌上书架').includes('<img>'));assert(A.certificate('小陈','床边小几').includes('3,000'));
for(const key of ['stool','table','shelf']){
 const s=base(),c=s.continuation;F.action(c,'begin',P,E);F.action(c,'choose:'+key,P,E);const w=F.choice(c);
 c.entryRun=path(w.id,'assemble');c.inspected=['panel','moving','service'];c.recordsReady=c.packed=c.arrivalSeen=c.contestRegistered=true;c.contestRun=path(w.id,'assemble');c.serviceDemoRun=path(w.id,'dismantle');c.serviceReturnRun=path(w.id,'assemble');c.presented=c.judged=true;c.judgeMet=true;
 const proofs=JSON.stringify([c.entryRun,c.contestRun,c.serviceDemoRun,c.serviceReturnRun]);
 assert(!F.action(c,'award:receive',P,E));assert(F.action(c,'award:stage',P,E));assert(!F.action(c,'award:stage',P,E));
 assert(F.action(c,'award:receive',P,E));assert(c.rewardRecorded);assert(!c.resultSeen);assert(!F.action(c,'award:receive',P,E));
 let r=restore(s);assert.equal(r.continuation.awardStep,2);assert(r.continuation.rewardRecorded);assert(!r.continuation.resultSeen);
 assert(F.action(c,'award:photo',P,E));assert(F.action(c,'award:return',P,E));assert(F.action(c,'ending',P,E));
 assert.equal(JSON.stringify([c.entryRun,c.contestRun,c.serviceDemoRun,c.serviceReturnRun]),proofs);
 const old=structuredClone(s);old.storyRevision=11;old.continuation.revision=4;delete old.continuation.awardStep;delete old.continuation.rewardRecorded;
 r=restore(old);assert.equal(r.continuation.stage,'ending');assert.equal(r.continuation.awardStep,4);assert(r.continuation.rewardRecorded);assert(r.continuation.zhouContact);
 const corrupt=structuredClone(s);corrupt.continuation.serviceReturnRun.history.pop();r=restore(corrupt);assert(!r.continuation.rewardRecorded);assert(!r.continuation.resultSeen);
 s.continuation.stage='contest-service-out';s.playerName='小陈';const judge=F.resolve('continuationFinalJudge',s);assert(judge.lines[0][1].includes('小陈'));assert(judge.lines[1][1].includes(w.name));
 for(const id of ['continuationPrepPhoto','continuationFinalZhou'])assert(F.nodes[id].lines.filter(l=>l[0].includes('周伯')).every(l=>l[0].includes('消息')));
}
console.log('PASS award guards, per-step restoration, old wins, honest proofs, local name escaping and remote Zhou for all three works');
