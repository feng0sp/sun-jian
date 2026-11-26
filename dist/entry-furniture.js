/* Three original game furniture variants. Positive axis scaling preserves the
 * proven rail/seat contact geometry; fixed supports are not player actions. */
(function(root){
 'use strict';
 const P=typeof module!=='undefined'?require('./puzzle-core.js'):root.JointPuzzle;
 const base=typeof module!=='undefined'?require('./bench-puzzle.js'):root.BenchPuzzle;
 const choices=[
  {key:'stool',id:'entry-shoe-stool',name:'换鞋小凳',panel:'宽座板',scale:[.34,1,.76],use:'给玄关换鞋用，坐面留宽，扫地时能搬开。',review:'座面、搬动位置、两侧取销口',recipient:'自家玄关',art:'stool'},
  {key:'table',id:'entry-bedside-table',name:'床边小几',panel:'几面',scale:[.32,1.3,.83],use:'放床边的书和水杯，台面可单独退出、更换。',review:'几面、拿起的位置、两侧取销口',recipient:'我',art:'table'},
  {key:'shelf',id:'entry-desk-shelf',name:'桌上书架',panel:'承书板',scale:[.42,.62,.64],use:'把桌上的常用书集中起来，承书板可以单独拆换。',review:'承书板、背挡、两侧取销口',recipient:'我',art:'shelf'}
 ];
 function transform(shape,s){const b=[0,1,2].flatMap(i=>[Math.min(...shape.vertices.map(v=>v[i]))*s[i],Math.max(...shape.vertices.map(v=>v[i]))*s[i]]);return P.box(...b);}
 for(const c of choices){
  const support=base.pieces.filter(p=>p.fixed||['front-beam','rear-beam'].includes(p.id)).flatMap(p=>p.shapes.map(s=>transform(s,c.scale)));
  if(c.key==='shelf'){
   const [sx,sy,sz]=c.scale;
   for(const x of [-2.3,2.3]){support.push(P.box((x-.2)*sx,(x+.2)*sx,0,2.9*sy,-1.30*sz,-1.13*sz));support.push(P.box((x-.2)*sx,(x+.2)*sx,.27*sy,.4*sy,-1.30*sz,-.70*sz));support.push(P.box((x-.2)*sx,(x+.2)*sx,1.42*sy,2.9*sy,-.96*sz,.65*sz));}
   support.push(P.box(-2.5*sx,2.5*sx,2.25*sy,2.70*sy,-1.30*sz,-.90*sz));
  }
  const pieces=[{id:'supports',name:c.key==='shelf'?'侧架与背挡':'预装支撑框架',fixed:true,color:'#79573d',grainAxis:1,shapes:support},...base.pieces.filter(p=>['seat','left-pin','right-pin'].includes(p.id)).map((p,i)=>({...p,name:i===0?c.panel:i===1?'左侧木销':'右侧木销',symbol:['甲','乙','丙'][i],shapes:p.shapes.map(s=>transform(s,c.scale)),description:i===0?'底部扣边沿支撑梁滑入，接面贴齐后再固定两侧木销。':'侧面的销帽留在外面，便于抓取；先取两销，主板才有退出的路。'}))];
  const level={id:c.id,title:'参赛作品 · '+c.name,chapter:'作品',category:'campaign',difficulty:'综合应用',family:'可拆修家具 · 游戏示教结构',skill:'装配与维护',pieces,ideal:3,observation:'观察主板底面的滑槽和两侧的取销通路。',goal:'先合'+c.panel+'，再装两枚侧向木销。',hints:['先看主板扣边的开口，侧销暂时留在托盘。','两侧木销会锁住主板。装配时先主板，维修时先取销。'],insight:'支撑框架留在原处，主板沿梁滑入，两侧木销固定。取销后只退出主板，不必拆掉整件家具。'};
  if(!P.LEVELS.some(l=>l.id===c.id))P.LEVELS.push(level);
 }
 const find=key=>choices.find(c=>c.key===key)||null;
 const api={choices,find};root.EntryFurniture=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
