const fs=require('node:fs');
const path=require('node:path');
(async()=>{
  const {packager}=await import('@electron/packager');
  const root=path.resolve(__dirname,'..'),stage=path.join(root,'artifacts','desktop-source');
  fs.mkdirSync(stage,{recursive:true});
  fs.copyFileSync(path.join(root,'desktop','main.cjs'),path.join(stage,'main.cjs'));
  fs.cpSync(path.join(root,'dist'),path.join(stage,'dist'),{recursive:true});
  fs.writeFileSync(path.join(stage,'package.json'),JSON.stringify({name:'sun-jian-desktop',productName:'榫间',version:require('../package.json').version,main:'main.cjs'},null,2));
  if(fs.existsSync(path.join(root,'artifacts','icon.png')))fs.copyFileSync(path.join(root,'artifacts','icon.png'),path.join(stage,'icon.png'));
  const result=await packager({dir:stage,name:'SunJian',platform:'win32',arch:'x64',electronVersion:require('electron/package.json').version,out:path.join(root,'artifacts','desktop'),overwrite:true,asar:true,prune:true,icon:fs.existsSync(path.join(root,'artifacts','icon.ico'))?path.join(root,'artifacts','icon.ico'):undefined,win32metadata:{FileDescription:'榫间 · 榫卯解谜',ProductName:'榫间',InternalName:'SunJian',OriginalFilename:'SunJian.exe'}});
  const folder=result[0];
  fs.writeFileSync(path.join(folder,'开始试玩.txt'),'榫间 · 榫卯解谜\r\n\r\n双击 SunJian.exe 开始试玩，无需联网和安装。\r\n请保留整个文件夹，不能单独移动 exe。\r\n\r\n主菜单开始完整旅程；点击物件与出口探索二维场景，按住 H 查看热点，Tab / Enter 选择，Esc 暂停。\r\n拆开：抽出全部可动木件。合回：把木件装回原位。\r\n1—5 选木；W/S 上下，A/D 左右，Q/E 前后。\r\nH 提示，Z 撤销，R 重试，V 透视。F11 全屏。\r\n\r\n当前版本包含二维动漫村庄、小屋学习、旧库三处必经与五处自选练习、三维长凳拼装及告别。部分组合结构用于游戏教学，非传统构造标准制图。\r\n本地进度保存到当前 Windows 用户的应用数据目录。\r\n本版本未做商业代码签名。\r\n','utf8');
  console.log(JSON.stringify({folder,executable:path.join(folder,'SunJian.exe')}));
})().catch(e=>{console.error(e);process.exit(1)});
