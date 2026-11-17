const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {P,E,D,solved,learned,caveDone}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/context-0139/objects';
fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);}
async function drag(p,piece,direction){
 await p.locator('[data-piece="'+piece+'"]').click();
 const approach=p.locator('[data-approach="'+direction+'"]');if(await approach.isVisible())await approach.click();
 const n=await p.evaluate(()=>SunJian.snapshot().history.length);
 await p.waitForFunction(()=>!SunJian.snapshot().busy);
 if(process.env.NO_WEBGL==='1'){await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction="'+direction+'"]').click();await p.waitForFunction(n=>SunJian.snapshot().history.length===n&&!SunJian.snapshot().busy,n+1);return;}
 const screen=await p.evaluate(id=>SunJian.screen().pieces[id],piece),end=screen.directions[direction].end;
 await p.mouse.move(screen.start.x,screen.start.y);await p.mouse.down();await p.mouse.move(end.x,end.y,{steps:30});await p.mouse.up();
 await p.waitForFunction(n=>SunJian.snapshot().history.length===n&&!SunJian.snapshot().busy,n+1);
}
async function solve(p){
 const s=await p.evaluate(()=>SunJian.snapshot());
 const moves=solved(s.level,s.mode).history;
 for(const m of moves.slice(s.history.length))await drag(p,m.piece,m.direction);
}
async function put(p,complete=true){
 if(complete){await p.locator('#campaign-completion').waitFor({state:'visible'});await p.locator('[data-completion-return]').click();}
 else await p.locator('#campaign-put').click();
 await ready(p);
}
async function main(){
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}}),errors=[],cycles=[];
 p.on('pageerror',e=>errors.push(e.message));
 if(process.env.NO_WEBGL==='1')await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args);};});
 try{
  const s=learned();s.phase='night';s.frame='workbench';s.pendingReflection=null;
  await seed(p,s);const formal=JSON.stringify((await snap(p)).state.runs);
  await p.screenshot({path:out+'/initial-after-lessons.png'});
  for(const id of ['straight','lap','pinned']){
   for(let i=0;i<2;i++){
    await p.locator('[data-hotspot="'+id+'"]').click();const mode=(await snap(p)).state.roomObjects[id].mode;
    await solve(p);await put(p);
    const a=await snap(p);assert.equal(JSON.stringify(a.state.runs),formal);
    const removed=a.scene.inventory[id].removed;assert.equal(removed.length,mode==='assemble'?0:P.LEVELS.find(l=>l.id===id).pieces.filter(x=>!x.fixed).length);
    await p.screenshot({path:out+'/'+id+'-'+mode+'.png'});
    cycles.push({id,mode,removed});await p.reload();await ready(p);
   }
  }
  // Both legal partial half-lap orders remain one physical object after refresh.
  for(const [piece,direction]of [['lower','yn'],['upper','yp']]){
   const v=learned();v.phase='night';v.frame='workbench';v.pendingReflection=null;v.roomObjects={lap:solved('lap','assemble')};
   await seed(p,v);await p.locator('[data-hotspot=lap]').click();await drag(p,piece,direction);await put(p,false);await p.reload();await ready(p);
   assert.deepEqual((await snap(p)).scene.inventory.lap.removed,[piece]);
   await p.screenshot({path:out+'/partial-'+piece+'.png'});
  }
  const day=learned();day.phase='morning';day.frame='room';day.pendingReflection=null;
  await seed(p,day);await p.screenshot({path:out+'/day-room.png'});await p.locator('[data-hotspot="frame:workbench"]').click();await ready(p);await p.screenshot({path:out+'/day-workbench.png'});
  for(const id of ['chair-rail-joint','offcut-corner-lap']){
   // Contextual teaching pieces use the same normal entry point as their associated object.
   const v=learned();v.phase='night';v.frame=id==='chair-rail-joint'?'chair-detail':'tools-detail';v.pendingReflection=null;
   await seed(p,v);await p.locator('[data-hotspot="observe:'+(id==='chair-rail-joint'?'chair-shoulder':'tool-offcut')+'"]').click();await p.locator('[data-field-study]').click();
   assert.equal(await p.evaluate(()=>SunJian.snapshot().level),id);await solve(p);await put(p);await p.reload();await ready(p);
   const entry=(await snap(p)).state.roomObjects[id];assert(E.restoreSession(JSON.stringify(entry),P).completed);
   await p.locator('[data-hotspot="observe:'+(id==='chair-rail-joint'?'chair-shoulder':'tool-offcut')+'"]').click();await p.locator('[data-field-study]').click();assert.equal(await p.evaluate(()=>SunJian.snapshot().mode),'assemble');await solve(p);await put(p);assert.deepEqual((await snap(p)).state.roomObjects[id].history.length,P.LEVELS.find(l=>l.id===id).pieces.filter(x=>!x.fixed).length);await p.screenshot({path:out+'/'+id+'-assembled.png'});
  }
  const gate=learned();gate.phase='cave';gate.scene='cave';gate.frame='store-door';gate.pendingReflection=null;
  await seed(p,gate);await p.locator('[data-hotspot="cave:mouth-latch"]').click();assert.equal(await p.evaluate(()=>SunJian.snapshot().level),'store-door-latch');
  await p.locator('[data-piece=tenon]').click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction=xn]').click();assert.equal(await p.evaluate(()=>SunJian.snapshot().history.length),0);
  await drag(p,'pin','zp');await put(p,false);await p.reload();await ready(p);await p.locator('[data-hotspot="cave:mouth-latch"]').click();await drag(p,'tenon','xn');await put(p);assert((await snap(p)).state.cave.completed.includes('mouth-latch'));
  await p.screenshot({path:out+'/door-open.png'});
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({base,cycles,allThreePhysicalCycles:true,partialLapBothOrders:true,formalProofUnchanged:true,contextualRealPointer:process.env.NO_WEBGL!=='1',noWebglDirectionFallback:process.env.NO_WEBGL==='1',realGateBar:true,gatePartialResume:true,errors},null,2));
  console.log('PASS physical room cycles, partial inventories, three contextual pointer puzzles, real blocked gate and resume');
 }catch(e){console.log(JSON.stringify(await snap(p)));await p.screenshot({path:out+'/failure.png'});throw e;}finally{await b.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
