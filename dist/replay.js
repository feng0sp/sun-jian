(function(){
 'use strict';
 const $=id=>document.getElementById(id),G=JointGame,button=document.createElement('button');
 button.id='replay-moves';button.className='stage-tool';button.textContent='回看我的动作';button.disabled=true;$('inspect-piece').after(button);
 const dialog=document.createElement('dialog');dialog.id='motion-replay-dialog';dialog.className='modal motion-replay-modal';dialog.setAttribute('aria-labelledby','replay-title');
 dialog.innerHTML='<button id="replay-close" class="modal-close" aria-label="收起动作回看">×</button><div class="eyebrow">我的拆合记录</div><h2 id="replay-title"></h2><p class="replay-intro">拖动旋转、滚轮放大，慢慢看接点怎样让开。这里只回放你已经做过的动作。</p><div id="replay-model" aria-label="可旋转的拆合动作回看"></div><div class="replay-transport"><button id="replay-play">播放</button><button id="replay-previous" aria-label="回到上一个动作">上一步</button><input id="replay-progress" type="range" min="0" step="0.01" value="0" aria-label="拆合回放进度"><button id="replay-next" aria-label="看到下一个动作">下一步</button><span id="replay-count"></span></div><p id="replay-caption" role="status"></p><div id="replay-steps" role="group" aria-label="选择已经做过的动作"></div><div class="replay-footer"><span>回看不改变当前拆合进度</span><button id="replay-return" class="primary-button">回到刚才 →</button></div>';
 document.body.append(dialog);let record=null,viewer=null,opening=null,focus=null,progress=0,playing=false,raf=0,last=0;

 function refresh(){const i=G.inspection();button.disabled=!i.visible||i.busy||i.settling||!G.getRun().history.length;}
 function pause(){playing=false;cancelAnimationFrame(raf);raf=0;$('replay-play').textContent='播放';$('replay-play').setAttribute('aria-pressed','false');}
 function name(step){const part=record.level.pieces.find(p=>p.id===step.piece),direction=JointPuzzle.DIRECTIONS.find(d=>d.id===step.direction);return part.name+' · '+direction.label+(step.kind==='insert'?'合回':step.kind==='shift'?'借位一格':'取下');}
 function show(value){
  if(!record)return;progress=Math.max(0,Math.min(record.steps.length,value));const frame=record.frame(progress);viewer?.pose(frame);$('replay-progress').value=progress;$('replay-progress').setAttribute('aria-valuetext',progress===record.steps.length?'已看完 '+record.steps.length+' 步':'第 '+(frame.index+1)+' 步，'+Math.round(frame.fraction*100)+'%');
  $('replay-count').textContent=Math.min(record.steps.length,frame.index+1)+' / '+record.steps.length;$('replay-previous').disabled=progress===0;$('replay-next').disabled=progress===record.steps.length;
  const caption=frame.index===record.steps.length?'已回看到当前进度。可以拖回任意一处，再看看接面。':(frame.index+1)+'. '+name(record.steps[frame.index]);if($('replay-caption').textContent!==caption)$('replay-caption').textContent=caption;
  $('replay-model').classList.toggle('is-empty',!!viewer&&record.level.pieces.every(p=>frame.removed.includes(p.id)));
  dialog.querySelectorAll('[data-replay-step]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.replayStep)===frame.index));
 }
 function tick(now){if(!playing)return;const elapsed=Math.min(64,now-last);last=now;show(progress+elapsed/1400);if(progress>=record.steps.length){pause();return;}raf=requestAnimationFrame(tick);}
 function open(run,title){
  if(dialog.open)return false;const i=G.inspection();if(i.visible&&(i.busy||i.settling))return false;const next=JointMotionRecord.build(run,JointPuzzle,PuzzleExperience);if(!next)return false;
  const reduced=i.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;record=next;opening=i;focus=document.activeElement;G.suspend();dialog.showModal();$('replay-title').textContent=title||record.level.family+' · '+(record.mode==='assemble'?'合回':'拆开');
  $('replay-progress').max=record.steps.length;$('replay-steps').replaceChildren(...record.steps.map((step,index)=>{const b=document.createElement('button');b.dataset.replayStep=index;b.textContent=(index+1)+'. '+name(step);b.onclick=()=>{pause();show(index);};return b;}));
  $('replay-model').replaceChildren();try{viewer=WoodWorkshop.notebook($('replay-model'),record.level.id,{viewDirection:i.visible?i.direction:null,playbackPoints:record.points});}catch{$('replay-model').textContent='暂时无法显示三维回看。下方仍可查看你做过的步骤。';}
  dialog.querySelector('.replay-intro').textContent=reduced?'逐步查看或拖动进度条，转着看看接面。已按减少动态效果设置关闭自动播放。':'拖动旋转、滚轮放大，慢慢看接点怎样让开。这里只回放你已经做过的动作。';$('replay-play').disabled=!viewer||reduced;$('replay-play').title=reduced?'已开启减少动态效果，请用进度条逐帧查看':'';pause();show(0);$('replay-return').focus({preventScroll:true});return true;
 }
 button.onclick=()=>open(G.getRun());$('replay-close').onclick=$('replay-return').onclick=()=>dialog.close();
 $('replay-play').onclick=()=>{if(playing){pause();return;}if(progress>=record.steps.length)show(0);playing=true;last=performance.now();$('replay-play').textContent='暂停';$('replay-play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);};
 $('replay-progress').addEventListener('input',()=>{pause();show(Number($('replay-progress').value));});$('replay-previous').onclick=()=>{pause();show(Math.max(0,Math.ceil(progress)-1));};$('replay-next').onclick=()=>{pause();show(Math.min(record.steps.length,Math.floor(progress)+1));};
 dialog.addEventListener('close',()=>{pause();viewer?.();viewer=null;G.resumeAfterOverlay(opening);record=null;opening=null;refresh();if(focus?.isConnected&&!focus.disabled)focus.focus({preventScroll:true});focus=null;});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 document.addEventListener('keydown',e=>{if(e.repeat&&(e.key==='Enter'||e.code==='Space')&&(dialog.open||document.activeElement===button))e.preventDefault();},true);
 window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('joint:inspection-state',refresh);
 window.JointReplay={open,snapshot:()=>record?{progress,playing,steps:record.steps.map(s=>({piece:s.piece,direction:s.direction,kind:s.kind})),frame:record.frame(progress),model:viewer?.snapshot()||null}:null};refresh();
})();
