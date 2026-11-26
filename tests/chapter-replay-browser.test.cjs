'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const Chapters=require('../dist/campaign-chapters.js');
const {start,completedJourney}=require('./chapter-replay.test.cjs');
const url=process.env.TEST_URL||'http://127.0.0.1:4173/';
const out=process.env.TEST_OUTPUT||'output/chapter-replay-0151/qa/browser';
const key='sun-jian-campaign-v1';
const packaged=!!process.env.SUNJIAN_PACKAGED_EXE;
const state=p=>p.evaluate(()=>CampaignJourney.snapshot());
const raw=p=>p.evaluate(key=>localStorage.getItem(key),key);
const button=(p,name)=>p.locator('#campaign-panel-actions').getByRole('button',{name});
const menu=p=>p.locator('#campaign-menu');
const chapterMenu=p=>p.locator('#campaign-chapter-select');

async function pause(p){
 if(!await menu(p).isVisible())await p.keyboard.press('Escape');
 await menu(p).waitFor();
}
async function seed(p,s,journey=false){
 await p.goto(url+'?practice=1');
 await p.evaluate(([key,save])=>localStorage.setItem(key,JSON.stringify(save)),[key,s]);
 await p.goto(url+(journey?'?journey=1':''));
}
async function lines(p){
 while(await p.locator('#campaign-next').isVisible())await p.locator('#campaign-next').click();
}
async function move(p,id,direction){
 const count=await p.evaluate(()=>SunJian.snapshot().history.length);
 await p.locator('[data-piece="'+id+'"]').click();
 const part=await p.evaluate(id=>SunJian.screen()?.pieces[id],id);
 if(part){
  const start=part.start,end=part.directions[direction].end;
  await p.mouse.move(start.x,start.y);await p.mouse.down();
  await p.mouse.move(end.x,end.y,{steps:24});await p.mouse.up();
 }else{
  await p.locator('#precise-controls').evaluate(el=>el.open=true);
  await p.locator('[data-direction="'+direction+'"]').click();
 }
 await p.waitForFunction(count=>SunJian.snapshot().history.length===count+1&&!SunJian.snapshot().busy,count);
}
async function award(p){
 await button(p,'听公布结果').click();await lines(p);
 await button(p,'领取证书').click();await button(p,'和大家拍张合影').click();
 await button(p,'收好合影').click();await lines(p);
 assert.equal((await state(p)).state.continuation.stage,'ending');
}

