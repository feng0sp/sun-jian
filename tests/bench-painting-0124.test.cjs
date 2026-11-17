const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {caveDone}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/campaign-0124';fs.mkdirSync(out,{recursive:true});
async function ready(p){await p.waitForFunction(()=>{const s=CampaignJourney.snapshot().scene;return s.available&&!s.loading&&!s.imageError;});}
async function move(p,piece,direction){await p.locator('[data-piece="'+piece+'"]').click();await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator('[data-direction="'+direction+'"]').click();await p.waitForFunction(()=>!SunJian.snapshot().busy);}
async function painting(p,name){await p.locator('#campaign-put').click();await ready(p);assert.match(await p.locator('.illustrated-art').getAttribute('src'),new RegExp('shelter-wide-'+name+'\\.webp'));await p.reload({waitUntil:'domcontentloaded'});await ready(p);assert.match(await p.locator('.illustrated-art').getAttribute('src'),new RegExp('shelter-wide-'+name+'\\.webp'));
await p.locator('[data-bench-toggle]').click();await p.locator('[data-bench-part=rails]').click();const text=await p.locator('.bench-study-card p').innerText();assert.match(text,name==='complete-cart'?/两根横梁连接/:['seat','left-pin','right-pin'].includes(name)?/座板已经贴齐.*木销还没装全/:name==='two-beams'?/两根横梁已经/:/一根横梁已经/);await p.locator('[data-bench-close]').click();await p.screenshot({path:out+'/bench-'+name+'.png'});}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));try{
for(const order of [['front-beam','rear-beam','left-pin','right-pin'],['rear-beam','front-beam','right-pin','left-pin']]){
const s=caveDone();s.phase='bench';s.scene='village';s.frame='shelter';await p.goto(base+'?practice=1',{waitUntil:'domcontentloaded'});await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1',{waitUntil:'domcontentloaded'});await ready(p);
await p.locator('[data-hotspot=bench]').click();await move(p,order[0],'yn');await painting(p,order[0]==='front-beam'?'far-beam':'near-beam');
await p.locator('[data-hotspot=bench]').click();await move(p,order[1],'yn');await painting(p,'two-beams');
await p.locator('[data-hotspot=bench]').click();await p.locator('#campaign-undo').click();await painting(p,order[0]==='front-beam'?'far-beam':'near-beam');
await p.locator('[data-hotspot=bench]').click();await move(p,order[1],'yn');await move(p,'seat','xn');await painting(p,'seat');
await p.locator('[data-hotspot=bench]').click();await move(p,order[2],'zn');await painting(p,order[2]);
await p.locator('[data-hotspot=bench]').click();await move(p,order[3],'zn');await painting(p,'complete-cart');assert.equal(await p.evaluate(()=>CampaignJourney.snapshot().state.phase),'farewell');
}
assert.deepEqual(errors,[]);fs.writeFileSync(out+'/bench-painting-verification.json',JSON.stringify({bothBeamOrders:true,bothPinOrders:true,partialRefresh:true,undoRestoresPainting:true,errors},null,2));console.log('PASS painted bench progress: both rail/pin orders, partial refresh, undo and completed scene');
}catch(e){await p.screenshot({path:out+'/bench-painting-failure.png'}).catch(()=>{});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});

