/* Original game bench: open-top saddles, two flanged rails, sliding seat and cross pins. */
(function(root){
 'use strict';
 const P=typeof module!=='undefined'?require('./puzzle-core.js'):root.JointPuzzle;
 const B=P.box,parts=[],fixed=[],beams=[];
 const sub=(shapes,hole)=>shapes.flatMap(s=>{const a=[0,1,2].flatMap(i=>[Math.min(...s.vertices.map(v=>v[i])),Math.max(...s.vertices.map(v=>v[i]))]);return P.subtractBox(a,hole);});
 for(const x of [-2.3,2.3]){
  for(const z of [-.66,.66])fixed.push(B(x-.22,x+.22,0,.71,z-.2,z+.2));
  let top=[B(x-.29,x+.29,.7,.93,-.88,.88)];for(const z of [-.55,.55])top=sub(top,[x-.27,x+.27,.7,.94,z-.3,z+.3]);fixed.push(...top,B(x-.22,x+.22,.27,.4,-.7,.7));
 }
 for(const [index,z]of [-.55,.55].entries()){
  let s=[B(-2.65,2.65,.97,1.08,z-.2,z+.2),B(-2.65,2.65,.94,1.2,z-.12,z+.12)];
  for(const x of [-2.3,2.3]){s.push(B(x-.26,x+.26,.71,.94,z-.14,z+.14));s=sub(s,[x-.075,x+.075,1.085,1.175,-1.5,1.5]);}
  beams.push({id:index?'rear-beam':'front-beam',name:index?'后横梁':'前横梁',color:index?'#a58259':'#c29b69',symbol:index?'乙':'甲',grainAxis:0,shapes:s,description:'两端榫脚从承口上方落入。上方的座板会限制它再次抬起。'});
 }
 let seat=[B(-2.85,2.85,1.22,1.42,-.94,.94),B(2.72,2.85,.97,1.22,-.9,.9)];
 for(const z of [-.55,.55])for(const side of [-1,1]){const a=z+side*.23,b=z+side*.30;seat.push(B(-2.85,2.72,.96,1.22,Math.min(a,b),Math.max(a,b)));const c=z+side*.125,d=z+side*.30;seat.push(B(-2.85,2.72,.95,.968,Math.min(c,d),Math.max(c,d)));}
 for(const x of [-2.3,2.3])seat=sub(seat,[x-.075,x+.075,1.085,1.175,-1.5,1.5]);
 parts.push({id:'frames',name:'两端凳架',color:'#68513e',fixed:true,grainAxis:1,shapes:fixed},...beams,{id:'seat',name:'滑入的座板',symbol:'丙',color:'#c8aa7b',grainAxis:0,shapes:seat,description:'底面的扣边沿横梁滑入。先看哪一端留下了进入空间。'});
 for(const [i,x]of [-2.3,2.3].entries())parts.push({id:i?'right-pin':'left-pin',name:i?'右木销':'左木销',symbol:i?'戊':'丁',color:'#aa7446',grainAxis:2,shapes:[B(x-.06,x+.06,1.10,1.16,-1.12,1.08),B(x-.15,x+.15,1.025,1.235,1.08,1.22)],description:'横穿座板和横梁的锁定销。提前装入可能挡住其他木件。'});
 const level={id:'rain-shelter-bench',title:'雨棚 · 合好长凳',chapter:'END',category:'campaign',difficulty:'综合',family:'长凳组合练习',skill:'从拆解到应用',pieces:parts,ideal:5,observation:'观察承口、横梁的肩面与座板底边。想一想哪些构件要先留出空间。',goal:'把五件散木合成完整长凳。',hints:['先看看两端凳架上敞开的承口，以及座板底面的扣边。','横梁从上方落入，座板沿梁滑动；穿过接点的小销会锁住移动。'],insight:'横梁的榫脚进入敞口承座，座板底边扣住梁肩，最后由两枚穿销固定滑动。两根梁、两枚销各自可以交换先后；接触面共同决定能装进去的路径。'};
 if(!P.LEVELS.some(l=>l.id===level.id))P.LEVELS.push(level);
 root.BenchPuzzle=level;if(typeof module!=='undefined')module.exports=level;
})(typeof window==='undefined'?globalThis:window);
