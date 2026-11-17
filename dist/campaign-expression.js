/* Facial drawings registered to their original painting, never to the viewport. */
(function(root){
 'use strict';
 const actors={
  zhou:{source:[1920,1080],rect:[292,200,81,92],cues:['zhou-look','zhou-smile','zhou-warm']},
  lin:{source:[1672,941],rect:[360,124,96,104],cues:['lin-study','lin-smile']}
 };
 function mount(painting,actor){
  const {source,rect,cues}=actors[actor];
  const layer=document.createElement('div');
  layer.className='painted-expression';
  layer.setAttribute('aria-hidden','true');
  const [x,y,w,h]=rect,[width,height]=source;
  Object.assign(layer.style,{left:x/width*100+'%',top:y/height*100+'%',width:w/width*100+'%',height:h/height*100+'%'});
  painting.append(layer);
  let selected=null;
  return function show(request){
   const cue=cues.includes(request)?request:null;
   if(cue===selected)return;
   selected=cue;
   layer.replaceChildren();
   delete layer.dataset.expression;
   if(!cue)return;
   const portrait=new Image();
   portrait.alt='';portrait.draggable=false;
   portrait.onload=()=>{
    if(portrait.parentNode!==layer)return;
    layer.dataset.expression=cue;
   };
   // Keep the painting and dialogue usable if a single optional patch is unavailable.
   portrait.onerror=()=>{if(portrait.parentNode===layer)portrait.remove();};
   layer.append(portrait);
   portrait.src='assets/campaign-2d/expressions/'+cue+'.webp';
  };
 }
 function mountScene(painting){
  const layer=document.createElement('div');layer.className='scene-expression';layer.hidden=true;layer.setAttribute('aria-hidden','true');painting.append(layer);let requested=null;
  return (cue,source)=>{
   const target=cue==='zhou-proud'&&!String(source).includes('/contest-0143/')&&/-after\.webp$/.test(source||'')?source.replace(/-after\.webp$/,'-after-proud.webp'):null;
   if(target===requested)return;requested=target;layer.hidden=true;layer.replaceChildren();delete layer.dataset.expression;if(!target)return;
   const rect=source?.includes('/stool-')?[1262,45,132,144]:source?.includes('/table-')?[1350,75,140,155]:[1545,85,140,150];const [x,y,w,h]=rect;layer.style.clipPath='inset('+y/1080*100+'% '+(1920-x-w)/1920*100+'% '+(1080-y-h)/1080*100+'% '+x/1920*100+'% round 5px)';
   const image=new Image();image.alt='';image.draggable=false;image.onload=()=>{if(requested!==target||image.parentNode!==layer)return;layer.hidden=false;layer.dataset.expression='zhou-proud';};image.onerror=()=>{if(image.parentNode===layer){layer.hidden=true;image.remove();}};layer.append(image);image.src=target;
  };
 }
 root.CampaignExpression={mount,mountScene};
})(window);
