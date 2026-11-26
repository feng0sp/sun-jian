'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {D,P,E,C}=require('./helpers/campaign-fixtures.cjs');
const {start,completedJourney}=require('./chapter-replay.test.cjs');
const Intro=require('../dist/campaign-story.js');
const Workshop=require('../dist/campaign-continuation.js');
const Finale=require('../dist/campaign-finale.js');
const Interludes=require('../dist/campaign-interludes.js');
const Furniture=require('../dist/entry-furniture.js');

const old=D.fresh();
old.storyRevision=13;
old.openingSeen=true;
old.frame='room';
old.prologue={stage:'unpacked',invited:true,bagPlaced:true,legacy:false};
old.talk={id:'stay',line:2};
const resumed=D.restore(JSON.stringify(old),P,E,C);
assert.equal(resumed.storyRevision,16);
assert.deepEqual(resumed.talk,{id:'stay',line:0});
assert.equal(resumed.frame,'room');
assert(Intro.resolve('stay',resumed).lines.some(([,line])=>line.includes('空床')));
old.talk={id:'road',line:1};
assert.deepEqual(D.restore(JSON.stringify(old),P,E,C).talk,old.talk);

old.storyRevision=15;
old.talk={id:'welcomeInside',line:2};
assert.deepEqual(D.restore(JSON.stringify(old),P,E,C).talk,{id:'welcomeInside',line:0});
old.talk={id:'road',line:1};
assert.deepEqual(D.restore(JSON.stringify(old),P,E,C).talk,old.talk);
const roomNodes=['welcomeInside','unpack','stay','travelMessage','morning','returned'];
const lineCount=roomNodes.reduce((count,id)=>count+Intro.nodes[id].lines.length,0);
assert.equal(lineCount,15);
const finished=completedJourney();
finished.storyRevision=13;
const winningRun=D.restore(JSON.stringify(finished),P,E,C);
assert.equal(winningRun.continuation.stage,'ending');
assert(winningRun.continuation.rewardRecorded);
assert.deepEqual(winningRun.continuation.contestRun.history,finished.continuation.contestRun.history);

assert.match(Intro.nodes.opening.lines[0][1],/一个人/);
assert.match(Intro.nodes.opening.lines[0][1],/大学生/);
assert.match(Workshop.nodes.continuationMeetup.lines[0][1],/柱上的一张海报/);
assert.match(Interludes.beats.farewell[0].text,/村民.*布鞋/);
for(const file of [Interludes.beats.farewell[0].image,'goodbye-village-solo.webp']){
 assert(fs.existsSync(path.join(__dirname,'../dist/assets/campaign-2d',file)));
}
for(const spec of Furniture.choices){
 const s=start('results');
 s.continuation.workChoice=spec.key;
 s.continuation.stage='contest-service-out';
 const judge=Finale.resolve('continuationFinalJudge',s);
 assert(judge.lines.some(([,line])=>line.includes(spec.key==='stool'?'溪桥':spec.key==='table'?'水杯':'找的书')));
 s.continuation.stage='after-award';s.continuation.resultSeen=true;
 assert.equal(Finale.resolve('continuationFinalAfter',s).lines[0][0],'林岚');
 assert.match(Finale.art(s.continuation,P,E),/contest-014\//);
}
assert.doesNotMatch(JSON.stringify([Intro.nodes,Workshop.nodes,Finale.nodes,Interludes.beats]),/陈晴|妹妹|小许/);
console.log('PASS solo travel, bench use, independent entry motivation, three contest dialogues and save compatibility');
