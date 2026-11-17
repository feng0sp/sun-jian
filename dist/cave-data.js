(function(root){
 'use strict';
 const nodes=[
  {id:'mouth-latch',level:'pinned',area:0,title:'洞口 · 穿销木门',short:'穿销木门',kind:'gate',z:-7,x:0,y:1.35,goal:'看看木闩与小销怎样连在一起。',after:'门闩取下了。门可以推开，继续往里看看。'},
  {id:'route-case',level:'dovetail',area:0,title:'洞口 · 路线匣',short:'滑盖路线匣',kind:'case',z:-15,x:-2.5,y:1.32,goal:'找到滑盖的接缝，观察槽口的宽窄。',after:'匣里是一张旧简图：浅洞、中洞，最后是透光的岩厅。'},
  {id:'folding-screen',level:'shoulder-lap',area:1,title:'浅洞 · 搭接木屏',short:'搭接木屏',kind:'gate',z:-25,x:0,y:1.3,goal:'观察横销、搭接木与承座之间的接触。',after:'接头松开了。木屏折向墙边，后面还有一组储物柜。'},
  {id:'cabinet-knot',level:'burr-three',area:1,title:'浅洞 · 三向柜扣',short:'三向柜扣',kind:'cabinet',z:-34,x:0,y:1.4,goal:'转着看三根木，寻找交错处留下的空间。',after:'三向扣取下，柜门向侧边打开，露出一条旧侧道。'},
  {id:'narrow-latch',level:'double-pin',area:2,title:'中洞 · 双销木栅',short:'双销木栅',kind:'gate',z:-43,x:0,y:1.35,goal:'两根销相交在哪里？',after:'两道销都松开了。木栅向里开启。'},
  {id:'rack-frame',level:'double-key-frame',area:2,title:'中洞 · 双扣挡框',short:'双扣挡框',kind:'frame',z:-51,x:0,y:1.3,goal:'看看上梁同时受到哪些木件限制。',after:'挡框收在架边。前方石台上的木匣露了出来。'},
  {id:'stone-box',level:'wooden-box',area:3,title:'天光洞 · 石台木匣',short:'石台木匣',kind:'box',z:-60,x:-2.4,y:1.54,goal:'观察匣盖、轨道与侧板的接缝。',after:'板件整齐放在石台上。匣底留着一页木作草图。'},
  {id:'exit-knot',level:'burr-six',area:3,title:'天光洞 · 六合木扣',short:'六合木扣',kind:'gate',z:-68,x:0,y:1.4,goal:'先辨认同向的两根木，再看中央交错的槽口。',after:'最后一组扣件松开。洞外的光，落到了脚边。'}
 ];
 const areas=['洞口 · 雨后的光','浅洞 · 木影之间','中洞 · 岩壁深处','天光洞 · 出口有风'];
 const fresh=()=>({version:1,completed:[],runs:{},position:[0,1.65,3],yaw:0,pitch:0,seenIntro:false,finished:false});
 function restore(raw,P,E){
  const s=fresh();try{
   const v=JSON.parse(raw);if(v?.version!==1)return s;
   // Only a completed prefix can open a route; corrupt/foreign histories never advance it.
   for(const n of nodes){if(!v.completed?.includes(n.id))break;s.completed.push(n.id);}
   for(const n of nodes)for(const mode of ['dismantle','assemble']){
    const key=n.id+':'+mode,r=v.runs?.[key],valid=r&&r.level===n.level&&r.mode===mode&&E.restoreSession(JSON.stringify(r),P);
    if(valid)s.runs[key]={...r,history:valid.history};
   }
   if(Array.isArray(v.position)&&v.position.length===3&&v.position.every(Number.isFinite))s.position=[Math.max(-3.7,Math.min(3.7,v.position[0])),1.65,Math.max(-73,Math.min(4,v.position[2]))];
   if(Number.isFinite(v.yaw))s.yaw=v.yaw%(Math.PI*2);
   if(Number.isFinite(v.pitch))s.pitch=Math.max(-1.15,Math.min(1.15,v.pitch));
   s.seenIntro=!!v.seenIntro;s.finished=!!v.finished&&s.completed.length===8;
   // Never respawn beyond a still-closed physical gate.
   const closed=nodes.find(n=>!s.completed.includes(n.id)&&!['box','case'].includes(n.kind));
   if(closed&&s.position[2]<closed.z+.8)s.position=[0,1.65,closed.z+2.8];
   return s;
  }catch{return s;}
 }
 const api={nodes,areas,fresh,restore};root.CaveData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
