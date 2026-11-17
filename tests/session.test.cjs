const assert=require('node:assert/strict'),P=require('../dist/puzzle-core.js'),E=require('../dist/experience.js');
const encode=(l,mode,history,extra={})=>JSON.stringify({version:1,level:l.id,mode,history,...extra});
for(const l of P.LEVELS){
 const history=[],removed=[];let s=E.restoreSession(encode(l,'dismantle',history),P);assert(s);assert.deepEqual(s.removed,[]);
 while(removed.length<l.pieces.filter(p=>!p.fixed).length){const m=P.availableMoves(l,removed)[0];history.push({kind:'extract',...m});removed.push(m.piece);s=E.restoreSession(encode(l,'dismantle',history),P);assert(s);assert.deepEqual(s.removed,removed);assert.deepEqual(s.history,history);}
 assert(s.completed);
 const inserted=[],reverse={xp:'xn',xn:'xp',yp:'yn',yn:'yp',zp:'zn',zn:'zp'};
 for(const m of history.slice().reverse()){inserted.push({kind:'insert',piece:m.piece,direction:reverse[m.direction]});s=E.restoreSession(encode(l,'assemble',inserted),P);assert(s);assert.equal(s.history.length,inserted.length);}
 assert(s.completed);assert.deepEqual(s.removed,[]);
}
const pin=P.LEVELS.find(l=>l.id==='pinned');
for(const raw of ['null','{}','{','[]',encode(pin,'dismantle',[{kind:'extract',piece:'tenon',direction:'yp'}]),encode(pin,'dismantle',[{kind:'extract',piece:'pin',direction:'zn'}]),encode(pin,'dismantle',[{kind:'shift',piece:'pin',direction:'zp'}]),encode(pin,'assemble',[{kind:'extract',piece:'pin',direction:'zp'}])])assert.equal(E.restoreSession(raw,P),null);
const moves=[{kind:'shift',piece:'lift-key',direction:'yp',from:[999,0,0],to:[999,1,0]},{kind:'extract',piece:'slider',direction:'xp'}];
const experiment=E.restoreSession(encode(P.EXPERIMENT,'dismantle',moves,{offsets:{'lift-key':[100,100,100]},trial:{id:'restored-run',visibleMs:12345,firstSuccessMs:3000,hintLevel:2,inputs:{drag:2},started:true}}),P);
assert.deepEqual(experiment.offsets,{'lift-key':[0,1,0]});assert.deepEqual(experiment.history[0].from,[0,0,0]);assert.deepEqual(experiment.removed,['slider']);assert.equal(experiment.trial.id,'restored-run');assert.equal(experiment.trial.visibleMs,12345);assert.equal(experiment.trial.hintLevel,2);assert.equal(experiment.trial.inputs.drag,2);
assert.equal(E.restoreSession(encode(P.EXPERIMENT,'assemble',[]),P),null);
console.log('PASS: every level resumes legal dismantling and assembly prefixes; corrupt/blocked sessions rejected; borrow positions rebuilt from rules.');
