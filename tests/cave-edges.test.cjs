const {chromium}=require('playwright'),assert=require('node:assert/strict');
const P=require('../dist/puzzle-core.js'),E=require('../dist/experience.js'),D=require('../dist/cave-data.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const run=(level,mode,history=[])=>({version:1,level,mode,history});
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const size of [{width:1280,height:720},{width:1440,height:900},{width:1920,height:1080}]){
   const p=await b.newPage({viewport:size}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   const s=D.fresh();s.seenIntro=true;s.position=[0,1.65,-4.2];
   const practice=run('dovetail','dismantle',[{kind:'extract',piece:'key',direction:'yp'}]),story={revision:3,beat:1,active:false};
   await p.addInitScript(({s,practice,story})=>{
    if(!localStorage.getItem('edge-initialized')){
     localStorage.setItem('sun-jian-cave-v1',JSON.stringify(s));localStorage.setItem('sun-jian-session-v1',JSON.stringify(practice));
     localStorage.setItem('sun-jian-v1',JSON.stringify({cleared:['pinned'],tutorialStatus:'skipped'}));
     localStorage.setItem('sun-jian-story-v1',JSON.stringify(story));localStorage.setItem('edge-initialized','yes');
    }
   },{s,practice,story});
   await p.goto(base+'?cave=1');await p.waitForFunction(()=>CaveJourney?.snapshot().scene.available);
   await p.keyboard.press('e');await p.waitForFunction(()=>CaveJourney.snapshot().view==='puzzle');
   assert.equal((await p.evaluate(()=>SunJian.snapshot())).mode,'dismantle');
   const rect=await p.locator('#viewport').boundingBox();assert(rect.width>500&&rect.height>240);
   for(const id of ['cave-put','cave-reset','cave-undo','quick-hint']){
    const r=await p.locator('#'+id).boundingBox();assert(r.y>=0&&r.y+r.height<=size.height,id+' is visible');
   }
   assert(!await p.locator('#hint').innerText().then(t=>t.includes('周伯')));
   await p.locator('[data-piece=pin]').click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction=zp]').click();await p.waitForFunction(()=>!SunJian.snapshot().busy);
   const h=(await p.evaluate(()=>JointGame.getRun())).history;
   // Beginning a drag, losing focus and resizing cannot commit or strand a busy state.
   const xy=await p.evaluate(()=>SunJian.screen().pieces.tenon?.start);
   if(xy){await p.mouse.move(xy.x,xy.y);await p.mouse.down();await p.mouse.move(xy.x+15,xy.y-10);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.mouse.up();}
   assert.deepEqual((await p.evaluate(()=>JointGame.getRun())).history,h);
   await p.setViewportSize({...size,height:size.height-1});await p.setViewportSize(size);
   assert.equal((await p.evaluate(()=>SunJian.snapshot())).busy,false);
   await p.screenshot({path:`output/cave-010/desktop-${size.width}.png`});
   await p.keyboard.press('Escape');await p.waitForFunction(()=>CaveJourney.snapshot().view==='world');
   const pos=await p.evaluate(()=>CaveJourney.snapshot().state.position);assert(Math.abs(pos[2]+4.2)<.1);
   await p.locator('#cave-notebook').click();await p.keyboard.press('Tab');assert.equal(await p.locator('#cave-notes-close').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Escape');
   await p.locator('#cave-leave').click();
   const free=await p.evaluate(()=>SunJian.snapshot());assert.equal(free.level,'dovetail');assert.deepEqual(free.history,practice.history);assert(free.cleared.includes('pinned'));
   assert.deepEqual(JSON.parse(await p.evaluate(()=>localStorage.getItem('sun-jian-story-v1'))),story);
   assert.deepEqual(errors,[]);await p.close();
  }
  // No WebGL is a recoverable entry screen; existing direction-button fallback remains available.
  const fallback=await b.newPage();
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...a){return type.includes('webgl')?null:original.call(this,type,...a);};});
  await fallback.goto(base+'?cave=1');await fallback.waitForSelector('#cave-error:not([hidden])');await fallback.locator('#cave-error-back').click();assert.equal(await fallback.locator('#renderer-error').isVisible(),true);await fallback.close();
  const broken=await b.newPage();await broken.route('**/assets/cave/traveler.png*',r=>r.abort());await broken.goto(base+'?cave=1');
  await broken.getByRole('button',{name:'重试人物图',exact:true}).first().waitFor();await broken.locator('#cave-begin').click();assert((await broken.evaluate(()=>CaveJourney.snapshot())).active);await broken.close();
  // Same packaged code runs without any server or external resource.
  if(!process.env.TEST_URL){
   const offline=await b.newPage();await offline.goto(require('node:url').pathToFileURL(require('node:path').resolve('dist/index.html')).href+'?cave=1');
   await offline.waitForFunction(()=>CaveJourney?.snapshot().scene.available);await offline.locator('#cave-begin').click();await offline.screenshot({path:'output/cave-010/offline.png'});await offline.close();
  }
  // Every saved accepted history is restored by the existing legality checker.
  const invalid=D.fresh();invalid.runs['mouth-latch:dismantle']=run('pinned','dismantle',[{kind:'extract',piece:'tenon',direction:'yp'}]);
  assert.equal(Object.keys(D.restore(JSON.stringify(invalid),P,E).runs).length,0);
  console.log('PASS: three desktop sizes, blur/resize/Escape rollback, unchanged story/practice saves, keyboard focus, image failure, WebGL fallback, offline assets, illegal-history rejection.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
