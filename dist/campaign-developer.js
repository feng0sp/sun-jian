/* Story checkpoints for the isolated developer session. */
(function(root){
 'use strict';
 const moduleFor=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const Chapters=moduleFor('CampaignChapters','./campaign-chapters.js');
 const Next=moduleFor('CampaignContinuation','./campaign-continuation.js');
 const Finale=moduleFor('CampaignFinale','./campaign-finale.js');
 const Furniture=moduleFor('EntryFurniture','./entry-furniture.js');
 const phase=(phase,frame)=>({phase,frame});
 const talk=id=>({id,line:0});
 const door=(stage,invited=false,bagPlaced=false)=>({stage,invited,bagPlaced,legacy:false});
 const step=(id,title,position={},stage=null,after=null)=>({id:'dev-'+id,title,position,stage,after});
 const finishLesson=n=>(s,h)=>h.lesson(n);
 const finishCave=(id,level)=>(s,h)=>{s.runs['cave:'+id]=h.run(level,'dismantle');};
 const finale=id=>(s,h)=>h.act(id);
 const assembly=id=>(s,h)=>h.work(id);
 const slot=(id,level,mode)=>(s,h)=>{s.continuation[id]=h.run(level,mode);};
 const flags=fields=>s=>Object.assign(s.continuation,fields);
 const groups={
  arrival:[
   step('mountain','雨中下山'),
   step('village','进入溪桥村',{...phase('arrival','village'),prologue:door('village')}),
   step('night-shelter','在雨棚避雨',{...phase('arrival','shelter'),prologue:door('village')}),
   step('knock','到周伯家敲门',{...phase('arrival','zhou-door'),prologue:door('village')}),
   step('welcome','获邀进屋',{...phase('arrival','room'),prologue:door('indoors',true),talk:talk('welcomeInside')}),
   step('lodging','问夜路与借宿',{...phase('arrival','room'),prologue:door('unpacked',true,true),talk:talk('arrival')})
  ],
  learning:[
   step('room','小屋自由观察'),
   step('chair','认识旧椅接头',{frame:'chair-detail',talk:talk('chairJoint')}),
   step('lesson-straight','拆直榫',phase('learning','workbench'),null,finishLesson(0)),
   step('lesson-lap','拆半榫',phase('learning','workbench'),null,finishLesson(1)),
   step('lesson-pinned','拆穿销',phase('learning','workbench'),null,finishLesson(2)),
   step('lesson-return','合回直榫',phase('learning','workbench'),null,finishLesson(3)),
   step('dinner','晚饭与休息',phase('night','room'))
  ],
  repair:[
   step('morning','清晨接取料委托'),
   step('trail','沿石路去旧库',phase('depart','trail')),
   step('store-door','拆旧库横闩',phase('cave','store-door'),null,finishCave('mouth-latch','store-door-latch')),
   step('rack','取料架上的替换料',phase('cave','store-middle'),null,finishCave('rack-frame','double-key-frame')),
   step('box','取木匣里的草图',phase('cave','store-sky'),null,finishCave('stone-box','wooden-box')),
   step('cart','推车回村',phase('cave','store-sky')),
   step('bench','拼装雨棚长凳',phase('bench','shelter'),null,(s,h)=>{s.runs.bench=h.run('rain-shelter-bench','assemble');}),
   step('bench-check','请周伯检查长凳',phase('farewell','shelter')),
   step('bench-use','看村民坐下换鞋',{...phase('farewell','shelter'),benchChecked:true,interlude:{id:'farewell',step:0}}),
   step('poster','点击雨棚赛事海报',phase('complete','shelter'),'meetup',flags({noticeSeen:true})),
   step('leaflet','已取折页，向周伯请教',phase('complete','shelter'),'notice',flags({departurePrepared:true,zhouContact:true})),
   step('goodbye','周伯门前送别',phase('complete','shelter'),'goodbye')
  ],
  workshop:[
   step('home','返校后预约工坊',{},'home',flags({workshopSeen:true})),
   step('pin-practice','穿销装配练习',{},'practice',slot('run','pinned','assemble')),
   step('review','合好样机，记录路径',{},'review',flags({reviewed:true})),
   step('enter-contest','决定报名新人组',{talk:talk('continuationEntry')},'review',flags({entryAccepted:true})),
   step('registered','报名完成',{},'registered',flags({designStarted:true})),
   step('purpose','从日常用途出发',{},'purpose',flags({purpose:'comfort',purposeChoice:'comfort'})),
   step('peer','和林岚见面',{},'peer',flags({peerMet:true})),
   step('service-check','拆检原方案',{},'service-check',slot('serviceRun','service-access-closed','dismantle')),
   step('service-choice','调整固定挡条',{},'service-choice',flags({variant:'side'})),
   step('service-build','合回侧置方案',{},'service-build',slot('serviceBackRun','service-access-open','assemble')),
   step('service-test','拆回侧置方案',{},'service-test',slot('serviceOutRun','service-access-open','dismantle')),
   step('service-review','和林岚复盘维修通路',{},'service-review',flags({designReviewed:true})),
   ...Object.values(Next.workshops).map(t=>step(t.stage,t.name,{},t.stage,slot(t.slot,t.level,t.mode))),
   step('burr-review','把鲁班锁的顺序记下来',{},'workshop-reflection',flags({workshopReflected:true})),
   step('museum','参观榫卯文化博物馆',{},'museum')
  ],
  making:[
   step('work-choice','选择参赛作品',{},'work-choice',finale('choose:'+Furniture.choices[0].key)),
   step('entry-build','装配参赛作品',{},'entry-build',assembly('entry-stool-assemble')),
   step('entry-review','检查并记录三处接点',{},'entry-review',(s,h)=>{
    for(const id of ['panel','moving','service'])h.act('inspect:'+id);
    h.act('records');
   }),
   step('packing','打包前给周伯发照片',{},'packing',finale('photo-noted')),
   step('pack-ready','包好散件，准备出发',{},'packing')
  ],
  contest:[
   step('contest-arrival','抵达省城赛场',{},'contest-arrival',finale('arrived')),
   step('contest-register','登记参赛作品',{},'contest-register',finale('register')),
   step('contest-build','现场装配',{},'contest-build',assembly('contest-assemble')),
   step('judge','向评审介绍作品',{talk:talk('continuationFinalJudge')},'contest-service-out',flags({judgeMet:true})),
   step('service-out','现场拆出演示主板',{},'contest-service-out',assembly('contest-service-out')),
   step('service-back','现场复装主板',{},'contest-service-back',assembly('contest-service-back')),
   step('contest-records','提交作品与过程记录',{},'contest-records',finale('presented')),
   step('contest-review','看同组的作品',{},'contest-review')
  ],
  results:[
   step('results','公布第三名',{},'results',finale('award:stage')),
   step('award-receive','登台领证书和奖金',{},'results',finale('award:receive')),
   step('award-photo','前三名合影',{},'results',(s,h)=>{h.act('award:photo');h.act('award:return');}),
   step('try-furniture','和林岚试用作品',{},'after-award'),
   step('tell-zhou','向周伯报喜',{talk:talk('continuationFinalZhou')},'after-award',finale('ending')),
   step('ending','结局与最后一页手记',{},'ending')
  ]
 };
 const checkpoints=Chapters.chapters.flatMap(chapter=>groups[chapter.id].map(node=>({...node,chapter:chapter.id})));
 const find=id=>checkpoints.find(node=>node.id===id);
 function start(id,D,P,E,C,preferences){
  const node=find(id);
  if(!node)return null;
  const state=Chapters.start(node.chapter,D,P,E,C,preferences);
  const c=state.continuation;
  if(node.chapter!=='arrival')state.prologue=door('settled',true,true);
  const helper={
   run:(level,mode)=>Chapters.solved(level,mode,P,E),
   lesson(index){
    const task=D.tasks[index];
    state.runs[task.id]=helper.run(task.level,task.mode);
    state.done.push(task.id);
   },
   work(id){
    const task=Finale.task(c,id);
    c[task.slot]=helper.run(task.level,task.mode);
   },
   act(id){if(!Finale.action(c,id,P,E))throw Error('Invalid developer prerequisite: '+id);}
  };
  for(const earlier of groups[node.chapter]){
   if(earlier.id===id)break;
   earlier.after?.(state,helper);
  }
  const position=structuredClone(node.position);
  Object.assign(state,position);
  state.visited=D.phases.slice(0,D.phases.indexOf(state.phase)+1);
  state.roomObjects={};
  if(node.chapter==='repair'&&node.stage){
   c.started=true;c.active=true;
  }
  const restored=D.restore(JSON.stringify(state),P,E,C);
  if(restored.phase!==state.phase||restored.frame!==state.frame||
   node.stage&&restored.continuation.stage!==node.stage||
   position.talk&&restored.talk?.id!==position.talk.id){
   throw Error('Invalid developer checkpoint: '+id);
  }
  return restored;
 }
 const api={checkpoints,find,start};root.CampaignDeveloper=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
