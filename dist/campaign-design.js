/* Purpose, peer conversation and a verifiable maintenance-path study. */
(function(root){
 'use strict';
 const goals={purpose:'想清楚小凳给谁用、摆在哪里。',peer:'和林岚聊聊，让样机替你检验想法。','service-check':'拆检前置挡条样机，找出取销的阻挡。','service-choice':'把挡条安排到不占取销通路的位置。','service-build':'用侧置方案合回主接头。','service-test':'亲手验证侧置方案能取销、拆开。','service-review':'记下这次修改的理由。','design-ready':'把用途和维修条件收进下一页草图。'};
 function render(c,ui){
  const {panel,back,act,choose,talk,start,notes}=ui;if(!goals[c.stage])return false;
  const returnButton=['收好记录，留在工坊',back];
  if(c.stage==='purpose')panel('先想一件日常的事','<p>备赛的第四周，记录本翻到一张空白草图。先不用想着把所有接头都放进去。</p><p>小许发来消息，门口正缺一张换鞋小凳。你打算先问问哪件事？</p><p class="muted">从任何一项开始，都能得到完整的用途条件，不用逐项找齐。</p>',[['坐着换鞋，需要留多大座面？',()=>choose('comfort'),true],['扫地时，怎么搬开？',()=>choose('moving')],['以后坏了，能不能只换座面？',()=>choose('repair')],returnButton],'作品需求 · 做给谁用');
  else if(c.stage==='peer')panel('工坊里的另一位参赛者','<p>你把“坐得下、搬得动、能拆修”写在草图上。同台练习的林岚看了一眼。</p><p>她也在准备新人组作品，手边留着一件检查维修通路的夹具。</p>',[['听听林岚怎么说',()=>talk('continuationPeer'),true],returnButton],'第四周 · 开放工坊');
  else if(c.stage==='service-check')panel('看得见，拿得出来吗？','<p>小销外侧有一根非承重挡条。销头没有藏起来，但它需要沿着自己的轴向退出。</p><p>先拆检这个教学样机。碰住只会停下，不会扣分；可以旋转、透视、求助或撤销。</p>',[[c.serviceRun?'接着拆检样机':'拿起前置挡条样机',()=>start('practice-service-access'),true],returnButton],'维修通路 · 检查原方案');
  else if(c.stage==='service-choice')panel('挡条留在哪里？','<p>原方案已经拆开：先移开挡条，才能取销。以后只是换座面，也要先卸掉它。</p><p>这根挡条不承重。夹具侧边留了另一处固定位置，可以让销头前方保持开放。</p>',[['把挡条固定在侧边，试试主接头',()=>act('continuation:side'),true],['重看原方案的记录',()=>panel('原方案 · 拆检记录','<p>拆检顺序：挡条上拔 → 小销退出 → 榫头上拔。</p><p>它能拆，但维修主接头前要多处理一件挡条。侧置方案要通过接下来的实际拆合验证。</p>',[['收好记录',()=>act('continuation:hub'),true]])],returnButton],'方案调整 · 不遮住取销方向');
  else if(c.stage==='service-build')panel('先验证合回','<p>挡条已经固定在夹具侧边，前槽空出来了。这次只操作主榫和小销。</p><div class="continuation-path"><span>① 主榫贴齐</span><span>② 小销固定</span></div><p>亲手合好，再检查它能不能顺利拆回。按主榫、小销的顺序来，想重试随时可以撤销。</p>',[[c.serviceBackRun?'继续合回侧置方案':'合回侧置方案',()=>start('practice-service-open-back'),true],returnButton],'方案验证 · 合得回');
  else if(c.stage==='service-test')panel('再验证拆修','<p>刚才的装配已经完成。现在看看，不卸侧边挡条，能不能直接取销、更换主件。</p><p>从刚才那两根小销开始。遇到不顺的地方，停下来转着看看。</p>',[[c.serviceOutRun?'继续验证拆修':'取销，试着拆回',()=>start('practice-service-open-out'),true],returnButton],'方案验证 · 拆得开');
  else if(c.stage==='service-review')panel('把理由留在草图上','<p>侧边挡条留在原位，小销和主榫都已经取下。维修通路确实空出来了。</p><p>林岚收好自己的本子，等你把这次的修改记完。</p>',[['和林岚核对这次修改',()=>talk('continuationServiceReflection'),true],returnButton],'修改记录 · 亲手验证之后');
  else panel('今天的练习记好了','<div class="continuation-design-brief"><h3>换鞋小凳 · 第一份设计条件</h3><p>用途：玄关换鞋，座面留够空间。<br>使用：扫地时便于搬开。<br>维护：木销能直接取出，更换座面不用先拆无关挡件。</p><p>样机验证：前置挡条拆检、侧置后合回、侧置后拆修均已完成。</p></div><p>把这次学到的维修关系用在自己的作品里。下一步，从换鞋小凳、床边小几、桌上书架中选一件。</p>',[['制作自己的参赛作品',()=>act('continuation:finale:begin'),true],['收好记录，留在工坊',back],['翻开随行手记',notes]],'第四周 · 作品准备');
  return true;
 }
 const api={goals,render};root.CampaignDesign=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
