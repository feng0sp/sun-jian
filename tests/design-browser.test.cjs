const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {P,solved,caveDone}=require('./helpers/campaign-fixtures.cjs'),Next=require('../dist/campaign-continuation.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/design-0137';fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function ready(p){await p.waitForFunction(()=>!!window.CampaignJourney?.snapshot().scene.available);}
async function lines(p){for(let i=0;i<20&&await p.locator('#campaign-conversation').isVisible();i++){if(await p.locator('#campaign-choices button').count())return;await p.locator('#campaign-next').click();}}
async function button(p,text){await p.locator('#campaign-panel-actions').getByRole('button',{name:text,exact:false}).click();}
async function drag(p,piece,direction,change=true){
 const before=await p.evaluate(()=>SunJian.snapshot().history.length);await p.locator(`[data-piece="${piece}"]`).click();const approach=p.locator(`[data-approach="${direction}"]`);if(await approach.isVisible())await approach.click();
 if(process.env.NO_WEBGL==='1'){await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator(`[data-direction="${direction}"]`).click();if(change)await p.waitForFunction(n=>SunJian.snapshot().history.length===n&&!SunJian.snapshot().busy,before+1);else assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),before);return;}
 const xy=await p.evaluate(id=>SunJian.screen().pieces[id],piece),end=xy.directions[direction].end;await p.mouse.move(xy.start.x,xy.start.y);await p.mouse.down();await p.mouse.move(end.x,end.y,{steps:25});await p.mouse.up();
 if(change)await p.waitForFunction(n=>SunJian.snapshot().history.length===n&&!SunJian.snapshot().busy,before+1);else{await p.waitForTimeout(180);assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),before);}
}
async function put(p){await p.locator('#campaign-completion').waitFor({state:'visible'});assert.equal(await p.locator('.campaign-completion-speaker').innerText(),'装配记录');await p.locator('[data-completion-return]').click();}
async function cancelDragWithEscape(p,piece,direction){
 await p.locator(`[data-piece="${piece}"]`).click();
 const before=await p.evaluate(id=>SunJian.snapshot().poses[id],piece);
 const {start,directions}=await p.evaluate(id=>SunJian.screen().pieces[id],piece),end=directions[direction].end;
 await p.mouse.move(start.x,start.y);await p.mouse.down();
 await p.mouse.move(start.x+(end.x-start.x)*.36,start.y+(end.y-start.y)*.36,{steps:10});
 await p.locator('#drag-status').waitFor({state:'visible'});
 assert.notDeepEqual(await p.evaluate(id=>SunJian.snapshot().poses[id],piece),before);
 await p.keyboard.press('Escape');await p.mouse.up();
 assert.equal((await snap(p)).view,'puzzle','Escape cancels the active drag without leaving the puzzle');
 assert.deepEqual(await p.evaluate(id=>SunJian.snapshot().poses[id],piece),before);
 assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);
}
(async()=>{const browser=process.env.SUNJIAN_PACKAGED_EXE?await require('./helpers/desktop-browser.cjs')():await chromium.launch({channel:'chrome',headless:true});let p;try{
 p=await browser.newPage({viewport:{width:1440,height:900},recordVideo:process.env.RECORD_CAMPAIGN?{dir:out,size:{width:1440,height:900}}:undefined});p.setDefaultTimeout(25000);p.setDefaultNavigationTimeout(90000);if(process.env.NO_WEBGL==='1')await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args);};});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const s={...caveDone(),phase:'complete',frame:'bench-seat',finished:true,benchChecked:true};s.runs.bench=solved('rain-shelter-bench','assemble');s.continuation={...Next.fresh(),revision:1,started:true,active:true,noticeSeen:true,departed:true,workshopSeen:true,run:solved('pinned','assemble'),reviewed:true,entryAccepted:true,stage:'registered'};
 if(process.env.LOW_QUALITY==='1')s.settings.quality='low';
 await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);
 assert(await p.evaluate(()=>!!localStorage.getItem('sun-jian-campaign-v1-backup-before-design2')));
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('sun-jian-campaign-v1-backup-before-workshop6')).continuation.revision),1);const main=(await snap(p)).state.runs,initial=(await snap(p)).state.continuation.run;
 await button(p,'开始准备自己的作品');assert.equal((await snap(p)).state.continuation.stage,'purpose');await button(p,process.env.PURPOSE==='repair'?'以后坏了':process.env.PURPOSE==='comfort'?'坐着换鞋':'扫地时');await lines(p);assert.equal((await snap(p)).state.continuation.stage,'peer');
 await button(p,'听听林岚');await p.locator('#campaign-continuation-backdrop img').evaluate(img=>img.decode());await p.screenshot({path:out+'/linlan.png'});await lines(p);assert.equal((await snap(p)).state.continuation.stage,'service-check');
 await button(p,'拿起前置挡条');await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle');assert.equal((await snap(p)).current,'practice-service-access');await p.waitForTimeout(350);if(process.env.NO_WEBGL!=='1')assert(await p.locator('#piece-markers span').filter({hasText:'乙'}).evaluate(el=>el.hidden));await p.screenshot({path:out+'/closed-sample.png'});await drag(p,'pin','zp',false);await drag(p,'guard','yp');
 // A partially stripped diagnostic fixture survives leaving and reloading.
 await p.locator('#campaign-put').click();await p.reload();await ready(p);assert.equal((await snap(p)).state.continuation.stage,'service-check');assert.equal((await snap(p)).state.continuation.serviceRun.history.length,1);await button(p,'接着拆检');
 await p.locator('#campaign-undo').click();await p.waitForFunction(()=>SunJian.snapshot().history.length===0&&!SunJian.snapshot().busy);await drag(p,'guard','yp');await drag(p,'pin','zp');await drag(p,'tenon','yp');await put(p);assert.equal((await snap(p)).state.continuation.stage,'service-choice');await p.screenshot({path:out+'/choice.png'});
 await button(p,'把挡条固定在侧边');await p.reload();await ready(p);assert.equal((await snap(p)).state.continuation.stage,'service-build');await button(p,'合回侧置方案');
 // An early pin remains recoverable in the new model as in the village learning piece.
 assert(await p.locator('[data-piece="pin"]').isDisabled());assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);
 await drag(p,'tenon','yn');await drag(p,'pin','zn');await put(p);assert.equal((await snap(p)).state.continuation.stage,'service-test');await button(p,'取销，试着拆回');await p.waitForTimeout(350);await p.screenshot({path:out+'/open-sample.png'});
 await drag(p,'pin','zp');await drag(p,'tenon','yp');await p.locator('#campaign-completion').waitFor({state:'visible'});await p.locator('[data-completion-observe]').click();await p.locator('#campaign-undo').click();await p.waitForFunction(()=>SunJian.snapshot().history.length===1&&!SunJian.snapshot().busy);await drag(p,'tenon','yp');await put(p);assert.equal((await snap(p)).state.continuation.stage,'service-review');
 if(!process.env.SUNJIAN_PACKAGED_EXE)await p.route('**/workshop-models/dovetail-open.webp',request=>request.abort(),{times:1});
 await button(p,'和林岚核对');await lines(p);assert.equal((await snap(p)).state.continuation.stage,'workshop-dovetail-out');
 if(!process.env.SUNJIAN_PACKAGED_EXE)await p.getByRole('button',{name:'重试结构图'}).click();
 await p.locator('.workshop-models img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 await p.screenshot({path:out+'/dovetail-preview.png'});
 await button(p,'观察并拆开滑盖');
 await drag(p,'slide','yp',false);
 if(process.env.NO_WEBGL!=='1')await cancelDragWithEscape(p,'key','yp');
 await drag(p,'key','yp');
 await p.locator('#campaign-put').click();await p.reload();await ready(p);await button(p,'接着拆开滑盖');
 assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),1);
 await drag(p,'slide','xp');await put(p);
 await button(p,'沿槽合回滑盖');
 assert(await p.locator('[data-piece="key"]').isDisabled());
 if(process.env.NO_WEBGL!=='1')await cancelDragWithEscape(p,'slide','xn');
 await drag(p,'slide','xn');
 await p.locator('#campaign-reset').click();
 await p.waitForFunction(()=>SunJian.snapshot().history.length===0);
 assert(await p.locator('[data-piece="key"]').isDisabled());
 await drag(p,'slide','xn');
 await p.locator('#campaign-put').click();await p.reload();await ready(p);await button(p,'接着合回滑盖');
 assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),1);
 await drag(p,'key','yn');await put(p);
 await button(p,'拿起木条，复原鲁班锁');
 const level=P.LEVELS.find(l=>l.id==='burr-six'),removed=level.pieces.map(piece=>piece.id),route=P.assemblyRoute(level,removed);
 assert(route.length===6);
 const locked=await p.locator('.piece:disabled').count();assert(locked>0);
 const lockedBar=await p.locator('.piece:disabled').first().getAttribute('data-piece');
 await p.locator('.piece:not(:disabled)').first().focus();await p.keyboard.press(lockedBar.slice(-1));
 assert.match(await p.locator('#feedback-text').innerText(),/留出进槽的空间/);
 const historyBefore=await p.evaluate(()=>SunJian.snapshot().history);
 for(let i=0;i<3;i++)await p.locator(i?'#hint-next':'#quick-hint').click();
 assert.equal(await p.evaluate(()=>SunJian.snapshot().hint),3);
 assert.deepEqual(await p.evaluate(()=>SunJian.snapshot().history),historyBefore);
 await p.keyboard.press('Escape');
 assert.equal((await snap(p)).view,'puzzle');
 assert(await p.locator('#hint-box').isHidden());
 for(const [index,move]of route.entries()){
  if(index===0)await p.setViewportSize({width:1280,height:720});
  if(index===2){
   await p.keyboard.press('Escape');await p.reload();await ready(p);
   const savedPanel=await p.locator('#campaign-panel-content').innerText();
   assert.match(savedPanel,/已装好 2 \/ 6/);
   assert(!savedPanel.includes('我早上拆的'));
   await p.screenshot({path:out+'/burr-resume.png'});
   await p.keyboard.press('Escape');
   assert.match(await p.locator('#campaign-resume-summary').innerText(),/已装好 2 \/ 6/);
   await p.locator('#campaign-continue').click();
   await button(p,'收好记录，留在工坊');
   assert.match(await p.locator('#campaign-workshop-rest').innerText(),/六件鲁班锁[\s\S]*已装好 2 \/ 6/);
   await p.locator('[data-workshop-record]').click();
   await button(p,'接着复原鲁班锁');
   assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),index);
   await p.setViewportSize({width:1440,height:900});
  }
  if(index===4)await p.setViewportSize({width:1920,height:1080});
  await drag(p,move.piece,move.direction);
  if(index===0){
   await p.locator('#campaign-undo').click();await p.waitForFunction(()=>SunJian.snapshot().history.length===0);
   await drag(p,move.piece,move.direction);
  }
  if([0,2,4].includes(index)){
   assert.equal(await p.locator('#piece-list').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2);
   await p.screenshot({path:out+'/burr-progress-'+index+'.png'});
  }
 }
 await put(p);assert.equal((await snap(p)).state.continuation.stage,'workshop-reflection');
 await button(p,'和林岚聊聊');await lines(p);assert.equal((await snap(p)).state.continuation.stage,'museum');
 await p.reload();await ready(p);assert.equal((await snap(p)).state.continuation.stage,'museum');
 await lines(p);await p.locator('#campaign-notes').click();
 assert.match(await p.locator('#campaign-panel-content').innerText(),/维修通路/);assert.equal(await p.locator('.heritage-workshop-note').count(),2);
 await button(p,'收好手记');await p.locator('[data-museum-leave]').click();
 assert.equal((await snap(p)).state.continuation.stage,'work-choice');
 assert.deepEqual((await snap(p)).state.runs,main);assert.deepEqual((await snap(p)).state.continuation.run,initial);assert(!(await snap(p)).state.continuation.thirdPlace);
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){await p.setViewportSize({width,height});const card=await p.locator('#campaign-panel .campaign-card').boundingBox();assert(card.x>=0&&card.y>=0&&card.x+card.width<=width+1&&card.y+card.height<=height+1);await p.screenshot({path:`${out}/design-ready-${width}.png`});}
 await button(p,'暂时收好');assert((await snap(p)).state.continuation.active);assert(await p.locator('#campaign-workshop-rest').isVisible());
 const formal=JSON.stringify((await snap(p)).state.continuation.burrBackRun);
 await p.locator('[data-workshop-rehearse]').click();await button(p,'六件鲁班锁');
 await drag(p,route[0].piece,route[0].direction);await p.locator('#campaign-put').click();
 const afterPractice=(await snap(p)).state.continuation;
 assert.equal(JSON.stringify(afterPractice.burrBackRun),formal);assert.equal(afterPractice.rehearsals.burrBackRun.history.length,1);
 await p.locator('#campaign-pause').click();await p.locator('#campaign-next-story').click();assert.equal((await snap(p)).state.continuation.stage,'work-choice');assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/verification.json',JSON.stringify({url:base,legacyEntryMigration:true,onePurposeSuffices:true,purpose:process.env.PURPOSE||'moving',linlanArtwork:true,physicalBlockedPin:true,realGuardPinTenonDrags:process.env.NO_WEBGL!=='1',noWebglDirectionFallback:process.env.NO_WEBGL==='1',partialExitRefreshUndo:true,sidePositionAssemblyAndService:true,earlyPinRecoverable:true,completionObserveUndoRedo:true,originalRunsAndPracticePreserved:true,noInventedAward:true,threeDesktopSizes:true,lowQuality:process.env.LOW_QUALITY==='1',workshopDovetailBothWays:true,burrAllSix:true,workshopUndoRefreshAndHint:true,workshopReset:true,workshopReplayIsolation:true,workshopNotes:true,escapeCancelsGesture:process.env.NO_WEBGL!=='1',escapeClosesHint:true,workshopResumeCounts:true,workshopArtRetry:!process.env.SUNJIAN_PACKAGED_EXE,errors},null,2));
 if(process.env.RECORD_CAMPAIGN){const video=p.video();await p.close();await video.saveAs(out+'/榫间-维修通路与设计准备.webm');}
 console.log('PASS design: purpose → Lin Lan → physical blockage → recoverable inspection → side mount → assembly and maintenance → design notes');
}catch(e){if(p&&!p.isClosed()){console.log(JSON.stringify(await snap(p)));await p.screenshot({path:out+'/failure.png'});}throw e;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
