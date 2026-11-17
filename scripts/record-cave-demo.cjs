const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.resolve('output/cave-010');fs.mkdirSync(path.join(output,'video'),{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const c=await b.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(output,'video'),size:{width:1440,height:900}}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.TEST_URL||'http://127.0.0.1:4173/')+'?cave=1');await p.waitForTimeout(1500);await p.screenshot({path:path.join(output,'intro-final.png')});await p.locator('#cave-begin').click();
 await p.keyboard.down('w');await p.waitForTimeout(2700);await p.keyboard.up('w');await p.waitForTimeout(600);await p.keyboard.press('e');await p.waitForFunction(()=>CaveJourney.snapshot().view==='puzzle');await p.waitForTimeout(700);
 async function pull(id,d){const info=await p.evaluate(({id,d})=>{const m=SunJian.screen().pieces[id];return {start:m.start,end:m.directions[d].end};},{id,d});await p.mouse.move(info.start.x,info.start.y);await p.mouse.down();for(let i=1;i<=30;i++){await p.mouse.move(info.start.x+(info.end.x-info.start.x)*i/30,info.start.y+(info.end.y-info.start.y)*i/30);await p.waitForTimeout(22);}await p.mouse.up();await p.waitForTimeout(500);}
 await pull('pin','zp');await pull('tenon','yp');await p.screenshot({path:path.join(output,'first-catch-separated.png')});await p.locator('#cave-put').click();await p.waitForTimeout(1700);
 await p.screenshot({path:path.join(output,'first-door-open.png')});await p.keyboard.down('w');await p.waitForTimeout(3200);await p.keyboard.up('w');
 await p.keyboard.down('a');await p.waitForTimeout(800);await p.keyboard.up('a');
 const xy=await p.evaluate(()=>CaveJourney.snapshot().scene.nodes.find(n=>n.id==='route-case').screen);await p.mouse.click(xy.x,xy.y);await p.waitForFunction(()=>CaveJourney.snapshot().view==='puzzle');await p.waitForTimeout(700);await pull('key','yp');await pull('slide','xp');await p.locator('#cave-put').click();await p.waitForTimeout(1200);await p.screenshot({path:path.join(output,'route-case-open.png')});
 await p.locator('#cave-notebook').click();await p.waitForTimeout(1800);await p.locator('#cave-notes-close').click();await p.waitForTimeout(800);
 assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>CaveJourney.snapshot().state.completed.length),2);
 const video=p.video();await c.close();fs.copyFileSync(await video.path(),path.join(output,'静洞寻木-行走与拆解.webm'));console.log('Recorded '+path.join(output,'静洞寻木-行走与拆解.webm'));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
