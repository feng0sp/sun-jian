/* Real CC0 recordings, trusted preview, mode switching and offline script decoding. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {armAudioCapture,startAudioCapture,stopAudioCapture}=require('./helpers/capture-audio.cjs');
const out=path.resolve(process.env.TEST_OUTPUT||'output/context-0139/audio');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const pause=(page,time)=>page.waitForTimeout(time);
const code=path.resolve('dist/journey-atmosphere.js');
async function harness(page,offline=false){
 const html='<base href="'+(offline?pathToFileURL(path.resolve('dist/')).href+'/':base)+'"><button id="sound">声音开关</button><button id="leaves">试听树叶</button><button id="courtyard">试听院落</button><button id="stop">停止试听</button><button id="knock">敲门</button>';
 if(offline){const file=path.join(out,'offline-rain.html');await fs.writeFile(file,html);await page.goto(pathToFileURL(file).href);}else await page.setContent(html);
 await page.evaluate(()=>{
  const original=AudioBufferSourceNode.prototype.start;window.__rainBoundaries=[];
  AudioBufferSourceNode.prototype.start=function(...args){
   if(this.loop&&this.buffer?.duration>40){const values=this.buffer.getChannelData(0);let square=0;for(let i=1;i<512;i++)square+=(values[i]-values[i-1])**2;window.__rainBoundaries.push({duration:this.buffer.duration,jump:Math.abs(values[0]-values.at(-1)),naturalDifference:Math.sqrt(square/511)});}
   return original.apply(this,args);
  };
 });
 await page.addScriptTag({path:code});
 await page.evaluate(()=>{
  document.querySelector('#sound').onclick=()=>JourneyAtmosphere.sound(!JourneyAtmosphere.snapshot().enabled);
  document.querySelector('#leaves').onclick=()=>JourneyAtmosphere.previewRain('leaves');
  document.querySelector('#courtyard').onclick=()=>JourneyAtmosphere.previewRain('courtyard');
  document.querySelector('#stop').onclick=()=>JourneyAtmosphere.stopPreview();
  document.querySelector('#knock').onclick=()=>JourneyAtmosphere.knock();
 });
}
async function sample(page,ms=700){return page.evaluate(async time=>{let sum=0,peak=0,n=0;const end=performance.now()+time;while(performance.now()<end){await new Promise(r=>setTimeout(r,40));const a=__journeyAudioCapture.meter();sum+=a.rms*a.rms;peak=Math.max(peak,a.peak);n++;}return{rms:Math.sqrt(sum/n),peak};},ms);}
async function main(){
 await fs.mkdir(out,{recursive:true});
 const b=await chromium.launch({channel:'chrome'}),p=await b.newPage(),errors=[],requests=[];
 p.on('pageerror',error=>errors.push(error.message));p.on('request',request=>requests.push(request.url()));
 const snap=()=>p.evaluate(()=>JourneyAtmosphere.snapshot());
 const config=value=>p.evaluate(value=>JourneyAtmosphere.configure(value),value);
 try{
  await armAudioCapture(p);await harness(p);
  await config({active:true,night:true,profile:'journey',rainScene:'leaves'});
  await pause(p,200);assert.equal((await snap()).running,false);assert.equal(requests.filter(u=>/assets\/audio/.test(u)).length,0);
  await p.locator('#knock').click();assert.equal((await snap()).knocksPlayed,0,'muted knock stays silent');
  await startAudioCapture(p);await p.locator('#sound').click();
  await p.waitForFunction(()=>JourneyAtmosphere.snapshot().recording==='leaves');
  assert((await snap()).rainDuration>45);const leaves=await sample(p);
  const generation=(await snap()).phraseGeneration;await config({quiet:true});await pause(p,250);assert.equal((await snap()).phraseGeneration,generation);
  await p.locator('#knock').click();assert.equal((await snap()).knocksPlayed,1);await pause(p,600);
  await config({rainScene:'courtyard',quiet:false});await p.waitForFunction(()=>JourneyAtmosphere.snapshot().recording==='courtyard');
  await pause(p,850);assert.equal((await snap()).rainTails,0);assert((await snap()).rainDuration>170);const courtyard=await sample(p);
  const exterior=(await snap()).rainTarget;await config({interior:true,profile:'home'});await pause(p,700);
  assert((await snap()).rainTarget<exterior*.4);const indoor=await sample(p);
  await config({rainChoice:'leaves'});await p.waitForFunction(()=>JourneyAtmosphere.snapshot().recording==='leaves');
  await config({rainScene:'courtyard'});assert.equal((await snap()).recording,'leaves','manual preference overrides scene');
  await p.locator('#sound').click();await p.waitForFunction(()=>!JourneyAtmosphere.snapshot().running);
  assert.equal((await snap()).recording,null);
  await p.locator('#courtyard').click();await p.waitForFunction(()=>JourneyAtmosphere.snapshot().preview==='courtyard'&&!JourneyAtmosphere.snapshot().previewLoading);
  assert.equal((await snap()).enabled,false);assert.equal((await snap()).recording,null);const preview=await sample(p);
  assert(preview.rms>.0001);
  await p.locator('#stop').click();await p.waitForFunction(()=>!JourneyAtmosphere.snapshot().running);assert.equal((await snap()).preview,null);
  await p.locator('#sound').click();await p.waitForFunction(()=>JourneyAtmosphere.snapshot().recording==='leaves');
  const hidden=await b.newPage();await hidden.bringToFront();
  // Drive the visibility guard explicitly; headless tabs can all remain reported visible.
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await p.waitForFunction(()=>!JourneyAtmosphere.snapshot().running);await pause(p,500);const hiddenSignal=await sample(p,250);assert(hiddenSignal.rms<.000001);await hidden.close();
  await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await p.bringToFront();
  await p.waitForFunction(()=>JourneyAtmosphere.snapshot().recording==='leaves');
  const recording=await stopAudioCapture(p,path.join(out,'rain-knock-real-audio.webm'));
  assert(recording.bytes>15000);assert.deepEqual(recording.errors,[]);
  const boundaries=await p.evaluate(()=>window.__rainBoundaries);assert(boundaries.length>=2);
  for(const boundary of boundaries)assert(boundary.jump<4*boundary.naturalDifference+.0001,'loop seam follows neighbouring real samples');
  const q=await b.newPage();q.on('pageerror',error=>errors.push(error.message));await harness(q,true);
  await q.locator('#leaves').click();await q.waitForFunction(()=>JourneyAtmosphere.snapshot().preview==='leaves'&&!JourneyAtmosphere.snapshot().previewLoading);
  const offline=await q.evaluate(()=>JourneyAtmosphere.snapshot());assert.equal(offline.error,null);await q.locator('#stop').click();await q.close();
  const failed=await b.newPage();failed.on('pageerror',error=>errors.push(error.message));await harness(failed);
  await failed.route('**/assets/audio/rain-leaves.js*',request=>request.abort());
  await failed.evaluate(()=>JourneyAtmosphere.configure({active:true,night:true,rainScene:'leaves'}));await failed.locator('#sound').click();
  await failed.waitForFunction(()=>JourneyAtmosphere.snapshot().error==='leaves');
  assert.equal(await failed.evaluate(()=>JourneyAtmosphere.snapshot().running),true,'music survives missing rain asset');
  await failed.unroute('**/assets/audio/rain-leaves.js*');await failed.locator('#leaves').click();
  await failed.waitForFunction(()=>JourneyAtmosphere.snapshot().preview==='leaves'&&!JourneyAtmosphere.snapshot().previewLoading);
  await failed.locator('#stop').click();await failed.waitForFunction(()=>JourneyAtmosphere.snapshot().recording==='leaves');await failed.close();
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'rain-verification.json'),JSON.stringify({leaves,courtyard,indoor,preview,hiddenSignal,recording,offline,boundaries,firstSilent:true,noAssetRequestBeforeConsent:true,manualPreference:true,knockGated:true,sameMusicPhrase:true,localFileDecode:true,missingRainKeepsMusic:true,retryWorks:true,errors},null,2));
  console.log('PASS field recordings, lazy local loading, true audio sample, indoor attenuation, preview, knock and offline decoding');
 }catch(e){console.log(await snap());throw e;}finally{await b.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
