/* The visible portrait always belongs to the current speaker. */
(function(root){
 'use strict';
 const live={opening:['worried','worried','worried'],villageArrival:['normal','normal'],continuationMeetup:['smile','smile','normal'],continuationDeparture:['normal','normal','normal','smile'],continuationGoodbye:['normal','smile','smile','smile']};
 const messages={stay:['normal','normal','smile','normal'],travelMessage:['normal','smile'],continuationPurpose:['normal','normal','smile'],continuationEntry:['normal','normal','normal','smile','smile']};
 const actors={zhou:{name:'周伯',size:[512,512],live:[0,0,512,512],avatar:[0,0,512,512]},player:{name:'我',size:[1024,1536],live:[280,0,490,712],avatar:[385,5,270,270]},xiaoxu:{name:'陈晴',size:[768,1152],live:[100,45,560,814],avatar:[292,80,240,240]}};
 function presentation(id,speaker,index,state={},cue=null){
  const actor=/^我(?:$|（)/.test(speaker)?'player':/^(?:陈晴|小许)/.test(speaker)?'xiaoxu':/^周伯.*消息/.test(speaker)?'zhou':null;if(!actor)return null;
  const channel=/消息/.test(speaker)?'message':'live';
  const travel=id==='continuationGoodbye'||state.phase==='arrival'&&!state.prologue?.bagPlaced||['depart','cave','return'].includes(state.phase);
  const named=String(cue||'').replace(actor==='player'?/^player-/:/^xiaoxu-/,'');const mood=(actor==='player'?['surprised','relieved','smile']:['normal','worried','smile']).includes(named)?named:actor==='xiaoxu'?(live[id]||messages[id]||[])[index]||'normal':'normal';
  return {actor,channel,mood,variant:actor==='player'&&!travel?(mood==='normal'?'indoor':'indoor-'+mood):'normal',speaking:true};
 }
 function mount(host){
  const portrait=document.createElement('figure');portrait.className='companion-portrait';portrait.hidden=true;
  const image=document.createElement('img');image.draggable=false;const label=document.createElement('figcaption');const body=document.createElement('span'),bodyImage=new Image();body.className='companion-body';body.hidden=true;body.setAttribute('aria-hidden','true');bodyImage.alt='';body.append(bodyImage);portrait.append(body,image,label);host.prepend(portrait);
  let current=null,source='',fallbackUsed=false;
  function syncFaceCrop(){
   const useBase=current?.actor==='player' && current.variant.startsWith('indoor-') && bodyImage.complete && bodyImage.naturalWidth>0;
   body.hidden=!useBase;
   image.style.clipPath=useBase?'inset(4.23177% 37.98828% 83.39844% 41.015625% round 7px)':'none';
  }
  bodyImage.onload=syncFaceCrop;
  bodyImage.onerror=syncFaceCrop;
  image.onerror=()=>{if(current?.actor==='zhou'){portrait.hidden=true;host.classList.remove('has-companion');return;}if(current&&!fallbackUsed){fallbackUsed=true;portrait.dataset.fallback='true';image.src='assets/campaign-2d/'+(current.actor==='player'?'traveler/'+(current.variant==='normal'?'normal':'indoor'):'xiaoxu/normal')+'.webp';return;}portrait.hidden=true;host.classList.remove('has-companion');};
  image.onload=()=>{if(current){portrait.hidden=false;host.classList.add('has-companion');}};
  return value=>{
   current=value;portrait.hidden=!value;host.classList.toggle('has-companion',!!value);host.classList.toggle('companion-message',value?.channel==='message');if(!value){body.hidden=true;return;}
   const actor=actors[value.actor],rect=value.channel==='message'?actor.avatar:actor.live,[x,y,w,h]=rect,[width,height]=actor.size;
   Object.assign(image.style,{left:-x/w*100+'%',top:-y/h*100+'%',width:width/w*100+'%',height:height/h*100+'%'});
   Object.assign(bodyImage.style,{left:image.style.left,top:image.style.top,width:image.style.width,height:image.style.height});const facial=value.actor==='player'&&value.variant.startsWith('indoor-');
   if(facial&&!bodyImage.hasAttribute('src'))bodyImage.src='assets/campaign-2d/traveler/indoor.webp';
   syncFaceCrop();
   image.alt=actor.name;portrait.classList.remove('listening');label.textContent=value.channel==='message'?'消息 · '+actor.name:'';
   const next=value.actor==='zhou'?'assets/campaign-2d/contest-0143/zhou-message.webp':'assets/campaign-2d/'+(value.actor==='player'?'traveler/'+value.variant:'xiaoxu/'+value.mood)+'.webp';
   if(source!==next||image.complete&&!image.naturalWidth){portrait.hidden=true;source=next;fallbackUsed=false;delete portrait.dataset.fallback;image.src=next;}
   portrait.dataset.actor=value.actor;portrait.dataset.mood=value.mood;portrait.dataset.channel=value.channel;
  };
 }
 const api={presentation,mount,actors};root.CompanionDialogue=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
