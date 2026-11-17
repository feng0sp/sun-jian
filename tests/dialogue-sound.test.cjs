const assert=require('node:assert/strict');
const {plan}=require('../dist/dialogue-sound.js');
const {D,P,E,C,learned}=require('./helpers/campaign-fixtures.cjs');
const characters=['周伯','小许','林岚','我'];
assert.equal(new Set(characters.map(name=>plan(name,'看看这儿。').notes.join(','))).size,4);
for(const speaker of [...characters,'老人','屋内','小许（消息）','我（消息）']){
 const p=plan(speaker,'一句短话。');assert(p);assert(p.level<.1);assert((p.notes.length-1)*p.gap+p.length<.25);
}
assert.equal(plan('小许（消息）','找着住处了。').channel,'message');
assert.deepEqual(plan('屋内','进来吧。').notes,plan('周伯','进来吧。').notes);
for(const speaker of ['旁白','折页','手记','装配记录','学习记录'])assert.equal(plan(speaker,'记录文字'),null);
assert.equal(plan('周伯',''),null);assert.equal(plan(null,'一句话'),null);
const old=learned();delete old.settings.dialogueSound;const restored=D.restore(JSON.stringify(old),P,E,C);assert.equal(restored.settings.dialogueSound,true);
old.settings.dialogueSound=false;const muted=D.restore(JSON.stringify(old),P,E,C);assert.equal(muted.settings.dialogueSound,false);assert.deepEqual(muted.done,old.done);
old.settings.sound=true;const audible=D.restore(JSON.stringify(old),P,E,C);assert.equal(audible.settings.sound,true);
console.log('PASS distinct short character cues, remote message cue, quiet narration and old-save sound preference');
