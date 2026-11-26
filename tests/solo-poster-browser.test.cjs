'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {start}=require('./chapter-replay.test.cjs');
const Next=require('../dist/campaign-continuation.js');

const url=process.env.TEST_URL||'http://127.0.0.1:4173/';
const out=process.env.TEST_OUTPUT||'output/solo-game-0153/poster';
const key='sun-jian-campaign-v1';
const packaged=!!process.env.SUNJIAN_PACKAGED_EXE;

async function main(){
 fs.mkdirSync(out,{recursive:true});
 const browser=packaged?await require('./helpers/desktop-browser.cjs')():await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},offline:packaged});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const snap=()=>page.evaluate(()=>CampaignJourney.snapshot());
  const poster=page.getByRole('button',{name:'柱上的木作交流赛海报'});
  const next=page.locator('#campaign-next');
  const button=name=>page.locator('#campaign-panel-actions').getByRole('button',{name});
  await page.goto(url);
  await page.locator('#campaign-new').click();
  await next.waitFor();
  assert.match(await page.locator('#campaign-line').textContent(),/大学生/);
  assert.equal(await poster.count(),0);

  const old=start('workshop');
  old.storyRevision=14;
  old.continuation={...Next.fresh(),started:true,active:true};
  old.talk=null;
  const original=JSON.stringify(old);
  await page.goto(url+'?practice=1');
  await page.evaluate(([key,raw])=>localStorage.setItem(key,raw),[key,original]);
  await page.goto(url+'?journey=1');
  await poster.waitFor();
  assert.equal((await snap()).state.frame,'shelter');
  assert.equal((await snap()).state.talk,null);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key+'-backup-before-poster15'),key),original);
  await page.reload();
  await poster.waitFor();
  assert(await poster.locator('.contest-poster-paper').isVisible());
  for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){
   await page.setViewportSize({width,height});
   await page.screenshot({path:out+'/shelter-'+width+'.png'});
  }
  await poster.focus();
  await page.keyboard.press('Enter');
  assert.equal((await snap()).state.talk?.id,'continuationMeetup');
  await next.click();
  await page.reload();
  await next.waitFor();
  assert.equal((await snap()).state.talk.line,1);
  while(await next.isVisible())await next.click();
  assert.equal((await snap()).state.continuation.noticeSeen,false);
  await page.getByRole('button',{name:/展开折页/}).click();
  assert.equal((await snap()).state.continuation.noticeSeen,true);
  assert.match(await page.locator('#campaign-panel-content').textContent(),/可拆修的小家具/);
  await button(/收好折页/).click();
  await button(/问问周伯/).click();
  while(await next.isVisible())await next.click();
  assert.equal((await snap()).state.continuation.stage,'home');
  assert.equal((await snap()).state.continuation.departed,true);
  assert.deepEqual((await snap()).state.runs,old.runs);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({packaged,posterVisible:true,keyboard:true,
   migration:true,readingReload:true,noticeOnce:true,allPreviousRunsRetained:true,campusIdentity:true,errors},null,2));
  console.log('PASS student opening, physical poster, keyboard inspection, reload, departure and prior save');
 } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
