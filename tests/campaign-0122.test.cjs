const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,learned}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/campaign-0122';fs.mkdirSync(out,{recursive:true});
const snapshot=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function ready(p){await p.waitForFunction(()=>{const s=CampaignJourney.snapshot().scene;return s.available&&!s.loading&&!s.imageError;});await p.locator('.illustrated-art').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const errors=[],report={version:'0.12.2',url:base,layouts:[]};try{
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
  const p=await b.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(e.message));const s=D.fresh();s.openingSeen=true;await seed(p,s);
  assert.equal(await p.locator('.illustrated-routes [data-exit]').count(),3);assert(await p.locator('.illustrated-routes [data-exit=trail]').isDisabled());
  const layout=await p.evaluate(()=>{const r=document.querySelector('.illustrated-painting').getBoundingClientRect();return [...document.querySelectorAll('.illustrated-route')].map(e=>{const b=e.getBoundingClientRect();return{id:e.dataset.exit,inside:b.x>=r.x&&b.y>=r.y&&b.right<=r.right&&b.bottom<=r.bottom,x:((b.x+b.width/2)-r.x)/r.width,y:((b.y+b.height/2)-r.y)/r.height};});});assert(layout.every(x=>x.inside));report.layouts.push({width,height,arrows:layout});
  await p.screenshot({path:out+'/village-arrows-'+width+'.png'});await p.locator('.illustrated-routes [data-exit=room]').click();await ready(p);assert.equal((await snapshot(p)).state.frame,'room');assert((await snapshot(p)).scene.image.endsWith('room-table-night-0.webp'));
  await p.locator('[data-exit=village]').click();await ready(p);await p.locator('.illustrated-routes [data-exit=shelter]').click();await ready(p);assert.equal((await snapshot(p)).state.frame,'shelter');
  await p.locator('[data-bench-toggle]').click();for(const part of ['rails','oldwood','joint']){await p.locator(`[data-bench-part=${part}]`).click();assert.equal((await snapshot(p)).scene.benchStudy,part);assert(await p.locator('.bench-study-card p').innerText());}
  const before=(await snapshot(p)).state;assert.equal(before.phase,'arrival');assert.equal(before.done.length,0);await p.screenshot({path:out+'/bench-inspect-'+width+'.png'});
  await p.locator('#campaign-pause').click();assert(await p.locator('.illustrated-bench-marks').evaluate(e=>e.inert));await p.locator('#campaign-continue').click();await ready(p);await p.locator('[data-bench-close]').click();await p.close();
 }
 // Every committed lesson maps to a matching painted room and close-up state.
 const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));
 for(let n=0;n<=4;n++){
  const s=learned();s.phase=n<4?'learning':'night';s.frame='room';s.done=s.done.slice(0,n);s.runs=Object.fromEntries(Object.entries(s.runs).filter(([key])=>s.done.includes(key)));await seed(p,s);assert((await snapshot(p)).scene.image.endsWith('room-table-night-'+n+'.webp'));await p.screenshot({path:out+'/room-state-'+n+'.png'});
  await p.locator('[data-hotspot="frame:workbench"]').click();await ready(p);assert((await snapshot(p)).scene.image.endsWith('workbench-'+n+'.webp'));
 }
 // A painted sample in the wide shot can be picked directly without another menu.
 let s=learned();s.done=[];s.runs={};s.phase='learning';s.frame='room';await seed(p,s);await p.locator('[data-hotspot=straight]').click();assert.equal((await snapshot(p)).current,'learn-straight-out');await p.keyboard.press('Escape');await ready(p);assert.equal((await snapshot(p)).state.frame,'room');assert.equal((await snapshot(p)).state.done.length,0);
 // Early bench practice is explicitly separate from journey inventory and progress.
 s=learned();s.frame='shelter';await seed(p,s);await p.locator('[data-hotspot=bench]').click();await p.locator('#campaign-panel-actions').getByRole('button',{name:'长凳试拼（练习）',exact:true}).click();assert.equal((await snapshot(p)).current,'rain-shelter-bench:assemble');await p.locator('#campaign-put').click();await ready(p);const after=(await snapshot(p)).state;assert.equal(after.phase,'night');assert(!after.suppliesCollected);assert.equal(after.cave.completed.length,0);
 // Daytime arrows retain the same coordinates and open the actual stone road.
 s=learned();s.phase='morning';s.frame='village';await seed(p,s);await p.locator('.illustrated-routes [data-exit=trail]').click();await ready(p);assert.equal((await snapshot(p)).state.frame,'trail');await p.close();
 assert.deepEqual(errors,[]);Object.assign(report,{paintedStates:5,directSamplePick:true,benchInspection:true,practiceDoesNotAdvanceJourney:true,dayTrail:true,errors});fs.writeFileSync(out+'/interaction-verification.json',JSON.stringify(report,null,2));console.log('PASS 0.12.2 picture arrows, three bench observations, five room/close-up states, direct sample pick and isolated early bench practice');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
