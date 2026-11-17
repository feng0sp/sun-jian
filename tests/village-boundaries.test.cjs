const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {D}=require('./helpers/campaign-fixtures.cjs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/campaign-0113';fs.mkdirSync(out,{recursive:true});
async function seed(p,position){const s=D.fresh();s.openingSeen=true;s.village.position=position;await p.goto(base+'?practice=1',{waitUntil:'domcontentloaded'});await p.evaluate(s=>localStorage.setItem('sun-jian-campaign-v1',JSON.stringify(s)),s);await p.goto(base+'?journey=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>CampaignJourney.snapshot().scene.available);}
const position=p=>p.evaluate(()=>CampaignJourney.snapshot().state.village.position);
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage({viewport:{width:1280,height:720}}),results=[];
 for(const [start,edge]of [[[-8,1.65,8.4],7.23],[[8,1.65,-4],-5.17]]){await seed(p,start);await p.keyboard.down('w');await p.waitForTimeout(1400);await p.keyboard.up('w');const end=await position(p);results.push({start,end});assert(end[2]>=edge-.01&&end[2]<edge+.15,'the visible neighboring house must block movement: '+JSON.stringify(end));}
 await seed(p,[-8,1.65,5]);const restored=await position(p);assert(restored[2]>=7.23||restored[2]<=2.77||restored[0]>=-5.77,'an old position inside a newly solid house recovers outside');
 await seed(p,[0,1.65,2]);await p.keyboard.down('a');await p.waitForFunction(()=>CampaignJourney.snapshot().state.village.position[0]<=-6);await p.keyboard.up('a');await p.keyboard.down('w');await p.waitForFunction(()=>CampaignJourney.snapshot().state.village.position[2]<=-5.5);await p.keyboard.up('w');const trail=await position(p);assert(trail[2]<=-5.5,'the intended stone path remains open');
 fs.writeFileSync(out+'/village-boundaries-verification.json',JSON.stringify({houses:results,restored,trail},null,2));console.log('PASS: both reachable neighboring houses are solid, old interior poses recover, and the main stone path stays open.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
