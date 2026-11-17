/* Fixed illustrated stages. Exploration never renders a miniature 3D object over a painting. */
(function(root){
 'use strict';
 const ART='assets/campaign-2d/',OLD='assets/story-modern/',Interludes=root.CampaignInterludes;
 function visual(s){const b=Interludes.beat(s);return b?{name:b.title,image:()=>b.image,frame:b.frame,night:!!b.night}: {...frames[s.frame],frame:s.frame,night:!day(s)};}
 const arrival=s=>s.phase==='arrival'&&s.prologue&&!s.prologue.legacy;
 const homeExit=s=>arrival(s)?'zhou-door':'room';
 const frames={
  'mountain-rain':{name:'溪桥村外 · 下山石阶',image:()=>ART+'mountain-rain.webp',exits:[['village','沿石阶下山']],objects:()=>[spot('frame:village','沿着灯光进村',.62,.54,.22,.27,()=>true)]},
  'zhou-door':{name:'亮灯的小屋 · 门前',image:()=>ART+'zhou-door-night.webp',exits:[['village','退回村口']],objects:s=>[spot(s.prologue?.invited?'enter-home':'knock-door',s.prologue?.invited?'主人答应了，进屋':'敲门问问',.51,.47,.22,.57,()=>true)]},
  village:{name:'溪桥村 · 村口',image:s=>ART+(day(s)?'village-day.webp':'village-night-unpacked.webp'),exits:s=>[[homeExit(s),'亮灯的小屋','往周伯家'],['shelter','村口雨棚','看看长凳'],['trail','屋旁石路','村后的小路']]},
  shelter:{name:'溪桥村 · 雨棚',image:s=>ART+benchPainting(s),exits:s=>[['village','回到村口'],[homeExit(s),arrival(s)?'亮灯的小屋':'周伯家']],objects:s=>[...(['return','bench'].includes(s.phase)?[spot('bench-timber','从旧库取回的木料',.22,.745,.24,.21)]:[]),spot('bench','雨棚长凳',.56,.7,.55,.28,()=>s.phase==='bench'||s.phase==='farewell'),...(outdoorZhou(s)?[spot('zhou','周伯',s.phase==='complete'?.68:.59,s.phase==='complete'?.55:.37,.18,.46,()=>s.phase==='farewell'&&!s.benchChecked)]:[])]},
  room:{name:'周伯家 · 木工作业角',image:s=>outdoorZhou(s)?SampleWideArt.emptyBase:s.prologue?.bagPlaced&&root.CampaignData.phases.indexOf(s.phase)<5?ART+(day(s)?'room-day-bag-01311.webp':'room-night-bag-01311.webp'):day(s)?SampleWideArt.dayBase:SampleWideArt.nightBase,exits:[['village','走出小屋']],objects:s=>arrival(s)&&!s.prologue.bagPlaced?[spot('put-bag','擦擦鞋，把包放下',.12,.86,.18,.24,()=>true)]:[
   ...(!outdoorZhou(s)?[spot('zhou','周伯',.18,.53,.21,.57,()=>['arrival','settle','morning','return'].includes(s.phase))]:[]),
   spot('frame:workbench','走近工作台',.57,.62,.45,.32),
   spot('straight','直榫样木',.425,.51,.105,.18,()=>s.phase==='learning'&&root.CampaignData.tasks.find(t=>!s.done.includes(t.id))?.object==='straight'),
   spot('lap',sampleCode(s,'lap')===3?'收好的半榫木条':'交叠的半榫',sampleCode(s,'lap')===3?.77:.534,sampleCode(s,'lap')===3?.53:.54,.14,.12,()=>s.phase==='learning'&&root.CampaignData.tasks.find(t=>!s.done.includes(t.id))?.object==='lap'),
   spot('pinned','带销样木',.65,.575,.105,.18,()=>s.phase==='learning'&&root.CampaignData.tasks.find(t=>!s.done.includes(t.id))?.object==='pinned'),
   spot('chair','修好的旧椅',.9,.56,.14,.27),spot('cup','热水和杯子',.07,.44,.1,.16),spot('tools','工具挂板',.64,.24,.31,.29)
  ]},
  trail:{name:'溪桥村 · 屋旁石路',image:()=>ART+'trail.webp',exits:[['village','回村口'],['store-door','石路尽头的旧库']],objects:()=>[]},
  'store-door':{name:'旧木料库 · 库门',image:s=>ART+(done(s,'mouth-latch')?'store-door-open-0139.webp':'store-door-closed-0139.webp'),exits:s=>done(s,'mouth-latch')?[['store-shallow','走进旧库'],['store-middle','料架那边'],['store-sky','天光石台']]:[],objects:s=>done(s,'mouth-latch')?[]:[spot('cave:mouth-latch','宽木钥与长门闩',.65,.51,.34,.23,()=>true)]},
  'store-shallow':{name:'旧木料库 · 浅洞',image:()=>ART+'cave-shallow.webp',exits:[['store-door','回到库门'],['store-middle','料架那边'],['store-sky','天光石台']],objects:()=>[
   spot('cave:route-case','燕尾滑盖 · 自选练习',.174,.267,.16,.19),spot('cave:folding-screen','锁肩搭接 · 自选练习',.247,.414,.24,.25),spot('cave:cabinet-knot','三件初锁 · 自选练习',.565,.476,.12,.21)
  ]},
  'store-middle':{name:'旧木料库 · 备用料架',image:s=>ART+(root.CampaignData.canReturn(s)?'cave-middle-collected.webp':done(s,'rack-frame')?'cave-middle-open.webp':'cave-middle.webp'),exits:[['store-door','回到库门'],['store-shallow','看看传习样件'],['store-sky','天光石台']],objects:s=>[
   spot('cave:narrow-latch','双销 · 自选练习',.16,.43,.18,.24),...(done(s,'rack-frame')?[root.CampaignData.canReturn(s)?spot('timber','替换料已收在小车上',.5,.59,.35,.22):spot('timber','浅布带绑好的替换料',.5,.57,.35,.25,()=>true)]:[spot('cave:rack-frame','备用料架的双扣',.5,.43,.35,.49,()=>true)])
  ]},
  'store-sky':{name:'旧木料库 · 天光储料区',image:s=>ART+(root.CampaignData.canReturn(s)?'cave-sky-loaded.webp':done(s,'stone-box')?'cave-sky-open.webp':'cave-sky.webp'),exits:[['store-middle','回到料架'],['store-shallow','看看传习样件'],['store-door','回到库门']],objects:s=>[
   ...(done(s,'stone-box')?[spot('sketch','长凳装配草图',.52,.61,.16,.15,()=>!root.CampaignData.canReturn(s))]:[spot('cave:stone-box','装草图的木匣',.38,.53,.26,.24,()=>true)]),spot('cave:exit-knot','六件鲁班锁 · 自选练习',.87,.32,.16,.2),spot('supplies','布带小车 · 取料返村',.86,.75,.26,.3,s=>root.CampaignData.canReturn(s))
  ]},
  workbench:{name:'周伯家 · 台前样木',image:s=>day(s)?SampleCloseArt.dayBase:SampleCloseArt.base,exits:[['room','放回桌上，看看屋里']],objects:s=>[
   spot('straight',s.done.length===3?'把直榫合回':'直榫样木',.215,.4,.23,.44,()=>s.phase==='learning'&&root.CampaignData.tasks.find(t=>!s.done.includes(t.id))?.object==='straight'),
   spot('lap',sampleCode(s,'lap')===3?'收好的半榫木条':'交叠的半榫',sampleCode(s,'lap')===3?.9:.51,sampleCode(s,'lap')===3?.275:.5,sampleCode(s,'lap')===3?.19:.31,sampleCode(s,'lap')===3?.24:.32,()=>s.phase==='learning'&&root.CampaignData.tasks.find(t=>!s.done.includes(t.id))?.object==='lap'),spot('pinned',s.done.length>=3?'穿销卯座 · 再练习':'带销样木',.79,.57,.23,.51,()=>s.phase==='learning'&&root.CampaignData.tasks.find(t=>!s.done.includes(t.id))?.object==='pinned')
  ]},
  'chair-detail':{name:'周伯家 · 椅子接头',image:s=>day(s)?ART+'chair-detail-day.webp':OLD+'chair-detail.webp',exits:[['room','退回屋里']],objects:()=>[]},
  'tools-detail':{name:'周伯家 · 工具角',image:()=>ART+'tools-context-0139.webp',exits:[['room','退回屋里'],['workbench','去试样木']],objects:()=>[]},
  'chair-seat':{name:'周伯家 · 坐一会儿',image:s=>day(s)?ART+(outdoorZhou(s)?'chair-rest-day-empty-0142.webp':'chair-rest-day-0142.webp'):ART+'chair-rest-night-0142.webp',exits:[['room','起身'],['workbench','起身去工作台']],objects:()=>[]},
  'bench-detail':{name:'村口雨棚 · 长凳接点',image:s=>ART+benchPainting(s),exits:[['shelter','退回雨棚']],objects:()=>[spot('bench','长凳的接点',.56,.7,.55,.28,()=>true)]},
  'bench-seat':{name:'村口雨棚 · 坐看雨后',image:()=>ART+'bench-seated-no-bag-01311.webp',exits:[['shelter','起身看看']],objects:()=>[]}
 };
 function day(s){return root.CampaignData.phases.indexOf(s.phase)>=4;}
 function done(s,id){return s.cave.completed.includes(id);}
 function benchDone(s){return ['farewell','complete'].includes(s.phase);}
 function benchFitted(s){
  const fitted=new Set();
  for(const move of s.runs.bench?.history||[]){if(move.kind==='insert')fitted.add(move.piece);else if(move.kind==='extract')fitted.delete(move.piece);}
  return fitted;
 }
 function benchPainting(s){
  if(s.phase==='complete')return 'shelter-seated-zhou-bag-01311.webp';
  if(benchDone(s))return 'shelter-complete-cart-bag-01311.webp';
  if(s.phase==='return')return 'shelter-wide-day-loaded.webp';
  if(s.phase!=='bench')return day(s)?'shelter-wide-day-empty.webp':'shelter-wide-night.webp';
  // Only the main, legally restored assembly changes the world; notebook replays are isolated.
  const fitted=benchFitted(s);
  const front=fitted.has('front-beam'),rear=fitted.has('rear-beam');
  if(front&&rear&&fitted.has('seat')){
   const left=fitted.has('left-pin'),right=fitted.has('right-pin');
   return left&&right?'shelter-wide-complete-cart.webp':left?'shelter-wide-left-pin.webp':right?'shelter-wide-right-pin.webp':'shelter-wide-seat.webp';
  }
  if(front&&rear)return 'shelter-wide-two-beams.webp';
  // Stable engine IDs use z=-.55 for front-beam, the far rail in this camera.
  return front?'shelter-wide-far-beam.webp':rear?'shelter-wide-near-beam.webp':'shelter-wide-day-loaded-zhou.webp';
 }
 function outdoorZhou(s){return ['bench','farewell','complete'].includes(s.phase);}
 function spot(id,label,x,y,w,h,primary=()=>false){return {id,label,x,y,w,h,primary};}
 const villageExits={'zhou-door':{x:.235,y:.49,arrow:'↗'},room:{x:.235,y:.49,arrow:'↗'},shelter:{x:.84,y:.66,arrow:'→'},trail:{x:.51,y:.75,arrow:'↙'}};
 // Arrows describe progression rather than labelling every destination as a return.
 const onwardRoutes={'mountain-rain':['village'],trail:['store-door'],'store-door':['store-shallow','store-middle','store-sky'],'store-shallow':['store-middle','store-sky'],'store-middle':['store-sky'],'tools-detail':['workbench']};
 function exitArrow(from,to){return from==='mountain-rain'?'↓':['chair-seat','bench-seat'].includes(from)?'↑':onwardRoutes[from]?.includes(to)?'→':'←';}
 const benchDetails={
  joint:{label:'两端承口',x:.36,y:.64,w:.12,h:.2,text:'凳架顶部留着敞口，接头能从上方落入。两端都要贴合，不能只顾一头。'},
  rails:{label:'横梁与座面',x:.52,y:.69,w:.26,h:.16,text:'两根横梁连接凳架，宽座板沿着梁肩滑入。这里留得舒展，两个人并排坐也不用挤。'},
  oldwood:{label:'靠墙的旧板',x:.84,y:.37,w:.12,h:.28,text:'换下来的旧座板靠在墙边。边缘已经磨圆，坏的部分拆下来，好木料还可以另作它用。'}
 };
 function benchRailsText(s){
  if(benchDone(s))return benchDetails.rails.text;
  if(s.phase==='bench'){
   const fitted=benchFitted(s),beams=Number(fitted.has('front-beam'))+Number(fitted.has('rear-beam'));
   if(beams===2&&fitted.has('seat'))return '座板已经贴齐。木销还没装全，先别坐；回到接点，把剩下的地方合稳。';
   if(beams===2)return '两根横梁已经连起凳架。座板还没合好，留出的长座面能让两个人并排歇脚。';
   if(beams===1)return '一根横梁已经落进承口。另一侧还空着，接着看看两端怎样贴合。';
  }
  return '座板还没装好，先别坐。留出的长座面能让两个人并排歇脚，连接两端凳架的横梁也要先合稳。';
 }
 function sampleCode(s,id){
  const removed=CampaignObjects.position(s,id).removed;
  return id==='straight'?Number(removed.includes('tenon')):id==='lap'?Number(removed.includes('lower'))+2*Number(removed.includes('upper')):removed.includes('tenon')?(removed.includes('pin')?2:3):Number(removed.includes('pin'));
 }
 function sampleLayers(s){
  if(!['room','workbench'].includes(s.frame))return [];
  const wide=s.frame==='room',art=wide?SampleWideArt.layers[day(s)?'day':'night']:SampleCloseArt.layers;
  const patches=wide?[...SampleWideArt.box]:[];
  for(const id of ['straight','lap','pinned'])for(const patch of art[id][sampleCode(s,id)])patches.push({...patch,sample:id});
  return patches.map(p=>({...p,kind:'sample'}));
 }
 function patchesFor(s){
  const narrative=Interludes.patches(s);if(narrative)return Interludes.beat(s)?.id==='overnight'?sampleLayers(s):narrative;
  const result=sampleLayers(s);function add(id,file,rect){if(done(s,id))result.push({path:ART+file,rect});}
  if(s.frame==='store-shallow'){
   add('route-case','cave-shallow-done.webp',[.1,.15,.27,.345]);add('folding-screen','cave-shallow-done.webp',[.11,.345,.39,.57]);add('cabinet-knot','cave-shallow-done.webp',[.51,.38,.61,.58]);
  }else if(s.frame==='store-middle')add('narrow-latch','cave-middle-optional.webp',[.11,.32,.235,.53]);
  else if(s.frame==='store-sky')add('exit-knot','cave-sky-optional.webp',[.825,.255,.92,.44]);
  return result;
 }
 function create(host,state,options){
  let enabled=false,presented=true,disposed=false,generation=0,currentImage='',currentKey='',requestedImage='',focusId=null,benchStudy=null,sitting=['chair-seat','bench-seat'].includes(state.frame);
  let pendingFocus=false,fieldId=null,transitioning=false,transitionTimer=null,loadingTimer=null;
  const stage=document.createElement('div');stage.className='illustrated-stage';
  const painting=document.createElement('div');painting.className='illustrated-painting';
  const img=document.createElement('img');img.className='illustrated-art';img.alt='';img.draggable=false;
  const paintedChanges=document.createElement('div');paintedChanges.className='illustrated-changes';paintedChanges.setAttribute('aria-hidden','true');
  const hotspots=document.createElement('div');hotspots.className='illustrated-hotspots';hotspots.setAttribute('aria-label','场景里的物件');
  const nav=document.createElement('nav');nav.className='illustrated-exits';nav.setAttribute('aria-label','去往其他场景');
  const routes=document.createElement('nav');routes.className='illustrated-routes';routes.setAttribute('aria-label','画面中的去向');
  const benchControls=document.createElement('div');benchControls.className='illustrated-bench-controls';benchControls.hidden=true;
  benchControls.innerHTML='<button type="button" data-bench-toggle aria-expanded="false">察看长凳结构 ＋</button><div class="bench-study-card" role="status" aria-live="polite" hidden><strong></strong><p></p><button type="button" data-bench-close>收起察看</button></div>';
  const benchMarks=document.createElement('div');benchMarks.className='illustrated-bench-marks';benchMarks.hidden=true;
  const caption=document.createElement('div');caption.className='illustrated-caption';caption.setAttribute('aria-live','polite');
  const fieldPanel=document.createElement('section');fieldPanel.className='field-note';fieldPanel.hidden=true;fieldPanel.setAttribute('aria-label','眼前的木作');
  fieldPanel.innerHTML='<h3 tabindex="-1"></h3><p data-field-look></p><p data-field-voice></p><small>已记入随行手记 · 随意看看即可</small><div><button data-field-study></button><button data-field-square hidden>拿起角尺靠一靠</button><button data-field-close>收起 · Esc</button></div>';
  const loading=document.createElement('div');loading.className='illustrated-loading';loading.textContent='走近看看…';loading.setAttribute('role','status');
  const error=document.createElement('div');error.className='illustrated-image-error';error.hidden=true;error.setAttribute('role','alert');
  error.innerHTML='<strong>这幅场景暂时没有载入</strong><p>进度已经保留，可以重试或返回主菜单。</p><button type="button" data-retry>重试图片</button><button type="button" data-menu>返回主菜单</button>';
  const outgoing=document.createElement('div');outgoing.className='illustrated-outgoing';outgoing.setAttribute('aria-hidden','true');
  const weather=JourneyWeather.create(painting);
  painting.append(img,paintedChanges,outgoing,hotspots,routes,benchMarks,benchControls,fieldPanel,caption,loading,error);stage.append(painting,nav);host.replaceChildren(stage);
  const drawExpression=root.CampaignExpression.mount(painting,'zhou');
  let cue=null;
  const cache=new Map(),pendingLoads=new Set();
  function load(path,retry=false){
   if(!retry&&cache.has(path))return cache.get(path);
   let job;
   job=new Promise((resolve,reject)=>{
    const i=new Image();let settled=false;
    const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);i.onload=i.onerror=null;pendingLoads.delete(cancel);if(error){if(cache.get(path)===job)cache.delete(path);i.removeAttribute('src');reject(error);}else resolve(i);};
    const cancel=()=>finish(new Error('Image cancelled: '+path));
    const timer=setTimeout(()=>finish(new Error('Image timed out: '+path)),15000);
    pendingLoads.add(cancel);i.onload=()=>finish();i.onerror=()=>finish(new Error('Image unavailable: '+path));i.src=path+(retry?'?retry='+Date.now():'');
   });
   cache.set(path,job);return job;
  }
  function finishTransition(){clearTimeout(transitionTimer);transitioning=false;outgoing.replaceChildren();outgoing.classList.remove('fading');toggle();restoreSceneFocus();options.visualReady?.();}
  async function showImage(path,retry=false){
   const changes=patchesFor(state),key=JSON.stringify([path,changes]),token=++generation;requestedImage=key;loading.hidden=false;loading.classList.add('delayed');error.hidden=true;caption.textContent='';
   clearTimeout(loadingTimer);loadingTimer=setTimeout(()=>loading.classList.remove('delayed'),220);toggle();
   try{
    const [resource,...layers]=await Promise.all([load(path,retry),...changes.map(c=>load(c.path,retry))]);
    await Promise.all([resource,...layers].map(i=>i.decode?i.decode():Promise.resolve()));
    if(disposed||token!==generation)return;
    if(key!==JSON.stringify([visual(state).image(state),patchesFor(state)])){requestedImage='';sync();return;}
    finishTransition();
    const animate=currentImage&&presented&&!state.settings.reducedMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(animate){outgoing.append(img.cloneNode(),paintedChanges.cloneNode(true));transitioning=true;}
    img.src=resource.src;img.alt=visual(state).name+'，二维绘制场景';
    paintedChanges.replaceChildren(...layers.map((image,i)=>{const layer=document.createElement('img'),r=changes[i].rect;layer.src=image.src;layer.alt='';if(changes[i].placement){const [x,y,w,h]=changes[i].placement;Object.assign(layer.style,{inset:'auto',left:x*100+'%',top:y*100+'%',width:w*100+'%',height:h*100+'%',objectFit:changes[i].kind==='sample'?'fill':'contain'});layer.dataset.paintedProp=changes[i].kind||'backpack';if(changes[i].sample)layer.dataset.sample=changes[i].sample;return layer;}layer.style.clipPath='inset('+(r[1]*100)+'% '+((1-r[2])*100)+'% '+((1-r[3])*100)+'% '+(r[0]*100)+'%)';return layer;}));
    currentImage=path;currentKey=key;requestedImage='';clearTimeout(loadingTimer);loading.hidden=true;
    if(animate){void outgoing.offsetWidth;outgoing.classList.add('fading');transitionTimer=setTimeout(finishTransition,340);}
    toggle();restoreSceneFocus();preload();options.visualReady?.();
   }catch(e){if(disposed||token!==generation)return;requestedImage='';clearTimeout(loadingTimer);loading.hidden=true;error.hidden=false;caption.textContent='';finishTransition();toggle();restoreSceneFocus(true);options.imageError?.(e);options.visualReady?.();}
  }
  function exits(){const v=frames[state.frame].exits;return typeof v==='function'?v(state):v;}
  function preload(){for(const [id]of exits()){if(root.CampaignData.canEnterFrame(state,id))load(frames[id].image(state)).catch(()=>{});}}
  function toggle(){
   const shown=presented&&loading.hidden&&error.hidden&&!transitioning&&!root.CampaignContinuation.away(state);
   const paused=!enabled||!shown;
   for(const el of [hotspots,nav,routes,benchControls,benchMarks,fieldPanel])el.inert=paused;
   stage.classList.toggle('input-paused',paused);
   stage.classList.toggle('image-pending',!loading.hidden||transitioning||!error.hidden);
   weather.set({frame:visual(state).frame==='bench-detail'?'shelter':visual(state).frame,visible:shown&&visual(state).night,reduced:state.settings.reducedMotion});
   drawExpression(shown&&/room-(table-night-[0-4]|night|night-bag-01311)\.webp$/.test(currentImage)?cue:null);
  }
  function restoreSceneFocus(failed=false){
   if(!pendingFocus||!enabled||!presented||!failed&&(!loading.hidden||transitioning))return;
   // A hidden close-up control must not keep keyboard focus after returning to the painting.
   // A visible menu/header control, however, remains the player's deliberate destination.
   if(document.activeElement!==document.body&&!stage.contains(document.activeElement)&&document.activeElement?.getClientRects().length){pendingFocus=false;return;}
   const target=failed?error.querySelector('[data-retry]'):(!fieldPanel.hidden?fieldPanel.querySelector('[data-field-close]'):null)||hotspots.querySelector('.current')||nav.querySelector('.current:not(:disabled)')||routes.querySelector('.current:not(:disabled)')||routes.querySelector('button:not(:disabled)')||nav.querySelector('button:not(:disabled)')||hotspots.querySelector('button');
   target?.focus({preventScroll:true});pendingFocus=false;
  }
  function go(id){
   if(!enabled||transitioning||!loading.hidden||!error.hidden||!root.CampaignData.canEnterFrame(state,id)){options.notice?.(id==='store-door'?'先和周伯说好，再去旧库。':'先看看眼前的接点。');return false;}
   if(id==='store-door'&&state.phase==='depart'){options.interact('trail');return true;}
   if(arrival(state)){if(state.frame==='mountain-rain'&&id==='village')state.prologue.stage='village';if(id==='room'&&state.prologue.invited&&!state.prologue.bagPlaced)state.prologue.stage='indoors';}
   pendingFocus=true;state.frame=id;benchStudy=null;sitting=['chair-seat','bench-seat'].includes(id);options.change?.(id);sync();options.arrived?.(id);requestAnimationFrame(()=>restoreSceneFocus());return true;
  }
  function select(item){if(!enabled||transitioning||!error.hidden||!loading.hidden)return;focusId=item.id;if(item.id.startsWith('frame:'))go(item.id.slice(6));else options.interact(item.id);}
  function sync(){
   if(disposed)return;if(!frames[state.frame]||!root.CampaignData.canEnterFrame(state,state.frame))state.frame=root.CampaignData.defaultFrame(state);
   const f=frames[state.frame],v=visual(state);stage.dataset.frame=v.frame;stage.dataset.light=v.night?'night':'day';stage.classList.toggle('is-interlude',!!Interludes.beat(state));
   const previous=document.activeElement?.dataset.hotspot;
   const observations=root.CampaignFieldNotes.available(state)?root.CampaignFieldNotes.at(state.frame).map(e=>spot('observe:'+e.id,e.name,e.x,e.y,e.w,e.h)):[];
   hotspots.replaceChildren(...[...(f.objects?.(state)||[]),...observations].map(item=>{
    const b=document.createElement('button');b.type='button';b.className='illustrated-hotspot';b.dataset.hotspot=item.id;b.setAttribute('aria-label',item.label);b.style.left=(item.x*100)+'%';b.style.top=(item.y*100)+'%';b.style.width=(item.w*100)+'%';b.style.height=(item.h*100)+'%';
    const primary=item.primary(state);b.classList.toggle('current',primary);const completed=item.id.startsWith('cave:')&&done(state,item.id.slice(5));b.classList.toggle('experienced',completed);b.innerHTML='<span class="hotspot-mark" aria-hidden="true">'+(completed?'✓':primary?'◆':'·')+'</span><span class="hotspot-name"></span>';b.querySelector('.hotspot-name').textContent=item.label;
    if(item.id.startsWith('observe:')){b.classList.add('field-hotspot');b.classList.toggle('experienced',state.fieldNotes.includes(item.id.slice(8)));b.setAttribute('aria-expanded',String(fieldId===item.id.slice(8)));}
    // Keep the name by its object, without a duplicate caption.
    b.onmouseenter=()=>{};b.onmouseleave=()=>{};b.onfocus=()=>{focusId=item.id;};b.onblur=()=>{};b.onclick=()=>select(item);return b;
   }));
   routes.replaceChildren();nav.replaceChildren();
   const nextRoute=root.CampaignFlow.nextExit(state,frames,root.CampaignData.canEnterFrame);
   for(const [id,text]of exits()){
    const b=document.createElement('button'),point=state.frame==='village'?villageExits[id]:null;b.type='button';b.dataset.exit=id;b.disabled=!root.CampaignData.canEnterFrame(state,id);b.onclick=()=>go(id);
    if(point){b.className='illustrated-route';b.style.left=point.x*100+'%';b.style.top=point.y*100+'%';b.innerHTML='<span class="route-arrow" aria-hidden="true"></span><span class="route-label"></span>';b.querySelector('.route-arrow').textContent=point.arrow;b.querySelector('.route-label').textContent=['room','zhou-door'].includes(id)?(day(state)?'周伯家':'亮灯的小屋'):id==='shelter'?'村口雨棚':b.disabled?'石路 · 明早再去':'屋旁石路';b.setAttribute('aria-label','前往'+b.querySelector('.route-label').textContent+(b.disabled?'，暂未开放':''));routes.append(b);}
    else{b.textContent=exitArrow(state.frame,id)+' '+text;nav.append(b);}
    b.classList.toggle('current',id===nextRoute);if(id===nextRoute)b.setAttribute('aria-description','通往当前事项；也可以先看看别处。');
   }
   nav.classList.toggle('picture-navigation',state.frame==='village');
   if(state.frame==='room'&&state.phase==='night'){const b=document.createElement('button');b.type='button';b.className='current rest-route';b.dataset.hotspot='rest';b.textContent='去里间休息 →';b.onclick=()=>enabled&&options.interact('rest');nav.append(b);}
   benchControls.hidden=state.frame!=='shelter';if(state.frame!=='shelter')benchStudy=null;showBenchStudy();
   if(root.CampaignFieldNotes.find(fieldId)?.frame!==state.frame)fieldId=null;showField();
   const back=state.frame.startsWith('store-')&&root.CampaignData.canReturn(state);if(back){const b=document.createElement('button');b.type='button';b.className='return-materials current';b.dataset.hotspot='supplies';b.textContent='取好木料，回村 →';b.onclick=()=>enabled&&options.interact('supplies');nav.append(b);}
   const path=v.image(state),key=JSON.stringify([path,patchesFor(state)]);if(key!==currentKey){if(key!==requestedImage)showImage(path);}else{generation++;requestedImage='';loading.hidden=true;error.hidden=true;toggle();}
   if(previous){const b=[...hotspots.querySelectorAll('button')].find(b=>b.dataset.hotspot===previous);if(b)b.focus({preventScroll:true});else{pendingFocus=true;restoreSceneFocus();}}
  }
  function showField(){
   for(const b of hotspots.querySelectorAll('.field-hotspot')){b.setAttribute('aria-expanded',String(b.dataset.hotspot==='observe:'+fieldId));b.classList.toggle('experienced',state.fieldNotes.includes(b.dataset.hotspot.slice(8)));}
   const entry=root.CampaignFieldNotes.find(fieldId);fieldPanel.hidden=!entry;if(!entry)return;
   fieldPanel.querySelector('h3').textContent=entry.name;fieldPanel.querySelector('[data-field-look]').textContent=entry.look;
   const voice=fieldPanel.querySelector('[data-field-voice]');voice.hidden=outdoorZhou(state);voice.textContent='周伯：'+entry.voice;
   const study=fieldPanel.querySelector('[data-field-study]');study.hidden=!entry.level;
   study.textContent=entry.level==='chair-rail-joint'?'试试椅腿和横枨 ↗':entry.level==='offcut-corner-lap'?'拆合这对宽木料 ↗':'看看同形接头 ↗';
   fieldPanel.querySelector('[data-field-square]').hidden=entry.interaction!=='square';
  }
  function inspectField(id){
   const entry=root.CampaignFieldNotes.find(id);if(!entry||entry.frame!==state.frame||!root.CampaignFieldNotes.available(state)||!enabled||!presented||!error.hidden||!loading.hidden)return false;
   fieldId=id;if(!state.fieldNotes.includes(id))state.fieldNotes.push(id);showField();fieldPanel.querySelector('h3').focus({preventScroll:true});return true;
  }
  function closeField(){const id=fieldId;fieldId=null;showField();[...hotspots.querySelectorAll('button')].find(b=>b.dataset.hotspot==='observe:'+id)?.focus({preventScroll:true});}
  fieldPanel.querySelector('[data-field-close]').onclick=closeField;
  fieldPanel.querySelector('[data-field-study]').onclick=()=>options.interact('field-study:'+fieldId);
  fieldPanel.querySelector('[data-field-square]').onclick=()=>options.interact('square-check');
  function showBenchStudy(){
   const expanded=!!benchStudy,info=benchDetails[benchStudy];benchMarks.hidden=!expanded;benchMarks.replaceChildren();benchControls.querySelector('[data-bench-toggle]').setAttribute('aria-expanded',String(expanded));benchControls.querySelector('[data-bench-toggle]').textContent=expanded?'收起结构察看 −':'察看长凳结构 ＋';benchControls.querySelector('.bench-study-card').hidden=!expanded;
   if(!expanded)return;
   benchControls.querySelector('strong').textContent=info.label;benchControls.querySelector('p').textContent=benchStudy==='rails'?benchRailsText(state):info.text;
   for(const [id,d]of Object.entries(benchDetails)){const b=document.createElement('button');b.type='button';b.dataset.benchPart=id;b.className='bench-part'+(id===benchStudy?' selected':'');b.style.left=d.x*100+'%';b.style.top=d.y*100+'%';b.style.width=d.w*100+'%';b.style.height=d.h*100+'%';const label=document.createElement('span');label.textContent=d.label;b.append(label);b.setAttribute('aria-pressed',String(id===benchStudy));b.onclick=()=>inspectBench(id);benchMarks.append(b);}
  }
  function inspectBench(id='joint'){if(!enabled||!presented||state.frame!=='shelter'||!error.hidden||!loading.hidden)return false;benchStudy=benchDetails[id]?id:'joint';showBenchStudy();benchMarks.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});return true;}
  benchControls.querySelector('[data-bench-toggle]').onclick=()=>{if(benchStudy){benchStudy=null;showBenchStudy();}else inspectBench();};
  benchControls.querySelector('[data-bench-close]').onclick=()=>{benchStudy=null;showBenchStudy();benchControls.querySelector('[data-bench-toggle]').focus();};
  function hints(e){if(e.code!=='KeyH'||e.target.matches('input,textarea,select')||!enabled)return;stage.classList.toggle('show-hotspots',e.type==='keydown');}
  function clear(){stage.classList.remove('show-hotspots');}
  function moveFocus(e){
   if(!enabled||!presented||!error.hidden||!loading.hidden||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   const buttons=[...stage.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length&&!b.closest('[hidden]'));
   const index=buttons.indexOf(document.activeElement);if(index<0)return;
   e.preventDefault();const step=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;
   buttons[(index+step+buttons.length)%buttons.length]?.focus({preventScroll:true});
  }
  stage.addEventListener('keydown',moveFocus);
  document.addEventListener('keydown',hints);document.addEventListener('keyup',hints);window.addEventListener('blur',clear);
  error.querySelector('[data-retry]').onclick=()=>{pendingFocus=true;showImage(visual(state).image(state),true);};error.querySelector('[data-menu]').onclick=()=>options.menu?.();
  sync();
  return {
   expression(value){cue=value;toggle();},
   retry(){showImage(visual(state).image(state),true);},refocus(){pendingFocus=true;restoreSceneFocus();},sync,go,inspectBench,inspectField,closeField,enable(value){enabled=!!value;if(!enabled)clear();toggle();},present(value){presented=!!value;stage.hidden=!presented;if(!presented)finishTransition();toggle();},quality(){if(state.settings.reducedMotion)finishTransition();toggle();},
   sit(value,kind){sitting=!!value;const next=value?(kind==='chair'?'chair-seat':'bench-seat'):state.frame==='chair-seat'?'room':state.frame==='bench-seat'?'shelter':null;if(next&&root.CampaignData.canEnterFrame(state,next)){state.frame=next;options.change?.(next);sync();}},
   snapshot(){return {available:true,illustrated:true,frame:state.frame,image:currentImage,loading:!loading.hidden||transitioning,weather:weather.snapshot(),inventory:Object.fromEntries(['straight','lap','pinned'].map(id=>[id,CampaignObjects.position(state,id)])),imageError:!error.hidden,displayFrame:visual(state).frame,sitting,benchStudy,fieldId,target:focusId,hotspots:[...hotspots.children].map(b=>b.dataset.hotspot),enabled};},
   dispose(){disposed=true;generation++;clearTimeout(transitionTimer);clearTimeout(loadingTimer);weather.dispose();pendingLoads.forEach(cancel=>cancel());pendingLoads.clear();cache.clear();document.removeEventListener('keydown',hints);document.removeEventListener('keyup',hints);window.removeEventListener('blur',clear);stage.removeEventListener('keydown',moveFocus);stage.remove();}
  };
 }
 root.CampaignIllustrated={create,frames};
})(window);
