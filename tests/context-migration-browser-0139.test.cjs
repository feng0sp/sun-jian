const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,C,P,E,learned,caveDone,solved}=require('./helpers/campaign-fixtures.cjs');
const Next=require('../dist/campaign-continuation.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/context-0139/migration';
fs.mkdirSync(out,{recursive:true});
const key='sun-jian-campaign-v1',backup=key+'-backup-before-context8';
async function main(){
 const browser=await chromium.launch({channel:'chrome'}),results=[];
 try{
  const reception=D.fresh();Object.assign(reception,{phase:'settle',frame:'room',openingSeen:true,prologue:{stage:'settled',invited:true,bagPlaced:true,legacy:false}});
  const lesson=learned();lesson.phase='learning';lesson.frame='workbench';delete lesson.runs['learn-straight-back'];lesson.runs['learn-pinned-out']={version:1,level:'pinned',mode:'dismantle',history:[{kind:'extract',piece:'pin',direction:'zp'}]};lesson.done=['learn-straight-out','learn-lap-out'];
  const door=learned();Object.assign(door,{phase:'cave',scene:'cave',frame:'store-door'});door.runs['cave:mouth-latch']=structuredClone(lesson.runs['learn-pinned-out']);
  const completed=caveDone();Object.assign(completed,{phase:'complete',frame:'bench-seat',finished:true,benchChecked:true});completed.runs.bench=solved('rain-shelter-bench','assemble');
  const workshop=structuredClone(completed);workshop.continuation={...Next.fresh(),started:true,active:true,noticeSeen:true,departed:true,workshopSeen:true,run:solved('pinned','assemble'),reviewed:true,entryAccepted:true,stage:'registered'};
  for(const [name,state]of Object.entries({reception,lesson,door,completed,workshop})){
   state.storyRevision=7;delete state.roomObjects;const raw=JSON.stringify(state),errors=[];
   const context=await browser.newContext(),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'?practice=1');await p.evaluate(({raw,key})=>{localStorage.setItem(key,raw);localStorage.setItem('sun-jian-v1','legacy-practice-sentinel');},{raw,key});
   await p.goto(base+'?journey=1');await p.waitForFunction(()=>window.CampaignJourney?.snapshot().scene.available);
   const migrated=await p.evaluate(({key,backup})=>({state:CampaignJourney.snapshot().state,raw:localStorage.getItem(backup),practice:localStorage.getItem('sun-jian-v1')}),{key,backup});
   assert.equal(migrated.raw,raw,'migration retains exact original JSON');assert.equal(migrated.practice,'legacy-practice-sentinel');
   const expected=D.restore(raw,P,E,C);assert.deepEqual(migrated.state.done,expected.done);const histories=r=>Object.fromEntries(Object.entries(r).map(([id,v])=>[id,{level:v.level,mode:v.mode,history:v.history}]));assert.deepEqual(histories(migrated.state.runs),histories(expected.runs));assert.equal(migrated.state.phase,expected.phase);assert.equal(migrated.state.continuation.stage,expected.continuation.stage);
   await p.reload();await p.waitForFunction(()=>!!window.CampaignJourney?.snapshot().scene.available);assert.equal(await p.evaluate(k=>localStorage.getItem(k),backup),raw);assert.deepEqual(errors,[]);
   results.push({name,phase:migrated.state.phase,done:migrated.state.done,continuation:migrated.state.continuation.stage,exactOriginalBackup:true,practiceUntouched:true});await context.close();
  }
  fs.writeFileSync(out+'/verification.json',JSON.stringify({base,results},null,2));console.log('PASS five old-save browser migrations: exact original backup, validated histories, practice isolation and refresh');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