async function main(){
 fs.mkdirSync(out,{recursive:true});
 const browser=packaged?await require('./helpers/desktop-browser.cjs')():await chromium.launch({channel:'chrome'});
 let page;
 const errors=[];
 async function tab(options={}){
  page=await browser.newPage({viewport:{width:1440,height:900},offline:packaged,...options});
  page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(18000);
  return page;
 }
 try{
  const p=await tab();
  await p.goto(url);
  assert(!(await chapterMenu(p).isVisible()));
  assert.doesNotMatch(await menu(p).innerText(),/重看开场|章节回顾|原独立试玩/);
  await p.locator('#campaign-about').click();
  assert.match(await p.locator('#campaign-panel-content').innerText(),/接头和组合家具的灵感来自日常生活中观察的榫卯结构。/);
  await button(p,'返回主菜单').click();
  await p.locator('#campaign-travel-notes').click();
  assert.equal(await p.locator('#campaign-panel-title').textContent(),'旅行笔记');
  await button(p,'收好笔记').click();

  await p.locator('#campaign-practice').click();
  assert.equal(await p.locator('[data-practice-piece]').count(),40);
  const normal=await raw(p);
  await p.screenshot({path:out+'/practice.png'});
  const target=mode=>p.locator('[data-practice-piece="pinned:'+mode+'"]');
  await target('dismantle').click();await move(p,'pin','zp');
  await p.locator('#campaign-put').click();
  assert.match(await target('dismantle').textContent(),/继续拆解/);
  await p.reload();
  await p.locator('#campaign-practice').click();
  await target('assemble').click();await move(p,'tenon','yn');await move(p,'pin','zn');
  await p.locator('[data-completion-return]').click();
  assert.match(await target('assemble').textContent(),/再拼装/);
  await target('dismantle').click();
  assert.equal(await p.evaluate(()=>SunJian.snapshot().history[0]?.piece),'pin');
  await move(p,'tenon','yp');await p.locator('[data-completion-return]').click();
  assert.match(await target('dismantle').textContent(),/再拆解/);
  const practiceEntries=await p.locator('[data-practice-piece]').evaluateAll(buttons=>buttons.map(b=>b.dataset.practicePiece));
  for(const id of practiceEntries){
   const [level,mode]=id.split(':');
   await p.locator('[data-practice-piece="'+id+'"]').click();
   const run=await p.evaluate(()=>SunJian.snapshot());
   assert.equal(run.level,level);assert.equal(run.mode,mode);
   assert.equal((await state(p)).current,'practice:'+id);
   await p.locator('#campaign-put').click();
  }
  const after=JSON.parse(await raw(p)),before=JSON.parse(normal);
  assert.deepEqual(after?.runs||{},before?.runs||{});
  assert.deepEqual(after?.done||[],before?.done||[]);
  await p.close();

  const q=await tab();
  await seed(q,start('results'),true);
  await pause(q);assert(!(await chapterMenu(q).isVisible()));
  await q.locator('#campaign-continue').click();await award(q);await pause(q);
  assert(await chapterMenu(q).isVisible());
  assert.equal(await q.evaluate(key=>localStorage.getItem(key+'-chapter-unlock-v1'),key),'cleared');
  await q.locator('#campaign-new').click();await button(q,'开始新旅程').click();await pause(q);
  assert(await chapterMenu(q).isVisible());
  await q.close();

  const r=await tab();
  await seed(r,completedJourney());
  assert(await chapterMenu(r).isVisible());
  await r.locator('#campaign-travel-notes').click();
  await button(r,'回访榫卯文化博物馆').click();
  await r.locator('[data-museum-exhibit="clamp"]').waitFor();
  await r.locator('[data-museum-leave]').click();
  assert.equal(await r.locator('#campaign-panel-title').textContent(),'旅行笔记');
  await button(r,'收好笔记').click();
  const main=JSON.parse(await raw(r));
  for(const entry of Chapters.chapters){
   await chapterMenu(r).click();
   if(entry.id==='arrival'){
    for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){
     await r.setViewportSize({width,height});
     assert.equal(await r.locator('[data-chapter-start]').count(),7);
     await r.screenshot({path:out+'/chapters-'+width+'.png'});
    }
    await r.setViewportSize({width:1440,height:900});
   }
   await r.locator('[data-chapter-start="'+entry.id+'"]').click();
   let current=await state(r);
   assert.equal(current.chapterReplay,entry.id);assert.equal(current.state.phase,entry.phase);
   if(entry.stage)assert.equal(current.state.continuation.stage,entry.stage);
   if(entry.id==='learning'){
    await r.locator('.illustrated-hotspots [data-hotspot="zhou"]').click();
    await lines(r);
    assert.deepEqual(await r.locator('#campaign-choices button').allTextContents(),['桌上这些木块，我能试试吗？']);
   }
   if(entry.id==='making'){
    assert.equal(await r.getByRole('button',{name:'选择床边小几'}).count(),0);
    await button(r,'选择换鞋小凳').click();
    assert.equal(await button(r,'返回作品选择').count(),0);
    await button(r,'拿起自己的散件').click();await move(r,'seat','xn');
    await r.reload();await button(r,'继续装配作品').click();
    assert.equal(await r.evaluate(()=>SunJian.snapshot().history[0]?.piece),'seat');
    await r.locator('#campaign-put').click();
   }
   if(entry.id==='contest'||entry.id==='results')assert.equal(current.state.continuation.workChoice,'stool');
   if(entry.id==='results')await award(r);
   await pause(r);await r.locator('#campaign-end-chapter').click();
   assert.equal((await state(r)).chapterReplay,null);
   assert.deepEqual(JSON.parse(await raw(r)),main);
  }
  await r.close();

  if(packaged){
   const reviewer=await tab({args:['--review-chapters']});
   await reviewer.locator('[data-chapter-start="results"]').click();
   await award(reviewer);
   await pause(reviewer);await reviewer.locator('#campaign-end-chapter').click();
   const current=await state(reviewer);
   assert(current.reviewChapters&&!current.chapterUnlocked);
   assert(!current.state.finished);
   assert.equal(await reviewer.evaluate(key=>localStorage.getItem(key+'-chapter-unlock-v1'),key),null);
   await reviewer.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({packaged,chapters:7,practiceEntriesOpened:practiceEntries.length,
   practiceOptions:40,fullClearUnlock:true,newGameKeepsUnlock:true,firstChoices:true,
   chapterReload:true,oldCompletionRetained:true,formalSaveIsolated:true,privateLauncher:packaged,errors},null,2));
  console.log('PASS menus, practice in both directions, full-clear gate, all seven checkpoints and isolated replay');
 }catch(error){
  if(page&&!page.isClosed())await page.screenshot({path:out+'/failure.png'}).catch(()=>{});
  throw error;
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
