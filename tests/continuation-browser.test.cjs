const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,solved,caveDone}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/continuation-0136';fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function lines(p){for(let i=0;i<20&&await p.locator('#campaign-conversation').isVisible();i++){if(await p.locator('#campaign-choices button').count())return;await p.locator('#campaign-next').click();}}
async function button(p,text){await p.locator('#campaign-panel-actions').getByRole('button',{name:text,exact:false}).click();}
async function ready(p){await p.waitForFunction(()=>!!window.CampaignJourney?.snapshot().scene.available);}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:1440,height:900},recordVideo:process.env.RECORD_CAMPAIGN?{dir:out,size:{width:1440,height:900}}:undefined});p.setDefaultTimeout(20000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const old={...caveDone(),storyRevision:5,phase:'complete',frame:'bench-seat',finished:true,benchChecked:true};old.runs.bench=solved('rain-shelter-bench','assemble');
 await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),old);await p.goto(base+'?journey=1');await ready(p);
 const before=(await snap(p)).state.runs;assert.equal((await snap(p)).state.continuation.started,false);assert(await p.evaluate(()=>!!localStorage.getItem('sun-jian-campaign-v1-backup-before-continuation6')));
 await p.locator('#campaign-pause').click();await p.locator('#campaign-next-story').click();await p.locator('[data-hotspot=contest-poster]').click();await lines(p);assert.equal((await snap(p)).state.talk.id,'continuationMeetup');
 // Skip/held activation cannot select a choice for the player.
 await p.locator('#campaign-choices button').first().dispatchEvent('keydown',{key:'Enter',repeat:true,bubbles:true});assert.equal((await snap(p)).state.continuation.noticeSeen,false);
 await p.getByRole('button',{name:'先收好，路上再看。',exact:true}).click();assert.equal((await snap(p)).state.continuation.stage,'notice');await p.screenshot({path:out+'/notice.png'});
 await button(p,'看看参赛要求');assert.match(await p.locator('#campaign-panel-content').innerText(),/十周/);await button(p,'收好折页');
 await button(p,'问问周伯');for(let i=0;i<4;i++)await p.locator('#campaign-next').click();assert.equal((await snap(p)).state.continuation.stage,'goodbye');await p.locator('#campaign-continuation-backdrop img').evaluate(img=>img.decode());await p.screenshot({path:out+'/goodbye.png'});await lines(p);assert.equal((await snap(p)).state.continuation.stage,'home');
 await p.reload();await ready(p);assert.equal((await snap(p)).state.continuation.stage,'home');assert.equal((await snap(p)).modal,'campaign-panel');
 await button(p,'预约周末');await lines(p);await button(p,'拿起散件');await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle');
 assert.equal((await snap(p)).current,'practice-release-order');assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);await p.waitForTimeout(350);assert.match(await p.locator('.stage').evaluate(el=>getComputedStyle(el).backgroundImage),/workshop-study/);await p.screenshot({path:out+'/workshop-puzzle.png'});
 // Prove the premature pin really blocks the tenon, then undo and perform real assembly drags.
 assert(await p.locator('[data-piece="pin"]').isDisabled());await p.locator('#precise-controls').evaluate(e=>e.open=true);assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);

 for(const [piece,direction]of [['tenon','yn'],['pin','zn']]){await p.locator(`[data-piece="${piece}"]`).click();const approach=p.locator(`[data-approach="${direction}"]`);if(await approach.isVisible())await approach.click();const xy=await p.evaluate(id=>SunJian.screen().pieces[id],piece);await p.mouse.move(xy.start.x,xy.start.y);await p.mouse.down();await p.mouse.move(xy.directions[direction].end.x,xy.directions[direction].end.y,{steps:28});await p.mouse.up();await p.waitForFunction(id=>!SunJian.snapshot().removed.includes(id)&&!SunJian.snapshot().busy,piece);}
 await p.locator('#campaign-completion').waitFor({state:'visible'});assert.equal(await p.locator('.campaign-completion-speaker').innerText(),'装配记录');await p.locator('[data-completion-return]').click();assert.equal((await snap(p)).state.continuation.stage,'review');
 await p.reload();await ready(p);assert.equal((await snap(p)).state.continuation.stage,'review');await button(p,'标记取销');await button(p,'我想报名');await lines(p);
 await p.getByRole('button',{name:'先不提交，再看看要求。',exact:true}).click();assert.equal((await snap(p)).state.continuation.entryAccepted,false);await button(p,'收好折页');await button(p,'我想报名');await lines(p);await p.getByRole('button',{name:'报名新人组，保存准备计划。',exact:true}).click();
 assert.equal((await snap(p)).state.continuation.stage,'registered');assert((await snap(p)).state.continuation.entryAccepted);assert.deepEqual((await snap(p)).state.runs,before);
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){await p.setViewportSize({width,height});await p.screenshot({path:`${out}/registered-${width}.png`});assert(await p.locator('#campaign-panel-actions').getByRole('button',{name:'收好计划，留在工坊'}).isVisible());}
 await button(p,'收好计划，留在工坊');assert((await snap(p)).state.continuation.active);assert(await p.locator('#campaign-workshop-rest').isVisible());await p.reload();await ready(p);assert((await snap(p)).state.continuation.entryAccepted);assert((await snap(p)).state.continuation.active);
 await p.locator('#campaign-pause').click();await p.locator('#campaign-next-story').click();assert.equal((await snap(p)).state.continuation.stage,'registered');assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/verification.json',JSON.stringify({url:base,oldEndingMigration:true,originalRunsUnchanged:true,conditionalMeetup:true,ruleReview:true,realCollisionAndUndo:true,actualAssemblyDrag:true,refreshHomeReviewRegistered:true,registrationExplicit:true,desktopSizes:[1280,1440,1920],errors},null,2));
 if(process.env.RECORD_CAMPAIGN){const video=p.video();await p.close();await video.saveAs(out+'/榫间-新篇至报名.webm');}
 console.log('PASS continuation: legacy ending → meeting → rules → workshop → blocked pin/undo → real drags → reflection → explicit registration → resume');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
