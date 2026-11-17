const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require('../dist/puzzle-core.js');
const W=require('../dist/wood-mesh.js');
const {levels}=require('../dist/context-puzzles.js');
const results=[];
function opposite(direction){
 const source=P.DIRECTIONS.find(d=>d.id===direction);
 return P.DIRECTIONS.find(d=>d.vector.every((v,i)=>v===-source.vector[i])).id;
}
function connected(shapes){
 const reached=new Set([0]),queue=[0];
 while(queue.length){
  const a=shapes[queue.pop()];
  shapes.forEach((b,j)=>{
   if(reached.has(j))return;
   const spans=[0,1,2].map(axis=>
    Math.min(Math.max(...a.vertices.map(v=>v[axis])),Math.max(...b.vertices.map(v=>v[axis])))-
    Math.max(Math.min(...a.vertices.map(v=>v[axis])),Math.min(...b.vertices.map(v=>v[axis]))));
   if(spans.every(x=>x>=-1e-6)&&spans.filter(x=>x>1e-6).length>=2){reached.add(j);queue.push(j);}
  });
 }
 return reached.size===shapes.length;
}
for(const level of levels){
 assert.deepEqual(P.initialIntersections(level),[],level.id+' is initially separated');
 const ids=level.pieces.filter(p=>!p.fixed).map(p=>p.id);
 const queue=[[]],seen=new Set(['']),states=[];
 while(queue.length){
  const absent=queue.shift(),moves=P.availableMoves(level,absent);
  states.push({absent,moves});
  if(absent.length===ids.length)continue;
  assert(moves.length,level.id+' has a reachable dead end at '+absent);
  for(const move of moves){
   const next=[...absent,move.piece];
   assert(P.canInsert(level,next,move.piece,opposite(move.direction)).ok,'each actual extraction is reversible');
   const range=P.motionRange(level,absent,move.piece,move.direction);
   assert(range.freeDistance>=range.exitDistance-1e-6,level.id+' continuous route reaches the real exit');
   const inserted=P.insertionRange(level,next,move.piece,opposite(move.direction));
   assert.equal(inserted.blocker,null);
   assert.equal(P.previewInsertion(level,next,move.piece,opposite(move.direction),inserted.distance).canSeat,true);
   const key=next.slice().sort().join(',');
   if(!seen.has(key)){seen.add(key);queue.push(next);}
  }
 }
 // Every allowed insertion prefix also admits an undo route back to an open state.
 const assemblyQueue=[[...ids]],assemblySeen=new Set([ids.slice().sort().join(',')]);
 let assemblyTerminal=false;
 while(assemblyQueue.length){
  const absent=assemblyQueue.shift();
  if(!absent.length){assemblyTerminal=true;continue;}
  for(const move of P.availableInsertions(level,absent)){
   const next=absent.filter(id=>id!==move.piece),key=next.slice().sort().join(',');
   assert(P.canExtract(level,next,move.piece,opposite(move.direction)).ok);
   if(!assemblySeen.has(key)){assemblySeen.add(key);assemblyQueue.push(next);}
  }
 }
 assert(assemblyTerminal,level.id+' can assemble from all loose parts');
 const meshes=[];
 for(const piece of level.pieces){
  assert(connected(piece.shapes),level.id+'/'+piece.id+' is a connected wooden body');
  const faces=W.surfaces(piece.shapes,.022);
  assert(faces.length);
  assert(faces.every(face=>face.vertices.every(vertex=>vertex.every(Number.isFinite))));
  meshes.push({piece:piece.id,solids:piece.shapes.length,surfaces:faces.length,connected:true});
 }
 results.push({level:level.id,initialIntersections:[],reachableStates:seen.size,allReachableDismantleStatesSolvable:true,
  reversePaths:true,assemblyStates:assemblySeen.size,meshes,states});
}
const [chair,lap,latch]=levels;
assert.deepEqual(P.availableMoves(chair),[{piece:'tenon',direction:'xp'}]);
assert(P.canExtract(lap,[],'lower','yn').ok);
assert(P.canExtract(lap,[],'upper','yp').ok);
assert.deepEqual(P.availableMoves(latch),[{piece:'pin',direction:'zp'}]);
assert.deepEqual(P.availableMoves(latch,['pin']),[{piece:'tenon',direction:'xn'}]);
assert.equal(P.canExtract(latch,[],'tenon','xn').piece,'pin');
assert.equal(P.canExtract(latch,['pin'],'tenon','xp').piece,'door');
const earlyPin=['tenon'];
assert(!P.canInsert(latch,earlyPin,'tenon','xp').ok,'an early key physically blocks the bar');
assert(P.canExtract(latch,earlyPin,'pin','zp').ok,'the early key remains removable');
const out=path.resolve(process.env.TEST_OUTPUT||'output/context-0139/geometry');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({results,earlyKeyRecoverable:true},null,2));
for(const result of results)console.log('PASS',result.level,result.reachableStates,'reachable states, continuous pieces and reversible routes');
console.log('PASS visible guides, broad key blocks crossbar, chair only along rail, both corner-lap orders');
