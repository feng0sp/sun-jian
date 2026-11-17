/* An optional, read-only companion to the assembly drawing. */
(function(root){
 'use strict';
 function create(dialog){
  const parts=root.BenchSketchParts,ns='http://www.w3.org/2000/svg',img=dialog.querySelector('img');
  const sheet=document.createElement('div');sheet.className='sketch-sheet';img.before(sheet);sheet.append(img);
  const overlay=document.createElementNS(ns,'svg');overlay.setAttribute('viewBox','0 0 1050 680');overlay.setAttribute('aria-hidden','true');sheet.append(overlay);
  const controls=document.createElement('div');controls.className='sketch-parts';controls.setAttribute('role','group');controls.setAttribute('aria-label','对照长凳构件');sheet.after(controls);
  const detail=document.createElement('p');detail.className='sketch-detail';detail.setAttribute('role','status');controls.after(detail);
  let selected=null,placed=new Set(),hasProgress=false,prefitted=new Set();
  function choose(id){selected=id;render();}
  for(const p of parts){
   const mark=document.createElement('button');mark.className='sketch-mark';mark.dataset.sketchMark=p.id;mark.textContent=p.code;mark.style.left=p.center[0]/10.5+'%';mark.style.top=p.center[1]/6.8+'%';mark.setAttribute('aria-label',p.code+' · '+p.name);mark.onclick=()=>choose(p.id);sheet.append(mark);
   const b=document.createElement('button');b.dataset.sketchPart=p.id;b.textContent=p.code+' · '+p.name;b.onclick=()=>choose(p.id);controls.append(b);
  }
  controls.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   const buttons=[...controls.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(i<0)return;
   e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
   buttons[next].focus();choose(buttons[next].dataset.sketchPart);
  });
  function render(){
   overlay.replaceChildren();const p=parts.find(p=>p.id===selected);
   if(p){const group=document.createElementNS(ns,'g');group.setAttribute('class','sketch-highlight');for(const points of p.polygons){const shape=document.createElementNS(ns,'polygon');shape.setAttribute('points',points);group.append(shape);}overlay.append(group);}
   for(const b of dialog.querySelectorAll('[data-sketch-part],[data-sketch-mark]')){
    const id=b.dataset.sketchPart||b.dataset.sketchMark;b.setAttribute('aria-pressed',String(id===selected));b.classList.toggle('is-placed',hasProgress&&placed.has(id));
   }
   detail.replaceChildren();
   if(!p){detail.textContent=prefitted.size?'甲乙是周伯已装好的横梁；本次只装丙座板、丁戊木销。点选构件可以对照接面。':'点选甲、乙、丙、丁、戊，对照各自的接面。草图只作参照，木件仍由你亲手装入。';return;}
   const title=document.createElement('strong');title.textContent=p.code+' · '+p.name+(hasProgress?(prefitted.has(p.id)?' · 已归位（周伯预装）':placed.has(p.id)?' · 已归位':' · 待装入'):'');detail.append(title,document.createTextNode('　'+p.description));
  }
  function refresh(run,installed=[]){
   // The caller supplies a validated committed state, never a drag preview.
   hasProgress=!!run;prefitted=new Set(installed);placed=new Set(run?parts.filter(p=>!run.removed.includes(p.id)).map(p=>p.id):[]);render();
  }
  img.addEventListener('error',()=>{sheet.hidden=true;});img.addEventListener('load',()=>{sheet.hidden=false;});
  refresh(null);return {refresh};
 }
 root.CampaignSketch={create};
})(window);
