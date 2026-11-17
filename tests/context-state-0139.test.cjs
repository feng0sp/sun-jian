const assert=require('node:assert/strict');
const {P,E,C,D,solved,caveDone,learned}=require('./helpers/campaign-fixtures.cjs');
const O=require('../dist/campaign-objects.js');
const restore=s=>D.restore(JSON.stringify(s),P,E,C);
for(const id of ['straight','lap','pinned']){
 const s=restore(learned()),formal=JSON.stringify(s.runs);
 for(let cycle=0;cycle<2;cycle++)for(const mode of (id==='straight'?['dismantle','assemble']:['assemble','dismantle'])){
  const task=O.next(s,id);assert.equal(task.mode,mode);
  const start=O.begin(s,task);assert.equal(start.mode,mode);assert.deepEqual(start.history,[]);
  const run=solved(id,mode);assert(O.capture(s,id,run));
  assert.equal(O.position(s,id).removed.length,mode==='assemble'?0:P.LEVELS.find(l=>l.id===id).pieces.filter(p=>!p.fixed).length);
  Object.assign(s,restore(s));assert.equal(JSON.stringify(s.runs),formal,'Physical pieces never replace the original lesson proof.');
 }
}
for(const [piece,dir]of [['lower','yn'],['upper','yp']]){
 const s=restore(learned()),run={version:1,level:'lap',mode:'dismantle',history:[{kind:'extract',piece,direction:dir}]};
 assert(O.capture(s,'lap',run));const r=restore(s);assert.deepEqual(O.position(r,'lap').removed,[piece]);assert.equal(O.next(r,'lap').mode,'dismantle');
}
const old=caveDone(1);old.storyRevision=7;const r=restore(old);
assert(r.cave.completed.includes('mouth-latch'));assert.deepEqual(r.runs['cave:mouth-latch'],old.runs['cave:mouth-latch']);
const half=learned();half.phase='cave';half.scene='cave';half.frame='store-door';half.runs['cave:mouth-latch']={version:1,level:'pinned',mode:'dismantle',history:[{kind:'extract',piece:'pin',direction:'zp'}]};
const resumed=restore(half);assert.equal(resumed.runs['cave:mouth-latch'].level,'store-door-latch');assert.equal(resumed.runs['cave:mouth-latch'].history.length,1);assert(!resumed.cave.completed.includes('mouth-latch'));
resumed.runs['cave:mouth-latch'].history.push({kind:'extract',piece:'tenon',direction:'xn'});assert(restore(resumed).cave.completed.includes('mouth-latch'));
const broken=structuredClone(half);broken.runs['cave:mouth-latch'].history[0].direction='yn';const fixed=restore(broken);assert(fixed.doorRecoveryPending);assert(!fixed.cave.completed.includes('mouth-latch'));assert.equal(fixed.done.length,4);
for(const phase of ['settle','learning','morning','return','complete']){
 const s=phase==='settle'?D.fresh():caveDone();s.phase=phase;const v=restore(s);
 assert(v.roomObjects.straight);assert.equal(v.storyRevision,11);
}
console.log('PASS physical sample cycles, partial lap state, immutable lesson proof, legacy door completion and pin-only migration/recovery');
