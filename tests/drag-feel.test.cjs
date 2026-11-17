const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.TEST_URL||'http://127.0.0.1:4173';
fs.mkdirSync('output/drag-feel',{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.clock.install();await page.goto(url);await page.waitForFunction(()=>window.SunJian?.snapshot().renderer);await page.locator('#skip-tutorial').click();await page.locator('#viewport').scrollIntoViewIfNeeded();await page.clock.pauseAt(new Date(Date.now()+1000));
 const snap=()=>page.evaluate(()=>SunJian.snapshot()),screen=()=>page.evaluate(()=>SunJian.screen());
 const point=(m,d,amount)=>({x:m.start.x+(m.directions[d].unit.x-m.start.x)*amount,y:m.start.y+(m.directions[d].unit.y-m.start.y)*amount});
 async function hold(m,d,amount){await page.mouse.move(m.start.x,m.start.y);await page.mouse.down();const e=point(m,d,amount);await page.mouse.move(e.x,e.y,{steps:6});}
 let m=(await screen()).pieces.pin;await hold(m,'zp',.7);let a=await snap();assert(a.preview.distance>.4&&a.preview.distance<1);const before=a.poses.pin;
 await page.mouse.up();a=await snap();assert(a.returning);assert.deepEqual(a.poses.pin,before,'release never teleports');assert.equal(a.history.length,0);
 await page.clock.runFor(64);a=await snap();assert(a.poses.pin[2]>0&&a.poses.pin[2]<before[2],'monotonic return');
 m=(await screen()).pieces.pin;const caught=a.poses.pin;await page.mouse.move(m.start.x,m.start.y);await page.mouse.down();a=await snap();assert.equal(a.returning,null);assert.deepEqual(a.poses.pin,caught,'regrab retains current pose');
 const q=point(m,'zp',.3);await page.mouse.move(q.x,q.y);assert((await snap()).poses.pin[2]>caught[2],'regrab continues outward');await page.mouse.up();await page.clock.runFor(260);assert.deepEqual((await snap()).poses.pin,[0,0,0]);
 // Crossing the actual geometric exit commits while the button remains held.
 m=(await screen()).pieces.pin;await page.mouse.move(m.start.x,m.start.y);await page.mouse.down();await page.mouse.move(m.directions.zp.end.x,m.directions.zp.end.y,{steps:12});a=await snap();assert.deepEqual(a.removed,['pin']);assert.equal(a.history.length,1);assert(a.gesture.committed);assert.equal(a.preview,null);assert.equal(a.takeaways.length,1);assert(Math.abs(a.takeaways[0].position[2]-m.directions.zp.exitDistance)<.001,'collect at exact exit, never fling beyond it');
 const exitPose=a.takeaways[0].position,cam=a.camera;await page.mouse.move(m.directions.zp.end.x+300,m.directions.zp.end.y+180,{steps:8});assert.equal((await snap()).history.length,1);assert.deepEqual((await snap()).camera,cam,'held pointer cannot turn into orbit');await page.clock.runFor(64);assert.deepEqual((await snap()).takeaways[0].position,exitPose,'collection has no flight');
 await page.mouse.up();await page.clock.runFor(220);assert.equal((await snap()).takeaways.length,0);assert.equal((await snap()).history.length,1);await page.locator('#undo').click();assert.deepEqual((await snap()).removed,[]);
 // A fast, single pointer event has the same bounded extraction as a slow pull.
 m=(await screen()).pieces.pin;await hold(m,'zp',20);a=await snap();assert.equal(a.history.length,1);assert(Math.abs(a.takeaways[0].position[2]-m.directions.zp.exitDistance)<.001);await page.mouse.up();await page.locator('#restart').click();assert.equal((await snap()).takeaways.length,0);
 // Return cancellation and blocked pulling never commit or alter the puzzle offsets.
 m=(await screen()).pieces.pin;await hold(m,'zp',.7);await page.mouse.up();assert((await snap()).returning);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await snap()).returning,null);assert.deepEqual((await snap()).poses.pin,[0,0,0]);
 m=(await screen()).pieces.pin;await hold(m,'xn',2);a=await snap();assert(a.gesture.blocked);assert.equal(a.history.length,0);await page.mouse.up();await page.clock.runFor(250);assert.equal((await snap()).history.length,0);
 // Orthogonal pointer drift cannot change depth along the locked projected axis.
 m=(await screen()).pieces.pin;await hold(m,'zp',.6);const distance=(await snap()).preview.distance,v={x:m.directions.zp.unit.x-m.start.x,y:m.directions.zp.unit.y-m.start.y},len=Math.hypot(v.x,v.y),p=point(m,'zp',.6);await page.mouse.move(p.x-v.y/len*45,p.y+v.x/len*45);assert(Math.abs((await snap()).preview.distance-distance)<.025);await page.mouse.up();await page.clock.runFor(250);
 assert.deepEqual(errors,[]);fs.mkdirSync('output/drag-feel',{recursive:true});fs.writeFileSync('output/drag-feel/verification.json',JSON.stringify({url,verifiedAt:new Date().toISOString(),checks:['smooth rollback','catch returning piece','auto commit before release','no duplicate commit','no camera takeover','stationary collection','fast pull bounded at exit','blur rollback','collision stops','orthogonal drift invariant'],errors},null,2));console.log('PASS: follow-through, smooth return/regrab, immediate extraction, no launch, one commit, cancellation, projection drift.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
