const assert=require('node:assert/strict');
const P=require('../dist/puzzle-core.js'),E=require('../dist/experience.js'),D=require('../dist/drag-controls.js');
assert.deepEqual(P.MAIN_LEVELS.map(l=>l.id),['pinned','dovetail','shoulder-lap','burr-three','double-pin','double-key-frame','wooden-box','burr-six']);
const old=P.LEVELS.slice(0,8).map(l=>l.id),save=E.migrate(JSON.stringify({cleared:[...old,'unknown'],assembled:old,sound:true,experimentCleared:true}),P);
assert.equal(save.cleared.length,6);assert.deepEqual(save.tutorialCleared,['straight','lap']);assert.equal(save.tutorialStatus,'completed');assert(save.experimentCleared&&save.sound);
assert.equal(E.migrate(null,P).tutorialStatus,'new');assert.equal(E.migrate('{',P).tutorialStatus,'new');assert.equal(E.migrate('[]',P).tutorialStatus,'new');assert.equal(E.migrate('{}',P).tutorialStatus,'skipped');
assert.deepEqual(E.migrate(JSON.stringify(save),P),save);
const t=E.trial('burr-six','dismantle');E.advance(t,45000,true);assert(!E.shouldNudge(t));E.action(t,'drag');E.advance(t,60000,false);assert(!E.shouldNudge(t));E.advance(t,44999,true);assert(!E.shouldNudge(t));E.advance(t,1,true);assert(E.shouldNudge(t));t.nudged=true;assert(!E.shouldNudge(t));E.success(t);assert(!E.shouldNudge(t));t.blockedSinceProgress=3;assert(E.shouldNudge(t));t.completedMs=t.visibleMs;E.advance(t,1000,true);assert.equal(t.visibleMs,t.completedMs);
assert.equal(D.chooseAxis([40,0],[[50,0],[0,50],[-35,35]]),0);assert.equal(D.chooseAxis([40,0],[[50,0],[50,1],[0,50]]),null);assert.equal(D.chooseAxis([0,40],[[50,0],[0,5],[-50,0]]),null);
const reverse={xp:'xn',xn:'xp',yp:'yn',yn:'yp',zp:'zn',zn:'zp'};
for(const l of P.LEVELS){const queue=[[]],seen=new Set(['']);while(queue.length){const removed=queue.shift();for(const m of P.availableMoves(l,removed)){
  const next=[...removed,m.piece];assert(P.canInsert(l,next,m.piece,reverse[m.direction]).ok,`${l.id}: every reachable move reversible`);
  const r=P.motionRange(l,removed,m.piece,m.direction);assert(!r.blocker&&r.freeDistance===r.exitDistance&&r.exitDistance>0);
  const key=next.slice().sort().join(',');if(!seen.has(key)){seen.add(key);queue.push(next);}
 }}}
const frame=P.LEVELS.find(l=>l.id==='double-key-frame');
assert.deepEqual(P.availableMoves(frame),[{piece:'key-1',direction:'zp'},{piece:'key-2',direction:'zn'}]);
for(const key of ['key-1','key-2']){assert(!P.canExtract(frame,[key],'upper','yp').ok);assert.equal(P.availableMoves(frame,[key])[0].piece,key==='key-1'?'key-2':'key-1');}
assert(P.canExtract(frame,['key-1','key-2'],'upper','yp').ok);
console.log('PASS: migration, main sequence, gesture-only axis ambiguity, visible-time nudges, independent keys, every reachable move reversible.');
