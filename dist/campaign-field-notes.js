/* Optional observations of household objects. They never gate a task or certify a puzzle. */
(function(root){
 'use strict';
 const entries=[
  {id:'chair-shoulder',frame:'chair-detail',name:'横枨入腿处',x:.46,y:.68,w:.14,h:.17,look:'横枨到了椅腿边就收住了，接头藏在木头里面。外面看见的，是相贴的那道肩面。',voice:'我拿段同形的椅腿和横枨给你。顺着长木条的方向试。',note:'先沿接缝找到两件木头的交界，再去想藏在里面的接头。',level:'chair-rail-joint'},
  {id:'chair-rail',frame:'chair-detail',name:'两腿之间的横枨',x:.68,y:.66,w:.24,h:.15,look:'横枨横在两条椅腿之间。两端都有接点，观察一端时，也要看看另一端怎么接着。',voice:'修椅子不能只盯着响的那边，连着的地方都得看一眼。',note:'构件连着两端；判断约束时，别只看离手最近的接点。'},
  {id:'chair-patina',frame:'chair-detail',name:'磨圆的座沿',x:.58,y:.23,w:.28,h:.13,look:'座沿的棱已经磨圆，颜色比新木深。常被手扶的地方，留下了一层温润的光。',voice:'这圈是坐出来、摸出来的。没坏的地方，不必为了好看全换掉。',note:'旧木上有使用留下的痕迹。修理时留下还能用的部分。'},
  {id:'tool-plane',frame:'tools-detail',name:'木刨',x:.28,y:.29,w:.45,h:.4,look:'木制刨身托着斜放的铁刃，旁边留着薄薄的刨花。木柄常握的地方已经发亮。',voice:'看就好，刃口别摸。这把跟我久了，哪儿顺手，我闭着眼都知道。',note:'刨子用来修整木面；做接头时，要让相贴的面平整。'},
  {id:'tool-square',frame:'tools-detail',name:'木角尺',x:.72,y:.47,w:.43,h:.29,look:'两条直边围出一个直角。把它靠在木料边上，就能比较两条边是否方正。',voice:'做完再量一次。眼睛觉得差不多，合起来可不一定。',note:'先检查边与肩面是否方正，再看接头为什么贴不齐。',interaction:'square'},
  {id:'tool-offcut',frame:'tools-detail',name:'已开端槽的试配木料',x:.83,y:.73,w:.28,h:.3,look:'两根宽料的端头都让出了一半厚度，拼起来是一只直角。缺口敞着，看得清相贴的面。',voice:'先把这一对拆开再合上。端头开成这样，搭起来才不会厚一截。',note:'把复杂器物里的接头单独做成样件，更容易看清接触关系。',level:'offcut-corner-lap'}
 ];
 function find(id){return entries.find(e=>e.id===id);}
 function at(frame){return entries.filter(e=>e.frame===frame);}
 function restore(value){return [...new Set((Array.isArray(value)?value:[]).filter(id=>find(id)))];}
 function available(s){return s.phase!=='arrival'&&s.scene!=='cave';}
 function learned(s,level){return !!level&&s.done?.includes('learn-'+level+'-out');}
 const api={entries,find,at,restore,available,learned};root.CampaignFieldNotes=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
