(function(root){
 'use strict';
 const Guide=root.AssemblyGuide||(typeof require==='function'?require('./assembly-guide.js'):null);
 const Field=root.CampaignFieldNotes||(typeof require==='function'?require('./campaign-field-notes.js'):null);
 const Interludes=root.CampaignInterludes||(typeof require==='function'?require('./campaign-interludes.js'):null);
 const tasks=[
  {id:'learn-straight-out',level:'straight',mode:'dismantle',object:'straight',name:'台前的直榫',goal:'看看卯口，取下台前的样木。',after:['我：四周都贴着，沿开口才拿得出来。','周伯：对。先看它被哪几个面围着。']},
  {id:'learn-lap-out',level:'lap',mode:'dismantle',object:'lap',name:'交叠的半榫',goal:'观察上下交叠处，把两根木条分开。',after:['我：各让掉一半，合起来倒是平的。','周伯：搭在一起，厚度就合适了。']},
  {id:'learn-pinned-out',level:'pinned',mode:'dismantle',object:'pinned',name:'带销的样木',goal:'观察穿过木件的小销，试着拆开。',after:['我：原来是这根小销拦着它。','周伯：小件也能管住大件。装回去时，顺序也得想清楚。']},
  {id:'learn-straight-back',level:'straight',mode:'assemble',object:'straight',name:'把直榫合好',goal:'从散件中拿起榫头，沿卯口合回。',after:['我：合回去，也得给它留出进来的路。','周伯：记住怎么看就好。天晚了，先吃饭。明早我带你看看雨棚那条凳子。']}
 ];
 const phases=['arrival','settle','learning','night','morning','depart','cave','return','bench','farewell','complete'];
 const frames=['mountain-rain','zhou-door','village','shelter','room','trail','store-door','store-shallow','store-middle','store-sky','workbench','chair-detail','tools-detail','chair-seat','bench-detail','bench-seat'];
 const requiredCaveIds=['mouth-latch','rack-frame','stone-box'];
 const optionalCaveIds=['route-case','folding-screen','cabinet-knot','narrow-latch','exit-knot'];
 const Continuation=root.CampaignContinuation||(typeof require==='function'?require('./campaign-continuation.js'):null);
 const Objects=root.CampaignObjects||(typeof require==='function'?require('./campaign-objects.js'):null);
 const storyRevision=16;
 const soloRevisedTalk=new Set(['opening','villageArrival','arrival','stay','travelMessage',
  'continuationMeetup','continuationGoodbye','continuationEntry','continuationPurpose',
  'continuationFinalJudge','continuationFinalResult','continuationFinalAfter','continuationFinalMemory']);
 const fresh=()=>({version:2,storyRevision,playerName:'陈屿',playerNameConfirmed:false,continuation:Continuation.fresh(),roomObjects:{},doorRecoveryPending:false,nightBenchSeen:false,interlude:null,interludesDone:[],frame:'mountain-rain',prologue:{stage:'mountain',invited:false,bagPlaced:false,legacy:false},openingSeen:false,spoken:[],topics:[],pendingReflection:null,companionUpdated:false,suppliesCollected:false,leavePracticeReminderSeen:false,phase:'arrival',scene:'village',village:{position:[0,1.65,8],yaw:0,pitch:0},cave:{version:1,position:[0,1.65,3],yaw:0,pitch:0,completed:[],runs:{},seenIntro:true,finished:false},done:[],runs:{},replays:{},talk:null,visited:['arrival'],observed:[],fieldNotes:[],completionSeen:{},completionPresented:[],benchRecoveryPending:false,finished:false,playMs:0,records:[],settings:{sound:false,sensitivity:1,volume:.65,musicVolume:1,ambienceVolume:1,quality:'medium',reducedMotion:false,dialogueSound:true},feedback:{}});
 const hasNode=(s,id)=>Array.isArray(s.cave?.completed)&&s.cave.completed.includes(id);
 const canReturn=s=>requiredCaveIds.every(id=>hasNode(s,id));
 function canEnterFrame(s,id){
  if(!frames.includes(id))return false;
  const intro=s.phase==='arrival'&&s.prologue&&!s.prologue.legacy;
  if(id==='mountain-rain')return intro&&s.prologue.stage==='mountain';
  if(id==='zhou-door')return s.scene!=='cave'&&s.phase==='arrival'&&(!intro||s.prologue.stage!=='mountain');
  if(intro){
   if(s.prologue.stage==='mountain')return ['mountain-rain','village'].includes(id);
   if(['room','workbench','chair-detail','chair-seat','tools-detail'].includes(id)&&!s.prologue.invited)return false;
   if(['workbench','chair-detail','chair-seat','tools-detail'].includes(id)&&!s.prologue.bagPlaced)return false;
  }
  if(id==='tools-detail'&&s.phase==='arrival')return false;
  if(id==='bench-seat')return s.phase==='complete';
  if(id.startsWith('store-'))return (s.phase==='cave'||s.phase==='depart')&&(id==='store-door'||s.phase==='cave'&&hasNode(s,'mouth-latch'));
  if(id==='trail'&&phases.indexOf(s.phase)<phases.indexOf('morning'))return false;
  if(id==='bench-detail'&&phases.indexOf(s.phase)<phases.indexOf('return'))return false;
  return s.phase!=='cave';
 }
 function defaultFrame(s){
  if(s.phase==='arrival'&&s.prologue&&!s.prologue.legacy){if(s.prologue.stage==='mountain')return 'mountain-rain';if(s.prologue.bagPlaced||s.prologue.stage==='indoors')return 'room';if(s.prologue.invited)return 'zhou-door';return 'village';}
  if(s.phase==='cave'){
   if(!hasNode(s,'mouth-latch'))return 'store-door';
   const z=s.cave?.position?.[2];return Number.isFinite(z)?z>-18?'store-door':z>-36?'store-shallow':z>-54?'store-middle':'store-sky':'store-shallow';
  }
  if(['bench','farewell','complete'].includes(s.phase))return 'shelter';
  if(['settle','learning','night','morning','return'].includes(s.phase))return 'room';
  if(s.phase==='depart')return 'trail';
  const p=s.village?.position;return p?.[0]>4?'shelter':p?.[0]<-4&&canEnterFrame(s,'trail')?'trail':Math.abs(p?.[0]||0)<4.1&&p?.[2]<0?'room':'village';
 }
 function restore(raw,P,E,C){
  const s=fresh();try{const v=JSON.parse(raw);if(!v||![1,2].includes(v.version))return s;
   const Awards=root.CampaignAwards||(typeof require==='function'?require('./campaign-awards.js'):null);s.playerName=Awards.name(v.playerName);s.playerNameConfirmed=v.playerNameConfirmed===true;
   s.phase=phases.includes(v.phase)?v.phase:s.phase;
   const list=x=>Array.isArray(x)?x:[],savedDone=list(v.done),savedVisited=list(v.visited),savedObserved=list(v.observed),restoredRuns=new Map();
   function runFor(run,level,mode){if(level==='store-door-latch'&&mode==='dismantle')return Objects.doorRun(run);if(!run||typeof run!=='object'||run.level!==level||run.mode!==mode)return null;const original=E.restoreSession(JSON.stringify(run),P);if(!original)return null;const guided=level==='rain-shelter-bench'?Guide.normalize(P.LEVELS.find(l=>l.id===level),run,mode,P,E):null,legal=guided?.legal||original;if(guided)run=guided.run;return legal?{run:{...run,version:1,history:legal.history,trial:legal.trial},legal}:null;}
   const stored=v.runs&&typeof v.runs==='object'?v.runs:{};
   for(const [key,run]of Object.entries(stored)){
    if(key.length>100)continue;const task=tasks.find(t=>t.id===key),node=C.nodes.find(n=>key==='cave:'+n.id),level=task?.level||(node?.id==='mouth-latch'?'store-door-latch':node?.level)||(key==='bench'?'rain-shelter-bench':null),mode=task?.mode||(node?'dismantle':key==='bench'?'assemble':null),valid=level&&runFor(run,level,mode);
    if(valid){if(valid.recovered)s.doorRecoveryPending=true;s.runs[key]=valid.run;restoredRuns.set(key,valid.legal);}
    else if(key==='cave:mouth-latch'&&Array.isArray(run?.history)&&run.history.length)s.doorRecoveryPending=true;
   }
   // A committed winning move is sufficient proof, even if refresh happened before "put back".
   for(const t of tasks){if(!restoredRuns.get(t.id)?.completed)break;s.done.push(t.id);}
   const recoveredLesson=tasks.filter(t=>s.done.includes(t.id)&&!savedDone.includes(t.id)).at(-1)?.id;
   // Campaign progress is independent of the old cave's linear-prefix gate logic.
   // Only absent root histories can fall back to old nested histories; an undone or invalid
   // canonical run must never be replaced with a stale completed copy.
   for(const n of C.nodes){
    const key='cave:'+n.id,nested=v.cave?.runs?.[n.id+':dismantle'];
    if(!Object.prototype.hasOwnProperty.call(stored,key)&&nested){const valid=runFor(nested,n.id==='mouth-latch'?'store-door-latch':n.level,'dismantle');if(valid){s.runs[key]=valid.run;restoredRuns.set(key,valid.legal);}}
    if(restoredRuns.get(key)?.completed)s.cave.completed.push(n.id);
    if(s.runs[key])s.cave.runs[n.id+':dismantle']=s.runs[key];
    const assembly=runFor(v.cave?.runs?.[n.id+':assemble'],n.level,'assemble');if(assembly)s.cave.runs[n.id+':assemble']=assembly.run;
   }
   const cp=v.cave?.position;if(Array.isArray(cp)&&cp.length===3&&cp.every(Number.isFinite))s.cave.position=[Math.max(-3.7,Math.min(3.7,cp[0])),1.65,Math.max(-73,Math.min(4,cp[2]))];
   if(!hasNode(s,'mouth-latch')&&s.cave.position[2]<-6.2)s.cave.position=[0,1.65,3];
   if(Number.isFinite(v.cave?.yaw))s.cave.yaw=v.cave.yaw%(Math.PI*2);
   if(Number.isFinite(v.cave?.pitch))s.cave.pitch=Math.max(-1.15,Math.min(1.15,v.cave.pitch));
   s.cave.seenIntro=v.cave?.seenIntro===true;s.cave.finished=canReturn(s)&&v.cave?.finished===true;
   if(phases.indexOf(s.phase)>=3&&s.done.length<tasks.length)s.phase='learning';
   if(phases.indexOf(s.phase)>=7&&!canReturn(s))s.phase='cave';
   if(phases.indexOf(s.phase)>=9&&!restoredRuns.get('bench')?.completed)s.phase='bench';
   if(s.phase==='learning'&&s.done.length===tasks.length)s.phase='night';
   if(s.phase==='bench'&&restoredRuns.get('bench')?.completed)s.phase='farewell';
   if(s.phase==='bench'&&!s.runs.bench)s.runs.bench=Guide.normalize(P.LEVELS.find(l=>l.id==='rain-shelter-bench'),null,'assemble',P,E).run;
   s.scene=s.phase==='cave'?'cave':'village';
   const p=v.village;if(Array.isArray(p?.position)&&p.position.length===3&&p.position.every(Number.isFinite)){s.village.position=[Math.max(-9,Math.min(9,p.position[0])),1.65,Math.max(-11,Math.min(11,p.position[2]))];s.village.yaw=Number.isFinite(p.yaw)?p.yaw:0;s.village.pitch=Number.isFinite(p.pitch)?Math.max(-1.1,Math.min(1.1,p.pitch)):0;}
   // Rehearsals never replace the certified histories used by the journey.
   for(const [key,run]of Object.entries(v.replays||{})){const match=/^(straight|lap|pinned|rain-shelter-bench|cave:[a-z-]+):(dismantle|assemble)$/.exec(key);if(!match)continue;const level=match[1]==='cave:mouth-latch'&&['pinned','store-door-latch'].includes(run?.level)?run.level:match[1].startsWith('cave:')?C.nodes.find(n=>n.id===match[1].slice(5))?.level:match[1],valid=runFor(run,level,match[2]);if(valid)s.replays[key]=valid.run;}
   const stages=['mountain','village','invited','indoors','unpacked','settled'];
   if(v.storyRevision>=4&&v.prologue&&stages.includes(v.prologue.stage)){
    const index=stages.indexOf(v.prologue.stage);s.prologue={stage:v.prologue.stage,invited:index>=2,bagPlaced:index>=4,legacy:v.prologue.legacy===true};
   }else s.prologue={stage:'unpacked',invited:true,bagPlaced:true,legacy:true};
   if(s.phase!=='arrival')s.prologue={...s.prologue,stage:'settled',invited:true,bagPlaced:true};
   s.openingSeen=v.openingSeen===true||s.prologue.legacy||s.prologue.stage!=='mountain'||s.phase!=='arrival';s.spoken=list(v.spoken).filter(x=>typeof x==='string'&&x.length<80).slice(-80);s.pendingReflection=['learning','night'].includes(s.phase)?recoveredLesson||(tasks.some(t=>t.id===v.pendingReflection)&&s.done.includes(v.pendingReflection)?v.pendingReflection:null):null;s.companionUpdated=phases.indexOf(s.phase)>=5;s.suppliesCollected=phases.indexOf(s.phase)>=7;
   s.fieldNotes=Field.restore(v.fieldNotes);s.completionSeen=typeof v.completionSeen==='object'&&v.completionSeen&&!Array.isArray(v.completionSeen)?Object.fromEntries(Object.entries(v.completionSeen).filter(([k,val])=>k.length<100&&typeof val==='string'&&val.length<200).slice(-50)):{};s.completionPresented=Array.isArray(v.completionPresented)?v.completionPresented.filter(id=>tasks.some(t=>t.id===id)):[];s.benchRecoveryPending=v.benchRecoveryPending===true||Object.values(stored).some(r=>r?.level==='rain-shelter-bench'&&E.restoreSession(JSON.stringify(r),P)&&Guide.normalize(P.LEVELS.find(l=>l.id===r.level),r,r.mode,P,E).recovered);
   s.topics=list(v.topics).filter(x=>typeof x==='string'&&x!=='close'&&x.length<50).slice(-50);
   const revision15Talk=['opening','continuationMeetup'];
   const revisedTalk=['welcomeInside','unpack','stay','morning','travelMessage','returned','chairJoint','chairSit',
    'continuationFinalZhou','continuationFinalMemory'];
   const talkId=v.talk?.id;
   const sameLines=v.storyRevision===storyRevision||(!revisedTalk.includes(talkId)&&(
    v.storyRevision===15||
    (v.storyRevision===14&&!revision15Talk.includes(talkId))||
    (v.storyRevision===13&&!soloRevisedTalk.has(talkId))));
   s.talk=v.talk&&typeof v.talk.id==='string'&&v.talk.id.length<100&&Number.isInteger(v.talk.line)?{id:v.talk.id,line:sameLines?Math.max(0,v.talk.line):0}:null;
   if(s.prologue.legacy&&s.talk?.id==='opening')s.talk=null;
   s.visited=phases.filter((id,i)=>i<=phases.indexOf(s.phase)&&(savedVisited.includes(id)||id===s.phase||id==='arrival'));s.observed=['bench','chair','cup','tools','zhou'].filter(id=>savedObserved.includes(id));s.benchChecked=s.phase==='complete'||phases.indexOf(s.phase)>=9&&v.benchChecked===true;s.finished=s.phase==='complete';s.playMs=Number.isFinite(v.playMs)?Math.max(0,v.playMs):0;s.records=list(v.records).slice(-100);s.leavePracticeReminderSeen=v.leavePracticeReminderSeen===true;
   const q=v.settings||{};s.settings={sound:q.sound===true,sensitivity:Number.isFinite(q.sensitivity)?Math.max(.3,Math.min(2,q.sensitivity)):1,volume:Number.isFinite(q.volume)?Math.max(0,Math.min(1,q.volume)):.65,quality:['low','medium','high'].includes(q.quality)?q.quality:'medium',dialogueSound:q.dialogueSound!==false,reducedMotion:q.reducedMotion===true,rainChoice:['auto','leaves','courtyard'].includes(q.rainChoice)?q.rainChoice:'auto'};
   for(const key of ['musicVolume','ambienceVolume'])s.settings[key]=Number.isFinite(q[key])?Math.max(0,Math.min(1,q[key])):1;
   if(v.feedback&&typeof v.feedback==='object')for(const k of ['confusing','feeling','minutes'])if(typeof v.feedback[k]==='string')s.feedback[k]=v.feedback[k].slice(0,1000);
   s.nightBenchSeen=v.nightBenchSeen===true||s.spoken.includes('shelterFirst');Interludes.restore(v,s);
   s.frame=v.version===2&&canEnterFrame(s,v.frame)?v.frame:defaultFrame(s);
   if(s.phase==='complete'&&s.frame==='bench-detail')s.frame='bench-seat';
   // A position is only a migration hint; an image hotspot is never allowed to bypass a gate.
   if(!canEnterFrame(s,s.frame))s.frame=s.phase==='cave'?'store-door':'village';
   s.continuation=Continuation.restore(v.continuation,s.finished,P,E);
   s.roomObjects=Objects.restore(v.roomObjects,s);
   if(s.talk?.id.startsWith('continuation')&&!Continuation.allowed(s.talk.id,s))s.talk=null;
   return s;
  }catch{return s;}
 }
 function objective(s){
  const t=tasks.find(t=>!s.done.includes(t.id)),frame=s.frame||defaultFrame(s),atTable=['room','workbench'].includes(frame),atHome=['room','workbench','chair-detail','tools-detail','chair-seat'].includes(frame),atBench=['shelter','bench-detail'].includes(frame);
  if(s.phase==='arrival'){
   if(frame==='mountain-rain')return '沿石阶下山，到有灯光的村子避雨。';
   if(frame==='zhou-door')return s.prologue?.invited?'主人答应了，进屋暖暖身子。':'在门口打声招呼，问问能不能避雨。';
   if(frame==='room')return s.prologue&&!s.prologue.bagPlaced?'擦擦鞋，把背包放在门边。':'和周伯聊聊，问问今晚在哪里落脚。';
   return '去亮着灯的小屋，问问能不能避雨。';
  }
  if(s.phase==='settle')return atHome?'歇一歇，看看屋里的东西，或和周伯聊聊。':'回小屋暖暖身子，周伯还在整理桌面。';
  if(s.phase==='learning')return atTable?t?.goal||'把样木放好。':atHome?'回到工作台，接着试试样木。':'回周伯家的工作台，接着试试样木。';
  if(s.phase==='night')return frame==='room'?'吃过晚饭，去里间歇一晚。':atHome?'样木收好了，回屋吃饭，再去里间休息。':'回周伯家，吃过饭就歇一晚。';
  if(s.phase==='morning')return atHome?(s.nightBenchSeen||s.spoken?.includes('morning')?'问问周伯，雨棚的长凳还缺什么。':'周伯正在看一张草图，过去聊聊。'):'先回小屋，和周伯聊聊今天的打算。';
  if(s.phase==='depart')return frame==='trail'?'沿石路走到尽头，看看旧库的门闩。':'沿屋旁石路，到旧木料库取料。';
  if(s.phase==='return')return atHome?'料和草图都带回来了，和周伯说一声。':'小车停好了，回小屋喊周伯一起来。';
  if(s.phase==='bench')return atBench?'照着草图，把长凳合好。':'去雨棚，周伯在长凳旁等你。';
  if(s.phase==='farewell')return atBench?(s.benchChecked?'在雨棚坐一会儿，看看凳子用起来怎样。':'请长凳旁的周伯检查一下接缝。'):'回雨棚，看看刚合好的长凳。';
  return s.phase==='cave'?caveGoal(s):s.phase==='complete'?(frame==='bench-seat'?'雨停了，在这里歇歇脚。':atBench?'长凳修好了，再坐一会儿吧。':'随意看看，也可以回雨棚坐一会儿。'):'';
 }
 function caveGoal(s){if(!hasNode(s,'mouth-latch'))return '看看库门的木闩，先把门打开。';if(!hasNode(s,'rack-frame')&&!hasNode(s,'stone-box'))return '找到绑着浅色布带的料，还有装配草图。';if(!hasNode(s,'rack-frame'))return '打开料架前的挡框，取出替换料。';if(!hasNode(s,'stone-box'))return '看看石台上的木匣，草图收在里面。';return '料和草图齐了，可以推车回村，也可以再试试样件。';}
 const api={storyRevision,tasks,phases,frames,requiredCaveIds,optionalCaveIds,fresh,restore,objective,nextObjective:objective,canReturn,canEnterFrame,defaultFrame};root.CampaignData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
