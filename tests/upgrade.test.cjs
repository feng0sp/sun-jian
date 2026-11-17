const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const P=require('../dist/puzzle-core.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const routes={
 'burr-three':[['bar-2','xp'],['bar-1','yn'],['bar-3','xp']],
 'burr-six':[['bar-6','zp'],['bar-4','xp'],['bar-2','yp'],['bar-3','xp'],['bar-1','yn'],['bar-5','xp']]
};
const opposite={xp:'xn',xn:'xp',yp:'yn',yn:'yp',zp:'zn',zn:'zp'};
(async()=>{
 fs.mkdirSync('artifacts/upgrade',{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:980}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base);await page.waitForFunction(()=>window.SunJian?.snapshot().renderer);
  const snap=()=>page.evaluate(()=>SunJian.snapshot());
  const settle=()=>page.waitForFunction(()=>!SunJian.snapshot().busy);
  const move=async(id,d)=>{await page.locator('#precise-controls').evaluate(el=>el.open=true);await page.locator(`[data-piece="${id}"]`).click();await page.locator(`[data-direction="${d}"]`).click();await settle();};
  // Upgrade an actual v0.3 local save: six solved pages, sound and experiment progress.
  const oldIds=P.LEVELS.slice(0,6).map(l=>l.id);
  await page.evaluate(ids=>localStorage.setItem('sun-jian-v1',JSON.stringify({cleared:ids,assembled:ids,sound:false,experimentCleared:true})),oldIds);
  await page.reload();await page.waitForFunction(()=>window.SunJian);
  assert.deepEqual((await snap()).cleared,oldIds.slice(2));assert.deepEqual((await snap()).tutorialCleared,oldIds.slice(0,2));assert.match(await page.locator('#chapter-count').innerText(),/04 \/ 08/);
  await page.locator('#open-atlas').click();assert.equal(await page.locator('.atlas-card').count(),10);
  assert(await page.locator('.atlas-card img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
  await page.locator('[data-close="atlas-dialog"]').click();
  for(const [id,route]of Object.entries(routes)){
   const index=P.LEVELS.findIndex(l=>l.id===id);await page.locator(`[data-level="${index}"]`).click();
   assert.equal((await snap()).level,id);assert.equal(await page.locator('[data-piece]').count(),route.length);
   await page.screenshot({path:`artifacts/upgrade/after-${id}.png`});
   await page.locator('#xray').click();assert((await snap()).xray);await page.screenshot({path:`artifacts/upgrade/xray-${id}.png`});await page.locator('#xray').click();
   const rect=await page.locator('#viewport canvas').boundingBox();await page.mouse.move(rect.x+rect.width*.3,rect.y+rect.height*.5);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.62,rect.y+rect.height*.5,{steps:12});await page.mouse.up();await page.waitForTimeout(200);await page.screenshot({path:`artifacts/upgrade/rotated-${id}.png`});await page.locator('#reset-camera').click();
   await move('bar-1','xp');assert.deepEqual((await snap()).removed,[]);assert.match(await page.locator('#feedback-text').innerText(),/碰到/);
   if(id==='burr-six'){await page.keyboard.press('6');assert.equal((await snap()).selected,'bar-6');}
   await page.locator('#hint').click();await page.locator('#hint').click();await page.locator('#hint').click();assert.equal((await snap()).selected,id==='burr-six'?'bar-6':'bar-1');assert((await snap()).demo);await page.locator('#close-hint').click();
   await move(...route[0]);assert.deepEqual((await snap()).removed,[route[0][0]]);
   await page.screenshot({path:`artifacts/upgrade/opened-${id}.png`});
   await page.locator('#undo').click();assert.deepEqual((await snap()).removed,[]);
   for(const step of route)await move(...step);
   assert(await page.locator('#complete-dialog').isVisible());assert((await snap()).cleared.includes(id));
   await page.locator('[data-close="complete-dialog"]').click();await page.locator('#mode-assemble').click();
   assert.equal((await snap()).removed.length,route.length);
   for(const [piece,d] of [...route].reverse())await move(piece,opposite[d]);
   assert(await page.locator('#complete-dialog').isVisible());assert((await snap()).assembled.includes(id));
   await page.locator('[data-close="complete-dialog"]').click();await page.locator('#mode-dismantle').click();
  }
  assert.equal((await snap()).cleared.length,6);assert.equal((await snap()).assembled.length,6);
  await page.reload();await page.waitForFunction(()=>window.SunJian);assert.equal((await snap()).cleared.length,6);assert.equal((await snap()).assembled.length,6);
  // Inspect the redesigned main structures in multiple states.
  for(const [i,id]of [[3,'dovetail'],[4,'double-pin'],[5,'wooden-box']]){
   await page.locator(`[data-level="${i}"]`).click();await page.screenshot({path:`artifacts/upgrade/after-${id}.png`});
   await page.locator('#xray').click();await page.screenshot({path:`artifacts/upgrade/xray-${id}.png`});await page.locator('#xray').click();
   const l=P.LEVELS[i],m=P.availableMoves(l)[0];await move(m.piece,m.direction);await page.screenshot({path:`artifacts/upgrade/opened-${id}.png`});
  }
  for(const width of [320,390,768,1024]){
   const phone=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',isMobile:width<600,hasTouch:width<600});const p=await phone.newPage();
   p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.waitForFunction(()=>window.SunJian?.snapshot().renderer);await p.locator('#skip-tutorial').click();await p.locator('[data-level="7"]').click();await p.locator('#precise-controls').evaluate(el=>el.open=true);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
   assert(await p.locator('[data-piece]').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=43;})));
   assert(await p.locator('.piece-symbol').evaluateAll(bs=>bs.every(b=>getComputedStyle(b).display!=='none')),'six readable piece markers');
   if(width<=768)assert((await p.locator('#chapters').boundingBox()).height<85,'compact scrollable chapter strip');
   await p.screenshot({path:`artifacts/upgrade/burr-six-${width}.png`,fullPage:true});
   for(const [piece,d]of routes['burr-six']){await p.locator(`[data-piece="${piece}"]`).click();await p.locator(`[data-direction="${d}"]`).click();}
   assert(await p.locator('#complete-dialog').isVisible());await phone.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: anonymous access, old save, 10-page atlas, 2 burrs both modes, blocked moves, hints, undo, orbit, xray, keyboard 6, saved progress, 320/390/768/1024 layouts.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
