'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {start}=require('./chapter-replay.test.cjs');

const url=process.env.TEST_URL||'http://127.0.0.1:4173/';
const out=process.env.TEST_OUTPUT||'output/developer-0154/browser';
const key='sun-jian-campaign-v1';

async function main(){
 const packaged=!!process.env.SUNJIAN_PACKAGED_EXE;
 const browser=packaged?await require('./helpers/desktop-browser.cjs')():await chromium.launch({channel:'chrome'});
 const errors=[];
 fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},offline:packaged});
  page.on('pageerror',error=>errors.push(error.message));
  const state=()=>page.evaluate(()=>CampaignJourney.snapshot());
  const readSave=()=>page.evaluate(key=>localStorage.getItem(key),key);
  const menu=page.locator('#campaign-menu');
  const go=async(chapter,id)=>{
   await page.locator('#campaign-dev-chapter').selectOption(chapter);
   await page.locator(`[data-dev-start="dev-${id}"]`).click();
   await page.waitForFunction(id=>CampaignJourney.snapshot().chapterReplay==='dev-'+id,id);
  };
  const jump=async()=>{await page.keyboard.press('Escape');await menu.waitFor();await page.locator('#campaign-dev-entry').click();};
  await page.goto(url+'?practice=1');
  const original=start('repair');
  await page.evaluate(([key,saved])=>localStorage.setItem(key,JSON.stringify(saved)),[key,original]);
  await page.goto(url);await menu.waitFor();
  const old=await readSave();
  assert(!(await page.locator('#campaign-chapter-select').isVisible()));
  await page.locator('#campaign-dev-toggle').click();
  assert.equal(await page.locator('#campaign-panel-title').textContent(),'剧情跳转');
  await page.locator('#campaign-dev-chapter').selectOption('workshop');
  await page.screenshot({path:out+'/developer-menu.png'});
  await go('arrival','knock');
  await page.locator('[data-hotspot=knock-door]').waitFor();
  assert.equal((await state()).state.prologue.invited,false);
  await jump();await go('learning','lesson-lap');
  await page.locator('[data-hotspot=lap]').click();
  await page.locator('#campaign-dev-puzzle').click();
  await go('repair','poster');
  await page.locator('[data-hotspot=contest-poster]').waitFor();
  await page.reload();
  assert.equal((await state()).chapterReplay,'dev-poster');
  await page.locator('[data-hotspot=contest-poster]').waitFor();
  await page.locator('#campaign-dev-world').click();
  await go('workshop','museum');
  await page.locator('#campaign-next').first().waitFor();
  assert.equal((await state()).state.continuation.stage,'museum');
  await jump();await go('making','entry-build');
  assert.equal((await state()).state.continuation.workChoice,'stool');
  await jump();await go('contest','judge');
  assert.equal((await state()).state.talk.id,'continuationFinalJudge');
  await jump();await go('results','award-receive');
  assert.equal((await state()).state.continuation.awardStep,1);
  await jump();await go('results','ending');
  assert.equal((await state()).state.continuation.stage,'ending');
  await page.keyboard.press('Escape');await menu.waitFor();
  await page.locator('#campaign-dev-toggle').click();
  const restored=await state();
  assert.equal(restored.chapterReplay,null);
  assert.equal(restored.developerMode,false);
  assert.equal(restored.state.phase,'morning');
  assert.equal(await readSave(),old);
  assert(!(await page.locator('#campaign-chapter-select').isVisible()));
  assert.equal(await page.evaluate(key=>localStorage.getItem(key+'-chapter-unlock-v1'),key),null);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({packaged,sevenChapters:true,launchFromPuzzle:true,reload:true,mainSaveRestored:true,noFormalUnlock:true,errors},null,2));
  console.log('PASS developer switch, seven chapter families, puzzle jumping, reload and formal save isolation');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
