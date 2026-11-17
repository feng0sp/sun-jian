const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../dist/cave-data.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const out='output/character-0101';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){
   const page=await b.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'?cave=1');await page.waitForFunction(()=>CaveJourney.snapshot().scene.available);
   await page.locator('#cave-intro .cave-portrait').evaluate(img=>img.decode());
   await page.screenshot({path:`${out}/intro-${width}.png`});
   await page.locator('#cave-begin').click();await page.locator('#cave-notebook').click();
   await page.locator('#cave-notes .cave-portrait').evaluate(img=>img.decode());
   const before=await page.evaluate(()=>CaveJourney.snapshot().state.position);
   await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');
   assert.deepEqual(await page.evaluate(()=>CaveJourney.snapshot().state.position),before,'notebook freezes walking');
   assert.match(await page.locator('#cave-traveler-note').innerText(),/空白/);
   const rect=await page.locator('#cave-notes-close').boundingBox();assert(rect.y>=0&&rect.y+rect.height<=height,'close remains on screen');
   const heading=await page.locator('.cave-notes-heading').boundingBox();assert(heading.y>=0&&heading.x>=0);
   await page.screenshot({path:`${out}/notes-${width}.png`});
   await page.keyboard.press('Escape');assert(!await page.locator('#cave-notes').isVisible());
   const s=D.fresh();s.completed=D.nodes.map(n=>n.id);s.seenIntro=true;s.position=[0,1.65,-72];
   await page.addInitScript(s=>localStorage.setItem('sun-jian-cave-v1',JSON.stringify(s)),s);await page.reload();
   await page.waitForSelector('#cave-end:not([hidden])');await page.locator('#cave-end .cave-portrait').evaluate(img=>img.decode());
   await page.screenshot({path:`${out}/ending-${width}.png`});
   await page.locator('#cave-stay').click();await page.locator('#cave-notebook').click();assert.match(await page.locator('#cave-traveler-note').innerText(),/八处/);
   assert.deepEqual(errors,[]);await page.close();
  }
  // Each pose can fail independently and retry its own asset, without changing progress.
  for(const [file,dialog,open] of [['traveler.png','cave-intro',null],['traveler-notes.png','cave-notes','cave-notebook'],['traveler-end.png','cave-end','end']]){
   const page=await b.newPage();let fail=true;const requested=[];
   await page.route('**/assets/cave/'+file+'*',route=>{requested.push(route.request().url());return fail?route.abort():route.continue();});
   if(open==='end'){const s=D.fresh();s.completed=D.nodes.map(n=>n.id);s.seenIntro=true;s.position=[0,1.65,-72];await page.addInitScript(s=>localStorage.setItem('sun-jian-cave-v1',JSON.stringify(s)),s);}
   await page.goto(base+'?cave=1');
   if(open&&open!=='end'){await page.locator('#cave-begin').click();await page.locator('#'+open).click();}
   const retry=page.locator('#'+dialog+' .cave-art-retry');await retry.waitFor();
   const saved=await page.evaluate(()=>localStorage.getItem('sun-jian-cave-v1'));
   fail=false;await retry.click();await page.waitForFunction(id=>{const img=document.querySelector('#'+id+' .cave-portrait');return !img.hidden&&img.complete&&img.naturalWidth>0;},dialog);
   assert(requested.some(url=>url.includes(file+'?retry=')));assert.equal(await retry.count(),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('sun-jian-cave-v1')),saved);await page.close();
  }
  console.log('PASS: three character poses, three desktop sizes, progress-specific notes, frozen walking, Escape, individual image retries preserve saves.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
