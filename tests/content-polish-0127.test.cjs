const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D,learned}=require('./helpers/campaign-fixtures.cjs'),S=require('../dist/campaign-story.js');
for(const phase of ['morning','depart','return']){const s=learned();s.phase=phase;for(const spoken of [[],['dailyLife']]){s.spoken=spoken;assert(!S.resolve('dailyLife',s).lines.some(([,t])=>/等会儿.*碗筷/.test(t)));}}
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('output/qa-0127/layout',{recursive:true});try{
for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]){
 await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:4173/?practice=1');const s=D.fresh();s.phase='settle';s.openingSeen=true;s.frame='room';s.talk={id:'chair',line:1};
 await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto('http://127.0.0.1:4173/?journey=1');await p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading);await p.waitForTimeout(400);
 const boxes=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};return{art:r(document.querySelector('.illustrated-painting')),card:r(document.querySelector('#campaign-conversation .campaign-card')),buttons:[...document.querySelectorAll('#campaign-choices button')].map(r)};});
 assert.equal(boxes.buttons.length,4);assert(boxes.art.x>=0&&boxes.art.right<=width+1);assert(boxes.card.y>boxes.art.y+boxes.art.height*.32,'Zhou face remains above choices');assert(boxes.card.bottom<=height);for(const r of boxes.buttons)assert(r.y>=boxes.card.y&&r.bottom<=boxes.card.bottom);
 assert(await p.locator('#campaign-skip').isHidden());await p.screenshot({path:`output/qa-0127/layout/choices-${width}.png`});
 await p.locator('#campaign-choices').getByRole('button',{name:'先看看别的。'}).click();await p.locator('[data-hotspot=cup]').click();assert(await p.locator('#campaign-skip').isHidden());
}
assert.deepEqual(errors,[]);console.log('PASS time-aware dialogue, nonredundant end controls and three desktop dialogue layouts');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
