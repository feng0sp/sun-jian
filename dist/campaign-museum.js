/* The museum is an illustrated visit with optional, separately saved replica sessions. */
(function(root) {
 'use strict';
 if(typeof module!=='undefined')require('./museum-puzzle.js');
 const art='assets/museum/';
 const landmarks=[
  {
   id:'hemudu',name:'河姆渡梁头榫',era:'新石器时代 · 木构考古',box:[23,27,16,18],
   text:'河姆渡出土的这段木梁，两端留下了不同形状的榫头。展出的木构件记录了早期建筑如何将木材接在一起。',
   captions:['梁头榫全形。两端削出的部分原本要进入别的构件。','一端较扁，另一端留下方形榫头。','以单端模拟对接。邻件按照榫头形状示意。'],
   source:'中国国家博物馆 · 河姆渡文化发现50周年考古成果特展',
   url:'https://www.chnmuseum.cn/portals/0/web/zt/202311hmdwh/',
   level:'museum-hemudu-beam',memory:'宽榫肩贴在卯座外，真正插进盲卯的是里侧削窄的一段。'
  },
  {
   id:'dougong',name:'斗栱',era:'古代建筑 · 木构营造',box:[43.5,24,16.5,23],
   text:'柱头上的斗托住横展的栱。小斗和栱层层接合，让柱与上方梁架之间有了逐层承托的位置。',
   captions:['缩尺斗栱示意。下方立柱与上面的横材之间有几层承托。','认出底下的斗、横出的栱和两端的小斗。','提起上层横材与小斗，露出它们在下层的位置。'],
   source:'北京市文物局 · 北京古代建筑博物馆的清代斗栱拆装演示',
   url:'https://wwj.beijing.gov.cn/bjww/362679/362680/482911/603896/index.html',
   level:'museum-dougong',memory:'上梁由两侧横材承托，再往下依次传到小斗、横栱、底斗和立柱。'
  },
  {
   id:'clamp',name:'夹头榫',era:'明式家具 · 案角',box:[63.4,25,13.7,22],
   text:'案腿上端开豁口夹住牙条，腿顶的榫再进入案面边框。桌面、牙条和案腿在这里接成一处。',
   captions:['从案角同时看见案面、牙条和腿足。','案腿上的豁口夹住牙条缩窄的端头。','先抬案面，牙条才有向上退出的空间。'],
   source:'上海博物馆 · 明黄花梨木夹头榫画案',
   url:'https://www.shanghaimuseum.net/mu/frontend/pg/article/id/CI00004825',
   level:'museum-clamp-apron', memory:'腿上的豁口夹着牙条。案面抬开，它才有向上退出的路。'
  },
  {
   id:'corner',name:'粽角榫',era:'传统家具 · 桌角',box:[81,25,14.3,22],
   text:'两根桌面边框和一条腿在角上相接。三条接缝聚在同一角，顺着外棱能找到这处接头。',
   captions:['桌角的两条边框和腿足相会。','沿边框转角看相交的斜面与接缝。','两根边框各沿长向抽离，露出腿足上朝向不同的卯。'],
   source:'故宫博物院 · 紫檀平角条桌',
   url:'https://www.dpm.org.cn/collection/gear/230428.html',
   level:'museum-miter-corner',memory:'斜面让边框在角上贴齐，两根边框仍各沿自己的方向进腿足。'
  },
  {
   id:'chair',name:'椅架直榫',era:'传统家具 · 椅腿和横枨',box:[16.1,54.3,17.8,25.9],
   text:'横枨把两条椅腿连在一起。外面能看见贴着椅腿的榫肩，横枨端部伸入腿侧的卯眼。',
   captions:['整把椅子里，横枨位于座面下方。','把视线移到一端，找椅腿和横枨贴合的那条线。','沿横枨长向分开，原来藏在椅腿里的榫头露了出来。'],
   source:'故宫博物院 · 紫檀木雕竹节纹椅的修复与研究',
   url:'https://www.dpm.org.cn/explode/others/262465.html',
   level:'chair-rail-joint',memory:'横枨的榫头藏在腿里，外面露出的榫肩贴住椅腿。'
  },
  {
   id:'dovetail',name:'滑动燕尾',era:'传统接合原理 · 滑盖教具',box:[39.3,55.6,16.7,23.2],
   text:'斜槽下面宽、上面窄，盖板从上方抬不出来，却可以沿着槽滑动。示教匣用一枚木钥挡住出口。',
   captions:['盖板合在斜槽里，木钥留在滑动出口。','从槽口看斜面如何扣住盖板。','先取下木钥，再沿敞口抽出盖板。'],
   source:'中国国家博物馆 · 河姆渡出土木榫卯的结构分类',
   url:'https://www.chnmuseum.cn/portals/0/web/zt/202311hmdwh/',
   level:'dovetail',memory:'斜面限制盖板上拔，木钥挡住沿槽滑出的那一端。'
  },
  {
   id:'sliding-pin',name:'走马销',era:'传统家具 · 滑移扣接',box:[64,55.6,16.9,23.2],
   text:'销头从宽口进入，顺着槽移到窄处后被槽沿扣住。要取下相连的木件，得先滑回宽口。',
   captions:['滑板的销头藏在窄槽底下，左边是教具加设的限位木块。','移开木块，让销头沿槽退向宽口。','教学槽的宽口开到板边。滑板退出后，可以看见下宽上窄的销头。'],
   source:'故宫博物院 · 紫檀木雕竹节纹椅的修复与研究',
   url:'https://www.dpm.org.cn/explode/others/262465.html',
   level:'museum-sliding-pin',memory:'窄槽扣住宽销头，退到宽口才有取下的空间。教具在板边留了出口。'
  },
  {
   id:'burr',name:'六件鲁班锁',era:'传统益智木作 · 六子连方',box:[86.1,54.5,18.2,25.6],
   text:'六根木条分成三对。中央槽口叠在一起，外表平整成形。动一根之前，需要看它给另一根留下了多少空间。',
   captions:['合成一体时，可以从外面数出三对木条。','从另一面看中央槽口的交叠。','六根木条分开展示，比较各自的缺口。'],
   source:'中国科技馆 · “榫卯的魅力”主题展览',
   url:'https://www.cstm.org.cn/dqzl/zlhg/art/2020/art_1c4bf4d894a14c7aa5e5e28f2c2d4cb8.html',
   level:'burr-six',memory:'木条互相挡住，拆前先找能让其他木条活动的那一根。'
  }
 ];
 const preservation=[
  {name:'中国传统木结构营造技艺',text:'联合国教科文组织在 2009 年将这项营造技艺列入人类非物质文化遗产代表作名录。师徒在实际营造和修缮中传下判断、试配与装配的方法。',url:'https://ich.unesco.org/en/RL/chinese-traditional-architectural-craftsmanship-for-timber-framed-structures-00223'},
  {name:'让更多人上手',text:'武汉市文化和旅游局报道，沈邦汉在市群众艺术馆面向公众开课。学员从测量、画图练到做茶几，每做完一件还能听老师讲哪里要改。',url:'https://wlj.wuhan.gov.cn/zwgk_27/zwdt/xydt/202205/t20220510_1968643.shtml'}
 ];
 const diagrams=['whole','joint','apart'];
 const find=id=>landmarks.find(item=>item.id===id);
 const fresh=()=>({introduced:false,passed:false,visit:null,last:null,viewed:[],learned:[],runs:{}});
 function restore(value,P,E){
  const museum=fresh();
  if(!value||typeof value!=='object')return museum;
  museum.introduced=value.introduced===true;
  museum.passed=value.passed===true;
  const known=list=>Array.isArray(list)?[...new Set(list.filter(id=>find(id)))]:[];
  museum.viewed=known(value.viewed);
  museum.learned=known(value.learned).filter(id=>find(id).level&&museum.viewed.includes(id));
  museum.last=find(value.last)?.id||null;
  const visit=value.visit;
  if(visit&&['story','notes','menu-notes','review','workshop'].includes(visit.from)){
   museum.visit={from:visit.from,exhibit:find(visit.exhibit)?.id||null,
    diagram:diagrams.includes(visit.diagram)?visit.diagram:'whole'};
  }
  for(const item of landmarks.filter(item=>item.level)){
   const run=value.runs?.[item.id];
   if(!run||run.level!==item.level)continue;
   const legal=E.restoreSession(JSON.stringify(run),P);
   if(legal)museum.runs[item.id]={...run,history:legal.history,trial:legal.trial};
  }
  return museum;
 }
 function task(museum,id,P,E){
  const item=find(id),level=P.LEVELS.find(candidate=>candidate.id===item?.level);
  if(!level)return null;
  const run=museum.runs[id],legal=run&&E.restoreSession(JSON.stringify(run),P);
  const mode=!legal?'dismantle':legal.completed?(run.mode==='dismantle'?'assemble':'dismantle'):run.mode;
  const label=!legal?'动手拆开复原件':legal.completed?(mode==='assemble'?'试着合回复原件':'再拆一次复原件'):
   (mode==='assemble'?'接着合回复原件':'接着拆开复原件');
  return {id:'museum-replica:'+id+':'+mode,museumReplica:id,level:item.level,mode,label,surface:'museum',
   name:'教学复原件 · '+item.name,locationLabel:'榫卯文化博物馆 · 教学桌',opening:item.memory,
   goal:mode==='dismantle'?level.goal:'观察榫头和槽口，把取下的木件沿打开时的路径合回。',
   completion:{title:mode==='dismantle'?'接点露出来了':'复原件合好了',text:item.memory}};
 }
 function notes(museum){
  return museum.viewed.map(id=>{
   const item=find(id);
   return {name:item.name,text:museum.learned.includes(id)?item.memory:item.text,worked:museum.learned.includes(id)};
  });
 }
 function create(host,actions){
  host.innerHTML=`
  <section class="museum-gallery" aria-label="榫卯文化博物馆展厅">
   <div class="museum-painting" tabindex="-1" role="group" aria-label="点选展品或展台上的名称">
    <img class="museum-art" width="1672" height="941" alt="木构展厅里，八件展品摆在前后两排展台上">
    <div class="museum-hotspots"></div>
    <div class="museum-image-status" hidden role="status">展厅图暂时没载入。仍可从展品名称进入。<button type="button" data-museum-retry>重试展厅图</button></div>
   </div>
   <div class="museum-navigation">
    <button type="button" data-museum-sources>展览与传习资料</button>
    <span class="museum-progress"></span>
    <button type="button" class="primary" data-museum-leave>离馆，去选作品 →</button>
   </div>
  </section>
  <section class="museum-detail" hidden aria-label="展品近看">
   <div class="museum-detail-image">
    <figure>
     <img width="1000" height="680" alt="">
     <div class="museum-figure-error" hidden role="status">结构图暂时没载入。<button type="button" data-museum-figure-retry>重试结构图</button></div>
     <figcaption></figcaption>
    </figure>
    <div class="museum-tabs" aria-label="观察角度">
     <button type="button" data-museum-diagram="whole">看整件</button>
     <button type="button" data-museum-diagram="joint">看接点</button>
     <button type="button" data-museum-diagram="apart">分解示意</button>
    </div>
   </div>
   <article class="museum-plaque">
    <p class="museum-era"></p><h2></h2><p class="museum-description"></p>
    <p class="museum-credit"></p>
    <details><summary>研究来源</summary><p class="museum-source"></p><p class="museum-url"></p></details>
    <div class="museum-detail-actions">
     <button type="button" class="primary" data-museum-replica hidden></button>
     <button type="button" data-museum-return>← 回到展厅</button>
    </div>
   </article>
  </section>`;
  const at=selector=>host.querySelector(selector);
  const gallery=at('.museum-gallery'), detail=at('.museum-detail');
  const painting=at('.museum-painting'), artImage=at('.museum-art');
  const progress=at('.museum-progress');
  const figure=at('.museum-detail-image img'), figureError=at('.museum-figure-error');
  const replicaButton=at('[data-museum-replica]'), leave=at('[data-museum-leave]');
  const tabs=[...host.querySelectorAll('[data-museum-diagram]')];
  const buttons=new Map();
  let enabled=false, current=null, previousView='', picture='';
  const click=handler=>event=>{if(enabled&&event.detail<2)handler();};
  for(const item of landmarks){
   const [x,y,width,height]=item.box;
   const button=document.createElement('button');
   button.type='button';button.className='museum-hotspot';button.dataset.museumExhibit=item.id;
   button.setAttribute('aria-label','查看'+item.name);
   Object.assign(button.style,{left:x+'%',top:y+'%',width:width+'%',height:height+'%'});
   const name=document.createElement('span');name.textContent=item.name;
   const arrow=document.createElement('i');arrow.setAttribute('aria-hidden','true');arrow.textContent='›';
   name.append(arrow);button.append(name);button.onclick=click(()=>actions.look(item.id));
   buttons.set(item.id,button);at('.museum-hotspots').append(button);
  }
  const imageStatus=at('.museum-image-status');
  artImage.onerror=()=>{imageStatus.hidden=false;painting.classList.add('missing-art');};
  artImage.onload=()=>{imageStatus.hidden=true;painting.classList.remove('missing-art');};
  at('[data-museum-retry]').onclick=click(()=>{artImage.src=art+'gallery.webp?retry='+Date.now();});
  figure.onerror=()=>{figureError.hidden=false;figure.hidden=true;};
  figure.onload=()=>{figureError.hidden=true;figure.hidden=false;};
  at('[data-museum-figure-retry]').onclick=click(()=>{figure.src=picture+'?retry='+Date.now();});
  at('[data-museum-return]').onclick=click(actions.back);
  at('[data-museum-sources]').onclick=click(actions.sources);
  leave.onclick=click(actions.leave);
  replicaButton.onclick=click(()=>{if(current)actions.play(current.id);});
  for(const tab of tabs)tab.onclick=click(()=>actions.diagram(tab.dataset.museumDiagram));
  function sync(museum,visible,interactive,getTask){
   host.hidden=!visible;
   enabled=visible&&interactive;
   host.inert=!enabled;
   if(!enabled)painting.classList.remove('show-museum-hotspots');
   if(!visible)return;
   if(!artImage.hasAttribute('src'))artImage.src=art+'gallery.webp';
   current=find(museum.visit?.exhibit)||null;
   gallery.hidden=!!current;detail.hidden=!current;
   leave.textContent=museum.visit?.from==='story'?'离馆，去选作品 →':'结束回访 →';
   progress.textContent='八件均可拆装 · 已动手 '+museum.learned.length+' / '+landmarks.length;
   for(const [id,button] of buttons)button.classList.toggle('visited',museum.viewed.includes(id));
   if(!current){previousView='';return;}
   const mode=museum.visit.diagram;
   const nextPicture=art+current.id+'-'+mode+'.webp';
   if(nextPicture!==picture){
    picture=nextPicture;figure.hidden=false;figureError.hidden=true;
    figure.alt=current.name+' · '+tabs[diagrams.indexOf(mode)].textContent;figure.src=picture;
    at('figcaption').textContent=current.captions[diagrams.indexOf(mode)];
   }
   for(const tab of tabs)tab.setAttribute('aria-pressed',String(tab.dataset.museumDiagram===mode));
   if(current.id!==previousView){
    previousView=current.id;
    at('.museum-era').textContent=current.era;
    at('.museum-plaque h2').textContent=current.name;
    at('.museum-description').textContent=current.text;
    at('.museum-credit').textContent='原创结构示意 · '+(current.level?'另有教学复原件':'展柜观察');
    at('.museum-source').textContent=current.source;
    at('.museum-url').textContent=current.url;
    at('.museum-plaque details').open=false;
   }
   const available=getTask(current.id);
   replicaButton.hidden=!available;
   if(available)replicaButton.textContent=available.label;
  }
  function focus(id){
   if(!enabled)return;
   const target=current?at('[data-museum-return]'):buttons.get(id)||painting;
   target.focus({preventScroll:true});
  }
  function reveal(show){painting.classList.toggle('show-museum-hotspots',enabled&&!current&&show);}
  return {sync,focus,reveal};
 }
 const api={landmarks,diagrams,find,fresh,restore,task,notes,preservation,create};
 root.CampaignMuseum=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
