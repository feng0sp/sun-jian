const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const P=require('../dist/puzzle-core.js');
(async()=>{
  const b=await chromium.launch({channel:'chrome',headless:true});fs.mkdirSync('artifacts/report-art',{recursive:true});
  for(const l of P.LEVELS){const p=await b.newPage({viewport:{width:220,height:155},deviceScaleFactor:4});await p.goto(`http://127.0.0.1:4173/assets/${l.id}.svg`);await p.screenshot({path:path.resolve('artifacts/report-art',l.id+'.png')});await p.close();}
  const p=await b.newPage({viewport:{width:1440,height:980},deviceScaleFactor:2});await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>window.SunJian);await p.screenshot({path:'artifacts/report-art/interface.png'});await p.locator('button[data-level]').nth(5).click();await p.locator('#viewport canvas').screenshot({path:'artifacts/report-art/hero.png'});
  await p.locator('button[data-level]').nth(2).click();await p.locator('#xray').click();await p.locator('[data-piece="pin"]').click();await p.locator('#viewport canvas').screenshot({path:'artifacts/report-art/pin-xray.png'});
  await p.locator('button[data-level]').nth(3).click();await p.locator('#xray').click();await p.locator('[data-piece="slide"]').click();await p.locator('[data-direction="xp"]').hover();await p.waitForTimeout(100);await p.locator('#stage').screenshot({path:'artifacts/report-art/dovetail-arrow.png'});
  await p.locator('#open-atlas').click();await p.locator('#atlas-dialog').screenshot({path:'artifacts/report-art/atlas.png'});await p.locator('[data-close="atlas-dialog"]').click();
  await p.locator('#open-experiment').click();await p.locator('[data-piece="lift-key"]').click();
  const crop=async name=>{const r=await p.locator('#viewport').boundingBox();await p.screenshot({path:`artifacts/report-art/${name}.png`,clip:{x:r.x+r.width*.22,y:r.y+r.height*.12,width:r.width*.6,height:r.height*.75}});};
  await crop('ex-initial');await p.locator('#action-step').click();await p.locator('[data-direction="yp"]').click();await p.waitForFunction(()=>!SunJian.snapshot().busy);await p.locator('[data-piece="slider"]').click();await crop('ex-shifted');await p.locator('[data-direction="xp"]').click();await p.waitForFunction(()=>!SunJian.snapshot().busy);await p.locator('[data-piece="lift-key"]').click();await crop('ex-open');
  await b.close();console.log('Captured original vectors and current game scenes for the design brief.');
})().catch(e=>{console.error(e);process.exit(1)});
