/* Continuous recording from the checkpoint after the four learning tasks. */
const {chromium}=require('playwright'),fs=require('node:fs');
const {P,learned}=require('../tests/helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out='output/journey-0131/demo';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 const p=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
 const ready=()=>p.waitForFunction(()=>window.CampaignJourney&&!CampaignJourney.snapshot().scene.loading&&!CampaignJourney.snapshot().scene.imageError);
 const wait=()=>p.waitForTimeout(1550);
 async function press(selector){await p.locator(selector).click();await ready();await p.mouse.move(1405,875);}
 async function read(){for(let i=0;i<20&&await p.locator('#campaign-conversation').isVisible();i++){if(await p.locator('#campaign-choices button').count())return;await wait();await press('#campaign-next');}}
 async function sequence(){while(await p.evaluate(()=>!!CampaignJourney.snapshot().state.interlude)){await ready();await p.waitForTimeout(2400);await press('#campaign-interlude-next');}}
 async function solve(){for(let i=0;i<12;i++){
  const s=await p.evaluate(()=>SunJian.snapshot()),l=P.LEVELS.find(l=>l.id===s.level),assembly=s.mode==='assemble';if(assembly?!s.removed.length:s.removed.length===l.pieces.filter(p=>!p.fixed).length)return;
  function route(r){if(!r.length)return [];for(const m of P.availableInsertions(l,r)){const tail=route(r.filter(x=>x!==m.piece));if(tail)return[m,...tail];}return null;}
  const m=assembly?route(s.removed)?.[0]:P.availableMoves(l,s.removed)[0];if(!m)throw Error('No legal route');await p.locator(`[data-piece="${m.piece}"]`).click();await p.waitForTimeout(400);
  if(assembly){const xy=await p.evaluate(id=>SunJian.screen().pieces[id],m.piece),end=xy.directions[m.direction].end;await p.mouse.move(xy.start.x,xy.start.y);await p.mouse.down();await p.mouse.move(end.x,end.y,{steps:30});await p.mouse.up();await p.waitForFunction(n=>SunJian.snapshot().history.length===n,s.history.length+1);}
  else{await p.locator('#precise-controls').evaluate(e=>e.open=true);await p.locator(`[data-direction="${m.direction}"]`).click();}
  await p.waitForFunction(()=>!SunJian.snapshot().busy);
 }}
 await p.goto(base+'?practice=1');const s=learned();s.frame='room';s.spoken=['night'];s.nightBenchSeen=true;await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1');await ready();await press('[data-hotspot=rest]');await wait();await p.getByRole('button',{name:'休息到明早',exact:true}).click();await sequence();await press('[data-hotspot=zhou]');await read();await p.getByRole('button',{name:'我去拿。',exact:true}).click();await read();await press('[data-exit=store-door]');await read();
 for(const [frame,id]of [['store-door','mouth-latch'],['store-middle','rack-frame'],['store-sky','stone-box']]){if(await p.evaluate(()=>CampaignJourney.snapshot().state.frame)!==frame)await press(`[data-exit="${frame}"]`);await press(`[data-hotspot="cave:${id}"]`);await solve();await p.waitForTimeout(500);await press('#campaign-put');}
 await press('.illustrated-hotspots [data-hotspot=supplies]');await read();await p.getByRole('button',{name:'推着小车回村。',exact:true}).click();await p.getByRole('button',{name:'推车回村',exact:true}).click();await sequence();await press('[data-hotspot=zhou]');await read();await p.getByRole('button',{name:'好，先把料摆开。',exact:true}).click();await ready();await press('[data-hotspot=bench]');await solve();await p.locator('#campaign-completion').waitFor({state:'visible'});await wait();await press('[data-completion-return]');await press('[data-hotspot=zhou]');await read();await press('[data-hotspot=bench]');await sequence();await p.waitForTimeout(2500);await p.getByRole('button',{name:'再坐一会儿',exact:true}).click();await ready();await p.waitForTimeout(2500);await p.screenshot({path:out+'/quiet-ending.png'});const video=p.video();await p.close();await video.saveAs(out+'/journey-rest-to-farewell.webm');console.log('Recorded continuous rest-to-farewell demo, default silent');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
