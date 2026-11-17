const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../dist/puzzle-core.js'),D=require('../dist/cave-data.js'),E=require('../dist/experience.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out='output/cave-010';
fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CaveJourney.snapshot());
async function walk(p,axis,value){
 const cur=(await snap(p)).state.position[axis];if(Math.abs(cur-value)<.08)return;
 const key=axis===0?(value>cur?'d':'a'):(value>cur?'s':'w');
 await p.keyboard.down(key);
 try{await p.waitForFunction(({axis,value,dir})=>{const pos=CaveJourney.snapshot().state.position[axis];return dir>0?pos>=value:pos<=value;},{axis,value,dir:Math.sign(value-cur)},{timeout:20000});}finally{await p.keyboard.up(key);}
}
async function move(p,piece,direction){
 await p.locator(`[data-piece="${piece}"]`).click();
 await p.locator('#precise-controls').evaluate(e=>e.open=true);
 await p.locator(`[data-direction="${direction}"]`).click();
 await p.waitForFunction(()=>!SunJian.snapshot().busy);await p.waitForTimeout(40);
}
async function solve(p){
 for(let guard=0;guard<12;guard++){
  const s=await p.evaluate(()=>SunJian.snapshot()),l=P.LEVELS.find(l=>l.id===s.level);
  if(s.removed.length===l.pieces.filter(p=>!p.fixed).length)return;
  const m=P.availableMoves(l,s.removed)[0];assert(m,'solvable');await move(p,m.piece,m.direction);
 }throw Error('not complete');
}
async function open(p,n){
 await walk(p,2,n.z+2.8);await walk(p,0,n.x);
 const xy=(await snap(p)).scene.nodes.find(x=>x.id===n.id).screen;
 await p.mouse.click(xy.x,xy.y);await p.waitForFunction(()=>CaveJourney.snapshot().view==='puzzle');
}
(async()=>{
 // Recovery of malformed and out-of-route saves never strands the player behind a closed gate.
 assert.equal(D.restore(JSON.stringify({version:1,completed:['exit-knot'],position:[0,1.65,-74]}),P,E).completed.length,0);
 assert(D.restore(JSON.stringify({version:1,position:[0,1.65,-74]}),P,E).position[2]>-7);
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  const ctx=await b.newContext({viewport:{width:1440,height:900},recordVideo:process.env.RECORD_CAVE?{dir:out+'/video',size:{width:1280,height:800}}:undefined}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'?cave=1');await p.locator('#cave-begin').click();await p.waitForTimeout(300);
  assert((await snap(p)).scene.available);
  await p.screenshot({path:out+'/area-1.png'});
  // Physical closed gate must stop a real movement input.
  await p.keyboard.down('w');await p.waitForTimeout(4200);await p.keyboard.up('w');
  assert((await snap(p)).state.position[2]>-7);
  await walk(p,2,-4.2);await p.keyboard.press('e');await p.waitForFunction(()=>CaveJourney.snapshot().view==='puzzle');
  const before=await p.evaluate(()=>JointGame.getRun());
  for(let i=0;i<3;i++)await p.locator('#quick-hint').click();
  await p.waitForTimeout(1500);assert.deepEqual((await p.evaluate(()=>JointGame.getRun())).history,before.history);
  await p.locator('#close-hint').click();
  // Short drag returns; long drag actually commits once.
  const info=await p.evaluate(()=>SunJian.screen().pieces.pin),start=info.start,end=info.directions.zp.end;
  await p.mouse.move(start.x,start.y);await p.mouse.down();await p.mouse.move(start.x+(end.x-start.x)*.08,start.y+(end.y-start.y)*.08,{steps:4});await p.mouse.up();await p.waitForTimeout(500);
  assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,0);
  await p.mouse.move(start.x,start.y);await p.mouse.down();await p.mouse.move(end.x,end.y,{steps:22});await p.mouse.up();await p.waitForTimeout(450);
  assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,1);
  await p.locator('#cave-put').click();await p.reload();await p.waitForFunction(()=>CaveJourney?.snapshot().scene.available);
  await open(p,D.nodes[0]);assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,1);
  await solve(p);assert.equal((await snap(p)).state.completed.length,1);
  await p.locator('#cave-mode').click();
  // Premature pin insertion is physically allowed but blocks the tenon. Undo must remove it.
  await move(p,'pin','zn');await move(p,'tenon','yn');await p.waitForTimeout(850);
  assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,1);
  assert.equal(await p.locator('#cave-undo').isEnabled(),true);assert.equal(await p.locator('#cave-recovery').isVisible(),true);
  await p.screenshot({path:out+'/recoverable-pin.png'});await p.locator('#cave-undo').click();
  assert.equal((await p.evaluate(()=>SunJian.snapshot())).history.length,0);
  await move(p,'tenon','yn');await move(p,'pin','zn');
  assert.equal((await p.evaluate(()=>SunJian.snapshot())).removed.length,0);
  await p.locator('#cave-put').click();
  for(let i=1;i<D.nodes.length;i++){
   await walk(p,0,0);
   if(i%2===0){await walk(p,2,D.nodes[i].z+7);await p.screenshot({path:out+`/area-${i/2+1}.png`});}
   await open(p,D.nodes[i]);
   if(i===3){await p.screenshot({path:out+'/three-lock.png'});}
   if(i===7)await p.screenshot({path:out+'/six-lock.png'});
   await solve(p);assert.equal((await snap(p)).state.completed.length,i+1);
   await p.locator('#cave-put').click();await p.waitForTimeout(500);
  }
  await walk(p,0,0);await walk(p,2,-71);await p.waitForFunction(()=>!document.getElementById('cave-end').hidden);
  await p.screenshot({path:out+'/ending.png'});assert((await snap(p)).state.finished);
  await p.locator('#cave-stay').click();await p.locator('#cave-notebook').click();assert.equal(await p.locator('#cave-note-list article').count(),8);await p.locator('#cave-notes-close').click();
  await p.locator('#cave-leave').click();assert.equal((await p.evaluate(()=>SunJian.snapshot())).context,'practice');
  assert.equal((await p.evaluate(()=>SunJian.snapshot())).cleared.length,0);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({url:base,completed:8,errors,realMovement:true,realDrag:true,prematurePinRecovery:true,refresh:true,practiceIsolated:true},null,2));
  await ctx.close();console.log('PASS: eight cave nodes via actual walking and UI; real drag, hint isolation, blocked gate, refresh, premature-pin recovery and ending.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
