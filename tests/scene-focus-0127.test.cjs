const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {learned}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();let release;try{
 await p.route('**/assets/campaign-2d/workbench-4.webp*',async r=>{await new Promise(resolve=>release=resolve);await r.continue();});
 await p.goto(base+'?practice=1');const s=learned();s.frame='room';await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);
 await p.locator('[data-hotspot="frame:workbench"]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>CampaignJourney.snapshot().scene.loading);await p.waitForTimeout(300);release();await ready(p);
 assert(await p.evaluate(()=>!!document.activeElement.closest('.illustrated-hotspots,.illustrated-exits')), 'keyboard focus follows delayed scene navigation');
 await p.keyboard.press('Enter');await ready(p);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.frame),'room');
 // A second delayed transition must not steal focus after the player opens a menu.
 await p.reload();await ready(p);await p.locator('[data-hotspot="frame:workbench"]').click();await p.waitForFunction(()=>CampaignJourney.snapshot().scene.loading);await p.keyboard.press('Escape');await p.waitForTimeout(100);const active=await p.evaluate(()=>document.activeElement.id);release();await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>document.activeElement.id),active);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().modal),'campaign-menu');
 fs.mkdirSync('output/qa-0127',{recursive:true});fs.writeFileSync('output/qa-0127/focus.json',JSON.stringify({delayedSceneFocus:true,menuFocusPreserved:true},null,2));console.log('PASS delayed keyboard scene navigation restores focus and preserves menu focus');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
