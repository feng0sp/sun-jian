/* Original full-size teaching joints tied to the chair, test timber and storeroom door. */
(function(root){
 'use strict';
 const P=typeof module!=='undefined'?require('./puzzle-core.js'):root.JointPuzzle;
 const B=P.box;
 function timber(id,name,shapes,extra={}){
  return {id,name,color:'#b88e60',shapes,...extra};
 }
 function chairRail(){
  // A blind mortise in a separate teaching leg. The repaired neighbour's chair stays whole.
  const leg=P.subtractBox([-3.3,-1.6,-2.15,2.65,-.68,.68],[-3.02,-1.59,-.44,.44,-.31,.31]);
  return [
   timber('leg','示教椅腿',leg,{fixed:true,color:'#71563f',grainAxis:1,
    description:'同形椅腿上的盲卯。四周卯壁和内侧止口共同限制横枨。'}),
   timber('tenon','长横枨',[
    B(-2.98,-1.58,-.42,.42,-.29,.29),
    B(-1.58,3.3,-.64,.64,-.46,.46)
   ],{symbol:'甲',grainAxis:0,
    description:'缩窄的长榫伸进椅腿，宽榫肩贴在腿侧。沿横枨方向抽开，才看得清藏住的部分。'})
  ];
 }
 function cornerLap(){
  // Broad end notches meet at an L corner, unlike a pair of centre-notched cross bars.
  return [
   timber('lower','横向试配料',P.subtractBox([-3.2,2.2,-.55,.55,-.7,.7],[.8,2.2,0,.56,-.7,.7]),
    {symbol:'甲',color:'#a57e53',grainAxis:0,
     description:'宽木料在端部让出上半层。看清缺口朝向，再沿敞口分开。'}),
   timber('upper','竖向试配料',P.subtractBox([.8,2.2,-.55,.55,-.7,3.9],[.8,2.2,-.56,0,-.7,.7]),
    {symbol:'乙',color:'#c5a06e',grainAxis:2,
     description:'另一根料的端部让出下半层。两个大接面合拢后，转角两侧厚度齐平。'})
  ];
 }
 function doorLatch(){
  const fixed=[B(-4.2,4.2,-2,2.45,-1.02,-.62)];
  // Two outer guides and a broader central lock-guide are attached to the visible door panel.
  for(const [left,right,height]of [[-2.85,-2.3,1],[2.3,2.85,1],[-.85,.85,1.15]]){
   let guide=P.subtractBox([left,right,-height,height,-.62,.89],[left-.01,right+.01,-.54,.54,-.29,.49]);
   if(left===-.85){
    guide=guide.flatMap(shape=>{
     const bounds=[0,1,2].flatMap(axis=>[
      Math.min(...shape.vertices.map(v=>v[axis])),
      Math.max(...shape.vertices.map(v=>v[axis]))
     ]);
     return P.subtractBox(bounds,[-.33,.33,-.26,.26,-.63,.9]);
    });
   }
   fixed.push(...guide);
  }
  // A visible right-hand stop leaves the horizontal withdrawal route on the left.
  fixed.push(B(3.72,4.08,-.69,.69,-.62,.49));
  const bar=P.subtractBox([-3.7,3.65,-.5,.5,-.25,.45],[-.33,.33,-.26,.26,-.26,.46]);
  return [
   timber('door','门板、导座与止口',fixed,{fixed:true,color:'#6e533f',grainAxis:1,
    description:'门板托住三处导座。右边止口挡住长闩，左侧留出横移的路。'}),
   timber('tenon','长横闩',bar,{symbol:'甲',color:'#b18b5d',grainAxis:0,
    description:'整根横闩穿过导座。中央木钥还在时，它无法横移；解锁后沿左侧抽出。'}),
   timber('pin','宽木钥',[
    B(-.3,.3,-.23,.23,-.58,1.05),
    B(-.52,.52,-.43,.43,1.05,1.29)
   ],{symbol:'乙',color:'#cca16c',grainAxis:2,
    description:'较宽的木钥穿过导座和横闩，锁住横移。钥头朝外，握住这一端向前取下。'})
  ];
 }
 const levels=[
  {id:'chair-rail-joint',title:'椅枨 · 藏在腿里的长榫',family:'椅枨接头示教件',pieces:chairRail(),ideal:1,
   observation:'从椅腿侧面找到榫肩，看看横枨沿哪条轴伸进卯里。',
   goal:'沿横枨的长向分开接头，观察榫肩和盲卯。',
   hints:['先找宽横枨与粗椅腿交界的那道肩面。','卯的四周都有木壁，只有横枨伸入的那一侧敞着。'],
   insight:'横枨的长榫藏在椅腿中，外露榫肩与腿侧贴齐。取出路径沿横枨轴线，接点整体轮廓与桌上的直榫样木不同。'},
  {id:'offcut-corner-lap',title:'试配料 · 合平一个转角',family:'端部搭接试配',pieces:cornerLap(),ideal:2,
   observation:'两个端部缺口一上一下，看看大接面怎样合成 L 形。',
   goal:'分开两根宽木料，再对照端部缺口。',
   hints:['这里的缺口留在木料端部，先分清上层和下层。','从缺口敞开的方向试拉；两件都收好才完成这一组。'],
   insight:'两根宽料在端部各让一层，形成齐平的 L 形接点。改变木料长度和缺口位置，才能把搭接关系用于眼前的器物。'},
  {id:'store-door-latch',title:'库门 · 解钥横移',family:'库门横闩',pieces:doorLatch(),ideal:2,
   observation:'宽木钥朝向门外，长横闩穿过导座。找出谁锁住了横移。',
   goal:'先取木钥，再沿导座横向抽开长闩。',
   hints:['木钥穿过横闩的孔，先看它朝外的钥头。','右侧有止口；木钥取下后，长闩从另一侧横移。'],
   insight:'木钥锁住长横闩，导座托住横闩并限制它的横向以外移动。解锁与横移对应门上两个不同构件的作用。'}
 ].map(level=>({category:'campaign',chapter:'OBJECT',difficulty:'应用',skill:'沿器物认识接面',...level}));
 for(const level of levels)if(!P.LEVELS.some(existing=>existing.id===level.id))P.LEVELS.push(level);
 const api={levels};root.ContextPuzzles=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
