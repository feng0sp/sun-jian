(function(){
 'use strict';
 const $=id=>document.getElementById(id),D=JourneyStory,P=JointPuzzle,E=PuzzleExperience,G=JointGame,N=D.talk.nodes;
 let state;try{state=D.restore(localStorage.getItem('sun-jian-story-v1'),P,E);}catch{state=D.fresh();}
 let scene=null,inStory=false,moving=false,transition=0,collectTimer=null,asideTimer=null,noteDispose=null,noteId=null,inspectingModel=false,introActive=!state.openingSeen;
 let actionTimer=null,actionPhase=null,returnFocus=null,lastChoiceAt=0;
 let sampleAnswer=null;
 let logFocus=null,logView=null,noteFocus=null,heldNames=false,pinnedNames=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const revisit=n=>{
  if(!n?.revisit||!n.revisit.when.some(id=>state.experienced.includes(id)))return null;
  const id=state.talk?.node,lines=id?.endsWith('-talk')?D.talk.linesFor(id,state):null;
  if(lines?.some((line,i)=>line[0]!==n.lines[i][0]||line[1]!==n.lines[i][1]))return null;
  return n.revisit.line;
 };
 const task=()=>D.tasks.find(t=>t.beat===state.beat),isDialogue=()=>!!state.talk,node=()=>N[state.talk?.node];
 const sampleId=()=>state.talk?.returnTo?.replace(/^sample-/,''),study=()=>{if(!state.study)return null;const [levelId,mode]=state.study.split(':');return {id:'study:'+state.study,levelId,mode,hotspot:levelId,title:D.samples.find(n=>n.id===levelId)?.name,objective:mode==='assemble'?'选中散件，观察接点，试着把它们合回原位。':'转着观察接点，再按住可动木件试着拆开。'};};
 const studyBar=document.createElement('div');studyBar.id='story-study-bar';studyBar.hidden=true;studyBar.innerHTML='<span id="story-study-status" role="status"></span><div><button id="story-study-dismantle">拆开试试</button><button id="story-study-assemble">合回试试</button><button id="story-study-again" hidden>再来一次</button><button id="story-study-put">放回小屋 →</button></div>';document.querySelector('.stage-heading').after(studyBar);
 const moreSamples=document.createElement('button');moreSamples.id='story-more-samples';moreSamples.textContent='看看新增的三件样木 →';moreSamples.hidden=true;$('story-continue-task').after(moreSamples);moreSamples.onclick=()=>openNotebook('dovetail');
 const noteActions=document.createElement('div');noteActions.id='story-note-actions';noteActions.hidden=true;noteActions.innerHTML='<button id="story-note-task">动手完成这一步 →</button><button id="story-note-dismantle">拿来试拆 →</button><button id="story-note-assemble">试着合回 →</button>';$('story-notebook-dialog').append(noteActions);
 const noteViews=document.createElement('div');noteViews.id='story-note-views';noteViews.innerHTML='<div role="group" aria-label="结构观察方式"><button id="story-note-together" aria-pressed="true">合拢看</button><button id="story-note-separated" aria-pressed="false">分件看接面</button><button id="story-note-solo" aria-pressed="false" disabled>只看这件</button><button id="story-note-reset">回正视角 ↶</button></div><div id="story-note-parts" role="group" aria-label="选择要观察的构件"></div><p id="story-note-part-detail" role="status">拖动旋转，点选一件看轮廓。分件排布只作观察，不表示拆解顺序。</p>';$('story-note-model').after(noteViews);
 const noteRecords=document.createElement('div');noteRecords.id='story-note-records';$('story-note-memory').after(noteRecords);
 const shelfButton=document.createElement('button');shelfButton.id='story-samples';shelfButton.textContent='台上样木';$('story-log').after(shelfButton);
 const shelf=JourneyShelf.create({observe:id=>{selectObject(id);openNotebook(id,true);},practice:(id,mode)=>openStudy(id,mode),task:()=>openPuzzle()});
 shelfButton.onclick=()=>{if(inStory&&state.view==='world'&&!introActive&&!isDialogue()&&!moving&&!actionTimer){shelf.open(state);syncNames();}};
 const studyTalk=document.createElement('button');studyTalk.id='story-study-talk';studyTalk.textContent='和周伯聊聊这处';studyTalk.hidden=true;studyTalk.className='stage-tool';$('replay-moves').after(studyTalk);studyTalk.onclick=()=>returnStudy(true);
 const answer=document.createElement('p');answer.id='story-sample-answer';answer.hidden=true;answer.setAttribute('role','status');$('story-choices').before(answer);
 const namesButton=document.createElement('button');namesButton.id='story-object-names';namesButton.textContent='物件名称 · 按住 H';namesButton.setAttribute('aria-pressed','false');document.querySelector('.story-location>span:last-child').replaceWith(namesButton);
 function syncNames(){const available=inStory&&state.view==='world'&&!introActive&&!isDialogue()&&!moving&&!document.querySelector('dialog[open]');scene?.setLabels(available&&(heldNames||pinnedNames));namesButton.disabled=!available;namesButton.setAttribute('aria-pressed',pinnedNames);}
 namesButton.onclick=()=>{pinnedNames=!pinnedNames;syncNames();};
 document.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='h'||e.ctrlKey||e.metaKey||e.altKey||!inStory||state.view!=='world'||introActive||isDialogue()||moving||document.querySelector('dialog[open]')||e.target.closest('input,textarea,select,[contenteditable=true]'))return;e.preventDefault();heldNames=true;syncNames();});
 document.addEventListener('keyup',e=>{if(e.key.toLowerCase()==='h'){heldNames=false;syncNames();}});window.addEventListener('blur',()=>{heldNames=false;syncNames();});
 document.addEventListener('close',syncNames,true);
 function checkedRun(id,mode){const run=state.studyRuns[id+':'+mode];return run&&E.restoreSession(JSON.stringify(run),P);}
 function actionLabel(id,mode){const run=checkedRun(id,mode);return run?.history.length&&!run.completed?(mode==='assemble'?'继续刚才的合回':'继续刚才的试拆'):(mode==='assemble'?'合回':'拆开');}

 function placeStudy(){const s=study(),run=s&&checkedRun(s.levelId,s.mode);if(state.beat===9&&run?.completed)state.placements[s.levelId]=s.mode;}
 function save(){try{localStorage.setItem('sun-jian-story-v1',JSON.stringify(state));}catch{if(inStory)$('story-progress').textContent='临时游玩 · 无法保存';}}
 function message(text){clearTimeout(asideTimer);$('story-aside').textContent=text;$('story-aside').hidden=false;asideTimer=setTimeout(()=>$('story-aside').hidden=true,5500);}
 function makeScene(){if(scene)return;try{scene=WoodWorkshop.create($('workshop-view'),selectObject);}catch{$('story-renderer-error').hidden=false;}}
 function visibleChoice(c){if(['sample-dismantle','sample-assemble'].includes(c.id)&&task()?.hotspot===sampleId())return false;return !c.when||c.when==='unlearned'&&!state.learningAccepted||c.when==='learned'&&state.learningAccepted||c.when==='learning'&&!!task()||c.when==='finished'&&state.completed.length===4||c.when==='sample-current'&&task()?.hotspot===sampleId()||c.when==='sample-learned'&&D.canStudy(state,sampleId());}
 function choiceOrder(c){return ['sample-task','sample-dismantle','sample-assemble','sample-try','sample-inspect','sample-question','sample-leave'].indexOf(c.id);}
 function options(){const n=node(),choices=n&&state.talk.line===n.lines.length-1&&!actionTimer?(n.choices||[]).filter(visibleChoice):[];return n?.sample?choices.sort((a,b)=>choiceOrder(a)-choiceOrder(b)):choices;}
 function sceneState(){const n=node(),location=introActive?'village':n?.action==='sit'?(actionPhase==='seated'?'seated':'chair'):n?.shot||'room';document.body.classList.toggle('story-detail',['chair','seated'].includes(location));scene?.setLocation(location);scene?.update(state.completed,introActive||!state.learningAccepted?null:task()?.hotspot,introActive||isDialogue()||moving,state.beat===9,Object.fromEntries(D.samples.map(n=>[n.id,D.displayMode(state,n.id)])));document.body.classList.toggle('story-action',!!n?.action);document.body.classList.toggle('story-pouring',n?.action==='pour');document.body.classList.toggle('story-cup-warm',state.experienced.includes('tea-pour'));document.body.classList.toggle('story-has-choices',options().length>0);}
 function remember(kind,speaker,text,nodeId,lineNumber){
  if(!text)return;const entry={kind,speaker,text,node:nodeId,line:lineNumber},last=state.conversationLog.at(-1);
  if(last&&Object.keys(entry).every(key=>entry[key]===last[key]))return;
  state.conversationLog.push(entry);if(state.conversationLog.length>120)state.conversationLog.shift();save();
 }
 function render(){
  const n=node(),choices=options(),reflection={2:'直榫已经拆开了，聊聊刚才看到的接面。',4:'两根木条已经分开了，和周伯聊聊它们的搭接。',6:'小销和木榫收好了，听听周伯的补充。',8:'第一件样木已经合好，记下今天的观察。'}[state.beat];
  const s=study(),run=s&&state.studyRuns[state.study],done=run&&E.restoreSession(JSON.stringify(run),P)?.completed;
  document.body.classList.toggle('story-sample',!!state.talk?.returnTo?.startsWith('sample-'));document.body.classList.toggle('story-sample-card',!!n?.sample);answer.hidden=!n?.sample||!sampleAnswer;answer.textContent=sampleAnswer?'周伯：'+sampleAnswer:'';
  studyBar.hidden=!inStory||state.view!=='puzzle'||!s;
  studyTalk.hidden=!inStory||state.view!=='puzzle'||!s;studyTalk.disabled=moving||G.inspection().busy;
  shelfButton.hidden=state.view!=='world'||introActive;shelfButton.disabled=isDialogue()||moving||!!actionTimer;
  if(s){
   const valid=checkedRun(s.levelId,s.mode),total=P.LEVELS.find(l=>l.id===s.levelId).pieces.filter(p=>!p.fixed).length,count=valid?(s.mode==='assemble'?total-valid.removed.length:valid.removed.length):0;
   const response={...Object.fromEntries(D.extras.map(n=>[n.id,n.response])),straight:'看看榫肩与卯座相贴的那一圈。',lap:'两处凹口重新交叠，接缝也对齐了。',pinned:'小销穿回接点，木榫又被它约束住了。'};
   const discoveries={straight:'周伯：露出来这截，就是刚才藏在卯口里的榫。',lap:'周伯：从侧面比一比，两根各让出半个厚度。',pinned:'周伯：看看销孔的位置，小件管住的正是大件的去路。',dovetail:'周伯：槽的斜面和出口的木钥，各管着一处。', 'shoulder-lap':'周伯：销和搭口拆开看，还是前面见过的两种接点。','burr-three':'周伯：抱在中央的几道槽都露出来了，转着对照看看。'};
   $('story-study-status').textContent=done?(s.mode==='assemble'?'合好了。'+response[s.levelId]:'拆开了。'+discoveries[s.levelId]):(s.mode==='assemble'?'已归位 ':'已取下 ')+count+' / '+total+' · 随时可撤销，离开后能继续';
   studyBar.classList.toggle('complete',!!done);$('story-study-again').hidden=!done;
   for(const mode of ['dismantle','assemble']){const button=$('story-study-'+mode);button.setAttribute('aria-pressed',s.mode===mode);button.disabled=s.mode===mode;button.textContent=mode==='assemble'?'合回':'拆开';button.classList.toggle('suggested',!!done&&s.mode!==mode);}
  }
  moreSamples.hidden=state.beat!==9||state.view!=='world'||introActive||isDialogue();
  $('story-note-count').textContent=D.notes.filter(n=>state.completed.includes(n.task)).length+' / 3';$('story-back').hidden=state.view!=='puzzle';
  $('story-task-label').textContent=state.view==='puzzle'?(s?'随手练习 · '+s.title:task()?.title)||'雨歇之前':'雨歇之前 · 溪桥村';
  $('story-progress').textContent=introActive?'徒步途中 · '+(state.openingLine+1)+' / '+D.opening.length:state.beat===9?'雨夜留宿 · 记下这次相遇':reflection?'刚才的发现 · '+state.completed.length+' / 4':task()?'动手认识 · '+(D.tasks.indexOf(task())+1)+' / 4':state.arrivalDone?'雨夜留宿 · 自由交谈':'小屋门边 · 借宿';
  $('story-objective-text').textContent=introActive?'天快黑了，先找个地方避雨。':task()?.title||reflection||(state.beat===9?'桌上多了燕尾、锁肩和三件初锁。挑一件，继续试着拆合吧。':state.arrivalDone?'歇一歇，和周伯聊聊。想试木作时，可以主动请教。':'和周伯打个招呼，问问能否留宿。');
  $('story-continue-task').hidden=introActive||!task()||state.view==='puzzle'||isDialogue();$('story-continue-task').textContent=state.runs[task()?.id]?.history.length?'继续刚才的尝试 →':'走近这件样木 →';
  $('story-replay-opening').hidden=state.view==='puzzle'||introActive||isDialogue();document.body.classList.toggle('story-intro',introActive);$('story-place-text').textContent=introActive?'溪桥村 · 村口雨棚':'溪桥村 · 周伯家的木工作业角';$('story-location-label').textContent=introActive?'山路遇雨，进村暂歇。':'雨夜借宿，慢慢认识一门手艺。';
  const line=introActive?D.opening[state.openingLine]:revisit(n)||(n?.taskLines?.[task()?.id]||D.talk.linesFor(state.talk?.node,state))?.[state.talk.line];$('story-dialogue').hidden=!line||state.view==='puzzle';
  $('story-choices').replaceChildren(...choices.map(c=>{const b=document.createElement('button');b.dataset.choice=c.id;b.textContent=c.id==='sample-dismantle'?actionLabel(sampleId(),'dismantle'):c.id==='sample-assemble'?actionLabel(sampleId(),'assemble'):c.text;const seen=c.experience||c.complete;if(seen&&state.experienced.includes(seen)){const mark=document.createElement('small');mark.textContent='已体验';b.append(mark);}b.onclick=()=>choose(c.id);return b;}));
  if(line){const sampleNote=n?.sample&&D.samples.find(x=>x.id===n.sample),stored=sampleNote&&D.displayMode(state,n.sample)==='dismantle';$('story-speaker').textContent=sampleNote?n.label:line[0];$('story-line').textContent=(sampleNote?(task()?.hotspot===n.sample?'当前任务 · '+(task().mode==='assemble'?'合回样木':'拆开样木'):D.canStudy(state,n.sample)?(stored?'已分开收好 · 可继续拆合':'已合拢 · 可拿起试拆'):'先观察接点，想试时再请周伯教你。'):line[1])+(sampleNote?.extra&&!D.canStudy(state,n.sample)?' 周伯说，先把手边的三件学完，再来试这件。':'');$('story-speaker').nextElementSibling.textContent=sampleNote?'木作样件':introActive?'徒步途中':line[0]==='我'?'溪桥村 · 旅途中':line[0]==='周伯'?'窗边 · 周伯家':'手机消息 · 同行的朋友';$('story-skip').hidden=choices.length>0;$('story-skip').textContent=introActive?'跳过进村开场':actionTimer?'跳过动作':'快进这段';$('story-next').hidden=choices.length>0;$('story-next').textContent=actionTimer?'继续动作 →':introActive&&state.openingLine===D.opening.length-1?'走近小屋 →':'继续 →';}
  if(line&&inStory&&state.view==='world')remember('line',$('story-speaker').textContent,$('story-line').textContent,introActive?'opening':state.talk.node,introActive?state.openingLine:state.talk.line);
  $('story-log').disabled=!!actionTimer||moving;$('story-notebook').disabled=!!actionTimer;sceneState();syncNames();if(choices.length&&!$('story-choices').contains(document.activeElement))$('story-choices').querySelector('button')?.focus({preventScroll:true});
 }
 function cancelAction(){clearTimeout(actionTimer);actionTimer=null;actionPhase=null;}
 function completeExperience(id){if(id&&!state.experienced.includes(id))state.experienced.push(id);}
 function go(id,returnTo=state.talk?.returnTo||'zhou',resetScene=true){
  cancelAction();sampleAnswer=null;if(!N[id])return;state.talk={node:id,line:0,returnTo};state.line=0;
  const n=N[id];if(revisit(n))state.talk.line=n.lines.length-1;if(resetScene)scene?.reset(0);const focus=n.taskLines?task()?.hotspot:n.focus;if(focus)scene?.focus(focus,reduced?0:350);
  if(n.action){actionPhase='start';if(!reduced)actionTimer=setTimeout(()=>{actionTimer=null;actionPhase=n.action==='sit'?'seated':'warm';render();},n.action==='sit'?1100:1400);else actionPhase=n.action==='sit'?'seated':'warm';}
  save();render();if(!$('story-next').hidden)$('story-next').focus({preventScroll:true});
 }
 function closeTalk(){cancelAction();sampleAnswer=null;state.talk=null;scene?.reset(reduced?0:350);save();render();if(returnFocus?.isConnected&&!returnFocus.disabled)returnFocus.focus({preventScroll:true});returnFocus=null;}
 function route(to){
  if(to==='$inspect-last'){const previous=D.tasks.find(t=>t.beat===state.beat-1);if(previous&&state.completed.includes(previous.id))openNotebook(previous.levelId,true);return;}
  if(to==='$record'){const previous=D.tasks.find(t=>t.beat===state.beat-1);if(previous)JointReplay.open(state.runs[previous.id],'刚才这一步 · '+(previous.mode==='assemble'?'合回':'拆开'));return;}
  if(to==='$inspect'){openNotebook(sampleId(),true);return;}
  if(to==='$task'){closeTalk();openPuzzle();return;}
  if(to.startsWith('$study:')){const id=sampleId();closeTalk();openStudy(id,to.split(':')[1]);return;}
  if(to==='$back'){go(state.talk?.returnTo||'zhou');return;}
  if(to==='$close'){closeTalk();return;}
  if(to==='$settled'){state.arrivalDone=true;state.replaying=false;closeTalk();return;}
  if(to==='$invite'){go(state.heritageKnown?'invitation':'heritage');return;}
  if(to==='$learn'){if(!state.learningAccepted&&state.beat===0&&state.arrivalDone){state.learningAccepted=true;state.heritageKnown=true;state.beat=1;}closeTalk();return;}
  if(to==='$advance'){if([2,4,6].includes(state.beat)){state.beat++;state.line=0;}closeTalk();return;}
  if(to==='$end'){if(state.completed.length!==4)return;state.beat=9;closeTalk();$('story-end-dialog').showModal();return;}
  go(to);
 }
 function choose(id){
  if(!inStory||moving||introActive||state.view!=='world'||document.querySelector('dialog[open]')||performance.now()-lastChoiceAt<220)return;
  const c=options().find(x=>x.id===id);if(!c)return;lastChoiceAt=performance.now();remember('choice','选择',c.id==='sample-dismantle'?actionLabel(sampleId(),'dismantle'):c.id==='sample-assemble'?actionLabel(sampleId(),'assemble'):c.text,state.talk.node,state.talk.line);if(c.id==='sample-question'&&node()?.sample){sampleAnswer=sampleAnswer?null:D.talk.sampleReply(sampleId(),state);completeExperience(c.experience);if(sampleAnswer)remember('line','周伯',sampleAnswer,c.to,0);save();render();$('story-choices').querySelector('[data-choice=sample-question]')?.focus();return;}completeExperience(c.complete);if(c.heritage){state.heritageKnown=true;completeExperience('heritage-known');}route(c.to);
 }
 function setView(view){state.view=view;document.body.classList.toggle('story-world',view==='world');document.body.classList.toggle('story-puzzle',view==='puzzle');scene?.setActive(view==='world');$('story-aside').hidden=true;render();}
 function enter(){
  if(inStory)return;const route=new URL(location.href);route.search='?story=1';history.replaceState(null,'',route);inStory=true;G.enterStory();state.active=true;$('story-root').hidden=false;document.body.classList.add('story-mode');$('open-story').disabled=true;makeScene();const resumePuzzle=state.view==='puzzle'&&task();setView('world');scene?.reset(0);save();
  if(state.study)openStudy(...state.study.split(':'),{instant:true,resume:true});else if(resumePuzzle)openPuzzle(true);else if(state.beat===9&&!state.endingSeen&&!introActive&&!state.talk)$('story-end-dialog').showModal();else if(node()?.focus)scene?.focus(node().focus,0);
 }
 function exit(){
  if(!inStory)return;const route=new URL(location.href);route.search='?practice=1';history.replaceState(null,'',route);transition++;clearTimeout(collectTimer);collectTimer=null;moving=false;document.body.classList.remove('is-story-transition');
  if(node()?.action){const back=node().resume;cancelAction();state.talk={node:back,line:0,returnTo:back};}
  G.suspend();placeStudy();state.active=false;save();document.querySelectorAll('dialog[open]').forEach(d=>d.close());scene?.setActive(false);inStory=false;studyBar.hidden=true;$('story-root').hidden=true;document.body.classList.remove('story-mode','story-world','story-puzzle','story-intro','story-action','story-pouring','story-cup-warm','story-has-choices','story-detail','story-sample','story-sample-card');$('open-story').disabled=false;$('story-aside').hidden=true;G.returnPractice();
 }
 function selectObject(id){
  if(!inStory||state.view!=='world'||introActive||moving||isDialogue()||document.querySelector('dialog[open]'))return;
  returnFocus=document.querySelector('[data-hotspot="'+id+'"]');
  if(D.inspections[id]){state.observed=[...new Set([...state.observed,id])];go(id,id);return;}
  if(D.samples.some(n=>n.id===id)){go('sample-'+id,'sample-'+id);return;}
 }
 async function openPuzzle(instant=false){
  const current=task();if(!current||moving||!inStory||introActive||isDialogue()||!state.learningAccepted)return;
  const saved=state.runs[current.id],valid=saved&&E.restoreSession(JSON.stringify(saved),P);if(valid?.completed){finishTask(current.id,saved);return;}
  moving=true;const token=++transition;sceneState();if(!instant&&scene)await scene.focus(current.hotspot,reduced?0:600);if(token!==transition||!inStory)return;
  document.body.classList.add('is-story-transition');setView('puzzle');G.openStoryPuzzle({...current,taskId:current.id,run:saved});$('level-title').textContent=current.hotspot==='straight'?'台前的一处接点':current.hotspot==='lap'?'交叠的两根木条':'一处带销的接点';$('level-subtitle').textContent=current.objective;
  if(!G.rendererAvailable())$('precise-controls').open=true;
  if(current.mode==='dismantle')$('feedback-text').textContent='按住木件沿接点试探；碰到就停，短拉松手会回位。';
  requestAnimationFrame(()=>{G.resize();document.body.classList.remove('is-story-transition');});moving=false;save();render();
 }
 async function openStudy(id,mode,{instant=false,restart=false,resume=false}={}){
  const note=D.samples.find(n=>n.id===id);if(!inStory||moving||!note||!D.canStudy(state,id)||!['dismantle','assemble'].includes(mode))return;
  G.suspend();placeStudy();const key=id+':'+mode,previous=state.studyRuns[key];if(restart||!resume&&previous&&E.restoreSession(JSON.stringify(previous),P)?.completed)delete state.studyRuns[key];state.study=key;state.talk=null;
  moving=true;const token=++transition;sceneState();if(!instant&&scene)await scene.focus(id,reduced?0:600);if(token!==transition||!inStory)return;
  const s=study();setView('puzzle');G.openStoryPuzzle({...s,taskId:s.id,run:state.studyRuns[key]});$('level-title').textContent=s.title+' · '+(mode==='assemble'?'合回':'拆开');$('level-subtitle').textContent='周伯：慢慢试。拿不动就停一下，转个角度再看看。';
  if(!G.rendererAvailable())$('precise-controls').open=true;G.resize();moving=false;save();render();
 }
 function returnStudy(topic=false){const s=study();if(!inStory||!s||state.view!=='puzzle'||moving)return;const id=s.levelId;transition++;G.suspend();placeStudy();state.study=null;state.talk=null;returnFocus=document.querySelector('[data-hotspot="'+id+'"]');setView('world');scene?.reset(reduced?0:600);if(topic){go('sample-'+id,'sample-'+id,false);sampleAnswer=D.talk.sampleReply(id,state);render();}else closeTalk();save();}
 function back(){if(!inStory||state.view!=='puzzle')return;if(state.study){returnStudy();return;}const current=task(),run=state.runs[current?.id];if(current&&run&&E.restoreSession(JSON.stringify(run),P)?.completed){finishTask(current.id,run);return;}transition++;clearTimeout(collectTimer);collectTimer=null;G.suspend();setView('world');scene?.reset(reduced?0:600);save();}
 function finishTask(id,run){
  const current=task();if(!inStory||current?.id!==id||state.completed.includes(id))return;const checked=E.restoreSession(JSON.stringify(run),P);if(!checked?.completed)return;
  clearTimeout(collectTimer);collectTimer=null;G.suspend();state.completed.push(id);state.runs[id]=run;state.beat++;state.line=0;state.talk={node:'after-'+state.beat,line:0,returnTo:'zhou'};setView('world');scene?.reset(reduced?0:600);save();
 }
 function nextDialogue(skip=false){
  if(!inStory||state.view!=='world'||document.querySelector('dialog[open]'))return;
  if(introActive){if(!skip&&state.openingLine<D.opening.length-1)state.openingLine++;else{introActive=false;state.openingSeen=true;state.openingLine=0;scene?.reset(0);if(state.replaying||!state.arrivalDone)state.talk={node:'arrival',line:0,returnTo:'zhou'};}save();render();return;}
  if(actionTimer){cancelAction();actionPhase=node()?.action==='sit'?'seated':'warm';render();return;}
  const n=node();if(!n)return;
  if(options().length)return;
  if(state.talk.line<n.lines.length-1){state.talk.line=skip?n.lines.length-1:state.talk.line+1;state.line=state.talk.line;save();render();return;}
  completeExperience(n.complete);route(n.next||'$close');
 }

 function openNotebook(id,inspect=false){
  if(!inStory||moving||actionTimer)return;const available=D.samples.filter(n=>D.canStudy(state,n.id));if(!available.length&&!inspect){message('手记还是空白的。先动手看看台前的样木吧。');return;}
  $('story-note-date').textContent=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric'}).format(new Date())+' · 途中速记';
  inspectingModel=inspect;noteId=inspect?id:id&&available.some(n=>n.id===id)?id:available[0].id;noteFocus=document.activeElement;G.suspend();scene?.setActive(false);$('story-notebook-dialog').showModal();showNote(noteId);syncNames();
 }
 function showNote(id){
  noteDispose?.();noteDispose=null;const note=D.samples.find(n=>n.id===id);noteId=id;
  $('story-note-tabs').replaceChildren(...D.samples.filter(n=>!n.extra||D.canStudy(state,n.id)||n.id===id).map(n=>{const b=document.createElement('button');const learned=D.canStudy(state,n.id);b.textContent=learned||n.extra?n.name:({straight:'台前样木',lap:'交叠木条',pinned:'带销样木'})[n.id];b.classList.toggle('extra',!!n.extra);b.disabled=!learned&&!(inspectingModel&&n.id===id);b.setAttribute('aria-pressed',n.id===id);b.onclick=()=>showNote(n.id);return b;}));
  noteRecords.replaceChildren();const recorded=[...D.tasks.filter(t=>t.levelId===id).map(t=>({label:t.mode==='assemble'?'第一次合回':'第一次拆开',run:state.runs[t.id]})),...['dismantle','assemble'].map(mode=>({label:mode==='assemble'?'最近一次合回':'最近一次试拆',run:state.studyRuns[id+':'+mode]}))].filter(r=>r.run?.history.length&&E.restoreSession(JSON.stringify(r.run),P));
  if(recorded.length){const title=document.createElement('span');title.textContent='回看自己做过的动作';noteRecords.append(title);for(const r of recorded){const button=document.createElement('button');button.textContent=r.label+' ↗';button.onclick=()=>JointReplay.open(r.run,note.name+' · '+r.label);noteRecords.append(button);}}
  const learned=D.canStudy(state,id);$('story-note-title').textContent=learned?note.name:'先看看相接的地方';$('story-note-method').textContent=learned?note.text:'可以拖动示意，看看木件怎样接在一起。';$('story-note-memory').textContent=learned?note.memory:'周伯：先看相接的地方，等动手时再慢慢验证。';
  const canLaunch=state.view==='world'&&!introActive&&(!state.talk||state.talk.returnTo.startsWith('sample-'));noteActions.hidden=!canLaunch||(!learned&&task()?.hotspot!==id);$('story-note-task').hidden=task()?.hotspot!==id;for(const mode of ['dismantle','assemble']){$('story-note-'+mode).hidden=!learned||task()?.hotspot===id;$('story-note-'+mode).textContent=actionLabel(id,mode)+' →';}
  $('story-note-together').setAttribute('aria-pressed','true');$('story-note-separated').setAttribute('aria-pressed','false');$('story-note-solo').setAttribute('aria-pressed','false');$('story-note-solo').disabled=true;noteViews.hidden=!learned;
  const parts=P.LEVELS.find(l=>l.id===id).pieces;
  $('story-note-parts').replaceChildren(...parts.map(p=>{const b=document.createElement('button');b.textContent=(p.symbol||'座')+' · '+p.name;b.dataset.notePart=p.id;b.setAttribute('aria-pressed','false');b.onclick=()=>noteDispose?.select(p.id);return b;}));
  $('story-note-part-detail').textContent='拖动旋转，点选一件看轮廓。分件排布只作观察，不表示拆解顺序。';
  $('story-note-model').replaceChildren();try{noteDispose=WoodWorkshop.notebook($('story-note-model'),id,{onSelect:part=>{$('story-note-solo').disabled=!part;document.querySelectorAll('[data-note-part]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.notePart===part));const p=parts.find(p=>p.id===part);$('story-note-part-detail').textContent=p?p.name+'：'+(p.description||'留意槽口、肩面与相邻木件接触的位置。'):'拖动旋转，点选一件看轮廓。';}});}catch{$('story-note-model').textContent='当前浏览器无法显示旋转示意。观察方法仍可阅读。';noteViews.hidden=true;}
 }
 for(const [id,separated]of [['story-note-together',false],['story-note-separated',true]])$(id).onclick=()=>{noteDispose?.isolate(false);noteDispose?.separate(separated);$('story-note-solo').setAttribute('aria-pressed','false');$('story-note-together').setAttribute('aria-pressed',!separated);$('story-note-separated').setAttribute('aria-pressed',separated);};$('story-note-solo').onclick=()=>{noteDispose?.isolate(true);$('story-note-solo').setAttribute('aria-pressed','true');$('story-note-together').setAttribute('aria-pressed','false');$('story-note-separated').setAttribute('aria-pressed','false');};$('story-note-reset').onclick=()=>noteDispose?.reset();
 function openLog(){
  if(!inStory||moving||actionTimer||state.view==='puzzle'&&G.inspection().settling||document.querySelector('dialog[open]'))return;logFocus=document.activeElement;logView={view:state.view,key:G.inspection().key};G.suspend();scene?.setActive(false);
  const entries=$('story-log-entries');entries.replaceChildren(...state.conversationLog.map(e=>{const row=document.createElement('div');row.className='story-log-entry '+(e.kind==='choice'?'is-choice':'');const speaker=document.createElement('strong'),text=document.createElement('p');speaker.textContent=e.speaker;text.textContent=e.text;row.append(speaker,text);return row;}));if(!entries.children.length)entries.textContent='还没有记录。先和周伯聊两句吧。';$('story-log-dialog').showModal();entries.scrollTop=entries.scrollHeight;$('story-log-return').focus({preventScroll:true});
 }
 $('story-log').onclick=openLog;$('story-log-close').onclick=$('story-log-return').onclick=()=>$('story-log-dialog').close();$('story-log-dialog').addEventListener('close',()=>{if(inStory){if(state.view==='world')scene?.setActive(true);else if(logView?.view==='puzzle'&&G.inspection().key===logView.key)G.resume();}if(logFocus?.isConnected&&!logFocus.disabled)logFocus.focus({preventScroll:true});logFocus=null;logView=null;});
 $('story-notebook-dialog').addEventListener('close',()=>{noteDispose?.();noteDispose=null;if(!inStory)return;if(state.view==='world')scene?.setActive(true);else if(task()||study()){G.resume();}if(noteFocus?.isConnected&&!noteFocus.disabled)noteFocus.focus({preventScroll:true});noteFocus=null;syncNames();});
 window.addEventListener('joint:story-hint',e=>{const d=e.detail;if(!inStory||state.view!=='puzzle'||d.taskId!==(study()?.id||task()?.id)||typeof d.text!=='string')return;remember('line','周伯',d.text,'task-help',Math.max(0,Math.min(2,d.stage-1)));});
 window.addEventListener('joint:story-change',e=>{if(inStory&&study()?.id===e.detail.taskId){state.studyRuns[state.study]=e.detail.run;save();render();return;}const current=task();if(!inStory||current?.id!==e.detail.taskId)return;state.runs[current.id]=e.detail.run;if(collectTimer&&!E.restoreSession(JSON.stringify(e.detail.run),P)?.completed){clearTimeout(collectTimer);collectTimer=null;}save();});
 window.addEventListener('joint:inspection-state',()=>{if(inStory&&state.study)studyTalk.disabled=G.inspection().busy;});
 window.addEventListener('joint:story-complete',e=>{if(!inStory||task()?.id!==e.detail.taskId||collectTimer)return;const {taskId,run}=e.detail;collectTimer=setTimeout(()=>finishTask(taskId,run),reduced?0:480);});
 window.addEventListener('joint:story-blocked',e=>{if(!inStory||task()?.id!==e.detail.taskId||state.heard.includes(e.detail.taskId))return;state.heard.push(e.detail.taskId);message(task().blocked);save();});
 $('open-story').onclick=enter;$('start-story').onclick=enter;$('story-exit').onclick=exit;$('story-fallback-exit').onclick=exit;$('story-back').onclick=back;$('story-notebook').onclick=()=>openNotebook(study()?.levelId||task()?.hotspot);$('story-next').onclick=()=>nextDialogue();$('story-skip').onclick=()=>nextDialogue(true);$('story-continue-task').onclick=()=>openPuzzle();$('story-end-world').onclick=()=>$('story-end-dialog').close();$('story-end-practice').onclick=exit;
 $('story-end-dialog').addEventListener('close',()=>{if(state.beat===9){state.endingSeen=true;save();}});
 for(const mode of ['dismantle','assemble']){$('story-study-'+mode).onclick=()=>{const s=study();if(s&&s.mode!==mode)openStudy(s.levelId,mode,{instant:true});};$('story-note-'+mode).onclick=()=>{const id=noteId;$('story-notebook-dialog').close();closeTalk();openStudy(id,mode);};}$('story-study-again').onclick=()=>{const s=study();if(s)openStudy(s.levelId,s.mode,{instant:true,restart:true});};$('story-study-put').onclick=back;
 $('story-note-task').onclick=()=>{$('story-notebook-dialog').close();closeTalk();openPuzzle();};
 $('story-replay-opening').onclick=()=>{if(state.view!=='world'||moving||isDialogue())return;state.replaying=true;state.openingSeen=false;introActive=true;state.openingLine=0;scene?.reset(0);save();render();};
 $('story-dismiss-graphics').onclick=()=>$('story-renderer-error').hidden=true;
 $('story-choices').addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const list=[...$('story-choices').querySelectorAll('button')];if(!list.length)return;e.preventDefault();const i=list.indexOf(document.activeElement);list[e.key==='Home'?0:e.key==='End'?list.length-1:(i+(e.key==='ArrowDown'?1:-1)+list.length)%list.length].focus();});
 // Keep a held confirmation key from activating the newly focused choice or modal.
 document.addEventListener('keydown',e=>{if(inStory&&e.repeat&&(e.key==='Enter'||e.code==='Space'))e.preventDefault();},true);
 document.addEventListener('keydown',e=>{if(e.defaultPrevented||!inStory||e.repeat||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]'))return;if(e.key==='Escape'&&state.view==='world'&&state.talk&&D.talk.roots.includes(state.talk.returnTo)&&state.arrivalDone&&![2,4,6,8].includes(state.beat)&&!state.replaying){e.preventDefault();closeTalk();}else if(e.key==='Escape'&&state.view==='puzzle'){e.preventDefault();back();}else if((e.key==='Enter'||e.code==='Space')&&state.view==='world'&&!e.target.closest('button')){e.preventDefault();nextDialogue();}});
 function rollbackAction(){if(!inStory||!node()?.action)return;const id=node().resume;cancelAction();state.talk={node:id,line:0,returnTo:id};scene?.reset(0);save();render();}
 window.addEventListener('blur',rollbackAction);window.addEventListener('resize',rollbackAction);window.addEventListener('pagehide',()=>{if(inStory)save();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&inStory){if(state.view==='puzzle')G.suspend();save();}else if(inStory&&state.view==='puzzle'&&(task()||study())&&!document.querySelector('dialog[open]')){G.resume();}});
  window.Journey={snapshot:()=>JSON.parse(JSON.stringify({state,inStory,moving,introActive,action:actionPhase,notebook:noteDispose?.snapshot?.()||null,choices:options().map(c=>c.id),scene:scene?.snapshot()||{available:false}}))};
 if(state.active&&new URLSearchParams(location.search).has('story'))enter();
})();
