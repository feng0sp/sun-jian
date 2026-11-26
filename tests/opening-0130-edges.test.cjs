const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,P,E,C,caveDone,solved}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/opening-0130/edges';fs.mkdirSync(out,{recursive:true});
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);}
async function lines(p){for(let i=0;i<20&&await p.locator('#campaign-conversation').isVisible();i++){if(await p.locator('#campaign-choices button').count())return;await p.locator('#campaign-next').click();}await ready(p);}
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
  await p.setViewportSize({width,height});const s=D.fresh();s.frame='zhou-door';s.prologue.stage='village';s.openingSeen=true;s.spoken=['opening','villageArrival'];await seed(p,s);
  const rect=await p.locator('.illustrated-painting').boundingBox();assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=height);await p.locator('[data-hotspot=knock-door]').focus();await p.keyboard.press('Enter');await lines(p);
  await p.waitForFunction(()=>document.activeElement.dataset.hotspot==='enter-home');await p.keyboard.press('Enter');await lines(p);await p.locator('[data-hotspot=put-bag]').click();await lines(p);assert(await p.locator('#campaign-choices button').count());await p.keyboard.press('Escape');await p.locator('#campaign-continue').click();await lines(p);assert(await p.locator('#campaign-choices button').count());
  const box=await p.locator('#campaign-conversation .campaign-card').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height);await p.screenshot({path:out+'/welcome-'+width+'.png'});
 }
 // A failed new painting remains retryable; no WebGL is needed to read the opening.
 await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/i.test(t)?null:get.call(this,t,...a);};});await p.emulateMedia({reducedMotion:'reduce'});
 await p.route('**/zhou-door-night.webp*',r=>r.request().url().includes('retry=')?r.continue():r.abort());
 const door=D.fresh();door.frame='zhou-door';door.prologue.stage='village';door.openingSeen=true;door.spoken=['opening','villageArrival'];await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),door);await p.goto(base+'?journey=1');await p.waitForFunction(()=>CampaignJourney.snapshot().scene.imageError);assert(await p.locator('[data-retry]').isVisible());await p.locator('[data-retry]').click();await ready(p);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().scene.weather.running),false);await p.unroute('**/zhou-door-night.webp*');
 await p.locator('[data-hotspot=knock-door]').dblclick();await lines(p);assert(await p.evaluate(()=>CampaignJourney.snapshot().state.prologue.invited));await p.reload();await ready(p);assert.equal(await p.locator('[data-hotspot=knock-door]').count(),0);await p.emulateMedia({reducedMotion:'no-preference'});
 // Completing the village story alone does not unlock chapter selection.
 const old=caveDone();old.phase='complete';old.scene='village';old.frame='shelter';old.runs.bench=solved('rain-shelter-bench','assemble');old.storyRevision=3;delete old.prologue;await seed(p,old);assert.equal(await p.evaluate(()=>localStorage.getItem('sun-jian-campaign-v1-backup-before-opening4')),JSON.stringify(old));assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.phase),'complete');await p.locator('#campaign-pause').click();
 assert(!(await p.locator('#campaign-chapter-select').isVisible()));
 await p.locator('#campaign-continue').click();await ready(p);
 assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.frame),'shelter');
 const invalid=D.fresh();invalid.prologue={stage:'village',invited:true,bagPlaced:true};invalid.frame='room';const checked=D.restore(JSON.stringify(invalid),P,E,C);assert.equal(checked.prologue.invited,false);assert.notEqual(checked.frame,'room');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({desktopSizes:true,keyboardInvitation:true,choicePause:true,imageRetry:true,noWebGL:true,reducedMotion:true,doubleClick:true,completedFirstActStillLocked:true,invalidFlagsRejected:true,errors},null,2));console.log('PASS opening desktop, keyboard, choice pause, image retry, reduced motion, old ending and first-run gate');
}catch(e){await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
