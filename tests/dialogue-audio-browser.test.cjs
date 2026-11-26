const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {D,learned}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/dialogue-audio-01310';
fs.mkdirSync(out,{recursive:true});
const audio=p=>p.evaluate(()=>JourneyAtmosphere.snapshot());
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available&&!CampaignJourney.snapshot().scene.loading);}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);}
async function sound(p){await p.keyboard.press('Shift');if(!(await audio(p)).enabled){await settings(p);await p.locator('#campaign-audio').click();await resume(p);}await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);}
async function settings(p){await p.keyboard.press('Escape');await p.locator('#campaign-settings').click();}
async function resume(p){await p.locator('#campaign-panel-actions').getByRole('button',{name:'返回',exact:true}).click();await p.locator('#campaign-continue').click();}
async function main(){
 const b=process.env.SUNJIAN_PACKAGED_EXE?await require('./helpers/desktop-browser.cjs')():await chromium.launch({channel:'chrome'}),p=await b.newPage({offline:process.env.OFFLINE==='1',viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'?journey=1');await ready(p);assert.equal((await audio(p)).enabled,false);await p.locator('#campaign-next').click();assert.equal((await audio(p)).dialogueCue.played,0);
  await sound(p);const before=(await audio(p)).dialogueCue.played;await p.locator('#campaign-next').click();let a=await audio(p);assert.equal(a.dialogueCue.last.actor,'xiaoxu');assert.equal(a.dialogueCue.played,before+1);const phrase=a.phraseGeneration;
  await p.waitForTimeout(1150);assert.equal((await audio(p)).dialogueCue.played,before+1,'render/tick cannot repeat cue');assert.equal((await audio(p)).dialogueCue.voices,0);
  await p.locator('#campaign-previous').click();assert.equal((await audio(p)).dialogueCue.last.actor,'player');assert.equal((await audio(p)).phraseGeneration,phrase,'turning a line preserves music phrase');
  const n=(await audio(p)).dialogueCue.played;await p.locator('#campaign-next').dispatchEvent('keydown',{key:'Enter',repeat:true,bubbles:true});assert.equal((await audio(p)).dialogueCue.played,n);
  await p.locator('#campaign-skip').click();assert.equal((await audio(p)).dialogueCue.played,n,'skip does not chatter through omitted lines');await p.waitForTimeout(40);assert.equal((await audio(p)).dialogueCue.voices,0);
  const message=D.fresh();Object.assign(message,{phase:'arrival',frame:'room',openingSeen:true,prologue:{stage:'unpacked',invited:true,bagPlaced:true},talk:{id:'stay',line:0}});
  await seed(p,message);await sound(p);await p.locator('#campaign-next').click();assert.deepEqual((await audio(p)).dialogueCue.last,{actor:'xiaoxu',channel:'message'});
  await settings(p);await p.locator('#campaign-dialogue-sound').uncheck();await resume(p);const muted=(await audio(p)).dialogueCue.played;await p.locator('#campaign-next').click();assert.equal((await audio(p)).dialogueCue.played,muted);assert.equal((await audio(p)).running,true,'separate dialogue switch leaves music available');
  await p.reload();await ready(p);assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.settings.dialogueSound),false);
  await settings(p);await p.locator('#campaign-dialogue-sound').check();await resume(p);await sound(p);await p.locator('#campaign-previous').click();assert.equal((await audio(p)).dialogueCue.last.actor,'xiaoxu');
  await p.evaluate(()=>{window.__hidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden});document.dispatchEvent(new Event('visibilitychange'));});
  await p.waitForFunction(()=>!JourneyAtmosphere.snapshot().running);const hidden=(await audio(p)).dialogueCue.played;await p.waitForTimeout(40);assert.equal((await audio(p)).dialogueCue.voices,0);
  await p.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);assert.equal((await audio(p)).dialogueCue.played,hidden,'foreground does not replay old cue');
  await settings(p);await p.locator('#campaign-audio').click();await resume(p);await p.locator('#campaign-next').click();assert.equal((await audio(p)).dialogueCue.played,hidden,'master mute also gates dialogue');
  const lesson=learned();lesson.frame='workbench';lesson.pendingReflection=null;await seed(p,lesson);const formal=JSON.stringify(await p.evaluate(()=>CampaignJourney.snapshot().state.runs));await sound(p);await p.locator('[data-hotspot=straight]').click();await p.locator('[data-piece=tenon]').click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction=yp]').click();await p.locator('#campaign-completion').waitFor({state:'visible'});assert.equal((await audio(p)).dialogueCue.last.actor,'zhou');assert.equal(JSON.stringify(await p.evaluate(()=>CampaignJourney.snapshot().state.runs)),formal);
  await p.screenshot({path:out+'/zhou-completion.png'});await p.locator('[data-completion-observe]').click();await p.waitForTimeout(40);assert.equal((await audio(p)).dialogueCue.voices,0);
  const rendered=await p.evaluate(async()=>{
   const results=[];
   for(const speaker of ['周伯','小许','林岚','我','小许（消息）']){
    const ctx=new OfflineAudioContext(1,24000,48000),fx=DialogueSound.create(ctx,ctx.destination);fx.play(speaker,'一句短话。');const buffer=await ctx.startRendering(),data=buffer.getChannelData(0);let sum=0,peak=0,tail=0;for(let i=0;i<data.length;i++){sum+=data[i]**2;peak=Math.max(peak,Math.abs(data[i]));if(i>12000)tail=Math.max(tail,Math.abs(data[i]));}results.push({speaker,rms:Math.sqrt(sum/data.length),peak,tail});
   }return results;
  });
  for(const r of rendered){assert(r.rms>.002&&r.peak<.25,r.speaker+' has bounded real samples');assert(r.tail<.00001);}
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({base,firstMuted:true,characterAndMessageCues:true,skipSilent:true,heldKeyGuard:true,singleCuePerPresentation:true,musicPhrasePreserved:true,separateSwitchAndRefresh:true,masterMuteAndBackgroundStop:true,noBackgroundReplay:true,completionZhou:true,formalProofUnchanged:true,rendered,errors},null,2));console.log('PASS dialogue audio: real samples, per-line/actor/message, skip, mute, background, music continuity, completion and save');
 }catch(e){await p.screenshot({path:out+'/failure.png'});console.log(await audio(p));throw e;}finally{await b.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
