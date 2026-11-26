const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,P,E,C,learned,caveDone,solved}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/journey-0131/edges';fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');}
function scene(id){const s=id==='overnight'?learned():caveDone();s.frame=id==='homeward'?'store-sky':id==='farewell'?'shelter':'room';s.scene=id==='homeward'?'cave':'village';if(id==='farewell'){s.phase='farewell';s.benchChecked=true;s.runs.bench=solved('rain-shelter-bench','assemble');}s.interlude={id,step:0};return s;}
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/i.test(t)?null:get.call(this,t,...a);};});await p.emulateMedia({reducedMotion:'reduce'});
 // A missing new painting has an accessible retry, and skips commit only the narrative result.
 await p.route('**/room-after-dinner-bag-01311.webp*',r=>r.request().url().includes('retry=')?r.continue():r.abort());await seed(p,scene('overnight'));await p.waitForFunction(()=>CampaignJourney.snapshot().scene.imageError);assert(await p.locator('#campaign-interlude-next').isDisabled());await p.locator('#campaign-interlude-retry').click();await ready(p);assert.equal((await snap(p)).scene.weather.running,false);assert.equal(await p.locator('#campaign-interlude').evaluate(e=>getComputedStyle(e).backdropFilter),'none');await p.locator('#campaign-interlude-skip').click();await ready(p);assert.equal((await snap(p)).state.phase,'morning');await p.unroute('**/room-after-dinner-bag-01311.webp*');
 await p.route('**/shelter-seated-zhou-bag-01311.webp*',r=>r.abort());const failedEnd=scene('farewell');failedEnd.interlude.step=1;await seed(p,failedEnd);await p.waitForFunction(()=>CampaignJourney.snapshot().scene.imageError);await p.locator('#campaign-interlude-skip').dblclick();await ready(p);assert.equal((await snap(p)).state.phase,'complete');assert.equal((await snap(p)).state.interludesDone.filter(x=>x==='farewell').length,1);await p.unroute('**/shelter-seated-zhou-bag-01311.webp*');
 // Blur/resize do not auto-advance. Escape pauses, never silently skips a sequence.
 await seed(p,scene('homeward'));await ready(p);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.setViewportSize({width:1280,height:720});assert.equal((await snap(p)).state.interlude.step,0);await p.keyboard.press('Escape');assert(await p.locator('#campaign-menu').isVisible());await p.locator('#campaign-continue').click();await ready(p);assert.equal((await snap(p)).state.interlude.step,0);await p.locator('#campaign-interlude-skip').click();await ready(p);assert.equal((await snap(p)).state.phase,'return');
 // Returning from an unlocked chapter replay preserves the paused return trip.
 const paused=scene('homeward');paused.interlude.step=1;await seed(p,paused);
 await p.evaluate(()=>localStorage.setItem('sun-jian-campaign-v1-chapter-unlock-v1','cleared'));
 await p.reload();await ready(p);await p.keyboard.press('Escape');
 await p.locator('#campaign-chapter-select').click();await p.locator('[data-chapter-start="arrival"]').click();
 await p.reload();await ready(p);assert.equal((await snap(p)).chapterReplay,'arrival');
 await p.keyboard.press('Escape');await p.locator('#campaign-end-chapter').click();await p.locator('#campaign-continue').click();
 await ready(p);assert.equal((await snap(p)).state.interlude.id,'homeward');assert.equal((await snap(p)).state.interlude.step,1);
 // Existing morning/returned/completed players are never replayed or downgraded.
 for(const [phase,frame]of [['morning','room'],['return','room'],['complete','shelter']]){const s=scene('farewell');s.storyRevision=4;s.phase=phase;s.frame=frame;await seed(p,s);await ready(p);assert.equal((await snap(p)).state.phase,phase);assert.equal((await snap(p)).state.interlude,null);assert.equal(await p.locator('#campaign-interlude').isVisible(),false);}
 // Invalid or stale sequence IDs cannot open a future chapter.
 const invalid=scene('overnight');invalid.interlude={id:'homeward',step:2};assert.equal(D.restore(JSON.stringify(invalid),P,E,C).interlude,null);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({failedImageRetry:true,failedImageSkip:true,noWebGL:true,reducedMotion:true,skipSingleCommit:true,blurResizePause:true,legacyPhases:true,invalidSequenceRejected:true,errors},null,2));console.log('PASS narrative image failures, skip, no WebGL, reduced motion, pause, and legacy phases');
}catch(e){console.log('STATE',JSON.stringify(await snap(p)));await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
