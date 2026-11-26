'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {P}=require('./helpers/campaign-fixtures.cjs');
const {readyForMuseum}=require('./museum.test.cjs');
const Museum=require('../dist/campaign-museum.js');
const Guide=require('../dist/assembly-guide.js');

const url=process.env.TEST_URL||'http://127.0.0.1:4173/';
const output=process.env.TEST_OUTPUT||'output/museum-0150/qa/local';
const noWebGL=process.env.NO_WEBGL==='1';
const offline=process.env.OFFLINE==='1';
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
const game=p=>p.evaluate(()=>SunJian.snapshot());
const gallery=p=>p.locator('.museum-gallery');
const selected=p=>p.locator('.museum-detail');
async function readIntro(p){
 while(await p.locator('#campaign-conversation').isVisible())await p.locator('#campaign-next').click();
}
async function move(p,piece,direction){
 const count=(await game(p)).history.length;
 await p.locator('[data-piece="'+piece+'"]').click();
 if(noWebGL){
  await p.locator('#precise-controls').evaluate(element=>element.open=true);
  await p.locator('[data-direction="'+direction+'"]').click();
 }else{
  const {start,end}=await p.evaluate(({piece,direction})=>{
   const part=SunJian.screen().pieces[piece];
   return {start:part.start,end:part.directions[direction].end};
  },{piece,direction});
  await p.mouse.move(start.x,start.y);await p.mouse.down();
  await p.mouse.move(end.x,end.y,{steps:24});await p.mouse.up();
 }
 await p.waitForFunction(expected=>{const s=SunJian.snapshot();return !s.busy&&s.history.length===expected;},count+1);
}
async function put(p){
 await p.locator('#campaign-completion').waitFor({state:'visible'});
 await p.locator('[data-completion-return]').click();
 await selected(p).waitFor();
}
async function open(p,id){await p.locator('[data-museum-exhibit="'+id+'"]').click();await p.locator('[data-museum-replica]').click();}

