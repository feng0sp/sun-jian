/* Record the actual tab and game audio. No audio track is added from another source. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {armAudioCapture,startAudioCapture,stopAudioCapture}=require('../tests/helpers/capture-audio.cjs');
const {solved,caveDone}=require('../tests/helpers/campaign-fixtures.cjs');
const Next=require('../dist/campaign-continuation.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const out=path.resolve(process.env.TEST_OUTPUT||'output/performance-0138/demos');
const ffmpeg=process.env.FFMPEG||'C:/Users/13412/AppData/Local/oopz/ffmpeg.exe';
const delay=(p,ms)=>p.waitForTimeout(ms);
const ready=p=>p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available&&!CampaignJourney.snapshot().scene.loading);
async function read(p){
 for(let i=0;i<14&&await p.locator('#campaign-conversation').isVisible();i++){
  if(await p.locator('#campaign-choices button').count())return;
  await delay(p,1350);await p.locator('#campaign-next').click();
 }
 await ready(p);
}
async function press(p,selector){await p.locator(selector).click();await ready(p);}
async function panel(p,name){await p.locator('#campaign-panel-actions').getByRole('button',{name}).click();}
async function audioOn(p){
 await p.keyboard.press('Escape');
 await p.locator('#campaign-settings').click();await p.locator('#campaign-audio').click();
 await panel(p,'返回');await p.locator('#campaign-continue').click();
 await p.waitForFunction(()=>JourneyAtmosphere.snapshot().enabled&&JourneyAtmosphere.snapshot().running);
}
async function record(p,name,play,{minimumFrames=30}={}){
 const folder=path.join(out,name);fs.mkdirSync(folder,{recursive:true});
 const frames=path.join(folder,'frames');fs.mkdirSync(frames,{recursive:true});
 const cdp=await p.context().newCDPSession(p),images=[];
 let capturing=true,last=0;
 cdp.on('Page.screencastFrame',event=>{
  void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId});
  if(!capturing)return;
  const at=event.metadata.timestamp*1000;
  if(images.length&&at-last<48)return;
  last=at;
  const file=String(images.length).padStart(5,'0')+'.jpg';
  fs.writeFileSync(path.join(frames,file),Buffer.from(event.data,'base64'));
  images.push({file,at});
 });
 await startAudioCapture(p);
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:86,maxWidth:1280,maxHeight:720,everyNthFrame:1});
 await p.waitForFunction(()=>__journeyAudioCapture.status().state==='recording');
 await play();
 await delay(p,1600);
 const stopAt=await p.evaluate(()=>performance.timeOrigin+performance.now());
 capturing=false;await cdp.send('Page.stopScreencast');
 const sound=await stopAudioCapture(p,path.join(folder,'actual-audio.webm'));
 assert(sound.bytes>10000);assert.deepEqual(sound.errors,[]);assert(images.length>minimumFrames);
 // Screencast frames carry epoch timestamps. Repeat each real frame for its true duration.
 const concat=images.map((frame,i)=>{
  const until=i===images.length-1?stopAt:images[i+1].at;
  return "file 'frames/"+frame.file+"'\nduration "+Math.max(.001,(until-frame.at)/1000);
 }).join('\n')+"\nfile 'frames/"+images.at(-1).file+"'\n";
 fs.writeFileSync(path.join(folder,'frames.txt'),concat);
 const offset=(sound.recordedAtUtcMs-images[0].at)/1000;
 const movie=path.join(out,name+'.mp4');
 execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',path.join(folder,'frames.txt'),
  '-itsoffset',offset.toFixed(6),'-i',path.join(folder,'actual-audio.webm'),'-map','0:v','-map','1:a',
  '-vf','fps=24,format=yuv420p','-c:v','libx264','-preset','fast','-crf','23','-c:a','aac','-b:a','128k',
  '-t',((stopAt-images[0].at)/1000).toFixed(3),'-movflags','+faststart',movie]);
 execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-i',movie,'-f','null','-']);
 const {spawnSync}=require('node:child_process'); const log=spawnSync(ffmpeg,['-hide_banner','-i',movie,'-map','0:a:0','-af','volumedetect','-f','null','-'],{encoding:'utf8'});
 const info={movie,seconds:(stopAt-images[0].at)/1000,frames:images.length,audioOffsetSeconds:offset,
  sound,actualTabCapture:true,originalGameSound:true,decodePassed:true,audioListening:'No audio-input tool is available; actual track is provided for human listening.'};
 // Volume information is separately retained by FFmpeg stderr when run during release QA.
 fs.writeFileSync(path.join(folder,'audio-decode-volume.txt'),log.stderr);
 fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(info,null,2));
 return info;
}
async function drag(p,piece,direction,events){
 await p.locator('[data-piece="'+piece+'"]').click();
 const approach=p.locator('[data-approach="'+direction+'"]');if(await approach.isVisible())await approach.click();
 await delay(p,350);
 const start=await p.evaluate(()=>SunJian.snapshot().history.length);
 const screen=await p.evaluate(id=>SunJian.screen().pieces[id],piece),end=screen.directions[direction].end;
 await p.mouse.move(screen.start.x,screen.start.y);await p.mouse.down();await p.mouse.move(end.x,end.y,{steps:38});await p.mouse.up();
 await p.waitForFunction(n=>SunJian.snapshot().history.length===n&&!SunJian.snapshot().busy,start+1);
 events.push({piece,direction,at:Date.now()});await delay(p,550);
}
async function put(p){await p.locator('#campaign-completion').waitFor({state:'visible'});await delay(p,1000);await p.locator('[data-completion-return]').click();}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({channel:'chrome'}),results=[];
 try{
  for(const route of (process.env.DEMO_ROUTE?[process.env.DEMO_ROUTE]:['雨路进屋','工坊拆合'])){
   const p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(20000);const errors=[];
   p.on('pageerror',e=>errors.push(e.message));await armAudioCapture(p);
   if(route==='雨路进屋'){
    await p.goto(base+'?journey=1');await ready(p);await audioOn(p);
    results.push(await record(p,route,async()=>{
     await read(p);await press(p,'[data-hotspot="frame:village"]');await read(p);
     await press(p,'[data-exit="zhou-door"]');await delay(p,1600);
     await press(p,'[data-hotspot="knock-door"]');await read(p);await press(p,'[data-hotspot="enter-home"]');await read(p);
     await press(p,'[data-hotspot="put-bag"]');await read(p);
     await p.locator('#campaign-choices').getByRole('button',{name:'村里有能借住的地方吗？',exact:true}).click();await read(p);
     await p.locator('[data-hotspot="tools"]').click();await read(p);
     await p.locator('#campaign-choices').getByRole('button',{name:'您是跟谁学的木工？',exact:true}).click();await read(p);
     await p.screenshot({path:path.join(out,'周伯-讲旧事.png')});
    }));
   }else{
    const s={...caveDone(),phase:'complete',frame:'bench-seat',finished:true,benchChecked:true};
    s.runs.bench=solved('rain-shelter-bench','assemble');
    s.continuation={...Next.fresh(),started:true,active:true,noticeSeen:true,departed:true,workshopSeen:true,run:solved('pinned','assemble'),reviewed:true,entryAccepted:true,designStarted:true,purpose:'comfort',purposeChoice:'comfort'};
    await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);
    await p.goto(base+'?journey=1');await ready(p);await audioOn(p);
    const events=[];
    const result=await record(p,route,async()=>{
     await delay(p,1700);await panel(p,/听听林岚/);await read(p);await panel(p,/拿起前置挡条/);
     await delay(p,1300);await drag(p,'guard','yp',events);await drag(p,'pin','zp',events);await drag(p,'tenon','yp',events);await put(p);
     await panel(p,/把挡条固定在侧边/);await delay(p,1000);await panel(p,/合回侧置方案/);
     await drag(p,'tenon','yn',events);await drag(p,'pin','zn',events);await put(p);
     await panel(p,/取销，试着拆回/);await drag(p,'pin','zp',events);await drag(p,'tenon','yp',events);await put(p);
     await panel(p,/和林岚核对/);await p.locator('#campaign-next').click();await delay(p,2300);
     await p.screenshot({path:path.join(out,'林岚-回想失误.png')});await read(p);
    });
    result.actualPointerMoves=events;
    assert(result.sound.gameContexts>=2,'The real ambience and wood-effect contexts are both recorded.');
    results.push(result);
   }
   assert.deepEqual(errors,[]);await p.close();
  }
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({base,results},null,2));
  console.log(JSON.stringify(results.map(r=>({movie:r.movie,seconds:r.seconds,contexts:r.sound.gameContexts}))));
 }finally{await b.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={record,audioOn,ready,read,drag,put};
