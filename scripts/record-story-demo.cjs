const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const {lines,choose,settle,learn,after}=require('../tests/story-flow.cjs');
const baseOutput=process.env.STORY_OUTPUT||'output/lodging-story',output=path.resolve(baseOutput,'video');fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:output,size:{width:1440,height:900}}}),p=await context.newPage();
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await p.locator('#start-story').click();
 const wait=ms=>p.waitForTimeout(ms);
 await p.evaluate(()=>{const caption=document.createElement('div');caption.id='record-caption';Object.assign(caption.style,{position:'fixed',zIndex:10000,top:'145px',left:'50%',transform:'translateX(-50%)',padding:'8px 18px',font:'14px Microsoft YaHei,sans-serif',color:'#fff3dc',background:'#173442ef',borderRadius:'4px',pointerEvents:'none'});document.body.append(caption);});
 const caption=async text=>p.evaluate(t=>document.getElementById('record-caption').textContent=t,text);
 await caption('雨夜借宿 · 先安顿下来，慢慢认识周伯');await wait(1800);await p.locator('#story-skip').click();await lines(p);await wait(1500);await choose(p,'ask-stay');await p.locator('#story-next').click();await wait(1800);await lines(p);await wait(1200);
 await caption('生活物件可以体验，也可以追问');await p.locator('[data-hotspot=chair]').click();await wait(1700);await choose(p,'chair-sit');await wait(2300);await p.screenshot({path:path.join(baseOutput,'seated.png')});await lines(p);await wait(1200);await choose(p,'stand-up');await wait(1800);await lines(p);await wait(1200);await choose(p,'chair-close');
 await p.locator('[data-hotspot=tea]').click();await choose(p,'tea-pour');await wait(2200);await lines(p);await wait(1000);await choose(p,'tea-done');
 await caption('从闲聊认识传承经历，主动选择动手试试');await p.locator('[data-hotspot=zhou]').click();await choose(p,'zhou-teach');await wait(2300);await lines(p);await choose(p,'heritage-try');await lines(p);await wait(1000);await choose(p,'accept-learning');
 async function open(id){await p.locator(`[data-hotspot=${id}]`).click();await choose(p,'sample-task');await p.waitForFunction(()=>Journey.snapshot().state.view==='puzzle'&&!Journey.snapshot().moving);}
 async function drag(id,d){await p.locator('#viewport').scrollIntoViewIfNeeded();const m=(await p.evaluate(()=>SunJian.screen())).pieces[id];await p.mouse.move(m.start.x,m.start.y);await p.mouse.down();for(let i=1;i<=25;i++){await p.mouse.move(m.start.x+(m.directions[d].end.x-m.start.x)*i/25,m.start.y+(m.directions[d].end.y-m.start.y)*i/25);await wait(18);}await p.mouse.up();await wait(350);}
 const stages=[['straight',[['tenon','yp']]],['lap',[['upper','yp'],['lower','xp']]],['pinned',[['pin','zp'],['tenon','yp']]]];
 for(let i=0;i<stages.length;i++){await caption(['认识直榫：观察接触面','认识半搭接：观察上下关系','认识穿销：找到小件的约束'][i]);await open(stages[i][0]);for(const [id,d]of stages[i][1])await drag(id,d);await p.waitForFunction(n=>Journey.snapshot().state.beat===n,(i+1)*2);await wait(1000);await after(p);}
 await caption('合回第一件，把观察方法留在手记里');await open('straight');await p.locator('[data-piece=tenon]').click();await p.locator('[data-direction=yn]').click();await p.waitForFunction(()=>Journey.snapshot().state.beat===8);await wait(1500);await after(p);await caption('今晚就在小屋歇下 · 明早再出发');await wait(2300);
 const video=p.video();await context.close();const destination=path.resolve(baseOutput,'雨夜借宿-互动流程.webm');fs.copyFileSync(await video.path(),destination);console.log(destination);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
