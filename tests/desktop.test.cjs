const {_electron:electron}=require('playwright');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const folder=path.resolve(__dirname,'../artifacts/desktop/SunJian-win32-x64');
  const app=await electron.launch({executablePath:path.join(folder,'SunJian.exe'),env:{...process.env,SUNJIAN_TEST:'1',SUNJIAN_USER_DATA:path.resolve(__dirname,'../artifacts/desktop-test-profile')},timeout:30000});
  try{
    const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.SunJian, {timeout:15000});
    assert.equal(await page.evaluate(()=>typeof require),'undefined');assert.equal(await page.evaluate(()=>typeof process),'undefined');
    assert.equal((await page.evaluate(()=>SunJian.snapshot())).renderer,true);
    await page.locator('[data-piece="tenon"]').click();await page.locator('[data-direction="yp"]').click();await page.waitForFunction(()=>!SunJian.snapshot().busy);assert(await page.locator('#complete-dialog').isVisible());
    await page.screenshot({path:path.resolve(__dirname,'../artifacts/desktop-app.png')});
    await page.locator('[data-close="complete-dialog"]').click();await page.locator('#mode-assemble').click();await page.locator('[data-piece="tenon"]').click();await page.locator('[data-direction="yn"]').click();await page.waitForFunction(()=>!SunJian.snapshot().busy);assert(await page.locator('#complete-dialog').isVisible());
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.SunJian);
    const routes=[
      {out:[['tenon','yp']],back:[['tenon','yn']]},
      {out:[['upper','yp'],['lower','xp']],back:[['lower','xn'],['upper','yn']]},
      {out:[['pin','zp'],['tenon','yp']],back:[['tenon','yn'],['pin','zn']]},
      {out:[['key','yp'],['slide','xp']],back:[['slide','xn'],['key','yn']]},
      {out:[['crosspin','xp'],['pin','zp'],['tenon','yp']],back:[['tenon','yn'],['pin','zn'],['crosspin','xn']]},
      {out:[['lid','xp'],['front','yp'],['back','yp'],['left','yp'],['right','yp']],back:[['left','yn'],['right','yn'],['front','yn'],['back','yn'],['lid','xn']]}
    ];
    const move=async(piece,direction)=>{await page.locator(`[data-piece="${piece}"]`).click();await page.locator(`[data-direction="${direction}"]`).click();await page.waitForFunction(()=>!SunJian.snapshot().busy);};
    for(const [mode,key]of [['dismantle','out'],['assemble','back']]){
      await page.locator('#mode-'+mode).click();
      for(let i=0;i<routes.length;i++){await page.locator('button[data-level]').nth(i).click();for(const [piece,direction]of routes[i][key])await move(piece,direction);assert(await page.locator('#complete-dialog').isVisible());await page.locator('[data-close="complete-dialog"]').click();}
    }
    await page.locator('#open-experiment').click();await page.locator('#action-step').click();await move('lift-key','yp');await move('slider','xp');await move('lift-key','yp');assert(await page.locator('#complete-dialog').isVisible());await page.locator('[data-close="complete-dialog"]').click();await page.getByRole('link',{name:'榫间首页'}).click();await page.waitForFunction(()=>window.SunJian?.snapshot().level==='straight');
    assert.deepEqual(errors,[]);console.log('PASS: packaged Windows executable, local protocol, sandboxed renderer, 3D, all 6 dual-mode levels, experiment and homepage navigation.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1)});
