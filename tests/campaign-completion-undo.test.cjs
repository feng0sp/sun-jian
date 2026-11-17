const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {P,E,C,caveDone}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/campaign-0113';
fs.mkdirSync(out,{recursive:true});
async function move(p,piece,direction){await p.locator(`[data-piece="${piece}"]`).click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator(`[data-direction="${direction}"]`).click();await p.waitForFunction(()=>!SunJian.snapshot().busy);}
async function open(p){await p.keyboard.press('e');await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle');}
const snapshot=p=>p.evaluate(()=>CampaignJourney.snapshot());
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const s=caveDone(0);s.cave.position=[.67,1.65,-4.5];s.cave.pitch=Math.atan2(.8-1.65,2.1);
 await p.goto(base+'?practice=1',{waitUntil:'domcontentloaded'});await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>CampaignJourney.snapshot().scene.available);
 await open(p);await move(p,'pin','zp');await move(p,'tenon','yp');await p.waitForTimeout(1200);assert((await p.locator('#campaign-puzzle-status').innerText()).includes('可以放回场景'),'completion guidance survives the status refresh');await p.locator('#campaign-undo').click();assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),1);assert(!(await p.locator('#campaign-puzzle-status').innerText()).includes('可以放回场景'));await p.locator('#campaign-put').click();
 assert.deepEqual((await snapshot(p)).state.cave.completed,[],'undoing the winning move cannot leave an open gate');
 await p.keyboard.down('w');await p.waitForTimeout(1400);await p.keyboard.up('w');assert((await snapshot(p)).state.cave.position[2]>-6.75,'physical gate stays closed');
 await p.keyboard.down('s');await p.waitForFunction(()=>CampaignJourney.snapshot().state.cave.position[2]>=-4.5);await p.keyboard.up('s');
 await open(p);assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),1);await move(p,'tenon','yp');await p.locator('#campaign-reset').click();assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);await p.locator('#campaign-put').click();assert.deepEqual((await snapshot(p)).state.cave.completed,[],'reset after a win cannot certify an empty run');
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>CampaignJourney.snapshot().scene.available);assert.deepEqual((await snapshot(p)).state.cave.completed,[]);
 await open(p);await move(p,'pin','zp');await move(p,'tenon','yp');await p.locator('#campaign-put').click();assert.deepEqual((await snapshot(p)).state.cave.completed,[C.nodes[0].id]);
 // A separate replay can be reset or undone without re-closing the certified main route.
 await p.keyboard.press('e');await p.locator('#campaign-panel-actions').getByRole('button',{name:'拆开看看',exact:true}).click();await p.waitForFunction(()=>CampaignJourney.snapshot().view==='puzzle');await move(p,'pin','zp');await move(p,'tenon','yp');await p.locator('#campaign-undo').click();await p.locator('#campaign-put').click();await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>CampaignJourney.snapshot().scene.available);
 const end=(await snapshot(p)).state;assert.deepEqual(end.cave.completed,[C.nodes[0].id]);assert(E.restoreSession(JSON.stringify(end.runs['cave:'+C.nodes[0].id]),P).completed);assert.equal(end.replays['cave:'+C.nodes[0].id+':dismantle'].history.length,1);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/completion-undo-verification.json',JSON.stringify({winningUndoClosesGate:true,winningResetClosesGate:true,partialResume:true,certifiedReplayUnaffected:true,errors},null,2));console.log('PASS: winning move undo/reset, physical gate, partial reload, and completed-route replay isolation.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
