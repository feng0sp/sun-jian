const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:64,height:64},deviceScaleFactor:4});await p.goto(pathToFileURL(path.resolve(__dirname,'../dist/icon.svg')).href);await p.screenshot({path:path.resolve(__dirname,'../artifacts/icon.png'),omitBackground:true});await b.close();})().catch(e=>{console.error(e);process.exit(1)});
