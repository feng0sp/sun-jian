const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=path.resolve('output/upgrade');fs.mkdirSync(out,{recursive:true});
const embedded=file=>'data:image/png;base64,'+fs.readFileSync(file).toString('base64');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:980}});await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.SunJian?.snapshot().renderer);
  for(const [i,name]of [[6,'三件入门锁'],[7,'六件鲁班锁']]){
   await page.locator(`[data-level="${i}"]`).click();await page.locator('#stage').screenshot({path:path.join(out,name+'.png')});
  }
  const rows=[['wooden-box','01 / 木匣','收薄外露底座，整理边框与接缝。'],['dovetail','02 / 燕尾','连贯的卯座表面，保留清晰的滑槽与止退木钥。'],['double-pin','03 / 双销','调整榫肩与销帽比例，以深浅木色区分锁合关系。']].map(([id,title,detail])=>`<section><h2>${title}</h2><p>${detail}</p><div class="pair">${['before','after'].map((phase,i)=>`<figure><figcaption>${i?'改后 · 0.4':'改前 · 0.3'}</figcaption><div class="crop"><img alt="${title}${i?'改后':'改前'}" src="${embedded('artifacts/upgrade/'+phase+'-'+id+'.png')}"></div></figure>`).join('')}</div></section>`).join('');
  const html=`<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>榫间 · 模型升级对比</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f3eb;color:#29382f;font-family:'Microsoft YaHei',sans-serif}main{max-width:1240px;padding:45px 40px;margin:auto}header{padding-bottom:25px;border-bottom:1px solid #cfd1c1}.eyebrow{font:11px Georgia;color:#a0784d;letter-spacing:3px}h1{font:34px SimSun,serif;letter-spacing:5px;margin:16px 0}header p,section>p{font-size:12px;color:#7c8172;line-height:1.8}section{margin:30px 0}h2{font:22px SimSun,serif}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}figcaption{font-size:11px;color:#6e785f;margin:12px 0}.crop{position:relative;width:100%;aspect-ratio:852/560;overflow:hidden;border:1px solid #dcddce;border-radius:4px}.crop img{position:absolute;width:169.0140845%;max-width:none;left:-33.0985915%;top:-38.9285714%;height:auto}.new img{width:100%;border:1px solid #dcddce;border-radius:4px}footer{border-top:1px solid #cfd1c1;padding-top:20px;font-size:12px;color:#7c8172}a{color:#536b51}@media(max-width:700px){main{padding:25px 18px}.pair{grid-template-columns:1fr}}</style><main><header><div class="eyebrow">SUN JIAN / MODEL STUDY / 0.4</div><h1>木作新貌</h1><p>整件外表面 · 微小倒角 · 自然木纹 · 柔和光影<br>重点模型升级与两套新增互锁关卡，均取自可实际游玩的游戏画面。</p></header>${rows}<section><h2>04 / 新增传统互锁关卡</h2><p>从三向入门到六木相抱，观察槽口，逐件解锁；两关均可拆开与合回。</p><div class="pair new">${['三件入门锁','六件鲁班锁'].map(n=>`<figure><figcaption>${n}</figcaption><img alt="${n}" src="${embedded(path.join(out,n+'.png'))}"></figure>`).join('')}</div></section><footer>八个主关卡 · 一个借位实验 · 游客直接游玩　<a href="https://sun-jian-wood-puzzle.beige-acorn-8677.chatgpt.site/">打开《榫间》</a></footer></main></html>`;
  const file=path.join(out,'模型升级对比.html');fs.writeFileSync(file,html);
  await page.setViewportSize({width:1240,height:1000});await page.goto('file:///'+file.replaceAll('\\','/'));await page.screenshot({path:path.join(out,'模型升级对比.png'),fullPage:true});
  console.log('Saved comparison HTML, PNG, and two playable-model screenshots in output/upgrade.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
