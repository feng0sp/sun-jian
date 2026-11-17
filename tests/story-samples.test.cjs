const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../dist/story-data'),P=require('../dist/puzzle-core'),E=require('../dist/experience');
const {snap,lines,choose}=require('./story-flow.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173',dir='output/story-samples';fs.mkdirSync(dir,{recursive:true});
const {finishedStory}=require('./story-fixtures.cjs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),errors=[];try{
 const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(s=>{if(!localStorage.getItem('sample-fixture')){localStorage.setItem('sun-jian-story-v1',JSON.stringify(s));localStorage.setItem('sample-fixture','yes');}},finishedStory());
 await p.goto(base);await p.waitForFunction(()=>window.Journey?.snapshot().inStory);await p.locator('#story-end-world').click();await p.waitForFunction(()=>Journey.snapshot().scene.images.room==='true');
 const initial=(await snap(p)).state,taskRuns=JSON.stringify(initial.runs),practice=await p.evaluate(()=>JSON.parse(localStorage.getItem('sun-jian-session-v1')));
 async function menu(id){await p.locator(`[data-hotspot=${id}]`).click();assert.equal((await snap(p)).state.talk.node,'sample-'+id);}
 async function button(id,d){await p.locator('#precise-controls').evaluate(el=>el.open=true);await p.locator(`[data-piece=${id}]`).click();await p.locator(`[data-direction=${d}]`).click();}
 async function drag(id,d){await p.locator('#viewport').scrollIntoViewIfNeeded();const m=(await p.evaluate(()=>SunJian.screen())).pieces[id];await p.mouse.move(m.start.x,m.start.y);await p.mouse.down();await p.mouse.move(m.directions[d].end.x,m.directions[d].end.y,{steps:20});await p.mouse.up();}
 async function start(mode){await choose(p,'sample-'+mode);await p.waitForFunction(()=>Journey.snapshot().state.view==='puzzle'&&!Journey.snapshot().moving);}
 async function intact(){const s=(await snap(p)).state;assert.equal(s.beat,9);assert.deepEqual(s.completed,initial.completed);assert.equal(JSON.stringify(s.runs),taskRuns);assert(!(await p.locator('#story-end-dialog').isVisible()));}
 for(const [id,steps] of [['straight',[['tenon','yp']]],['lap',[['upper','yp'],['lower','xp']]],['pinned',[['pin','zp'],['tenon','yp']]]]){
  await menu(id);assert(!(await snap(p)).choices.includes('sample-task'));assert((await snap(p)).choices.includes('sample-dismantle'));
  await choose(p,'sample-question');await lines(p);assert((await snap(p)).state.experienced.includes('sample-'+id+'-talk'));
  await choose(p,'sample-inspect');assert(await p.locator('#story-note-model canvas').isVisible());await p.locator('[data-close=story-notebook-dialog]').click();assert.equal((await snap(p)).state.talk.node,'sample-'+id);
  await p.screenshot({path:`${dir}/${id}-menu.png`});if(id==='straight'){await choose(p,'sample-inspect');await p.locator('#story-note-dismantle').click();await p.waitForFunction(()=>Journey.snapshot().state.view==='puzzle');}else await start('dismantle');assert(await p.locator('#story-study-dismantle').isDisabled());
  if(id==='pinned'){
   await button('tenon','yp');assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,0);
   await drag('pin','zp');await p.reload();await p.waitForFunction(()=>window.Journey?.snapshot().state.study==='pinned:dismantle');await p.waitForFunction(()=>!Journey.snapshot().moving);assert.deepEqual((await p.evaluate(()=>SunJian.snapshot())).removed,['pin']);
   await p.locator('#story-back').click();assert.equal((await snap(p)).state.talk,null);await menu('pinned');assert.match(await p.locator('[data-choice=sample-dismantle]').innerText(),/继续/);await start('dismantle');assert.deepEqual((await p.evaluate(()=>SunJian.snapshot())).removed,['pin']);await drag('tenon','yp');
  }else for(const [piece,d] of steps)await drag(piece,d);
  assert.match(await p.locator('#story-study-status').innerText(),/拆开了/);await intact();
  await p.locator('#quick-undo').click();assert(!/拆开了/.test(await p.locator('#story-study-status').innerText()));const last=steps.at(-1);await drag(...last);
  if(id==='straight'){await p.locator('#story-back').click();await menu('straight');await start('dismantle');assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,0);await drag('tenon','yp');}
  if(id==='pinned'){await p.reload();await p.waitForFunction(()=>window.Journey?.snapshot().state.study==='pinned:dismantle'&&!Journey.snapshot().moving);assert.match(await p.locator('#story-study-status').innerText(),/拆开了/);}
  await p.locator('#story-study-assemble').click();assert.equal((await p.evaluate(()=>SunJian.snapshot())).mode,'assemble');
  const l=P.LEVELS.find(l=>l.id===id);let removed=l.pieces.filter(x=>!x.fixed).map(x=>x.id);
  while(removed.length){const m=P.availableInsertions(l,removed)[0];await button(m.piece,m.direction);removed=removed.filter(x=>x!==m.piece);}
  assert.match(await p.locator('#story-study-status').innerText(),/合好了/);await intact();await p.screenshot({path:`${dir}/${id}-assembled.png`});
  await p.locator('#story-study-again').click();assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,0);await p.locator('#story-study-put').click();assert.equal((await snap(p)).state.talk,null);
 }
 // A finished study changes only the evening room's presentation.
 assert((await snap(p)).scene.objects.straightAssembled);assert(!(await snap(p)).scene.objects.lapInBox);assert(!(await snap(p)).scene.objects.pinnedInTray);
 for(const [id,steps] of [['lap',[['upper','yp'],['lower','xp']]],['pinned',[['pin','zp'],['tenon','yp']]]]){await menu(id);await start('dismantle');for(const step of steps)await drag(...step);await p.locator('#story-back').click();assert.equal((await snap(p)).state.talk,null);}
 assert((await snap(p)).scene.objects.lapInBox);assert((await snap(p)).scene.objects.pinnedInTray);
 // The crate marker follows its actual contents. Clicking a visible loose piece also works.
 const f=await p.locator('.workshop-frame').boundingBox(),lap=await p.locator('[data-hotspot=lap]').boundingBox();assert(lap.x>f.x+f.width*.85&&lap.y>f.y+f.height*.76);
 const tray=(await snap(p)).scene.storedTargets.pinned;await p.mouse.click(f.x+f.width*tray.x,f.y+f.height*tray.y);await p.waitForFunction(()=>Journey.snapshot().state.talk?.node==='sample-pinned');await choose(p,'sample-leave');
 // Test the real raycast against the two bars in the crate, away from the marker.
 const storedLap=(await snap(p)).scene.storedTargets.lap;await p.mouse.click(f.x+f.width*storedLap.x,f.y+f.height*storedLap.y);await p.waitForFunction(()=>Journey.snapshot().state.talk?.node==='sample-lap');await choose(p,'sample-leave');
 for(const [width,height] of [[1280,720],[1920,1080]]){await p.setViewportSize({width,height});await menu('pinned');const box=await p.locator('#story-dialogue').boundingBox();assert(box.x>=0&&box.y>=138&&box.x+box.width<=width&&box.y+box.height<=height);await p.screenshot({path:`${dir}/menu-${width}.png`});await choose(p,'sample-leave');}
 await p.locator('#story-exit').click();const returned=await p.evaluate(()=>JSON.parse(localStorage.getItem('sun-jian-session-v1')));for(const key of ['level','mode','history'])assert.deepEqual(returned[key],practice[key]);assert.equal(returned.trial.id,practice.trial.id);await c.close();
 // Optional practice in the middle of the story must return to the same current task.
 const q=await b.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});q.on('pageerror',e=>errors.push(e.message));await q.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});await q.addInitScript(s=>localStorage.setItem('sun-jian-story-v1',JSON.stringify(s)),finishedStory(1));await q.goto(base);await q.waitForFunction(()=>window.Journey?.snapshot().inStory);await q.locator('#story-dismiss-graphics').click();await q.locator('[data-hotspot=straight]').click();await choose(q,'sample-assemble');await q.waitForFunction(()=>Journey.snapshot().state.view==='puzzle');await q.locator('[data-piece=tenon]').click();await q.locator('[data-direction=yn]').click();assert.equal((await snap(q)).state.beat,3);await q.locator('#story-back').click();assert.equal((await snap(q)).state.talk,null);await q.locator('#story-continue-task').click();await q.waitForFunction(()=>Journey.snapshot().state.view==='puzzle');assert.equal((await q.evaluate(()=>SunJian.snapshot())).level,'lap');assert.equal((await snap(q)).state.study,null);await q.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/${process.env.TEST_URL?'live':'local'}-verification.json`,JSON.stringify({url:base,anonymous:true,at:new Date().toISOString(),checks:['three distinct sample conversations','rotate inspection returns to menu','all samples drag dismantle and button assemble','collision feedback','undo completion','restart','partial study refresh and resume','crate marker and loose-part raycast','desktop choices fit','story records and practice isolation','optional study during story','practice without WebGL'],errors},null,2));console.log('PASS: all three sample interactions, repeatable dismantle/assemble, real drags, loose-part clicks, refresh, undo and story/practice isolation.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
