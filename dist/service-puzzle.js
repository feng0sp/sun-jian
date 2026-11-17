/* Original maintenance-path fixture: an ornamental guard must leave the pin exit accessible. */
(function(root){
 'use strict';
 const P=typeof module!=='undefined'?require('./puzzle-core.js'):root.JointPuzzle,B=P.box;
 const origin=P.LEVELS.find(l=>l.id==='pinned');
 function fixture(open){
  const parts=origin.pieces.map(p=>({...p,shapes:[...p.shapes]})),base=parts.find(p=>p.fixed);
  // A connected demonstration jig, not a load-bearing furniture joint to dismantle.
  base.shapes.push(B(-1.98,4.05,-1.88,-1.68,-1.7,2.78));
  for(const side of [-1,1]){
   const x0=side<0?-1.98:1.72,x1=side<0?-1.72:1.98;
   base.shapes.push(B(x0,x1,-1.68,.03,2.12,2.78));
   const a=side<0?-1.98:1.5,b=side<0?-1.5:1.98;
   base.shapes.push(B(a,b,-1.68,.03,2.12,2.32),B(a,b,-1.68,.03,2.57,2.78));
  }
  base.shapes.push(B(-1.98,1.98,-1.68,-1.32,2.12,2.78));
  const shape=B(-1.7,1.7,-1.30,-.01,2.34,2.55);
  if(open){
   // The guard is mounted at the side of the same jig, clear of the straight pin path.
   const parked=P.movedShape(shape,[3.55,0,-2.5]);
   base.shapes.push(B(1.85,4.05,-1.68,-1.30,-.16,.05),parked);
  }else {parts.find(p=>p.id==='pin').labelOccludedBy='guard';parts.push({id:'guard',name:'前置挡条',symbol:'丙',color:'#9c8762',grainAxis:0,labelAnchor:[0,-1.02,2.58],shapes:[shape],description:'沿前槽放入的非承重挡条。它和销帽之间只留下了一点空隙，看看取销的方向。'});}
  base.name='练习夹具';base.description='固定的教学夹具，带有前槽和侧置位置，不属于待拆的承重家具。';
  return parts;
 }
 const levels=[
  {id:'service-access-closed',title:'维修通路 · 挡住的销',pieces:fixture(false),ideal:3,observation:'销头看得见，但它前面的空间够不够？看看挡条与槽口。',goal:'拆开样机，找出谁遮住了取销通路。',hints:['先看销帽朝向，再看它前方的挡条。','挡条插在敞开的竖槽里；它不是承重件。'],insight:'看得见接头，不等于能够维护。取销还需要一条真正空出来的退出路径。'},
  {id:'service-access-open',title:'维修通路 · 留出出口',pieces:fixture(true),ideal:2,observation:'挡条移到侧边的固定位置。观察销头前方现在留下的空间。',goal:'验证侧置方案可以完整合回，也能取销拆开。',hints:['先合榫头，再让小销固定；前方取销空间应保持开放。','拆开时先取小销，再沿卯口退出大件。'],insight:'将挡条放在侧边，不改变原来的穿销关系；取销方向有了可接近的空间，才方便后续拆修。'}
 ].map(l=>({...l,category:'campaign',chapter:'STUDY',difficulty:'应用',family:'维护通路样机',skill:'为拆修留路',...l}));
 for(const l of levels)if(!P.LEVELS.some(existing=>existing.id===l.id))P.LEVELS.push(l);
 const api={levels};root.ServicePuzzles=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
