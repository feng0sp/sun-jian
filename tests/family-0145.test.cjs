const assert=require('node:assert/strict');
const S=require('../dist/campaign-story.js'),N=require('../dist/campaign-continuation.js'),F=require('../dist/campaign-finale.js'),A=require('../dist/companion-dialogue.js'),Sound=require('../dist/dialogue-sound.js');
const {D,P,E,C,learned}=require('./helpers/campaign-fixtures.cjs');
assert(S.nodes.opening.lines[0][1].includes('妹妹陈晴'));
assert(S.nodes.opening.lines.some(([who,text])=>who==='陈晴'&&text.includes('哥')));
assert(S.nodes.stay.lines.some(([,text])=>text.includes('店主家正好有张空床')));
assert(S.nodes.stay.lines.some(([,text])=>text.includes('把地址发我')));
for(const [id,node] of Object.entries({...S.nodes,...N.nodes,...F.nodes}))assert(!JSON.stringify(node).includes('小许'),id+' old visible name');
for(const speaker of ['陈晴','陈晴（消息）']){assert.equal(A.presentation('x',speaker,0).actor,'xiaoxu');assert.equal(Sound.plan(speaker,'哥，到家了吗？').actor,'xiaoxu');}
const source=learned();source.storyRevision=12;source.talk={id:'stay',line:2};source.settings.sound=true;source.roomObjects={};
const restored=D.restore(JSON.stringify(source),P,E,C);
assert.equal(restored.storyRevision,13);assert.deepEqual(restored.done,source.done);for(const key of source.done)assert.deepEqual(restored.runs[key].history,source.runs[key].history);assert.equal(restored.talk.line,0);assert.equal(restored.settings.sound,true);
console.log('PASS family identity, natural addresses, travel lodging and legal old-save preservation');
