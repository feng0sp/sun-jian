/* Complete journey controller. Legacy story, cave and practice saves are not campaign progress. */
(function(){
 'use strict';
 const F=CampaignFinale,Next=CampaignContinuation,I=CampaignInterludes,D=CampaignData,P=JointPuzzle,E=PuzzleExperience,C=CaveData,G=JointGame,Museum=CampaignMuseum,$=id=>document.getElementById(id),KEY='sun-jian-campaign-v1';
 const Sessions={restoreSession:(raw,P)=>AssemblyGuide.restoreSession(raw,P,E)};
 let museumLegacyRaw=null,workshopLegacyRaw=null,familyLegacyRaw=null,awardsLegacyRaw=null,awardReplay=null;
 let toneLegacyRaw=null,posterLegacyRaw=null,soloLegacyRaw=null,emotionLegacyRaw=null,fullLegacyRaw=null,state,legacyRaw=null,benchLegacyRaw=null,openingLegacyRaw=null,narrativeLegacyRaw=null,continuationLegacyRaw=null,designLegacyRaw=null,dialogueLegacyRaw=null,experienceLegacyRaw=null,objectLegacyRaw=null;try{const raw=localStorage.getItem(KEY);state=D.restore(raw,P,E,C);if(raw&&JSON.parse(raw)?.storyRevision===15)toneLegacyRaw=raw;if(raw&&JSON.parse(raw)?.storyRevision===14)posterLegacyRaw=raw;if(raw&&JSON.parse(raw)?.storyRevision===13)soloLegacyRaw=raw;if(raw&&[1,2,3,4,5,6].includes(JSON.parse(raw)?.continuation?.revision))museumLegacyRaw=raw;if(raw&&[1,2,3,4,5].includes(JSON.parse(raw)?.continuation?.revision))workshopLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<13)familyLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<12)awardsLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<11)emotionLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<10)fullLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<9)experienceLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<8)objectLegacyRaw=raw;if(raw&&JSON.parse(raw)?.storyRevision===6)dialogueLegacyRaw=raw;if(raw&&JSON.parse(raw)?.continuation?.revision===1)designLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<6)continuationLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<5)narrativeLegacyRaw=raw;if(raw&&(JSON.parse(raw)?.storyRevision||0)<4)openingLegacyRaw=raw;if(raw&&JSON.parse(raw)?.version===1)legacyRaw=raw;if(raw&&Object.values({...JSON.parse(raw)?.runs,...JSON.parse(raw)?.replays}).some(r=>r?.level==='rain-shelter-bench'&&!r.guideRevision))benchLegacyRaw=raw;}catch{state=D.fresh();}state.replays||={};state.completionSeen||={};state.completionPresented||=[];state.topics||=[];state.spoken||=[];state.storyRevision=StoryRevision();
 function StoryRevision(){return CampaignStory.revision;}
 const Chapters=CampaignChapters,Developer=CampaignDeveloper,practice=CampaignPractice.create(P,Sessions,localStorage);
 const query=new URLSearchParams(location.search);
 const reviewChapters=location.protocol==='sun-jian:'&&query.get('chapterReview')==='1';
 const CHAPTER_UNLOCK=KEY+'-chapter-unlock-v1',CHAPTER_RUN=KEY+'-chapter-run-v1',DEV_MODE=KEY+'-developer-mode';
 let chapterUnlocked=false,chapterReplay=null,mainJourney=null,developerMode=false;
 try{chapterUnlocked=localStorage.getItem(CHAPTER_UNLOCK)==='cleared';}catch{}
 try{developerMode=sessionStorage.getItem(DEV_MODE)==='on';}catch{}
 rememberChapterUnlock();
 if(query.has('journey')){
  const id=query.get('chapter');
  if(developerMode&&Developer.find(id)||canSelectChapters()&&Chapters.chapters.some(chapter=>chapter.id===id)){
   try{
    const stored=JSON.parse(sessionStorage.getItem(CHAPTER_RUN));
    if(stored?.id===id&&stored.save?.version===2){
     mainJourney=state;state=D.restore(JSON.stringify(stored.save),P,E,C);chapterReplay=id;
    }
   }catch{}
  }
 }

 let lastDialogueLine=null;
 let active=false,view='menu',scene=null,worldKind=null,current=null,modal=null,lastFocus=null,lastTick=performance.now(),toastTimer,saveFailed=false,panelReturn=null;
 let puzzleProgress=null;
 const root=document.createElement('section');root.id='campaign-root';root.hidden=true;root.setAttribute('aria-label','榫间完整旅程');
 root.innerHTML=`<div id="campaign-world"></div>
 <div id="campaign-continuation-backdrop" hidden><div class="workshop-painting"><img class="workshop-art" data-src="assets/campaign-2d/workshop-study.webp" alt="周末开放工坊的装配台"><div class="workshop-leaf-shadow" aria-hidden="true"></div></div><p>开放工坊 · 安静的周末</p></div>
 <header class="campaign-top"><div><strong>榫间</strong><span id="campaign-location">溪桥村</span><span id="campaign-time"></span></div><nav><button id="campaign-stand" hidden>起身 · E</button><button id="campaign-collect" hidden>取料备忘</button><button id="campaign-sketch" hidden>装配草图</button><button id="campaign-ambience" aria-pressed="false" aria-label="开启音乐与雨声">声音关</button><button id="campaign-opening-skip-world" hidden>跳过山路开场</button><button id="campaign-notes">旅行笔记</button><button id="campaign-dev-world" hidden>剧情跳转</button><button id="campaign-pause">暂停 · Esc</button></nav></header>
 <div class="campaign-objective"><small id="campaign-chapter"></small><h1 id="campaign-heading"></h1><p id="campaign-goal"></p><small id="campaign-purpose"></small></div><div id="campaign-dot"></div><div id="campaign-target" hidden></div><p id="campaign-toast" hidden role="status"></p>
 <footer class="campaign-bottom"><span>点击物件观察 · H 查看热点 · Tab / Enter 选择 · Esc 暂停</span><span id="campaign-saved">仅保存在本机</span></footer>
 <section id="campaign-menu" class="campaign-modal" hidden role="dialog" aria-modal="true" aria-label="榫间主菜单"><div class="campaign-card"><img decoding="async" data-src="assets/cave/traveler.png" alt="背着背包与纸本手记的旅人"><div><small>一场雨，一段木作的旅途</small><h2>榫间</h2><p>到一个村子里歇脚，认识一门手艺。<br>先看清接点，再慢慢动手。</p><p id="campaign-resume-summary" class="campaign-resume-summary" hidden></p><div class="campaign-menu-buttons"><button id="campaign-continue" class="primary">继续旅程</button><button id="campaign-new">开始新旅程</button><button id="campaign-next-story" hidden>继续后面的故事 →</button><button id="campaign-chapter-select" hidden>选择章节</button><button id="campaign-end-chapter" hidden>结束选章试玩</button><button id="campaign-dev-entry" hidden>剧情跳转</button><button id="campaign-practice">榫卯练习</button><button id="campaign-travel-notes">旅行笔记</button><button id="campaign-settings">设置与内测记录</button><button id="campaign-about">作品说明</button><button id="campaign-dev-toggle" aria-pressed="false">开发者模式</button></div><p class="muted">桌面版 · 游客游玩 · 本地存档</p></div></div></section>
 <section id="campaign-conversation" class="campaign-modal" hidden role="dialog" aria-modal="true" aria-labelledby="campaign-speaker"><div class="campaign-card"><div id="campaign-speaker"></div><p id="campaign-line"></p><small id="campaign-line-action" hidden></small><div id="campaign-choices"></div><div class="campaign-talk-actions"><button id="campaign-talk-sound" aria-pressed="false" aria-label="开启声音">声音关</button><button id="campaign-previous" disabled>上一句</button><button id="campaign-opening-skip" hidden>跳过山路开场</button><button id="campaign-skip">略过这段对白</button><button id="campaign-next" class="primary">继续</button></div></div></section>
 <section id="campaign-interlude" class="campaign-modal" hidden role="dialog" aria-modal="true" aria-labelledby="campaign-interlude-title"><div class="campaign-card"><small id="campaign-interlude-speaker"></small><h2 id="campaign-interlude-title" tabindex="-1"></h2><p id="campaign-interlude-line"></p><small id="campaign-interlude-status" role="status"></small><div class="campaign-interlude-actions"><button id="campaign-interlude-retry" hidden>重试画面</button><button id="campaign-interlude-skip">略过这段</button><button id="campaign-interlude-next" class="primary">继续</button></div></div></section>
 <section id="campaign-panel" class="campaign-modal" hidden role="dialog" aria-modal="true" aria-labelledby="campaign-panel-title"><div class="campaign-card"><small id="campaign-panel-kicker"></small><h2 id="campaign-panel-title"></h2><div id="campaign-panel-content"></div><div class="campaign-row" id="campaign-panel-actions"></div></div></section>
 <section id="campaign-error" class="campaign-modal" hidden role="alert"><div class="campaign-card"><h2>场景暂时无法打开</h2><p>旅程进度已保留。可以重试载入画面，或打开榫卯练习。</p><div class="campaign-row"><button id="campaign-retry">重试场景</button><button id="campaign-error-back">榫卯练习</button></div></div></section>`;
 document.body.append(root);
 const museumHost=document.createElement('div');museumHost.id='campaign-museum';museumHost.hidden=true;root.append(museumHost);
 const museumView=Museum.create(museumHost,{look:lookAtExhibit,diagram:showMuseumDiagram,back:backToMuseum,
  sources:museumSources,leave:leaveMuseum,play:playReplica});
 const workshopRestView=document.createElement('aside');workshopRestView.id='campaign-workshop-rest';workshopRestView.hidden=true;workshopRestView.innerHTML='<h2>今天的练习记好了</h2><p>先收好样机。留在工坊看看，或翻翻刚才的记录。</p><div><button data-workshop-record>查看设计记录</button><button data-workshop-rehearse>重练样机</button><button data-workshop-notes>旅行笔记</button><button data-workshop-menu>主菜单</button></div>';root.append(workshopRestView);
 workshopRestView.querySelector('[data-workshop-record]').onclick=()=>{state.continuation.resting=false;continuationHub();};workshopRestView.querySelector('[data-workshop-rehearse]').onclick=workshopRehearsals;workshopRestView.querySelector('[data-workshop-notes]').onclick=notes;workshopRestView.querySelector('[data-workshop-menu]').onclick=menu;
 const workshopPainting=root.querySelector('.workshop-painting');
 const workshopArt=workshopPainting.querySelector('.workshop-art');
 const workshopError=document.createElement('div');workshopError.className='workshop-load-error';workshopError.hidden=true;workshopError.innerHTML='<span>场景图片暂未载入，进度已保留，仍可阅读对白。</span><button>重试图片</button>';workshopPainting.after(workshopError);workshopError.querySelector('button').onclick=()=>{workshopArt.src=workshopArt.dataset.src+'?retry='+Date.now();};
 function updateWorkshopRetry(){for(const [host,kind]of [[$('campaign-panel-actions'),'panel'],[$('campaign-conversation').querySelector('.campaign-talk-actions'),'talk']]){let b=host.querySelector('[data-workshop-retry]');if(!b){b=document.createElement('button');b.dataset.workshopRetry=kind;b.textContent='重试场景图片';b.onclick=()=>{workshopArt.src=workshopArt.dataset.src+'?retry='+Date.now();};host.append(b);}b.hidden=workshopError.hidden||!Next.away(state)||museumVisible();}}
 const drawLin=CampaignExpression.mount(workshopPainting,'lin');
 const drawAwardExpression=CampaignExpression.mountScene(workshopPainting);
 const drawCompanion=CompanionDialogue.mount($('campaign-conversation'));
 let workshopActivity=false;
 function lineExpression(){
  if(!active||view!=='world'||modal!=='campaign-conversation'||!state.talk)return null;
  const {id,line}=state.talk;
  return Story.resolve(id,state)?.lines[line]?.[2]||null;
 }
 function expressions(){
  const cue=lineExpression();
  scene?.expression(cue);
  const linVisible=Next.away(state)&&workshopArt.complete&&workshopArt.naturalWidth>0&&workshopArt.dataset.src.endsWith('/workshop-linlan.webp');
  drawLin(linVisible?cue:null);
  drawAwardExpression(active&&view==='world'&&!workshopArt.hidden?cue:null,workshopArt.dataset.src);
 }
 workshopArt.addEventListener('load',()=>{
  workshopPainting.style.setProperty('--workshop-leaf-art', 'url("' + workshopArt.currentSrc + '")');
  workshopError.hidden=true;workshopArt.hidden=false;updateWorkshopRetry();atmosphere();
 });
 workshopArt.addEventListener('error',()=>{workshopError.hidden=false;workshopArt.hidden=true;updateWorkshopRetry();atmosphere();});
 const bar=document.createElement('div');bar.id='campaign-bar';bar.hidden=true;bar.innerHTML='<div><strong id="campaign-puzzle-title"></strong><span id="campaign-puzzle-status" role="status"></span></div><div><button id="campaign-puzzle-sketch" hidden>装配草图</button><button id="campaign-undo">↶ 撤销</button><button id="campaign-reset">重置本次</button><button id="campaign-dev-puzzle" hidden>剧情跳转</button><button id="campaign-put">放回场景 →</button></div>';document.body.append(bar);
 const sketch=document.createElement('dialog');sketch.id='campaign-sketch-dialog';sketch.className='modal campaign-sketch-modal';sketch.setAttribute('aria-labelledby','campaign-sketch-title');sketch.innerHTML='<button class="modal-close" aria-label="收好草图">×</button><h2 id="campaign-sketch-title">周伯的装配草图</h2><img data-src="assets/campaign-2d/bench-assembly-sketch.svg" alt="长凳分解示意：甲乙是两根横梁，丙是座板，丁戊是两枚木销。横梁榫脚进入敞口承座，座板底边扣住梁肩，木销穿过贴齐的接头。"><p data-sketch-error hidden role="alert">草图图片暂时没能载入。甲乙是横梁，丙是座板，丁戊是木销；先对齐接触面，再装固定的小件。<button data-sketch-retry>重新载入草图</button></p><button class="primary-button" data-sketch-return>收好草图，继续 →</button>';document.body.append(sketch);const sketchReader=CampaignSketch.create(sketch);let sketchOpening=null,sketchFocus=null;
 function showSketch(){if(!state.cave.completed.includes('stone-box')||sketch.open||document.querySelector('dialog[open]'))return;sketchOpening=G.inspection();sketchFocus=document.activeElement;if(sketchOpening.visible)G.suspend();scene?.enable(false);const sketchRun=Sessions.restoreSession(JSON.stringify(view==='puzzle'&&current?.level==='rain-shelter-bench'?G.getRun():state.runs.bench),P);sketchReader.refresh(sketchRun?.mode==='assemble'?sketchRun:null,sketchRun?.mode==='assemble'?AssemblyGuide.bench.prefitted.map(m=>m.piece):[]);const img=sketch.querySelector('img');if(!img.hasAttribute('src'))img.src=img.dataset.src;sketch.showModal();sketch.querySelector('[data-sketch-return]').focus();}
 sketch.querySelectorAll('.modal-close,[data-sketch-return]').forEach(b=>b.onclick=()=>sketch.close());const sketchImage=sketch.querySelector('img');sketchImage.onerror=()=>{sketchImage.hidden=true;sketch.querySelector('[data-sketch-error]').hidden=false;};sketchImage.onload=()=>{sketchImage.hidden=false;sketch.querySelector('[data-sketch-error]').hidden=true;};sketch.querySelector('[data-sketch-retry]').onclick=()=>{sketchImage.src=sketchImage.dataset.src+'?retry='+Date.now();};sketch.addEventListener('close',()=>{G.resumeAfterOverlay(sketchOpening);sketchOpening=null;scene?.enable(active&&view==='world'&&!modal);if(sketchFocus?.isConnected&&!sketchFocus.disabled)sketchFocus.focus({preventScroll:true});sketchFocus=null;});
 const completion=document.createElement('dialog');completion.id='campaign-completion';completion.className='modal campaign-completion-modal';completion.setAttribute('aria-labelledby','campaign-completion-title');completion.innerHTML='<span class="campaign-completion-speaker"></span><h2 id="campaign-completion-title"></h2><p></p><small class="campaign-completion-next" hidden></small><div class="campaign-completion-actions"><button class="primary-button" data-completion-return>放回桌上，继续 →</button><button data-completion-observe>继续观察</button></div>';document.body.append(completion);
 let completionTimer=null,completionFocus=null;
 const practiceCompletionSeen={};
 function closeCompletion(){completion.close();}
 completion.querySelector('[data-completion-observe]').onclick=closeCompletion;
 completion.querySelector('[data-completion-return]').onclick=()=>{if(!completion.open||view!=='puzzle')return;completion.close();putBack();};
 completion.addEventListener('close',()=>{JourneyAtmosphere.silenceDialogue();const focus=completionFocus?.isConnected&&completionFocus.matches('button:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')?completionFocus:$('campaign-put');completionFocus=null;if(active&&view==='puzzle'&&!modal){G.resume();requestAnimationFrame(()=>{if(active&&view==='puzzle'&&!modal&&!document.querySelector('dialog[open]')&&(document.activeElement===document.body||!document.activeElement?.getClientRects().length))focus?.focus({preventScroll:true});});}});
 function offerCompletion(){
  const t=current;if(!t||(!t.practice&&!t.museumReplica&&!t.roomObject&&!t.extension&&!t.id.startsWith('cave:')&&!['straight','lap','pinned','rain-shelter-bench'].includes(t.level)))return;
  const run=G.getRun(),legal=Sessions.restoreSession(JSON.stringify(run),P);if(!legal?.completed)return;
  const seen=t.practice?practiceCompletionSeen:state.completionSeen;
  const signature=run.trial.id+':'+run.mode+':'+run.history.length;if(seen[t.id]===signature)return;
  clearTimeout(completionTimer);completionTimer=setTimeout(()=>{
   if(current!==t||view!=='puzzle'||!active||document.hidden||modal||document.querySelector('dialog[open]'))return;
   const latest=G.getRun();if(!Sessions.restoreSession(JSON.stringify(latest),P)?.completed||latest.trial.id!==run.trial.id)return;
   seen[t.id]=signature;if(!t.replay&&D.tasks.some(task=>task.id===t.id)&&!state.completionPresented.includes(t.id))state.completionPresented.push(t.id);
   const bench=t.level==='rain-shelter-bench',zhouHere=!t.practice&&!t.extension&&state.scene!=='cave'&&(bench?t.id==='bench':!['bench','farewell','complete'].includes(state.phase)&&['room','workbench','chair-detail','tools-detail','chair-seat'].includes(state.frame));
   const responses=t.mode==='assemble'?{straight:'齐了，这块就留在桌上吧。',lap:'指尖摸过去，两根一样平。',pinned:'销头露着这一截，下回就好取。','chair-rail-joint':'榫肩贴住了，顺着摸一摸。','offcut-corner-lap':'接平了。用角尺靠一下看看。','rain-shelter-bench':'合好了，我来看看两头的接缝。'}:{straight:'瞧，底下藏着这么长一截。',lap:'这两根是一对，搁进同一个格子吧。','chair-rail-joint':'一整段退出来了。长榫藏在椅腿里。','offcut-corner-lap':'两端各让一半，这才搭得齐。',pinned:'对，就是这根小销。替我收进盘里，省得满桌子找。'};
   completion.querySelector('.campaign-completion-speaker').textContent=zhouHere?'周伯':'随行手记';completion.querySelector('h2').textContent=t.mode==='assemble'?'合好了':'拆开了';completion.querySelector('p').textContent=zhouHere?(responses[t.level]||'成了，放好吧。'):(t.mode==='assemble'?'各件已经归位。可以放回场景，也可以再看看接面。':'可动木件都已取下，原来藏着的接面露出来了。');completion.querySelector('[data-completion-return]').textContent=bench?(t.replay&&!['shelter','bench-detail'].includes(state.frame)?'结束练习，继续 →':'放回雨棚，继续 →'):state.scene==='cave'?'放回场景，继续 →':'放回桌上，继续 →';
   if(t.extension){completion.querySelector('.campaign-completion-speaker').textContent='装配记录';completion.querySelector('h2').textContent='这次，合得进也拆得开';completion.querySelector('p').textContent='大件先贴齐，小销后固定。把这次的装配路径记下来，再决定是否报名。';completion.querySelector('[data-completion-return]').textContent='收好样机，记下一笔 →';if(t.completion){completion.querySelector('h2').textContent=t.completion.title;completion.querySelector('p').textContent=t.completion.text;completion.querySelector('[data-completion-return]').textContent='收好验证记录，继续 →';}}
   if(t.rehearsalSlot){completion.querySelector('h2').textContent='这次练习收好了';completion.querySelector('p').textContent='可以再看看接面，或回到当前旅程。正式比赛和已经取得的成绩会保留。';completion.querySelector('[data-completion-return]').textContent='回到当前旅程 →';}
   if(t.museumReplica){
    completion.querySelector('.campaign-completion-speaker').textContent='博物馆 · 教学桌';
    completion.querySelector('h2').textContent=t.completion.title;
    completion.querySelector('p').textContent=t.completion.text;
    completion.querySelector('[data-completion-return]').textContent='放回复原件 →';
   }
   if(t.practice){
    completion.querySelector('.campaign-completion-speaker').textContent='榫卯练习';
    completion.querySelector('p').textContent=t.mode==='assemble'?'木件已经合齐。可以转动看看接缝，再选一件练习。':'可动木件都取下来了。看完接面，可以回去试着拼装。';
    completion.querySelector('[data-completion-return]').textContent='回到练习列表 →';
   }
   const journey=CampaignFlow.completion(t,state),next=completion.querySelector('.campaign-completion-next');next.hidden=!journey;if(journey){completion.querySelector('.campaign-completion-speaker').textContent=t.replay?'随行手记':'旧木料库';completion.querySelector('h2').textContent=journey.title;completion.querySelector('p').textContent=journey.text;completion.querySelector('[data-completion-return]').textContent=journey.button;next.textContent=journey.next;}
   completionFocus=document.activeElement;G.suspend();completion.showModal();JourneyAtmosphere.dialogue(completion.querySelector('.campaign-completion-speaker').textContent,completion.querySelector('p').textContent);completion.querySelector('[data-completion-return]').focus();if(!t.practice)save();
  },state.settings.reducedMotion?0:260);
 }
 const chapters=[['arrival','雨中来客'],['learning','灯下识木'],['cave','静洞寻木'],['bench','把木合好'],['complete','雨后再会']];
 const Story=CampaignStory,talk=Story.nodes;
 function save(){
  if(current?.practice)return;
  try{
   if(chapterReplay){
    sessionStorage.setItem(CHAPTER_RUN,JSON.stringify({id:chapterReplay,save:state}));
    label('campaign-saved',Developer.find(chapterReplay)?'开发者试玩 · 本次进度已保留':'选章试玩 · 本次进度已保留');saveFailed=false;return;
   }
   rememberChapterUnlock();
   if(toneLegacyRaw){const key=KEY+'-backup-before-dialogue16';if(!localStorage.getItem(key))localStorage.setItem(key,toneLegacyRaw);toneLegacyRaw=null;}
   if(posterLegacyRaw){const key=KEY+'-backup-before-poster15';if(!localStorage.getItem(key))localStorage.setItem(key,posterLegacyRaw);posterLegacyRaw=null;}
   if(soloLegacyRaw){const key=KEY+'-backup-before-solo14';if(!localStorage.getItem(key))localStorage.setItem(key,soloLegacyRaw);soloLegacyRaw=null;}
   if(museumLegacyRaw){const backup=KEY+'-backup-before-museum7';if(!localStorage.getItem(backup))localStorage.setItem(backup,museumLegacyRaw);museumLegacyRaw=null;}if(workshopLegacyRaw){if(!localStorage.getItem(KEY+'-backup-before-workshop6'))localStorage.setItem(KEY+'-backup-before-workshop6',workshopLegacyRaw);workshopLegacyRaw=null;}if(familyLegacyRaw){if(!localStorage.getItem(KEY+'-backup-before-family13'))localStorage.setItem(KEY+'-backup-before-family13',familyLegacyRaw);familyLegacyRaw=null;}if(awardsLegacyRaw){if(!localStorage.getItem(KEY+'-backup-before-awards12'))localStorage.setItem(KEY+'-backup-before-awards12',awardsLegacyRaw);awardsLegacyRaw=null;}if(emotionLegacyRaw&&!localStorage.getItem(KEY+'-backup-before-dialogue11')){localStorage.setItem(KEY+'-backup-before-dialogue11',emotionLegacyRaw);emotionLegacyRaw=null;}if(fullLegacyRaw&&!localStorage.getItem(KEY+'-backup-before-full14')){localStorage.setItem(KEY+'-backup-before-full14',fullLegacyRaw);fullLegacyRaw=null;}if(experienceLegacyRaw&&!localStorage.getItem(KEY+'-backup-before-experience9')){localStorage.setItem(KEY+'-backup-before-experience9',experienceLegacyRaw);experienceLegacyRaw=null;}if(objectLegacyRaw&&!localStorage.getItem(KEY+'-backup-before-context8'))localStorage.setItem(KEY+'-backup-before-context8',objectLegacyRaw);if(dialogueLegacyRaw&&!localStorage.getItem(KEY+'-backup-before-dialogue7'))localStorage.setItem(KEY+'-backup-before-dialogue7',dialogueLegacyRaw);if(designLegacyRaw)localStorage.setItem(KEY+'-backup-before-design2',designLegacyRaw);if(continuationLegacyRaw)localStorage.setItem(KEY+'-backup-before-continuation6',continuationLegacyRaw);if(narrativeLegacyRaw)localStorage.setItem(KEY+'-backup-before-narrative5',narrativeLegacyRaw);if(openingLegacyRaw)localStorage.setItem(KEY+'-backup-before-opening4',openingLegacyRaw);if(legacyRaw)localStorage.setItem(KEY+'-backup-before-2d',legacyRaw);if(benchLegacyRaw)localStorage.setItem(KEY+'-backup-before-bench-guide',benchLegacyRaw);localStorage.setItem(KEY,JSON.stringify(state));legacyRaw=null;benchLegacyRaw=null;openingLegacyRaw=null;narrativeLegacyRaw=null;continuationLegacyRaw=null;designLegacyRaw=null;dialogueLegacyRaw=null;objectLegacyRaw=null;label('campaign-saved','已保存在本机');saveFailed=false;}catch{label('campaign-saved','未能保存 · 本次可继续');if(!saveFailed){saveFailed=true;notice('本机存储不可用；本次可以继续，关闭后可能无法续玩。');}}}

 function notice(text){clearTimeout(toastTimer);$('campaign-toast').textContent=text;$('campaign-toast').hidden=false;toastTimer=setTimeout(()=>$('campaign-toast').hidden=true,5000);}
 function chapter(){const i=D.phases.indexOf(state.phase);return i<2?0:i<6?1:i===6?2:i<10?3:4;}
 function label(id,text){const el=$(id);if(el.textContent!==text)el.textContent=text;}
 function museumVisible(){return active&&view==='world'&&!!state.continuation.museum.visit&&!awardReplay;}
 function museumAvailable(){return state.continuation.active&&Next.workshopReady(state.continuation)&&!awardReplay;}
 function syncMuseum(){
  const museum=state.continuation.museum,visible=museumVisible();
  museumView.sync(museum,visible,!modal&&!document.hidden,id=>Museum.task(museum,id,P,E));
  root.classList.toggle('museum-active',visible);
  if(visible){
   label('campaign-location','榫卯文化博物馆');label('campaign-time',museum.visit.from==='story'?'第四周 · 周末':'展厅回访');
   scene?.enable(false);scene?.present?.(false);
  }
 }
 function openMuseum(from){
  if(!museumAvailable()||view==='puzzle')return;
  if(!scene&&!createScene())return;
  view='world';writeJourneyRoute(true);
  const museum=state.continuation.museum;
  museum.visit||={from,exhibit:null,diagram:'whole'};
  render();
  if(museum.visit.from==='story'&&!museum.introduced){beginTalk('continuationMuseumIntro');return;}
  setModal(null);museumView.focus(museum.last);save();
 }
 function lookAtExhibit(id){
  const museum=state.continuation.museum;
  if(!museumVisible()||modal||museum.visit.exhibit||!Museum.find(id))return;
  museum.visit.exhibit=id;museum.visit.diagram='whole';museum.last=id;
  if(!museum.viewed.includes(id))museum.viewed.push(id);
  syncMuseum();museumView.focus();save();
 }
 function showMuseumDiagram(mode){
  const museum=state.continuation.museum;
  if(!museumVisible()||modal||!museum.visit.exhibit||!Museum.diagrams.includes(mode))return;
  museum.visit.diagram=mode;syncMuseum();save();
 }
 function backToMuseum(){
  const museum=state.continuation.museum;
  if(!museumVisible()||!museum.visit.exhibit)return;
  museum.visit.exhibit=null;museum.visit.diagram='whole';
  syncMuseum();museumView.focus(museum.last);save();
 }
 function museumSources(){
  const sources=Museum.preservation.map(item=>'<article><h3>'+item.name+'</h3><p>'+item.text+'</p><p class="museum-url">'+item.url+'</p></article>').join('');
  panel('展览与传习资料','<div class="campaign-note-grid">'+sources+'</div><p>馆厅和教具为《榫间》原创。各展签列出对应研究来源。</p>',[
   ['收好资料，回展厅',()=>{setModal(null);museumView.focus(state.continuation.museum.last);},true]
  ],'榫卯文化博物馆');
 }
 function leaveMuseum(){
  const museum=state.continuation.museum;
  if(!museumVisible()||modal)return;
  const {from}=museum.visit;
  museum.visit=null;
  if(from==='story')museum.passed=true;
  render();save();
  if(from==='story'){finaleAction('begin');return;}
  if(from==='menu-notes'||from==='review'){menu();notes();return;}
  if(from==='notes'){notes();return;}
  continuationHub();
 }
 function playReplica(id){
  const museum=state.continuation.museum;
  if(!museumVisible()||modal||museum.visit.exhibit!==id)return;
  const task=Museum.task(museum,id,P,E);
  if(task)openPuzzle(task);
 }
 function contextControls(){syncWorkshopRest();const exploring=active&&view==='world'&&!modal&&!museumVisible()&&!I.beat(state);$('campaign-collect').hidden=!(exploring&&state.scene==='cave');$('campaign-stand').hidden=!(exploring&&scene?.snapshot().sitting);}
 function render(){contextControls();atmosphere();const away=Next.away(state);root.dataset.continuationStage=state.continuation.stage;const peerArt=state.continuation.peerMet||state.continuation.stage==='peer';const stage=state.continuation.stage,atHome=stage==='home'&&state.talk?.id!=='continuationWorkshop';const art=$('campaign-continuation-backdrop').querySelector('img'),desired=F.art(awardReplay||state.continuation,P,E)||'assets/campaign-2d/'+(stage==='goodbye'?'goodbye-village-solo.webp':atHome?'home-study-01311.webp':peerArt?'workshop-linlan.webp':'workshop-study.webp');if(art.dataset.src!==desired){art.dataset.src=desired;art.src=desired;}art.alt=F.choice(state.continuation)?(state.continuation.packed?'省城展位 · ':'工坊装配台 · ')+F.choice(state.continuation).name:stage==='goodbye'?'周伯站在门前向下山的旅人挥手':atHome?'回学校后，桌上留着手记和木作折页':peerArt?'林岚在开放工坊与你一起看记录':'周末开放工坊的装配台';$('campaign-continuation-backdrop').querySelector('p').textContent=state.continuation.productionStarted?(state.continuation.resultSeen?'赛后 · 和大家试用作品':state.continuation.packed?'省城 · 新人组展位':'开放工坊 · 自己的作品'):atHome?'回学校以后 · 第一个周末':stage==='goodbye'?'溪桥村 · 门前道别':'开放工坊 · 安静的周末';$('campaign-continuation-backdrop').hidden=!away;if(away)loadArt($('campaign-continuation-backdrop'));root.classList.toggle('continuation-away',!!away);$('campaign-next-story').hidden=!state.finished||state.continuation.active;$('campaign-next-story').textContent=state.continuation.endingSeen?'查看完整旅程 →':state.continuation.started?'继续学习与备赛 →':'继续后面的故事 →';root.classList.toggle('narrative-active',!!I.beat(state));
  const early=state.phase==='arrival'&&state.prologue?.stage==='mountain';
  $('campaign-opening-skip-world').hidden=!early;
  $('campaign-chapter-select').hidden=!canSelectChapters();
  $('campaign-dev-toggle').setAttribute('aria-pressed',String(developerMode));
  label('campaign-dev-toggle',developerMode?'退出开发者模式':'开发者模式');
  $('campaign-dev-entry').hidden=!developerMode;
  const devPoint=Developer.find(chapterReplay);
  $('campaign-dev-world').hidden=!devPoint;
  $('campaign-dev-puzzle').hidden=!devPoint;
  $('campaign-new').hidden=!!chapterReplay;
  $('campaign-end-chapter').hidden=!chapterReplay;
  label('campaign-end-chapter',devPoint?'结束开发者试玩':'结束选章试玩');
  $('campaign-continue').textContent=chapterReplay?(devPoint?'继续开发者试玩':'继续选章试玩'):state.continuation.active?(state.continuation.endingSeen?'回到赛后':state.continuation.resultSeen?'继续赛后交谈':state.continuation.packed?'继续现场参赛':'继续学习与备赛'):'继续旅程';
  const replayTitle=devPoint?.title||Chapters.chapters.find(chapter=>chapter.id===chapterReplay)?.title;
  $('campaign-resume-summary').hidden=!hasSave();$('campaign-resume-summary').textContent=(replayTitle?(devPoint?'开发者试玩 · ':'选章试玩 · ')+replayTitle+'\n':'')+resumeSummary();
$('campaign-sketch').hidden=state.continuation.active||!state.cave.completed.includes('stone-box');const i=chapter();label('campaign-location',I.beat(state)?.title||CampaignIllustrated.frames[state.frame]?.name||'溪桥村');label('campaign-time',D.phases.indexOf(state.phase)<4?'雨夜':'次日上午 · 雨后');label('campaign-chapter',String(Math.min(i,2)+1).padStart(2,'0')+' / 07');label('campaign-heading',chapters[i][1]);label('campaign-goal',D.objective(state));label('campaign-purpose',state.scene==='cave'?'取料 '+D.requiredCaveIds.filter(id=>state.cave.completed.includes(id)).length+' / 3 · 自选练习 '+D.optionalCaveIds.filter(id=>state.cave.completed.includes(id)).length+' / 5':'');if(state.continuation.active){label('campaign-location',state.continuation.stage==='goodbye'?'溪桥村 · 门前':state.continuation.stage==='home'?'返校 · 住处':away?'开放工坊':'溪桥村 · 雨棚');label('campaign-time',state.continuation.stage==='goodbye'?'离村前 · 雨后':away?(state.continuation.designStarted?'备赛第四周 · 周末':'返校后的第一个周末'):'次日上午 · 雨后');label('campaign-chapter',state.continuation.departed?'04 / 07':'03 / 07');label('campaign-heading',state.continuation.entryAccepted?'准备一件作品':'带走的不只一页');label('campaign-goal',continuationGoal());label('campaign-purpose',F.choice(state.continuation)?.name||'');if(state.continuation.productionStarted){label('campaign-location',state.continuation.packed?'省城 · 木作交流赛':'开放工坊 · 作品制作');label('campaign-time',state.continuation.resultSeen?'赛后 · 下午':state.continuation.packed?'第十周 · 比赛日':'第五至九周 · 备赛');const atAwards=['results','after-award','ending'].includes(stage);label('campaign-heading',atAwards?'第三名，还有下一页':state.continuation.packed?'把作品摆出来':'做成自己的作品');label('campaign-chapter',atAwards?'07 / 07':state.continuation.packed?'06 / 07':'05 / 07');}}const disabled=!hasSave();if($('campaign-continue').disabled!==disabled)$('campaign-continue').disabled=disabled;syncMuseum();}
 function atmosphere(){
  const sound=$('sound').getAttribute('aria-pressed')==='true',narrative=I.beat(state);
  const away=Next.away(state),workshop=away&&state.continuation.departed&&(state.continuation.stage!=='home'||state.talk?.id==='continuationWorkshop');
  const frame=narrative?.frame||state.frame;
  const home=!away&&['room','workbench','chair-detail','tools-detail','chair-seat'].includes(frame);
  const foreground=active&&(view==='world'||view==='puzzle')&&(!modal||modal==='campaign-conversation'||modal==='campaign-interlude'||workshopActivity);
  const musicC=awardReplay||state.continuation;const profile=away&&(musicC.resultSeen||musicC.stage==='results'&&musicC.awardStep>0)?'award':away&&musicC.packed?'contest':workshop?'home':!away&&state.scene==='cave'?'store':home||away&&state.continuation.departed?'home':'journey';
  workshopPainting.classList.toggle('lit',workshop&&!state.continuation.packed&&workshopArt.complete&&workshopArt.naturalWidth>0&&!workshopArt.hidden&&foreground&&view==='world'&&!document.hidden&&!state.settings.reducedMotion);
  root.classList.toggle('visiting-workshop',!!workshop);
  expressions();
  JourneyAtmosphere.configure({active:foreground,profile,home,rainScene:frame==='mountain-rain'?'leaves':'courtyard',rainChoice:state.settings.rainChoice||'auto',night:!away&&(narrative?!!narrative.night:D.phases.indexOf(state.phase)<4),interior:away&&state.continuation.departed||!['mountain-rain','zhou-door','village','shelter','bench-detail','bench-seat','trail'].includes(frame),dialogue:state.settings.dialogueSound!==false,quiet:view==='puzzle'||modal==='campaign-conversation'||modal==='campaign-interlude',musicVolume:state.settings.musicVolume??1,ambienceVolume:state.settings.ambienceVolume??1,volume:state.settings.volume});
  JourneyAtmosphere.sound(sound);
  $('campaign-ambience').textContent=sound?'声音开':'声音关';$('campaign-ambience').setAttribute('aria-pressed',String(sound));$('campaign-ambience').setAttribute('aria-label',sound?'关闭声音':'开启声音');
  $('campaign-talk-sound').textContent=sound?'声音开':'声音关';$('campaign-talk-sound').setAttribute('aria-pressed',String(sound));$('campaign-talk-sound').setAttribute('aria-label',sound?'关闭音乐、雨声与对白音效':'开启音乐、雨声与对白音效');
 }
 $('campaign-ambience').onclick=()=>{$('sound').click();atmosphere();};
 $('campaign-talk-sound').onclick=e=>{if(e.detail<2)$('sound').click();};
 $('sound').addEventListener('click',()=>{if(active){state.settings.sound=$('sound').getAttribute('aria-pressed')==='true';save();}atmosphere();});
 function hasSave(){return !!chapterReplay||!!state.talk||state.openingSeen||state.playMs>0||state.phase!=='arrival'||state.observed.length>0;}
 function loadArt(container){container?.querySelectorAll('img[data-src]').forEach(img=>{if(!img.hasAttribute('src'))img.src=img.dataset.src;});}
 function setModal(id,activity=false){if(id!=='campaign-conversation'){drawCompanion(null);lastDialogueLine=null;JourneyAtmosphere.silenceDialogue();}JourneyAtmosphere.stopPreview();workshopActivity=id==='campaign-panel'&&activity;loadArt(id&&$(id));if(!modal&&id)lastFocus=document.activeElement;for(const n of ['campaign-menu','campaign-conversation','campaign-panel','campaign-interlude'])$(n).hidden=n!==id;modal=id||null;updateWorkshopRetry();contextControls();atmosphere();scene?.enable(!id&&view==='world'&&active&&!museumVisible());scene?.present?.(active&&view==='world'&&!museumVisible()&&(!id||['campaign-conversation','campaign-interlude'].includes(id)));syncMuseum();if(id){if(id!=='campaign-conversation')requestAnimationFrame(()=>{if(modal===id&&!$(id).contains(document.activeElement))$(id).querySelector('button:not(:disabled),input,select,textarea')?.focus();});}else{panelReturn=null;if(lastFocus?.getClientRects().length)lastFocus.focus?.({preventScroll:true});}}
 function panel(title,html,buttons,kicker='随行旅途',activity=false){if(modal!=='campaign-panel')panelReturn=modal==='campaign-menu'?'campaign-menu':null;$('campaign-panel').classList.toggle('workshop-activity',activity);setModal('campaign-panel',activity);$('campaign-panel-title').textContent=title;$('campaign-panel-kicker').textContent=kicker;$('campaign-panel-content').innerHTML=html;loadArt($('campaign-panel-content'));$('campaign-panel-actions').replaceChildren(...buttons.map(([text,fn,primary])=>{const b=document.createElement('button');b.textContent=text;if(primary)b.className='primary';b.onclick=fn;return b;}));updateWorkshopRetry();requestAnimationFrame(()=>{const card=$('campaign-panel').querySelector('.campaign-card');card.scrollTop=0;});}
 function phase(id){state.phase=id;if(id==='bench'&&!state.runs.bench)state.runs.bench=AssemblyGuide.normalize(BenchPuzzle,null,'assemble',P,E).run;if(!state.visited.includes(id))state.visited.push(id);save();render();scene?.sync();}
 function applySettings(){document.body.classList.toggle('campaign-reduced',state.settings.reducedMotion);G.setPreferences(state.settings);scene?.quality?.();atmosphere();}
 function createScene(){
  if(scene){scene.sync();return true;}
  scene?.dispose();scene=null;$('campaign-world').replaceChildren();worldKind=state.scene;
  try{
   scene=CampaignIllustrated.create($('campaign-world'),state,{interact,change:()=>{clearTimeout(toastTimer);$('campaign-toast').hidden=true;render();save();},arrived:onArrival,visualReady:updateInterludeControls,notice,menu});
   $('campaign-error').hidden=true;applySettings();return true;
  }catch(e){console.warn('Campaign scene unavailable',e.message);$('campaign-error').hidden=false;return false;}
 }
 function showTarget(t){const box=$('campaign-target'),hidden=!t||!!modal||view!=='world';if(box.hidden!==hidden)box.hidden=hidden;if(t){const name=t.name||C.nodes.find(n=>n.id===t.id)?.short||'查看接点';if(box.dataset.target!==t.id||box.dataset.label!==name){box.dataset.target=t.id;box.dataset.label=name;box.textContent=name;const small=document.createElement('small');small.textContent='E / 点击 · 查看';box.append(small);}}}
 function onArrival(id){
  if(state.phase!=='arrival'||state.prologue?.legacy)return;
  if(id==='village'&&!state.spoken.includes('villageArrival'))beginTalk('villageArrival');
  else if(id==='room'&&!state.prologue.bagPlaced&&!state.spoken.includes('welcomeInside'))beginTalk('welcomeInside');
 }
 function skipMountain(){
  if(state.phase!=='arrival'||state.prologue?.stage!=='mountain')return;
  state.openingSeen=true;markSpoken('opening');state.talk=null;state.prologue.stage='village';state.frame='village';setModal(null);render();scene?.sync();save();onArrival('village');
 }
 function canSelectChapters(){return chapterUnlocked||reviewChapters;}
 function rememberChapterUnlock(){
  if(chapterReplay||chapterUnlocked||!Chapters.cleared(state,P,E))return;
  chapterUnlocked=true;
  try{localStorage.setItem(CHAPTER_UNLOCK,'cleared');}catch{}
 }
 function writeJourneyRoute(playing){
  const url=new URL(location.href);url.search='';
  if(playing)url.searchParams.set('journey','1');
  if(chapterReplay)url.searchParams.set('chapter',chapterReplay);
  if(reviewChapters)url.searchParams.set('chapterReview','1');
  history.replaceState(null,'',url);
 }
 function selectChapters(){
  if(!canSelectChapters())return;
  panel('选择章节','<p>从选定的一章开始，之后可以接着玩。分歧沿第一条路线展开。</p><div class="chapter-select-grid"></div>',
   [['返回主菜单',menu,true]],reviewChapters?'制作试玩':'通关后重玩');
  const grid=$('campaign-panel-content').querySelector('.chapter-select-grid');
  for(const [index,chapter] of Chapters.chapters.entries()){
   const button=document.createElement('button');
   button.type='button';button.dataset.chapterStart=chapter.id;
   const title=document.createElement('strong'),summary=document.createElement('span');
   title.textContent=String(index+1).padStart(2,'0')+' · '+chapter.title;
   summary.textContent=chapter.summary;
   button.append(title,summary);button.onclick=()=>beginChapter(chapter.id);
   grid.append(button);
  }
 }
 function resetReplayView(){
  clearTimeout(toastTimer);$('campaign-toast').hidden=true;
  JourneyAtmosphere.resetMusic();
  scene?.dispose();scene=null;current=null;awardReplay=null;
 }
 function toggleDeveloper(){
  developerMode=!developerMode;
  try{if(developerMode)sessionStorage.setItem(DEV_MODE,'on');else sessionStorage.removeItem(DEV_MODE);}catch{}
  if(developerMode){selectDeveloper();return;}
  if(Developer.find(chapterReplay))endChapter();else menu();
 }
 function selectDeveloper(){
  if(!developerMode)return;
  if(view==='puzzle')putBack();
  panel('剧情跳转','<p>选一章，再选要检查的场景或操作。试玩使用独立进度，剧情分歧走第一项。</p><label class="dev-chapter-label">章节<select id="campaign-dev-chapter"></select></label><div class="chapter-select-grid" id="campaign-dev-points"></div>',
   [['返回主菜单',menu],['退出开发者模式',toggleDeveloper]],'开发者模式');
  const select=$('campaign-dev-chapter'),grid=$('campaign-dev-points');
  for(const [index,chapter] of Chapters.chapters.entries()){
   select.add(new Option((index+1)+' · '+chapter.title,chapter.id));
  }
  select.value=Developer.find(chapterReplay)?.chapter||chapterReplay||Chapters.chapters[0].id;
  function renderPoints(){
   grid.replaceChildren();
   for(const node of Developer.checkpoints.filter(n=>n.chapter===select.value)){
    const button=document.createElement('button');
    button.type='button';button.dataset.devStart=node.id;button.textContent=node.title;
    button.onclick=()=>beginChapter(node.id);grid.append(button);
   }
  }
  select.onchange=renderPoints;renderPoints();select.focus();
 }
 function beginChapter(id){
  const devPoint=Developer.find(id);
  if(view==='puzzle'||(devPoint?!developerMode:!canSelectChapters()))return;
  const next=(devPoint?Developer:Chapters).start(id,D,P,E,C,mainJourney||state);
  if(!next)return;
  if(!chapterReplay)mainJourney=state;
  chapterReplay=id;state=next;
  resetReplayView();enter();
 }
 function endChapter(){
  if(!chapterReplay)return;
  resetReplayView();
  chapterReplay=null;state=mainJourney;mainJourney=null;view='menu';
  try{sessionStorage.removeItem(CHAPTER_RUN);}catch{}
  writeJourneyRoute(false);applySettings();menu();
 }
 function enter(){
  if(!active){if(window.Journey?.snapshot().inStory)$('story-exit').click();if(window.CaveJourney?.snapshot().active)$('cave-leave').click();G.enterStory();active=true;root.hidden=false;document.body.classList.add('campaign-active','cave-active');}
  view='world';current=null;bar.hidden=true;document.body.classList.remove('campaign-puzzle','cave-puzzle');writeJourneyRoute(true);render();
  if(createScene()){if(state.continuation.active){if(state.talk&&Next.resolve(state.talk.id,state))showTalk();else continuationHub();}else if(I.beat(state))showInterlude();else if(state.talk&&Story.resolve(state.talk.id,state))showTalk();else if(state.pendingReflection&&talk['after:'+state.pendingReflection]){setModal(null);openPuzzle(state.pendingReflection);}else if(state.phase==='arrival'&&!state.openingSeen)beginTalk('opening');else{state.talk=null;setModal(null);onArrival(state.frame);}}save();
 }
 function menu(){if(view==='puzzle')putBack();if(!active){G.enterStory();active=true;G.setPreferences(state.settings);root.hidden=false;document.body.classList.add('campaign-active','cave-active');}render();setModal('campaign-menu');}
 function startNew(){
  if(chapterReplay)return;
  const begin=()=>{resetReplayView();const preferences={...state.settings};state=D.fresh();state.settings=preferences;save();enter();};
  if(hasSave())panel('重新开始旅程？','<p>会从第一章开始，并替换当前旅程的本机存档。</p>',[['返回主菜单',menu],['开始新旅程',begin,true]]);else begin();
 }
 function beginTalk(id){if(!Story.resolve(id,state))return;if(id==='chairSit')scene?.sit?.(true,'chair');if(id==='chairJoint'&&D.canEnterFrame(state,'chair-detail')){state.frame='chair-detail';scene?.sync();render();}state.talk={id,line:0};save();showTalk();}
 function showTalk(preferredFocus,audible=true){const t=state.talk,n=t&&Story.resolve(t.id,state);if(!n){state.talk=null;setModal(null);save();return;}const frame=Story.frameFor(t.id,state);if(frame&&state.frame!==frame){state.frame=frame;scene?.sync();render();}setModal('campaign-conversation');t.line=Math.min(t.line,n.lines.length-1);const line=n.lines[t.line],cueKey=t.id+':'+t.line+':'+line[0]+':'+line[1];if(cueKey!==lastDialogueLine){lastDialogueLine=cueKey;if(audible)JourneyAtmosphere.dialogue(line[0],line[1]);else JourneyAtmosphere.silenceDialogue();}drawCompanion(CompanionDialogue.presentation(t.id,line[0],t.line,state,line[2]));expressions();$('campaign-speaker').textContent=line[0];$('campaign-conversation').classList.toggle('is-narration',line[0]==='旁白');$('campaign-line').textContent=line[1];$('campaign-line-action').textContent=line[3]||'';$('campaign-line-action').hidden=!line[3];const last=t.line===n.lines.length-1,options=last?n.choices:null,choices=chapterReplay?options?.slice(0,1):options;$('campaign-choices').replaceChildren(...(choices||[]).map(([label,next])=>{const b=document.createElement('button');b.textContent=(state.spoken.includes(next)?'✓ ':'')+label;b.onclick=e=>{if(state.talk!==t||e.detail>1)return;if(!state.topics.includes(next)&&next!=='close')state.topics.push(next);markSpoken(t.id);state.talk=null;action(next);};return b;}));$('campaign-opening-skip').hidden=t.id!=='opening'||state.prologue?.stage!=='mountain';$('campaign-previous').hidden=n.lines.length<2;$('campaign-previous').disabled=t.line===0;$('campaign-next').hidden=!!choices;$('campaign-skip').hidden=!!choices||last;$('campaign-next').textContent=last?(n.last||'继续看看'):'继续';if(modal==='campaign-conversation'&&state.talk===t)(preferredFocus&&!$(preferredFocus).disabled?$(preferredFocus):choices?$('campaign-choices').querySelector('button'):$('campaign-next'))?.focus();save();}
 function advanceTalk(skip=false){const t=state.talk,n=t&&Story.resolve(t.id,state);if(!n)return;if(skip&&t.line<n.lines.length-1){t.line=n.lines.length-1;showTalk(undefined,false);return;}if(t.line<n.lines.length-1){t.line++;showTalk();return;}if(n.choices)return;markSpoken(t.id);state.talk=null;action(n.action||'close');}
 function markSpoken(id){if(!state.spoken.includes(id))state.spoken.push(id);}
 function action(id){
  if(id.startsWith('continuation:')){continuationAction(id);return;}
  if(id==='supplySketch'){beginTalk(id);showSketch();return;}
  if(talk[id]||Next.nodes[id]){beginTalk(id);return;}
  switch(id){
   case 'openingDone':state.openingSeen=true;setModal(null);render();save();break;
   case 'doorInvited':if(state.phase==='arrival'&&!state.prologue.invited){state.prologue.invited=true;state.prologue.stage='invited';}setModal(null);render();scene?.sync();save();break;
   case 'bagPlaced':if(state.phase==='arrival'&&state.prologue.invited&&!state.prologue.bagPlaced){state.prologue.bagPlaced=true;state.prologue.stage='unpacked';}setModal(null);render();scene?.sync();save();beginTalk('arrival');break;
   case 'reflectionDone':state.pendingReflection=null;setModal(null);render();scene?.sync();save();inviteDinner();break;
   case 'findZhou':setModal(null);scene?.go('shelter');notice('周伯就在长凳旁。');break;
   case 'toolCorner':setModal(null);scene?.go('tools-detail');break;
   case 'settle':if(state.phase==='arrival'){state.prologue={...state.prologue,stage:'settled',invited:true,bagPlaced:true};phase('settle');}setModal(null);notice('今晚有着落了。看看屋里的东西，和周伯聊聊。');break;
   case 'accept':if(state.phase==='arrival'){beginTalk('arrival');return;}if(state.phase==='settle')phase('learning');setModal(null);notice(D.objective(state));break;
   case 'depart':if(['morning','depart'].includes(state.phase))beginTalk('travelMessage');else setModal(null);break;
   case 'departRoute':if(['morning','depart'].includes(state.phase)){state.companionUpdated=true;state.frame='trail';phase('depart');}setModal(null);scene?.sync();save();break;
   case 'enterCave':if(state.phase!=='depart'){setModal(null);break;}state.scene='cave';state.frame='store-door';phase('cave');enter();break;
   case 'return':if(state.phase!=='cave'||!D.canReturn(state)){setModal(null);break;}if(!state.leavePracticeReminderSeen&&D.optionalCaveIds.some(id=>!state.cave.completed.includes(id))){setModal(null);panel('料都找齐了','<p>料齐了。其余都是自选练习，回村后也能从手记里重练。</p>',[['再看看样件',()=>{state.leavePracticeReminderSeen=true;save();setModal(null);}],['推车回村',()=>{state.leavePracticeReminderSeen=true;action('return');},true]]);return;}beginInterlude('homeward');break;
   case 'bench':if(state.phase==='return'){state.frame='shelter';phase('bench');}setModal(null);scene?.sync();notice('周伯先搭好两根横梁，把座板递到你手边。点长凳，接着合好。');break;
   case 'sitReady':if(state.phase!=='farewell'){setModal(null);break;}state.benchChecked=true;phase('farewell');setModal(null);notice('点长凳，坐一会儿。');break;
   default:setModal(null);save();
  }
 }
 function interact(id){
  if(view!=='world'||modal||I.beat(state))return;
  if(id==='contest-poster'){
   const c=state.continuation;
   if(!state.finished||state.frame!=='shelter'||c.departed)return;
   c.started=true;c.active=true;c.stage=Next.stage(c,P,E);
   render();if(c.noticeSeen)continuationRules();else beginTalk('continuationMeetup');
   return;
  }
  if(id==='bench'&&['arrival','settle','learning','night'].includes(state.phase)){state.nightBenchSeen=true;save();}
  if(id==='knock-door'){if(state.frame==='zhou-door'&&!state.prologue.invited){JourneyAtmosphere.knock();beginTalk('doorKnock');}return;}
  if(id==='enter-home'){if(state.frame==='zhou-door'&&state.prologue.invited)scene?.go('room');return;}
  if(id==='put-bag'){if(state.frame==='room'&&state.prologue.invited&&!state.prologue.bagPlaced)beginTalk('unpack');return;}

  if(id==='square-check'){squareCheck();return;}
  if(id.startsWith('observe:')){if(scene?.inspectField(id.slice(8)))save();return;}
  if(id.startsWith('field-study:')){
   const entry=CampaignFieldNotes.find(id.slice(12));if(!entry?.level||entry.frame!==state.frame)return;
   openRoomObject(entry.level);return;

  }
  if(id.startsWith('cave:')){openPuzzle(id);return;}
  if(id==='bench-timber'){if(state.phase==='bench')openPuzzle('bench');else notice('五件替换料都在。先回屋和周伯说一声，再一起合长凳。');return;}
  if(id==='timber'){if(D.canReturn(state)){scene.go('store-sky');notice('木料已收拢到小车上，草图也在石台边。');}else notice('布带绑着两根横梁和座板，两枚小销收在一起。还差石台木匣里的草图。');return;}
  if(id==='sketch'){showSketch();return;}
  if(id==='supplies'){if(D.canReturn(state))beginTalk('supplies');else notice(D.objective(state));return;}
  if(id==='chairJoint'){beginTalk('chairJoint');return;}
  if(!state.observed.includes(id))state.observed.push(id);
  if(id==='zhou'){if(state.phase==='learning')panel('周伯','<p>周伯挪开手边的工具，给你留出一块桌面。</p>',[['继续试样木',()=>{setModal(null);scene?.go('workbench');},true],['再聊聊木作',()=>beginTalk('heritage')]]);else beginTalk(Story.hostTopic(state));}
  else if(['straight','lap','pinned'].includes(id)){
   if(['arrival','settle'].includes(state.phase)){beginTalk('earlySample');return;}
   const task=D.tasks.find(t=>!state.done.includes(t.id));if(state.phase==='learning'&&task?.object===id)openPuzzle(task.id);else if(state.done.includes('learn-'+id+'-out'))openRoomObject(id);else notice(D.objective(state));
  }
  else if(id==='bench'){
   if(state.phase==='arrival'&&!state.prologue?.legacy){beginTalk('shelterFirst');return;}
   if(state.phase==='bench')openPuzzle('bench');else if(state.phase==='complete')panel('修好的长凳','<p>接缝贴齐，坐上去也很稳。</p>',[['坐下歇歇',finish,true],['再试一次拆装',()=>replayPanel('rain-shelter-bench')],['回去看看',()=>setModal(null)]]);else if(state.phase==='farewell'&&state.benchChecked)finish();else if(state.phase==='farewell')notice('请周伯来看看接缝，再坐下歇歇。');else panel('雨棚下的旧长凳','<p>座板暂时拆下，凳架上露出了接头。旁边靠着旧木料，修好前先别坐。</p>',[['看看承口',()=>{setModal(null);scene?.inspectBench('joint');},true],['看看座板宽度',()=>{setModal(null);scene?.inspectBench('rails');}],...(state.done.length===4?[['长凳试拼（练习）',()=>startReplay('rain-shelter-bench','rain-shelter-bench','assemble')]]:[]),['先不打扰',()=>setModal(null)]]);
  }
  else if(id==='rest'){if(state.phase==='night')panel('先歇一晚','<p>饭菜已经摆好。吃过晚饭，帮周伯收好碗筷，再去里间歇一晚。</p>',[['再看看',()=>setModal(null)],['休息到明早',()=>beginInterlude('overnight'),true]]);else panel('铺好的床位','<p>'+(state.phase==='arrival'?'里边有一张铺着薄被的床，先问问主人。':['settle','learning'].includes(state.phase)?'周伯铺好的床位。背包放在门边，明天出发再带上。':state.phase==='morning'?'昨夜住过的床，薄被已经理好。出发时记得带上门边的背包。':'昨夜住过的床，薄被已经叠好。')+'</p>',[['先不休息',()=>setModal(null)]]);}
  else if(id==='trail'){if(state.phase==='depart')beginTalk('caveEnter');else notice(D.objective(state));}
  else if(id==='door')notice(state.phase==='arrival'?'周伯就在工作台旁，点他打声招呼。':D.objective(state));
  else if(['chair','cup','tools'].includes(id))beginTalk(id);
  save();
 }
 function materialsMemo(){
  if(!active||view!=='world'||modal||state.phase!=='cave'||I.beat(state))return;
  const done=id=>state.cave.completed.includes(id),opened=done('mouth-latch'),timber=done('rack-frame'),sketch=done('stone-box');
  const visit=frame=>{if(state.phase!=='cave')return;setModal(null);document.activeElement?.blur();scene?.go(frame);};
  const items=[['替换料',timber,'备用料架 · 浅色布带绑好的那组'],['装配草图',sketch,'天光石台 · 收在木匣里']];
  const html='<p>来时记下的两样东西。找到后做个记号，免得漏带。</p><div class="campaign-errand-list">'+items.map(([name,yes,where])=>'<article data-errand="'+(name==='替换料'?'timber':'sketch')+'"><strong>'+(yes?'✓ 已找到':'○ 还没找到')+' · '+name+'</strong><p>'+where+'</p></article>').join('')+'</div><p class="muted">'+(timber&&sketch?'两样都齐了，可以装车。其他样件想试就试，回村后也能在手记里重练。':opened?'木料和草图，先找哪样都行。其他样件可以随意试，不用全部拆开。':'先看看库门的门闩，开门后再找这两样。')+'</p>';
  const buttons=opened?[['去备用料架',()=>visit('store-middle'),!timber],['去天光石台',()=>visit('store-sky'),timber&&!sketch]]:[['查看库门',()=>visit('store-door'),true]];
  if(timber&&sketch)buttons.push(['装车回村',()=>{setModal(null);action('return');},true]);
  buttons.push(['收好备忘',()=>setModal(null)]);panel('这趟要带回什么',html,buttons,'随行手记 · 取料备忘');if(modal==='campaign-panel'&&$('campaign-panel-title').textContent==='这趟要带回什么')$('campaign-panel-actions').querySelector('.primary')?.focus();
 }
 function squareCheck(){SquareCheck.open({panel,close:()=>setModal(null),sample:()=>{setModal(null);interact('field-study:tool-offcut');}});}
 function practiceLibrary(){
  $('campaign-error').hidden=true;
  panel('榫卯练习','<p>挑一件想练的木作，直接拆解或拼装。</p>',[['返回主菜单',menu,true]]);
  practice.render($('campaign-panel-content'),(level,mode)=>{
   setModal(null);view='world';
   const name=practice.name(level),action=mode==='assemble'?'拼装':'拆解';
   openPuzzle({id:'practice:'+level.id+':'+mode,level:level.id,mode,practice:true,replay:true,workshop:true,
    name:name+' · '+action,goal:mode==='assemble'?'找准来路，把各件合回。':level.goal,
    surface:level.id==='museum-clamp-apron'?'museum':level.id==='rain-shelter-bench'?'bench':'workshop',
    locationLabel:'榫卯练习 · '+name});
  });
 }
 function openRoomObject(level){const t=CampaignObjects.next(state,level);if(!t)return;setModal(null);openPuzzle(t);}
 function replayPanel(id){
  const node=id.startsWith('cave:')?C.nodes.find(n=>n.id===id.slice(5)):null,level=node?.id==='mouth-latch'?'store-door-latch':node?.level||id,l=P.LEVELS.find(l=>l.id===level);if(!l)return;
  panel(l.title||node?.title||'再试试接点','<p>这处已经完成。拆到一半的练习会接着上次；已开放的通路和主线进度会保留。</p>',[[replayLabel(id,'dismantle','拆开看看'),()=>startReplay(id,level,'dismantle'),true],[replayLabel(id,'assemble','试着合回'),()=>startReplay(id,level,'assemble')],['放回去',()=>setModal(null)]]);
 }
 function startReplay(id,level,mode){if(id==='cave:mouth-latch'){const saved=state.replays[id+':'+mode],pending=saved&&Sessions.restoreSession(JSON.stringify(saved),P);level=pending&&!pending.completed?saved.level:'store-door-latch';}setModal(null);openPuzzle({id:id+':'+mode,level,mode,replay:true,name:(P.LEVELS.find(l=>l.id===level).title||'木构')+' · '+(mode==='assemble'?'合回练习':'拆解练习'),goal:'再观察一次接点。可以随时放回，不影响旅程。'});}
 function taskFor(key){if(key==='bench')return {id:key,level:'rain-shelter-bench',mode:'assemble',name:'雨棚 · 合好长凳',goal:'横梁已经搭好。①装座板，再②装两枚木销。'};if(key.startsWith('cave:')){const n=C.nodes.find(n=>key==='cave:'+n.id);return n&&{id:key,level:n.id==='mouth-latch'?'store-door-latch':n.level,mode:'dismantle',name:CampaignFlow.cave[n.id]?.name||n.title,goal:n.id==='mouth-latch'?'观察宽木钥和导座，试着给长闩留出横移的路。':n.goal};}return D.tasks.find(t=>t.id===key);}
 function openPuzzle(key){
  const t=typeof key==='object'?key:taskFor(key);if(!t||modal||view!=='world')return;key=t.id;
  if(!t.replay&&key.startsWith('cave:')){const n=C.nodes.find(n=>key==='cave:'+n.id);if(state.cave.completed.includes(n.id)){startReplay(key,n.id==='mouth-latch'?'store-door-latch':n.level,'dismantle');return;}if(n.id!=='mouth-latch'&&!state.cave.completed.includes('mouth-latch')){notice('先把库门打开。');return;}}
  current=t;view='puzzle';syncMuseum();atmosphere();scene?.enable(false);scene?.present?.(false);bar.hidden=false;document.body.classList.add('cave-puzzle','campaign-puzzle');document.body.dataset.campaignSurface=t.surface||(t.extension?'workshop':t.level==='store-door-latch'?'door':t.level==='rain-shelter-bench'?'bench':state.scene==='cave'?'stone':'table');
  let run=t.practice?practice.getRun(t.level,t.mode)?.run:t.rehearsalSlot?state.continuation.rehearsals[t.rehearsalSlot]:t.roomObject?CampaignObjects.begin(state,t):t.extension?state.continuation[Next.slotFor(t.id)]:(t.replay?state.replays:state.runs)[key];if((t.replay||t.rehearsalSlot)&&run&&Sessions.restoreSession(JSON.stringify(run),P)?.completed)run=null;
  if(t.museumReplica){const saved=state.continuation.museum.runs[t.museumReplica];run=saved?.mode===t.mode?saved:null;}
  const assemblyGuide=AssemblyGuide.forLevel(t.level,t.mode,t.workshop||!!t.museumReplica);let recoveryText=null;if(!t.practice&&t.level==='store-door-latch'&&state.doorRecoveryPending){recoveryText='库门接点已更新，木闩从合法位置继续；旧记录已备份。';state.doorRecoveryPending=false;}
  if(assemblyGuide){const n=AssemblyGuide.normalize(P.LEVELS.find(l=>l.id===t.level),run,t.mode,P,E,assemblyGuide);run=n.run;if(t.workshop&&n.recovered)recoveryText='上次挡住后续入口的木件已退回。可以从这里接着做。';else if(assemblyGuide===AssemblyGuide.bench&&(n.recovered||!t.practice&&state.benchRecoveryPending)){if(!t.practice)state.benchRecoveryPending=false;recoveryText='提前放入的木销已退回托盘。先装座板，再装两枚销；其余进度已保留。';}}
  const progress=runProgress(run),resumeText=progress?.partial?'接着上次：'+progress.text+'。继续试，也可以撤销上一步。':null;
  G.openStoryPuzzle({assemblyGuide,openingText:t.workshop||t.museumReplica?(recoveryText||resumeText||t.opening):t.opening||(t.extension?'先装甲·榫头，再装乙·穿销。旧局面若提前插销，可点“取回穿销”修正。':recoveryText||resumeText||(assemblyGuide?(assemblyGuide.id!==AssemblyGuide.bench.id?'先让甲·榫头贴齐，再装乙·穿销。':recoveryText||(!t.replay?'周伯：横梁我先搭好了。你把座板合上，再装这两根小销。':(t.mode==='assemble'?'横梁已经预装。先合座板，再装两枚销；沿箭头推入即可。':'横梁留在原处。先取下两枚小销，再沿横梁滑出座板。'))):null)),illustratedSurface:true,taskId:(key.startsWith('cave:')?'study:cave:':'study:campaign:')+key,levelId:t.level,mode:t.mode,objective:t.goal,run,helpVoice:t.museumReplica||t.extension||t.replay||state.scene==='cave'||(['bench','farewell','complete'].includes(state.phase)&&t.level!=='rain-shelter-bench')?'notebook':'zhou',locationLabel:t.locationLabel||(t.extension?(t.slot?'开放工坊 · 维修通路':'开放工坊 · 装配练习'):t.replay?'随行手记 · 独立重练':state.scene==='cave'?'旧木料库 · 查看接点':t.level==='rain-shelter-bench'?'村口雨棚 · 长凳接点':'周伯家 · 木作样件'),completionText:t.museumReplica?t.completion.text:t.extension?(t.completion?.text||'合好了。收好样机，再记下进入和退出的路径。'):t.replay?undefined:t.id==='bench'?'合好了。放回场景，请旁边的周伯检查接缝。':t.id.startsWith('cave:')?(D.requiredCaveIds.includes(t.id.slice(5))?'接头拆开了。收好木件，接着取料。':'样件试完了。可以继续取料，不必把其他样件都拆开。'):'样木收好了，随时可以放回桌上。'});
  $('campaign-puzzle-sketch').hidden=t.practice||t.level!=='rain-shelter-bench'||!state.cave.completed.includes('stone-box');$('campaign-puzzle-title').textContent=t.name;$('campaign-put').textContent=t.practice?'回到练习列表 →':t.museumReplica?'回到展品近景 →':'放回场景 →';$('precise-controls').open=!G.rendererAvailable()||t.mode==='assemble'&&!assemblyGuide;requestAnimationFrame(()=>{if(!active||view!=='puzzle'||current!==t)return;G.resize();if(!document.querySelector('dialog[open]'))G.resume();updatePuzzle();if(document.activeElement===document.body||!document.activeElement?.getClientRects().length)$('campaign-put').focus();if(Sessions.restoreSession(JSON.stringify(G.getRun()),P)?.completed)offerCompletion();});if(!t.practice)save();
 }
 function capture(){
  const t=current;
  if(view!=='puzzle'||!t)return;
  const run=G.getRun();
  if(run.level!==t.level||run.mode!==t.mode)return;
  if(!Sessions.restoreSession(JSON.stringify(run),P)?.completed){
   delete (t.practice?practiceCompletionSeen:state.completionSeen)[t.id];clearTimeout(completionTimer);
  }
  if(t.practice){practice.capture(run);return;}
  if(t.museumReplica)state.continuation.museum.runs[t.museumReplica]=run;
  else if(t.rehearsalSlot)state.continuation.rehearsals[t.rehearsalSlot]=run;
  else if(t.roomObject)CampaignObjects.capture(state,t.roomObject,run);
  else if(t.extension)state.continuation[Next.slotFor(t.id)]=run;
  else (t.replay?state.replays:state.runs)[t.id]=run;
  if(!t.replay&&!t.extension&&['straight','lap','pinned'].includes(run.level))CampaignObjects.capture(state,run.level,run);
  save();
 }
 function updatePuzzle(){
  if(view!=='puzzle'||!current)return;
  $('campaign-undo').disabled=$('undo').disabled;
  const {removed}=SunJian.snapshot(),pieceKey=removed.join(',');
  if(puzzleProgress?.task===current&&puzzleProgress.pieceKey===pieceKey)return;
  const model=P.LEVELS.find(l=>l.id===current.level),bench=current.level==='rain-shelter-bench';
  const total=(bench?AssemblyGuide.editable(model,AssemblyGuide.bench):model.pieces.filter(p=>!p.fixed)).length;
  const assembling=current.mode==='assemble',count=assembling?total-removed.length:removed.length;
  const locked=assembling&&removed.length&&!P.availableInsertions(model,removed).length;
  const prefix=assembling?(bench?'已装好 ':'已归位 '):'已取下 ';
  label('campaign-puzzle-status',prefix+count+' / '+total+(count===total?' · 完成了，可以放回场景':locked?' · 先撤销修正':''));
  puzzleProgress={task:current,pieceKey};
 }
 function putBack(){if(view!=='puzzle')return;clearTimeout(completionTimer);if(completion.open)completion.close();capture();G.suspend();const t=current;current=null;view='world';bar.hidden=true;document.body.classList.remove('campaign-puzzle','cave-puzzle');if(t?.practice){practiceLibrary();return;}scene?.sync();scene?.enable(true);scene?.present?.(true);render();save();requestAnimationFrame(()=>{if(active&&view==='world'&&!modal&&!document.querySelector('dialog[open]'))scene?.refocus();});if(t?.museumReplica){museumView.focus();return;}if(t?.extension){state.continuation.stage=Next.stage(state.continuation,P,E);save();continuationHub();return;}if(t?.replay){if(state.continuation.active){continuationHub();return;}if(state.talk&&Story.resolve(state.talk.id,state)){showTalk();return;}notice(t.level==='rain-shelter-bench'?'长凳练习已收好，练习进度保存在本机。':'样木已放好。重练局面保存在本机。');return;}const valid=t&&Sessions.restoreSession(JSON.stringify(state.runs[t.id]),P);if(!valid?.completed)return;
  const learned=D.tasks.indexOf(t);if(learned>=0&&state.done.length===learned){state.done.push(t.id);state.pendingReflection=state.completionPresented.includes(t.id)?null:t.id;if(state.done.length===4)phase('night');render();scene?.sync();save();if(state.pendingReflection)beginTalk('after:'+t.id);else inviteDinner();}
  else if(state.pendingReflection===t.id){state.pendingReflection=null;save();}
  else if(t.id==='bench'&&state.phase==='bench'){phase('farewell');notice('长凳合好了，请旁边的周伯检查接缝。');}
  else if(t.id.startsWith('cave:')){const n=C.nodes.find(n=>t.id==='cave:'+n.id);if(n){if(!state.cave.completed.includes(n.id)){state.cave.completed.push(n.id);state.cave.runs[n.id+':dismantle']=state.runs[t.id];scene?.sync();render();save();}notice(!D.requiredCaveIds.includes(n.id)?'这件样木试过了，已经放回原处。想合回去，随时翻开手记。':D.canReturn(state)?'木料和草图齐了。到天光处装好小车，就能回村。':({ 'mouth-latch':'木闩放在门边，库门可以打开了。','rack-frame':'挡框收在架边。绑着布带的替换料可以取下了。','stone-box':'草图在匣底，和木料一起带回去。' })[n.id]||'样件放回原处。想合回去，可以到手记里再练。');}}
 }
 function completed(){capture();if(!current)return;
  if(current.museumReplica){
   const museum=state.continuation.museum,replica=current.museumReplica;
   if(!museum.learned.includes(replica)&&Sessions.restoreSession(JSON.stringify(museum.runs[replica]),P)?.completed)museum.learned.push(replica);
   save();updatePuzzle();offerCompletion();return;
  }
  if(current.extension||current.replay){updatePuzzle();offerCompletion();return;}const valid=Sessions.restoreSession(JSON.stringify(state.runs[current.id]),P);if(!valid?.completed)return;const key=current.id;
  if(!state.records.some(r=>r.task===key)){const tr=G.getRun().trial;state.records.push({task:key,level:current.level,mode:current.mode,...tr});}
  // The close-up is still editable. Certify its final history only when it is put back.
  save();updatePuzzle();offerCompletion();
 }
 function inviteDinner(){if(state.phase==='night'&&!state.spoken.includes('night')){markSpoken('night');notice('周伯：来，先吃饭。木头不怕凉，菜可不行。');save();}}
 function finish(){
  if(!state.benchChecked||!Sessions.restoreSession(JSON.stringify(state.runs.bench),P)?.completed){notice('先请周伯检查长凳，再坐下试试。');return;}
  if(state.phase==='complete'){scene?.sit?.(true);showEnding();return;}
  beginInterlude('farewell');
 }
 function continuationGoal(){const c=state.continuation;if(c.museum.visit||c.stage==='museum')return '参观榫卯文化博物馆，随后去选作品。';if(F.goals[c.stage])return F.goals[c.stage];if(CampaignDesign.goals[c.stage])return CampaignDesign.goals[c.stage];return c.stage==='meetup'?'看看雨棚柱上的赛事海报。':c.stage==='notice'?'了解参赛要求，再和周伯道别。' :c.stage==='goodbye'?'向周伯道别，背上包下山。':c.stage==='home'?'找一个能继续练习的地方。':c.stage==='practice'?'检查装配顺序，试着把样机合好。':c.stage==='review'?'记下可拆回的路径，再决定是否报名。':'报名已记下。下一步，想想给谁做、用在哪里。';}
 function startContinuation(){
  if(!state.finished||view==='puzzle')return;
  state.continuation.started=true;state.continuation.active=true;state.talk=null;scene?.sit?.(false);save();render();continuationHub();
 }
 function currentWorkshopProgress(c){
  const task=Next.workshops[c.stage];
  return task?runProgress(c[task.slot]):null;
 }
 function resumeSummary(){
  if(state.continuation.active){
   const progress=currentWorkshopProgress(state.continuation);
   return continuationGoal()+(progress?.partial?'\n上次'+progress.text+'。':'');
  }
  const beat=I.beat(state);
  return (beat?.title||CampaignIllustrated.frames[state.frame]?.name||'溪桥村')+'\n'+(beat?'继续刚才的片段，或略过后接着走。':D.objective(state));
 }
 function syncWorkshopRest(){
  const c=state.continuation;
  workshopRestView.hidden=!(active&&view==='world'&&!modal&&c.active&&c.workshopSeen&&c.resting);
  if(workshopRestView.hidden)return;
  const task=Next.workshops[c.stage],progress=currentWorkshopProgress(c);
  const heading=c.endingSeen?'作品留在展位上':c.productionStarted?'把这件作品做完整':c.designReviewed?'今天的练习记好了':'先把样机收好';
  const description=c.endingSeen?'把作品留在展位上再看看，或翻开最后一页。':c.productionStarted?'进度已经记好，可以接着做，也可以先歇一会儿。':'先收好样机。留在工坊看看，或翻翻刚才的记录。';
  workshopRestView.querySelector('h2').textContent=task?.name||heading;
  workshopRestView.querySelector('p').textContent=task?(progress?.partial?'上次'+progress.text+'。':'')+continuationGoal():description;
  workshopRestView.querySelector('[data-workshop-record]').textContent=task?'继续工坊练习':c.endingSeen?'查看旅程结尾':c.productionStarted?'继续当前阶段':Next.workshopReady(c)?'继续制作参赛作品':'继续学习';
  workshopRestView.querySelector('[data-workshop-rehearse]').hidden=!Next.legalRun(c,P,E)?.completed;
 }
 function workshopRest(){if(!state.continuation.workshopSeen)return;const c=state.continuation;c.active=true;c.resting=true;state.talk=null;setModal(null);render();save();}
 function continuationBack(){if(awardReplay){awardReplay=null;render();continuationHub();return;}if(state.continuation.workshopSeen)workshopRest();else menu();}
 function workshopRehearsals(){
  const c=state.continuation,pin={slot:'run',name:'穿销 · 合回',level:'pinned',mode:'assemble',opening:'先让榫头贴齐，再装穿销。'};
  const entries=[...(Next.legalRun(c,P,E)?.completed?[pin]:[]),...Object.values(Next.serviceTasks).filter(t=>Next.done(c,t.slot,P,E)),...Object.values(Next.workshops).filter(t=>c.workshopLegacy||Next.done(c,t.slot,P,E))];
  const buttons=entries.map(t=>{
   const progress=runProgress(c.rehearsals[t.slot]);
   const title=progress?.partial?t.name+' · '+progress.count+'/'+progress.total:t.name;
   return [title,()=>{setModal(null);openPuzzle({...t,id:'rehearse:'+t.slot,rehearsalSlot:t.slot,extension:true});}];
  });
  panel('重练样机','<p>重练有自己的拆装进度，随时可以放回工坊。</p>',[...buttons,['返回当前旅程',continuationHub,true]],'开放工坊 · 自由重练');
 }
 function continuationRules(){
  panel('省级木作交流赛','<article class="continuation-leaflet"><small>省级木作交流活动 · 新人组</small><h3>给日常生活做一件可拆修的小家具</h3><p>距活动还有十周，报名将在三周后截止。新人组面向省内各地初学者：累计系统学习未满两年，且未从事木作职业。</p><p>带上作品和过程记录，现场完成关键装配，并说明以后怎样维修。可以请教老师、由工坊协助加工；哪些地方得到帮助，要如实写清楚。</p><p>正式现场设在省城，溪桥传习点负责介绍活动和学习交流。周伯不担任本组评委。先弄明白用途，再慢慢准备，不用今天就决定。</p><small>游戏内虚构活动 · 不对应现实赛事</small></article>',[['收好折页',continuationHub,true]],'活动折页 · 随时可回看');
 }
 function workshopPanel(title,html,buttons,kicker){panel(title,html,buttons,kicker,true);}
 function editPlayerName(done){
  panel('报名信息上，写你的名字','<p>评审和领奖证书会用这个名字。只保存在本机，空着就用“陈屿”。</p><label class="player-name-label">姓名<input id="campaign-player-name" type="text" maxlength="48" autocomplete="off" aria-label="参赛姓名"></label><p id="campaign-name-count" class="muted"></p>',[['先不改，返回',panelBack],['确认姓名',()=>{state.playerName=CampaignAwards.name($('campaign-player-name').value);state.playerNameConfirmed=true;save();done();},true]],'新人组 · 参赛人');
  const input=$('campaign-player-name');input.value=state.playerName;input.oninput=()=>{$('campaign-name-count').textContent='最多12个可见字符';};input.onkeydown=e=>{if(e.key==='Enter'&&!e.repeat){e.preventDefault();e.stopPropagation();$('campaign-panel-actions').querySelector('.primary').click();}};input.focus();
 }
 function awardRecord(kind,back=continuationHub){
  const c=state.continuation,w=F.choice(c);if(!w||!c.rewardRecorded&&!c.resultSeen)return;if(kind==='photo'&&!c.resultSeen&&c.awardStep<3)return;
  panel(kind==='photo'?'那天的合影':'新人组 · 荣誉证书',kind==='photo'?CampaignAwards.photo(state.playerName,w.name):CampaignAwards.certificate(state.playerName,w.name),[['收好，继续',back,true]],'第三名 · 《'+w.name+'》');
 }
 function replayAwards(){if(!state.continuation.endingSeen)return;awardReplay={...structuredClone(state.continuation),resultSeen:false,endingSeen:false,awardStep:0,stage:'results'};render();continuationHub();}
 function finaleUI(){return {panel:workshopPanel,act:finaleAction,talk:id=>{if(awardReplay&&id==='continuationFinalResult'){finaleAction('award:stage');}else beginTalk(id);},start:startFinalTask,back:continuationBack,notes,menu,firstChoice:!!chapterReplay,rehearse:rehearseWork,stay:workshopRest,changeChoice:chapterReplay?null:changeWork,playerName:state.playerName,replay:!!awardReplay,certificate:()=>awardRecord('certificate'),photo:()=>awardRecord('photo'),recap:replayAwards};}
 function continuationHub(){
  if(!state.continuation.active||!state.finished)return;state.talk=null;
  const c=state.continuation;c.stage=Next.stage(c,P,E);save();render();
  if(awardReplay){F.render(awardReplay,finaleUI(),P,E);return;}
  if(c.museum.visit||c.stage==='museum'){openMuseum('story');return;}
  if(c.resting&&c.workshopSeen){workshopRest();return;}
  if(Next.workshopReady(c)&&F.render(c,finaleUI(),P,E))return;
  if(c.stage==='goodbye'){beginTalk('continuationGoodbye');return;}
  if(CampaignDesign.render(c,{panel:workshopPanel,back:continuationBack,act:continuationAction,talk:beginTalk,start:startServiceTask,notes,firstChoice:!!chapterReplay,workshopPractice:workshopRehearsals,workshopProgress:currentWorkshopProgress(c),museumVisit:museumAvailable()?()=>openMuseum('workshop'):null,choose:value=>{if(c.stage!=='purpose')return;c.purposeChoice=value;save();beginTalk('continuationPurpose');}}))return;
  if(c.stage==='meetup'){
   scene?.sit?.(false);state.frame='shelter';setModal(null);scene?.sync();scene?.refocus();save();return;
  }
  const back=['收好记录，留在工坊',continuationBack];
  if(c.stage==='notice'){panel('带走的不只一页','<p>你从柱下的木盒取了张折页。十周后，省城会办一场木作交流赛。</p><p>你把它夹进手记，先不急着报名。回去找个地方练练，看自己能不能把一件东西做完整。</p>',[['看看参赛要求',continuationRules],['问问周伯，之后怎么继续学',()=>beginTalk('continuationDeparture'),true],back],'雨棚 · 发现活动折页');return;}
  if(c.stage==='home'){panel('回去以后','<p>返校后的第一周，你先补完了搁在宿舍的作业。周五下课，你翻出那张折页，找到附近可以预约的开放工坊。</p><p>包里的木屑早就清干净了，接头里面的样子倒还记得。</p>',[['预约周末，去开放工坊',()=>beginTalk('continuationWorkshop'),true],['重读活动折页',continuationRules],back],'第一个周末 · 学习从这里继续');return;}
  if(c.stage==='practice'){workshopPanel('先大件，再小销','<p>台上是一组散件。①归位甲·榫头，再②装入乙·穿销。</p><p>选中木件后，沿短箭头拖入接点。旧记录若先装了小销，可以用“取回穿销”修正；离开或刷新都能接着做。</p>',[[c.run?'接着合回样机':'拿起散件，试着合回',()=>{if(!c.run)c.run=Next.seed(P,E);setModal(null);openPuzzle({id:'practice-release-order',level:'pinned',mode:'assemble',extension:true,name:'开放工坊 · 给大件留条路',goal:'①归位甲·榫头 → ②装入乙·穿销。'});},true],['重读活动折页',continuationRules],back],'开放工坊 · 独立练习');return;}
  if(c.stage==='review'){
   const text=c.reviewed?'你在记录边上画了一个小箭头：先取小销，再让大件沿开口退出。它和刚才装入时，是相反的顺序。':'样机已经合好。先别急着报名，给以后拆开它留一条记录。';
   workshopPanel('把这条路记下来','<p>'+text+'</p><div class="continuation-path"><span>合回：大件贴齐 → 小销固定</span><span>拆开：取回小销 → 大件退出</span></div><p>你在记录旁留了块空白：以后想做什么，先从平常会用的东西想起。</p>',[...(c.reviewed?[['我想报名试试',()=>beginTalk('continuationEntry'),true]]:[['标记取销与退出的位置',()=>{if(!Next.legalRun(c,P,E)?.completed)return;c.reviewed=true;save();continuationHub();},true]]),['再看看活动要求',continuationRules],back],'装配手记 · 一次主动复盘');return;
  }
  workshopPanel('报名记下了','<p>你又想起雨棚里换湿鞋的人。坐稳了，两只手才都腾得出来。先从一张平常能用的小凳想起。</p><p>练完以后，从小凳、小几和书架里挑一件做成参赛作品。</p>',[['开始准备自己的作品',()=>continuationAction('continuation:design'),true],['收好计划，留在工坊',continuationBack],['重读参赛要求',continuationRules],['打开随行手记',notes]],'第一份准备计划 · 只保存在本机');
 }
 function startServiceTask(id){
  const expected={...Object.fromEntries(Object.entries(Next.workshops).map(([key,t])=>[key,t.stage])),'practice-service-access':'service-check','practice-service-open-back':'service-build','practice-service-open-out':'service-test'};
  if(!state.continuation.active||state.continuation.stage!==expected[id])return;const t=Next.task(id);if(!t)return;setModal(null);openPuzzle(t);
 }
 function continuationAction(id){
  const c=state.continuation;if(!state.finished||!c.active)return;
  if(id.startsWith('continuation:finale:')){finaleAction(id.slice('continuation:finale:'.length));return;}
  if(id==='continuation:read'||id==='continuation:stow'){if(c.stage!=='meetup')return;c.noticeSeen=true;c.stage='notice';save();render();if(id==='continuation:read')continuationRules();else continuationHub();return;}
  if(id==='continuation:goodbye'){if(c.stage!=='notice')return;c.zhouContact=true;c.departurePrepared=true;c.stage='goodbye';save();render();beginTalk('continuationGoodbye');return;}
  if(id==='continuation:home'){if(c.stage!=='goodbye')return;c.goodbyeSeen=true;c.departed=true;c.stage='home';save();render();continuationHub();return;}
  if(id==='continuation:ready'){if(c.stage!=='home')return;c.workshopSeen=true;c.stage='practice';save();render();continuationHub();return;}
  if(id==='continuation:register'){if(c.stage!=='review'||!c.reviewed||!Next.legalRun(c,P,E)?.completed)return;if(!state.playerNameConfirmed){editPlayerName(()=>continuationAction('continuation:register'));return;}c.entryAccepted=true;c.stage='registered';save();continuationHub();return;}
  if(id==='continuation:design'){if(c.stage!=='registered')return;c.designStarted=true;save();continuationHub();return;}
  if(id==='continuation:brief'){if(c.stage!=='purpose'||!['comfort','moving','repair'].includes(c.purposeChoice))return;c.purpose=c.purposeChoice;save();continuationHub();return;}
  if(id==='continuation:peer-met'){if(c.stage!=='peer')return;c.peerMet=true;save();continuationHub();return;}
  if(id==='continuation:side'){if(c.stage!=='service-choice'||!Next.done(c,'serviceRun',P,E))return;c.variant='side';save();continuationHub();return;}
  if(id==='continuation:design-reviewed'){if(c.stage!=='service-review'||!Next.done(c,'serviceOutRun',P,E))return;c.designReviewed=true;c.resting=false;save();continuationHub();return;}
  if(id==='continuation:workshop-reflected'){if(Next.stage(c,P,E)!=='workshop-reflection')return;c.workshopReflected=true;save();continuationHub();return;}
  if(id==='continuation:museum-introduced'&&c.stage==='museum'&&c.museum.visit?.from==='story'){
   c.museum.introduced=true;setModal(null);museumView.focus();save();return;
  }
  if(id==='continuation:hub'){continuationHub();return;}
  if(id==='continuation:rules')continuationRules();
 }
 function startFinalTask(id){const c=state.continuation,t=F.task(c,id);if(!c.active||!Next.workshopReady(c)||!t||F.stage(c,P,E)!==t.stage)return;if(id==='contest-service-out'&&!c.judgeMet){beginTalk('continuationFinalJudge');return;}c.resting=false;setModal(null);openPuzzle(t);}
 function finaleAction(id){const c=state.continuation;if(!c.active||!Next.workshopReady(c)||id==='begin'&&!c.museum.passed)return;
  if(awardReplay){if(F.action(awardReplay,id,P,E)){const celebrate=id==='award:receive'||id==='award:skip';if(awardReplay.resultSeen){awardReplay=null;render();beginTalk('continuationFinalMemory');}else{render();continuationHub();}if(celebrate)JourneyAtmosphere.award?.();}return;}
  if(id==='demo'&&c.stage==='contest-service-out'){c.judgeMet=true;save();startFinalTask('contest-service-out');return;}
  if(id==='zhou'&&c.stage==='after-award'){beginTalk('continuationFinalZhou');return;}
  if(F.action(c,id,P,E)){c.resting=false;c.stage=Next.stage(c,P,E);save();render();continuationHub();if(id==='award:receive'||id==='award:skip')JourneyAtmosphere.award?.();}
 }
 function changeWork(){const c=state.continuation;if(c.packed)return;panel('改选参赛作品？','<p>只清除当前参赛作品的装配与检查记录。此前学习、报名和样机证明会保留。</p>',[['保留当前作品',continuationHub,true],...EntryFurniture.choices.map(w=>['改选'+w.name,()=>finaleAction('choose:'+w.key)])],'作品选择 · 出发前可修改');}
 function rehearseWork(){const c=state.continuation,w=F.choice(c);if(!w||!F.done(c,'entryRun',P,E))return;c.resting=false;setModal(null);openPuzzle({...F.task(c,'entry-stool-assemble'),id:'rehearse:entryRun',rehearsalSlot:'entryRun',goal:'重练自己的作品，正式比赛与获奖记录保留。'});}
 function showEnding(){
  state.continuation.active=false;state.talk=null;render();save();
  const memory=state.nightBenchSeen?'昨晚没处坐的雨棚，今天能踏实歇脚了。':'刚换好鞋的人下了石阶。周伯让我也坐上去试试，长凳稳稳当当。';
  panel('雨后再会','<div class="campaign-ending"><img decoding="async" data-src="assets/cave/traveler-end.png" alt="收好手记的旅人"><div><p>雨停了。刚才有人在凳上换下湿鞋，拎着鞋走远了。</p><p>我把背包放在凳旁，在手记最后添了一行：'+memory+'</p><p>周伯坐在另一头。站起来时，我瞥见柱子上有张海报。</p></div></div>',[['继续后面的故事',startContinuation,true],['再坐一会儿',()=>{setModal(null);notice('按 Esc 可打开主菜单。');},true],['起身看看',()=>{scene?.sit?.(false);setModal(null);}],['翻开旅行笔记',notes],['回到主菜单',menu]],'第一幕完成 · '+Math.round(state.playMs/60000)+' 分钟本机游玩');
  $('campaign-panel-actions').querySelector('.primary')?.focus();
 }
 function beginInterlude(id){
  if(!I.allowed(state,id)||state.interlude||state.interludesDone.includes(id))return;
  state.talk=null;state.interlude={id,step:0};clearTimeout(toastTimer);$('campaign-toast').hidden=true;save();showInterlude();
 }
 function showInterlude(){
  const beat=I.beat(state),ticket=state.interlude;if(!beat)return;
  $('campaign-interlude-title').textContent=beat.title;$('campaign-interlude-speaker').textContent=beat.speaker;
  $('campaign-interlude-line').textContent=beat.text;$('campaign-interlude-next').textContent=beat.next;
  $('campaign-interlude-next').onclick=e=>{if(e.detail<2)advanceInterlude(false,ticket);};$('campaign-interlude-skip').onclick=e=>{if(e.detail<2)advanceInterlude(true,ticket);};
  setModal('campaign-interlude');scene?.sync();render();updateInterludeControls();
  if(modal==='campaign-interlude')($('campaign-interlude-next').disabled?$('campaign-interlude-title'):$('campaign-interlude-next')).focus();
 }
 function updateInterludeControls(){
  if(modal!=='campaign-interlude')return;const sceneState=scene?.snapshot(),waiting=!sceneState||sceneState.loading,failed=sceneState?.imageError;
  $('campaign-interlude-next').disabled=!!(waiting||failed);$('campaign-interlude-retry').hidden=!failed;if(!waiting&&!failed&&document.activeElement===$('campaign-interlude-title'))$('campaign-interlude-next').focus();
  $('campaign-interlude-status').textContent=failed?'画面暂未载入，可重试或略过；进度已保留。':waiting?'正在载入画面…':'';
 }
 $('campaign-interlude-retry').onclick=()=>{scene?.retry();updateInterludeControls();};
 function advanceInterlude(skip,ticket){
  if(document.hidden||modal!=='campaign-interlude'||state.interlude!==ticket)return;
  const b=I.beat(state);if(!b||!skip&&(scene?.snapshot().loading||scene?.snapshot().imageError))return;
  if(!skip&&b.step+1<b.total){state.interlude={id:b.id,step:b.step+1};save();showInterlude();return;}
  state.interlude=null;if(!state.interludesDone.includes(b.id))state.interludesDone.push(b.id);
  if(b.id==='overnight'){state.pendingReflection=null;state.frame='room';state.phase='morning';}
  else if(b.id==='homeward'){state.suppliesCollected=true;state.scene='village';state.frame='room';state.phase='return';}
  else{state.phase='complete';state.finished=true;state.frame='bench-seat';}
  if(!state.visited.includes(state.phase))state.visited.push(state.phase);save();setModal(null);scene?.sync();render();
  if(b.id==='farewell'){scene?.sit?.(true);showEnding();}else notice(b.id==='overnight'?'天亮了。和周伯聊聊今天的打算。':'小车停稳了。和周伯说一声，料已经带回来。');
 }
 function panelBack(){if(panelReturn==='campaign-menu'){menu();return;}if(state.continuation.active){continuationHub();return;}if(state.talk&&Story.resolve(state.talk.id,state))showTalk();else setModal(null);}
 function journeyNotes(){const i=D.phases.indexOf(state.phase),entries=[['雨夜 · 村口',(state.nightBenchSeen?'一个人下山遇上大雨。雨棚的长凳少着座板，我去对面亮灯的屋子借宿。':'一个人下山遇上大雨。沿村道找到一户亮灯的人家，在周伯家借住了一晚。'),i>=1],['灯下 · 小屋','亲手试过卯口、搭接和穿销。周伯说，这些样木是把接头做得敞亮些，方便看。',state.done.length===4],['次日 · 旧木料库','沿屋旁石路去取长凳的备用料。旧库里留着他和徒弟做的练习接头。',i>=5],['返村 · 雨棚','找到浅色布带绑着的五件料和草图，沿原路推回小车，放在雨棚边。',i>=7],['合木 · 雨棚','周伯先搭好横梁，我滑入座板，再装好两枚小销。原来拆时认过的接面，合时也用得上。',i>=9],['雨后 · 再会','长凳合好，周伯检查过接缝。有人在凳上换掉湿鞋。我也坐了一会儿，把这事记了下来。',state.finished],['带走的折页','我在雨棚柱旁取了一张省级木作交流赛的折页。新人组准备一件可以拆修的小家具，距离活动还有十周。',state.continuation.noticeSeen],['回去以后','和周伯加了联系方式，他说刚开始做的也可以拍给他看。回学校后，我预约了附近的开放工坊。',state.continuation.workshopSeen],['装配记录','在工坊合好穿销样机，记下取销、退出大件的路径。',state.continuation.reviewed],['第一份准备计划','决定报名新人组。接下来，要想清楚做给谁、放在哪里，也如实记下受到的帮助。',state.continuation.entryAccepted],['最初的用途练习','先从玄关换鞋、搬动和维修的问题出发。正式作品在第五周选定。',!!state.continuation.purpose],['工坊里的同行','认识了也参加新人组的林岚。她问我，销头看得见，手从哪边伸？',state.continuation.peerMet],['维修通路','拆检前置挡条，改用侧置固定，再亲手合回、取销、退出主件。这条路要留在自己的设计里。',state.continuation.designReviewed]];if(state.continuation.productionStarted)entries.push(['自己的作品',F.choice(state.continuation)?.name||'正在选择',true],['参赛过程',state.continuation.recordsReady?'用途、维修出口和装配均有记录，加工协助如实说明。':'检查接面、搬动与取销位置。',true],['省城交流赛','新人组现场装配、局部拆修和复装均已完成。',state.continuation.presented],['第三名，还有下一页','第三名，荣誉证书，还有三千元奖金。和林岚互相道了喜，周伯也收到了合影。下次回村，把作品带给他看看。',state.continuation.resultSeen]);return '<div class="campaign-story-notes"><h3>这一路</h3>'+entries.filter(e=>e[2]).map(([title,text])=>'<p><b>'+title+'</b><br>'+text+'</p>').join('')+'</div>';}
 function runProgress(run){
  const legal=run&&Sessions.restoreSession(JSON.stringify(run),P);if(!legal)return null;
  const level=P.LEVELS.find(l=>l.id===legal.level);if(!level)return null;
  const pieces=level.pieces.filter(p=>!p.fixed&&(level.id!=='rain-shelter-bench'||!AssemblyGuide.bench.prefitted.some(m=>m.piece===p.id)));
  const count=pieces.filter(p=>legal.mode==='assemble'?!legal.removed.includes(p.id):legal.removed.includes(p.id)).length,total=pieces.length;
  return {count,total,mode:legal.mode,level:legal.level,partial:count>0&&count<total,text:(legal.mode==='assemble'?'已装好 ':'已取下 ')+count+' / '+total};
 }
 function replayLabel(id,mode,fallback){const progress=runProgress(state.replays[id+':'+mode]);return progress?.partial?(mode==='assemble'?'继续合回':'继续拆解')+' · '+progress.count+'/'+progress.total:fallback;}
 function unfinishedStudies(){
  const pending=[];
  for(const [key,run]of Object.entries(state.replays)){
   const match=/^(straight|lap|pinned|rain-shelter-bench|cave:[a-z-]+):(dismantle|assemble)$/.exec(key),progress=runProgress(run);if(!match||!progress?.partial)continue;
   const id=match[1],level=id==='cave:mouth-latch'?run.level:id.startsWith('cave:')?C.nodes.find(n=>n.id===id.slice(5))?.level:id;
   const available=id.startsWith('cave:')?state.cave.completed.includes('mouth-latch'):id==='rain-shelter-bench'?state.done.length===4:CampaignFieldNotes.learned(state,id);
   if(available&&progress.level===level&&progress.mode===match[2])pending.push({id,mode:match[2],level,key,progress});
  }
  if(!pending.length)return;
  const box=document.createElement('section');box.className='campaign-unfinished';box.setAttribute('aria-label','还没做完的练习');const title=document.createElement('h3');title.textContent='上次还没试完';box.append(title);
  const note=document.createElement('p');note.textContent='这些练习还留着原来的局面。选一件接着试，不影响这趟旅程。';box.append(note);
  const list=document.createElement('div');list.className='campaign-unfinished-list';
  for(const entry of pending){const b=document.createElement('button');b.dataset.resumeStudy=entry.key;const name=document.createElement('strong'),detail=document.createElement('span');name.textContent=(entry.level==='rain-shelter-bench'?'雨棚长凳':P.LEVELS.find(l=>l.id===entry.level).title)+' · '+(entry.mode==='assemble'?'合回':'拆解');detail.textContent=entry.progress.text+' · 继续 →';b.append(name,detail);b.onclick=()=>{if(!scene){setModal(null);enter();}startReplay(entry.id,entry.level,entry.mode);};list.append(b);}
  box.append(list);$('campaign-panel-content').prepend(box);
 }
 function practiced(id){return state.cave.completed.includes(id)||['dismantle','assemble'].some(mode=>Sessions.restoreSession(JSON.stringify(state.replays['cave:'+id+':'+mode]),P)?.completed);}
 function heritageNotes(){
  const field=CampaignFieldNotes;
  const cards=field.heritage(state,F.choice(state.continuation)).map(item=>
   '<article><h3>'+item.title+'</h3><p>'+item.text+'</p>'+
   (item.memory?'<p class="heritage-memory">'+item.memory+'</p>':'')+'</article>').join('');
  const c=state.continuation;
  const tried=slot=>Next.done(c,slot,P,E)||Next.done(c.rehearsals,slot,P,E);
  const workshop=field.workshop(tried('dovetailOutRun')&&tried('dovetailBackRun'),tried('burrBackRun')).map(item=>
    '<article class="heritage-workshop-note"><img src="assets/workshop-models/'+item.id+'-open.webp" alt="'+item.caption+'" width="480" height="260"><div><h4>'+item.title+'</h4><p>'+item.memory+'</p></div></article>').join('');
  const museumNotes=Museum.notes(c.museum);
  const gallery=museumNotes.length?'<h3>博物馆里看过的接点</h3><div class="campaign-note-grid">'+museumNotes.map(item=>
   '<article><h4>'+item.name+'</h4><p>'+item.text+'</p>'+(item.worked?'<small>亲手试过复原件</small>':'')+'</article>').join('')+'</div>':'';
  const sources=field.heritageSources.map(source=>
   '<article><h3>'+source.title+'</h3><p>'+source.summary+'</p><small>'+source.credit+'</small>'+
   '<p class="heritage-address">'+source.url+'</p></article>').join('');
  return '<details class="campaign-heritage"><summary>非遗手记 · 修、用、教</summary>'+
   '<p>榫卯手艺有人会做、有人愿意学，旧家具才有人会修，新家具也能从中找到做法。</p>'+
   '<div class="heritage-cards">'+cards+'</div>'+workshop+gallery+
   '<details class="heritage-sources"><summary>现实中的非遗传习与资料来源</summary>'+sources+
   '<p class="muted">溪桥村、周伯和游戏里的教学样件均为虚构。来源网址可在联网后查阅。</p></details></details>';
 }
 function notes(){const known=state.done.length,content='<div class="campaign-note-portrait"><img decoding="async" data-src="assets/cave/traveler-notes.png" alt="旅人记下接点的观察"><p>先记住怎么看。<br>等亲手试过，再把这一页写满。</p></div><div class="campaign-note-grid">'+[['一处直榫','先找卯口，再看哪些接触面限制了移动。',known>=1],['交叠的半榫','看交叠处谁在上、谁在下，判断哪里还有空间。',known>=2],['小小的穿销','遇到被贯穿的接点，先检查穿过它的小件。',known>=3],['合回去','给木件留出进入的路径，锁定的小件留到合适的时候。',known>=4],...C.nodes.map(n=>[n.short,P.LEVELS.find(l=>l.id===n.level).insight,practiced(n.id)])].map(([title,text,yes])=>'<article><h3>'+(yes?'✓ ':'○ ')+title+'</h3><p>'+(yes?text:'留一页空白，等亲手试过再记。')+'</p></article>').join('')+'</div>';panel('旅行笔记',heritageNotes()+journeyNotes()+content,[...(state.continuation.rewardRecorded?[['展开获奖证书',()=>awardRecord('certificate',notes)],...(state.continuation.resultSeen||state.continuation.awardStep>=3?[['看看领奖合影',()=>awardRecord('photo',notes)]]:[])]:[]),...(museumAvailable()&&!state.continuation.museum.visit?[['回访榫卯文化博物馆',()=>openMuseum(panelReturn==='campaign-menu'?'menu-notes':'notes')]]:[]),['收好笔记',panelBack,true]]);addStudyButtons();}
 function addStudyButtons(){
  unfinishedStudies();
  const learnedSections=document.createElement('section');learnedSections.className='campaign-note-grid';learnedSections.setAttribute('aria-label','小屋样木重练');
  for(const [id,name]of [['straight','直榫'],['lap','半榫'],['pinned','穿销']]){
   if(!CampaignFieldNotes.learned(state,id))continue;
   const article=document.createElement('article'),title=document.createElement('h3');title.textContent=name+' · 台前样木';article.append(title);
   for(const [mode,text]of [['dismantle','再拆一次'],['assemble','试着合回']]){const b=document.createElement('button');b.textContent=replayLabel(id,mode,text);b.dataset.lessonStudy=id+':'+mode;b.onclick=()=>{if(!scene){setModal(null);enter();}startReplay(id,id,mode);};article.append(b);}learnedSections.append(article);
  }
  if(learnedSections.children.length)$('campaign-panel-content').append(learnedSections);
  if(state.done.length===D.tasks.length){
   const practice=document.createElement('section');practice.className='campaign-note-grid';practice.setAttribute('aria-label','长凳三件练习');
   const article=document.createElement('article'),title=document.createElement('h3'),description=document.createElement('p');title.textContent='长凳 · 三件练习';description.textContent='横梁留在原处，试拆座板和两枚小销。练习不改变旅程进度。';article.append(title,description);
   for(const [mode,text]of [['dismantle','拆开长凳'],['assemble','合回长凳']]){const b=document.createElement('button');b.textContent=replayLabel('rain-shelter-bench',mode,text);b.dataset.benchStudy=mode;b.onclick=()=>{if(!scene){setModal(null);enter();}startReplay('rain-shelter-bench','rain-shelter-bench',mode);};article.append(b);}practice.append(article);$('campaign-panel-content').append(practice);
  }
  if(state.fieldNotes.length){
   const section=document.createElement('section');section.className='campaign-field-journal';const h=document.createElement('h3');h.textContent='屋里看见的小事';section.append(h);
   for(const id of state.fieldNotes){const entry=CampaignFieldNotes.find(id);if(!entry)continue;const row=document.createElement('article'),title=document.createElement('strong'),text=document.createElement('p');title.textContent=entry.name;text.textContent=entry.note;row.append(title,text);section.append(row);}
   $('campaign-panel-content').append(section);
  }
  if(!state.cave.completed.includes('mouth-latch'))return;
  const section=document.createElement('section');section.className='campaign-note-grid';section.setAttribute('aria-label','木料库结构重练');
  const explanation=document.createElement('p');explanation.className='muted';explanation.textContent='独立重练保留在手记里，不改变库内物件与主线进度。';section.append(explanation);
  for(const n of C.nodes){
   const article=document.createElement('article'),title=document.createElement('h3');title.textContent=n.short+(D.optionalCaveIds.includes(n.id)?' · 自选':'');article.append(title);
   if(D.requiredCaveIds.includes(n.id)&&!state.cave.completed.includes(n.id)){
    const b=document.createElement('button');b.textContent='去原处查看';b.dataset.visit=n.id;b.onclick=()=>{setModal(null);if(!scene)enter();scene.go(n.id==='rack-frame'?'store-middle':'store-sky');};article.append(b);
   }else for(const [mode,text]of [['dismantle','拆开'],['assemble','合回']]){const b=document.createElement('button');b.textContent=replayLabel('cave:'+n.id,mode,text);b.dataset.study=n.id+':'+mode;b.onclick=()=>{if(!scene){setModal(null);enter();}startReplay('cave:'+n.id,n.level,mode);};article.append(b);}
   section.append(article);
  }
  $('campaign-panel-content').append(section);
 }
 function settings(){if(modal!=='campaign-panel')panelReturn=modal==='campaign-menu'?'campaign-menu':null;panel('设置与内测记录',`<div class="campaign-settings"><label>旋转观察灵敏度<input id="campaign-sensitivity" aria-label="旋转观察灵敏度" type="range" min="0.3" max="2" step="0.1" value="${state.settings.sensitivity}"></label><label>音乐、雨声与音效<button id="campaign-audio">${$('sound').querySelector('span').textContent}</button></label><label>对白提示音<input id="campaign-dialogue-sound" type="checkbox" ${state.settings.dialogueSound!==false?'checked':''}><small>人物开口时轻响，消息使用另一种提示音。</small></label><label>实录雨声<select id="campaign-rain" aria-label="实录雨声"><option value="auto">跟随场景 · 山路树叶／村口院落</option><option value="leaves">雨打树叶</option><option value="courtyard">院落落雨</option></select><button id="campaign-rain-preview">试听 15 秒</button><small id="campaign-rain-status" role="status"></small></label><label>总音量<input id="campaign-volume" aria-label="音量" type="range" min="0" max="1" step="0.05" value="${state.settings.volume}"></label><label>背景音乐<input id="campaign-music-volume" aria-label="背景音乐音量" type="range" min="0" max="1" step="0.05" value="${state.settings.musicVolume??1}"></label><label>雨声<input id="campaign-rain-volume" aria-label="雨声音量" type="range" min="0" max="1" step="0.05" value="${state.settings.ambienceVolume??1}"></label><label>拆装画面质量<select id="campaign-quality"><option value="low">流畅</option><option value="medium">标准</option><option value="high">精细</option></select></label><label>减少动态效果<input id="campaign-reduced" type="checkbox" ${state.settings.reducedMotion?'checked':''}></label></div><p class="muted">音乐为原创音符；雨声为作者公开授权的实录，首次默认关闭；切到后台自动暂停。减少动态效果会停下雨线、热气和窗边叶影，神情直接切换。进度与操作记录仅存本机。下载存档后，可在另一浏览器或离线版从文件恢复。雨声来源与作者：<a href="https://freesound.org/people/xkeril/sounds/612817/" target="_blank" rel="noopener">院落 xkeril</a> · <a href="https://freesound.org/people/SamsterBirdies/sounds/584272/" target="_blank" rel="noopener">树叶 SamsterBirdies</a>（CC0）。</p>`,[['返回',panelBack],...(chapterReplay?[]:[['下载旅程存档',exportSave],['从文件恢复旅程',chooseSaveFile],...(hasImportBackup()?[['撤回上次导入',restorePreviousImport]]:[])]),['导出内测记录',exportRecord],['修改参赛姓名',()=>editPlayerName(settings)],['填写试玩反馈',feedback]]);
  $('campaign-quality').value=state.settings.quality;
  for(const [id,key]of [['campaign-sensitivity','sensitivity'],['campaign-volume','volume'],['campaign-music-volume','musicVolume'],['campaign-rain-volume','ambienceVolume'],['campaign-quality','quality'],['campaign-reduced','reducedMotion'],['campaign-dialogue-sound','dialogueSound']])$(id).oninput=e=>{state.settings[key]=e.target.type==='checkbox'?e.target.checked:e.target.type==='range'?+e.target.value:e.target.value;if(key==='ambienceVolume')JourneyAtmosphere.stopPreview();applySettings();scene?.sync();save();};
  $('campaign-audio').onclick=()=>{$('sound').click();$('campaign-audio').textContent=$('sound').querySelector('span').textContent;};
  $('campaign-rain').value=state.settings.rainChoice||'auto';
  $('campaign-rain').onchange=e=>{state.settings.rainChoice=e.target.value;JourneyAtmosphere.stopPreview();atmosphere();save();};
  $('campaign-rain-preview').onclick=async()=>{
   if(JourneyAtmosphere.snapshot().preview||JourneyAtmosphere.snapshot().previewLoading){JourneyAtmosphere.stopPreview();return;}
   const id=state.settings.rainChoice==='auto'||!state.settings.rainChoice?(state.frame==='mountain-rain'?'leaves':'courtyard'):state.settings.rainChoice;
   await JourneyAtmosphere.previewRain(id);
  };
  updateRainPreview();

 }
 function feedback(){panel('这段旅程玩起来怎样？','<div class="campaign-feedback"><label>哪里没看懂，或不知道下一步做什么？<textarea id="feedback-confusing" maxlength="1000"></textarea></label><label>拖拽、拼装或画面有什么感受？<textarea id="feedback-feeling" maxlength="1000"></textarea></label><label>这是第一次玩？大约用了多久？<textarea id="feedback-minutes" maxlength="1000"></textarea></label></div>',[['保存到本机',()=>{for(const key of ['confusing','feeling','minutes'])state.feedback[key]=$('feedback-'+key).value;save();settings();},true]]);for(const key of ['confusing','feeling','minutes'])$('feedback-'+key).value=state.feedback[key]||'';}
 const appliedImports=new WeakSet();
 function hasImportBackup(){try{return !!localStorage.getItem(KEY+'-backup-before-import');}catch{return false;}}
 function restorePreviousImport(){
  if(chapterReplay)return;
  try{
   const raw=localStorage.getItem(KEY+'-backup-before-import'),result=CampaignSaveTransfer.inspect(JSON.stringify({format:'sun-jian-campaign-save',version:1,save:JSON.parse(raw)}),D,P,E,C);
   panel('回到导入前的旅程？','<p>备份位置：<strong>'+result.summary.place+'</strong></p><p>确认后恢复上一次导入之前的进度，当前旅程也会保存为备份。</p>',[['取消',settings],['恢复导入前备份',()=>applyImportedSave(result.save),true]]);
  }catch{panel('备份暂时无法恢复','<p>当前旅程没有改变。可以选择之前下载的存档文件。</p>',[['返回设置',settings,true]]);}
 }
 function chooseSaveFile(){
  if(chapterReplay)return;
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;root.append(input);
  input.oncancel=()=>input.remove();
  input.onchange=async()=>{
   const file=input.files?.[0];input.remove();if(!file)return;
   try{
    if(file.size>CampaignSaveTransfer.MAX_BYTES)throw Error('文件超过 4 MB，请选择游戏下载的旅程存档。');
    const result=CampaignSaveTransfer.inspect(await file.text(),D,P,E,C),s=result.summary;
    if(chapterReplay)return;
    panel('恢复这份旅程？','<p>位置：<strong>'+s.place+'</strong></p><p>小屋学习 '+s.lessons+' / 4 · 取料 '+s.required+' / 3 · 自选练习 '+s.optional+' / 5</p><p>'+(s.awarded?'正式比赛已完成，第三名记录保留。':'将从已验证的当前步骤继续。')+'</p>'+(s.corrected?'<p class="muted">部分记录与合法步骤不符，将恢复到最近的有效进度。</p>':'')+'<p class="muted">确认后替换本机旅程，并保留导入前备份。</p>',[['取消，保留当前旅程',settings],['确认恢复',()=>applyImportedSave(result.save),true]],'本地文件 · 尚未修改当前旅程');
   }catch(error){panel('存档没有导入','<p id="campaign-import-error"></p>',[['返回设置',settings,true]]);$('campaign-import-error').textContent=error.message;}
  };input.click();
 }
 function applyImportedSave(imported){
  if(chapterReplay||appliedImports.has(imported))return;
  const next={...imported,settings:{...state.settings}};
  try{
   const previous=localStorage.getItem(KEY);if(previous!==null)localStorage.setItem(KEY+'-backup-before-import',previous);
   localStorage.setItem(KEY,JSON.stringify(next));
  }catch{panel('暂时无法恢复','<p>浏览器没有足够的本机存储空间，当前旅程保持原样。可以先下载当前存档。</p>',[['返回设置',settings,true]]);return;}
  appliedImports.add(imported);clearTimeout(toastTimer);lastDialogueLine=null;JourneyAtmosphere.resetMusic();scene?.dispose();scene=null;current=null;state=next;
  awardReplay=null;toneLegacyRaw=posterLegacyRaw=soloLegacyRaw=museumLegacyRaw=workshopLegacyRaw=familyLegacyRaw=awardsLegacyRaw=emotionLegacyRaw=fullLegacyRaw=experienceLegacyRaw=objectLegacyRaw=dialogueLegacyRaw=designLegacyRaw=continuationLegacyRaw=narrativeLegacyRaw=openingLegacyRaw=legacyRaw=benchLegacyRaw=null;
  applySettings();enter();notice('旅程已恢复。导入前的本机存档也已备份。');
 }
 function exportSave(){
  if(chapterReplay)return;
  capture();save();const backup={format:'sun-jian-campaign-save',version:1,gameVersion:'0.15.5',savedAt:new Date().toISOString(),save:state};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='榫间-旅程存档.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function updateRainPreview(){
  const b=$('campaign-rain-preview'),label=$('campaign-rain-status');if(!b||!label)return;
  const audio=JourneyAtmosphere.snapshot();b.textContent=audio.preview||audio.previewLoading?'停止试听':'试听 15 秒';
  label.textContent=audio.previewLoading?'正在载入本地实录…':audio.preview?'试听中 · 只播放所选雨声':audio.error?'音轨暂未载入，请重试试听。':'作者 CC0 实录 · 院落 xkeril／树叶 SamsterBirdies';
 }
 window.addEventListener('journey:rain-preview',updateRainPreview);
 function exportRecord(){capture();const data={game:'榫间',version:'0.15.5',chapterReplay,continuation:state.continuation,exportedAt:new Date().toISOString(),phase:state.phase,visiblePlayMs:state.playMs,completedTasks:state.done,caveCompleted:state.cave.completed,fieldNotes:state.fieldNotes,records:state.records,currentRuns:state.runs,roomObjects:state.roomObjects,feedback:state.feedback};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='榫间-本机内测记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('campaign-stand').onclick=()=>{scene?.sit?.(false);$('campaign-stand').hidden=true;notice('起身了，可以继续看看。');};
 $('campaign-opening-skip').onclick=$('campaign-opening-skip-world').onclick=skipMountain;
 $('campaign-next-story').onclick=startContinuation;$('campaign-continue').onclick=enter;$('campaign-new').onclick=startNew;$('campaign-practice').onclick=practiceLibrary;$('campaign-settings').onclick=settings;
 $('campaign-travel-notes').onclick=notes;$('campaign-chapter-select').onclick=selectChapters;$('campaign-end-chapter').onclick=endChapter;
 $('campaign-dev-toggle').onclick=toggleDeveloper;
 $('campaign-dev-entry').onclick=$('campaign-dev-world').onclick=$('campaign-dev-puzzle').onclick=selectDeveloper;
 $('campaign-about').onclick=()=>panel('关于《榫间》','<p>以传统木作榫卯为核心的叙事解谜游戏。跟周伯学看接点，亲手修合一条还能用的长凳，把拆修顺序留给下一个人。旅途里的「非遗手记」也收录了现实中的传习案例。</p><p>人物、村落和省级木作交流赛均为虚构。剧情中的第三名及奖金是故事情节，与现实华灿奖评审和获奖无关。</p><p>接头和组合家具的灵感来自日常生活中观察的榫卯结构。人物与场景图采用AI辅助绘制，程序与文案制作采用AI辅助整合；雨声来源及声音设置可在设置中查看。</p>',[['返回主菜单',menu,true]],'0.15.5 · 参赛候选版');
 $('campaign-sketch').onclick=$('campaign-puzzle-sketch').onclick=showSketch;$('campaign-notes').onclick=notes;$('campaign-pause').onclick=menu;$('campaign-next').onclick=e=>{if(e.detail<2)advanceTalk();};$('campaign-skip').onclick=e=>{if(e.detail<2)advanceTalk(true);};$('campaign-collect').onclick=materialsMemo;
 $('campaign-previous').onclick=e=>{if(e.detail>1||!state.talk||state.talk.line===0)return;state.talk.line--;showTalk('campaign-previous');};
 $('campaign-put').onclick=putBack;$('campaign-undo').onclick=()=>{$('undo').click();updatePuzzle();};$('campaign-reset').onclick=()=>{$('restart').click();updatePuzzle();};
 $('campaign-retry').onclick=()=>{scene?.dispose();scene=null;worldKind=null;if(createScene())setModal(null);};$('campaign-error-back').onclick=practiceLibrary;
 window.addEventListener('joint:story-change',e=>{if(active&&view==='puzzle'&&e.detail.run.level===current?.level){capture();updatePuzzle();}});
 window.addEventListener('joint:story-complete',e=>{if(active&&view==='puzzle'&&e.detail.run.level===current?.level)completed();});
 const entry=document.createElement('button');entry.id='open-campaign';entry.className='header-button';entry.textContent='完整旅程 ↗';$('open-story').before(entry);entry.onclick=menu;

 root.addEventListener('error',e=>{
  const img=e.target;
  if(img.tagName!=='IMG'||img.closest('.illustrated-stage, .painted-expression, .companion-portrait, .workshop-painting, #campaign-museum'))return;
  const source=img.getAttribute('src')?.split('?')[0];
  if(!source)return;
  img.hidden=true;
  if(img.nextElementSibling?.classList.contains('campaign-art-retry'))return;
  const retry=document.createElement('button');
  retry.className='campaign-art-retry';
  retry.textContent=img.closest('.workshop-models, .heritage-workshop-note')?'重试结构图':'重试人物图';
  retry.onclick=()=>{retry.remove();img.hidden=false;img.src=source+'?retry='+Date.now();};
  img.after(retry);
 },true);
 document.addEventListener('keydown',e=>{
  if(!active)return;
  // A held activation key must not click the new button after a line or scene changes.
  // Keep normal repeated typing available in the feedback fields.
  if(e.repeat){if(modal==='campaign-interlude'||['Enter',' '].includes(e.key)&&e.target.closest?.('button'))e.preventDefault();return;}
  if(document.querySelector('dialog[open]'))return;
  if(e.code==='KeyH'&&!modal&&museumVisible()){museumView.reveal(true);return;}
  if(view==='world'&&!modal&&scene?.snapshot().sitting&&e.code==='KeyE'){e.preventDefault();e.stopImmediatePropagation();$('campaign-stand').click();return;}
  if(e.key==='Escape'){
   e.preventDefault();
   if(view==='puzzle'){if(!G.cancelInteraction())putBack();return;}
   if(museumVisible()&&!modal&&state.continuation.museum.visit.exhibit){backToMuseum();return;}
   if(museumVisible()&&modal==='campaign-panel'){setModal(null);museumView.focus(state.continuation.museum.last);return;}
   if(view==='world'&&!modal&&scene?.snapshot().fieldId){scene.closeField();return;}
   if(modal==='campaign-menu'){if(scene)enter();return;}
   if(modal==='campaign-conversation'||modal==='campaign-interlude'){menu();return;}
   if(modal){if(state.continuation.active){menu();return;}if(modal==='campaign-panel')panelBack();else setModal(null);return;}
   menu();
  }
  if(modal&&e.key==='Tab'){
   const controls=[...$(modal).querySelectorAll('button:not(:disabled),input,select,textarea,details > summary')].filter(el=>{
    const container=el.matches('summary')?el.parentElement.parentElement:el;
    return el.getClientRects().length&&!container.closest('details:not([open])');
   });
   const current=controls.indexOf(document.activeElement);
   const next=current<0?(e.shiftKey?controls.length-1:0):(current+(e.shiftKey?-1:1)+controls.length)%controls.length;
   e.preventDefault();controls[next]?.focus();
  }
  if(modal==='campaign-conversation'&&['ArrowDown','ArrowUp'].includes(e.key)){const options=[...$('campaign-choices').querySelectorAll('button')];if(options.length){const i=options.indexOf(document.activeElement);e.preventDefault();options[(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();}}
 },true);
 function cancelPreview(){if(!active)return;if(view==='puzzle'){G.suspend();capture();if(!document.hidden&&!modal)G.resume();}save();}
 document.addEventListener('keyup',e=>{if(e.code==='KeyH')museumView.reveal(false);});
 window.addEventListener('blur',()=>museumView.reveal(false));
 document.addEventListener('visibilitychange',()=>{atmosphere();syncMuseum();});
 window.addEventListener('blur',cancelPreview);window.addEventListener('resize',cancelPreview);window.addEventListener('pagehide',()=>{if(active){capture();save();}});document.addEventListener('close',e=>{if(e.target!==completion&&view==='puzzle')offerCompletion();},true);
 document.addEventListener('visibilitychange',()=>{if(!active)return;if(document.hidden){cancelPreview();scene?.enable(false);}else if(view==='world'&&!modal&&!museumVisible()&&!document.querySelector('dialog[open]'))scene?.enable(true);else if(view==='puzzle'){G.resume();offerCompletion();}});
 setInterval(()=>{const now=performance.now(),dt=Math.min(1500,now-lastTick);lastTick=now;if(!active||document.hidden)return;contextControls();if(view==='world'&&(!modal||['campaign-conversation','campaign-interlude'].includes(modal))||view==='puzzle'&&!current?.practice)state.playMs+=dt;if(view==='puzzle')updatePuzzle();if(modal==='campaign-interlude')updateInterludeControls();if(now%5000<1000&&!current?.practice)save();},1000);
 window.CampaignJourney={snapshot:()=>JSON.parse(JSON.stringify({active,view,modal,chapterReplay,chapterUnlocked,reviewChapters,developerMode,current:current?.id||null,state,scene:scene?.snapshot()||{available:false}}))};
 if(query.has('journey'))enter();
 else if(!query.has('cave')&&!query.has('story')&&!query.has('practice')){
  menu();if(reviewChapters)selectChapters();
 }
})();



