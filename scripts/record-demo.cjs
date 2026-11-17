const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../artifacts/video');fs.mkdirSync(dir,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1600,height:900},recordVideo:{dir,size:{width:1600,height:900}},deviceScaleFactor:1});
  const page=await context.newPage(),started=Date.now(),events=[];
  const wait=ms=>page.waitForTimeout(ms);
  await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.SunJian?.snapshot().renderer);
  await page.evaluate(()=>{
    const pointer=document.createElement('div');pointer.id='demo-cursor';pointer.innerHTML='<svg width="24" height="30" viewBox="0 0 24 30"><path d="M3 2v22l5-6 5 10 4-2-5-10h9z" fill="#f8f5e8" stroke="#29382f" stroke-width="1.8"/></svg>';Object.assign(pointer.style,{position:'fixed',left:'-100px',top:'-100px',zIndex:'10002',pointerEvents:'none'});document.body.append(pointer);document.addEventListener('pointermove',e=>{pointer.style.left=e.clientX+'px';pointer.style.top=e.clientY+'px';});
    const caption=document.createElement('div');caption.id='demo-caption';Object.assign(caption.style,{position:'fixed',zIndex:'10000',bottom:'15px',left:'50%',transform:'translateX(-50%)',padding:'12px 25px',background:'#29382fe8',color:'#efe7d5',fontFamily:'Microsoft YaHei,sans-serif',fontSize:'16px',borderRadius:'3px',boxShadow:'0 2px 15px #26342b22',minWidth:'620px',textAlign:'center',pointerEvents:'none'});document.body.append(caption);
    const intro=document.createElement('div');intro.id='demo-slate';Object.assign(intro.style,{position:'fixed',inset:'0',background:'#f6f3eb',display:'flex',alignItems:'center',justifyContent:'center',gap:'100px',zIndex:'10001'});
    intro.innerHTML='<div><p style="color:#8b927e;letter-spacing:4px;font:16px Georgia">THE ART OF JOINING</p><h1 style="font:100px SimSun,serif;color:#29382f;letter-spacing:18px;margin:26px 0">榫间</h1><p style="font:27px Microsoft YaHei,sans-serif;color:#7d8674">一榫一卯，皆有来处。</p><p style="margin-top:46px;font:18px Microsoft YaHei,sans-serif;color:#a55b36">榫卯结构 × 空间解谜</p><p style="font:15px Microsoft YaHei,sans-serif;color:#959b89">六关结构 / 拆开与合回 / 离线试玩</p></div><img src="assets/wooden-box.svg" width="520" style="border-radius:8px" alt="木匣结构">';document.body.append(intro);
  });
  const caption=async text=>{await page.evaluate(text=>document.getElementById('demo-caption').textContent=text,text);events.push({at:Date.now()-started,caption:text});};
  await wait(3500);await page.evaluate(()=>document.getElementById('demo-slate').remove());
  const orbit=async()=>{const r=await page.locator('#viewport canvas').boundingBox();await page.mouse.move(r.x+r.width*.30,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.46,r.y+r.height*.5,{steps:35});await page.mouse.up();await wait(1200);await page.locator('#reset-camera').click();await wait(400);};
  const move=async(piece,direction,text)=>{
    if(text)await caption(text);
    await page.locator(`[data-piece="${piece}"]`).click();await page.locator(`[data-direction="${direction}"]`).hover();await wait(600);await page.locator(`[data-direction="${direction}"]`).click();await page.waitForFunction(()=>!SunJian.snapshot().busy);events.push({at:Date.now()-started,piece,direction});await page.mouse.move(20,100);await wait(700);
  };
  const next=async()=>{await wait(800);await page.locator('#next-level').click();await wait(400);};
  await caption('观察木作：拖动旋转，找到榫头与卯眼的关系。');await orbit();
  await move('tenon','xp','方向约束：侧壁挡住横向移动，反馈标出阻挡构件。');await wait(1200);
  await move('tenon','yp','沿开口向上抽出，读懂第一处结构。');await next();
  await caption('半搭接：两根木条各让出一半厚度，交叠处仍保持平整。');await wait(1700);
  await move('upper','yp');await move('lower','xp');await next();
  await caption('穿销：先看见内部的锁定关系，再判断拆解顺序。');await page.locator('#xray').click();await page.locator('[data-piece="pin"]').click();await wait(2500);await page.locator('#xray').click();
  await move('pin','zp','先抽出穿销，榫头才获得向上的自由。');await move('tenon','yp');await next();
  await caption('燕尾：下宽上窄，斜面限制直接上拔。');await move('slide','yp');await wait(1200);
  await move('key','yp','移开止退木钥，再沿卯槽滑出燕尾榫。');await move('slide','xp');await next();
  await caption('双销：一根小销，锁住另一根主销。');await page.locator('#xray').click();await page.locator('[data-piece="crosspin"]').click();await wait(1700);await page.locator('#xray').click();
  await move('crosspin','xp','追踪约束链：横向小销 → 主穿销 → 榫头。');await move('pin','zp');await move('tenon','yp');await next();
  await caption('木匣：多个榫卯关系，共同决定一件木器的拆装。');await orbit();
  await move('lid','xp','先沿轨道滑出匣盖。');await move('front','yp','再移开形成轨道的前后侧板。');await move('back','yp');await move('left','yp','最后移开端板，保留匣底。');await move('right','yp');await wait(1200);await page.locator('[data-close="complete-dialog"]').click();
  await page.locator('#mode-assemble').click();await caption('合回：先立端板，再装侧板，最后沿轨道推入匣盖。');await wait(1800);
  await move('left','yn');await move('right','yn');await move('front','yn');await move('back','yn');await move('lid','xn');await wait(1500);await page.locator('[data-close="complete-dialog"]').click();
  await page.locator('#open-experiment').click();await caption('借位实验：先抬起木钥一格，让出滑木的退出路线。');await wait(1300);await page.locator('#action-step').click();await move('lift-key','yp');await move('slider','xp','滑木退出后，木帽移开，木钥才可以完整取出。');await move('lift-key','yp');await wait(900);await page.locator('[data-close="complete-dialog"]').click();
  await page.locator('#open-atlas').click();await caption('每一次松动，都有它的道理。把观察收进你的结构手记。');await wait(2400);await page.locator('[data-close="atlas-dialog"]').click();
  await page.evaluate(()=>{
    document.getElementById('demo-caption').remove();document.getElementById('demo-cursor').remove();const slate=document.createElement('div');Object.assign(slate.style,{position:'fixed',inset:'0',background:'#29382f',color:'#efe7d5',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:'10000'});slate.innerHTML='<h1 style="font:88px SimSun,serif;color:#efe7d5;letter-spacing:16px;margin:0 0 25px">榫间</h1><p style="font:26px SimSun,serif;letter-spacing:3px">在结构中，读懂木作。</p><p style="font:15px Microsoft YaHei,sans-serif;color:#b7c0a7;margin-top:42px">观察 / 推理 / 解构 / 归位</p><p style="font:13px Microsoft YaHei,sans-serif;color:#a2ae92;margin-top:20px">六关双模式 · 设计原型</p>';document.body.append(slate);
  });await wait(3500);
  const videoPath=await page.video().path();const elapsed=Date.now()-started;await context.close();await browser.close();
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({videoPath,elapsed,events},null,2));console.log(JSON.stringify({videoPath,elapsedSeconds:elapsed/1000}));
})().catch(e=>{console.error(e);process.exit(1)});
