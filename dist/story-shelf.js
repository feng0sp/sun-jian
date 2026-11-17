/* A room-only shortcut to the same sample interactions and legal saved runs. */
(function(root){
 'use strict';
 function create({observe,practice,task}){
  const dialog=document.createElement('dialog');dialog.id='story-shelf-dialog';dialog.className='modal story-shelf-modal';dialog.setAttribute('aria-labelledby','story-shelf-title');
  dialog.innerHTML='<button id="story-shelf-close" class="modal-close" aria-label="回到小屋">×</button><div class="eyebrow">周伯家的工作台</div><h2 id="story-shelf-title">挑一件，慢慢看看。</h2><p class="shelf-intro">学过的样木可以反复拆合。拿不准时，先看看接面，或和周伯聊聊。</p><p id="story-shelf-count" class="shelf-scroll-note"></p><div id="story-shelf-grid"></div><button id="story-shelf-return" class="primary-button">回到小屋 →</button>';
  document.body.append(dialog);let focus=null,launching=false;
  function launch(fn){if(!dialog.open||launching)return;launching=true;dialog.close();fn();}
  function open(state){
   if(document.querySelector('dialog[open]'))return;focus=document.activeElement;launching=false;
   const D=JourneyStory,P=JointPuzzle,E=PuzzleExperience,grid=dialog.querySelector('#story-shelf-grid');grid.replaceChildren();
   for(const sample of D.samples.filter(n=>!n.extra||state.beat===9)){
    const info=D.sampleStatus(state,sample.id,P,E),card=document.createElement('article');card.className='shelf-card';card.dataset.shelfSample=sample.id;
    const img=document.createElement('img');img.src='assets/'+sample.id+'.svg';img.alt='';img.width=220;img.height=155;
    const name=document.createElement('h3');name.textContent=sample.name;
    const badge=document.createElement('span');badge.className='shelf-badge';badge.textContent=info.current?'正在帮忙 · 这一件':sample.extra?'再试一件':info.learned?'已经认识':'先看看';
    const description=document.createElement('p');description.textContent=info.learned?sample.text:'先观察它怎样接在一起。愿意动手时，和周伯聊聊。';
    const progress=document.createElement('p');progress.className='shelf-progress';progress.textContent=info.current?'这次帮忙 · '+(info.currentTask.mode==='assemble'?'已归位 ':'已取下 ')+info.currentTask.count+' / '+info.total:info.learned?['dismantle','assemble'].map(mode=>{const m=info.modes[mode],label=mode==='assemble'?'合回':'拆开';return m.partial?label+' '+m.count+'/'+info.total+' · 可继续':m.completed?label+' ✓':label+' · 还没试过';}).join('　'):'观察不影响当前的帮忙事项';
    const actions=document.createElement('div');actions.className='shelf-actions';
    function button(text,action,kind){const b=document.createElement('button');b.textContent=text;b.dataset.shelfAction=kind;b.onclick=()=>launch(action);actions.append(b);}
    button('拿近看看',()=>observe(sample.id),'observe');
    if(info.current)button('接着这一步 →',task,'task');
    if(info.learned&&!info.current)for(const mode of ['dismantle','assemble'])button(info.modes[mode].partial?(mode==='assemble'?'继续合回':'继续试拆'):(mode==='assemble'?'试着合回':'拆开试试'),()=>practice(sample.id,mode),mode);
    card.append(img,badge,name,description,progress,actions);grid.append(card);
   }
   dialog.querySelector('#story-shelf-count').textContent=grid.children.length+' 件样木 · 下方区域可滚动，选一件接着试';dialog.showModal();dialog.querySelector('#story-shelf-return').focus({preventScroll:true});
  }
  dialog.querySelector('#story-shelf-close').onclick=dialog.querySelector('#story-shelf-return').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{if(!launching&&focus?.isConnected&&!focus.disabled)focus.focus({preventScroll:true});focus=null;});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  return {open,isOpen:()=>dialog.open};
 }
 root.JourneyShelf={create};
})(window);
