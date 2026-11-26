const assert=require('node:assert/strict');
const {P,E,D,C,caveDone,solved}=require('./helpers/campaign-fixtures.cjs');
const Next=require('../dist/campaign-continuation.js');
const Museum=require('../dist/campaign-museum.js');
const Guide=require('../dist/assembly-guide.js');

function readyForMuseum(){
 const s={...caveDone(),phase:'complete',finished:true,benchChecked:true,frame:'bench-seat'};
 s.runs.bench=solved('rain-shelter-bench','assemble');
 s.continuation={...Next.fresh(),started:true,active:true,noticeSeen:true,departed:true,workshopSeen:true,
  run:solved('pinned','assemble'),reviewed:true,entryAccepted:true,designStarted:true,purpose:'comfort',
  peerMet:true,serviceRun:solved('service-access-closed','dismantle'),variant:'side',
  serviceBackRun:solved('service-access-open','assemble'),serviceOutRun:solved('service-access-open','dismantle'),
  designReviewed:true,dovetailOutRun:solved('dovetail','dismantle'),dovetailBackRun:solved('dovetail','assemble'),
  burrBackRun:solved('burr-six','assemble'),workshopReflected:true};
 return s;
}
if(require.main===module){
 const level=P.LEVELS.find(item=>item.id==='museum-clamp-apron');
 assert.deepEqual(P.initialIntersections(level),[]);
 assert.deepEqual(P.availableMoves(level),[{piece:'top',direction:'yp'}]);
 assert.deepEqual(P.availableMoves(level,['top']),[{piece:'apron',direction:'yp'}]);
 assert.deepEqual(P.assemblyRoute(level,['top','apron']),[{piece:'apron',direction:'yn'},{piece:'top',direction:'yn'}]);
 const guide=Guide.forLevel(level.id,'assemble');
 assert(!Guide.allowed(guide,['top','apron'],'top','assemble'));
 assert(Guide.allowed(guide,['top'],'top','assemble'));
 assert.equal(Museum.landmarks.length,8);
 for(const exhibit of Museum.landmarks){
  const model=P.LEVELS.find(item=>item.id===exhibit.level);
  assert(model,exhibit.id);
  assert.deepEqual(P.initialIntersections(model),[],model.id);
  const out=solved(model.id,'dismantle').history;
  assert.equal(out.length,model.pieces.filter(part=>!part.fixed).length,model.id);
  let absent=out.map(move=>move.piece);
  const guide=Guide.forLevel(model.id,'assemble',true);
  assert(guide,model.id);
  while(absent.length){
   const step=Guide.step(guide,absent,'assemble',model);
   assert(step,model.id);
   const piece=step.pieces.find(id=>absent.includes(id));
   const direction=Guide.direction(guide,piece,absent);
   assert(P.availableInsertions(model,absent).some(move=>move.piece===piece&&move.direction===direction),model.id+': '+piece);
   absent=absent.filter(id=>id!==piece);
  }
 }
 const model=id=>P.LEVELS.find(l=>l.id===id);
 const track=model('museum-sliding-pin');
 assert(P.availableMoves(track).every(move=>move.piece==='stop'));
 assert(P.availableMoves(track,['stop']).some(move=>move.piece==='slide'&&move.direction==='xn'));
 assert(P.availableMoves(track,['stop']).every(move=>move.direction!=='yp'));
 assert.deepEqual(P.availableMoves(model('museum-dougong')),[{piece:'beam',direction:'yp'}]);
 const corner=model('museum-miter-corner');
 for(const first of ['front','side'])assert(P.availableMoves(corner,[first]).some(move=>move.piece!==first));
 const original=readyForMuseum(),restore=s=>D.restore(JSON.stringify(s),P,E,C);
 let restored=restore(original);
 assert.equal(restored.continuation.stage,'museum');
 const museum=restored.continuation.museum;
 museum.visit={from:'story',exhibit:'clamp',diagram:'joint'};
 museum.introduced=true;museum.last='clamp';museum.viewed=['clamp','clamp','unknown'];
 museum.runs.clamp=solved(level.id,'dismantle');
 museum.runs.dovetail=solved(level.id,'dismantle'); // Models cannot borrow each other's proof.
 restored=restore(restored);
 assert.deepEqual(restored.continuation.museum.visit,museum.visit);
 assert.deepEqual(restored.continuation.museum.viewed,['clamp']);
 assert.equal(restored.continuation.museum.runs.dovetail,undefined);
 assert.equal(Museum.task(restored.continuation.museum,'clamp',P,E).mode,'assemble');
 assert.deepEqual(restored.continuation.dovetailBackRun.history,original.continuation.dovetailBackRun.history);
 assert.deepEqual(restored.runs.bench.history,original.runs.bench.history);
 assert(!restored.continuation.productionStarted);
 restored.continuation.museum.passed=true;
 assert.equal(restore(restored).continuation.stage,'design-ready');
 original.continuation.revision=6;
 assert.equal(restore(original).continuation.stage,'design-ready');
 assert(!restore(original).continuation.museum.introduced);
 console.log('PASS museum stages, legacy route, replica isolation and reversible geometry for eight exhibit models');
}
module.exports={readyForMuseum};
