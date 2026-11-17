const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
  const b=await chromium.launch({channel:'chrome',headless:true});
  for(const viewport of [{width:1440,height:980},{width:390,height:844}]){
    const context=await b.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>window.SunJian);await p.locator('#skip-tutorial').click();await p.locator('#open-experiment').click();await p.locator('#precise-controls').evaluate(el=>el.open=true);
    const snap=()=>p.evaluate(()=>SunJian.snapshot());const settle=()=>p.waitForFunction(()=>!SunJian.snapshot().busy);
    assert.equal((await snap()).level,'shift-key');assert(await p.locator('#movement-choice').isVisible());assert(await p.locator('#mode-assemble').isDisabled());
    await p.locator('[data-piece="lift-key"]').click();await p.locator('[data-direction="yp"]').click();await settle();assert.equal((await snap()).history.length,0);
    await p.locator('#hint').click();await p.locator('#hint').click();await p.locator('#hint').click();assert.equal((await snap()).action,'extract');assert((await snap()).demo);await p.locator('#close-hint').click();await p.locator('#action-step').click();
    await p.locator('[data-direction="yp"]').click();await settle();assert.deepEqual((await snap()).offsets['lift-key'],[0,1,0]);assert.deepEqual((await snap()).removed,[]);
    await p.locator('#undo').click();assert.deepEqual((await snap()).offsets['lift-key'],[0,0,0]);
    await p.locator('[data-direction="yp"]').click();await settle();assert.equal((await snap()).action,'extract');
    await p.screenshot({path:path.resolve(__dirname,`../artifacts/experiment-${viewport.width}.png`),fullPage:true});
    await p.locator('[data-piece="slider"]').click();await p.locator('[data-direction="xp"]').click();await settle();assert.deepEqual((await snap()).removed,['slider']);
    await p.locator('[data-piece="lift-key"]').click();await p.locator('[data-direction="yp"]').click();await settle();assert.equal((await snap()).removed.length,2);assert.equal((await snap()).history.length,3);assert(await p.locator('#complete-dialog').isVisible());assert.equal((await snap()).cleared.length,0,'experiment does not inflate main-campaign progress');
    await p.locator('[data-close="complete-dialog"]').click();await p.locator('#undo').click();assert.deepEqual((await snap()).offsets['lift-key'],[0,1,0]);assert.deepEqual((await snap()).removed,['slider']);await p.locator('#undo').click();await p.locator('#undo').click();assert.deepEqual((await snap()).removed,[]);assert.deepEqual((await snap()).offsets['lift-key'],[0,0,0]);
    await p.locator('button[data-level]').first().click();assert.equal((await snap()).experiment,false);assert(!(await p.locator('#movement-choice').isVisible()));assert(!(await p.locator('#mode-assemble').isDisabled()));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);await context.close();
  }
  await b.close();console.log('PASS: desktop and mobile partial movement, hints, undo chain, cap blocking, extraction, and independent progress.');
})().catch(e=>{console.error(e);process.exit(1)});
