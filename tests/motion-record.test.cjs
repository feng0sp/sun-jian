const assert=require('node:assert/strict'),P=require('../dist/puzzle-core'),E=require('../dist/experience'),M=require('../dist/motion-record'),D=require('../dist/story-data');
const opposite=id=>P.DIRECTIONS.find(d=>d.vector.every((v,i)=>v===-P.DIRECTIONS.find(x=>x.id===id).vector[i])).id;
let sweeps=0,records=0;
for(const l of P.LEVELS){
 const movable=l.pieces.filter(p=>!p.fixed).map(p=>p.id),seen=new Set();
 function visit(removed){
  const key=[...removed].sort().join();if(seen.has(key))return;seen.add(key);
  for(const id of removed)for(const d of P.DIRECTIONS){
   const r=P.insertionRange(l,removed,id,d.id),legal=P.canInsert(l,removed,id,d.id),present=removed.filter(x=>x!==id);assert.equal(!r.blocker,legal.ok,l.id+' '+id+' '+d.id);
   assert(P.canTranslate(l,present,id,d.id,r.travel,{[id]:r.start}).ok,'entire fitting preview is collision free');
   if(r.blocker)assert(!P.canTranslate(l,present,id,d.id,Math.min(r.distance,r.travel+.002),{[id]:r.start}).ok,'stop is next to the actual first contact');
   else visit(removed.filter(x=>x!==id));sweeps++;
  }
 }
 visit(movable);
 function check(history,mode){
  const raw={version:1,level:l.id,mode,history},before=JSON.stringify(raw),record=M.build(raw,P,E);assert(record);assert.equal(JSON.stringify(raw),before,'record construction is read only');
  for(let t=0;t<=history.length;t+=.125){const frame=record.frame(t),present=l.pieces.filter(p=>!frame.removed.includes(p.id));for(let i=0;i<present.length;i++)for(let j=i+1;j<present.length;j++)assert(!present[i].shapes.some(a=>present[j].shapes.some(b=>P.overlaps(P.movedShape(a,frame.offsets[present[i].id]),P.movedShape(b,frame.offsets[present[j].id])))),'recorded path never penetrates '+l.id);}
  assert.deepEqual(record.frame(history.length).removed,E.restoreSession(JSON.stringify(raw),P).removed);records++;
 }
 function routes(removed=[],history=[]){if(removed.length===movable.length){check(history,'dismantle');check([...history].reverse().map(s=>({...s,kind:'insert',direction:opposite(s.direction)})),'assemble');return;}for(const m of P.availableMoves(l,removed))routes([...removed,m.piece],[...history,{kind:'extract',...m}]);}
 routes();
}
assert.equal(M.build({version:1,level:'pinned',mode:'dismantle',history:[{kind:'extract',piece:'tenon',direction:'yp'}]},P,E),null,'invalid saved moves cannot become replay');
assert.equal(M.build({version:1,level:'straight',mode:'dismantle',history:[]},P,E),null);
const trial=E.trial('lap','dismantle'),state={runs:{'lap-out':{history:[{piece:'lower'}],trial}}};assert.match(D.talk.linesFor('after-4',state)[0][1],/下面/);state.runs['lap-out'].history[0].piece='upper';assert.match(D.talk.linesFor('after-4',state)[0][1],/上面/);
for(const id of ['after-2','after-4','after-6','after-8'])assert.equal(D.talk.linesFor(id,state).length,D.talk.nodes[id].lines.length,'existing dialogue indices stay valid');
console.log(`PASS: ${sweeps} incoming sweeps across reachable assembly states; ${records} actual dismantle/reverse records, all sampled collision free; invalid history and dialogue continuity.`);
