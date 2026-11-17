process.env.TEST_OUTPUT||='output/context-0139/demos';
const {record,audioOn,ready,read,drag,put}=require('./record-performance-0138.cjs');
const {chromium}=require('playwright');
const {learned}=require('../tests/helpers/campaign-fixtures.cjs');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=path.resolve(process.env.TEST_OUTPUT);
async function seed(p,s){await p.goto(base+'?practice=1');await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready(p);}
async function main(){
 const b=await chromium.launch({channel:'chrome'}),videos=[];
 const {armAudioCapture}=require('../tests/helpers/capture-audio.cjs');
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}});await armAudioCapture(p);
  await p.goto(base+'?journey=1');await ready(p);await audioOn(p);
  videos.push(await record(p,'小许与雨夜敲门',async()=>{
   await read(p);await p.locator('[data-hotspot="frame:village"]').click();await ready(p);await read(p);
   await p.locator('[data-exit=zhou-door]').click();await ready(p);await p.waitForTimeout(2200);await p.locator('[data-hotspot=knock-door]').click();await read(p);
   await p.locator('[data-hotspot=enter-home]').click();await ready(p);await read(p);await p.locator('[data-hotspot=put-bag]').click();await read(p);
   await p.locator('#campaign-choices').getByRole('button',{name:'村里有能借住的地方吗？',exact:true}).click();await p.locator('#campaign-next').click();await p.waitForTimeout(2500);
  }));
  await p.close();
  const q=await b.newPage({viewport:{width:1280,height:720}});await armAudioCapture(q);const s=learned();s.phase='night';s.frame='workbench';s.pendingReflection=null;await seed(q,s);await audioOn(q);
  const moves=[];videos.push(await record(q,'样木合回与大木构',async()=>{
   await q.waitForTimeout(1700);await q.locator('[data-hotspot=lap]').click();await drag(q,'lower','yp',moves);await drag(q,'upper','yn',moves);await put(q);await ready(q);
   await q.waitForTimeout(2000);await q.locator('[data-hotspot=lap]').click();await drag(q,'upper','yp',moves);await drag(q,'lower','yn',moves);await put(q);await ready(q);
   await q.waitForTimeout(2000);await q.locator('[data-exit=room]').click();await ready(q);await q.locator('[data-hotspot=tools]').click();await read(q);await q.locator('#campaign-choices').getByRole('button',{name:'走近工具角看看。',exact:true}).click();await ready(q);
   await q.locator('[data-hotspot="observe:tool-offcut"]').click();await q.locator('[data-field-study]').click();await q.waitForTimeout(1000);await drag(q,'upper','yp',moves);await drag(q,'lower','yn',moves);await put(q);
   await q.waitForTimeout(1500);
  }));await q.close();
  fs.writeFileSync(path.join(out,'context-verification.json'),JSON.stringify({videos,actualPointerMoves:moves},null,2));
  console.log(JSON.stringify(videos.map(v=>({movie:v.movie,seconds:v.seconds}))));
 }finally{await b.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
