/* Short, resumable narrative beats. Puzzle histories are never modified here. */
(function(root){
 'use strict';
 const ART='assets/campaign-2d/';
 const ids=['overnight','homeward','farewell'];
 const beats={
  overnight:[{frame:'room',image:'room-after-dinner.webp',night:true,title:'灯还亮着',speaker:'旁白',text:'碗筷收好了。你把手记合上，去里间躺下，窗外的雨声慢慢远了。',next:'到第二天清晨'}],
  homeward:[
   {frame:'store-sky',image:'cave-sky-loaded.webp',title:'把料放稳',speaker:'旁白',text:'草图夹进手记，长料放平，小销收在布带里。你扶住车把，试着推了一步。',next:'推上石路'},
   {frame:'trail',image:'trail.webp',title:'沿原路回村',speaker:'我',text:'还真是一路都响。周伯在家大概都能听见。',next:'把车停在雨棚边'},
   {frame:'shelter',image:'shelter-wide-day-loaded.webp',title:'料到了',speaker:'旁白',text:'把小车靠在雨棚里，轮子垫稳。屋里传来碗筷声，周伯还在收拾。',next:'回屋喊周伯'}
  ],
  farewell:[
   {frame:'shelter',image:'shelter-villager-solo.webp',title:'有人来歇脚',speaker:'旁白',text:'一位村民拎着干布鞋进了雨棚。他在长凳上坐稳，腾出两只手，弯腰脱掉湿鞋。',next:'等他换好鞋'},
   {frame:'shelter',image:'shelter-seated-zhou-bag-01311.webp',title:'雨后再会',speaker:'周伯',text:'鞋换好了，人也走了。来，这头空了，你也坐会儿。',next:'坐下，记一笔'}
  ]
 };
 function allowed(s,id){return id==='overnight'?s.phase==='night':id==='homeward'?s.phase==='cave'&&['mouth-latch','rack-frame','stone-box'].every(n=>s.cave?.completed?.includes(n)):id==='farewell'?s.phase==='farewell'&&s.benchChecked:false;}
 function restore(value,s){
  s.interludesDone=ids.filter(id=>(id==='overnight'?['morning','depart','cave','return','bench','farewell','complete']:id==='homeward'?['return','bench','farewell','complete']:['complete']).includes(s.phase));
  s.interlude=null;
  if(value?.storyRevision>=5&&value.interlude&&allowed(s,value.interlude.id)&&Number.isInteger(value.interlude.step)&&value.interlude.step>=0&&value.interlude.step<beats[value.interlude.id].length){
   const {id,step}=value.interlude;
   s.interlude={id,step:id==='farewell'&&value.storyRevision<14?0:step};
  }
 }
 function beat(s){const t=s.interlude;return t&&allowed(s,t.id)&&beats[t.id]?.[t.step]?{...beats[t.id][t.step],image:ART+(t.id==='overnight'&&s.prologue?.bagPlaced?'room-after-dinner-bag-01311.webp':beats[t.id][t.step].image),id:t.id,step:t.step,total:beats[t.id].length}:null;}
 function patches(s){return beat(s)?[]:null;}

 const api={ids,beats,allowed,restore,beat,patches};root.CampaignInterludes=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
