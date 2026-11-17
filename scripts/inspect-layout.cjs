const {chromium}=require('playwright');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});
(async()=>{
  const b=await chromium.launch({channel:'chrome',headless:true});
  for(const viewport of [{width:1440,height:980},{width:1280,height:800},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:320,height:640}]){
    const p=await b.newPage({viewport,deviceScaleFactor:1});
    await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>window.SunJian);
    await p.locator('button[data-level]').nth(5).click();await p.waitForTimeout(150);
    await p.screenshot({path:`artifacts/box-${viewport.width}.png`,fullPage:true});
    console.log(viewport,await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,controlsBottom:document.getElementById('directions').getBoundingClientRect().bottom})));
    await p.close();
  }
  await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
