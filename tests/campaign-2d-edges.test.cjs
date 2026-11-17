/* Integration edges for the illustrated campaign. Test-only image routing supplies
 * the real existing room painting while the new asset batch is being generated.
 * It is never written into production resources. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,solved,learned}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/campaign-012';
const room=fs.readFileSync('dist/assets/story-modern/room-lodging.webp');fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
const allErrors=[];
async function pageFor(browser,size={width:1440,height:900},options={}){
 const p=await browser.newPage({viewport:size});p.on('pageerror',e=>allErrors.push(e.message));
 await p.route('**/assets/campaign-2d/*.webp*',async route=>{const url=route.request().url();if(options.failImage&&url.includes(options.failImage)&&!url.includes('retry=')){await route.abort();return;}await route.fulfill({status:200,contentType:'image/webp',body:room});});
 if(options.noWebGL)await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args);};});
 await p.addInitScript(()=>{window.__storageWrites=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('sun-jian-campaign'))window.__storageWrites.push({key:k,value:v});return set.call(this,k,v);};});
 return p;
}
async function seed(p,state,extra={}){await p.goto(base+'?practice=1',{waitUntil:'domcontentloaded'});const raw=JSON.stringify(state);await p.evaluate(({raw,extra})=>{localStorage.setItem('sun-jian-campaign-v1',raw);for(const [k,v]of Object.entries(extra))localStorage.setItem(k,v);},{raw,extra});await p.goto(base+'?journey=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>CampaignJourney.snapshot().scene.available);return raw;}
async function artReady(p){await p.waitForFunction(()=>{const s=CampaignJourney.snapshot().scene;return s.available&&!s.loading&&!s.imageError;});await p.locator('.illustrated-art').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})));});}
async function finishLines(p){for(let i=0;i<12;i++){const s=await snap(p);if(s.modal!=='campaign-conversation'||await p.locator('#campaign-choices button').count())return;await p.locator('#campaign-next').click();}}
function settled(){const s=D.fresh();s.phase='settle';s.frame='room';s.openingSeen=true;return s;}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const report={testOnlyImageRoute:true};try{
 // A legacy save is backed up verbatim before any v2 write; unrelated modes remain untouched.
 let p=await pageFor(browser),s=learned();s.version=1;s.storyRevision=2;s.talk={id:'night',line:1};s.village.position=[0,1.65,-4];delete s.frame;
 const unrelated={'sun-jian-story-v1':'legacy-story-sentinel','sun-jian-cave-v1':'legacy-cave-sentinel','sun-jian-progress-v3':'practice-sentinel'};
 const legacy=await seed(p,s,unrelated);await artReady(p);let r=await snap(p);assert.equal(r.state.version,2);assert.equal(r.state.frame,'room');assert.equal(r.state.done.length,4);assert.equal(r.state.talk.line,0);
 const saved=await p.evaluate(()=>({backup:localStorage.getItem('sun-jian-campaign-v1-backup-before-2d'),current:JSON.parse(localStorage.getItem('sun-jian-campaign-v1')),writes:window.__storageWrites,other:Object.fromEntries(['sun-jian-story-v1','sun-jian-cave-v1','sun-jian-progress-v3'].map(k=>[k,localStorage.getItem(k)]))}));assert.equal(saved.backup,legacy);assert.equal(saved.current.version,2);assert(saved.writes.findIndex(x=>x.key.endsWith('backup-before-2d'))<saved.writes.findIndex(x=>x.key==='sun-jian-campaign-v1'));assert.deepEqual(saved.other,unrelated);
 await finishLines(p);await p.reload({waitUntil:'domcontentloaded'});await artReady(p);assert.equal(await p.evaluate(()=>localStorage.getItem('sun-jian-campaign-v1-backup-before-2d')),legacy);report.legacy={backupBeforeWrite:true,verbatimBackup:true,unrelatedSavesPreserved:true};await p.close();
 // Failed art can be retried without replacing the player's scene/progress.
 p=await pageFor(browser,undefined,{failImage:'mountain-rain.webp'});await seed(p,D.fresh());await p.waitForFunction(()=>CampaignJourney.snapshot().scene.imageError);await finishLines(p);const before=await snap(p);await p.locator('.illustrated-image-error [data-retry]').click();await artReady(p);r=await snap(p);assert.equal(r.state.frame,before.state.frame);assert.equal(r.state.phase,before.state.phase);assert.deepEqual(r.state.done,before.state.done);assert.equal(await p.locator('.illustrated-art').evaluate(e=>e.complete&&e.naturalWidth>0),true);report.imageRetry=true;await p.close();
 // H is momentary, is cleared on blur and opening a modal, and never exposes active background inputs.
 p=await pageFor(browser);await seed(p,settled());await artReady(p);await p.keyboard.down('h');assert(await p.locator('.illustrated-stage').evaluate(e=>e.classList.contains('show-hotspots')));await p.keyboard.up('h');assert(!await p.locator('.illustrated-stage').evaluate(e=>e.classList.contains('show-hotspots')));
 await p.keyboard.down('h');await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert(!await p.locator('.illustrated-stage').evaluate(e=>e.classList.contains('show-hotspots')));await p.keyboard.up('h');
 await p.keyboard.down('h');await p.locator('[data-hotspot="zhou"]').click();await p.keyboard.up('h');assert.equal((await snap(p)).modal,'campaign-conversation');assert(!await p.locator('.illustrated-stage').evaluate(e=>e.classList.contains('show-hotspots')));assert(await p.locator('.illustrated-hotspots').evaluate(e=>e.inert));assert(await p.locator('.illustrated-exits').evaluate(e=>e.inert));
 const paused=await snap(p);const behind=p.locator('[data-hotspot="frame:workbench"]');const rect=await behind.boundingBox();await p.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);assert.equal((await snap(p)).state.frame,paused.state.frame);assert.deepEqual((await snap(p)).state.talk,paused.state.talk);
 await behind.dispatchEvent('click');assert.equal((await snap(p)).state.frame,paused.state.frame);report.hotkeys={release:true,blur:true,modalClear:true};report.modalBackgroundBlocked=true;await p.close();
 // Contained artwork and normalized hotspot centers stay registered at every desktop target size.
 const layouts=[];
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
  p=await pageFor(browser,{width,height});await seed(p,settled());await artReady(p);
  const layout=await p.evaluate(()=>{const a=document.querySelector('.illustrated-painting').getBoundingClientRect(),image=document.querySelector('.illustrated-art').getBoundingClientRect();return{painting:{x:a.x,y:a.y,width:a.width,height:a.height,right:a.right,bottom:a.bottom},image:{x:image.x,y:image.y,width:image.width,height:image.height},overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelectorAll('#campaign-world canvas:not(.journey-rain)').length,hotspots:[...document.querySelectorAll('.illustrated-hotspot')].map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.hotspot,x:(r.x+r.width/2-a.x)/a.width,y:(r.y+r.height/2-a.y)/a.height,w:r.width,h:r.height,expectedX:parseFloat(b.style.left)/100,expectedY:parseFloat(b.style.top)/100};})};});
  assert.equal(layout.canvas,0);assert(!layout.overflow);assert(layout.painting.x>=-.1&&layout.painting.y>=0&&layout.painting.right<=width+.1&&layout.painting.bottom<=height);assert(Math.abs(layout.painting.width/layout.painting.height-16/9)<.002);assert(Math.abs(layout.image.x-layout.painting.x)<.1&&Math.abs(layout.image.y-layout.painting.y)<.1&&Math.abs(layout.image.width-layout.painting.width)<.1&&Math.abs(layout.image.height-layout.painting.height)<.1,JSON.stringify(layout));
  for(const h of layout.hotspots){assert(Math.abs(h.x-h.expectedX)<.001,h.id+' x registration');assert(Math.abs(h.y-h.expectedY)<.001,h.id+' y registration');assert(h.w>=35&&h.h>=35);}
  let focused=false;for(let i=0;i<25&&!focused;i++){await p.keyboard.press('Tab');focused=await p.evaluate(()=>!!document.activeElement?.dataset.hotspot);}assert(focused,'scene hotspots remain keyboard focusable');
  await p.screenshot({path:out+'/edges-layout-'+width+'.png'});layouts.push({width,height,...layout});await p.close();
 }
 report.layouts=layouts;
 // A late B response cannot paint over A after a controller-driven return to an
 // already displayed A. Test the public scene factory in isolation from journey UI.
 p=await pageFor(browser);let releaseB,sawB;const waitingB=new Promise(resolve=>sawB=resolve);
 await p.route('**/assets/campaign-2d/shelter-wide-night.webp*',async route=>{if(route.request().url().includes('retry=')){await route.fulfill({status:200,contentType:'image/webp',body:room});return;}sawB();await new Promise(resolve=>releaseB=resolve);await route.fulfill({status:200,contentType:'image/webp',body:room});});
 await p.goto(base+'?practice=1',{waitUntil:'domcontentloaded'});
 await p.evaluate(()=>{const host=document.createElement('div');host.id='edge-scene-host';host.style.cssText='position:fixed;inset:0;z-index:9999;background:#123';document.body.append(host);window.__edgeState=CampaignData.fresh();Object.assign(__edgeState,{phase:'settle',frame:'village'});__edgeState.settings.reducedMotion=true;window.__edgeScene=CampaignIllustrated.create(host,__edgeState,{change(){},notice(){},interact(){}});__edgeScene.enable(true);});
 await p.waitForFunction(()=>__edgeScene.snapshot().image.endsWith('village-night-unpacked.webp')&&!__edgeScene.snapshot().loading);await waitingB;
 await p.evaluate(()=>__edgeScene.go('shelter'));assert(await p.locator('#edge-scene-host .illustrated-exits').evaluate(e=>e.inert));
 const returnButton=p.locator('#edge-scene-host [data-exit="village"]'),returnRect=await returnButton.boundingBox();await p.mouse.click(returnRect.x+returnRect.width/2,returnRect.y+returnRect.height/2);assert.equal(await p.evaluate(()=>__edgeScene.snapshot().frame),'shelter','pending scene navigation is inert');
 await p.waitForFunction(()=>__edgeScene.snapshot().imageError);await p.locator('#edge-scene-host [data-retry]').click();await p.waitForFunction(()=>!__edgeScene.snapshot().loading&&!__edgeScene.snapshot().imageError);await p.evaluate(()=>__edgeScene.go('village'));releaseB();await p.waitForTimeout(120);
 const raced=await p.evaluate(()=>({snapshot:__edgeScene.snapshot(),src:document.querySelector('#edge-scene-host .illustrated-art').getAttribute('src')}));assert.equal(raced.snapshot.frame,'village');assert(raced.snapshot.image.endsWith('village-night-unpacked.webp'));assert(raced.src.endsWith('village-night-unpacked.webp'));assert(!raced.snapshot.loading);report.asyncReturn={loadingNavInert:true,lateResponseIgnored:true};await p.close();
 // The 2D world/dialogue works without WebGL and the shared puzzle keeps precise operation available.
 p=await pageFor(browser,undefined,{noWebGL:true});s=D.fresh();s.phase='learning';s.frame='workbench';s.openingSeen=true;await seed(p,s);await artReady(p);assert.equal(await p.locator('#campaign-error').isVisible(),false);assert.equal(await p.evaluate(()=>JointGame.rendererAvailable()),false);
 await p.locator('[data-hotspot="straight"]').click();await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle');assert(await p.locator('#precise-controls').evaluate(e=>e.open));assert(await p.locator('#renderer-error').isVisible());
 const move=solved('straight','dismantle').history[0];await p.locator('[data-piece="'+move.piece+'"]').click();await p.locator('[data-direction="'+move.direction+'"]').click();await p.waitForFunction(()=>!SunJian.snapshot().busy&&SunJian.snapshot().history.length===1);await p.locator('#campaign-completion').waitFor({state:'visible'});await p.locator('[data-completion-return]').click();await p.waitForFunction(()=>CampaignJourney.snapshot().state.done.includes('learn-straight-out'));assert.equal((await snap(p)).state.pendingReflection,null);assert.equal((await snap(p)).view,'world');report.noWebGL={illustratedWorld:true,readableDialogue:true,directionOperation:true,progressCommitted:true};await p.close();
 assert.deepEqual(allErrors,[]);report.errors=allErrors;fs.writeFileSync(out+'/edges-verification.json',JSON.stringify(report,null,2));console.log('PASS: legacy backup and migration, image retry, momentary H/blur/modal guards, registered hotspots at three desktop sizes, and no-WebGL dialogue plus precise puzzle operation.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});


