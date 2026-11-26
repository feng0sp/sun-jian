const assert=require('node:assert/strict');
const {P,E,C,D,solved,learned,caveDone}=require('./helpers/campaign-fixtures.cjs');
const restore=s=>D.restore(JSON.stringify(s),P,E,C);
const node=id=>C.nodes.find(n=>n.id===id);
function add(s,id){const n=node(id);s.runs['cave:'+id]=solved(n.level,'dismantle');s.cave.completed.push(id);return s;}
function inStore(){const s=learned();s.phase='cave';s.scene='cave';s.frame='store-door';return s;}
let s=D.fresh(),r=restore(s);
assert.equal(r.version,2);assert.equal(r.storyRevision,D.storyRevision);assert.equal(r.frame,'mountain-rain');assert(!D.canReturn(r));assert.equal(r.leavePracticeReminderSeen,false);
assert.equal(D.requiredCaveIds.length,3);assert.equal(D.optionalCaveIds.length,5);assert.equal(new Set([...D.requiredCaveIds,...D.optionalCaveIds]).size,8);
// The rack and sketch box are independent: both completion orders must survive reload.
for(const order of [['mouth-latch','rack-frame','stone-box'],['mouth-latch','stone-box','rack-frame']]){
 s=inStore();for(const id of order){add(s,id);r=restore(s);assert.deepEqual(r.cave.completed,C.nodes.filter(n=>order.slice(0,s.cave.completed.length).includes(n.id)).map(n=>n.id));assert.equal(D.canReturn(r),s.cave.completed.length===3);s=r;}
 assert.equal(r.cave.completed.length,3);assert(D.canEnterFrame(r,'store-sky'));assert(!D.canEnterFrame(r,'room'));
 s.phase='return';s.frame='shelter';r=restore(s);assert.equal(r.phase,'return');assert.equal(r.frame,'shelter');assert(r.suppliesCollected);assert(D.canEnterFrame(r,'bench-detail'));
}
// Optional locks are real independent progress, not a required completed prefix.
s=add(add(inStore(),'mouth-latch'),'exit-knot');s.frame='store-sky';r=restore(s);assert.deepEqual(r.cave.completed,['mouth-latch','exit-knot']);assert.equal(r.frame,'store-sky');assert(!D.canReturn(r));
s=add(add(add(r,'stone-box'),'rack-frame'),'cabinet-knot');r=restore(s);assert.equal(r.cave.completed.length,5);assert(D.canReturn(r));
// Old physical positions map to image areas, but a forged marker cannot open the gate.
s=inStore();s.version=1;s.storyRevision=2;s.cave.position=[0,1.65,-72];s.cave.completed=C.nodes.map(n=>n.id);delete s.frame;r=restore(s);assert.equal(r.frame,'store-door');assert.deepEqual(r.cave.completed,[]);assert.equal(r.cave.position[2],3);
for(const [z,frame]of [[-5,'store-door'],[-25,'store-shallow'],[-45,'store-middle'],[-65,'store-sky']]){
 s=add(inStore(),'mouth-latch');s.version=1;delete s.frame;s.cave.position=[0,1.65,z];r=restore(s);assert.equal(r.frame,frame);assert.equal(r.cave.position[2],z);
}
// Restore legal nested v1 cave histories if the canonical field was absent.
s=inStore();s.version=1;s.cave.runs['mouth-latch:dismantle']=solved('pinned','dismantle');r=restore(s);assert(r.cave.completed.includes('mouth-latch'));assert(r.runs['cave:mouth-latch']);
// A current partial/invalid run must not be overwritten by a stale winning nested copy.
s.runs['cave:mouth-latch']={...s.cave.runs['mouth-latch:dismantle'],history:[]};r=restore(s);assert(!r.cave.completed.includes('mouth-latch'));assert.equal(r.runs['cave:mouth-latch'].history.length,0);
s.runs['cave:mouth-latch']=null;r=restore(s);assert(!r.cave.completed.includes('mouth-latch'));
// New images never allow a malformed frame or an old coordinate to bypass the gate.
s=inStore();s.frame='store-sky';r=restore(s);assert.equal(r.frame,'store-door');s.frame='room';r=restore(s);assert.equal(r.frame,'store-door');s.frame='__proto__';r=restore(s);assert.equal(r.frame,'store-door');
s=learned();s.phase='depart';s.frame='store-middle';r=restore(s);assert.equal(r.frame,'trail');
for(const phase of ['arrival','settle','learning','night']){s=phase==='night'?learned():D.fresh();s.phase=phase;s.frame='trail';assert(!D.canEnterFrame(s,'trail'));r=restore(s);assert.notEqual(r.frame,'trail');if(phase==='night')assert.equal(r.frame,'room');}
for(const phase of ['morning','depart','return','bench','farewell','complete']){s=D.fresh();s.phase=phase;assert(D.canEnterFrame(s,'trail'));}
// A winning last move survives immediate refresh and produces only one pending response.
s=learned();s.phase='learning';s.done=s.done.slice(0,3);r=restore(s);assert.equal(r.phase,'night');assert.equal(r.pendingReflection,'learn-straight-back');assert.equal(r.done.length,4);
s=inStore();for(const id of D.requiredCaveIds)add(s,id);s.phase='bench';s.frame='bench-detail';s.runs.bench=solved('rain-shelter-bench','assemble');r=restore(s);assert.equal(r.phase,'farewell');assert.equal(r.frame,'bench-detail');assert.equal(r.benchChecked,false);
// Fully completed legacy journeys stay complete; incomplete optional rehearsals cannot regress them.
s=caveDone();s.version=1;s.storyRevision=2;s.phase='complete';s.finished=true;s.benchChecked=true;s.runs.bench=solved('rain-shelter-bench','assemble');s.replays={'cave:exit-knot:dismantle':{version:1,level:'burr-six',mode:'dismantle',history:[]}};s.talk={id:'farewellChat',line:1};r=restore(s);assert.equal(r.phase,'complete');assert(r.finished);assert.equal(r.frame,'shelter');assert.equal(r.cave.completed.length,8);assert.equal(r.replays['cave:exit-knot:dismantle'].history.length,0);assert.equal(r.talk.line,0);
s=r;s.talk.line=1;s.leavePracticeReminderSeen=true;r=restore(s);assert.equal(r.talk.line,1);assert(r.leavePracticeReminderSeen);
// Save metadata cannot fabricate chapters or solve mechanisms.
s=D.fresh();s.phase='complete';s.finished=true;s.done=D.tasks.map(t=>t.id);s.cave.completed=C.nodes.map(n=>n.id);s.runs={bad:null};s.frame='bench-detail';r=restore(s);assert.equal(r.phase,'learning');assert(!r.finished);assert(!r.suppliesCollected);assert.equal(r.done.length,0);assert.equal(r.cave.completed.length,0);assert.equal(r.frame,'room');
for(const bad of [null,{},'wrong',{version:2,done:4,visited:{},observed:3,runs:{'learn-straight-out':null},replays:{wrong:null},settings:{quality:'bad',volume:Infinity}},{version:2,frame:'bad',phase:'bad'}]){r=D.restore(JSON.stringify(bad),P,E,C);assert.equal(r.version,2);assert(D.frames.includes(r.frame));assert(Array.isArray(r.done));assert(Array.isArray(r.cave.completed));}
console.log('PASS: v2 image-scene migration, 3 independent required mechanisms, 5 optional mechanisms, both material/sketch orders, legal-history recovery, stale-copy isolation, last-move refresh, legacy ending, and gated frames.');
