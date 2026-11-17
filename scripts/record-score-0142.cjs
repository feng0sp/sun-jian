/* Capture the actual local score implementation, without substituting a renderer. */
const {chromium}=require('playwright'),fs=require('node:fs');
const {armAudioCapture,startAudioCapture,stopAudioCapture}=require('../tests/helpers/capture-audio.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/polish-0142/music';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome'}),results=[];try{for(const profile of ['journey','home','store','workshop','gathering']){
 const p=await b.newPage();await armAudioCapture(p);await p.goto(base+'?practice=1');await p.waitForFunction(()=>window.JourneyAtmosphere);await startAudioCapture(p);await p.keyboard.press('Shift');await p.evaluate(profile=>{JourneyAtmosphere.configure({active:true,night:false,profile,quiet:false,volume:.65});JourneyAtmosphere.sound(true);},profile);await p.waitForFunction(()=>JourneyAtmosphere.snapshot().running);
 await p.waitForTimeout(32000);const snapshot=await p.evaluate(()=>JourneyAtmosphere.snapshot());const file=out+'/'+profile+'.webm',capture=await stopAudioCapture(p,file);results.push({profile,file,capture,snapshot});await p.close();console.log('Captured',profile);
 }fs.writeFileSync(out+'/recordings.json',JSON.stringify({actualProductionAudio:true,noHumanListeningClaim:true,results},null,2));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
