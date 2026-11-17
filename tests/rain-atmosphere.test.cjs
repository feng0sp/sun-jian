const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {learned,caveDone}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/experience-01211';fs.mkdirSync(out,{recursive:true});
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>{localStorage.removeItem('sun-jian-v1');localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s));},s);await p.goto(base+'?journey=1');await ready(p);}
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900},recordVideo:process.env.RECORD?{dir:out+'/video',size:{width:1440,height:900}}:undefined}),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 let held;await p.route('**/room-table-night-4.webp*',r=>held=r);
 const s=learned();s.frame='village';await seed(p,s);
 assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().running),false,'silent until explicit switch');
 await p.waitForFunction(()=>CampaignJourney.snapshot().scene.weather.draws>4);
 await p.screenshot({path:out+'/rain-village.png'});
 await p.locator('#campaign-ambience').click();await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running&&JourneyAtmosphere.snapshot().voices>0);
 const initial=await p.locator('.illustrated-painting').boundingBox();
 // Delay an uncached painting: outgoing image stays opaque and new hotspots stay hidden.
 
 await p.locator('[data-exit=room]').click();
 await p.waitForFunction(()=>CampaignJourney.snapshot().scene.frame==='room');
 assert.equal(await p.locator('.illustrated-hotspots').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 assert.equal(await p.locator('.illustrated-art').evaluate(e=>getComputedStyle(e).opacity),'1');
 assert(held);await held.continue();await ready(p);await p.unroute('**/room-table-night-4.webp*');
 const room=await p.locator('.illustrated-painting').boundingBox();assert(Math.abs(initial.y-room.y)<1,'navigation does not shift painting');assert.equal(await p.locator('.illustrated-outgoing').evaluate(e=>e.childElementCount),0);
 assert(await p.evaluate(()=>JourneyAtmosphere.snapshot().interior));await p.screenshot({path:out+'/rain-window.png'});
 // Scan all active painted hit regions, including held H and actual press state.
 for(const frame of ['village','shelter','room','store-shallow','store-middle','store-sky']){
  const state=frame.startsWith('store')?caveDone():learned();state.frame=frame;await seed(p,state);await p.keyboard.down('h');
  if(frame==='shelter')await p.locator('[data-bench-toggle]').click();
  for(const el of await p.locator('.illustrated-hotspot,.illustrated-route,.bench-part').all()){
   if(!await el.isVisible()||!await el.isEnabled())continue;await el.hover({force:true});await el.focus();await p.mouse.down();assert.equal(await el.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');await p.mouse.move(1,1);await p.mouse.up();
  }
  await p.keyboard.up('h');await p.screenshot({path:out+'/'+frame+'-hotspots.png'});
 }
 // No rainfall by day; no animation when motion has been reduced.
 assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().scene.weather.running),false);
 const quiet=learned();quiet.frame='village';quiet.settings.reducedMotion=true;await seed(p,quiet);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().scene.weather.running),false);
 await p.locator('[data-exit=room]').click();await ready(p);assert.equal(await p.locator('.illustrated-outgoing').evaluate(e=>e.childElementCount),0);
 quiet.settings.reducedMotion=false;await seed(p,quiet);await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!CampaignJourney.snapshot().scene.weather.running);await p.emulateMedia({reducedMotion:'no-preference'});
 await p.locator('#campaign-ambience').click();await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);
 await p.evaluate(()=>{window.testHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>testHidden});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForFunction(()=>!JourneyAtmosphere.snapshot().running);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().scene.weather.running),false);
 await p.evaluate(()=>{testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);
 await p.locator('#campaign-pause').click();await p.waitForFunction(()=>!JourneyAtmosphere.snapshot().running);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().scene.weather.running),false);
 await p.locator('#campaign-settings').click();await p.locator('#campaign-volume').fill('0.2');await p.locator('#campaign-volume').dispatchEvent('input');await p.locator('#campaign-panel-actions').getByRole('button',{name:'返回',exact:true}).click();await p.locator('#campaign-continue').click();await ready(p);await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().volume),.2);
 await p.locator('#campaign-ambience').click();await p.waitForFunction(()=>!JourneyAtmosphere.snapshot().running);assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().scheduled),false);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({silentDefault:true,originalScore:true,maskedRain:true,transparentHotspots:true,stableFraming:true,atomicImageTransition:true,reducedMotion:true,backgroundPause:true,volume:true,mute:true,errors},null,2));console.log('PASS masked rain, transparent hotspots, atomic transitions, stable framing, reduced motion and audio lifecycle');
}catch(e){await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await p.close();await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
