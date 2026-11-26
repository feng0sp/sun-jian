'use strict';
const assert=require('node:assert/strict');
const {D,P,E,C}=require('./helpers/campaign-fixtures.cjs');
const Developer=require('../dist/campaign-developer.js');
const Story=require('../dist/campaign-story.js');
const Chapters=require('../dist/campaign-chapters.js');

const preferences=D.fresh();
const ids=Developer.checkpoints.map(node=>node.id);
assert.equal(new Set(ids).size,ids.length);
assert.deepEqual([...new Set(Developer.checkpoints.map(node=>node.chapter))],Chapters.chapters.map(chapter=>chapter.id));
assert.equal(Developer.start('unknown',D,P,E,C,preferences),null);
for(const node of Developer.checkpoints){
 const save=Developer.start(node.id,D,P,E,C,preferences);
 if(node.stage)assert.equal(save.continuation.stage,node.stage,node.id);
 if(save.talk)assert(Story.resolve(save.talk.id,save),node.id);
 if(save.interlude)assert(save.benchChecked,node.id);
 if(save.continuation.workChoice)assert.equal(save.continuation.workChoice,'stool',node.id);
 assert.equal(Chapters.cleared(save,P,E),node.id==='dev-ending',node.id);
 const roundTrip=D.restore(JSON.stringify(save),P,E,C);
 assert.equal(roundTrip.phase,save.phase,node.id);
 assert.equal(roundTrip.continuation.stage,save.continuation.stage,node.id);
}
assert.deepEqual(preferences,D.fresh());
console.log('PASS all '+ids.length+' developer checkpoints and legal prerequisite proofs');
