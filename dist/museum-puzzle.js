/* Teaching models use the same solids for display and collision. */
(function(root) {
 'use strict';
 const P=typeof module==='undefined'?root.JointPuzzle:require('./puzzle-core.js');
 const box=P.box;
 const fork=P.subtractBox([-.66,.66,.30,1.18,-.62,.62],[-.44,.18,.29,1.19,-.26,.26]);
 const leg=[box(-.66,.66,-2.35,.30,-.62,.62),...fork.flatMap(shape=>{
  const bounds=[0,1,2].flatMap(axis=>[
   Math.min(...shape.vertices.map(point=>point[axis])),
   Math.max(...shape.vertices.map(point=>point[axis]))
  ]);
  return P.subtractBox(bounds,[.18,.67,.29,1.19,-.195,.195]);
 })];
 const sockets=[[-.54,-.29],[.29,.54]];
 for(const [left,right] of sockets)leg.push(box(-.36,.38,1.18,1.48,left+.015,right-.015));
 const rim=[-1.18,2.91,1.18,1.68,-1.03,1.03];
 const cap=[box(-1.18,2.91,1.52,1.68,-1.03,1.03),...[
  [-1.03,-.54],[-.29,.29],[.54,1.03]
 ].map(([left,right])=>box(rim[0],rim[1],1.18,1.52,left,right))];
 for(const [left,right] of sockets){
  cap.push(box(rim[0],-.375,1.18,1.52,left,right),box(.395,rim[1],1.18,1.52,left,right));
 }
 const level={
  id:'museum-clamp-apron',title:'夹头榫 · 案角复原件',chapter:'博物馆',category:'campaign',
  family:'夹头榫接点示教',skill:'辨认案腿、牙条和案面',difficulty:'两件操作',ideal:2,
  pieces:[
   {id:'leg',name:'案腿',color:'#76523b',shapes:leg,fixed:true,grainAxis:1,
    description:'腿足上端的豁口夹住牙条。豁口两侧伸出的榫头再与案面相接。'},
   {id:'apron',name:'牙条',color:'#a77751',symbol:'乙',grainAxis:0,
    shapes:[box(-.42,.18,.32,1.15,-.237,.237),box(.18,.66,.32,1.15,-.176,.176),
     box(.66,2.75,.20,1.15,-.33,.33)],
    description:'牙条缩窄的部分藏在案腿的豁口中。案面取下后，顺豁口向上取出。'},
   {id:'top',name:'案面边框',color:'#bd905a',symbol:'甲',grainAxis:0,shapes:cap,
    description:'案面底部的卯眼接住案腿顶上的榫头，案面在位时也限制牙条上移。'}
  ],
  observation:'从案腿边看过去，腿上的豁口夹着牙条。再看案面怎样盖住它。',
  goal:'先抬开案面边框，再沿案腿的豁口取出牙条。',
  hints:['看案面与腿足之间的两道接缝。','案面还盖在牙条上。先抬开案面，再沿腿上的豁口向上取出牙条。'],
  insight:'这件案角教具把案面、案腿、牙条分别做出。合回时先让牙条落入豁口，再把案面扣回腿榫。'
 };
 const cut=P.subtractBox;
 function mortises(bounds,...holes){
  return holes.reduce((shapes,hole)=>shapes.flatMap(shape=>{
   const bounds=[0,1,2].flatMap(axis=>{
    const coords=shape.vertices.map(point=>point[axis]);
    return [Math.min(...coords),Math.max(...coords)];
   });
   return cut(bounds,hole);
  }),[box(...bounds)]);
 }
 function timber(id,name,color,shapes,description,{fixed=false,symbol,grainAxis=0}={}){
  return {id,name,color,shapes,description,fixed,symbol,grainAxis};
 }
 function teaching(id,title,family,pieces,goal,insight){
  const ideal=pieces.filter(piece=>!piece.fixed).length;
  return {id,title,chapter:'博物馆',category:'museum',family,pieces,ideal,
   skill:'沿接面查找入口和止口',difficulty:ideal===1?'单接点':ideal<4?'顺序拆合':'分层拆合',
   observation:insight,goal,hints:[insight,goal],insight};
 }

 const beam=teaching('museum-hemudu-beam','河姆渡梁头榫 · 单端试配','梁头榫接点示教',[
  timber('socket','卯座','#a5815f',cut([2.35,4.12,-.60,.64,-.65,.73],[2.34,3.46,-.33,.18,-.015,.46]),
   '教具的卯座按榫头轮廓留出盲卯。', {fixed:true,grainAxis:1}),
  timber('beam','梁头','#79523a',[box(-3.46,-2.30,-.12,.17,-.47,.48),box(-2.30,2.35,-.37,.46,-.62,.59),box(2.35,3.41,-.31,.16,.01,.44)],
   '较短的一端伸入卯口，梁端较宽的肩面贴在卯座外侧。',{symbol:'甲'})
 ],'沿梁的长向退出梁头，看看宽肩后面藏着的榫。','一端的榫头进入卯座，榫肩贴住外壁。另一端保留不同形状，供对照观察。');

 const dougongParts=[
  timber('column','立柱','#75563e',[box(-.56,.56,-1.60,-.35,-.55,.55),box(-.22,.22,-.35,-.12,-.21,.21)],
   '立柱留在原位，顶端榫头托着底斗。',{fixed:true,grainAxis:1}),
  timber('dou','底斗','#ad7850',mortises([-.84,.84,-.35,.29,-.75,.75],
   [-.24,.24,-.36,-.10,-.23,.23],[-.86,.86,.01,.30,-.31,.31]),'柱头与横栱分别从下、上进入底斗。',{symbol:'庚'}),
  timber('gong','横栱','#bd9468',[box(-.57,.57,.028,.29,-.28,.28),box(-2.26,2.26,.29,.51,-.30,.30),
   box(-2.40,-1.48,.51,.64,-.34,.34),box(1.48,2.40,.51,.64,-.34,.34),
   ...[-1.93,1.93].map(x=>box(x-.156,x+.156,.64,.90,-.116,.116))],
   '横栱跨在底斗上，两端的榫接住小斗。',{symbol:'己'})
 ];
 for(const [side,x,blockMark,barMark] of [['left',-1.93,'丁','乙'],['right',1.93,'戊','丙']]){
  const name=side==='left'?'左':'右';
  dougongParts.push(
   timber('block-'+side,name+'小斗','#a67248',mortises([x-.42,x+.42,.64,1.22,-.44,.44],
    [x-.177,x+.177,.63,.923,-.135,.135],[x-.227,x+.227,.97,1.23,-.46,.46]),
    '小斗下接栱头，上留槽口承托横材。',{symbol:blockMark}),
   timber('bar-'+side,name+'上层横材','#c99b66',[box(x-.204,x+.204,.99,1.34,-1.29,1.29),
    box(x-.123,x+.123,1.34,1.51,-.15,.15)],'横材嵌在小斗槽中，顶端短榫接入上方的梁。',{symbol:barMark,grainAxis:2})
  );
 }
 dougongParts.push(timber('beam','上梁','#956541',mortises([-2.64,2.64,1.34,1.69,-.43,.43],
  ...[-1.93,1.93].map(x=>[x-.143,x+.143,1.33,1.54,-.17,.17])), '上梁的底部卯眼接住两根横材。',{symbol:'甲'}));
 const dougong=teaching('museum-dougong','斗栱 · 分层承托','柱头斗栱示教',dougongParts,
  '先移开上梁，再逐层拆开横材、小斗、横栱和底斗。','从上梁往下看。横材落在小斗里，横栱把两端的小斗托在底斗上。');

 function horizontalPrism(low,high,polygon){
  const shape=P.prismX(low,high,polygon.map(([x,z])=>[x,-z]).reverse());
  const rotate=([y,x,z])=>[x,y,-z];
  return {...shape,vertices:shape.vertices.map(rotate),normals:shape.normals.map(rotate),edges:shape.edges.map(rotate)};
 }
 const corner=teaching('museum-miter-corner','粽角榫 · 桌角接点','三材相会的角部示教',[
  timber('leg','腿足','#725343',mortises([-.62,.62,-1.82,.95,-.62,.62],
   [.215,.63,.44,.81,-.272,.182],[-.488,-.112,.44,.81,.212,.63]),
   '腿足的两个盲卯分开布置，各接住一根边框的榫。',{fixed:true,grainAxis:1}),
  timber('front','横向边框','#bb8b58',[
   horizontalPrism(.95,1.60,[[-.62,-.62],[2.93,-.62],[2.93,.62],[.62,.62]]),
   box(.24,.67,.47,.78,-.25,.16),box(.62,.84,.78,.95,-.25,.16)],
   '榫沿边框长向进入腿足，斜接面在上方与另一根边框贴合。',{symbol:'甲'}),
  timber('side','纵向边框','#926747',[
   horizontalPrism(.95,1.60,[[-.62,-.62],[.62,.62],[.62,2.93],[-.62,2.93]]),
   box(-.46,-.14,.47,.78,.24,.67),box(-.46,-.14,.78,.95,.62,.84)],
   '这一根边框朝另一侧退出，取下后能看到斜面和榫头。',{symbol:'乙',grainAxis:2})
 ],'沿两根边框各自的长向取下它们，再看斜面和腿足的卯眼。','两条边框在角上拼出一条斜缝，榫头则从不同方向进入同一根腿。');

 const sliding=teaching('museum-sliding-pin','走马销 · 滑至宽口','宽口入销、窄处扣接示教',[
  timber('track','槽板','#896347',[
   box(-2.85,2.85,-.55,-.39,-.91,.91),
   box(-2.85,2.85,-.39,.04,-.91,-.57),box(-2.85,2.85,-.39,.04,.57,.91),
   box(-1.05,2.85,.04,.33,-.91,-.245),box(-1.05,2.85,.04,.33,.245,.91),
   box(-2.85,-1.05,.04,.33,-.91,-.63),box(-2.85,-1.05,.04,.33,.63,.91),
   box(2.36,2.85,-.39,.33,-.57,.57)
  ],'槽沿扣住滑板下宽上窄的销头。教具的宽口延伸到板边。',{fixed:true}),
  timber('slide','带销滑板','#bd9460',[
   box(-.85,2.22,.35,.72,-.73,.73),box(.39,1.04,.035,.35,-.2,.2),
   box(.39,1.04,-.31,.035,-.49,.49)],
   '窄颈在槽缝中滑动。宽销头留在槽沿下方，滑回宽口才能取下。',{symbol:'乙'}),
  timber('stop','限位木块','#ac744d',[
   box(-2.81,-2.37,-.38,.39,-.261,.261),box(-2.83,-2.35,.39,.56,-.342,.342)],
   '教学用木块。它塞住槽口，拿开后可以把滑板退到宽口。',{symbol:'甲',grainAxis:1})
 ],'拔出宽口处的限位木块，再沿窄槽把带销滑板退出板边。','销头被窄槽沿扣住。教具的宽口开到板边，可在此把滑板沿槽取下。');

 for(const replica of [level,beam,dougong,corner,sliding]){
  if(!P.LEVELS.some(item=>item.id===replica.id))P.LEVELS.push(replica);
 }
 root.MuseumPuzzle=level;
 if(typeof module!=='undefined')module.exports=level;
})(typeof window==='undefined'?globalThis:window);
