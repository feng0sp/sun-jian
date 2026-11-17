/* One browser document, repeated real UI use, periodic GC/DOM/RAF sampling.
 * SOAK_MINUTES enables a timed endurance run; default is a short smoke run. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {P,C,caveDone}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/qa-0125/soak';fs.mkdirSync(out,{recursive:true});
const duration=Number(process.env.SOAK_MINUTES||1.5)*60000;
const snap=p=>p.evaluate(()=>SunJian.snapshot());
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&CampaignJourney.snapshot().scene.enabled);}
function route(l,removed,mode){if(mode==='assemble'?!removed.length:removed.length===l.pieces.filter(p=>!p.fixed).length)return [];
for(const m of (mode==='assemble'?P.availableInsertions:P.availableMoves)(l,removed)){const r=mode==='assemble'?removed.filter(id=>id!==m.piece):[...removed,m.piece],tail=route(l,r,mode);if(tail)return[m,...tail];}return null;}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1440,height:900}}),errors=[],samples=[];p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));let cycle=0,start=Date.now(),baseline;
try{
await p.addInitScript(()=>{const request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),pending=new Set();window.requestAnimationFrame=fn=>{const id=request(t=>{pending.delete(id);fn(t);});pending.add(id);return id;};window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};window.qaFrames=()=>pending.size;window.qaContextLost=0;});
await p.goto(base+'?practice=1');const s=caveDone();s.frame='store-sky';s.settings.quality='low';await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);
await p.locator('#viewport canvas').evaluate(c=>c.addEventListener('webglcontextlost',()=>window.qaContextLost++));const canonical=await p.evaluate(()=>JSON.stringify(CampaignJourney.snapshot().state.runs)),cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');
start=Date.now();while(Date.now()-start<duration){
const n=C.nodes[cycle%C.nodes.length],mode=Math.floor(cycle/C.nodes.length)%2?'assemble':'dismantle',key=n.id+':'+mode;
await p.locator('#campaign-notes').click();await p.locator('[data-study="'+key+'"]').click();await p.locator('#campaign-reset').click();let before=await snap(p);const l=P.LEVELS.find(l=>l.id===n.level),m=route(l,before.removed,mode)[0];assert(m);
await p.locator('[data-piece="'+m.piece+'"]').click();
if(cycle%2===0){if(mode==='assemble')await p.locator('[data-approach="'+m.direction+'"]').click();const point=await p.evaluate(id=>SunJian.screen().pieces[id],m.piece);await p.mouse.move(point.start.x,point.start.y);await p.mouse.down();await p.mouse.move(point.directions[m.direction].end.x,point.directions[m.direction].end.y,{steps:24});await p.mouse.up();}
else{await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction="'+m.direction+'"]').click();}
await p.waitForFunction(()=>!SunJian.snapshot().busy&&SunJian.snapshot().history.length===1);
const history=(await snap(p)).history;
await p.locator('#replay-moves').click();await p.locator('#replay-play').click();await p.waitForTimeout(700);await p.locator('#replay-progress').fill('0.5');if(cycle%2)await p.keyboard.press('Escape');else await p.locator('#replay-return').click();await p.waitForFunction(()=>SunJian.snapshot().visible);assert.deepEqual((await snap(p)).history,history);
await p.locator('#inspect-piece').click();await p.locator('[data-inspect-layout="'+(cycle%2?'apart':'together')+'"]').click();await p.waitForTimeout(450);await p.keyboard.press('Escape');await p.waitForFunction(()=>SunJian.snapshot().visible);assert.deepEqual((await snap(p)).history,history);
await p.locator('#quick-hint').click();await p.locator('#hint-next').click();await p.locator('#hint-next').click();await p.waitForTimeout(1000);await p.locator('#close-hint').click();assert.deepEqual((await snap(p)).history,history);
await p.locator('#campaign-undo').click();assert.equal((await snap(p)).history.length,0);await p.locator('[data-piece="'+m.piece+'"]').click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction="'+m.direction+'"]').click();await p.waitForFunction(()=>!SunJian.snapshot().busy&&SunJian.snapshot().history.length===1);
await p.locator('#campaign-put').click();await ready(p);await p.locator('#campaign-sketch').click();await p.keyboard.press('Escape');await ready(p);
// Dwell through at least one autosave tick; a later timer must not overwrite a replay.
await p.waitForTimeout(5100);const state=await p.evaluate(()=>JSON.parse(localStorage.getItem('sun-jian-campaign-v1')));assert.equal(state.replays['cave:'+key].history.length,1);assert.equal(JSON.stringify(state.runs),canonical);assert.equal(state.cave.completed.length,8);
cycle++;if(cycle%4===0||!baseline){await cdp.send('HeapProfiler.collectGarbage');const metrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value])),ui=await p.evaluate(()=>({canvases:document.querySelectorAll('canvas').length,frames:qaFrames(),lost:qaContextLost,dialogs:document.querySelectorAll('dialog[open]').length}));const sample={cycle,elapsedMs:Date.now()-start,heap:metrics.JSHeapUsedSize,nodes:metrics.Nodes,...ui};baseline||=sample;assert.equal(ui.canvases,baseline.canvases);assert(ui.frames<=baseline.frames+2);assert.equal(ui.lost,0);assert.equal(ui.dialogs,0);assert(sample.nodes<baseline.nodes+1500,'DOM count remains bounded');assert(sample.heap<baseline.heap+40*1024*1024,'retained heap remains bounded');assert.deepEqual(errors,[]);samples.push(sample);fs.writeFileSync(out+'/progress.json',JSON.stringify({status:'running',startedAt:new Date(start).toISOString(),requestedMinutes:duration/60000,cycle,samples,errors},null,2));console.log(JSON.stringify(sample));}
}
await p.screenshot({path:out+'/end.png'});fs.writeFileSync(out+'/result.json',JSON.stringify({status:'passed',startedAt:new Date(start).toISOString(),elapsedMs:Date.now()-start,cycle,samples,errors,canonicalProgressPreserved:true},null,2));console.log('PASS sustained campaign interaction: '+cycle+' cycles in '+((Date.now()-start)/60000).toFixed(1)+' minutes');
}catch(e){fs.writeFileSync(out+'/failure.json',JSON.stringify({cycle,elapsedMs:Date.now()-start,error:String(e),errors,samples},null,2));await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
