const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,P,E,C,learned}=require('./helpers/campaign-fixtures.cjs'),S=require('../dist/campaign-story.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/opening-0130';fs.mkdirSync(out,{recursive:true});
const fresh=D.fresh();assert.equal(fresh.frame,'mountain-rain');assert.equal(D.canEnterFrame(fresh,'room'),false);assert.equal(S.resolve('stay',fresh),null);
const legacy=learned();legacy.storyRevision=3;delete legacy.prologue;legacy.frame='workbench';const migrated=D.restore(JSON.stringify(legacy),P,E,C);assert.equal(migrated.frame,'workbench');assert.equal(migrated.done.length,4);assert(migrated.prologue.legacy);assert.equal(migrated.talk,null);
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);}
async function read(p){let n=0;while(await p.locator('#campaign-conversation').isVisible()){if(++n>25)throw Error('dialogue loop');if(await p.locator('#campaign-choices button').count()){await ready(p);return;}await p.locator('#campaign-next').click();}await ready(p);}
async function snap(p){return p.evaluate(()=>CampaignJourney.snapshot());}
async function route(p,shelter=false,refresh=false){
 await read(p);assert.equal((await snap(p)).state.frame,'mountain-rain');await p.locator('[data-hotspot="frame:village"]').click();await read(p);assert.equal((await snap(p)).state.frame,'village');
 if(shelter){await p.locator('[data-exit=shelter]').click();await ready(p);await p.locator('[data-hotspot=bench]').click();await read(p);await p.locator('[data-exit="zhou-door"]').click();}else await p.locator('[data-exit="zhou-door"]').click();await ready(p);
 assert.equal((await snap(p)).state.prologue.invited,false);assert.equal(await p.locator('[data-hotspot=enter-home]').count(),0);await p.screenshot({path:out+'/door-before-knock.png'});await p.locator('[data-hotspot=knock-door]').click();await read(p);assert.equal((await snap(p)).state.prologue.invited,true);
 if(refresh){await p.reload();await ready(p);assert.equal((await snap(p)).state.prologue.invited,true);assert.equal((await snap(p)).state.frame,'zhou-door');}
 await p.locator('[data-hotspot=enter-home]').click();await read(p);assert.equal((await snap(p)).state.frame,'room');assert.equal((await snap(p)).state.prologue.bagPlaced,false);assert.doesNotMatch((await snap(p)).scene.image,/room-night-bag/);
 await p.locator('[data-hotspot=put-bag]').click();await read(p);assert.equal((await snap(p)).state.prologue.bagPlaced,true);assert.match((await snap(p)).scene.image,/room-night-bag/);assert(await p.locator('#campaign-choices button').count()>0,'choices do not skip themselves');await p.screenshot({path:out+'/room-bag-choice.png'});
 await p.locator('#campaign-choices').getByRole('button',{name:/能借住/}).click();await read(p);assert.equal((await snap(p)).state.phase,'settle');
}
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900},offline:process.env.OFFLINE==='1'}),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.goto(base+'?practice=1');await p.evaluate(()=>localStorage.removeItem('sun-jian-campaign-v1'));await p.goto(base+'?journey=1');await ready(p);await p.screenshot({path:out+'/mountain-opening.png'});await route(p,true,true);
 await p.reload();await ready(p);assert.equal((await snap(p)).state.phase,'settle');assert.match((await snap(p)).scene.image,/room-night-bag/);
 await p.locator('[data-hotspot=zhou]').click();await read(p);await p.locator('#campaign-choices').getByRole('button',{name:/我能试试/}).click();await read(p);await p.locator('#campaign-choices').getByRole('button',{name:/动手了/}).click();await ready(p);await p.locator('[data-hotspot=straight]').click();assert.equal((await snap(p)).view,'puzzle');await p.locator('#campaign-put').click();await ready(p);
 // Play the direct route in a fresh context; the earlier journey stays paused.
 await p.locator('#campaign-pause').click();
 assert.equal(await p.locator('#campaign-rewatch').count(),0);
 assert(!(await p.locator('#campaign-chapter-select').isVisible()));
 const direct=await b.newPage({viewport:{width:1440,height:900}});
 await direct.goto(base+'?journey=1');await route(direct,false,true);await direct.close();
 await p.locator('#campaign-continue').click();await ready(p);assert.equal((await snap(p)).state.phase,'learning');
 // Skip only the mountain; an invitation is still required.
 await p.goto(base+'?practice=1');await p.evaluate(()=>localStorage.removeItem('sun-jian-campaign-v1'));await p.goto(base+'?journey=1');await ready(p);await p.locator('#campaign-opening-skip').click();await read(p);assert.equal((await snap(p)).state.frame,'village');assert.equal((await snap(p)).state.prologue.invited,false);assert.equal((await snap(p)).state.phase,'arrival');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({directRoute:true,shelterRoute:true,invitationGate:true,bagState:true,refresh:true,voluntaryLearning:true,firstRunChapterGate:true,skipKeepsChoices:true,legacyProgress:true,errors},null,2));console.log('PASS opening routes, invitation, bag, refresh, learning, first-run chapter gate and skip');
}catch(e){console.log('STATE',JSON.stringify(await snap(p)));await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
