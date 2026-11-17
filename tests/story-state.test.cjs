const assert=require('node:assert/strict'),D=require('../dist/story-data.js'),P=require('../dist/puzzle-core.js'),E=require('../dist/experience.js');
const state=D.fresh();assert.deepEqual(D.restore(null,P,E),state);assert.deepEqual(D.restore('{',P,E),state);
for(const [index,t]of D.tasks.entries()){
 const l=P.LEVELS.find(l=>l.id===t.levelId),history=[],trial=E.trial(t.levelId,t.mode);let removed=t.mode==='assemble'?l.pieces.filter(p=>!p.fixed).map(p=>p.id):[];
 while(t.mode==='assemble'?removed.length:removed.length<l.pieces.filter(p=>!p.fixed).length){const move=(t.mode==='assemble'?P.availableInsertions:P.availableMoves)(l,removed)[0];history.push({kind:t.mode==='assemble'?'insert':'extract',...move});removed=t.mode==='assemble'?removed.filter(id=>id!==move.piece):[...removed,move.piece];}
 state.runs[t.id]={version:1,level:t.levelId,mode:t.mode,history,action:'extract',trial};state.completed.push(t.id);state.beat=(index+1)*2;state.active=true;
 assert.deepEqual(D.restore(JSON.stringify(state),P,E).completed,state.completed);assert.equal(D.restore(JSON.stringify(state),P,E).beat,state.beat);
}
state.beat=9;assert.equal(D.restore(JSON.stringify(state),P,E).beat,9);
const old=JSON.parse(JSON.stringify(state));delete old.revision;delete old.openingSeen;delete old.openingLine;old.beat=8;old.line=4;old.observed=['lamp','tea'];
const migrated=D.restore(JSON.stringify(old),P,E);assert.equal(migrated.line,0);assert.equal(migrated.openingSeen,true);assert.deepEqual(migrated.observed,['tea','chair']);assert.deepEqual(migrated.completed,state.completed);for(const id of state.completed){assert.deepEqual(migrated.runs[id].history,state.runs[id].history);assert.equal(migrated.runs[id].trial.id,state.runs[id].trial.id);}
const modern=JSON.parse(JSON.stringify(migrated));modern.talk={node:'after-8',line:2,returnTo:'zhou'};assert.equal(D.restore(JSON.stringify(modern),P,E).talk.line,D.talk.nodes['after-8'].lines.length-1);
const intro=D.fresh();intro.openingLine=2;assert.equal(D.restore(JSON.stringify(intro),P,E).openingLine,2);assert.equal(D.restore(JSON.stringify(intro),P,E).openingSeen,false);
const bad=JSON.parse(JSON.stringify(state));bad.runs['pinned-out'].history=[{kind:'extract',piece:'tenon',direction:'yp'}];assert.deepEqual(D.restore(JSON.stringify(bad),P,E),D.fresh());
assert.deepEqual(D.restore(JSON.stringify({version:1,chapter:'workshop-first',completed:['lap-out'],beat:4}),P,E),D.fresh());
assert.deepEqual(D.restore(JSON.stringify({version:1,chapter:'workshop-first',completed:D.tasks.map(t=>t.id),beat:9}),P,E),D.fresh());
console.log('PASS: story checkpoints require legal completed tasks; damaged or out-of-order progress cannot skip the story.');

const nodes=D.talk.nodes;
for(const [id,n] of Object.entries(nodes)){assert(n.lines.length,id);for(const to of [n.next,...(n.choices||[]).map(c=>c.to)].filter(Boolean))assert(to.startsWith('$')||nodes[to],id+' -> '+to);}
const interrupted=D.fresh();Object.assign(interrupted,{openingSeen:true,arrivalDone:true,talk:{node:'sit',line:2,returnTo:'chair'}});const safe=D.restore(JSON.stringify(interrupted),P,E);assert.equal(safe.talk.node,'chair');assert.deepEqual(safe.experienced,[]);
const legacyDone={...state,revision:2,beat:9};const dinner=D.restore(JSON.stringify(legacyDone),P,E);assert.equal(dinner.beat,8);assert.equal(dinner.talk.node,'after-8');assert.equal(dinner.completed.length,4);assert(dinner.learningAccepted);assert.deepEqual(dinner.experienced,[]);
const legacyPlaying={...state,revision:2,beat:8,line:3};assert.equal(D.restore(JSON.stringify(legacyPlaying),P,E).talk.line,0);
console.log('PASS: branch targets, interrupted action rollback, revision 2 migration and fresh dinner ending.');

const studying={...state,study:'pinned:dismantle',view:'puzzle',studyRuns:{'pinned:dismantle':{version:1,level:'pinned',mode:'dismantle',history:[{kind:'extract',piece:'pin',direction:'zp'}],action:'extract',trial:E.trial('pinned','dismantle')}}};
const resumedStudy=D.restore(JSON.stringify(studying),P,E);assert.equal(resumedStudy.study,'pinned:dismantle');assert.equal(resumedStudy.view,'puzzle');assert.deepEqual(resumedStudy.runs,D.restore(JSON.stringify(state),P,E).runs);assert.equal(resumedStudy.studyRuns['pinned:dismantle'].history.length,1);
const corruptStudy=JSON.parse(JSON.stringify(studying));corruptStudy.studyRuns['pinned:dismantle'].history=[{kind:'extract',piece:'tenon',direction:'yp'}];const safeStudy=D.restore(JSON.stringify(corruptStudy),P,E);assert.equal(safeStudy.study,null);assert.equal(safeStudy.view,'world');assert.deepEqual(safeStudy.completed,state.completed);
assert.equal(D.restore(JSON.stringify({...studying,study:'constructor'}),P,E).study,null);
const notLearned={...D.fresh(),view:'puzzle',study:studying.study,studyRuns:studying.studyRuns};assert.deepEqual(D.restore(JSON.stringify(notLearned),P,E).studyRuns,{});
console.log('PASS: optional practice restores only learned, geometrically legal histories; damaged practice cannot erase story progress.');

const extraRun={version:1,level:'dovetail',mode:'dismantle',history:[{kind:'extract',piece:'key',direction:'yp'}],action:'extract',trial:E.trial('dovetail','dismantle')};
const extraState={...state,view:'puzzle',study:'dovetail:dismantle',studyRuns:{'dovetail:dismantle':extraRun}};
assert.equal(D.restore(JSON.stringify(extraState),P,E).study,'dovetail:dismantle');
assert(D.canStudy(state,'burr-three'));assert(!D.canStudy({...state,beat:8},'burr-three'));assert(!D.canStudy(state,'unknown'));
assert.equal(D.restore(JSON.stringify({...extraState,beat:8}),P,E).study,null);
assert.equal(D.notes.length,3);assert.equal(D.samples.length,6);
console.log('PASS: extended sample checkpoints stay separate from the three story notes and unlock after the original epilogue.');

const arranged={...state,placements:{lap:'assemble',straight:'dismantle','burr-three':'dismantle',unknown:'assemble',pinned:'bad'}};
const placed=D.restore(JSON.stringify(arranged),P,E);assert.deepEqual(placed.placements,{straight:'dismantle',lap:'assemble','burr-three':'dismantle'});assert.equal(D.displayMode(placed,'straight'),'dismantle');assert.equal(D.displayMode(placed,'lap'),'assemble');assert.equal(D.displayMode(placed,'pinned'),'dismantle');
assert.deepEqual(D.restore(JSON.stringify({...arranged,beat:8}),P,E).placements,{});
console.log('PASS: optional room placement is bounded to known samples and cannot change the original lesson presentation.');
