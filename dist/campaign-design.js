/* Purpose, peer conversation and a verifiable maintenance-path study. */
(function(root){
 'use strict';
 const practice={
  'workshop-dovetail-out':{name:'燕尾滑盖',action:'观察并拆开滑盖',resume:'接着拆开滑盖',focus:'joined',image:'dovetail',intro:'林岚拿来一只匣子。“这盖子往上拿不动。你转个面看看？”',joined:'斜面相扣，木钥在出口',open:'盖板离开，匣体仍在'},
  'workshop-dovetail-back':{name:'燕尾滑盖',action:'沿槽合回滑盖',resume:'接着合回滑盖',focus:'open',image:'dovetail',intro:'林岚把盖板递回来。“原来只往这头走。再试试合上？”',joined:'斜面相扣，木钥在出口',open:'盖板离开，匣体仍在'},
  'workshop-burr-six-back':{name:'六件鲁班锁',action:'拿起木条，复原鲁班锁',resume:'接着复原鲁班锁',focus:'open',image:'burr',intro:'林岚把六根木条拨到台灯下。“我早上拆的，装到最后一根又卡住了。你帮我看一眼？”',joined:'三对木条扣在中央',open:'六根木条的槽口各有不同'}
 };
 const goals={purpose:'从雨棚笔记里挑一个想解决的问题。',peer:'和林岚聊聊，让样机替你检验想法。','service-check':'拆检前置挡条样机，找出取销的阻挡。','service-choice':'把挡条安排到不占取销通路的位置。','service-build':'用侧置方案合回主接头。','service-test':'亲手验证侧置方案能取销、拆开。','service-review':'记下这次修改的理由。','workshop-dovetail-out':'看看燕尾匣的盖板能从哪里抽出。','workshop-dovetail-back':'沿斜槽合回盖板，再装木钥。','workshop-burr-six-back':'观察槽口，让六根木条合成一把锁。','workshop-reflection':'和林岚核对锁木顺序，把装配方向画下来。','design-ready':'把用途和维修条件收进下一页草图。'};
 function modelComparison(t){
  return '<div class="workshop-models">'+['joined','open'].map(state=>'<figure'+(t.focus===state?' class="current"':'')+'><img src="assets/workshop-models/'+t.image+'-'+state+'.webp" alt="" width="480" height="260"><figcaption>'+t[state]+'</figcaption></figure>').join('')+'</div>';
 }
 function render(c,ui){
  const {panel,back,act,choose,talk,start,notes,workshopPractice,workshopProgress,museumVisit}=ui;if(!goals[c.stage])return false;
  const returnButton=['收好记录，留在工坊',back];
  if(c.stage==='purpose'){
   const options=[['坐着换鞋，需要留多大座面？',()=>choose('comfort'),true],
    ['扫地时，怎么搬开？',()=>choose('moving')],['以后坏了，能不能只换座面？',()=>choose('repair')]];
   const intro=ui.firstChoice?'雨棚有人坐着换湿鞋。你翻出那页手记，先想想座面该留多大。':
    '你翻出那天在雨棚记的一页。做一张门口能用的小凳，哪件事要先想清楚？';
   panel('先想一件日常的事','<p>备赛第四周，记录本翻到一张空白草图。</p><p>'+intro+'</p>',
    [...(ui.firstChoice?options.slice(0,1):options),returnButton],'作品需求 · 从实际使用出发');
  }
  else if(c.stage==='peer')panel('工坊里的另一位参赛者','<p>你把“坐得下、搬得动、能拆修”写在草图上。同台练习的林岚看了一眼。</p><p>她也在准备新人组作品，手边留着一件检查维修通路的夹具。</p>',[['听听林岚怎么说',()=>talk('continuationPeer'),true],returnButton],'第四周 · 开放工坊');
  else if(c.stage==='service-check')panel('看得见，拿得出来吗？','<p>小销外侧有一根非承重挡条。销头没有藏起来，但它需要沿着自己的轴向退出。</p><p>先拆检这个教学样机。碰住只会停下，不会扣分；可以旋转、透视、求助或撤销。</p>',[[c.serviceRun?'接着拆检样机':'拿起前置挡条样机',()=>start('practice-service-access'),true],returnButton],'维修通路 · 检查原方案');
  else if(c.stage==='service-choice')panel('挡条留在哪里？','<p>原方案已经拆开：先移开挡条，才能取销。以后只是换座面，也要先卸掉它。</p><p>这根挡条不承重。夹具侧边留了另一处固定位置，可以让销头前方保持开放。</p>',[['把挡条固定在侧边，试试主接头',()=>act('continuation:side'),true],['重看原方案的记录',()=>panel('原方案 · 拆检记录','<p>拆检顺序：挡条上拔 → 小销退出 → 榫头上拔。</p><p>它能拆，但维修主接头前要多处理一件挡条。侧置方案要通过接下来的实际拆合验证。</p>',[['收好记录',()=>act('continuation:hub'),true]])],returnButton],'方案调整 · 不遮住取销方向');
  else if(c.stage==='service-build')panel('先验证合回','<p>挡条已经固定在夹具侧边，前槽空出来了。这次只操作主榫和小销。</p><div class="continuation-path"><span>① 主榫贴齐</span><span>② 小销固定</span></div><p>亲手合好，再检查它能不能顺利拆回。按主榫、小销的顺序来，想重试随时可以撤销。</p>',[[c.serviceBackRun?'继续合回侧置方案':'合回侧置方案',()=>start('practice-service-open-back'),true],returnButton],'方案验证 · 合得回');
  else if(c.stage==='service-test')panel('再验证拆修','<p>不卸侧边挡条，试试能不能把销和主榫拿出来。要是卡住，转一面看看是哪两块碰着了。</p>',[[c.serviceOutRun?'继续验证拆修':'取销，试着拆回',()=>start('practice-service-open-out'),true],returnButton],'方案验证 · 拆得开');
  else if(c.stage==='service-review')panel('在草图上留两笔','<p>小销和主榫并排放在台上，挡条还在夹具侧边。林岚把你的草图往前推了推。</p>',[['和林岚核对这次修改',()=>talk('continuationServiceReflection'),true],returnButton],'修改记录 · 亲手验证之后');
  else if(practice[c.stage]){
   const t=practice[c.stage];
   const resume=workshopProgress?.partial;
   const intro=resume?'<p class="finale-resume">上次'+workshopProgress.text+'，可以接着做。</p>':'<p>'+t.intro+'</p>';
   panel(t.name,intro+modelComparison(t),[[resume?t.resume:t.action,()=>start(c.stage),true],returnButton],'开放工坊 · 传统接点');
  }
  else if(c.stage==='workshop-reflection')panel('最后那根木条','<p>林岚把合好的鲁班锁转到台灯下，你翻开画过燕尾滑盖的那一页。</p>',[['和林岚聊聊',()=>talk('continuationWorkshopReflection'),true],returnButton],'开放工坊 · 把拆装画下来');
  else panel('今天的练习记好了','<div class="continuation-design-brief"><h3>第一份设计条件</h3><p>做一件有人会用的小家具。画图时先留出手能伸进去取销的位置，再标主板从哪边抽出来。</p></div><p>换鞋小凳、床边小几、桌上书架，选一件接着做。</p>',[['制作自己的参赛作品',()=>act('continuation:finale:begin'),true],...(museumVisit?[['参观榫卯文化博物馆',museumVisit]]:[]),...(c.workshopLegacy?[['补练燕尾与鲁班锁',workshopPractice]]:[]),returnButton,['翻开随行手记',notes]],'第四周 · 作品准备');
  return true;
 }
 const api={goals,render};root.CampaignDesign=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
