(function(){
 'use strict';
 const D=CaveData,P=JointPuzzle,E=PuzzleExperience,G=JointGame,$=id=>document.getElementById(id),KEY='sun-jian-cave-v1';
 let state;try{state=D.restore(localStorage.getItem(KEY),P,E);}catch{state=D.fresh();}
 let active=false,view='world',scene=null,current=null,mode='dismantle',toastTimer=null,completeTimer=null,saveWarning=false;
 const root=document.createElement('section');root.id='cave-root';root.hidden=true;root.setAttribute('aria-label','静洞寻木');
 root.innerHTML=`
 <div id="cave-world"></div>
 <header class="cave-top"><div class="cave-brand">榫间 <small>静洞寻木</small></div><nav class="cave-actions"><button id="cave-look">鼠标观察</button><button id="cave-notebook">随行手记</button><button id="cave-sound">音效关</button><button id="cave-leave">返回自由练习 ↗</button></nav></header>
 <div class="cave-objective"><small id="cave-area"></small><h1 id="cave-heading"></h1><p id="cave-goal"></p></div>
 <div id="cave-reticle"></div><div id="cave-prompt" hidden></div><p id="cave-toast" hidden role="status"></p>
 <footer class="cave-bottom"><span><kbd>W A S D</kbd> 行走　鼠标观察 / 拖空白转向　<kbd>E</kbd> 查看接点　<kbd>Esc</kbd> 释放鼠标</span><span id="cave-progress"></span></footer>
 <div id="cave-intro" class="cave-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="cave-intro-title"><div class="cave-card"><img class="cave-portrait" decoding="async" data-src="assets/cave/traveler.png" alt="穿灰蓝外套、带着背包与纸本手记的年轻旅人"><div><small>旅途中的一段安静时间</small><h2 id="cave-intro-title">静洞寻木</h2><p>山路旁的岩洞里，留着村民过去使用的木门和储物架。另一侧有光，接点还完好。</p><p>走近看看。找到谁挡着谁，再让木头松开。</p><button class="cave-primary" id="cave-begin">走进洞里 →</button><p class="cave-muted">WASD 行走 · 鼠标观察 · E 查看<br>没有计时，也不用赶路。机关为原创组合设计。</p></div></div></div>
 <div id="cave-notes" class="cave-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="cave-notes-title"><div class="cave-card"><header class="cave-notes-heading"><div><small>随行手记 · 洞中速记</small><h2 id="cave-notes-title">先看清接点，再动手。</h2><p id="cave-traveler-note"></p></div><img class="cave-portrait cave-writing-portrait" decoding="async" data-src="assets/cave/traveler-notes.png" alt="旅人低头在随身纸本上记录观察"></header><div class="cave-note-list" id="cave-note-list"></div><p class="cave-muted">木门、柜体与扣件为游戏原创组合，不对应真实历史设施。已开放的通路不会因重练关闭。</p><footer class="cave-notes-footer"><button id="cave-notes-close">收好手记</button></footer></div></div>
 <div id="cave-end" class="cave-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="cave-end-title"><div class="cave-card"><img class="cave-portrait cave-ending-portrait" decoding="async" data-src="assets/cave/traveler-end.png" alt="旅人收好手记，轻扶背包肩带，望向洞外的光"><div><small>八处接点 · 一段旅途</small><h2 id="cave-end-title">出口有风。</h2><p>最后一道木屏靠向墙边。洞外的风吹过来，我把手记收好，又回头看了一眼。</p><p>刚进来时只想把木头拔出来。现在，会先看看它和谁接在一起。</p><div class="cave-card-actions"><button class="cave-primary" id="cave-stay">回洞里看看</button><button id="cave-end-practice">自由练习</button></div></div></div></div>
 <div id="cave-error" class="cave-overlay" hidden role="alert"><div class="cave-card" style="display:block"><h2>三维场景暂时无法打开</h2><p>静洞寻木需要浏览器支持 WebGL。可以开启硬件加速后重试，或返回自由练习使用方向操作。</p><button id="cave-retry">重试加载</button> <button id="cave-error-back">返回自由练习</button></div></div>`;
 document.body.append(root);
 const bar=document.createElement('div');bar.id='cave-puzzle-bar';bar.hidden=true;
 bar.innerHTML='<div><strong id="cave-puzzle-title"></strong><span id="cave-puzzle-status" role="status"></span></div><div id="cave-puzzle-actions"><button id="cave-mode">练习合回</button><button id="cave-undo">↶ 撤销一步</button><button id="cave-reset">重置本次</button><button id="cave-put">放回洞中 →</button></div>';
 document.body.append(bar);
 const recovery=document.createElement('p');recovery.id='cave-recovery';recovery.hidden=true;$('selected-note').after(recovery);
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{if(!saveWarning){saveWarning=true;notice('本机存储暂不可用，本次仍能游玩；关闭页面后可能无法续玩。');}}}
 function notice(text){clearTimeout(toastTimer);$('cave-toast').textContent=text;$('cave-toast').hidden=false;toastTimer=setTimeout(()=>$('cave-toast').hidden=true,5000);}
 function label(id,text){const el=$(id);if(el.textContent!==text)el.textContent=text;}
 function render(){
  const next=D.nodes[state.completed.length],area=Math.min(3,Math.max(0,Math.floor((-state.position[2]+2)/18)));
  label('cave-area',D.areas[area]);label('cave-heading',next?next.short:'出口有风');
  label('cave-goal',next?next.goal:'八处接点已经解开。继续走向光里，或回头再看看。');
  label('cave-progress',`${state.completed.length} / 8 接点 · 仅保存在本机`);
  label('cave-sound',$('sound').querySelector('span').textContent);
 }
 function overlay(id){
  for(const key of ['cave-intro','cave-notes','cave-end'])$(key).hidden=key!==id;
  scene?.enable(!id&&view==='world'&&active);
  if(id){$(id).querySelectorAll('img[data-src]').forEach(img=>{if(!img.hasAttribute('src'))img.src=img.dataset.src;});$(id).querySelector('button')?.focus();}
 }
 function makeScene(){
  if(scene)return true;
  try{if(!window.THREE)throw Error('WebGL unavailable');scene=CaveScene.create($('cave-world'),state,{
   interact:openPuzzle,save,move:render,notice,
   target:t=>{const prompt=$('cave-prompt'),hidden=!t||view!=='world';if(prompt.hidden!==hidden)prompt.hidden=hidden;if(t){const n=D.nodes.find(n=>n.id===t.id),i=D.nodes.indexOf(n),hint=i>state.completed.length?'先看看前面的接点':'E / 点击 · '+(state.completed.includes(n.id)?'再看一遍':'查看接点');if(prompt.dataset.target!==t.id||prompt.dataset.hint!==hint){prompt.dataset.target=t.id;prompt.dataset.hint=hint;prompt.textContent=n.short;const sub=document.createElement('small');sub.textContent=hint;prompt.append(sub);}}}
  });$('cave-error').hidden=true;return true;}catch(e){$('cave-error').hidden=false;console.warn('Cave renderer unavailable',e.message);return false;}
 }
 function enter(){
  if(active)return;
  if(window.Journey?.snapshot().inStory)$('story-exit').click();
  G.enterStory();active=true;root.hidden=false;document.body.classList.add('cave-active');
  const url=new URL(location.href);url.search='?cave=1';history.replaceState(null,'',url);
  if(!makeScene())return;
  render();if(!state.seenIntro)overlay('cave-intro');else overlay(null);
 }
 function leave(){
  if(!active)return;putBack(false);active=false;scene?.enable(false);root.hidden=true;bar.hidden=true;recovery.hidden=true;
  document.body.classList.remove('cave-active','cave-puzzle');G.returnPractice();save();
  const url=new URL(location.href);url.search='?practice=1';history.replaceState(null,'',url);$('open-cave').focus();
 }
 function key(){return current?.id+':'+mode;}
 function capture(){
  if(!current||view!=='puzzle')return;const run=G.getRun();
  if(run.level===current.level&&run.mode===mode)state.runs[key()]=run;save();
 }
 function loadPuzzle(){
  view='puzzle';bar.hidden=false;document.body.classList.add('cave-puzzle');
  const run=state.runs[key()];
  G.openStoryPuzzle({taskId:'study:cave:'+current.id,levelId:current.level,mode,objective:mode==='assemble'?'观察接缝，试着合回；若提前锁住，可以撤销一步。':current.goal,run});
  $('cave-puzzle-title').textContent=current.title+(mode==='assemble'?' · 合回':'');
  $('cave-mode').hidden=!state.completed.includes(current.id);$('cave-mode').textContent=mode==='assemble'?'练习拆开':'练习合回';
  $('precise-controls').open=mode==='assemble';requestAnimationFrame(()=>{G.resize();G.resume();updatePuzzle();$('cave-put').focus();});
 }
 function openPuzzle(id){
  if(!active||view!=='world'||!$('cave-intro').hidden||!$('cave-notes').hidden||!$('cave-end').hidden)return;
  const n=D.nodes.find(n=>n.id===id);if(!n)return;
  if(D.nodes.indexOf(n)>state.completed.length){notice('前面的接点还没看完，沿石板路回去看看。');return;}
  if(state.completed.includes(n.id)&&E.restoreSession(JSON.stringify(state.runs[n.id+':dismantle']),P)?.completed)delete state.runs[n.id+':dismantle'];
  current=n;mode='dismantle';view='approach';scene.approach(id,loadPuzzle);
 }
 function updatePuzzle(){
  if(view!=='puzzle'||!current)return;const s=SunJian.snapshot(),count=P.LEVELS.find(l=>l.id===current.level).pieces.filter(p=>!p.fixed).length;
  $('cave-puzzle-status').textContent=(mode==='assemble'?'已归位 ':'已取下 ')+(mode==='assemble'?count-s.removed.length:s.removed.length)+' / '+count;
  $('cave-undo').disabled=!s.history.length||s.busy;
  const level=P.LEVELS.find(l=>l.id===current.level);
  const locked=mode==='assemble'&&s.removed.length>0&&!P.availableInsertions(level,s.removed).length;
  recovery.hidden=!locked;recovery.textContent=locked?'已有木件提前锁住了接点。点上方“撤销一步”，取回刚装入的木件，再安排顺序。':'';
  if(locked)$('cave-puzzle-status').textContent+=' · 可撤销修正';
 }
 function putBack(resume=true){
  clearTimeout(completeTimer);completeTimer=null;capture();
  if(view==='puzzle')G.suspend();scene?.cancel();bar.hidden=true;recovery.hidden=true;document.body.classList.remove('cave-puzzle');
  view='world';current=null;scene?.sync();if(resume&&active){scene?.enable(true);render();}save();
 }
 function complete(){
  if(!current||mode!=='dismantle'||state.completed.includes(current.id))return;
  const id=current.id,valid=E.restoreSession(JSON.stringify(G.getRun()),P);
  if(!valid?.completed||D.nodes[state.completed.length]?.id!==id)return;
  state.completed.push(id);save();scene?.sync();render();
  // The player controls when to leave the close-up; a second click can never advance another node.
  $('cave-puzzle-status').textContent='接点已松开 · 放回洞中查看变化';$('cave-mode').hidden=false;
 }
 window.addEventListener('joint:story-change',e=>{
  if(!active||view!=='puzzle'||e.detail.taskId!=='study:cave:'+current?.id)return;
  state.runs[key()]=e.detail.run;save();updatePuzzle();
 });
 window.addEventListener('joint:story-complete',e=>{if(active&&view==='puzzle'&&e.detail.taskId==='study:cave:'+current?.id){capture();complete();updatePuzzle();}});
 $('cave-put').onclick=()=>{const n=current,done=n&&state.completed.includes(n.id);putBack();if(done)notice(n.after);};
 $('cave-undo').onclick=()=>{$('undo').click();updatePuzzle();};
 $('cave-reset').onclick=()=>{$('restart').click();updatePuzzle();};
 $('cave-mode').onclick=()=>{capture();mode=mode==='assemble'?'dismantle':'assemble';loadPuzzle();};
 $('cave-begin').onclick=()=>{state.seenIntro=true;save();overlay(null);notice('WASD 行走，点击空白启用鼠标观察；也可以按住空白拖动。');};
 $('cave-look').onclick=()=>scene?.lock();$('cave-sound').onclick=()=>{$('sound').click();render();};
 $('cave-leave').onclick=leave;$('cave-error-back').onclick=leave;$('cave-end-practice').onclick=leave;
 $('cave-retry').onclick=()=>{if(makeScene()){render();overlay(state.seenIntro?null:'cave-intro');}};
 $('cave-notebook').onclick=()=>{
  const count=state.completed.length;
  $('cave-traveler-note').textContent=count===0?'先留几页空白。等看清了，再把发现记下来。':count<4?'画下接点，比记住刚才往哪边拔更管用。':count<8?'有几处看着相似，挡住木件的地方却不一样。慢慢看。':'八处接点都记下了。下次遇见陌生的木构，我想自己先试试看。';
  $('cave-note-list').replaceChildren(...D.nodes.map(n=>{const a=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=(state.completed.includes(n.id)?'✓ ':'○ ')+n.short;p.textContent=state.completed.includes(n.id)?P.LEVELS.find(l=>l.id===n.level).insight:'还没有亲手拆开。';a.append(h,p);return a;}));overlay('cave-notes');
 };
 $('cave-notes-close').onclick=()=>overlay(null);$('cave-stay').onclick=()=>overlay(null);
 const entry=document.createElement('button');entry.id='open-cave';entry.className='header-button';entry.textContent='静洞寻木 ↗';$('open-story').before(entry);entry.onclick=enter;
 const welcome=document.createElement('button');welcome.className='quiet-button';welcome.id='start-cave';welcome.textContent='静洞寻木 · 三维探索 →';$('welcome-dialog').querySelector('.welcome-actions').append(welcome);welcome.onclick=enter;
 document.addEventListener('keydown',e=>{
  if(!active||e.repeat)return;
  if(e.key==='Escape'){
   if(document.querySelector('dialog[open]'))return;
   if(view==='puzzle'||view==='approach'){e.preventDefault();putBack();}
   else if(!$('cave-notes').hidden||!$('cave-end').hidden)overlay(null);
  }
  const modal=root.querySelector('.cave-overlay:not([hidden])');
  if(modal&&e.key==='Tab'){const buttons=[...modal.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
 },true);
 function cancelUncommitted(){if(!active)return;if(view==='approach')putBack();else if(view==='puzzle'){G.suspend();capture();if(!document.hidden)G.resume();}}
 window.addEventListener('blur',cancelUncommitted);window.addEventListener('resize',cancelUncommitted);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelUncommitted();scene?.enable(false);}else if(active){if(view==='world'&&!root.querySelector('.cave-overlay:not([hidden])'))scene?.enable(true);if(view==='puzzle')G.resume();}});
 window.addEventListener('pagehide',()=>{if(active){capture();save();}});
 setInterval(()=>{if(!active)return;if(view==='puzzle')updatePuzzle();if(view==='world'&&state.completed.length===8&&state.position[2]<-71&&!state.finished){state.finished=true;save();overlay('cave-end');}},300);
 root.querySelectorAll('.cave-portrait').forEach(img=>{
  const source=img.dataset.src;let retry=null;
  img.onerror=()=>{img.hidden=true;if(retry)return;retry=document.createElement('button');retry.className='cave-art-retry';retry.textContent='重试人物图';retry.setAttribute('aria-label','重试人物图');retry.onclick=()=>{retry.remove();retry=null;img.hidden=false;img.src=source+'?retry='+Date.now();};img.after(retry);};
  img.onload=()=>{img.hidden=false;retry?.remove();retry=null;};
  if(img.hasAttribute('src')&&img.complete&&!img.naturalWidth)img.onerror();
 });
 window.CaveJourney={snapshot:()=>JSON.parse(JSON.stringify({active,view,current:current?.id||null,mode,state,scene:scene?.snapshot()||{available:false}}))};
 if(new URLSearchParams(location.search).has('cave'))enter();
})();
