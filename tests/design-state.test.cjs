const assert=require('node:assert/strict'),{P,E,C,D,solved,caveDone}=require('./helpers/campaign-fixtures.cjs'),Next=require('../dist/campaign-continuation.js');
function registered(){const s={...caveDone(),phase:'complete',frame:'bench-seat',finished:true,benchChecked:true};s.runs.bench=solved('rain-shelter-bench','assemble');s.continuation={...Next.fresh(),revision:1,started:true,active:true,noticeSeen:true,departed:true,workshopSeen:true,run:solved('pinned','assemble'),reviewed:true,entryAccepted:true,stage:'registered'};return s;}
const Guide=require('../dist/assembly-guide.js');
const restore=s=>D.restore(JSON.stringify(s),P,E,C);
let s=registered(),r=restore(s);assert.equal(r.continuation.revision,7);assert.equal(r.continuation.stage,'registered');assert(r.continuation.entryAccepted);const main=JSON.stringify(r.runs);
s=r;s.continuation.designStarted=true;r=restore(s);assert.equal(r.continuation.stage,'purpose');
s=r;s.continuation.purposeChoice='moving';s.continuation.purpose='moving';r=restore(s);assert.equal(r.continuation.stage,'peer');
s=r;s.continuation.peerMet=true;r=restore(s);assert.equal(r.continuation.stage,'service-check');
// Corrupt stage/flags never substitute for the actual maintenance histories.
s.continuation.stage='design-ready';s.continuation.variant='side';s.continuation.designReviewed=true;r=restore(s);assert.equal(r.continuation.stage,'service-check');assert(!r.continuation.designReviewed);
s=r;s.continuation.serviceRun=solved('service-access-closed','dismantle');r=restore(s);assert.equal(r.continuation.stage,'service-choice');
s=r;s.continuation.variant='side';r=restore(s);assert.equal(r.continuation.stage,'service-build');
s=r;s.continuation.serviceBackRun=solved('service-access-open','assemble');r=restore(s);assert.equal(r.continuation.stage,'service-test');
s=r;s.continuation.serviceOutRun=solved('service-access-open','dismantle');r=restore(s);assert.equal(r.continuation.stage,'service-review');
s=r;s.continuation.designReviewed=true;r=restore(s);assert.equal(r.continuation.stage,'workshop-dovetail-out');
const legacy=structuredClone(s);legacy.continuation.revision=5;
assert(restore(legacy).continuation.workshopLegacy);assert.equal(restore(legacy).continuation.stage,'design-ready');
const beforeWorkshop=structuredClone(s);
for(const [slot,id,mode,next]of [
 ['dovetailOutRun','dovetail','dismantle','workshop-dovetail-back'],
 ['dovetailBackRun','dovetail','assemble','workshop-burr-six-back'],
 ['burrBackRun','burr-six','assemble','workshop-reflection']
]){
 s=r;
 const run=solved(id,mode),withoutLast={...run,history:run.history.slice(0,-1)},stage=s.continuation.stage;
 s.continuation[slot]=withoutLast;
 r=restore(s);assert.equal(r.continuation.stage,stage);assert.deepEqual(r.continuation[slot].history,withoutLast.history);
 s.continuation[slot]=run;r=restore(s);assert.equal(r.continuation.stage,next);
}
s=r;s.continuation.workshopReflected=true;r=restore(s);assert.equal(r.continuation.stage,'museum');
beforeWorkshop.continuation.workshopReflected=true;beforeWorkshop.continuation.productionStarted=true;
beforeWorkshop.continuation.workChoice='shelf';assert.equal(restore(beforeWorkshop).continuation.stage,'workshop-dovetail-out');
assert.equal(restore(beforeWorkshop).continuation.productionStarted,false);assert.equal(JSON.stringify(r.runs),main);assert(!r.continuation.thirdPlace);
// Undoing a formerly winning proof restores the correct local checkpoint.
s=JSON.parse(JSON.stringify(r));s.continuation.serviceOutRun.history.pop();r=restore(s);assert.equal(r.continuation.stage,'service-test');assert(!r.continuation.designReviewed);assert.equal(r.continuation.serviceOutRun.history.length,1);
s=JSON.parse(JSON.stringify(s));s.continuation.serviceBackRun.history=[];r=restore(s);assert.equal(r.continuation.stage,'service-build');assert.equal(r.continuation.serviceOutRun,null);
// Village completion and a pinned practice alone cannot forge the new task histories.
s=registered();s.continuation.designStarted=true;s.continuation.purpose='comfort';s.continuation.peerMet=true;s.continuation.serviceRun=solved('pinned','dismantle');r=restore(s);assert.equal(r.continuation.stage,'service-check');assert.equal(r.continuation.serviceRun,null);
for(const purpose of ['comfort','moving','repair']){s=registered();s.continuation.designStarted=true;s.continuation.purposeChoice=purpose;r=restore(s);assert(Next.resolve('continuationPurpose',r));assert.equal(r.continuation.stage,'purpose');}
const burr=P.LEVELS.find(l=>l.id==='burr-six'),guide=Guide.forLevel(burr.id,'assemble',true);
const seen=new Set();let prevented=0;
function checkBurr(removed){
 const key=[...removed].sort().join(',');if(seen.has(key)||!removed.length)return;seen.add(key);
 const guided=Guide.step(guide,removed);
 assert(guided.pieces.length>0);
 for(const move of P.availableInsertions(burr,removed)){
  const next=removed.filter(id=>id!==move.piece);
  if(P.assemblyRoute(burr,next))assert(guided.pieces.includes(move.piece));else{assert(!guided.pieces.includes(move.piece));prevented++;}
 }
 for(const id of guided.pieces){
  assert(P.canInsert(burr,removed,id,Guide.direction(guide,id,removed)).ok);
  checkBurr(removed.filter(piece=>piece!==id));
 }
}
checkBurr(burr.pieces.map(p=>p.id));assert(prevented>0);
console.log('PASS',seen.size,'solvable lock states;',prevented,'premature inserts blocked');
console.log('PASS revision-1 entry migration, all design checkpoints, proof recovery, corruption guards and original history isolation');
