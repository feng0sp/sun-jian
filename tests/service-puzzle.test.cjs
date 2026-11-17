const assert=require('node:assert/strict'),P=require('../dist/puzzle-core.js'),W=require('../dist/wood-mesh.js');
const {levels}=require('../dist/service-puzzle.js');
for(const l of levels){
 assert.deepEqual(P.initialIntersections(l),[]);
 const queue=[[]],seen=new Set(['']);let terminals=0;
 while(queue.length){const r=queue.shift(),moves=P.availableMoves(l,r);if(r.length===l.pieces.filter(p=>!p.fixed).length){terminals++;continue;}assert(moves.length,`${l.id}: no dead end ${r}`);for(const m of moves){const n=[...r,m.piece],key=n.slice().sort().join(',');assert(P.canInsert(l,n,m.piece,P.DIRECTIONS.find(d=>d.vector.every((v,i)=>v===-P.DIRECTIONS.find(x=>x.id===m.direction).vector[i])).id).ok,'reverse each actual extraction');if(!seen.has(key)){seen.add(key);queue.push(n);}}}
 assert(terminals);for(const p of l.pieces){const faces=W.surfaces(p.shapes);assert(faces.length);assert(faces.every(f=>f.vertices.every(v=>v.every(Number.isFinite))));
  const reached=new Set([0]),q=[0];while(q.length){const a=p.shapes[q.pop()];p.shapes.forEach((b,j)=>{if(reached.has(j))return;const d=[0,1,2].map(i=>Math.min(Math.max(...a.vertices.map(v=>v[i])),Math.max(...b.vertices.map(v=>v[i])))-Math.max(Math.min(...a.vertices.map(v=>v[i])),Math.min(...b.vertices.map(v=>v[i]))));if(d.every(x=>x>=-1e-6)&&d.filter(x=>x>1e-6).length>=2){reached.add(j);q.push(j);}});}assert.equal(reached.size,p.shapes.length,`${l.id}/${p.id} must be a connected body`);
 }
 console.log('PASS',l.id,seen.size,'reachable states, reversible, continuous model');
}
const [closed,open]=levels;
assert.deepEqual(P.availableMoves(closed),[{piece:'guard',direction:'yp'}]);
const blocked=P.canExtract(closed,[],'pin','zp');assert(!blocked.ok);assert.equal(blocked.piece,'guard');
assert(P.canExtract(closed,['guard'],'pin','zp').ok);
assert.deepEqual(P.availableMoves(open),[{piece:'pin',direction:'zp'}]);
assert(P.canExtract(open,['pin'],'tenon','yp').ok);
console.log('PASS physical guard blockage, side-position exit, no invisible gating');
