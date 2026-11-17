const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {D,learned}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/context-0139/ui';
fs.mkdirSync(out,{recursive:true});
const snap=p=>p.evaluate(()=>CampaignJourney.snapshot());
async function ready(p){await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available&&!CampaignJourney.snapshot().scene.loading);}
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);}
async function lines(p){for(let i=0;i<14&&await p.locator('#campaign-conversation').isVisible();i++){if(await p.locator('#campaign-choices button').count())return;await p.locator('#campaign-next').click();}}
async function main(){
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900},acceptDownloads:true}),errors=[],layout=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'?journey=1');await ready(p);assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().enabled),false);
  await p.locator('#campaign-next').click();await p.locator('.companion-portrait>img').evaluate(i=>i.decode());
  for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
   await p.setViewportSize({width,height});const face=await p.locator('.companion-portrait').boundingBox(),card=await p.locator('#campaign-conversation .campaign-card').boundingBox();
   assert(face.x>=0&&face.y>=0&&face.x+face.width<=card.x&&card.x+card.width<=width+1);
   layout.push({width,height,face,card});await p.screenshot({path:out+'/xiaoxu-live-'+width+'.png'});
  }
  await lines(p);await p.locator('#campaign-ambience').click();await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);
  await p.locator('[data-hotspot="frame:village"]').click();await ready(p);await lines(p);
  await p.locator('[data-exit=zhou-door]').click();await ready(p);assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().rainScene),'courtyard');
  const knob=await p.locator('[data-hotspot=knock-door]').boundingBox();await p.mouse.click(knob.x+knob.width/2,knob.y+knob.height/2,{clickCount:2});
  assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().knocksPlayed),1);await p.locator('#campaign-previous').isDisabled();
  await lines(p);assert.equal((await snap(p)).state.prologue.invited,true);await p.reload();await ready(p);
  assert.equal((await snap(p)).state.prologue.invited,true);
  const msg=D.fresh();Object.assign(msg,{phase:'arrival',frame:'room',openingSeen:true,prologue:{stage:'unpacked',invited:true,bagPlaced:true},talk:{id:'stay',line:1}});
  await seed(p,msg);assert(await p.locator('#campaign-conversation.companion-message').isVisible());assert.equal(await p.locator('.companion-portrait').getAttribute('data-channel'),'message');await p.screenshot({path:out+'/xiaoxu-message.png'});
  await p.keyboard.press('Escape');await p.locator('#campaign-settings').click();
  if(await p.locator('#campaign-audio').innerText()==='音效开')await p.locator('#campaign-audio').click();
  await p.locator('#campaign-rain').selectOption('leaves');await p.locator('#campaign-rain-preview').click();await p.waitForFunction(()=>JourneyAtmosphere.snapshot().preview==='leaves'&&!JourneyAtmosphere.snapshot().previewLoading);
  assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().enabled),false);
  await p.locator('#campaign-rain-preview').click();assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().preview),null);
  const downloading=p.waitForEvent('download');await p.getByRole('button',{name:'下载旅程存档',exact:true}).click();const d=await downloading;await d.saveAs(out+'/exported-save.json');const saved=JSON.parse(fs.readFileSync(out+'/exported-save.json','utf8'));assert.equal(saved.save.storyRevision,9);assert(saved.save.roomObjects);assert.equal(saved.save.prologue.invited,true);
  const study=learned();study.phase='night';study.frame='tools-detail';study.pendingReflection=null;
  await seed(p,study);await p.locator('[data-hotspot="observe:tool-square"]').click();assert(await p.locator('[data-field-study]').isHidden());await p.locator('[data-field-square]').click();
  await p.getByRole('button',{name:'拿起角尺',exact:true}).click();await p.getByRole('button',{name:'把两边靠齐',exact:true}).click();await p.screenshot({path:out+'/square-check.png'});await p.getByRole('button',{name:'看看试配木料',exact:true}).click();assert.equal(await p.evaluate(()=>SunJian.snapshot().level),'offcut-corner-lap');
  await p.locator('#campaign-put').click();await ready(p);await p.reload();await ready(p);await p.keyboard.press('Escape');await p.locator('#campaign-settings').click();assert.equal(await p.locator('#campaign-rain').inputValue(),'auto');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({base,layout,liveAndMessage:true,knockExactlyOnce:true,invitationSurvivesRefresh:true,previewWhileMuted:true,progressExport:true,toolChecksAngleAndUsesContext:true,errors},null,2));
  console.log('PASS companion layout/channel, knock guard, real recording preview, progress download and square-to-wide-timber interaction');
 }catch(e){await p.screenshot({path:out+'/failure.png'});throw e;}finally{await b.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
