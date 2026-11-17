(function(){
 'use strict';
 const G=JointGame,$=id=>document.getElementById(id),button=document.createElement('button');
 button.id='inspect-piece';button.className='stage-tool';button.disabled=true;button.textContent='拿近看接面';button.title='拿近看选中或刚取下的木件（I），保留拆装进度';$('reset-camera').after(button);
 const dialog=document.createElement('dialog');dialog.id='piece-inspection-dialog';dialog.className='modal piece-inspection-modal';dialog.setAttribute('aria-labelledby','inspection-title');
 dialog.innerHTML='<button class="modal-close" id="inspection-close" aria-label="回到拆装">×</button><div class="eyebrow">木件观察</div><h2 id="inspection-title">拿近看接面</h2><p class="inspection-intro">拖动翻看，滚轮缩放。看看切口、榫肩和相接的面。</p><div id="inspection-model" aria-label="可旋转的木件观察模型"></div><div id="inspection-layout" role="group" aria-label="观察方式"><button data-inspect-layout="solo" aria-pressed="true">只看这件</button><button data-inspect-layout="together" aria-pressed="false">放回结构中对照</button><button data-inspect-layout="apart" aria-pressed="false">摊开对照</button><button id="inspection-reset">回正视角 ↶</button></div><div id="inspection-parts" role="group" aria-label="换一件观察"></div><p id="inspection-detail" role="status"></p><div class="inspection-footer"><small>观察示意 · 不记录为拆装操作</small><button id="inspection-return" class="primary-button">回去接着试 →</button></div>';
 document.body.append(dialog);let viewer=null,opening=null,focus=null,layout='solo';
 function refresh(){const info=G.inspection();button.disabled=!info.visible||info.busy||info.settling||!info.pieceId;button.textContent=info.pieceId?'拿近看 · '+info.name:'拿近看接面';}
 function setLayout(value){layout=value;viewer?.isolate(false);viewer?.separate(value==='apart');if(value==='solo')viewer?.isolate(true);dialog.querySelectorAll('[data-inspect-layout]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.inspectLayout===value));}
 function open(){
  const info=G.inspection();if(!info.visible||info.busy||info.settling||!info.pieceId||document.querySelector('dialog[open]'))return;
  const definition=JointPuzzle.LEVELS.find(l=>l.id===info.levelId)||JointPuzzle.EXPERIMENT;if(!definition?.pieces.some(p=>p.id===info.pieceId))return;
  opening=info;focus=document.activeElement;G.suspend();dialog.showModal();layout='solo';
  const select=id=>{const p=definition.pieces.find(p=>p.id===id);$('inspection-title').textContent=p?.name||'拿近看接面';$('inspection-detail').textContent=p?(p.description||'转着看看切口与肩面，留意它们和其他木件接触的位置。'):'';dialog.querySelectorAll('[data-inspect-part]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.inspectPart===id));};
  $('inspection-parts').replaceChildren(...definition.pieces.map(p=>{const b=document.createElement('button');b.textContent=(p.symbol||'座')+' · '+p.name;b.dataset.inspectPart=p.id;b.onclick=()=>{select(p.id);viewer?.select(p.id);};return b;}));select(info.pieceId);
  $('inspection-model').replaceChildren();try{viewer=WoodWorkshop.notebook($('inspection-model'),info.levelId,{initialPart:info.pieceId,solo:true,viewDirection:info.direction,onSelect:select});}catch{$('inspection-model').textContent='暂时无法显示三维观察。可以切换下方构件，阅读结构说明，再返回继续操作。';}
  dialog.querySelectorAll('[data-inspect-layout]').forEach(b=>{b.disabled=!viewer;b.setAttribute('aria-pressed',b.dataset.inspectLayout==='solo');});$('inspection-reset').disabled=!viewer;$('inspection-return').focus({preventScroll:true});
 }
 button.onclick=open;$('inspection-close').onclick=$('inspection-return').onclick=()=>dialog.close();$('inspection-reset').onclick=()=>viewer?.reset();dialog.querySelectorAll('[data-inspect-layout]').forEach(b=>b.onclick=()=>setLayout(b.dataset.inspectLayout));
 dialog.addEventListener('close',()=>{viewer?.();viewer=null;G.resumeAfterOverlay(opening);opening=null;refresh();if(focus?.isConnected&&!focus.disabled)focus.focus({preventScroll:true});focus=null;});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='i'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,textarea,select,[contenteditable=true]')&&!document.querySelector('dialog[open]')){if(!button.disabled){e.preventDefault();open();}}});
 window.addEventListener('joint:inspection-state',refresh);window.JointInspection={snapshot:()=>viewer?{...viewer.snapshot(),layout}:null};refresh();
})();
