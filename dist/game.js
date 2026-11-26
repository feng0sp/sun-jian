/* 榫间 — a quiet interactive workbench. */
(function () {
  'use strict';
  const P=window.JointPuzzle, E=window.PuzzleExperience, $=id=>document.getElementById(id);
  const state={level:0,mode:'dismantle',experiment:false,experimentCleared:false,action:'extract',offsets:{},selected:null,removed:[],history:[],hint:0,started:Date.now(),completedAt:null,busy:false,xray:false,sound:false,animation:null,cleared:[],assembled:[]};
  let saved=null;try{saved=localStorage.getItem('sun-jian-v1');}catch{}Object.assign(state,E.migrate(saved,P));
  let guidedTakeback=null,drag,assemblyDrag,assemblyHand=null,assemblyPose=null,dragPreview=null,dragReturn=null,grabPoint=null,seatPulse=null,takeaways=[],hintView=null,demo=null,fitting=null,trial=null,lastTick=performance.now(),records=[],nudgedStates=new Set();
  try{const r=JSON.parse(localStorage.getItem('sun-jian-trials-v1')||'[]');if(Array.isArray(r))records=r.slice(-200);}catch{}
  let renderer,scene,camera,controls,assembly,axisScene,axisCamera,raycaster,ground,disc,ring,workmat,contactShadow,previewArrow,previewTip,previewRoute=null,flash=null,hovered=null,renderDirty=true;
  const markerNodes=new Map();let movementNoticeTimer=null;
  const axisCue=document.createElement('div');axisCue.id='drag-axis-cue';axisCue.hidden=true;axisCue.setAttribute('aria-hidden','true');$('viewport').append(axisCue);
  const entryCue=document.createElement('div');entryCue.id='entry-cue';entryCue.hidden=true;entryCue.setAttribute('aria-hidden','true');entryCue.innerHTML='<span id="entry-source"><i></i><b></b></span><span id="entry-seat"><i></i><b>待装位置</b></span>';$('viewport').append(entryCue);
  function dragText(text){const status=$('drag-status');if(status.textContent!==text)status.textContent=text;}
  function movementNotice(text){if(!renderer)return;clearTimeout(movementNoticeTimer);$('drag-status').hidden=false;$('drag-status').dataset.state='blocked';$('drag-status').style.setProperty('--pull',0);dragText(text);movementNoticeTimer=setTimeout(()=>{$('drag-status').hidden=true;movementNoticeTimer=null;},1800);}
  function showAxisCue({start,axes}){
    if(!axisCue.hidden)return;const rect=$('viewport').getBoundingClientRect(),colors=['#a36c4b','#5f7953','#5f7c98'];axisCue.style.left=(start[0]-rect.left)+'px';axisCue.style.top=(start[1]-rect.top)+'px';
    axisCue.replaceChildren(...axes.map((axis,index)=>{const length=Math.hypot(...axis),line=document.createElement('span');line.className='drag-axis-ray';line.style.setProperty('--axis-color',colors[index]);line.style.setProperty('--axis-angle',Math.atan2(axis[1],axis[0])+'rad');line.dataset.axis='XYZ'[index];if(length<12){line.classList.add('end-on');line.textContent='XYZ'[index]+' ⊙';}else{for(const sign of [-1,1]){const label=document.createElement('b');label.textContent='XYZ'[index]+(sign>0?'+':'−');label.style.left=(sign>0?'100%':'0');line.append(label);}}return line;}));axisCue.hidden=false;
  }
  const models=new Map(),textures=new Map(),surfaceCache=new Map();
  let reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let audioContext=null,audioMaster=null,volume=.65,rubbing=null,rubNoise=null,storyContext=null,practiceBackup=null,gameVisible=true;
  function audioOutput(){if(!audioMaster){audioMaster=audioContext.createGain();audioMaster.gain.value=volume;audioMaster.connect(audioContext.destination);}return audioMaster;}
  const staging=document.createElement('div');staging.id='assembly-staging';staging.hidden=true;
  staging.innerHTML='<p>拿起散件，选择从哪一侧靠近，再拖入接点。</p><div>'+P.DIRECTIONS.map(d=>'<button type="button" data-approach="'+d.id+'">从 '+P.DIRECTIONS.find(x=>x.vector.every((v,i)=>v===-d.vector[i])).axis+' 侧</button>').join('')+'</div>';
  $('piece-list').after(staging);
  const guidePanel=document.createElement('section');guidePanel.id='assembly-guide';guidePanel.hidden=true;guidePanel.setAttribute('aria-live','polite');guidePanel.innerHTML='<strong></strong><p></p>';$('piece-list').before(guidePanel);
  const takebackButton=document.createElement('button');takebackButton.id='guided-takeback';takebackButton.className='quiet-button';takebackButton.hidden=true;takebackButton.onclick=takeBackPin;guidePanel.after(takebackButton);
  staging.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!state.selected||!assembling())return;assemblyDrag?.cancel();stagePart(state.selected,b.dataset.approach);updateMaterials();});
  function stagePart(id,direction){const part=level().pieces.find(p=>p.id===id);if(!part||!available(id)||!assembling())return;const a=woodAxis(part);direction=guide()?AssemblyGuide.direction(guide(),id,state.removed):(direction||['xn','yn','zn'][a]);assemblyHand={id,direction,range:P.insertionRange(level(),state.removed,id,direction)};assemblyPose=null;staging.hidden=false;staging.classList.toggle('guided',!!guide());staging.querySelector('p').textContent=guide()?AssemblyGuide.step(guide(),state.removed)?.instruction||'木件都已合好。':'拿起散件，选择从哪一侧靠近，再拖入接点。';staging.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.approach===direction)));}
  const runData=()=>({version:1,level:level().id,mode:state.mode,history:JSON.parse(JSON.stringify(state.history)),action:state.action,...(guide()?.id===AssemblyGuide.bench.id?{guideRevision:1}:guide()?{guideId:guide().id}:{}),trial:JSON.parse(JSON.stringify(trial))});
  function storyEvent(type){window.dispatchEvent(new CustomEvent('joint:story-'+type,{detail:{taskId:storyContext?.taskId,run:runData()}}));}
  const woodTones=new Set();
  function trackWoodTone(source,gain){const voice={source,gain};woodTones.add(voice);source.onended=()=>{if(woodTones.delete(voice)){source.disconnect();gain.disconnect();}};}
  function stopWoodTones(){for(const voice of woodTones){voice.source.stop();voice.source.disconnect();voice.gain.disconnect();woodTones.delete(voice);}}
  function sound(kind){
    if(!state.sound||document.hidden)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      audioContext ||= new Ctx();if(audioContext.state==='suspended')audioContext.resume();
      const now=audioContext.currentTime;
      if(['seat','blocked'].includes(kind)){const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='triangle';o.frequency.setValueAtTime(kind==='seat'?260:145,now);o.frequency.exponentialRampToValueAtTime(85,now+.075);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(kind==='seat'?.042:.026,now+.002);g.gain.exponentialRampToValueAtTime(.0001,now+.09);o.connect(g);g.connect(audioOutput());trackWoodTone(o,g);o.start(now);o.stop(now+.1);return;}
      if(kind==='release'){[195,390].forEach((freq,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(freq*.55,now+.055);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(i?.014:.05,now+.002);g.gain.exponentialRampToValueAtTime(.0001,now+.085);o.connect(g);g.connect(audioOutput());trackWoodTone(o,g);o.start(now);o.stop(now+.09);});return;}
      const notes=kind==='win'?[294,392,440]:kind==='blocked'?[145]:[330,247];
      notes.forEach((freq,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.setValueAtTime(freq,now+i*.105);g.gain.setValueAtTime(0,now+i*.105);g.gain.linearRampToValueAtTime(.035,now+i*.105+.01);g.gain.exponentialRampToValueAtTime(.0001,now+i*.105+.22);o.connect(g);g.connect(audioOutput());trackWoodTone(o,g);o.start(now+i*.105);o.stop(now+i*.105+.23);});
    }catch{}
  }
  function stopRubbing(){if(!rubbing)return;try{rubbing.source.stop();rubbing.source.disconnect();rubbing.filter.disconnect();rubbing.gain.disconnect();}catch{}rubbing=null;}
  function rub(distance,blocked){
    if(!state.sound||document.hidden)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;audioContext ||= new Ctx();if(audioContext.state==='suspended')audioContext.resume();const now=audioContext.currentTime;
      if(!rubbing){if(!rubNoise){rubNoise=audioContext.createBuffer(1,Math.round(audioContext.sampleRate*.35),audioContext.sampleRate);const channel=rubNoise.getChannelData(0);let previous=0;for(let i=0;i<channel.length;i++){previous=(previous+(Math.random()*2-1)*.08)/1.08;channel[i]=previous;}}
        const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=rubNoise;source.loop=true;filter.type='bandpass';filter.frequency.value=760;filter.Q.value=.55;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(audioOutput());source.start();rubbing={source,filter,gain,distance,time:now};
      }
      const speed=Math.abs(distance-rubbing.distance)/Math.max(.016,now-rubbing.time),volume=blocked?0:Math.min(.035,speed*.009);rubbing.gain.gain.cancelScheduledValues(now);rubbing.gain.gain.setTargetAtTime(volume,now,.012);rubbing.gain.gain.setTargetAtTime(0,now+.045,.025);rubbing.distance=distance;rubbing.time=now;
    }catch{stopRubbing();}
  }
  const level=()=>state.experiment?P.EXPERIMENT:P.LEVELS[state.level];
  const assembling=()=>state.mode==='assemble';
  const guide=()=>storyContext?.assemblyGuide;
  const movable=()=>guide()?AssemblyGuide.editable(level(),guide()):level().pieces.filter(p=>!p.fixed);
  const guideFloor=()=>guide()&&assembling()?guide().prefitted.length:0;
  const guideAllows=id=>!guide()||AssemblyGuide.allowed(guide(),state.removed,id,state.mode);
  const available=id=>guideAllows(id)&&(assembling()?state.removed.includes(id):!state.removed.includes(id));
  function persist(){if(storyContext)return;try{localStorage.setItem('sun-jian-v1',JSON.stringify(Object.fromEntries(['cleared','assembled','tutorialCleared','tutorialAssembled','tutorialStatus','sound','experimentCleared'].map(k=>[k,state[k]]))));}catch{}}
  function saveTrials(){if(storyContext)return;try{localStorage.setItem('sun-jian-trials-v1',JSON.stringify(records.slice(-200)));}catch{}}
  function saveSession(){if(!trial)return;if(storyContext){if(storyContext.taskId)storyEvent('change');return;}try{localStorage.setItem('sun-jian-session-v1',JSON.stringify({version:1,level:level().id,mode:state.mode,history:state.history,action:state.action,trial}));$('local-save').textContent='进度保存在本机 · 随时回来接着玩';}catch{$('local-save').textContent='本次临时游玩 · 当前浏览器无法保存进度';}}
  function positionKey(){return JSON.stringify([state.removed.slice().sort(),Object.entries(state.offsets).sort()]);}
  function tick(){const now=performance.now();if(trial)E.advance(trial,Math.max(0,now-lastTick),gameVisible&&!document.hidden&&!document.querySelector('dialog[open]'));lastTick=now;if(trial&&E.shouldNudge(trial)){trial.nudged=true;nudgedStates.add(positionKey());$('help-nudge').hidden=false;}updateTimer();}
  function progressChanged(){tick();closeHint();state.hint=0;$('help-nudge').hidden=true;if(trial){E.success(trial);trial.nudged=nudgedStates.has(positionKey());}updateGoal();}
  function blockedAttempt(input,blocker,audible=true){E.action(trial,input);trial.blocked++;trial.blockedSinceProgress++;if(blocker)flash={id:blocker,until:performance.now()+1100};tick();renderDirty=true;if(audible)sound('blocked');if(storyContext)storyEvent('blocked');}
  function updateGoal(){const prefix=document.createElement('span');prefix.textContent=level().category==='tutorial'?'动手试试':'观察目标';$('goal').replaceChildren(prefix,document.createTextNode(storyContext?.objective||(assembling()?'观察各件的接点，找出不会提前锁住结构的归位方式。':P.observation(level(),state.removed))));}
  function completedRecords(l){return l.category==='tutorial'?(assembling()?state.tutorialAssembled:state.tutorialCleared):(assembling()?state.assembled:state.cleared);}

  function setFeedback(text,kind='neutral'){$('feedback-text').textContent=text;$('feedback').className='feedback '+kind;$('feedback').querySelector('.feedback-mark').textContent=kind==='blocked'?'×':kind==='success'?'✓':'○';}
  function renderChapters(){
    function chapter(l){const i=P.LEVELS.indexOf(l),completed=completedRecords(l).includes(l.id),active=state.level===i&&!state.experiment;
      const b=document.createElement('button');b.className='chapter'+(active?' active':'');b.setAttribute('aria-current',active?'step':'false');b.dataset.level=i;b.dataset.levelId=l.id;
      b.innerHTML=`<span class="chapter-index">${l.chapter}</span><span class="chapter-text"><strong>${l.title.split(' · ')[1]}</strong><small>${l.skill}</small></span><span class="chapter-check">${completed?'✓':'·'}</span>`;b.onclick=()=>loadLevel(i);return b;}
    $('tutorials').replaceChildren(...P.TUTORIALS.map(chapter));$('chapters').replaceChildren(...P.MAIN_LEVELS.map(chapter));
    const ex=document.createElement('button');ex.id='open-experiment';ex.className='chapter experimental'+(state.experiment?' active':'');ex.setAttribute('aria-current',state.experiment?'step':'false');ex.innerHTML=`<span class="chapter-index">EX</span><span class="chapter-text"><strong>借位实验</strong><small>独立实验 · ${state.experimentCleared?'1 / 1':'0 / 1'}</small></span><span class="chapter-check">${state.experimentCleared?'✓':'↗'}</span>`;ex.onclick=()=>{state.mode='dismantle';loadLevel(0,true);};$('chapters').append(ex);
    $('chapter-count').textContent=String((assembling()?state.assembled:state.cleared).length).padStart(2,'0')+' / 08';$('tutorial-count').textContent=(assembling()?state.tutorialAssembled:state.tutorialCleared).length+' / 2';
    $('collection-text').textContent=`主线 ${state.cleared.length}/8 · 入门 ${state.tutorialCleared.length}/2 · 实验 ${state.experimentCleared?1:0}/1`;
  }

  function renderPieces(){
    const pieces=movable(),focusedPiece=$('piece-list').contains(document.activeElement)?document.activeElement.dataset.piece:null;
    $('piece-list').classList.toggle('many',pieces.length>3);$('piece-list').classList.toggle('six',pieces.length===6);
    $('piece-list').replaceChildren(...pieces.map(p=>{
      const removed=state.removed.includes(p.id),locked=guide()&&(assembling()?removed:!removed)&&!guideAllows(p.id),selectable=available(p.id),selected=state.selected===p.id&&selectable;
      const button=document.createElement('button');button.className='piece'+(!selectable?' removed':'')+(assembling()&&removed?' pending':'')+(selected?' selected':'');button.dataset.piece=p.id;const chip=window.WoodFinish?WoodFinish.tone(WoodFinish.piece(level().id,p).color,p.fixed):p.color;button.style.setProperty('--piece-wood',chip);button.style.setProperty('--piece-ink',window.WoodFinish?WoodFinish.ink(chip):'#49331f');button.disabled=!selectable||state.busy;if(locked)button.title=AssemblyGuide.blockedText(guide(),state.removed,p.id,state.mode);button.setAttribute('aria-pressed',selected);button.innerHTML=`<span class="piece-symbol">${p.symbol}</span><span class="piece-name">${p.name}<small>构件 ${p.symbol}</small></span><span class="piece-status">${locked?(assembling()?(guide().lockedText||(guide().id===AssemblyGuide.bench.id?'装好座板后可用':'先装好榫头')):'先取下木销'):!selectable?(assembling()?'已归位':'已抽出'):selected?'已选中':assembling()?'待归位':'可动'}</span>`;button.onclick=()=>select(p.id);return button;
    }));
    if(focusedPiece){const button=[...$('piece-list').children].find(b=>b.dataset.piece===focusedPiece&&!b.disabled);button?.focus({preventScroll:true});}
    const pending=pieces.filter(p=>state.removed.includes(p.id)).length;
    $('removed-count').textContent=`${assembling()?pieces.length-pending:pending} / ${pieces.length}`;
    $('assembly-count').textContent=String(assembling()?pending:pieces.length-pending).padStart(2,'0')+(assembling()?' 个待装构件':' 个可动构件');
    const current=level().pieces.find(p=>p.id===state.selected);
    $('selected-note').textContent=current&&available(current.id)?(assembling()?(guide()?guidedEntryInstruction():'半透明木块标示待装位置。选择木块进入这个位置的移动方向。'):current.description):'先选木，再辨方向。';
    document.querySelectorAll('[data-direction]').forEach(b=>{b.disabled=!current||state.busy||!available(current.id)||!!(guide()&&assembling()&&b.dataset.direction!==AssemblyGuide.direction(guide(),current.id,state.removed));b.classList.remove('hinted');});
    $('undo').disabled=state.history.length<=guideFloor()||state.busy;
    $('hint').disabled=state.busy||(assembling()?state.removed.length===0:pending===pieces.length);
    syncQuickActions();
    const step=guide()?AssemblyGuide.step(guide(),state.removed,state.mode,level()):null;
    const recover=assembling()&&guide()?AssemblyGuide.takeback(level(),guide(),state.removed,state.history,P):null;
    takebackButton.hidden=!recover;takebackButton.disabled=state.busy;takebackButton.textContent=recover?'↶ 取回'+(level().pieces.find(p=>p.id===recover.piece)?.name||'穿销'):'';
    $('piece-list').classList.toggle('guided-lock-list',!!guide()?.hideBlockedGhosts);
    guidePanel.hidden=!guide();
    if(guide()){
      guidePanel.querySelector('strong').textContent=step?.label||(assembling()?'已经合好':'已经拆开');
      guidePanel.querySelector('p').textContent=recover&&state.removed.includes('tenon')?'穿销挡住了榫头。先点“取回穿销”，再合榫头。':step?.instruction||AssemblyGuide.completionText(guide(),state.mode);
    }
    document.body.classList.toggle('guided-assembly',!!guide());
    $('movement-choice').hidden=!state.experiment;$('action-extract').setAttribute('aria-pressed',state.action==='extract');$('action-step').setAttribute('aria-pressed',state.action==='step');$('action-extract').disabled=state.busy;$('action-step').disabled=state.busy;
    $('direction-instruction').textContent=assembling()?'沿一个方向装入':state.action==='step'?'沿一个方向借位':'沿一个方向抽出';
    window.dispatchEvent(new Event('joint:inspection-state'));
  }
  const hintHome=document.createComment('practice-hint-position');$('hint-box').before(hintHome);
  function syncQuickActions(){
    const spoken=storyContext&&storyContext.helpVoice!=='notebook'&&!storyContext.taskId?.startsWith('study:cave:');
    const box=$('hint-box'),actions=document.querySelector('.inspector-actions');if(storyContext){if(box.parentElement!==actions.parentElement)actions.before(box);}else if(box.previousSibling!==hintHome)hintHome.after(box);
    $('quick-undo').disabled=$('undo').disabled;$('quick-hint').disabled=$('hint').disabled;
    $('quick-hint').lastChild.textContent=(spoken?[' 问问周伯',' 再问一句',' 看看示范',' 重看示范']:[' 线索',' 解释约束',' 演示一步',' 重看演示'])[state.hint];
    $('quick-hint').setAttribute('aria-label',(spoken?['向周伯请教观察线索','请周伯解释接点约束','请周伯示范一个动作','再看周伯示范']:['查看观察线索','查看约束解释','演示一个动作','重新演示一个动作'])[state.hint]);
    $('hint').lastChild.textContent=spoken?' 问问周伯':' 看一眼提示';$('hint-speaker').hidden=!spoken;$('close-hint').textContent=spoken?'我再试试 ×':'收起提示 ×';$('hint-next').hidden=!storyContext;$('hint-next').disabled=$('hint').disabled;$('hint-next').textContent=state.hint<2?'再说具体一点 →':state.hint===2?(spoken?'您示范一次 →':'演示一步 →'):'再看一次 →';
  }
  function guidedEntryInstruction(){
    return renderer?'沿箭头把木件推入接点。':'在“精确操作”里按亮起的方向按钮归位。';
  }
  function select(id,fromDrag=false){
    if(state.busy)return;
    if(!available(id)){if(guide()?.hideBlockedGhosts&&state.removed.includes(id))setFeedback(AssemblyGuide.blockedText(guide(),state.removed,id),'blocked');return;}
    const part=level().pieces.find(p=>p.id===id);
    if(!part)return;
    if(part.fixed){setFeedback('这是固定的卯座。观察它的开口，选择列表中的可动构件。');return;}
    if(!fromDrag){drag?.cancel();assemblyDrag?.cancel();}
    closeHint();clearDirectionPreview();state.selected=id;
    if(assembling())stagePart(id);
    renderPieces();updateMaterials();
    if(guide()&&assembling()){defaultCamera(true);restoreAssemblyCue();}
    const instruction=assembling()
      ?(guide()?guidedEntryInstruction():'散件已拿起。可以沿来路拖入、换一侧靠近或使用精确操作。')
      :'沿接点拉出木件。短拉后松手，木件会回位。';
    setFeedback(`已选中${part.name}。${instruction}`);
  }
  function clearDirectionPreview(){
    if(previewArrow&&scene){scene.remove(previewArrow);previewArrow.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});previewArrow=null;}
    previewTip=null;previewRoute=null;entryCue.hidden=true;$('direction-preview').hidden=true;$('direction-preview').classList.remove('entry-caption');renderDirty=true;
  }
  function syncDirectionIcons(){
    if(!camera||!controls)return;camera.updateMatrixWorld();
    const origin=controls.target.clone(),a=origin.clone().project(camera),rect=$('viewport').getBoundingClientRect();
    document.querySelectorAll('[data-direction]').forEach(button=>{
      const d=P.DIRECTIONS.find(d=>d.id===button.dataset.direction),b=origin.clone().add(new THREE.Vector3(...d.vector)).project(camera),dx=(b.x-a.x)*rect.width,dy=-(b.y-a.y)*rect.height,foreshortened=Math.hypot(dx,dy)<16,icon=button.querySelector('.direction-icon');
      icon.textContent=foreshortened?(camera.position.clone().sub(origin).dot(new THREE.Vector3(...d.vector))>0?'⊙':'⊗'):'↑';icon.setAttribute('aria-hidden','true');icon.style.transform=foreshortened?'none':'rotate('+(Math.atan2(dy,dx)*180/Math.PI+90)+'deg)';icon.classList.toggle('foreshortened',foreshortened);button.dataset.screenAngle=foreshortened?'depth':String(Math.atan2(dy,dx));button.title=d.label+'（'+d.axis+'）'+(foreshortened?' · 接近视线方向，转动视角再确认':' · 箭头按当前视角显示');
    });
  }
  function restoreAssemblyCue(){
    if(!previewRoute&&guide()&&assemblyHand)showDirectionPreview(assemblyHand.direction);
  }
  function showDirectionPreview(id){
    if(!renderer||!state.selected||state.busy||!available(state.selected))return;
    clearDirectionPreview();const d=P.DIRECTIONS.find(d=>d.id===id),part=level().pieces.find(p=>p.id===state.selected);if(!d||!part)return;
    const bound=new THREE.Box3();part.shapes.forEach(s=>s.vertices.forEach(v=>bound.expandByPoint(new THREE.Vector3(...v))));const center=bound.getCenter(new THREE.Vector3()).add(new THREE.Vector3(...(state.offsets[part.id]||[0,0,0]))),size=bound.getSize(new THREE.Vector3()),vector=new THREE.Vector3(...d.vector);
    const half=Math.abs(vector.x)*size.x/2+Math.abs(vector.y)*size.y/2+Math.abs(vector.z)*size.z/2;
    const guidedEntry=!!guide()&&assembling();
    const color=guidedEntry?0x24645d:d.vector[0]?0x9d674b:d.vector[1]?0x677e50:0x6f8599;
    const incoming=assembling()?(assemblyHand?.id===part.id&&assemblyHand.direction===id
      ?assemblyHand.range:P.insertionRange(level(),state.removed,part.id,id)):null;
    const start=incoming?center.clone().add(new THREE.Vector3(...incoming.start)):center.clone().addScaledVector(vector,half+.1),end=center.clone().addScaledVector(vector,assembling()?0:half+1.15);
    const arrowLength=incoming?Math.min(.9,incoming.distance*.6):.9;
    const origin=incoming?start.clone().lerp(end,.5).addScaledVector(vector,-arrowLength/2):start;
    previewArrow=new THREE.Group();
    previewArrow.add(new THREE.ArrowHelper(vector,origin,arrowLength,color,arrowLength*.26,arrowLength*.14));
    const path=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),new THREE.LineDashedMaterial({color,transparent:true,opacity:guidedEntry?.76:.55,dashSize:.12,gapSize:.09,depthTest:false,depthWrite:false}));path.computeLineDistances();previewArrow.add(path);
    previewArrow.traverse(o=>{o.renderOrder=10;if(o.material){o.material.depthTest=false;o.material.depthWrite=false;}});scene.add(previewArrow);
    previewTip=origin.clone().addScaledVector(vector,arrowLength/2);
    if(incoming){const opposite=P.DIRECTIONS.find(x=>x.vector.every((v,i)=>v===-d.vector[i]));previewRoute={direction:id,start,end,sourceAxis:opposite.axis};entryCue.hidden=false;$('entry-source').querySelector('b').textContent=guide()?part.name:'来路 '+opposite.axis;$('direction-preview').classList.add('entry-caption');$('direction-preview').textContent=guide()?'沿箭头推入 · 接近归位时吸附':'从 '+opposite.axis+' 侧进入，'+d.label+'（'+d.axis+'） · 这里只看方向，点击再试合';}
    else $('direction-preview').textContent=(state.action==='step'?'向这一侧借位 · ':'向这一侧抽出 · ')+d.axis+(state.action==='step'?' · 一格':'');
    $('direction-preview').hidden=false;renderDirty=true;
  }
  function grainTexture(color){
    if(textures.has(color))return textures.get(color);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');
    ctx.fillStyle=color;ctx.fillRect(0,0,256,512);
    // Deterministic, subtle elongated grain; every asset stays local and reproducible.
    let seed=173;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<85;i++){
      const x=rand()*256,w=rand()*.9+.2;ctx.strokeStyle=rand()>.4?'rgba(61,34,13,.055)':'rgba(255,238,204,.075)';ctx.lineWidth=w;ctx.beginPath();
      for(let y=0;y<=512;y+=8){const nx=x+Math.sin(y*.009+i)*5+Math.sin(y*.027+i*.3)*.5;y?ctx.lineTo(nx,y):ctx.moveTo(nx,y);}ctx.stroke();
    }
    for(let i=0;i<1500;i++){ctx.fillStyle=rand()>.5?'rgba(255,238,204,.05)':'rgba(42,25,12,.04)';ctx.fillRect(rand()*256,rand()*512,1,2);}
    const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=renderer?.capabilities.getMaxAnisotropy()||1;textures.set(color,texture);return texture;
  }
  function woodAxis(part){return part.grainAxis??({tenon:1,pin:2,crosspin:0,upper:2,lower:0,key:1,'lift-key':1,slider:0,slide:0,lid:0,front:0,back:0,left:2,right:2,base:0,rail:0,guide:0,bottom:0})[part.id]??0;}
  function woodMaterial(part){
    if(window.WoodFinish)return WoodFinish.material(THREE,WoodFinish.piece(level().id,part),woodAxis(part),renderer?.capabilities.getMaxAnisotropy()||1,!!storyContext);
    const axis=woodAxis(part),material=new THREE.MeshStandardMaterial({map:grainTexture(part.color),color:0xffffff,roughness:.53,metalness:0,side:THREE.DoubleSide});
    material.onBeforeCompile=shader=>{
      shader.uniforms.uWoodAxis={value:new THREE.Vector3(axis===0?1:0,axis===1?1:0,axis===2?1:0)};
      shader.uniforms.uEndGrainColor={value:new THREE.Color(part.color).convertSRGBToLinear()};
      shader.vertexShader='varying vec3 vWoodPosition;\nvarying vec3 vWoodNormal;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWoodPosition = position;\nvWoodNormal = normalize(normal);');
      shader.fragmentShader='varying vec3 vWoodPosition;\nvarying vec3 vWoodNormal;\nuniform vec3 uWoodAxis;\nuniform vec3 uEndGrainColor;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec2 endPlane = uWoodAxis.x > 0.5 ? vWoodPosition.yz : (uWoodAxis.y > 0.5 ? vWoodPosition.xz : vWoodPosition.xy);
        float radial = length(endPlane * vec2(1.0, 0.76) + vec2(0.22, -0.18));
        float ripple = 0.025 * sin(dot(endPlane, vec2(3.4, 4.8))) + 0.015 * sin(dot(endPlane, vec2(8.3, -2.8)));
        float rings = 1.0 - 0.035 * pow(0.5 + 0.5 * sin((radial + ripple) * 52.0), 4.0) + 0.012 * sin(radial * 13.0);
        float endFace = smoothstep(0.65, 0.92, abs(dot(normalize(vWoodNormal), uWoodAxis)));
        diffuseColor.rgb = mix(diffuseColor.rgb, uEndGrainColor * rings, endFace);
      `);
    };
    material.customProgramCacheKey=()=> 'sun-jian-end-grain-v1';return material;
  }
  function geometry(part){
    const cacheKey=level().id+':'+part.id;
    let surface=surfaceCache.get(cacheKey);
    if(!surface){const faces=WoodMesh.surfaces(part.shapes,window.WoodFinish?.chamfer(level().id)??.035);surface={faces,edges:WoodMesh.edges(faces)};surfaceCache.set(cacheKey,surface);}
    const g=WoodMesh.geometry(THREE,surface.faces,woodAxis(part));
    const lines=new THREE.BufferGeometry();lines.setAttribute('position',new THREE.Float32BufferAttribute(surface.edges.flat(),3));return {g,lines};
  }
  function disposeAssembly(){
    if(!assembly)return;
    clearDirectionPreview();flash=null;seatPulse=null;hovered=null;markerNodes.clear();$('piece-markers').replaceChildren();
    assembly.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});scene.remove(assembly);models.clear();
  }
  function buildModel(){
    if(!renderer)return;
    disposeAssembly();assembly=new THREE.Group();scene.add(assembly);
    for(const part of level().pieces){
      const group=new THREE.Group();group.userData.partId=part.id;
      const material=woodMaterial(part);
      const outlineMaterial=new THREE.LineBasicMaterial({color:0x5d4835,transparent:true,opacity:.16,depthWrite:false});
      const {g,lines}=geometry(part);const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partId=part.id;group.add(mesh);const line=new THREE.LineSegments(lines,outlineMaterial);line.userData.outline=true;group.add(line);
      assembly.add(group);models.set(part.id,{group,material,outlineMaterial});
    }
    const all=level().pieces.flatMap(p=>p.shapes.flatMap(s=>s.vertices)),bottom=Math.min(...all.map(v=>v[1]));
    const width=Math.max(...all.map(v=>v[0]))-Math.min(...all.map(v=>v[0])),depth=Math.max(...all.map(v=>v[2]))-Math.min(...all.map(v=>v[2])),radius=Math.max(1.7,Math.hypot(width,depth)*.44);
    if(ground)ground.position.y=bottom-.12;
    if(disc){disc.position.y=bottom-.073;disc.scale.set(radius/3.6,1,radius/3.6);}
    if(ring){ring.position.y=bottom-.029;ring.scale.setScalar(radius/3.6);}
    if(workmat){workmat.position.y=bottom-.035;workmat.scale.set(width+1.9,depth+1.9,1);}
    if(contactShadow){
      const center=new THREE.Box3().setFromPoints(all.map(v=>new THREE.Vector3(...v))).getCenter(new THREE.Vector3());
      contactShadow.position.set(center.x,bottom-.024,center.z);contactShadow.scale.set(width*1.12,depth*1.18,1);
      contactShadow.material.opacity=storyContext?1:.68;
    }
    if(ground)ground.material.opacity=storyContext?.20:.10;
    updateMaterials();
  }
  function updateMaterials(){
    if(!assembling()||!state.selected||!available(state.selected)){assemblyHand=null;assemblyPose=null;staging.hidden=true;}
    else if(!assemblyHand||assemblyHand.id!==state.selected)stagePart(state.selected);
    for(const [id,model]of models){
      const selected=id===state.selected&&available(id),ghost=assembling()&&state.removed.includes(id),held=assemblyHand?.id===id&&ghost,faded=hintView?!hintView.related.includes(id):state.xray&&!selected;
      const hiddenGhost=ghost&&guide()?.hideBlockedGhosts&&!held&&!hintView&&!state.xray&&!guideAllows(id);
      model.group.visible=(assembling()||!state.removed.includes(id))&&!hiddenGhost;
      if(assemblyHand?.id===id&&ghost)model.group.position.fromArray(assemblyPose||assemblyHand.range.start);
      else if(dragPreview?.id!==id&&dragReturn?.id!==id&&(!state.animation||state.animation.piece!==id))model.group.position.set(...(state.offsets[id]||[0,0,0]));
      const transparent=held?false:faded||ghost;if(model.material.transparent!==transparent)model.material.needsUpdate=true;model.material.transparent=transparent;model.material.opacity=held?1:ghost?(selected?(storyContext?.72:.62):(storyContext?.22:.14)):faded?.18:1;model.material.depthWrite=!transparent;model.material.emissive.set(selected?0x8b4a25:0x000000);model.material.emissiveIntensity=selected?.065:0;
      const focused=hintView?.related.includes(id),hover=id===hovered&&available(id);model.outlineMaterial.color.set(selected?0xa45128:focused||hover?0x526b43:0x5d4835);model.outlineMaterial.opacity=selected?.9:focused?.65:hover?.46:ghost?.29:state.xray?.28:storyContext?.21:.055;model.outlineMaterial.depthTest=!(selected||focused||hover);
      model.group.traverse(o=>{if(o.isMesh)o.castShadow=!ghost||held;});
      if(held)model.outlineMaterial.depthTest=!state.xray;
    }
    renderDirty=true;
  }
  function defaultCamera(preserve=false){
    if(!camera||!controls)return;
    // Clear residual orbit damping before restoring a deterministic view.
    const damping=controls.enableDamping;controls.enableDamping=false;controls.update();
    const bounds=new THREE.Box3();level().pieces.forEach(p=>p.shapes.forEach(s=>s.vertices.forEach(v=>bounds.expandByPoint(new THREE.Vector3(...v).add(new THREE.Vector3(...(guide()&&assemblyHand?.id===p.id?assemblyHand.range.start:[0,0,0])))))));
    const center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;
    // Fit long benches to their silhouette, with both staged seat and destination.
    if((level().id==='rain-shelter-bench'&&guide())||storyContext&&['dovetail','burr-six'].includes(level().id)){
      const points=[];level().pieces.forEach(p=>p.shapes.forEach(s=>s.vertices.forEach(v=>{
        const point=new THREE.Vector3(...v);points.push(point);
        if(assemblyHand?.id===p.id)points.push(point.clone().add(new THREE.Vector3(...assemblyHand.range.start)));
      })));
      const initial=level().id==='dovetail'?[7,7.4,9.5]:level().id==='burr-six'?[8.5,7,10]:[7.7,6.3,8.8];
      const facing=preserve===true?camera.position.clone().sub(controls.target).normalize():new THREE.Vector3(...initial).normalize();
      const right=new THREE.Vector3(0,1,0).cross(facing).normalize(),up=facing.clone().cross(right);
      const vertical=THREE.MathUtils.degToRad(camera.fov/2),horizontal=Math.atan(Math.tan(vertical)*camera.aspect);
      let distance=.5;
      points.forEach(p=>{const relative=p.clone().sub(center),depth=relative.dot(facing);distance=Math.max(distance,depth+Math.abs(relative.dot(right))/(Math.tan(horizontal)*.83),depth+Math.abs(relative.dot(up))/(Math.tan(vertical)*.77));});
      camera.position.copy(center).addScaledVector(facing,distance);controls.target.copy(center);controls.minDistance=radius*.8;controls.maxDistance=distance*1.8;controls.update();camera.updateMatrixWorld();controls.enableDamping=damping;renderDirty=true;return;
    }
    const vertical=THREE.MathUtils.degToRad(camera.fov/2),horizontal=Math.atan(Math.tan(vertical)*camera.aspect);
    const distance=radius/Math.sin(Math.min(vertical,horizontal))*(assembling()?(guide()?1.08:1.55):.99);
    const facing=preserve===true?camera.position.clone().sub(controls.target).normalize():new THREE.Vector3(7.7,6.3,8.8).normalize();camera.position.copy(center).add(facing.multiplyScalar(distance));controls.target.copy(center);controls.minDistance=radius*1.5;controls.maxDistance=distance*1.8;controls.update();camera.updateMatrixWorld();controls.enableDamping=damping;renderDirty=true;
  }
  function init3D(){
    if(!window.THREE){$('renderer-error').hidden=false;return;}
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.97;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.autoClear=false;
      $('viewport').append(renderer.domElement);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,.1,80);controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.dampingFactor=.085;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=19;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=Math.PI*.08;defaultCamera();
      scene.add(new THREE.HemisphereLight(0xfff7ea,0x806a56,.62));
      const light=new THREE.DirectionalLight(0xfff3dc,1.14);light.position.set(-4,14,8);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-8;light.shadow.camera.right=8;light.shadow.camera.top=8;light.shadow.camera.bottom=-8;light.shadow.camera.near=.5;light.shadow.camera.far=35;light.shadow.bias=-.0007;light.shadow.normalBias=.013;light.shadow.radius=8;scene.add(light);
      const fill=new THREE.DirectionalLight(0xe4eaf3,.31);fill.position.set(6,4,-4);scene.add(fill);
      const rim=new THREE.DirectionalLight(0xffe3b8,.25);rim.position.set(-5,4,-6);scene.add(rim);
      ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.ShadowMaterial({opacity:.10}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
      disc=new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.6,.085,96),new THREE.MeshStandardMaterial({color:new THREE.Color(0xd2c3a2).convertSRGBToLinear(),roughness:.94,transparent:true,opacity:.32,depthWrite:false}));disc.receiveShadow=true;scene.add(disc);
      ring=new THREE.Mesh(new THREE.RingGeometry(3.48,3.495,96),new THREE.MeshBasicMaterial({color:0xb19b70,transparent:true,opacity:.24,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;scene.add(ring);
      const cloth=document.createElement('canvas');cloth.width=cloth.height=512;const ink=cloth.getContext('2d');ink.fillStyle='#72877c';ink.beginPath();if(ink.roundRect)ink.roundRect(1,1,510,510,9);else ink.rect(1,1,510,510);ink.fill();
      for(let i=8;i<505;i+=4){ink.strokeStyle=i%8===0?'#f0eadc08':'#1d3c3909';ink.lineWidth=.6;ink.beginPath();ink.moveTo(i,4);ink.lineTo(i,508);ink.moveTo(4,i);ink.lineTo(508,i);ink.stroke();}ink.setLineDash([3,5]);ink.strokeStyle='#e2dfbf70';ink.lineWidth=1.2;ink.strokeRect(12,12,488,488);
      const clothTexture=new THREE.CanvasTexture(cloth);clothTexture.encoding=THREE.sRGBEncoding;clothTexture.anisotropy=4;workmat=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({map:clothTexture,roughness:1,metalness:0,transparent:true,alphaTest:.1,side:THREE.DoubleSide}));workmat.rotation.x=-Math.PI/2;workmat.receiveShadow=true;workmat.visible=false;scene.add(workmat);
      const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(46,27,14,.42)');gradient.addColorStop(.55,'rgba(46,27,14,.19)');gradient.addColorStop(1,'rgba(67,48,27,0)');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,128,128);
      contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;scene.add(contactShadow);
      axisScene=new THREE.Scene();axisCamera=new THREE.PerspectiveCamera(38,1,.1,100);const axes=new THREE.AxesHelper(1.3),axisColors=[0x956047,0x647c50,0x677f94],colorAttribute=axes.geometry.getAttribute('color');for(let i=0;i<colorAttribute.count;i++){const c=new THREE.Color(axisColors[Math.floor(i/2)]);colorAttribute.setXYZ(i,c.r,c.g,c.b);}colorAttribute.needsUpdate=true;axisScene.add(axes);
      raycaster=new THREE.Raycaster();controls.addEventListener('change',()=>{renderDirty=true;});
      const resize=()=>{cancelGuidedTakeback();drag?.cancel();assemblyDrag?.cancel();closeHint();const rect=$('viewport').getBoundingClientRect();if(rect.width<1||rect.height<1)return;
        // Keep the player's angle and relative zoom when the desk is resized.
        const vertical=THREE.MathUtils.degToRad(camera.fov/2),oldAngle=Math.min(vertical,Math.atan(Math.tan(vertical)*camera.aspect)),nextAspect=rect.width/rect.height,nextAngle=Math.min(vertical,Math.atan(Math.tan(vertical)*nextAspect)),ratio=Math.sin(oldAngle)/Math.sin(nextAngle),offset=camera.position.clone().sub(controls.target);
        renderer.setSize(rect.width,rect.height,false);camera.aspect=nextAspect;camera.updateProjectionMatrix();camera.position.copy(controls.target).addScaledVector(offset,ratio);controls.minDistance*=ratio;controls.maxDistance*=ratio;controls.update();camera.updateMatrixWorld();renderDirty=true;
      };new ResizeObserver(resize).observe($('viewport'));resize();
      assemblyDrag=AssemblyDrag.install({canvas:renderer.domElement,camera,T:THREE,disabled:()=>!gameVisible||!assembling()||state.busy||!!document.querySelector('dialog[open]'),pick:pickAt,hand:()=>assemblyHand,guided:()=>!!guide(),
        start:()=>{closeHint();trial.started=true;controls.enabled=false;},finish:()=>{controls.enabled=true;},reduced:()=>reducedMotion,
        // The staged path stays valid until the board changes. The commit still checks collision.
        range:(id,direction,requested)=>assemblyHand?.id===id&&assemblyHand.direction===direction
          ?P.previewInsertionRange(assemblyHand.range,requested):null,
        apply:(id,direction,status)=>{if(!assemblyHand||assemblyHand.id!==id)return;const d=P.DIRECTIONS.find(d=>d.id===direction);assemblyPose=status.start.map((v,i)=>v+d.vector[i]*status.distance);models.get(id).group.position.fromArray(assemblyPose);if(status.blocked)flash={id:status.blocker,until:performance.now()+500,held:false};$('drag-status').hidden=false;dragText(status.blocked?'碰到'+status.blockerName+'了 · 松手退回，或撤销调整顺序':'沿接点推入 · 接近归位时会吸附');renderDirty=true;},
        restore:()=>{assemblyPose=null;$('drag-status').hidden=true;updateMaterials();},
        ambiguous:()=>setFeedback(guide()?'顺着箭头推。箭头太短时，转一面或用精确操作。':'顺着木件的来路推。也可以换一侧靠近或转动视角。'),
        blocked:()=>{const {blocker,blockerName}=assemblyHand.range;blockedAttempt('drag',blocker,false);setFeedback(`碰到了${blockerName}。木件会退回，可以换个方向或撤销上一步。`,'blocked');},
        commit:(id,direction)=>{assemblyPose=null;state.selected=id;tryExtract(direction,'assembly-drag',true);}
      });
      drag=JointDrag.install({canvas:renderer.domElement,camera,controls,THREE,
        hover:id=>{if(hovered!==id){hovered=id;updateMaterials();document.querySelectorAll('[data-piece]').forEach(b=>b.classList.toggle('hovered',b.dataset.piece===id));}},
        hoverable:id=>available(id)&&!level().pieces.find(p=>p.id===id)?.fixed,
        disabled:()=>!gameVisible||state.busy||!!document.querySelector('dialog[open]'),prepare:closeHint,pick:pickAt,draggable:id=>!assembling()&&available(id)&&!level().pieces.find(p=>p.id===id)?.fixed,select:id=>select(id,true),
        begin:(id,point)=>{const returning=dragReturn?.id===id?dragReturn:null,pose=returning?models.get(id).group.position.clone():null;dragReturn=null;if(pose)dragPreview={id,direction:returning.direction,distance:pose.distanceTo(new THREE.Vector3(...(state.offsets[id]||[0,0,0])))};select(id,true);grabPoint={id,local:point.clone().sub(models.get(id).group.position)};clearDirectionPreview();trial.started=true;$('drag-status').hidden=false;$('drag-status').dataset.state='pull';$('drag-status').style.setProperty('--pull',0);dragText(level().pieces.find(p=>p.id===id).name+' · 握住了，顺着接缝试一试');if(pose){const d=P.DIRECTIONS.find(d=>d.id===returning.direction),axis=d.vector.findIndex(v=>v!==0);return {axis,amount:pose.getComponent(axis)-(state.offsets[id]?.[axis]||0)};}},
        range:(id,direction)=>{const r=P.motionRange(level(),state.removed,id,direction,state.offsets);if(state.experiment&&state.action==='step')r.step=level().step;return r;},
        preview:(id,direction,distance,status)=>{axisCue.hidden=true;if(status.blocked&&!dragPreview?.blocked)sound('blocked');rub(distance,status.blocked);const d=P.DIRECTIONS.find(d=>d.id===direction);dragPreview={id,direction,distance,blocked:status.blocked};models.get(id).group.position.set(...d.vector.map((v,i)=>(state.offsets[id]?.[i]||0)+v*distance));$('drag-status').hidden=false;$('drag-status').dataset.state=status.blocked?'blocked':status.ready?'ready':'pull';$('drag-status').style.setProperty('--pull',Math.min(1,distance/(status.range.step||status.range.exitDistance)));dragText(status.ready?(state.action==='step'?'松手借位一格':'已脱榫'):status.blocked?`被${status.range.blockerName}挡住 · 退回起点可换轴`:state.action==='step'?'拖过半格，松手停靠':'沿着接点拉 · 没拉开，松手会回位');if(status.blocked)flash={id:status.range.blocker,until:performance.now()+250,held:true};renderDirty=true;},
        cancel:()=>{clearTimeout(movementNoticeTimer);movementNoticeTimer=null;axisCue.hidden=true;stopFitting();stopRubbing();takeaways.slice().forEach(disposeTakeaway);grabPoint=null;dragPreview=null;dragReturn=null;$('grip-dot').hidden=true;$('drag-status').hidden=true;updateMaterials();},
        release:(id,direction,distance)=>{axisCue.hidden=true;stopRubbing();grabPoint=null;$('grip-dot').hidden=true;dragPreview=null;$('drag-status').hidden=true;if(direction&&distance>.005&&!reducedMotion)dragReturn={id,direction,from:models.get(id).group.position.clone(),start:performance.now(),duration:210};updateMaterials();},
        commit:(id,direction)=>{state.selected=id;tryExtract(direction,'drag',true);},
        blocked:(id,direction,r)=>{blockedAttempt('drag',r.blocker,false);setFeedback(`被${r.blockerName}挡住了。观察接点，再试一次。`,'blocked');},
        returned:()=>{E.action(trial,'drag');setFeedback('未脱榫，木件回位；可以再次抓住继续拉。这次试探不记步数。');},
        ambiguous:guide=>{showAxisCue(guide);$('drag-status').hidden=false;dragText('沿一条轴线试探 · 线太近时，转动视角再拉');},
        reconsider:guide=>{stopRubbing();showAxisCue(guide);$('drag-status').hidden=false;dragText('回到起点了 · 不用松手，可以换条轴再试');},dirty:()=>{renderDirty=true;}
      });
      renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();drag?.cancel();closeHint();$('precise-controls').open=true;$('renderer-error').hidden=false;});
      animate();
    }catch(e){console.error('Unable to initialize workbench',e);if(renderer)renderer.dispose();renderer=null;camera=null;scene=null;$('renderer-error').hidden=false;}
  }
  function pickAt(x,y){
    if(!raycaster||state.busy||!assembly)return null;
    const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),camera);
    const hits=raycaster.intersectObjects(assembly.children,true).filter(h=>h.object.isMesh&&h.object.visible&&h.object.parent.visible&&(assembling()||!state.removed.includes(h.object.userData.partId)));
    if(!hits.length)return null;
    const hit=state.xray||assembling()?hits.find(h=>!level().pieces.find(p=>p.id===h.object.userData.partId)?.fixed&&available(h.object.userData.partId))||hits[0]:hits[0];return {id:hit.object.userData.partId,point:hit.point};
  }
  function markers(){
    if(!renderer)return;const rect=$('viewport').getBoundingClientRect();
    const grip=$('grip-dot');grip.hidden=!grabPoint;if(grabPoint){const m=models.get(grabPoint.id),q=grabPoint.local.clone().add(m.group.position).project(camera);grip.style.left=(q.x+1)*rect.width/2+'px';grip.style.top=(1-q.y)*rect.height/2+'px';grip.dataset.blocked=String(!!dragPreview?.blocked);}
    for(const p of movable()){
      let label=markerNodes.get(p.id);if(!label){label=document.createElement('span');label.textContent=p.symbol;$('piece-markers').append(label);markerNodes.set(p.id,label);}
      label.hidden=!models.get(p.id)?.group.visible||!!p.labelOccludedBy&&!state.removed.includes(p.labelOccludedBy)&&!state.xray&&state.selected!==p.id;if(label.hidden)continue;
      const m=models.get(p.id);if(!m)continue;const box=new THREE.Box3();p.shapes.forEach(s=>s.vertices.forEach(v=>box.expandByPoint(new THREE.Vector3(...v))));const a=woodAxis(p),point=box.getCenter(new THREE.Vector3());if(p.labelAnchor)point.set(...p.labelAnchor);else point.setComponent(a,box.max.getComponent(a)+.08);point.add(m.group.position).project(camera);
      label.className='model-label'+(state.selected===p.id?' selected':hovered===p.id?' hovered':'');label.style.left=(point.x+1)*rect.width/2+'px';label.style.top=(1-point.y)*rect.height/2+'px';label.style.zIndex=state.selected===p.id?'2':'1';
    }
  }

  function animate(){
    requestAnimationFrame(animate);if(!renderer||!camera||!gameVisible)return;
    if(guidedTakeback){const a=guidedTakeback,t=Math.min(1,(performance.now()-a.start)/180);models.get(a.piece)?.group.position.copy(a.from).addScaledVector(new THREE.Vector3(...a.vector),a.distance*(1-Math.pow(1-t,3)));renderDirty=true;if(t>=1){guidedTakeback=null;state.busy=false;undo();sound('release');setFeedback(guide()?.id===AssemblyGuide.furniture.id?'侧销已回托盘。先贴齐主板，再固定侧销。':'穿销已回到托盘。榫头先归位，再装穿销。','success');}}
    controls.update();
    if(dragReturn){const a=dragReturn,t=Math.min(1,(performance.now()-a.start)/a.duration),m=models.get(a.id);if(m)m.group.position.copy(a.from).lerp(new THREE.Vector3(...(state.offsets[a.id]||[0,0,0])),1-Math.pow(1-t,3));if(t>=1)dragReturn=null;renderDirty=true;}
    for(const a of [...takeaways]){const t=Math.min(1,(performance.now()-a.start)/180);a.group.traverse(o=>{if(o.material)o.material.opacity=a.opacity.get(o)*(1-t*t);});if(t>=1)disposeTakeaway(a);renderDirty=true;}
    if(flash){
      renderDirty=true;const m=models.get(flash.id),held=flash.held&&dragPreview?.blocked,left=held?600:flash.until-performance.now();
      if(left<=0){flash=null;updateMaterials();}
      else if(m){m.outlineMaterial.color.set(0xa1492c);m.outlineMaterial.opacity=held?.9:.25+.55*Math.min(1,left/600);}
    }
    if(fitting){const a=fitting,t=performance.now()-a.start,d=P.DIRECTIONS.find(d=>d.id===a.direction),phase=t<300?t/300:t<450?1:Math.max(0,1-(t-450)/250),f=phase*phase*(3-2*phase);a.group.position.fromArray(a.range.start).addScaledVector(new THREE.Vector3(...d.vector),a.range.travel*f);a.group.traverse(o=>{if(o.material)o.material.opacity=(o.isMesh?.95:.55)*Math.max(0,Math.min(1,t/60,(700-t)/80));});if(t>=300&&!a.contactSound){a.contactSound=true;sound('blocked');}renderDirty=true;if(t>=700)stopFitting();}
    if(seatPulse){const a=seatPulse,t=(performance.now()-a.start)/320,m=models.get(a.id);renderDirty=true;if(t>=1){seatPulse=null;updateMaterials();}else if(m){m.outlineMaterial.color.set(0xb58b4d);m.outlineMaterial.opacity=.18+.45*(1-t);}}
    if(state.animation){
      renderDirty=true;
      const a=state.animation,t=Math.min(1,(performance.now()-a.start)/a.duration),model=models.get(a.piece);
      if(model){
        if(a.kind==='extract'||a.kind==='insert'||a.kind==='shift'){const eased=a.kind==='insert'?1-Math.pow(1-t,3):t*t*(3-2*t);model.group.position.set(...a.vector.map((v,i)=>(a.from?.[i]||0)+v*a.distance*(a.kind==='insert'?eased-1:eased)));if(a.kind!=='shift'){model.material.transparent=true;model.material.opacity=a.kind==='insert'?.65+t*.35:1-Math.max(0,(t-.84)/.16);}}

      }
      if(t>=1){state.animation=null;if(model)model.group.position.set(...(a.from||[0,0,0]));state.busy=false;if(a.kind==='extract'||a.kind==='insert')finishExtract(a.piece,a.direction);else if(a.kind==='shift')finishShift(a.piece,a.direction);else{renderPieces();updateMaterials();}}
    }
    if(demo){const t=(performance.now()-demo.start)/2400;if(t>=1){stopDemo();}else{const f=t<.5?t*2:2-t*2;demo.group.position.copy(demo.origin).addScaledVector(demo.vector,demo.distance*(f*f*(3-2*f)));renderDirty=true;}}
    if(!renderDirty)return;renderDirty=false;markers();syncDirectionIcons();
    renderer.setViewport(0,0,$('viewport').clientWidth,$('viewport').clientHeight);renderer.setScissorTest(false);renderer.clear();renderer.render(scene,camera);
    if(previewTip){const tip=previewTip.clone().project(camera),rect=$('viewport').getBoundingClientRect();$('direction-preview').style.left=(previewRoute?16:Math.max(12,Math.min(rect.width-80,(tip.x+1)*rect.width/2-35)))+'px';$('direction-preview').style.top=(previewRoute?42:Math.max(40,Math.min(rect.height-70,(-tip.y+1)*rect.height/2-14)))+'px';
      if(previewRoute){for(const [name,point]of [['source',previewRoute.start],['seat',previewRoute.end]]){const v=point.clone().project(camera),el=$('entry-'+name);el.style.left=Math.max(70,Math.min(rect.width-70,(v.x+1)*rect.width/2))+'px';el.style.top=Math.max(110,Math.min(rect.height-55,(-v.y+1)*rect.height/2))+'px';}const a=$('entry-source'),b=$('entry-seat');entryCue.classList.toggle('same-line',Math.hypot(parseFloat(a.style.left)-parseFloat(b.style.left),parseFloat(a.style.top)-parseFloat(b.style.top))<80);}
    }
    const corner=78,x=15,y=52;
    axisCamera.position.copy(camera.position).sub(controls.target).normalize().multiplyScalar(4.7);axisCamera.lookAt(0,0,0);axisCamera.updateMatrixWorld();renderer.clearDepth();renderer.setViewport(x,y,corner,corner);renderer.setScissor(x,y,corner,corner);renderer.setScissorTest(true);renderer.render(axisScene,axisCamera);renderer.setScissorTest(false);
    for(const [name,pos,color]of [['x',[1.5,0,0],'#b07860'],['y',[0,1.5,0],'#6f9062'],['z',[0,0,1.5],'#7d8ca0']]){const v=new THREE.Vector3(...pos).project(axisCamera),label=$('axis-guide').querySelector(`[data-axis="${name}"]`);label.style.left=((v.x+1)*corner/2+2)+'px';label.style.top=((-v.y+1)*corner/2-5)+'px';label.style.color=color;}
  }
  function tryExtract(direction,input='button',direct=false){
    if(!gameVisible||!state.selected||state.busy)return;
    if(!available(state.selected)){if(guide()&&assembling())setFeedback(AssemblyGuide.blockedText(guide(),state.removed,state.selected),'blocked');return;}
    const pulled=input==='drag'&&direct?dragPreview:null;
    if(!pulled){drag?.cancel();assemblyDrag?.cancel();}closeHint();const id=state.selected,isShift=state.experiment&&state.action==='step',d=P.DIRECTIONS.find(d=>d.id===direction),piece=level().pieces.find(p=>p.id===id);if(!d)return;
    if(guide()&&assembling()&&direction!==AssemblyGuide.direction(guide(),id,state.removed)){setFeedback('沿箭头将木件推入即可，来路已经摆好。');return;}
    const result=isShift?P.canTranslate(level(),state.removed,id,direction,level().step,state.offsets):(assembling()?P.canInsert:P.canExtract)(level(),state.removed,id,direction,state.offsets);clearDirectionPreview();
    if(!result.ok){if(pulled)drag?.cancel();const contact=assembling()?P.insertionRange(level(),state.removed,id,direction):null;blockedAttempt(input,contact?.blocker||result.piece,!(contact?.blocker&&renderer&&!reducedMotion));if(contact?.blocker)previewFitting(id,direction,contact);if(input!=='drag')movementNotice(piece.name+'碰到了'+(contact?.blockerName||result.name)+' · 换个方向试试');setFeedback(`${piece.name}在这个方向会碰到${contact?.blockerName||result.name}。${assembling()?'可以换方向；若提前锁定，请撤销再安排归位顺序。':'观察这个接点，试着解除约束。'}`,'blocked');return;}
    if(pulled){stopRubbing();if(!isShift&&!reducedMotion)takeAway(models.get(id).group);grabPoint=null;$('grip-dot').hidden=true;dragPreview=null;$('drag-status').hidden=true;}
    E.action(trial,input==='assembly-drag'?'drag':input);state.busy=true;renderPieces();if(!pulled)sound('move');setFeedback(`${piece.name}正沿${d.axis}方向${isShift?'移动一格':assembling()?'进入卯位':'退出'}。`,'success');
    if(renderer&&!reducedMotion&&!direct){
      const exitDirection=assembling()?P.DIRECTIONS.find(x=>x.vector.every((v,i)=>v===-d.vector[i])).id:direction;
      const present=assembling()?state.removed.filter(x=>x!==id):state.removed;
      const distance=isShift?level().step:P.motionRange(level(),present,id,exitDirection,state.offsets).exitDistance;
      state.animation={kind:isShift?'shift':assembling()?'insert':'extract',piece:id,direction,vector:d.vector,distance,from:[...(state.offsets[id]||[0,0,0])],start:performance.now(),duration:isShift?420:Math.min(520,Math.max(280,220+Math.sqrt(distance)*105))};
    }
    else{state.busy=false;if(isShift)finishShift(id,direction);else finishExtract(id,direction);}
  }

  function stopFitting(){if(!fitting)return;scene.remove(fitting.group);fitting.group.traverse(o=>o.material?.dispose());fitting=null;updateMaterials();renderDirty=true;}
  function previewFitting(id,direction,range){
    stopFitting();if(!renderer||reducedMotion)return;
    const group=models.get(id).group.clone(true);group.traverse(o=>{if(o.material){const original=o.material;o.material=original.clone();o.material.onBeforeCompile=original.onBeforeCompile;o.material.customProgramCacheKey=original.customProgramCacheKey;o.material.transparent=true;o.material.opacity=o.isMesh?.95:.55;o.material.depthWrite=false;o.material.depthTest=true;}o.castShadow=false;});group.visible=true;group.position.fromArray(range.start);scene.add(group);
    fitting={id,direction,range,group,start:performance.now(),contactSound:false};models.get(id).material.opacity=.1;models.get(id).outlineMaterial.opacity=.18;renderDirty=true;
  }
  // A released piece disappears exactly where the hand pulled it, without a launch or reset.
  // This visual copy never participates in picking, collision, history, or completion.
  function takeAway(source){const group=source.clone(true),opacity=new Map();group.traverse(o=>{if(o.material){const original=o.material;o.material=original.clone();o.material.onBeforeCompile=original.onBeforeCompile;o.material.customProgramCacheKey=original.customProgramCacheKey;o.material.transparent=true;o.material.depthWrite=false;opacity.set(o,o.material.opacity);}o.castShadow=false;});scene.add(group);takeaways.push({group,opacity,start:performance.now()});renderDirty=true;}
  function disposeTakeaway(a){scene.remove(a.group);a.group.traverse(o=>o.material?.dispose());takeaways=takeaways.filter(x=>x!==a);}

  function finishShift(id,direction){
    const from=[...(state.offsets[id]||[0,0,0])],d=P.DIRECTIONS.find(d=>d.id===direction),to=from.map((v,i)=>v+d.vector[i]*level().step);
    state.offsets[id]=to;state.history.push({kind:'shift',piece:id,direction,from,to});state.selected=null;state.action='extract';progressChanged();renderPieces();updateMaterials();saveSession();
    const opened=P.availableMoves(level(),state.removed,state.offsets).length>0;
    setFeedback(`${level().pieces.find(p=>p.id===id).name}已${d.label}移动一格。${opened?'出口已有变化，可以尝试完整抽出构件。':'再观察两件木的关系，寻找可以借出的空间。'}`,'success');
  }
  function finishExtract(id,direction){
    if(!assembling())sound('release');if(assembling()){sound('seat');if(!reducedMotion)seatPulse={id,start:performance.now()};}
    if(assembling())state.removed=state.removed.filter(p=>p!==id);else state.removed.push(id);state.history.push({kind:assembling()?'insert':'extract',piece:id,direction});state.selected=null;progressChanged();renderPieces();updateMaterials();if(guide())defaultCamera(true);
    if(!assembling())document.querySelector(`[data-piece="${id}"]`)?.classList.add('just-taken');
    const piece=level().pieces.find(p=>p.id===id),remaining=movable().filter(p=>assembling()?state.removed.includes(p.id):!state.removed.includes(p.id));
    if(!remaining.length){
      state.completedAt=Date.now();window.dispatchEvent(new Event('joint:inspection-state'));trial.completedMs=trial.visibleMs;if(storyContext){setFeedback(storyContext.completionText||(assembling()?'合好了。转一转，看看接缝是不是贴齐了。':'取下了。看看露出来的接面，再试着合回去。'),'success');saveSession();storyEvent('complete');return;}saveTrials();const records=completedRecords(level());if(state.experiment){state.experimentCleared=true;persist();}else if(!records.includes(level().id)){records.push(level().id);if(state.tutorialCleared.length===2)state.tutorialStatus='completed';persist();}renderChapters();setFeedback(assembling()?'所有构件已归位。你让这处结构重新合为一体。':'所有可动构件都已抽出。你读懂了这处结构。','success');sound('win');showCompletion();
    }else setFeedback(`${piece.name}已${assembling()?'归位':'抽出'}。结构的约束改变了，再看看剩下的构件。`,'success');
    saveSession();
  }
  function nextStructure(){const list=level().category==='tutorial'?P.TUTORIALS:P.MAIN_LEVELS,index=list.indexOf(level());if(list[index+1])return list[index+1];if(level().category==='tutorial')return P.MAIN_LEVELS[0];return P.MAIN_LEVELS.find(l=>!completedRecords(l).includes(l.id))||null;}
  function formatTime(ms){const seconds=Math.max(0,Math.floor(ms/1000));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
  function showCompletion(){
    $('complete-dialog').querySelector('h2').textContent=assembling()?'你让木作合为一体。':'你让结构松开了。';$('complete-dialog').querySelector('.completion-seal').textContent=assembling()?'合':'解';$('complete-title').textContent=level().title+' / '+(assembling()?'合回':'拆开');$('complete-insight').textContent=level().insight;
    $('complete-route').textContent=state.history.map((step,i)=>`${i+1}. ${level().pieces.find(p=>p.id===step.piece).name} · ${P.DIRECTIONS.find(d=>d.id===step.direction).label}${step.kind==='shift'?'一格':''}`).join('　→　');
    const next=nextStructure(),lastMain=!state.experiment&&level()===P.MAIN_LEVELS.at(-1);
    $('complete-stats').replaceChildren(...[['观察用时',formatTime(trial.completedMs??trial.visibleMs)],['完成步数',state.history.length+' 步'],['使用线索',trial.hintLevel?trial.hintLevel+' / 3':'独立探索']].map(([label,value])=>{const item=document.createElement('div'),small=document.createElement('span'),strong=document.createElement('strong');small.textContent=label;strong.textContent=value;item.append(small,strong);return item;}));
    $('complete-dialog').querySelector('.route-details').open=false;
    $('replay-complete').textContent=assembling()?'再合一次':'再解一次';$('reverse-complete').hidden=state.experiment;$('reverse-complete').textContent=assembling()?'再从拆解中观察一次 →':'试着合回这处结构 →';
    $('next-level').innerHTML=state.experiment||!next?'查看结构收藏 <span>↗</span>':level().category==='tutorial'&&next.category==='main'?'进入主线 <span>→</span>':lastMain?'继续未解结构 <span>→</span>':'下一处结构 <span>→</span>';
    if(lastMain&&!next)$('complete-dialog').querySelector('h2').textContent=assembling()?'八处木作，已合为一体。':'八处结构，已逐一读懂。';
    if(!$('complete-dialog').open)$('complete-dialog').showModal();
  }
  function loadLevel(index,experimental=false,restored=null){
    if(index<0||index>=P.LEVELS.length)return;
    cancelGuidedTakeback();
    drag?.cancel();assemblyDrag?.cancel();takeaways.slice().forEach(disposeTakeaway);closeHint();saveTrials();state.level=index;state.experiment=experimental;state.action='extract';state.offsets={};state.selected=null;state.removed=assembling()?movable().map(p=>p.id):[];state.history=[];state.hint=0;state.started=Date.now();state.completedAt=null;state.busy=false;state.animation=null;
    if(guide()){const normalized=AssemblyGuide.normalize(level(),restored?{version:1,level:level().id,mode:state.mode,history:restored.history,trial:restored.trial}:null,state.mode,P,E,guide());restored=normalized.legal;}
    if(restored){state.offsets=restored.offsets;state.removed=restored.removed;state.history=restored.history;state.action=restored.action;state.completedAt=restored.completed?Date.now():null;}
    trial=restored?.trial||E.trial(level().id,state.mode);if(!storyContext){records=records.filter(t=>t.id!==trial.id);records.push(trial);records=records.slice(-200);}nudgedStates=new Set(trial.nudged?[positionKey()]:[]);lastTick=performance.now();$('skip-current-tutorial').hidden=level().category!=='tutorial';$('help-nudge').hidden=true;$('precise-controls').open=!renderer||assembling()&&!guide();$('drag-instruction').textContent=guide()&&assembling()?'按步骤选件，沿箭头推入 · 接近归位时吸附':assembling()?'选散件，从一侧拿近，再沿接点拖入；接近归位时会吸附。':'沿槽拉出即拆解 · 短拉松手平滑回位';
    $('hint-box').hidden=true;if($('complete-dialog').open)$('complete-dialog').close();
    document.querySelector('.stage-heading .eyebrow').firstChild.textContent=storyContext?(storyContext.locationLabel||'周伯家的木作台 '):'STRUCTURE STUDY ';$('study-number').textContent=storyContext?'':level().chapter;document.querySelector('.inspector-title>span').textContent=storyContext?'看清接点，慢慢动手':'WORKBENCH';
    const legend=document.querySelector('.view-instruction');legend.replaceChildren();const icon=document.createElement('span');icon.className='mouse-icon';legend.append(icon,document.createTextNode(assembling()?'选散件合回':'拖木件拆解'));for(const text of ['拖空白转动',matchMedia('(pointer: coarse)').matches?'双指缩放':'滚轮缩放']){const line=document.createElement('span');line.className='divider';legend.append(line,document.createTextNode(text));}
    $('level-title').textContent=level().title;$('level-subtitle').textContent=level().subtitle;$('difficulty').textContent=level().difficulty;$('family').textContent=level().family;$('goal').replaceChildren();const prefix=document.createElement('span');prefix.textContent='本关目标';$('goal').append(prefix,document.createTextNode(assembling()?'将待装木件归位，复原这处结构。':level().goal));
    $('mode-dismantle').setAttribute('aria-pressed',!assembling());$('mode-assemble').setAttribute('aria-pressed',assembling());$('mode-assemble').disabled=experimental;$('workbench-title').textContent=assembling()?'归位工作台':'拆解工作台';$('direction-instruction').textContent=assembling()?'沿一个方向装入':'沿一个方向抽出';$('removed-count').previousSibling.textContent=assembling()?'已合 ':'已拆 ';
    updateGoal();renderChapters();renderPieces();buildModel();defaultCamera();setFeedback(experimental?'完整抽出有时会受阻。试着先移动一格，为另一件木让出空间。':assembling()?'半透明模型表示待装位置。选择构件，判断装入方向和先后。':level().category==='tutorial'?(level().id==='straight'?'按住浅色木件向上拉。短拉松手会平滑回位，拉脱结构就完成拆解。':'按住上方搭木试探。被挡住时会高亮接点，转动空白处观察上下关系。'):'按住一块木构件，沿它的结构轴试探。拖空白处可以转动观察。');updateTimer();if(storyContext){setFeedback(assembling()?'选中木件，对准卯口，再选择归位方向。':'按住木件拖动；拉脱即可取下，短拉松手会回位。');$('skip-current-tutorial').hidden=true;}saveSession();
    if(restored){setFeedback(`已续上${level().title}的${assembling()?'合回':'拆解'}进度，可以接着操作或撤销上一步。`,'success');if(restored.completed&&!storyContext)showCompletion();}
    if(storyContext?.openingText)setFeedback(storyContext.openingText,restored?'success':'');
    else if(guide())setFeedback(AssemblyGuide.step(guide(),state.removed,state.mode,level())?.instruction||AssemblyGuide.completionText(guide(),state.mode));
  }
  function cancelGuidedTakeback(){if(!guidedTakeback)return;const a=guidedTakeback;models.get(a.piece)?.group.position.copy(a.from);guidedTakeback=null;state.busy=false;renderDirty=true;}
  function takeBackPin(){
    if(state.busy||!assembling()||!guide())return;const a=AssemblyGuide.takeback(level(),guide(),state.removed,state.history,P);if(!a)return;
    drag?.cancel();assemblyDrag?.cancel();closeHint();if(!renderer||reducedMotion){undo();sound('release');return;}
    const range=P.motionRange(level(),state.removed,a.piece,a.direction,state.offsets),model=models.get(a.piece);if(!model)return;
    guidedTakeback={...a,from:model.group.position.clone(),vector:P.DIRECTIONS.find(d=>d.id===a.direction).vector,distance:range.exitDistance+.15,start:performance.now()};state.busy=true;renderPieces();
  }
  function undo(){
    if(state.history.length<=guideFloor()||state.busy)return;drag?.cancel();assemblyDrag?.cancel();closeHint();
    clearDirectionPreview();
    if($('complete-dialog').open)$('complete-dialog').close();const last=state.history.pop();if(last.kind==='shift'){state.offsets[last.piece]=last.from;state.action='step';}else if(assembling())state.removed.push(last.piece);else state.removed=state.removed.filter(p=>p!==last.piece);state.selected=last.piece;state.completedAt=null;trial.completedMs=null;progressChanged();renderPieces();updateMaterials();
    if(guide()){defaultCamera(true);restoreAssemblyCue();}
    saveSession();setFeedback(last.kind==='shift'?'已撤销借位，构件回到上一步的位置。':assembling()?'已移开上一步归位的构件。再观察一次它的进入方向。':'已放回上一步的构件。再观察一次它的方向。');
  }
  function stopDemo(){if(!demo)return;scene.remove(demo.group);demo.group.traverse(o=>{if(o.material)o.material.dispose();});demo=null;renderDirty=true;}
  function closeHint(){stopFitting();stopDemo();if(hintView){if(camera){camera.position.copy(hintView.position);controls.target.copy(hintView.target);controls.update();camera.updateMatrixWorld();}state.xray=hintView.xray;hintView=null;$('xray').setAttribute('aria-pressed',state.xray);updateMaterials();}$('hint-box').hidden=true;}
  function cancelInteraction(){
    if(!gameVisible)return false;
    const dragging=drag?.active()||assemblyDrag?.active()||!!dragReturn;
    const hintBox=$('hint-box');
    if(!dragging&&!fitting&&hintBox.hidden)return false;
    const focusWasInHint=hintBox.contains(document.activeElement);
    drag?.cancel();
    assemblyDrag?.cancel();
    closeHint();
    restoreAssemblyCue();
    if(dragging)setFeedback('木件已回到拖动前的位置。可继续操作，再按 Esc 返回。');
    if(focusWasInHint){
      const quickHint=$('quick-hint');
      (quickHint.getClientRects().length?quickHint:$('hint')).focus({preventScroll:true});
    }
    return true;
  }
  function tellHint(text){$('hint-text').textContent=text;if(storyContext)window.dispatchEvent(new CustomEvent('joint:story-hint',{detail:{taskId:storyContext.taskId,stage:state.hint,text}}));}
  function hint(){
    if(state.busy||$('hint').disabled)return;drag?.cancel();assemblyDrag?.cancel();clearDirectionPreview();closeHint();state.hint=Math.min(3,state.hint+1);trial.hintLevel=Math.max(trial.hintLevel,state.hint);trial.started=true;$('help-nudge').hidden=true;
    syncQuickActions();saveSession();
    $('hint-box').classList.toggle('is-zhou',!!storyContext&&storyContext.helpVoice!=='notebook'&&!storyContext.taskId?.startsWith('study:cave:'));$('hint-box').hidden=false;if(storyContext)requestAnimationFrame(()=>{if(storyContext&&!$('hint-box').hidden)$('hint-box').scrollIntoView({block:'nearest',inline:'nearest'});});$('hint-stage').textContent=['','1 / 3 · 观察线索','2 / 3 · 解释约束','3 / 3 · 演示一步'][state.hint];
    if(state.hint===1&&guide()){tellHint(AssemblyGuide.step(guide(),state.removed,state.mode,level())?.instruction||AssemblyGuide.completionText(guide(),state.mode));return;}
    if(state.hint===1){const spoken={straight:'先看浅色木件和卯口相贴的那一圈。转着看看，哪些面贴住了，哪儿还留着空。',lap:'盯着中间交叠的地方看。两根各让出一块，哪儿压着哪儿，从侧面更容易看清。',pinned:'别光看大的。那根小销穿过了哪些地方？看不清，就转到侧面看看。',dovetail:'这道槽，前后看着一样宽吗？顺着两边斜面看看，再试着动。','shoulder-lap':'你看，中间既有搭接，又有穿过去的小件。先认清它们分别碰着谁。','burr-three':'三根交在一块，容易看花。先选一根，沿着它的边看一圈，找找缺口。'};tellHint(storyContext?(assembling()?'先别急着放。把槽口和肩面认清，想想哪件放进去以后，会挡住别人的路。':!state.removed.length&&(spoken[level().id]||P.observation(level(),state.removed))||(state.removed.length===1?'拿开一件以后，再看看剩下的接点。刚才被遮住的地方，现在露出来了吗？':'再看看剩下的接点。刚才被遮住的地方，现在露出来了吗？')):(assembling()?'观察每件木的槽口与肩面：哪些接点需要留出进入空间，哪些小件会把出口封住？':P.observation(level(),state.removed)));return;}
    const context=P.hintContext(level(),state.removed,state.mode,state.offsets);
    if(!context.move){tellHint(context.text);$('hint-next').hidden=true;return;}
    if(state.hint===2){tellHint(context.text+' 关闭线索后回到原来的观察状态。');if(renderer){hintView={position:camera.position.clone(),target:controls.target.clone(),xray:state.xray,related:context.related};const box=new THREE.Box3();context.related.forEach(id=>{const p=level().pieces.find(p=>p.id===id);p?.shapes.forEach(s=>s.vertices.forEach(v=>box.expandByPoint(new THREE.Vector3(...v).add(new THREE.Vector3(...(state.offsets[id]||[0,0,0]))))));});if(!box.isEmpty()){const target=box.getCenter(new THREE.Vector3()),delta=target.clone().sub(controls.target);camera.position.add(delta);controls.target.copy(target);controls.update();}updateMaterials();}return;}
    const move=context.move,p=level().pieces.find(p=>p.id===move.piece),d=P.DIRECTIONS.find(d=>d.id===move.direction);
    const action=move.kind==='shift'?'借位一格':assembling()?'归位':'抽出';
    tellHint(renderer?`半透明副本演示${p.name}${d.label}${action}。棋局保持原样，请亲手完成。`:`选中${p.name}，在精确操作里点「${d.label}」${action}。`);
    if(renderer){const group=models.get(p.id).group.clone(true);group.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=o.isMesh?.36:.65;o.material.depthWrite=false;o.material.depthTest=false;if(o.material.color)o.material.color.set(0x8c9d6a);}o.castShadow=false;});group.visible=true;group.renderOrder=20;scene.add(group);const origin=new THREE.Vector3(...(state.offsets[p.id]||[0,0,0])),vector=new THREE.Vector3(...d.vector),exit=assembling()?P.DIRECTIONS.find(x=>x.vector.every((v,i)=>v===-d.vector[i])).id:d.id,distance=move.kind==='shift'?level().step:P.motionRange(level(),assembling()?state.removed.filter(id=>id!==p.id):state.removed,p.id,exit,state.offsets).exitDistance;if(assembling()){origin.addScaledVector(vector,-distance);}demo={group,origin,vector,distance,start:performance.now()};renderDirty=true;}
  }

  function toggleXray(){drag?.cancel();assemblyDrag?.cancel();closeHint();state.xray=!state.xray;$('xray').setAttribute('aria-pressed',state.xray);updateMaterials();setFeedback(state.xray?'透视已开启。点击内部构件，观察它与卯座的连接。':'已回到木作实景。');}
  function updateSoundButton(){$('sound').setAttribute('aria-pressed',state.sound);$('sound').setAttribute('aria-label',state.sound?'关闭木作音效':'开启木作音效');$('sound').querySelector('span').textContent=state.sound?'音效开':'音效关';$('sound').querySelector('path').setAttribute('d',state.sound?'M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14':'M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6');}
  function openAtlas(){
    $('atlas-grid').replaceChildren(...[...P.TUTORIALS,...P.MAIN_LEVELS].map(l=>{const i=P.LEVELS.indexOf(l);
      const card=document.createElement('button');card.className='atlas-card';card.dataset.atlasLevel=i;card.setAttribute('aria-label','打开'+l.title);
      card.innerHTML=`<img src="assets/${l.id}.svg" alt="" width="220" height="155"><span class="atlas-card-title"><small>${l.chapter}</small><strong>${l.family}</strong></span><span class="atlas-card-line">${l.observation}</span><span class="atlas-progress"><span class="${(l.category==='tutorial'?state.tutorialCleared:state.cleared).includes(l.id)?'done':''}">${(l.category==='tutorial'?state.tutorialCleared:state.cleared).includes(l.id)?'✓ 已拆解':'○ 待拆解'}</span><span class="${(l.category==='tutorial'?state.tutorialAssembled:state.assembled).includes(l.id)?'done':''}">${(l.category==='tutorial'?state.tutorialAssembled:state.assembled).includes(l.id)?'✓ 已合回':'○ 待合回'}</span></span>`;
      card.onclick=()=>{$('atlas-dialog').close();loadLevel(i);};return card;
    }));$('atlas-dialog').showModal();
  }
  function updateTimer(){$('elapsed').textContent=formatTime(trial?.visibleMs||0);}
  $('help').onclick=()=>{drag?.cancel();closeHint();$('help-dialog').showModal();};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=() =>$(b.dataset.close).close());
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}));
  document.querySelectorAll('[data-direction]').forEach(button=>{
    const preview=()=>showDirectionPreview(button.dataset.direction);
    const unpreview=()=>{if(!guide()||!assemblyHand)clearDirectionPreview();};
    button.onclick=()=>tryExtract(button.dataset.direction);
    button.addEventListener('mouseenter',preview);button.addEventListener('focus',preview);
    button.addEventListener('mouseleave',unpreview);button.addEventListener('blur',unpreview);
  });
  $('xray').onclick=toggleXray;$('reset-camera').onclick=()=>{drag?.cancel();assemblyDrag?.cancel();closeHint();defaultCamera();};$('undo').onclick=undo;$('quick-undo').onclick=undo;$('quick-hint').onclick=hint;$('hint-next').onclick=hint;$('restart').onclick=()=>loadLevel(state.level,state.experiment);$('hint').onclick=hint;$('replay-complete').onclick=()=>loadLevel(state.level,state.experiment);$('next-level').onclick=()=>{const next=nextStructure();if(state.experiment||!next){$('complete-dialog').close();openAtlas();}else loadLevel(P.LEVELS.indexOf(next));};
  $('reverse-complete').onclick=()=>{state.mode=assembling()?'dismantle':'assemble';loadLevel(state.level);};
  $('mode-dismantle').onclick=()=>{state.mode='dismantle';loadLevel(state.level,state.experiment);};$('mode-assemble').onclick=()=>{state.mode='assemble';loadLevel(state.level);};$('sound').onclick=()=>{state.sound=!state.sound;if(!state.sound){stopRubbing();stopWoodTones();}updateSoundButton();persist();if(state.sound)sound('move');};
  for(const [id,action]of [['action-extract','extract'],['action-step','step']])$(id).onclick=()=>{if(state.busy)return;drag?.cancel();closeHint();state.action=action;clearDirectionPreview();renderPieces();setFeedback(action==='step'?'选择方向，先借出一格空间。':'选择方向，完整抽出选中的构件。');};
  $('open-atlas').onclick=openAtlas;
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||!gameVisible||document.querySelector('dialog[open]')||e.target.closest('input,textarea,select,[contenteditable=true]'))return;
    const undoShortcut=(e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==='z';if(undoShortcut){e.preventDefault();if(!e.repeat)undo();return;}if(e.ctrlKey||e.metaKey||e.altKey)return;
    const key=e.key.toLowerCase(),direction=P.DIRECTIONS.find(d=>d.key===key);if(e.repeat)return;
    if(direction){e.preventDefault();tryExtract(direction.id,'keyboard');}else if(['1','2','3','4','5','6'].includes(key)){const piece=movable()[Number(key)-1];if(piece)select(piece.id);}else if(key==='h')hint();else if(key==='z')undo();else if(key==='r')loadLevel(state.level,state.experiment);else if(key==='v')toggleXray();else if(key==='escape'&&cancelInteraction())e.preventDefault();
  });
  $('close-hint').onclick=()=>{closeHint();restoreAssemblyCue();};$('nudge-open').onclick=hint;$('nudge-dismiss').onclick=()=>{$('help-nudge').hidden=true;};
  $('start-tutorial').onclick=()=>{state.tutorialStatus='started';persist();$('welcome-dialog').close();loadLevel(0);};
  $('skip-tutorial').onclick=()=>{state.tutorialStatus='skipped';persist();$('welcome-dialog').close();loadLevel(P.LEVELS.indexOf(P.MAIN_LEVELS[0]));};
  $('skip-current-tutorial').onclick=()=>{state.tutorialStatus='skipped';persist();loadLevel(P.LEVELS.indexOf(P.MAIN_LEVELS[0]));};
  $('welcome-dialog').addEventListener('close',()=>{if(!storyContext&&state.tutorialStatus==='new'){state.tutorialStatus='skipped';persist();}});
  $('export-playtest').onclick=()=>{tick();saveTrials();const report={version:1,exportedAt:new Date().toISOString(),storage:'browser-only',records:records.map(t=>({level:t.level,mode:t.mode,firstStepMs:t.firstSuccessMs,completionMs:t.completedMs,activeMs:t.visibleMs,blocked:t.blocked,hintLevel:t.hintLevel,inputs:t.inputs,attempts:t.attempts}))};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='sun-jian-playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setFeedback('已导出本机内测记录。数据仅保存在当前浏览器，不会上传。');};
  const storeSession=()=>{saveTrials();saveSession();};window.addEventListener('pagehide',storeSession);document.addEventListener('visibilitychange',()=>{lastTick=performance.now();if(document.hidden){stopWoodTones();stopRubbing();audioContext?.suspend().catch(()=>{});}storeSession();});
  let restored=null;try{restored=E.restoreSession(localStorage.getItem('sun-jian-session-v1'),P);}catch{}
  init3D();if(restored)state.mode=restored.mode;loadLevel(restored&&!restored.experiment?P.LEVELS.findIndex(l=>l.id===restored.level):P.LEVELS.indexOf(P.MAIN_LEVELS[0]),restored?.experiment||false,restored);updateSoundButton();setInterval(tick,250);setInterval(storeSession,5000);if(state.tutorialStatus==='new'&&!restored)$('welcome-dialog').showModal();
  function storyLighting(enabled){
    if(!renderer||!scene)return;renderer.toneMappingExposure=enabled?.94:.97;
    const palette=[0xeee5d2,0xffe2b5,0xb5d1dc,0xffdbad],strengths=[.68,.96,.28,.16];let i=0;
    scene.children.filter(o=>o.isLight).forEach(light=>{light.userData.practiceColor ||= light.color.clone();if(light.groundColor)light.userData.practiceGround ||= light.groundColor.clone();light.userData.practiceIntensity??=light.intensity;light.intensity=enabled?strengths[i]||.2:light.userData.practiceIntensity;light.color.copy(enabled?new THREE.Color(palette[i++]||0xe9eee6):light.userData.practiceColor);if(light.groundColor)light.groundColor.copy(enabled?new THREE.Color(0x655c50):light.userData.practiceGround);});
    if(disc){disc.visible=!enabled;disc.material.color.set(enabled?0xb8c2b0:0xd2c3a2).convertSRGBToLinear();disc.material.opacity=enabled?.07:.32;}if(ring)ring.visible=!enabled;if(workmat)workmat.visible=enabled;if(ground)ground.material.opacity=enabled?.12:.10;renderDirty=true;
  }
  window.JointGame={
    enterStory(){
      if(!storyContext){tick();saveTrials();saveSession();practiceBackup={run:runData(),sound:state.sound,selected:state.selected,xray:state.xray,camera:camera?.position.toArray(),target:controls?.target.toArray()};storyContext={taskId:null};}
      document.querySelectorAll('dialog[open]').forEach(d=>d.close());this.suspend();storyLighting(true);
    },
    openStoryPuzzle({taskId,levelId,mode,objective,run,helpVoice,locationLabel,completionText,openingText=null,assemblyGuide=null,illustratedSurface=false}){
      const index=P.LEVELS.findIndex(l=>l.id===levelId);if(index<0||!['dismantle','assemble'].includes(mode))throw Error('Unknown story puzzle');
      this.enterStory();storyContext={taskId,objective,helpVoice,locationLabel,completionText,openingText,assemblyGuide};state.mode=mode;state.xray=false;$('xray').setAttribute('aria-pressed','false');gameVisible=true;
      const restored=run&&run.level===levelId&&run.mode===mode?E.restoreSession(JSON.stringify(run),P):null;
      loadLevel(index,false,restored);if(workmat&&illustratedSurface)workmat.visible=false;this.resize();return runData();
    },
    suspend(){cancelGuidedTakeback();drag?.cancel();assemblyDrag?.cancel();closeHint();seatPulse=null;state.animation=null;state.busy=false;updateMaterials();gameVisible=false;lastTick=performance.now();if(storyContext?.taskId)saveSession();},
    setPreferences(p){if(typeof p.sound==='boolean'&&state.sound!==p.sound){state.sound=p.sound;if(!state.sound){stopRubbing();stopWoodTones();}updateSoundButton();}if(controls&&Number.isFinite(p.sensitivity))controls.rotateSpeed=Math.max(.3,Math.min(2,p.sensitivity));if(renderer&&['low','medium','high'].includes(p.quality)){const ratio=Math.min(devicePixelRatio,p.quality==='low'?1:p.quality==='medium'?1.5:2);if(renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);renderDirty=true;}}if(Number.isFinite(p.volume)){volume=Math.max(0,Math.min(1,p.volume));if(audioMaster)audioMaster.gain.value=volume;}if(typeof p.reducedMotion==='boolean')reducedMotion=p.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;},
    resume(){if(document.querySelector("dialog[open]"))return;gameVisible=true;lastTick=performance.now();if(renderer&&camera){const r=$('viewport').getBoundingClientRect();if(r.width&&r.height){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}}updateMaterials();renderPieces();},
    resize(){cancelGuidedTakeback();if(!renderer||!camera)return;const r=$('viewport').getBoundingClientRect();if(r.width&&r.height){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();defaultCamera();renderDirty=true;}},
    returnPractice(){
      this.suspend();const backup=practiceBackup;storyContext=null;gameVisible=true;practiceBackup=null;storyLighting(false);
      if(backup){state.sound=backup.sound;if(!state.sound){stopRubbing();stopWoodTones();}updateSoundButton();state.mode=backup.run.mode;state.xray=backup.xray;const restored=E.restoreSession(JSON.stringify(backup.run),P);loadLevel(restored?.experiment?0:P.LEVELS.findIndex(l=>l.id===backup.run.level),restored?.experiment||false,restored);state.selected=backup.selected;this.resize();if(camera&&backup.camera){camera.position.fromArray(backup.camera);controls.target.fromArray(backup.target);controls.update();}updateMaterials();renderPieces();$('xray').setAttribute('aria-pressed',state.xray);persist();if(camera&&backup.camera)requestAnimationFrame(()=>{if(!storyContext){camera.position.fromArray(backup.camera);controls.target.fromArray(backup.target);controls.update();renderDirty=true;}});}else this.resize();
    },
    getRun:runData,cancelInteraction,rendererAvailable:()=>!!renderer,
    resumeAfterOverlay(opening){if(!opening?.visible||this.inspection().key!==opening.key||document.querySelector("dialog[open]"))return false;if(opening.story&&!["story-puzzle","cave-puzzle","campaign-puzzle"].some(name=>document.body.classList.contains(name)))return false;this.resume();return true;},
    inspection(){const id=state.selected||state.history.at(-1)?.piece,part=level().pieces.find(p=>p.id===id);return {key:[storyContext?.taskId||'practice',level().id,state.mode,trial?.id].join(':'),levelId:level().id,pieceId:part?.id||null,name:part?.name||'',direction:camera&&controls?camera.position.clone().sub(controls.target).normalize().toArray():null,visible:gameVisible,reducedMotion,busy:state.busy,settling:gameVisible&&!!storyContext?.taskId&&!storyContext.taskId.startsWith('study:')&&state.completedAt!==null,story:!!storyContext};}
  };
  // Read-only snapshot for integration checks; gameplay is always exercised through the UI.
  window.SunJian={screen:()=>{
    if(!renderer)return null;camera.updateMatrixWorld();assembly.updateMatrixWorld(true);const r=renderer.domElement.getBoundingClientRect(),project=p=>{const q=p.clone().project(camera);return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};},pieces={};
    for(const p of movable()){if(!available(p.id))continue;const model=models.get(p.id);let hit=null;const geometry=model.group.children.find(o=>o.isMesh).geometry,positions=geometry.getAttribute('position');
      for(let i=0;i<positions.count&&!hit;i+=3){const q=new THREE.Vector3();for(let j=0;j<3;j++)q.add(new THREE.Vector3().fromBufferAttribute(positions,i+j));q.divideScalar(3).add(model.group.position);const xy=project(q);if(xy.x<r.left+2||xy.x>r.right-2||xy.y<r.top+2||xy.y>r.bottom-2)continue;const picked=pickAt(xy.x,xy.y);if(picked?.id===p.id)hit=picked.point;}
      if(hit){const start=project(hit);pieces[p.id]={start,axes:[0,1,2].map(a=>{const v=hit.clone();v.setComponent(a,v.getComponent(a)+1);const q=project(v);return[q.x-start.x,q.y-start.y];}),directions:Object.fromEntries(P.DIRECTIONS.map(d=>{const incoming=assembling()?P.insertionRange(level(),state.removed,p.id,d.id):null,range=incoming?{...incoming,exitDistance:incoming.distance,freeDistance:incoming.travel}:P.motionRange(level(),state.removed,p.id,d.id,state.offsets);return [d.id,{...range,end:project(hit.clone().addScaledVector(new THREE.Vector3(...d.vector),range.exitDistance+.25)),unit:project(hit.clone().add(new THREE.Vector3(...d.vector)))}];}))};}
    }return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},pieces};},snapshot:()=>({guidedTakeback:guidedTakeback?{piece:guidedTakeback.piece}:null,woodSoundVoices:woodTones.size,context:storyContext?'story':'practice',visible:gameVisible,level:level().id,mode:state.mode,experiment:state.experiment,action:state.action,offsets:Object.fromEntries(Object.entries(state.offsets).map(([id,v])=>[id,[...v]])),selected:state.selected,removed:[...state.removed],history:state.history.map(s=>({...s,...(s.from?{from:[...s.from],to:[...s.to]}:{})})),busy:state.busy,directionCue:previewRoute?{direction:previewRoute.direction,sourceAxis:previewRoute.sourceAxis,start:previewRoute.start.toArray(),end:previewRoute.end.toArray()}:null,fitting:fitting?{piece:fitting.id,direction:fitting.direction,position:fitting.group.position.toArray(),...fitting.range}:null,blocking:flash?{piece:flash.id,persistent:!!(flash.held&&dragPreview?.blocked)}:null,xray:state.xray,cleared:[...state.cleared],assembled:[...state.assembled],renderer:!!renderer,category:level().category,tutorialCleared:[...state.tutorialCleared],tutorialStatus:state.tutorialStatus,preview:dragPreview?{...dragPreview}:null,returning:dragReturn?{id:dragReturn.id,direction:dragReturn.direction}:null,poses:Object.fromEntries([...models].map(([id,m])=>[id,m.group.position.toArray()])),takeaways:takeaways.map(a=>({position:a.group.position.toArray()})),gesture:drag?.snapshot(),hint:state.hint,focused:!!hintView,demo:!!demo,trial:trial?JSON.parse(JSON.stringify(trial)):null,camera:camera?camera.position.toArray():null,target:controls?controls.target.toArray():null})};
})();
