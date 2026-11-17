const assert=require('node:assert/strict'),{P,E,C,D,solved,caveDone}=require('./helpers/campaign-fixtures.cjs'),Next=require('../dist/campaign-continuation.js');
function registered(){const s={...caveDone(),phase:'complete',frame:'bench-seat',finished:true,benchChecked:true};s.runs.bench=solved('rain-shelter-bench','assemble');s.continuation={...Next.fresh(),revision:1,started:true,active:true,noticeSeen:true,departed:true,workshopSeen:true,run:solved('pinned','assemble'),reviewed:true,entryAccepted:true,stage:'registered'};return s;}
const restore=s=>D.restore(JSON.stringify(s),P,E,C);
let s=registered(),r=restore(s);assert.equal(r.continuation.revision,4);assert.equal(r.continuation.stage,'registered');assert(r.continuation.entryAccepted);const main=JSON.stringify(r.runs);
s=r;s.continuation.designStarted=true;r=restore(s);assert.equal(r.continuation.stage,'purpose');
s=r;s.continuation.purposeChoice='moving';s.continuation.purpose='moving';r=restore(s);assert.equal(r.continuation.stage,'peer');
s=r;s.continuation.peerMet=true;r=restore(s);assert.equal(r.continuation.stage,'service-check');
// Corrupt stage/flags never substitute for the actual maintenance histories.
s.continuation.stage='design-ready';s.continuation.variant='side';s.continuation.designReviewed=true;r=restore(s);assert.equal(r.continuation.stage,'service-check');assert(!r.continuation.designReviewed);
s=r;s.continuation.serviceRun=solved('service-access-closed','dismantle');r=restore(s);assert.equal(r.continuation.stage,'service-choice');
s=r;s.continuation.variant='side';r=restore(s);assert.equal(r.continuation.stage,'service-build');
s=r;s.continuation.serviceBackRun=solved('service-access-open','assemble');r=restore(s);assert.equal(r.continuation.stage,'service-test');
s=r;s.continuation.serviceOutRun=solved('service-access-open','dismantle');r=restore(s);assert.equal(r.continuation.stage,'service-review');
s=r;s.continuation.designReviewed=true;r=restore(s);assert.equal(r.continuation.stage,'design-ready');assert.equal(JSON.stringify(r.runs),main);assert(!r.continuation.thirdPlace);
// Undoing a formerly winning proof restores the correct local checkpoint.
s=JSON.parse(JSON.stringify(r));s.continuation.serviceOutRun.history.pop();r=restore(s);assert.equal(r.continuation.stage,'service-test');assert(!r.continuation.designReviewed);assert.equal(r.continuation.serviceOutRun.history.length,1);
s=JSON.parse(JSON.stringify(s));s.continuation.serviceBackRun.history=[];r=restore(s);assert.equal(r.continuation.stage,'service-build');assert.equal(r.continuation.serviceOutRun,null);
// Village completion and a pinned practice alone cannot forge the new task histories.
s=registered();s.continuation.designStarted=true;s.continuation.purpose='comfort';s.continuation.peerMet=true;s.continuation.serviceRun=solved('pinned','dismantle');r=restore(s);assert.equal(r.continuation.stage,'service-check');assert.equal(r.continuation.serviceRun,null);
for(const purpose of ['comfort','moving','repair']){s=registered();s.continuation.designStarted=true;s.continuation.purposeChoice=purpose;r=restore(s);assert(Next.resolve('continuationPurpose',r));assert.equal(r.continuation.stage,'purpose');}
console.log('PASS revision-1 entry migration, all design checkpoints, proof recovery, corruption guards and original history isolation');
