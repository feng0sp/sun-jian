const assert=require('node:assert/strict');
const snap=p=>p.evaluate(()=>Journey.snapshot());
async function lines(p){for(let i=0;i<20;i++){const s=await snap(p);if(s.choices.length||(!s.introActive&&!s.state.talk))return s;await p.locator('#story-skip').click();}throw Error('Dialogue did not reach choices/free observation');}
async function choose(p,id){await p.waitForTimeout(240);await p.locator(`[data-choice="${id}"]`).click();}
async function settle(p){if((await snap(p)).introActive)await p.locator('#story-skip').click();await lines(p);await choose(p,'ask-stay');await lines(p);assert.equal((await snap(p)).state.arrivalDone,true);assert.equal((await snap(p)).state.learningAccepted,false);}
async function learn(p){await p.locator('[data-hotspot=zhou]').click();await lines(p);await choose(p,'zhou-try');await lines(p);if((await snap(p)).state.talk.node==='heritage'){await choose(p,'heritage-try');await lines(p);}await choose(p,'accept-learning');assert.equal((await snap(p)).state.beat,1);}
async function after(p){await lines(p);await choose(p,{2:'next-lap',4:'next-pin',6:'next-assembly',8:'end-note'}[(await snap(p)).state.beat]);}
module.exports={snap,lines,choose,settle,learn,after};
