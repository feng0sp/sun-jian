'use strict';
const {app,BrowserWindow,Menu,protocol,net,session}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const isTest=process.env.SUNJIAN_TEST==='1';
if(isTest&&process.env.SUNJIAN_USER_DATA)app.setPath('userData',process.env.SUNJIAN_USER_DATA);
app.setName('榫间');
protocol.registerSchemesAsPrivileged([{scheme:'sun-jian',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
const policy="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
let win;
app.whenReady().then(()=>{
  const root=path.join(__dirname,'dist');
  protocol.handle('sun-jian',async request=>{
    const url=new URL(request.url);if(url.hostname!=='app')return new Response('Not found',{status:404});
    let target;try{target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));}catch{return new Response('Invalid path',{status:400});}
    if(!target.startsWith(root+path.sep))return new Response('Not found',{status:404});
    try{const response=await net.fetch(pathToFileURL(target).href);response.headers.set('Content-Security-Policy',policy);return response;}catch{return new Response('Not found',{status:404});}
  });
  session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
  win=new BrowserWindow({width:1440,height:960,minWidth:800,minHeight:650,title:'榫间 · 榫卯解谜',backgroundColor:'#f6f3eb',show:false,autoHideMenuBar:true,icon:path.join(__dirname,'icon.png'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:false,backgroundThrottling:!isTest}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('sun-jian://app/'))event.preventDefault();});
  win.once('ready-to-show',()=>{if(!isTest)win.show();});
  const menu=Menu.buildFromTemplate([
    {label:'榫间',submenu:[{label:'回到主菜单',accelerator:'Ctrl+Home',click:()=>win.loadURL('sun-jian://app/index.html')},{type:'separator'},{role:'quit',label:'退出'}]},
    {label:'视图',submenu:[{role:'togglefullscreen',label:'全屏'},{role:'zoomIn',label:'放大界面'},{role:'zoomOut',label:'缩小界面'},{role:'resetZoom',label:'恢复界面比例'}]}
  ]);Menu.setApplicationMenu(menu);win.loadURL('sun-jian://app/index.html');
});
app.on('window-all-closed',()=>app.quit());
