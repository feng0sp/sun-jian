const assert=require('node:assert/strict');
const {P,E,C,D,solved,caveDone}=require('./helpers/campaign-fixtures.cjs');
const Next=require('../dist/campaign-continuation.js');
const S=require('../dist/campaign-story.js');
const full=()=>({...caveDone(),phase:'complete',frame:'bench-seat',finished:true,benchChecked:true,runs:{...caveDone().runs,bench:solved('rain-shelter-bench','assemble')}});
const restore=s=>D.restore(JSON.stringify(s),P,E,C);
let s=full(),r=restore(s);assert.equal(r.storyRevision,D.storyRevision);assert(r.finished);assert(!r.continuation.started);assert(!r.continuation.entryAccepted);
const original=JSON.stringify(r.runs);s=r;s.continuation={...Next.fresh(),started:true,active:true,noticeSeen:true,departed:true,workshopSeen:true,stage:'registered',entryAccepted:true,reviewed:true};
r=restore(s);assert.equal(r.continuation.stage,'practice');assert(!r.continuation.entryAccepted);assert.equal(JSON.stringify(r.runs),original);
s.continuation.run=Next.seed(P,E);r=restore(s);const legal=Next.legalRun(r.continuation,P,E),l=P.LEVELS.find(l=>l.id==='pinned');assert.equal(legal.history.length,0);assert.equal(P.availableInsertions(l,legal.removed).length,2);assert(!legal.completed);
// The planted diagnostic state has a real, legal undo followed by a complete assembly.
s.continuation.run=solved('pinned','assemble');s.continuation.reviewed=false;r=restore(s);assert.equal(r.continuation.stage,'review');assert(!r.continuation.entryAccepted);
s.continuation.reviewed=true;r=restore(s);assert(r.continuation.entryAccepted);assert.equal(r.continuation.stage,'registered');assert.equal(JSON.stringify(r.runs),original);
// Losing or undoing a proof cannot keep a registration based on a stale completed flag.
s.continuation.run={...s.continuation.run,history:[]};r=restore(s);assert.equal(r.continuation.stage,'practice');assert(!r.continuation.reviewed);assert(!r.continuation.entryAccepted);
s=full();s.phase='arrival';s.runs={};s.continuation={...Next.fresh(),started:true,active:true,noticeSeen:true,departed:true};r=restore(s);assert(!r.continuation.active);assert(!r.continuation.started);
for(const bad of [null,{},[],{revision:1,started:true,run:{level:'straight',mode:'assemble',history:[]}}])assert.equal(Next.restore(bad,true,P,E).entryAccepted,false);
s=restore(full());s.continuation={...Next.fresh(),started:true,active:true};assert(S.resolve('continuationMeetup',s));assert(!S.resolve('continuationEntry',s));assert.equal(S.frameFor('continuationMeetup',s),'bench-seat');
s.continuation.active=false;assert(!S.resolve('continuationMeetup',s));
console.log('PASS continuation migration, diagnostic seed, legal proof, registration prerequisites, isolation and conditional dialogue');
