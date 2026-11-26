/* Player-visible continuity: tasks, painted objects, suspended conversation and recovery. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,learned,solved,caveDone}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/campaign-0123';fs.mkdirSync(out,{recursive:true});
const snapshot=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function ready(p){await p.waitForFunction(()=>{const s=CampaignJourney.snapshot().scene;return s.available&&!s.loading&&!s.imageError;});await p.locator('.illustrated-art').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));}
async function seed(p,s){await p.goto(base+'?practice=1',{waitUntil:'domcontentloaded'});await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1',{waitUntil:'domcontentloaded'});await ready(p);}
async function lines(p){for(let i=0;i<16;i++){if(!await p.locator('#campaign-conversation').isVisible()||await p.locator('#campaign-choices button').count())return;await p.locator('#campaign-next').click();}throw Error('Conversation did not settle');}
async function move(p,piece,direction){await p.locator(`[data-piece="${piece}"]`).click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator(`[data-direction="${direction}"]`).click();await p.waitForFunction(()=>!SunJian.snapshot().busy);}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),errors=[];let p;try{
 p=await b.newPage({viewport:{width:1440,height:900}});p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));
 // Moving away from a lesson must not tell a player to drag nonexistent wood in the village.
 let s=D.fresh();s.phase='learning';s.frame='village';s.openingSeen=true;await seed(p,s);
 assert.match(await p.locator('#campaign-goal').innerText(),/回周伯家.*工作台/);
 await p.locator('[data-exit=room]').click();await ready(p);await p.locator('[data-hotspot=straight]').click();
 for(const m of solved('straight','dismantle').history)await move(p,m.piece,m.direction);
 await p.locator('#campaign-put').click();await lines(p);await ready(p);
 assert.match(await p.locator('#campaign-goal').innerText(),/交叠/,'objective advances immediately without leaving the scene');
 assert.equal(await p.locator('.illustrated-hotspot.current').getAttribute('data-hotspot'),'lap');
 await p.screenshot({path:out+'/next-lesson.png'});
 // Stored bars are picked from their painted box, not the empty middle of the table.
 s=learned();s.phase='learning';s.done=s.done.slice(0,2);s.runs=Object.fromEntries(Object.entries(s.runs).filter(([k])=>s.done.includes(k)));s.frame='workbench';await seed(p,s);
 const lap=p.locator('[data-hotspot=lap]');assert.match(await lap.getAttribute('aria-label'),/收好/);assert.equal(await lap.evaluate(e=>parseFloat(e.style.left)),90);
 await p.keyboard.down('h');await p.screenshot({path:out+'/stored-lap-hotspot.png'});await p.keyboard.up('h');await lap.click();assert.equal((await snapshot(p)).current,'object:lap');assert.equal(await p.evaluate(()=>SunJian.snapshot().mode),'assemble');await p.locator('#campaign-put').click();assert.equal((await snapshot(p)).state.done.length,2);
 // A premature pin remains editable after leaving and refreshing the shared puzzle.
 s=learned();s.phase='cave';s.scene='cave';s.frame='store-door';s.cave.completed=['mouth-latch'];s.runs['cave:mouth-latch']=solved('pinned','dismantle');await seed(p,s);
 await p.locator('#campaign-notes').click();await p.locator('[data-study="mouth-latch:assemble"]').click();assert.equal(await p.evaluate(()=>SunJian.snapshot().level),'store-door-latch');await move(p,'pin','zn');await move(p,'tenon','xp');
 assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,1);assert.match(await p.locator('#campaign-puzzle-status').innerText(),/撤销/);
 await p.locator('#campaign-put').click();await p.reload({waitUntil:'domcontentloaded'});await ready(p);await p.locator('#campaign-notes').click();await p.locator('[data-study="mouth-latch:assemble"]').click();
 assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,1);await p.locator('#campaign-undo').click();await move(p,'tenon','xp');await move(p,'pin','zn');assert.equal((await p.evaluate(()=>SunJian.snapshot())).removed.length,0);await p.locator('#campaign-put').click();assert.deepEqual((await snapshot(p)).state.cave.completed,['mouth-latch']);
 // Suspending a real lodging choice for free practice must retain the exact line.
 s=D.fresh();s.openingSeen=true;s.frame='room';Object.assign(s.prologue,{stage:'unpacked',invited:true,bagPlaced:true});await seed(p,s);await p.locator('[data-hotspot=zhou]').click();await lines(p);await p.locator('#campaign-choices').getByRole('button',{name:/村里有能借住/}).click();await p.locator('#campaign-next').click();
 const suspended=(await snapshot(p)).state.talk;assert.equal(suspended.id,'stay');assert.equal(suspended.line,1);await p.keyboard.press('Escape');await p.locator('#campaign-practice').click();await p.locator('#campaign-panel-actions').getByRole('button',{name:'返回主菜单'}).click();await p.locator('#campaign-continue').click();
 assert.deepEqual((await snapshot(p)).state.talk,suspended);assert.equal((await snapshot(p)).modal,'campaign-conversation');
 // The travel notebook returns to the pause menu, never to a world with hidden talk.
 await p.keyboard.press('Escape');await p.locator('#campaign-travel-notes').click();await p.locator('#campaign-panel-actions').getByRole('button',{name:'收好笔记'}).click();assert.equal((await snapshot(p)).modal,'campaign-menu');await p.locator('#campaign-continue').click();assert.deepEqual((await snapshot(p)).state.talk,suspended);
 // A rehearsal launched from paused dialogue resumes the original speaker in the original room.
 s=caveDone();s.phase='return';s.scene='village';s.frame='room';s.talk={id:'returned',line:1};await seed(p,s);await p.keyboard.press('Escape');await p.locator('#campaign-travel-notes').click();await p.locator('[data-study="route-case:assemble"]').click();assert.equal((await snapshot(p)).view,'puzzle');await p.locator('#campaign-put').click();await ready(p);
 assert.equal((await snapshot(p)).modal,'campaign-conversation');assert.equal((await snapshot(p)).state.talk.line,1);assert(!(await snapshot(p)).scene.enabled);assert.equal((await snapshot(p)).state.frame,'room');
 // Old orphaned dialogues are relocated safely instead of summoning an absent speaker.
 s.frame='shelter';await seed(p,s);assert.equal((await snapshot(p)).state.frame,'room');assert.equal((await snapshot(p)).modal,'campaign-conversation');assert.match((await snapshot(p)).scene.image,/room[^/]*day/);await p.screenshot({path:out+'/dialogue-resumed-at-home.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/continuity-verification.json',JSON.stringify({url:base,locationAwareObjectives:true,immediateTaskUpdate:true,storedHotspotMovesWithBars:true,pinRecoveryAfterRefresh:true,practiceRetainsTalk:true,nestedNotebookReturnsToMenu:true,replayResumesTalk:true,legacyOrphanTalkRelocated:true,errors},null,2));console.log('PASS 0.12.3 task/paint continuity, pin recovery, practice/dialogue resume, nested notebook and old orphan talk recovery');
 }catch(e){if(p&&!p.isClosed())await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
