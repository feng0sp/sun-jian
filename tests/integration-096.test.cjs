const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {finishedStory}=require('./story-fixtures.cjs'),{snap,choose}=require('./story-flow.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173',dir='output/integration-096';fs.mkdirSync(dir,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome'}),errors=[];try{
 async function page(state,size={width:1440,height:900}){const p=await browser.newPage({viewport:size,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(s=>{if(!sessionStorage.getItem('integration-fixture')){localStorage.setItem('sun-jian-story-v1',JSON.stringify(s));sessionStorage.setItem('integration-fixture','1');}},state);await p.goto(base);await p.waitForFunction(()=>Journey.snapshot().scene.images.room==='true'&&Journey.snapshot().scene.integration?.contactPatches>0);return p;}
 const p=await page({...finishedStory(),endingSeen:true}),history=JSON.stringify((await snap(p)).state.runs);
 // The calibrated surface reprojects to the illustration, including raised tray and lowered box.
 const calibration=await p.evaluate(()=>{const T=THREE,c=new T.PerspectiveCamera(36,1672/941,.1,100),s=new T.Scene(),r=RoomIntegration(T,{},c,s,{}),points=[[.405,.59,0],[.333,.411,.2],[.895,.817,-1.5]],result=points.map(([u,v,h])=>{const world=r.groundAt(u,v,h),q=world.clone().project(c);return {height:world.y,expected:h,error:Math.hypot((q.x+1)/2-u,(1-q.y)/2-v)};});const covered=r.occluded(.9,.90),opening=r.occluded(.895,.808);r.dispose();return {result,covered,opening};});
 for(const r of calibration.result){assert(Math.abs(r.height-r.expected)<1e-6);assert(r.error<1e-6);}assert(calibration.covered);assert(!calibration.opening);
 for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
  await p.setViewportSize({width,height});await p.mouse.move(5,5);await p.waitForTimeout(120);await p.screenshot({path:dir+'/room-'+width+'.png'});
  for(const id of ['straight','lap','pinned','dovetail','shoulder-lap','burr-three']){
   await p.locator('[data-hotspot="'+id+'"]').click();const card=p.locator('#story-dialogue'),bounds=await card.boundingBox();assert(bounds.y>=138&&bounds.y+bounds.height<=height);assert(bounds.width<=330);assert((await card.innerText()).length<140);
   const actions=await p.locator('#story-choices button').evaluateAll(bs=>bs.map(b=>b.dataset.choice));assert.deepEqual(actions.slice(0,2),['sample-dismantle','sample-assemble']);
   const state=await snap(p);await choose(p,'sample-question');assert(await p.locator('#story-sample-answer').isVisible());assert.equal((await snap(p)).state.talk.node,'sample-'+id);assert.equal((await snap(p)).state.beat,state.state.beat);assert.equal(JSON.stringify((await snap(p)).state.runs),history);assert.equal(await p.locator('[data-choice=sample-question]').evaluate(e=>document.activeElement===e),true);
   if(id==='shoulder-lap')await p.screenshot({path:dir+'/card-'+width+'.png'});
   await p.waitForTimeout(240);await p.keyboard.press('Enter');assert(await p.locator('#story-sample-answer').isHidden());await p.keyboard.press('Escape');assert.equal((await snap(p)).state.talk,null);
  }
 }
 // Real raycasts on stored objects, with hotspot buttons disabled as hit targets.
 await p.addStyleTag({content:'.workshop-hotspot.wood-sample{pointer-events:none!important}'});
 for(const [part,id]of [['pinned','pinned'],['lap','lap']]){const f=await p.locator('.workshop-frame').boundingBox(),point=(await snap(p)).scene.storedTargets[part];await p.mouse.click(f.x+f.width*point.x,f.y+f.height*point.y);assert.equal((await snap(p)).state.talk.node,'sample-'+id);await p.keyboard.press('Escape');}
 const f=await p.locator('.workshop-frame').boundingBox();await p.mouse.click(f.x+f.width*.9,f.y+f.height*.9);assert.equal((await snap(p)).state.talk,null,'front wall must occlude hit testing too');
 await p.close();
 // Old saves stopped deep in a shortened line sequence safely clamp without dropping progress.
 for(const [node,line,beat]of [['after-8',4,8],['heritage',3,9],['wood',3,9]]){const q=await page({...finishedStory(),beat,endingSeen:true,talk:{node,line,returnTo:'zhou'}});const t=(await snap(q)).state;assert.equal(t.completed.length,4);assert.equal(t.talk.node,node);assert(t.talk.line<(await q.evaluate(n=>JourneyStory.talk.nodes[n].lines.length,node)));await q.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/verification.json',JSON.stringify({url:base,at:new Date().toISOString(),checks:['calibrated surface planes','single render with foreground occlusion','six compact cards at three desktop sizes','inline optional explanation and keyboard focus','no progress side effects','stored-piece raycasts','front-wall hit occlusion','old dialogue cursor migration'],errors},null,2));console.log('PASS: calibrated scene, occlusion, six compact cards, inline questions, real stored-piece picking and old saves.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
