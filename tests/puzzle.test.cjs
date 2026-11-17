const assert = require('node:assert/strict');
const P = require('../dist/puzzle-core.js');
for (const level of P.LEVELS) {
  assert.deepEqual(P.initialIntersections(level), [], `${level.id}: initially intersecting parts`);
  const queue=[[]],seen=new Set(['']),terminal=[];
  while(queue.length){
    const removed=queue.shift(),moves=P.availableMoves(level,removed);
    const count=level.pieces.filter(p=>!p.fixed).length;
    if(removed.length===count){terminal.push(removed);continue;}
    assert(moves.length>0,`${level.id}: dead end after ${removed}`);
    for(const move of moves){const next=[...removed,move.piece],key=next.slice().sort().join(',');if(!seen.has(key)){seen.add(key);queue.push(next);}}
  }
  assert(terminal.length>0,`${level.id}: unsolvable`);
  console.log(`${level.id}: geometry valid, ${seen.size} reachable states, all states solvable`);
}
const L=id=>P.LEVELS.find(l=>l.id===id);
assert.deepEqual(P.availableMoves(L('straight')),[{piece:'tenon',direction:'yp'}]);
assert.deepEqual(P.availableMoves(L('pinned')),[{piece:'pin',direction:'zp'}]);
assert.deepEqual(P.availableMoves(L('pinned'),['pin']),[{piece:'tenon',direction:'yp'}]);
assert.deepEqual(P.availableMoves(L('dovetail')),[{piece:'key',direction:'yp'}]);
assert.deepEqual(P.availableMoves(L('dovetail'),['key']),[{piece:'slide',direction:'xp'}]);
assert.deepEqual(P.availableMoves(L('double-pin')),[{piece:'crosspin',direction:'xp'}]);
assert.deepEqual(P.availableMoves(L('double-pin'),['crosspin']),[{piece:'pin',direction:'zp'}]);
assert.deepEqual(P.availableMoves(L('wooden-box')),[{piece:'lid',direction:'xp'}]);
assert.deepEqual(P.availableMoves(L('burr-three')),[{piece:'bar-2',direction:'xp'}]);
assert.deepEqual(P.availableMoves(L('burr-six')),[{piece:'bar-6',direction:'zp'},{piece:'bar-6',direction:'zn'}]);
for(const id of ['burr-three','burr-six','shoulder-lap','double-key-frame']){
  const l=L(id);
  for(const piece of l.pieces){
    // Every wooden bar is one solid connected body, not floating fragments.
    const seen=new Set([0]),queue=[0];
    while(queue.length){const a=piece.shapes[queue.pop()];piece.shapes.forEach((b,j)=>{
      if(seen.has(j))return;
      const lengths=[0,1,2].map(axis=>Math.min(Math.max(...a.vertices.map(v=>v[axis])),Math.max(...b.vertices.map(v=>v[axis])))-Math.max(Math.min(...a.vertices.map(v=>v[axis])),Math.min(...b.vertices.map(v=>v[axis]))));
      if(lengths.every(n=>n>=-1e-6)&&lengths.filter(n=>n>1e-6).length>=2){seen.add(j);queue.push(j);}
    });}
    assert.equal(seen.size,piece.shapes.length,`${id}/${piece.id}: disconnected wood`);
  }
}
// Swept collision must detect a thin obstacle far beyond the first increment.
assert(P.sweep(P.box(0,1,0,1,0,1),P.box(4,4.01,0,1,0,1),[1,0,0])!==null);
assert.equal(P.sweep(P.box(0,1,0,1,0,1),P.box(1,2,0,1,0,1),[-1,0,0]),null);
assert(P.sweep(P.box(0,1,0,1,0,1),P.box(1,2,0,1,0,1),[1,0,0])!==null);
console.log('PASS: expected extraction directions, lock order, no tunneling, separating contact.');
const assemblyRoutes={
  'shoulder-lap':[['lower','xn'],['upper','yn'],['pin','zn']],
  'double-key-frame':[['lower','xn'],['upper','yn'],['key-2','zp'],['key-1','zn']],
  'burr-three':[['bar-3','xn'],['bar-1','yp'],['bar-2','xn']],
  'burr-six':[['bar-5','xn'],['bar-1','yp'],['bar-3','xn'],['bar-2','yn'],['bar-4','xn'],['bar-6','zn']],
  straight:[['tenon','yn']],
  lap:[['lower','xn'],['upper','yn']],
  pinned:[['tenon','yn'],['pin','zn']],
  dovetail:[['slide','xn'],['key','yn']],
  'double-pin':[['tenon','yn'],['pin','zn'],['crosspin','xn']],
  'wooden-box':[['left','yn'],['right','yn'],['front','yn'],['back','yn'],['lid','xn']]
};
for(const level of P.LEVELS){
  let absent=level.pieces.filter(p=>!p.fixed).map(p=>p.id);
  for(const [piece,direction]of assemblyRoutes[level.id]){
    assert(P.canInsert(level,absent,piece,direction).ok,`${level.id}: cannot insert ${piece}/${direction}`);
    absent=absent.filter(p=>p!==piece);
  }
  assert.equal(absent.length,0,`${level.id}: incomplete assembly route`);
}
// A physically possible premature locking action must be reversible by undo.
let pending=['tenon','pin'];assert(P.canInsert(L('pinned'),pending,'pin','zn').ok);
assert.equal(P.availableInsertions(L('pinned'),['tenon']).length,0);
assert(P.availableInsertions(L('pinned'),pending).length>0);
console.log('PASS: every reverse assembly route, and recoverable premature-lock dead end.');
for(const level of P.LEVELS){
  let absent=level.pieces.filter(p=>!p.fixed).map(p=>p.id);
  while(absent.length){const hint=P.hintContext(level,absent,'assemble');assert(hint.move,level.id+': hint must preserve a complete assembly path');assert(P.canInsert(level,absent,hint.move.piece,hint.move.direction).ok);absent=absent.filter(id=>id!==hint.move.piece);}
}
assert.equal(P.hintContext(L('pinned'),['tenon'],'assemble').move,null);
assert.match(P.hintContext(L('pinned'),['tenon'],'assemble').text,/撤销/);
console.log('PASS: assembly hints reach completion for every structure and explain recovery from a premature lock.');
const EX=P.EXPERIMENT;
assert.deepEqual(P.initialIntersections(EX),[]);
assert.deepEqual(P.availableMoves(EX),[],'experiment initially requires partial movement');
const partial=EX.pieces.filter(p=>!p.fixed).flatMap(p=>P.DIRECTIONS.filter(d=>P.canTranslate(EX,[],p.id,d.id,1).ok).map(d=>({piece:p.id,direction:d.id})));
assert.deepEqual(partial,[{piece:'lift-key',direction:'yp'}]);
const shifted={'lift-key':[0,1,0]};
assert.deepEqual(P.availableMoves(EX,[],shifted),[{piece:'slider',direction:'xp'}]);
assert.deepEqual(P.initialIntersections({...EX,pieces:EX.pieces.map(p=>({...p,shapes:p.shapes.map(s=>P.movedShape(s,shifted[p.id]))}))}),[]);
assert(P.canTranslate(EX,[],'lift-key','yn',1,shifted).ok,'partial shift can be reversed');
assert(!P.canTranslate(EX,[],'lift-key','yp',1,shifted).ok,'second upward step hits the cap');
assert.deepEqual(P.availableMoves(EX,['slider'],shifted),[{piece:'lift-key',direction:'yp'}]);
console.log('PASS: partial-motion experiment, unique initial borrow, cap collision, reversibility and complete extraction.');
