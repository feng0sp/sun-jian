/* Journey-specific context. The original cave demo keeps its own linear story. */
(function(root){
 'use strict';
 const cave={
  'mouth-latch':{name:'旧木料库 · 木钥与横闩',title:'门闩拆开了',text:'宽木钥和长门闩放在门边。门能推开了，进去找浅色布带绑着的料和石台上的木匣。',button:'收好门闩，回到库门 →'},
  'rack-frame':{name:'备用料架 · 双扣挡框',title:'替换料能取出来了',text:'挡框已经卸下。浅色布带绑着的横梁、座板和小销都在架上，正是周伯说的那一组。',button:'收好挡框，回到料架 →'},
  'stone-box':{name:'天光石台 · 装草图的木匣',title:'找到装配草图了',text:'草图压在匣底，纸上画着长凳的接头。把板件放稳，这张图带回去装凳子时用。',button:'收好板件，回到石台 →'},
  'route-case':{name:'浅洞 · 燕尾滑盖样匣',title:'滑盖抽开了',text:'斜着的接面露了出来。槽口怎样收住木件，现在看得清楚了。'},
  'folding-screen':{name:'浅洞 · 锁肩搭接样件',title:'搭接处露出来了',text:'横销取下，两根搭木也分开了。接触的几处台阶，正好能对着看。'},
  'cabinet-knot':{name:'浅洞 · 三件初锁样件',title:'三根木都取下了',text:'交错时藏在里面的槽口露了出来。把木件放在一起，就不怕下次找不全。'},
  'narrow-latch':{name:'料架旁 · 双销样件',title:'两根销都松开了',text:'取下的木件摆在一起，两根销原来相交的位置也看清楚了。'},
  'exit-knot':{name:'天光石台 · 六件鲁班锁样件',title:'六根木都分开了',text:'原来挤在中央的槽口，现在逐根都能看清。把这组留在手记里，下次还可以试着合回去。'}
 };
 function completion(task,state){
  if(!task.id.startsWith('cave:'))return null;
  if(task.replay)return {title:task.mode==='assemble'?'样件合好了':'样件拆开了',text:'这次练习完成了。可以回到刚才的画面，取料和旅程进度保持原样。',button:'结束练习，回到场景 →',next:'想再看看接面，可以继续观察。'};
  const n=cave[task.id.slice(5)];if(!n)return null;
  const completed=new Set([...state.cave.completed,task.id.slice(5)]),required=['mouth-latch','rack-frame','stone-box'];
  const next=required.every(id=>completed.has(id))?'木料和草图齐了。返回场景后，可以装车回村。':!completed.has('mouth-latch')?'取料还要先打开库门。':!completed.has('rack-frame')&&!completed.has('stone-box')?'木料和草图，先找哪样都行。':!completed.has('rack-frame')?'还差替换料，在浅色布带标着的料架上。':'还差装配草图，在天光石台的木匣里。';
  return {...n,button:n.button||'放好样件，继续取料 →',next};
 }
 // This suggests a visible route only. It neither moves the player nor solves a joint.
 function destination(s){
  if(s.phase==='arrival')return s.prologue?.stage==='mountain'?'village':s.prologue?.invited?'room':'zhou-door';
  if(s.phase==='learning'&&s.frame==='workbench')return 'workbench';
  if(['settle','learning','night','morning','return'].includes(s.phase))return 'room';
  if(s.phase==='depart')return 'store-door';
  if(s.phase==='bench'&&s.frame==='bench-detail')return 'bench-detail';
  if(['bench','farewell'].includes(s.phase))return 'shelter';
  if(s.phase!=='cave')return null;
  const has=id=>s.cave.completed.includes(id);
  if(!has('mouth-latch'))return 'store-door';
  if(has('rack-frame')&&has('stone-box'))return null;
  if(s.frame==='store-sky'&&!has('stone-box'))return 'store-sky';
  return !has('rack-frame')?'store-middle':'store-sky';
 }
 function nextExit(s,frames,canEnter){
  const target=destination(s);if(!target||target===s.frame)return null;
  const queue=[[s.frame,null]],seen=new Set([s.frame]);
  while(queue.length){const [at,first]=queue.shift(),f=frames[at];const exits=[...(typeof f?.exits==='function'?f.exits(s):f?.exits||[])];
   if(at==='zhou-door'&&s.prologue?.invited)exits.push(['room']);
   for(const [to]of exits){if(seen.has(to)||!canEnter(s,to))continue;const step=first||to;if(to===target)return step;seen.add(to);queue.push([to,step]);}
  }
  return null;
 }
 const api={cave,completion,destination,nextExit};root.CampaignFlow=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
