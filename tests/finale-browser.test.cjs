const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {base:fixture}=require('./finale-state.test.cjs');
const url=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/fullgame-014/browser';fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available);}
async function button(p,text){await p.locator('#campaign-panel-actions').getByRole('button',{name:text,exact:false}).click();}
async function lines(p){for(let i=0;i<15&&await p.locator('#campaign-conversation').isVisible();i++)await p.locator('#campaign-next').click();}
async function drag(p,id,d,short=false){await p.locator(`[data-piece="${id}"]`).click();const n=await p.evaluate(()=>SunJian.snapshot().history.length);if(process.env.NO_WEBGL==='1'){await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator(`[data-direction="${d}"]`).click();}else{const xy=await p.evaluate(id=>SunJian.screen().pieces[id],id),end=xy.directions[d].end;await p.mouse.move(xy.start.x,xy.start.y);await p.mouse.down();await p.mouse.move(short?xy.start.x+(end.x-xy.start.x)*.12:end.x,short?xy.start.y+(end.y-xy.start.y)*.12:end.y,{steps:24});await p.mouse.up();}if(!short)await p.waitForFunction(n=>SunJian.snapshot().history.length===n&&!SunJian.snapshot().busy,n+1);else{await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),n);}}
async function slideShelfAtLowAngle(p){
 const area=await p.locator('#viewport canvas').boundingBox(),x=area.x+85,y=area.y+area.height*.65;
 await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x,y-area.height*.14,{steps:10});await p.mouse.up();
 await p.locator('[data-piece="seat"]').click();
 await p.locator('#quick-hint').click();await p.locator('#close-hint').click();
 assert.equal(await p.evaluate(()=>SunJian.snapshot().directionCue?.direction),'xn');
 assert.equal(await p.locator('#entry-source b').textContent(),'承书板');
 const {start,directions,axes}=await p.evaluate(()=>SunJian.screen().pieces.seat),end=directions.xn.end;
 const delta=[end.x-start.x,end.y-start.y];
 assert.equal(await p.evaluate(({delta,axes})=>JointDrag.chooseAxis(delta,axes),{delta,axes}),null,
  'the low camera angle projects two axes close together');
 const home=await p.evaluate(()=>SunJian.snapshot().poses.seat);
 await p.mouse.move(start.x,start.y);await p.mouse.down();
 await p.mouse.move(start.x-delta[1]*.25,start.y+delta[0]*.25,{steps:8});await p.mouse.up();
 assert.deepEqual(await p.evaluate(()=>SunJian.snapshot().poses.seat),home,'a crosswise drag cannot advance the part');
 assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);
 await p.screenshot({path:out+'/shelf-low-angle-guide.png'});
 await p.mouse.move(start.x,start.y);await p.mouse.down();await p.mouse.move(end.x,end.y,{steps:22});await p.mouse.up();
 await p.waitForFunction(()=>SunJian.snapshot().history.length===1);
 assert.equal(await p.evaluate(()=>SunJian.snapshot().history[0].piece),'seat');
}
async function put(p){await p.locator('#campaign-completion').waitFor({state:'visible'});await p.locator('[data-completion-return]').click();}
(async()=>{const b=process.env.SUNJIAN_PACKAGED_EXE?await require('./helpers/desktop-browser.cjs')():await chromium.launch({channel:'chrome'});const results=[];try{for(const [key,name,partName]of [['stool','换鞋小凳','宽座板'],['table','床边小几','几面'],['shelf','桌上书架','承书板']]){if(process.env.ONLY_CHOICE&&key!==process.env.ONLY_CHOICE)continue;const p=await b.newPage({viewport:{width:1440,height:900},recordVideo:process.env.RECORD_CAMPAIGN?{dir:out,size:{width:1440,height:900}}:undefined});p.setDefaultTimeout(20000);p.setDefaultNavigationTimeout(90000);const errors=[];p.on('pageerror',e=>errors.push(e.message));if(process.env.NO_WEBGL==='1')await p.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/.test(t)?null:old.call(this,t,...a);};});
 try{const s=fixture();s.storyRevision=9;s.continuation.revision=3;s.continuation.resting=true;await p.goto(url+'?practice=1');await p.evaluate(s=>{localStorage.clear();localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s));},s);await p.goto(url+'?journey=1');await ready(p);assert(await p.evaluate(()=>!!localStorage.getItem('sun-jian-campaign-v1-backup-before-full14')));const before=JSON.stringify((await snap(p)).state.runs);await p.locator('[data-workshop-record]').click();await button(p,'制作自己的参赛作品');await button(p,'选择'+name);assert.equal((await snap(p)).state.continuation.stage,'entry-build');await button(p,'拿起自己的散件');assert(await p.locator('[data-piece="left-pin"]').isDisabled());
 assert.equal(await p.locator('#assembly-guide strong').textContent(),'① 合入'+partName);
 if(process.env.NO_WEBGL!=='1')await drag(p,'seat','xn',true);
 if(key==='shelf'&&process.env.NO_WEBGL!=='1')await slideShelfAtLowAngle(p);
 else await drag(p,'seat','xn');
 await p.locator('#campaign-put').click();await p.reload();await ready(p);assert.equal((await snap(p)).state.continuation.entryRun.history.length,1);await button(p,'继续装配作品');
 await p.locator('[data-piece="left-pin"]').click();
 if(process.env.NO_WEBGL!=='1')assert.equal(await p.evaluate(()=>SunJian.snapshot().directionCue?.direction),'zn');
 await p.locator('#campaign-undo').click();await p.waitForFunction(()=>SunJian.snapshot().history.length===0);
 if(process.env.NO_WEBGL!=='1')assert.equal(await p.evaluate(()=>SunJian.snapshot().directionCue?.direction),'xn');
 await drag(p,'seat','xn');await drag(p,'right-pin','zn');
 assert.equal(await p.locator('#assembly-guide strong').textContent(),'② 装好左侧木销');
 await drag(p,'left-pin','zn');await put(p);assert.equal((await snap(p)).state.continuation.stage,'entry-review');for(const t of ['主板接面','搬动位置','取销通路'])await button(p,'查看 · '+t);await button(p,'收好三项');await button(p,'给周伯发张');await lines(p);await button(p,'包好散件');await lines(p);assert.equal((await snap(p)).state.continuation.stage,'contest-register');await button(p,'核对记录，登记作品');await button(p,'现场装配'+name);
 // Highest hint has no effect on narrative rank, and demo never commits a move.
 await p.locator('#hint').click();await p.locator('#hint-next').click();await p.locator('#hint-next').click();assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);await p.locator('#close-hint').click();
 await drag(p,'seat','xn');await p.locator('#campaign-put').click();await p.reload();await ready(p);await button(p,'现场装配'+name);assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),1);await drag(p,'left-pin','zn');await drag(p,'right-pin','zn');await put(p);await button(p,'和评审聊聊');await lines(p);assert.equal((await snap(p)).current,'contest-service-out');
 assert.match(await p.locator('[data-piece="seat"]').getAttribute('title'),/先取下木销/);
 await drag(p,'right-pin','zp');await p.locator('#campaign-put').click();await p.reload();await ready(p);await button(p,'继续演示取销');assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),1);
 assert.equal(await p.locator('#assembly-guide strong').textContent(),'① 取下左侧木销');
 await drag(p,'left-pin','zp');assert.equal(await p.locator('#assembly-guide strong').textContent(),'② 抽出'+partName);
 await p.locator('#quick-hint').click();assert.match(await p.locator('#hint-text').textContent(),new RegExp(partName));await p.keyboard.press('Escape');
 await drag(p,'seat','xp');assert.match(await p.locator('#assembly-guide p').textContent(),/板件都已取下/);
 await put(p);assert.equal((await snap(p)).state.continuation.stage,'contest-service-back');await p.reload();await ready(p);await button(p,'合回');await drag(p,'seat','xn');await drag(p,'right-pin','zn');await drag(p,'left-pin','zn');await put(p);await button(p,'交上记录');await lines(p);await button(p,'看完展台');assert.equal((await snap(p)).state.continuation.stage,'results');await p.screenshot({path:out+'/'+key+'-third.png'});await button(p,'听公布结果');await lines(p);await button(p,'领取证书');await button(p,'和大家拍张合影');await button(p,'收好合影');await lines(p);assert.equal((await snap(p)).state.continuation.stage,'ending');assert.equal(JSON.stringify((await snap(p)).state.runs),before);
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){await p.setViewportSize({width,height});const box=await p.locator('#campaign-panel .campaign-card').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);await p.screenshot({path:out+'/'+key+'-ending-'+width+'.png'});}
 const proof=JSON.stringify((await snap(p)).state.continuation.contestRun);await button(p,'重练自己的作品');await drag(p,'seat','xn');await p.locator('#campaign-put').click();await p.reload();await ready(p);assert.equal((await snap(p)).state.continuation.stage,'ending');assert.equal(JSON.stringify((await snap(p)).state.continuation.contestRun),proof);assert((await snap(p)).state.continuation.resultSeen);assert.deepEqual(errors,[]);
 results.push({key,name,fullFinale:true,legacyMigration:true,shortReturn:process.env.NO_WEBGL!=='1',actualDrags:process.env.NO_WEBGL!=='1',lowAngleDrag:key==='shelf'&&process.env.NO_WEBGL!=='1',partSpecificGuide:true,highestHint:true,allThreeContestResume:true,reversePins:true,rank:3,rehearsalIsolation:true,threeSizes:true,errors});if(process.env.RECORD_CAMPAIGN){const video=p.video();await p.close();await video.saveAs(out+'/'+key+'-备赛到第三名.webm');}else await p.close();console.log('PASS',name,'full playable finale');
 }catch(e){console.log(JSON.stringify(await snap(p)));await p.screenshot({path:out+'/'+key+'-failure.png'});throw e;}}
 fs.writeFileSync(out+'/verification.json',JSON.stringify({url,results},null,2));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
