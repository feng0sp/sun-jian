const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {D,P,E,C,solved,caveDone}=require('./helpers/campaign-fixtures.cjs');
const Next=require('../dist/campaign-continuation.js');
const Story=require('../dist/campaign-story.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const out=process.env.TEST_OUTPUT||'output/performance-0138/acting';
const key='sun-jian-campaign-v1';
const reading=p=>p.locator('#campaign-line').innerText();
const face=p=>p.locator('.painted-expression[data-expression]');

function room(talk){
 return {...D.fresh(),phase:'settle',frame:'room',openingSeen:true,prologue:{stage:'settled',invited:true,bagPlaced:true},talk};
}
function workshop(stage){
 const s={...caveDone(),phase:'complete',frame:'bench-seat',finished:true,benchChecked:true};
 s.runs.bench=solved('rain-shelter-bench','assemble');
 const c={...Next.fresh(),active:true,started:true,noticeSeen:true,departed:true,workshopSeen:true,reviewed:true,entryAccepted:true,designStarted:true,purpose:'repair',purposeChoice:'repair',run:solved('pinned','assemble')};
 if(stage==='service-review')Object.assign(c,{peerMet:true,variant:'side',serviceRun:solved('service-access-closed','dismantle'),serviceBackRun:solved('service-access-open','assemble'),serviceOutRun:solved('service-access-open','dismantle')});
 s.continuation=c;
 return s;
}
async function load(p,state){
 await p.goto(base+'?practice=1');
 await p.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[key,state]);
 await p.goto(base+'?journey=1');
 await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available);
}
async function checkFace(p,cue,actor){
 const target=face(p);
 await p.waitForFunction(c=>!!document.querySelector('[data-expression="'+c+'"]'),cue);
 const box=await target.boundingBox();
 const parent=await target.locator('..').boundingBox();
 const [x,y,w,h]=actor==='lin'?[360/1672,124/941,96/1672,104/941]:[292/1920,200/1080,81/1920,92/1080];
 for(const diff of [box.x-parent.x-parent.width*x,box.y-parent.y-parent.height*y,box.width-parent.width*w,box.height-parent.height*h])assert(Math.abs(diff)<1);
 const dialogue=await p.locator('#campaign-conversation .campaign-card').boundingBox();
 assert(box.y+box.height<dialogue.y||box.x+box.width<dialogue.x);
 return box;
}
async function main(){
 const old=room({id:'teacherMemory',line:3});old.storyRevision=6;
 assert.equal(D.restore(JSON.stringify(old),P,E,C).talk.line,0);
 old.talk={id:'road',line:1};assert.equal(D.restore(JSON.stringify(old),P,E,C).talk.line,1);
 const replies=['comfort','moving','repair'].map(choice=>{
  const s=workshop('peer');Object.assign(s.continuation,{stage:'purpose',purposeChoice:choice});
  return Next.resolve('continuationPurpose',s).lines.map(l=>l[1]);
 });
 assert.match(replies[0].join(''),/系鞋带/);assert.match(replies[1].at(-1),/手/);assert.match(replies[2].at(-1),/坏的那块/);
 assert.equal(new Set(replies.map(r=>r.at(-1))).size,3);
 assert.equal(Next.resolve('continuationServiceReflection',workshop('peer')),null);
 assert.match(Story.resolve('checked',{phase:'farewell',nightBenchSeen:true}).lines.at(-1)[1],/昨晚/);
 assert.doesNotMatch(Story.resolve('checked',{phase:'farewell'}).lines.at(-1)[1],/昨晚/);
 await fs.mkdir(out,{recursive:true});
 const b=await chromium.launch({channel:'chrome'});
 const p=await b.newPage({viewport:{width:1440,height:900}});
 const errors=[],layout=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await load(p,{...room({id:'teacherMemory',line:3}),storyRevision:6});
  assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.talk.line),0);
  assert.equal(await p.evaluate(k=>JSON.parse(localStorage.getItem(k+'-backup-before-dialogue7')).talk.line,key),3);
  await p.locator('#campaign-skip').click();
  for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
   await p.setViewportSize({width,height});
   layout.push({actor:'zhou',width,height,face:await checkFace(p,'zhou-smile','zhou')});
   await p.screenshot({path:path.join(out,'zhou-'+width+'.png')});
  }
  const punchline=await reading(p);await p.reload();await checkFace(p,'zhou-smile','zhou');assert.equal(await reading(p),punchline);
  await p.locator('#campaign-previous').click();assert.equal(await face(p).count(),0);
  await p.locator('#campaign-next').click();await checkFace(p,'zhou-smile','zhou');
  await p.keyboard.press('Escape');assert.equal(await face(p).count(),0);
  await p.locator('#campaign-continue').click();await checkFace(p,'zhou-smile','zhou');
  await p.locator('#campaign-choices button').first().click();await checkFace(p,'zhou-look','zhou');
  await p.locator('#campaign-choices button').last().click();assert.equal(await face(p).count(),0);
  // A missing optional drawing may never swallow the line, its choices or the neutral scene.
  await p.route('**/expressions/zhou-look.webp',req=>req.abort());
  await load(p,room({id:'invite',line:0}));await p.waitForFunction(()=>document.querySelector('#campaign-conversation:not([hidden])')&&!document.querySelector('.illustrated-stage.image-pending'));
  assert.equal(await face(p).count(),0);assert.match(await reading(p),/台前/);
  await p.locator('#campaign-choices button').last().click();assert.equal(await p.locator('#campaign-conversation').isVisible(),false);
  await p.unroute('**/expressions/zhou-look.webp');
  await load(p,workshop('peer'));await p.keyboard.press('Escape');assert.equal(await p.locator('#campaign-menu').isVisible(),true);await p.locator('#campaign-settings').click();await p.locator('#campaign-panel-actions').getByRole('button',{name:'返回',exact:true}).click();assert.equal(await p.locator('#campaign-menu').isVisible(),true);await p.locator('#campaign-continue').click();await p.getByRole('button',{name:/听听林岚/}).click();
  await p.locator('#campaign-next').click();await p.locator('#campaign-next').click();
  for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
   await p.setViewportSize({width,height});
   layout.push({actor:'lin',width,height,face:await checkFace(p,'lin-study','lin')});
   await p.screenshot({path:path.join(out,'lin-'+width+'.png')});
  }
  const leaves=p.locator('.workshop-leaf-shadow');
  assert.equal(await leaves.evaluate(el=>el.getAnimations().length),1);
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await leaves.evaluate(el=>el.getAnimations().length),0);
  assert.equal(await face(p).locator('img').evaluate(el=>el.getAnimations().length),0);
  await p.emulateMedia({reducedMotion:'no-preference'});
  await p.locator('#campaign-next').click();assert.equal(await face(p).count(),0);
  await p.locator('#campaign-next').click();await p.getByRole('button',{name:/拿起前置挡条/}).click();
  assert.equal(await leaves.evaluate(el=>el.getAnimations().length),0);
  assert.equal(await p.evaluate(()=>JourneyAtmosphere.snapshot().quiet),true);
  const reviewed=workshop('service-review');
  await load(p,reviewed);await p.getByRole('button',{name:/和林岚核对/}).click();await p.locator('#campaign-next').click();await checkFace(p,'lin-smile','lin');
  await p.reload();await checkFace(p,'lin-smile','lin');
  await p.locator('#campaign-previous').click();assert.equal(await face(p).count(),0);
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'verification.json'),JSON.stringify({base,layout,replies,oldBackup:true,rewindRefreshPause:true,optionalArtFailure:true,workshopReducedMotion:true,puzzleStopsLeaves:true,errors},null,2));
  console.log('PASS registered facial patches, both actors, missing art, dialogue restore, three purpose branches, workshop leaf light and stage gates');
 }catch(e){await p.screenshot({path:path.join(out,'failure.png')});throw e;}finally{await b.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
