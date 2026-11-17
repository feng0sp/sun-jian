/* Bounded real-browser audio endurance test; never touches a player's profile. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D}=require('../tests/helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/dialogue-audio-01310/soak';
const minutes=Math.max(1,Math.min(90,Number(process.env.SOAK_MINUTES)||30));fs.mkdirSync(out,{recursive:true});
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available&&!CampaignJourney.snapshot().scene.loading);}
async function main(){
 const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],logs=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  const connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect,connected=new Set();let peak=0;
  AudioNode.prototype.connect=function(...args){const r=connect.apply(this,args);connected.add(this);peak=Math.max(peak,connected.size);return r;};
  AudioNode.prototype.disconnect=function(...args){const r=disconnect.apply(this,args);if(!args.length)connected.delete(this);return r;};
  window.__audioGraph=()=>({connected:connected.size,peak});
 });
 const started=Date.now();let interactions=0,up=true;
 try{
  await p.goto(base+'?practice=1');const s=D.fresh();Object.assign(s,{openingSeen:true,prologue:{stage:'settled',invited:true,bagPlaced:true},phase:'settle',frame:'room',pendingReflection:null,talk:{id:'teacherMemory',line:0}});s.settings.sound=true;
  await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);await p.keyboard.press('Shift');await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);
  const formal=JSON.stringify(await p.evaluate(()=>CampaignJourney.snapshot().state.runs)),end=Date.now()+minutes*60000;
  let nextLog=0,nextPause=Date.now()+240000,nextHide=Date.now()+330000,nextSize=Date.now()+450000;
  while(Date.now()<end){
   if(await p.locator('#campaign-next').isHidden())up=false;if(await p.locator('#campaign-previous').isDisabled())up=true;
   await p.locator(up?'#campaign-next':'#campaign-previous').click();interactions++;await p.waitForTimeout(400);
   const a=await p.evaluate(()=>JourneyAtmosphere.snapshot()),graph=await p.evaluate(()=>__audioGraph());
   assert.equal(a.dialogueCue.voices,0,'short cue releases all nodes');assert.equal(a.running,true);assert(graph.connected<85,'audio graph remains bounded');assert.deepEqual(errors,[]);
   if(Date.now()>nextPause){
    await p.keyboard.press('Escape');await p.locator('#campaign-settings').click();await p.locator('#campaign-dialogue-sound').uncheck();await p.locator('#campaign-dialogue-sound').check();await p.locator('#campaign-audio').click();await p.waitForTimeout(400);await p.locator('#campaign-audio').click();await p.locator('#campaign-panel-actions').getByRole('button',{name:'返回',exact:true}).click();await p.locator('#campaign-continue').click();await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);nextPause=Date.now()+240000;
   }
   if(Date.now()>nextHide){
    const n=(await p.evaluate(()=>JourneyAtmosphere.snapshot())).dialogueCue.played;
    await p.evaluate(()=>{window.__hidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(1800);
    assert.equal((await p.evaluate(()=>JourneyAtmosphere.snapshot())).dialogueCue.voices,0);
    await p.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);assert.equal((await p.evaluate(()=>JourneyAtmosphere.snapshot())).dialogueCue.played,n);nextHide=Date.now()+330000;
   }
   if(Date.now()>nextSize){await p.setViewportSize(interactions%2?{width:1280,height:720}:{width:1920,height:1080});nextSize=Date.now()+450000;}
   if(Date.now()>nextLog){logs.push({elapsedSeconds:(Date.now()-started)/1000,interactions,audio:a,graph});fs.writeFileSync(out+'/progress.json',JSON.stringify({status:'running',minutes,startedAt:new Date(started).toISOString(),logs},null,2));nextLog=Date.now()+60000;}
   await p.waitForTimeout(2600);
  }
  assert.equal(JSON.stringify(await p.evaluate(()=>CampaignJourney.snapshot().state.runs)),formal);await p.screenshot({path:out+'/final.png'});
  await p.locator('#campaign-talk-sound').click();await p.waitForTimeout(100);const final=await p.evaluate(()=>JourneyAtmosphere.snapshot());assert.equal(final.dialogueCue.voices,0);assert.equal(final.running,false);
  const result={status:'passed',requestedMinutes:minutes,wallSeconds:(Date.now()-started)/1000,startedAt:new Date(started).toISOString(),finishedAt:new Date().toISOString(),interactions,formalProofUnchanged:true,final,logs,errors};fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2));fs.writeFileSync(out+'/progress.json',JSON.stringify({status:'passed',wallSeconds:result.wallSeconds,interactions},null,2));console.log('PASS',result.wallSeconds,'seconds,',interactions,'real dialogue interactions, bounded graph, no stale cue or history mutation');
 }catch(e){fs.writeFileSync(out+'/failure.json',JSON.stringify({error:String(e),logs,errors},null,2));fs.writeFileSync(out+'/progress.json',JSON.stringify({status:'failed',error:String(e),seconds:(Date.now()-started)/1000}));throw e;}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