async function main(){
 fs.mkdirSync(output,{recursive:true});
 const browser=process.env.SUNJIAN_PACKAGED_EXE?await require('./helpers/desktop-browser.cjs')():await chromium.launch({channel:'chrome',headless:true});
 let page;
 try{
  page=await browser.newPage({viewport:{width:1440,height:900},offline});
  page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(noWebGL)await page.addInitScript(()=>{
   const getContext=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:getContext.call(this,type,...args);};
  });
  await page.goto(url+'?practice=1');
  await page.evaluate(save=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(save)),readyForMuseum());
  if(!process.env.SUNJIAN_PACKAGED_EXE)await page.route('**/museum/gallery.webp',request=>request.abort(),{times:2});
  await page.goto(url+'?journey=1');
  if(offline)await page.waitForFunction(()=>!navigator.onLine);
  await page.locator('#campaign-conversation').waitFor();
  assert.equal((await snap(page)).state.talk.id,'continuationMuseumIntro');
  assert(await page.locator('#campaign-museum').evaluate(element=>element.inert));
  await page.locator('#campaign-next').click();await page.reload();
  await page.locator('#campaign-line').waitFor();
  assert.equal((await snap(page)).state.talk.line,1);
  await readIntro(page);
  assert(await gallery(page).isVisible());
  if(!process.env.SUNJIAN_PACKAGED_EXE)await page.getByRole('button',{name:'重试展厅图'}).click();
  await page.locator('.museum-art').evaluate(img=>img.decode());
  assert.equal(await page.locator('.museum-painting img').count(),1);
  const before=(await snap(page)).state.continuation;
  for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){
   await page.setViewportSize({width,height});
   for(const hotspot of await page.locator('.museum-hotspot').all()){
    const box=await hotspot.boundingBox();
    assert(box.width>=40&&box.height>=40&&box.x>0&&box.y>0&&box.x+box.width<width&&box.y+box.height<height);
    assert(await hotspot.locator('span').evaluate(label=>{
     const box=label.getBoundingClientRect();
     return document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)?.closest('button')===label.parentElement;
    }));
   }
   await page.screenshot({path:output+'/gallery-'+width+'.png'});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.keyboard.down('H');assert(await page.locator('.museum-painting').evaluate(el=>el.classList.contains('show-museum-hotspots')));await page.keyboard.up('H');
  if(!process.env.SUNJIAN_PACKAGED_EXE)await page.route('**/museum/hemudu-whole.webp',request=>request.abort(),{times:1});
  for(const item of Museum.landmarks){
   const trigger=page.locator('[data-museum-exhibit="'+item.id+'"]');
   if(item.id==='hemudu'){await trigger.focus();await page.keyboard.press('Enter');}
   else await trigger.locator('span').click();
   assert.equal(await page.locator('.museum-plaque h2').textContent(),item.name);
   if(item.id==='hemudu'&&!process.env.SUNJIAN_PACKAGED_EXE)await page.getByRole('button',{name:'重试结构图'}).click();
   for(const view of Museum.diagrams){
    await page.locator('[data-museum-diagram="'+view+'"]').click();
    await page.locator('.museum-detail-image img').evaluate(img=>img.decode());
    assert.equal(await page.locator('[aria-pressed=true][data-museum-diagram]').getAttribute('data-museum-diagram'),view);
   }
   assert.equal(await page.locator('[data-museum-replica]').isVisible(),!!item.level);
   if(item.id==='clamp')await page.screenshot({path:output+'/clamp-detail.png'});
   await page.keyboard.press('Escape');
   assert(await gallery(page).isVisible());
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.museumExhibit),item.id);
  }
  await page.locator('[data-museum-sources]').click();
  assert.match(await page.locator('#campaign-panel-content').innerText(),/中国传统木结构营造技艺/);
  await page.getByRole('button',{name:'收好资料，回展厅'}).click();

  await open(page,'clamp');
  await page.waitForFunction(()=>document.fonts.status==='loaded'&&!SunJian.snapshot().busy);
  if(!noWebGL)await page.screenshot({path:output+'/clamp-teaching-table.png',animations:'disabled'});
  await page.locator('[data-piece="apron"]').click();await page.keyboard.press('w');
  assert.match(await page.locator('#feedback-text').innerText(),/案面边框/);
  assert.equal((await game(page)).history.length,0);
  await move(page,'top','yp');await page.reload();await selected(page).waitFor();
  assert.match(await page.locator('[data-museum-replica]').innerText(),/接着拆开/);
  await page.locator('[data-museum-replica]').click();assert.equal((await game(page)).history.length,1);
  await move(page,'apron','yp');await put(page);
  await page.locator('[data-museum-replica]').click();
  assert(await page.locator('[data-piece="top"]').isDisabled());
  await move(page,'apron','yn');await move(page,'top','yn');await put(page);
  await page.locator('[data-museum-return]').click();

  await open(page,'dovetail');await move(page,'key','yp');await move(page,'slide','xp');await put(page);
  await page.locator('[data-museum-replica]').click();await move(page,'slide','xn');await move(page,'key','yn');await put(page);
  await page.locator('[data-museum-return]').click();
  await open(page,'burr');
  const lock=P.LEVELS.find(level=>level.id==='burr-six');
  const removed=[];
  while(removed.length<6){
   const first=P.availableMoves(lock,removed)[0];assert(first);
   await move(page,first.piece,first.direction);removed.push(first.piece);
  }
  await put(page);
  await page.locator('[data-museum-replica]').click();
  for(const step of P.assemblyRoute(lock,removed))await move(page,step.piece,step.direction);
  await put(page);await page.locator('[data-museum-return]').click();
  for(const id of ['hemudu','dougong','corner','chair','sliding-pin']){
   await open(page,id);
   const level=P.LEVELS.find(item=>item.id===Museum.landmarks.find(item=>item.id===id).level);
   const absent=[];
   if(!noWebGL)await page.screenshot({path:output+'/'+id+'-teaching-table.png'});
   while(absent.length<level.pieces.filter(part=>!part.fixed).length){
    const first=P.availableMoves(level,absent)[0];assert(first,level.id);
    await move(page,first.piece,first.direction);absent.push(first.piece);
   }
   await put(page);
   await page.locator('[data-museum-replica]').click();
   const guide=Guide.forLevel(level.id,'assemble',true);
   while(absent.length){
    const step=Guide.step(guide,absent,'assemble',level);
    const piece=step.pieces.find(item=>absent.includes(item));
    await move(page,piece,Guide.direction(guide,piece,absent));
    absent.splice(absent.indexOf(piece),1);
   }
   await put(page);await page.locator('[data-museum-return]').click();
  }
  const visited=(await snap(page)).state.continuation;
  assert.equal(visited.museum.viewed.length,8);
  assert.deepEqual(new Set(visited.museum.learned),new Set(Museum.landmarks.map(item=>item.id)));
  assert.match(await page.locator('.museum-progress').innerText(),/8\s*\/\s*8/);
  for(const key of ['dovetailOutRun','dovetailBackRun','burrBackRun','serviceOutRun','entryRun','contestRun']){
   assert.deepEqual(visited[key],before[key]);
  }
  await page.locator('[data-museum-leave]').click();
  assert.equal((await snap(page)).state.continuation.stage,'work-choice');
  await page.keyboard.press('Escape');await page.locator('#campaign-travel-notes').click();
  await page.getByRole('button',{name:'回访榫卯文化博物馆'}).click();
  await page.locator('[data-museum-leave]').click();
  assert.equal(await page.locator('#campaign-panel-title').textContent(),'旅行笔记');
  assert.equal((await snap(page)).state.continuation.stage,'work-choice');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(output+'/verification.json',JSON.stringify({exhibits:8,diagrams:24,interactiveReplicas:8,offline,noWebGL,firstPerson:true,
   introReload:true,partialRunReload:true,desktopSizes:true,mouseDrags:!noWebGL,navigationAndReplayIsolation:true,
   imageRetry:!process.env.SUNJIAN_PACKAGED_EXE,formalHistoriesPreserved:true,errors},null,2));
  console.log('PASS museum visit, image retry, replica dismantle/reassembly, resume and return to work selection');
 }catch(error){
  if(page&&!page.isClosed())await page.screenshot({path:output+'/failure.png'}).catch(()=>{});
  throw error;
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
