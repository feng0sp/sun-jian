/* The object library has separate, resumable, dismantle and assembly attempts. */
(function(root){
 'use strict';
 const key='sun-jian-practice-library-v1';
 const names={dovetail:'燕尾滑盖','double-pin':'双销组合','shoulder-lap':'锁肩搭接','double-key-frame':'双扣梁架',
  'wooden-box':'滑盖木匣','burr-six':'六件鲁班锁','burr-three':'三件鲁班锁','rain-shelter-bench':'雨棚长凳',
  'chair-rail-joint':'椅腿与横枨','offcut-corner-lap':'试配料转角','store-door-latch':'库门横闩',
  'service-access-closed':'维修样机（原方案）','service-access-open':'维修样机（侧置）','museum-clamp-apron':'夹头榫案角'};
 function create(P,Sessions,storage){
  let runs={};
  try {
   const stored=JSON.parse(storage.getItem(key));
   if(stored&&typeof stored==='object'&&!Array.isArray(stored))runs=stored;
  }catch{}
  const name=level=>names[level.id]||level.title.split(' · ').at(-1);
  const id=(level,mode)=>level+':'+mode;
  function getRun(level,mode){
   let run=runs[id(level,mode)];
   if(!run){
    try{run=JSON.parse(storage.getItem('sun-jian-session-v1'));}catch{}
   }
   if(run?.level!==level||run.mode!==mode||run.experiment)return null;
   const restored=Sessions.restoreSession(JSON.stringify(run),P);
   return restored?{run:{...run,history:restored.history,trial:restored.trial},completed:restored.completed}:null;
  }
  function capture(run){
   runs[id(run.level,run.mode)]=run;
   try{storage.setItem(key,JSON.stringify(runs));}catch{}
  }
  function render(host,onChoose){
   const levelGroups=[
    ['入门接头',P.LEVELS.filter(level=>level.category==='tutorial'||['pinned','dovetail'].includes(level.id))],
    ['组合结构',P.MAIN_LEVELS.filter(level=>!['pinned','dovetail'].includes(level.id))],
    ['家具与样件',P.LEVELS.filter(level=>level.category==='campaign')]
   ];
   const choices=[['dismantle','拆解'],['assemble','拼装']];
   for(const [title,levels] of levelGroups){
    const section=document.createElement('section');
    section.className='practice-library';
    const heading=document.createElement('h3');heading.textContent=title;
    const grid=document.createElement('div');grid.className='campaign-note-grid';
    for(const level of levels){
     const article=document.createElement('article'),label=document.createElement('h4');
     label.textContent=name(level);article.append(label);
     const actions=document.createElement('div');actions.className='practice-actions';
     for(const [mode,operation] of choices){
      const saved=getRun(level.id,mode);
      const prefitted=mode==='assemble'&&level.id==='rain-shelter-bench'?2:0;
      const prefix=saved?.completed?'再':saved?.run.history.length>prefitted?'继续':'';
      const button=document.createElement('button');button.type='button';button.textContent=prefix+operation;
      button.setAttribute('aria-label',prefix+operation+' · '+name(level));
      button.dataset.practicePiece=id(level.id,mode);
      button.onclick=()=>onChoose(level,mode);
      actions.append(button);
     }
     article.append(actions);grid.append(article);
    }
    section.append(heading,grid);host.append(section);
   }
  }
  return {name,getRun,capture,render};
 }
 root.CampaignPractice={create};
})(typeof window==='undefined'?globalThis:window);
