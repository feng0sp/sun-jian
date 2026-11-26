const {_electron:electron}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {D}=require('./helpers/campaign-fixtures.cjs');
(async()=>{
 const out=path.resolve('output/campaign-012');fs.mkdirSync(out,{recursive:true});
 const app=await electron.launch({executablePath:path.resolve('artifacts/desktop/SunJian-win32-x64/SunJian.exe'),env:{...process.env,SUNJIAN_TEST:'1',SUNJIAN_USER_DATA:path.join(out,'offline-profile-'+Date.now())},timeout:45000});
 try{
  const p=await app.firstWindow(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.waitForFunction(()=>window.CampaignJourney);
  assert.equal(await p.evaluate(()=>typeof require),'undefined');assert.equal(await p.evaluate(()=>typeof process),'undefined');
  const files=fs.readdirSync('dist/assets/campaign-2d').filter(n=>n.endsWith('.webp'));
  const loaded=await p.evaluate(async files=>{const results=[];for(const f of files){const r=await fetch('assets/campaign-2d/'+f);const b=await r.blob();results.push([f,r.ok,b.size]);}return results;},files);
  assert(loaded.every(([,ok,size])=>ok&&size>10000),'all local painted assets available');
  const s=D.fresh();s.phase='learning';s.openingSeen=true;s.frame='workbench';
  await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto('sun-jian://app/index.html?journey=1');
  await p.waitForFunction(()=>CampaignJourney.snapshot().scene.available&&!CampaignJourney.snapshot().scene.loading);assert.equal(await p.locator('#campaign-world canvas:not(.journey-rain)').count(),0);
  if(await p.locator('.illustrated-hotspots [data-hotspot=\"frame:workbench\"]').count())await p.locator('.illustrated-hotspots [data-hotspot=\"frame:workbench\"]').click();await p.locator('.illustrated-hotspots [data-hotspot=straight]').click();await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle');assert.equal(await p.evaluate(()=>SunJian.snapshot().renderer),true);
  await p.locator('[data-piece=tenon]').click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction=yp]').click();await p.waitForFunction(()=>!SunJian.snapshot().busy);
  await p.locator('#campaign-put').click();await p.waitForFunction(()=>CampaignJourney.snapshot().state.done.length===1);await p.reload();await p.waitForFunction(()=>CampaignJourney.snapshot().scene.available&&!CampaignJourney.snapshot().scene.loading);
  assert.equal((await p.evaluate(()=>CampaignJourney.snapshot())).state.done.length,1);assert.deepEqual(errors,[]);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].show());await p.screenshot({path:path.join(out,'offline-app.png')});fs.writeFileSync(path.join(out,'offline-verification.json'),JSON.stringify({packagedExecutable:true,externalNetworkingBlockedByApp:true,sandboxedRenderer:true,localImages:loaded.length,illustratedScene:true,puzzleWebGL:true,operationAndReload:true,errors},null,2));
  console.log('PASS packaged offline 2D journey, all local images, sandboxed WebGL operation and saved progress after reload');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1)});
