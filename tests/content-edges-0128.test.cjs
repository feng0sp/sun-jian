const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,learned}=require('./helpers/campaign-fixtures.cjs'),S=require('../dist/campaign-story.js'),F=require('../dist/campaign-field-notes.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/content-0128';fs.mkdirSync(out,{recursive:true});
const later=learned();later.phase='bench';later.fieldNotes=['chair-patina'];assert(S.resolve('benchMemory',later).lines.some(([,line])=>line.includes('屋里那把椅子')));later.spoken=['benchMemory'];assert.equal(S.resolve('benchMemory',later).lines.length,1);
assert(!S.resolve('chairAge',{...learned(),spoken:['chairAge']}).lines.some(([,t])=>t.includes('扶手')));
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);}
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
  await p.setViewportSize({width,height});
  for(const frame of ['chair-detail','tools-detail']){
   const s=learned();s.frame=frame;await seed(p,s);
   for(const entry of F.at(frame)){
    const hot=p.locator('[data-hotspot="observe:'+entry.id+'"]');await hot.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.field-note h3').innerText(),entry.name);
    const box=await p.locator('.field-note').boundingBox(),point=await hot.boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);const x=point.x+point.width/2,y=point.y+point.height/2;assert(!(x>box.x&&x<box.x+box.width&&y>box.y&&y<box.y+box.height),'observation card leaves its object visible');
    await p.screenshot({path:out+'/'+frame+'-'+width+'.png'});await p.keyboard.press('Escape');assert.equal(await hot.getAttribute('aria-expanded'),'false');assert(await hot.evaluate(e=>e===document.activeElement));
   }
   assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.fieldNotes.length),3);await p.locator('[data-hotspot="observe:'+F.at(frame)[0].id+'"]').click();assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.fieldNotes.length),3);
   await p.locator('#campaign-pause').click();assert(await p.locator('.field-note').isHidden());await p.locator('#campaign-continue').click();assert(await p.locator('.field-note').isVisible());
  }
 }
 // A newcomer can decline the invitation and still look around; no task is silently accepted.
 const s=D.fresh();s.phase='settle';s.frame='chair-detail';s.openingSeen=true;await seed(p,s);await p.locator('[data-hotspot="observe:chair-shoulder"]').click();await p.locator('[data-field-study]').click();while(await p.locator('#campaign-next').isVisible())await p.locator('#campaign-next').click();await p.getByRole('button',{name:'我等会儿再试。',exact:true}).click();assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.phase),'settle');assert(await p.locator('.field-note').isVisible());await p.locator('[data-field-study]').click();while(await p.locator('#campaign-next').isVisible())await p.locator('#campaign-next').click();await p.getByRole('button',{name:'那我动手了。',exact:true}).click();assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.phase),'learning');
 // The newly added painting has the same recoverable loading behavior as all existing scenes.
 await p.route('**/tools-detail.webp*',r=>r.request().url().includes('retry=')?r.continue():r.abort());const l=learned();l.frame='tools-detail';await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),l);await p.goto(base+'?journey=1');await p.waitForFunction(()=>CampaignJourney.snapshot().scene.imageError);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.done.length),4);await p.locator('[data-retry]').click();await ready(p);assert(await p.locator('[data-hotspot="observe:tool-plane"]').isEnabled());await p.unroute('**/tools-detail.webp*');
 // Reading and notes still work without WebGL; sample practice retains precise-direction fallback.
 await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return /webgl/i.test(t)?null:get.call(this,t,...args);};});await seed(p,l);await p.locator('[data-hotspot="observe:tool-offcut"]').click();await p.locator('[data-field-study]').click();assert.equal(await p.evaluate(()=>JointGame.rendererAvailable()),false);await p.locator('[data-piece=pin]').click();await p.locator('[data-direction=zp]').click();await p.waitForFunction(()=>SunJian.snapshot().history.length===1&&!SunJian.snapshot().busy);await p.locator('#campaign-put').click();assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.done.length),4);
 assert.deepEqual(errors,[]);console.log('PASS field-card layouts, keyboard and focus, non-gating invitation, learned callback, retry and no-WebGL reading/practice');
}catch(e){await p.screenshot({path:out+'/content-edges-failure.png'}).catch(()=>{});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
