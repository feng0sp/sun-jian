const assert=require('node:assert/strict'),P=require('../dist/puzzle-core.js'),l=require('../dist/bench-puzzle.js');
assert.deepEqual(P.initialIntersections(l),[]);
const visited=new Set();function explore(r){const k=[...r].sort().join('|');if(visited.has(k))return;visited.add(k);if(r.length===5)return;const moves=P.availableMoves(l,r);assert(moves.length,'no dismantle dead end: '+k);for(const m of moves)explore([...r,m.piece]);}explore([]);
assert(P.availableMoves(l,[]).every(m=>m.piece.endsWith('pin')));
assert.deepEqual(P.availableMoves(l,['left-pin','right-pin']).map(m=>m.piece),['seat']);
for(const beams of [['front-beam','rear-beam'],['rear-beam','front-beam']])for(const pins of [['left-pin','right-pin'],['right-pin','left-pin']]){
 let r=l.pieces.filter(p=>!p.fixed).map(p=>p.id);for(const [piece,direction]of [[beams[0],'yn'],[beams[1],'yn'],['seat','xn'],[pins[0],'zn'],[pins[1],'zn']]){assert(P.canInsert(l,r,piece,direction).ok,piece);const pre=P.previewInsertion(l,r,piece,direction,100);assert(pre.canSeat&&!pre.blocker);r=r.filter(id=>id!==piece);}assert.equal(r.length,0);
}
const wrong=P.previewInsertion(l,['seat','left-pin','right-pin'],'seat','yn',100);assert(wrong.blocker&&!wrong.canSeat);assert(wrong.distance<=wrong.travel);
console.log('PASS: bench exact geometry, '+visited.size+' reachable dismantle states, both beam/pin orders, continuous insertion and blocked snap.');
