const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {base,path}=require('./finale-state.test.cjs');
const {armAudioCapture,startAudioCapture,stopAudioCapture}=require('./helpers/capture-audio.cjs');
const out='output/awards-0143/runtime',url=process.env.TEST_URL||'http://127.0.0.1:4173/';fs.mkdirSync(out,{recursive:true});
function fixture(kind){const s=base(),c=s.continuation;Object.assign(c,{productionStarted:true,workChoice:'stool',resting:false});s.settings.sound=true;
 if(kind==='production')return s;
 const id='entry-shoe-stool';c.entryRun=path(id,'assemble');c.inspected=['panel','moving','service'];c.recordsReady=c.packed=c.arrivalSeen=c.contestRegistered=true;
 if(kind==='contest')return s;
 c.contestRun=path(id,'assemble');c.serviceDemoRun=path(id,'dismantle');c.serviceReturnRun=path(id,'assemble');c.presented=c.judged=c.judgeMet=true;return s;
}
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
const btn=(p,t)=>p.locator('#campaign-panel-actions').getByRole('button',{name:t,exact:false}).click();
async function lines(p){for(let i=0;i<20&&await p.locator('#campaign-conversation').isVisible();i++)await p.locator('#campaign-next').click();}
(async()=>{const b=await chromium.launch({channel:'chrome'}),report=[];try{
 for(const kind of ['production','contest','award']){const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await armAudioCapture(p);await p.goto(url+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),fixture(kind));await p.goto(url+'?journey=1');await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available);await p.keyboard.press('Shift');await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);await startAudioCapture(p);
 if(kind==='award'){await btn(p,'听公布结果');await lines(p);await p.waitForFunction(()=>JourneyAtmosphere.snapshot().position?.recorded&&!JourneyAtmosphere.snapshot().position.loading);await btn(p,'领取证书');assert((await snap(p)).state.continuation.rewardRecorded);await p.waitForTimeout(6500);await stopAudioCapture(p,out+'/award-claim.webm');await p.reload();await p.waitForFunction(()=>window.CampaignJourney?.snapshot().state.continuation.awardStep===2);await p.keyboard.press('Shift');await startAudioCapture(p);}
 const expected={production:'home',contest:'contest',award:'award'}[kind];await p.waitForFunction(profile=>JourneyAtmosphere.snapshot().profile===profile&&(profile==='home'||!JourneyAtmosphere.snapshot().position.loading),expected);const before=await p.evaluate(()=>JourneyAtmosphere.snapshot());const meter={peak:0,rms:0};for(let i=0;i<20;i++){await p.waitForTimeout(500);const sample=await p.evaluate(()=>__journeyAudioCapture.meter());meter.peak=Math.max(meter.peak,sample.peak);meter.rms=Math.max(meter.rms,sample.rms);}assert(meter.peak<.95);assert(meter.peak>.0001,JSON.stringify({kind,before,meter,status:await p.evaluate(()=>__journeyAudioCapture.status())}));const capture=await stopAudioCapture(p,out+'/'+kind+'.webm');
 if(kind==='award'){
  for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){await p.setViewportSize({width,height});const box=await p.locator('#campaign-panel .campaign-card').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);await p.screenshot({path:out+'/reward-'+width+'.png'});}
  await btn(p,'和大家拍张合影');await p.reload();await p.waitForFunction(()=>window.CampaignJourney?.snapshot().state.continuation.awardStep===3);await btn(p,'收好合影');await lines(p);assert.equal((await snap(p)).state.continuation.stage,'ending');const proof=JSON.stringify((await snap(p)).state.continuation.contestRun);await btn(p,'回看领奖');await btn(p,'略过演出');await btn(p,'和大家拍张合影');await btn(p,'收好合影');await lines(p);assert.equal(JSON.stringify((await snap(p)).state.continuation.contestRun),proof);assert((await snap(p)).state.continuation.resultSeen);
  await btn(p,'展开获奖证书');assert((await p.locator('#campaign-panel-content').innerText()).includes('陈屿'));await p.screenshot({path:out+'/certificate.png'});
 }
 await p.evaluate(()=>JourneyAtmosphere.sound(false));await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().voices),0);assert.deepEqual(errors,[]);report.push({kind,expected,before,meter,capture,reloadAward:kind==='award',humanListening:false,errors});await p.close();console.log('PASS',kind,'actual music route, recording, mute and error-free UI');
 }
 fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
