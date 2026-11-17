// Render the exact browser score for waveform QA and a shareable listening sample.
const {chromium}=require('playwright'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage();const result=await p.evaluate(async source=>{
  const offline=new OfflineAudioContext(1,48000*68,48000);let clock=0,schedule=null;const events={};
  const facade=new Proxy(offline,{get(target,key){if(key==='currentTime')return clock;if(key==='state')return'running';if(key==='resume'||key==='suspend')return()=>Promise.resolve();const v=target[key];return typeof v==='function'?v.bind(target):v;}});
  const root={AudioContext:function(){return facade;},addEventListener(){}},doc={hidden:false,addEventListener(name,fn){events[name]=fn;}};
  new Function('window','document','setInterval','clearInterval',source)(root,doc,fn=>(schedule=fn,1),()=>{});
  root.JourneyAtmosphere.configure({active:true,night:true,volume:.65});root.JourneyAtmosphere.sound(true);events.pointerdown({isTrusted:true});await Promise.resolve();await Promise.resolve();
  for(clock=8;clock<64;clock+=8)schedule();
  const buffer=await offline.startRendering(),samples=buffer.getChannelData(0);let peak=0,sum=0;const bytes=new Uint8Array(samples.length*2),view=new DataView(bytes.buffer);
  for(let i=0;i<samples.length;i++){peak=Math.max(peak,Math.abs(samples[i]));sum+=samples[i]*samples[i];const fade=Math.min(1,i/48000,(samples.length-i)/96000);view.setInt16(i*2,Math.round(Math.max(-1,Math.min(1,samples[i]*fade))*32767),true);}
  let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return {pcm:btoa(binary),peak,rms:Math.sqrt(sum/samples.length)};
 },fs.readFileSync('dist/journey-atmosphere.js','utf8'));
 const data=Buffer.from(result.pcm,'base64'),header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(data.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(48000,24);header.writeUInt32LE(96000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
 const out='output/experience-01211';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/rain-night-score.wav',Buffer.concat([header,data]));delete result.pcm;fs.writeFileSync(out+'/score-levels.json',JSON.stringify(result,null,2));if(result.peak>.95||result.rms<.001)throw Error('Unexpected score level');console.log('PASS original score rendered without clipping',result);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
