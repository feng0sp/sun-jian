/* Adapt the existing real UI journeys to the packaged, sandboxed Electron host. */
const {_electron}=require('playwright'),fs=require('node:fs'),path=require('node:path');
module.exports=async function(){
 const apps=new Set(),exe=process.env.SUNJIAN_PACKAGED_EXE;
 async function context(options={}){
  const home=path.resolve('output/submission-2026/qa/profiles');fs.mkdirSync(home,{recursive:true});
  const profile=fs.mkdtempSync(path.join(home,'electron-'));
  const app=await _electron.launch({executablePath:exe,args:options.args||[],env:{...process.env,SUNJIAN_TEST:'1',SUNJIAN_USER_DATA:profile},timeout:45000});apps.add(app);
  const p=await app.firstWindow(),ctx=app.context();
  if(options.offline){
   await ctx.setOffline(true);
   const cdp=await ctx.newCDPSession(p);
   const reportOffline=()=>cdp.send('Network.overrideNetworkState',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
   await reportOffline();
   // Electron can initialize a fresh navigator state on custom-protocol navigation.
   p.on('domcontentloaded',()=>void reportOffline().catch(()=>{}));
  }
  if(options.viewport)await p.setViewportSize(options.viewport);
  let used=false;const close=async()=>{if(!apps.delete(app))return;await app.close().catch(()=>{});};
  return {newPage:async()=>{if(!used){used=true;return p;}return ctx.newPage();},setDefaultTimeout:n=>ctx.setDefaultTimeout(n),setDefaultNavigationTimeout:n=>ctx.setDefaultNavigationTimeout(n),close,app,page:p,profile};
 }
 return {newContext:context,newPage:async opts=>{const c=await context(opts);const p=await c.newPage();p.on('close',()=>{void c.close();});return p;},close:async()=>{for(const app of apps)await app.close().catch(()=>{});apps.clear();}};
};
