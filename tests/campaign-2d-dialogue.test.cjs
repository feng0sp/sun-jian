const assert=require('node:assert/strict');
const S=require('../dist/campaign-story.js');
const terminals=new Set(['close','accept','depart','return','bench','findZhou','toolCorner']);
const state=(phase='settle',extra={})=>({phase,scene:phase==='cave'?'cave':'village',done:[],spoken:[],cave:{completed:[]},...extra});
assert.equal(S.revision,12);
for(const [id,n]of Object.entries(S.nodes)){
 assert(n.lines.length>0,id+' has lines');
 for(const [speaker,text]of [...n.lines,...n.repeat||[]])assert(typeof speaker==='string'&&typeof text==='string'&&text.length,id+' valid dialogue');
 for(const [,next]of n.choices||[])assert(S.nodes[next]||terminals.has(next),id+' links to '+next);
}
for(const [phase,topic]of [['arrival','arrival'],['settle','zhou'],['learning','zhou'],['night','night'],['morning','morning'],['depart','departing'],['return','returned'],['bench','benchHelp'],['farewell','checked'],['complete','farewellChat']]){
 const s=state(phase);assert.equal(S.hostTopic(s),topic);assert(S.resolve(topic,s),phase+' host topic is available');
}
assert.equal(S.resolve('arrival',state('learning')),null);
assert.equal(S.resolve('morning',state('bench')),null);
assert.equal(S.resolve('returned',state('complete')),null);
assert.equal(S.resolve('checked',state('farewell',{benchChecked:true})),null);
assert.equal(S.resolve('after:learn-straight-out',state('complete',{done:['learn-straight-out']})),null);
assert.equal(S.resolve('invite',state('learning')),null);
const required=['mouth-latch','rack-frame','stone-box'];
for(const completed of [[],required.slice(0,1),required.slice(0,2),['route-case','folding-screen','cabinet-knot','narrow-latch','exit-knot']])assert.equal(S.resolve('supplies',state('cave',{cave:{completed}})),null);
for(const completed of [required,[...required].reverse(),[...required,'exit-knot']]){
 const s=state('cave',{cave:{completed}});assert(S.resolve('supplies',s));assert(S.resolve('supplySketch',s));
}
for(const id of ['zhou','heritage','teacherMemory','dailyLife','toolsUse','invite','chair','chairSit','teaPour'])assert.equal(S.resolve(id,state('cave')),null,id+' cannot summon Zhou in the store');
for(const phase of ['bench','farewell','complete'])for(const id of ['chair','chairJoint','chairSit','cup','teaPour','tools']){
 const n=S.resolve(id,state(phase));assert(n);assert(n.lines.every(([speaker])=>speaker!=='周伯'),phase+' '+id+' does not speak remotely');
}
const raw=JSON.stringify(S.nodes.heritage),repeat=S.resolve('heritage',state('settle',{spoken:['heritage']}));assert(repeat.lines.length<S.nodes.heritage.lines.length);repeat.lines[0][1]='changed';assert.equal(JSON.stringify(S.nodes.heritage),raw);
for(const entry of ['zhou','chair','tools','earlySample']){
 const seen=new Set(),queue=[entry];let accepted=false;
 while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);const n=S.resolve(id,state());if(!n)continue;for(const [,next]of n.choices||[]){if(next==='accept')accepted=true;else if(!terminals.has(next))queue.push(next);}}
 assert(accepted,entry+' can lead to voluntarily accepting learning');
 assert(S.resolve(entry,state()).choices.some(([,next])=>next==='close'),entry+' can be left without accepting');
}
for(const [id,action]of [['opening','openingDone'],['stay','settle'],['travelMessage','departRoute'],['caveEnter','enterCave'],['checked','sitReady']])assert.equal(S.nodes[id].action,action);
console.log('PASS: revision 8 dialogue links, voluntary learning, three required structures, stage guards, local speakers, repeats and stable actions.');
