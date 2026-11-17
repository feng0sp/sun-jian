const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,learned}=require('./helpers/campaign-fixtures.cjs'),S=require('../dist/campaign-story.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/content-0132';fs.mkdirSync(out,{recursive:true});
for(const seen of [false,true]){const s=learned();s.frame='room';s.nightBenchSeen=seen;assert(!D.objective(s).includes('长凳'));s.phase='morning';assert.equal(D.objective(s).includes('长凳'),seen);if(!seen)assert(D.objective(s).includes('草图'));}
assert(!S.resolve('zhou',{phase:'settle',scene:'village',spoken:[]}).lines.some(([,line])=>/暖|杯子/.test(line)));
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const ready=()=>p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);
async function seed(s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready();}
try{
const s=D.fresh();s.phase='learning';s.frame='workbench';s.prologue={stage:'settled',invited:true,bagPlaced:true};s.openingSeen=true;
await seed(s);await p.locator('[data-hotspot=straight]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>SunJian.snapshot().visible);
await p.locator('[data-piece=tenon]').click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction=yp]').click();await p.locator('#campaign-completion').waitFor({state:'visible'});await p.locator('[data-completion-return]').focus();await p.keyboard.press('Enter');await ready();
await p.waitForFunction(()=>document.activeElement?.dataset.hotspot==='lap');assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.done.length),1);
await p.screenshot({path:out+'/next-sample-focus.png'});await p.keyboard.press('Enter');await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle'&&SunJian.snapshot().level==='lap');await p.keyboard.press('Escape');await ready();await p.waitForFunction(()=>document.activeElement?.dataset.hotspot==='lap');
// Focus recovery never steals a deliberate pause-menu destination.
await p.keyboard.press('Enter');await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle');await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().modal),'campaign-menu');assert(await p.evaluate(()=>!!document.activeElement.closest('#campaign-menu')));
// Morning objective follows what was actually observed; a repeated conversation stays brief.
for(const seen of [false,true]){const a=learned();a.phase='morning';a.frame='room';a.nightBenchSeen=seen;await seed(a);assert.equal((await p.locator('#campaign-goal').textContent()).includes('长凳'),seen);await p.locator('[data-hotspot=zhou]').click();assert.equal((await p.locator('#campaign-line').textContent()).includes('昨晚雨棚'),seen);}
assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({version:'0.13.2',nextLessonFocus:true,cancelFocus:true,pauseFocusPreserved:true,contextualGoals:true,errors},null,2));console.log('PASS contextual objectives, next-sample keyboard handoff, cancel and pause focus');
}catch(e){await p.screenshot({path:out+'/failure.png'});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
