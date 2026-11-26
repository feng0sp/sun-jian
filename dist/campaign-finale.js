/* The production, exhibition and fixed narrative result have independent proofs. */
(function(root){
 'use strict';
 const Furniture=typeof module!=='undefined'?require('./entry-furniture.js'):root.EntryFurniture;
 const Awards=typeof module!=='undefined'?require('./campaign-awards.js'):root.CampaignAwards;
 const specs={
  'entry-stool-assemble':{slot:'entryRun',mode:'assemble',stage:'entry-build',name:'备赛 · 做成自己的作品'},
  'contest-assemble':{slot:'contestRun',mode:'assemble',stage:'contest-build',name:'新人组 · 现场装配'},
  'contest-service-out':{slot:'serviceDemoRun',mode:'dismantle',stage:'contest-service-out',name:'现场演示 · 单独拆换主板'},
  'contest-service-back':{slot:'serviceReturnRun',mode:'assemble',stage:'contest-service-back',name:'现场演示 · 复装主板'}
 };
 const fresh=()=>({productionStarted:false,workChoice:null,entryRun:null,contestRun:null,serviceDemoRun:null,serviceReturnRun:null,inspected:[],recordsReady:false,packed:false,arrivalSeen:false,contestRegistered:false,presented:false,judged:false,resultSeen:false,endingSeen:false,prepPhotoSeen:false,judgeMet:false,awardStep:0,rewardRecorded:false});
 const choice=c=>Furniture.find(c.workChoice);
 function proof(c,slot,P,E){const t=Object.values(specs).find(t=>t.slot===slot),r=c[slot],w=choice(c);return w&&t&&r?.level===w.id&&r.mode===t.mode?E.restoreSession(JSON.stringify(r),P):null;}
 const done=(c,slot,P,E)=>!!proof(c,slot,P,E)?.completed;
 function restore(c,v,P,E){
  Object.assign(c,fresh());if(!c.designReviewed)return;
  c.productionStarted=v.productionStarted===true;c.workChoice=Furniture.find(v.workChoice)?.key||null;if(!c.productionStarted||!c.workChoice)return;
  for(const [slot,dependency]of [['entryRun',null],['contestRun','entryRun'],['serviceDemoRun','contestRun'],['serviceReturnRun','serviceDemoRun']]){
   if(dependency&&!done(c,dependency,P,E))continue;const candidate={...c,[slot]:v[slot]},legal=proof(candidate,slot,P,E);if(legal)c[slot]={version:1,level:choice(c).id,mode:legal.mode,history:legal.history,trial:legal.trial,action:'extract',guideId:'entry-three-v1'};
  }
  c.inspected=done(c,'entryRun',P,E)?['panel','moving','service'].filter(k=>v.inspected?.includes(k)):[];
  c.recordsReady=c.inspected.length===3&&v.recordsReady===true;c.packed=c.recordsReady&&v.packed===true;c.arrivalSeen=c.packed&&v.arrivalSeen===true;c.contestRegistered=c.arrivalSeen&&v.contestRegistered===true;
  c.presented=c.contestRegistered&&done(c,'contestRun',P,E)&&done(c,'serviceDemoRun',P,E)&&done(c,'serviceReturnRun',P,E)&&v.presented===true;
  c.judged=c.presented&&v.judged===true;c.resultSeen=c.judged&&v.resultSeen===true;c.endingSeen=c.resultSeen&&v.endingSeen===true;
  c.prepPhotoSeen=c.packed||v.prepPhotoSeen===true;c.judgeMet=done(c,'contestRun',P,E)&&(v.judgeMet===true||v.revision<5&&!!c.serviceDemoRun);c.awardStep=c.resultSeen?4:c.judged&&Number.isInteger(v.awardStep)?Math.max(0,Math.min(3,v.awardStep)):0;c.rewardRecorded=c.judged&&(c.resultSeen||c.awardStep>=2);
 }
 function stage(c,P,E){
  if(!c.productionStarted)return 'design-ready';if(!choice(c))return 'work-choice';if(!done(c,'entryRun',P,E))return 'entry-build';if(!c.recordsReady)return 'entry-review';if(!c.packed)return 'packing';if(!c.arrivalSeen)return 'contest-arrival';if(!c.contestRegistered)return 'contest-register';if(!done(c,'contestRun',P,E))return 'contest-build';if(!done(c,'serviceDemoRun',P,E))return 'contest-service-out';if(!done(c,'serviceReturnRun',P,E))return 'contest-service-back';if(!c.presented)return 'contest-records';if(!c.judged)return 'contest-review';if(!c.resultSeen)return 'results';if(!c.endingSeen)return 'after-award';return 'ending';
 }
 const goals={'work-choice':'挑一件真正想做、也有人会用的作品。','entry-build':'① 合入主板，再②装两枚侧销。','entry-review':'检查主板、搬动位置和取销口，记下协助范围。',packing:'把作品保护好，带上过程记录，去省城。','contest-arrival':'作品和记录都到了，先到新人组展位。','contest-register':'向工作人员说明作品和加工协助。','contest-build':'按记录完成现场装配。','contest-service-out':'先取两销，再退出主板，展示维修通路。','contest-service-back':'合回主板与两销，完成局部维修演示。','contest-records':'把过程记录交给评审，说明自己的修改。','contest-review':'检查完成了，去看看同组的其他作品。',results:'听听新人组的结果与评语。','after-award':'和林岚交换试用心得，再给周伯发个消息。',ending:'第三名已经记下，下一页继续学。'};
 function task(c,id){const t=specs[id],w=choice(c);if(!w||!t)return null;const out=t.mode==='dismantle';return {...t,id,level:w.id,extension:true,finale:true,name:t.name+' · '+w.name,goal:out?'①取下两侧木销 → ②退出'+w.panel:'①合入'+w.panel+' → ②装两枚侧销',opening:out?'框架保持原位。先取两销，再把'+w.panel+'沿滑槽退出。':'框架由工坊协助预装。先合'+w.panel+'，两枚木销任意先后。',locationLabel:id.startsWith('entry-')?'开放工坊 · '+w.name:'省城交流赛 · 新人组',surface:id.startsWith('entry-')?'workshop':'contest',completion:{title:out?'维修的路，确实留出来了':id==='entry-stool-assemble'?'这次，是自己的作品':'接面贴齐了',text:out?'两枚侧销和'+w.panel+'已取下，支撑框架没有拆动。接着把它合回。':id==='entry-stool-assemble'?'把'+w.name+'转着看看，再记录主板、搬动位置和取销口。':id==='contest-assemble'?'作品已在现场合好。接下来演示怎样单独更换'+w.panel+'。':'主板和侧销已经重新贴齐。请工作人员检查，再交上过程记录。'}};}
 const nodes={
  continuationFinalArrival:{lines:[['旁白','第十周。交流厅里有人铺开草图，有人还在给木件擦灰。林岚在展位旁向你招手。'],['林岚','这边，你的位置挨着我。'],['我','看见认识的人，踏实多了。','player-relieved'],['林岚','我也一样。先把东西摆出来，别一直抱着记录本。']],action:'continuation:finale:arrived',last:'放好作品，到新人组登记'},
  continuationFinalJudge:{lines:[],action:'continuation:finale:demo',last:'拿起作品，演示给评审看'},
  continuationPrepPhoto:{lines:[['我（消息）','周伯，装好了。我把侧面也拍了一张。'],['周伯（消息）','这回看得清。销头留在外头，下回就好取。'],['我（消息）','嗯，拆修也试过了。下星期带去比赛。'],['周伯（消息）','去吧。带上自己的记录，慢慢说，别慌。']],action:'continuation:finale:photo-noted',last:'收好手机，准备出发'},
  continuationFinalRecords:{lines:[['我','在村里修凳子时，周伯指着两头的凳架说，好着呢，留着。我画这件的时候，也先想哪部分能留。'],['评审','刚才我看你直接就捏到销头了。草图上这个箭头，是往这边取？'],['我','对。料和框架是工坊帮我做的。我自己拆合了几遍，把顺序补在后面这张纸上。'],['评审','好，有这几张，我回头也能照着试。作品先放这儿，我再看看接缝。']],action:'continuation:finale:presented',last:'交上记录，让工作人员检查'},
  continuationFinalResult:{lines:[['工作人员','新人组第三名——{name}，作品《{work}》！'],['旁白','你愣了一拍，手里的记录本差点没合上。林岚笑着向台上指了指。'],['我','叫的是我啊。','player-surprised']],action:'continuation:finale:award:stage',last:'走上领奖台'},
  continuationFinalAfter:{lines:[],action:'continuation:finale:zhou',last:'给周伯发个消息'},
  continuationFinalZhou:{lines:[['我（消息）','周伯，第三名！证书刚拿到。','player-smile','你把证书和领奖合影发了过去。'],['周伯（消息）','我看见照片了。第三名啊，恭喜你！'],['我（消息）','还有三千块奖金。下次回村，我想请您吃顿饭。','player-smile'],['周伯（消息）','好啊，等你回来，咱们一起吃顿饭。作品要是方便带，我也想看看实物。'],['我（消息）','行，我带过来。评审说有两处缝还得修。拆装的图我也带上，周六能请来学的人照着试一次吗？','player-relieved'],['周伯（消息）','行。先让他们试。你别急着伸手，他们卡住了，你就问这回是哪两块碰上了。']],action:'continuation:finale:ending',last:'把今天记进手记'},
  continuationFinalMemory:{lines:[],action:'continuation:hub',last:'回到作品旁'},
 };
 const nodeStages={continuationPrepPhoto:'packing',continuationFinalResult:'results',continuationFinalMemory:'ending',continuationFinalArrival:'contest-arrival',continuationFinalJudge:'contest-service-out',continuationFinalRecords:'contest-records',continuationFinalAfter:'after-award',continuationFinalZhou:'after-award'};
 function allowed(id,s){return s.phase==='complete'&&s.continuation?.active&&s.continuation.stage===nodeStages[id];}
 function afterLines(w){
  const use={
   stool:[['林岚','我能试一下吗？刚才光顾着看拆装了。'],['我','能，工作人员检查过了。你弯腰够够鞋带。','player-smile'],['林岚','够得着。两只脚也都能踩着地。']],
   table:[['林岚','我把杯子和本子都放上去，看看够不够？'],['我','放吧。我在家就老是腾不出这点地方。','player-smile'],['林岚','行，合上本子也不用先挪杯子。']],
   shelf:[['林岚','这几本也能立着放？我试试。'],['我','常翻的留在这边，够起来顺手。','player-smile'],['林岚','这本能直接拿出来，边上那几本还站得住。']]
  }[w.key];
  return [...use,['我','还没祝贺你呢，第二名。','player-smile'],['林岚','谢谢！你也来看看我的吧？合起来还有个角我拿不准。']];
 }
 function resolve(id,s){if(!allowed(id,s))return null;const c=s.continuation,w=choice(c),n=nodes[id];if(!w||!n)return null;let lines=id==='continuationFinalAfter'?afterLines(w):id==='continuationFinalMemory'?[...afterLines(w),...nodes.continuationFinalZhou.lines]:n.lines;
  if(id==='continuationFinalJudge'){
   const reason=w.key==='stool'?'在溪桥帮忙修了一条凳子。有个人来换湿鞋，才坐下就能腾出两只手。我回去也想做一张，放在门口。':w.key==='table'?'我睡前看完书，水杯和书都往床沿上放。有回一翻身，杯子就下去了。我想在手边放个小几。':'我要找的书老在那一摞最底下。抽一本倒一片，就想让常翻的几本立起来放。';
   lines=[['评审','小伙子，你是{name}同学？'],['我','对，这是我做的{work}。'],['评审','怎么想到做这个？'],['我',reason],['评审','我看看这块板。要是哪天磕坏了，从哪边拆？'],['我','这两根销先取下来。您看，我拆一遍。','player-relieved']];
  }
  if(id==='continuationFinalZhou'&&c.museum?.introduced){
   lines=lines.map((line,index)=>index===4?[line[0],'展馆那张维修图上有两支箭头。我也画了取销和退板。周六带回去，请来学的人照着试试？',line[2]]:line);
  }
  return {...n,lines:lines.map(line=>line.map((v,i)=>i===1?String(v).replaceAll('{name}',Awards.name(s.playerName)).replaceAll('{work}',w.name):v))};
 }
 function action(c,id,P,E){const s=stage(c,P,E);
  if(id.startsWith('award:')&&s==='results'){const a=id.slice(6),step=c.awardStep||0;if(a==='stage'&&step===0)c.awardStep=1;else if(a==='receive'&&step===1||a==='skip'&&step<2){c.awardStep=2;c.rewardRecorded=true;}else if(a==='photo'&&step===2)c.awardStep=3;else if(a==='return'&&step===3){c.awardStep=4;c.resultSeen=true;}else return false;return true;}
  if(id==='begin'&&c.designReviewed){c.productionStarted=true;c.resting=false;return true;}
  if(id.startsWith('choose:')&&['work-choice','entry-build','entry-review','packing'].includes(s)&&!c.packed){const w=Furniture.find(id.slice(7));if(!w)return false;Object.assign(c,fresh(),{productionStarted:true,workChoice:w.key,resting:false});return true;}
  if(id.startsWith('inspect:')&&s==='entry-review'){const k=id.slice(8);if(['panel','moving','service'].includes(k)&&!c.inspected.includes(k))c.inspected.push(k);return true;}
  if(id==='records'&&s==='entry-review'&&c.inspected.length===3)c.recordsReady=true;
  else if(id==='photo-noted'&&s==='packing')c.prepPhotoSeen=true;
  else if(id==='pack'&&s==='packing')c.packed=true;
  else if(id==='arrived'&&s==='contest-arrival')c.arrivalSeen=true;
  else if(id==='register'&&s==='contest-register')c.contestRegistered=true;
  else if(id==='presented'&&s==='contest-records')c.presented=true;
  else if(id==='judged'&&s==='contest-review')c.judged=true;
  else if(id==='result'&&s==='results'&&c.awardStep>=3){c.resultSeen=true;c.awardStep=4;c.rewardRecorded=true;}
  else if(id==='ending'&&s==='after-award')c.endingSeen=true;
  else return false;return true;
 }
 const labels={panel:'主板接面',moving:'搬动位置',service:'取销通路'};
 function recordText(c){const w=choice(c);return w?'<h3>'+w.name+' · 三份过程记录</h3><p>第四周：从使用出发，记下“'+w.use+'”</p><p>第五至六周：拆检挡条样机，给取销和主板进出留出通路。</p><p>第七至八周：亲手合好'+w.panel+'和两枚侧销，复核'+w.review+'。</p>'+
  (c.museum?.introduced&&c.inspected.includes('service')?'<p>给以后修理的人留两支箭头。先从销帽这一面抽出两销，再把'+w.panel+'沿槽滑出。</p>':'')+
  '<p>协助说明：用途、修改判断与关键装配由我参与；工坊协助加工及框架预装，周伯提供学习指导。</p>':'';}
 function render(c,ui,P,E){const s=stage(c,P,E);if(!goals[s])return false;const {panel:rawPanel,act,talk,start,back,notes,menu,rehearse}=ui,w=choice(c),current=Object.values(specs).find(t=>t.stage===s),saved=current&&proof(c,current.slot,P,E),count=saved?(current.mode==='assemble'?3-saved.removed.length:saved.removed.length):0,panel=(title,html,buttons,kicker)=>rawPanel(title,html+(saved&&!saved.completed?'<p class="finale-resume">上次'+(current.mode==='assemble'?'已装好 ':'已取下 ')+count+' / 3。操作特写会保留每件当前位置，接着做即可。</p>':''),buttons,kicker),b=['暂时收好，保留进度',back];
  const change=ui.changeChoice?[['修改作品选择',ui.changeChoice]]:[];
  if(s==='work-choice'){
   const choices=ui.firstChoice?Furniture.choices.slice(0,1):Furniture.choices;
   const intro=ui.firstChoice?'第五周。把样机收在一旁，翻开受雨棚长凳启发的换鞋小凳草图。':
    '第五周。把样机收在一旁，翻开自己的图纸。雨棚让我想到门口的换鞋凳。这种留出维修通路的做法，也能用在我的床边或书桌。三件中选定一件，把它做完整。';
   panel('这次，做一件自己想用的','<p>'+intro+'</p><div class="finale-options">'+choices.map(x=>'<article><h3>'+x.name+'</h3><p>'+x.use+'</p><small>宽主板＋两枚侧销 · 框架预装</small></article>').join('')+'</div>',
    [...choices.map(x=>['选择'+x.name,()=>act('choose:'+x.key),ui.firstChoice]),b],ui.firstChoice?'备赛 · 选章试玩':'参赛作品 · 三选一');
  }
  else if(s==='entry-build')panel('从图纸到'+w.name,'<p>第七周。工坊按共同核对的图纸加工好构件、预装支撑架。你负责把主板合入，检查取销与拆换的通路。</p><div class="continuation-path"><span>① '+w.panel+'</span><span>② 左右侧销，任意先后</span></div>',[[c.entryRun?'继续装配作品':'拿起自己的散件',()=>start('entry-stool-assemble'),true],...(ui.changeChoice?[['返回作品选择',ui.changeChoice]]:[]),b],'备赛 · '+w.name);
  else if(s==='entry-review')panel('亲手合好，还要看三处','<p>第八周。装配已完成，把这三项逐一核对，记录才有具体的内容。已查看 '+c.inspected.length+' / 3。</p><div class="finale-checks">'+Object.entries(labels).map(([k,name])=>'<p><b>'+(c.inspected.includes(k)?'✓ ':'○ ')+name+'</b>：'+(k==='panel'?'主板的肩面已贴齐，沿面看看有没有错位。':k==='moving'?'拿起固定框架附近的握持处，不抓可拆的侧销。':'销帽露在侧面，前方没有挡条，主板也有退出的空间。')+'</p>').join('')+'</div>'+recordText(c),[...Object.entries(labels).map(([k,name])=>[(c.inspected.includes(k)?'✓ ':'查看 · ')+name,()=>act('inspect:'+k)]),...(c.inspected.length===3?[['收好三项检查与协助记录',()=>act('records'),true]]:[]),...change,b],'工坊 · 装配后复核');
  else if(s==='packing')panel('把作品带到省城','<p>第九周。工坊完成使用检查。你把装配顺序又看了一遍。林岚发来消息，说她的作品也装箱了。</p><p>运输前按图收好'+w.panel+'与两枚侧销，包住支撑架和接面。过程记录放在最上层。到场后再亲手装配。</p>',[...(c.prepPhotoSeen?[['包好散件与记录，出发',()=>act('pack'),true]]:[['给周伯发张成品照片',()=>talk('continuationPrepPhoto'),true]]),['重看过程记录',notes],...change,b],'赴赛准备 · '+w.name);
  else if(s==='contest-arrival')talk('continuationFinalArrival');
  else if(s==='contest-register')panel('新人组 · 作品登记','<p>工作人员核对作品、过程记录，以及工坊加工协助。参赛人：'+Awards.escape(Awards.name(ui.playerName))+'。作品：'+w.name+'。</p><p>这次展示“'+w.use+'”现场完成关键装配，再演示怎样单独更换'+w.panel+'。</p><p class="muted">使用手记、提示、撤销不扣名次。没有倒计时。</p>',[['核对记录，登记作品',()=>act('register'),true],['查看自己的记录',notes],b],'省城 · 第十周');
  else if(s==='contest-build')panel('把自己的作品摆出来','<p>支撑架已经摆稳。保护套收在台边，'+w.panel+'和两枚侧销按记录排好。沿用练习时的顺序，先给大件留路。</p>',[['现场装配'+w.name,()=>start('contest-assemble'),true],['看一眼过程记录',notes],b],'省城 · 新人组展台');
  else if(s==='contest-service-out')panel('如果只换这一块','<p>评审看向'+w.panel+'。接下来只拆主板和两枚侧销，支撑框架保持原样。</p>',[...(c.judgeMet?[['继续演示取销与退出主板',()=>start('contest-service-out'),true]]:[['和评审聊聊这件作品',()=>talk('continuationFinalJudge'),true]]),['查看自己的记录',notes],b],'维护演示 · 手记随时可看');
  else if(s==='contest-service-back')panel('让作品重新完整','<p>主板已经退出，两枚侧销收在托盘。框架没有拆动。按原来的路把'+w.panel+'合回，再固定侧销。</p>',[['合回'+w.panel+'与两枚侧销',()=>start('contest-service-back'),true],b],'维护演示 · 复装');
  else if(s==='contest-records')panel('把修改的来由讲清楚',recordText(c),[['交上记录，说明这次修改',()=>talk('continuationFinalRecords'),true],b],'现场说明 · 实际完成之后');
  else if(s==='contest-review')panel('趁这会儿，看看别人的作品','<p>工作人员检查过装配与使用状态，示意可以收好工具。你和林岚沿展示台看过去。</p><p>一件收纳架的接缝处理得很齐；林岚演示她的折叠件，这次手指终于不必绕着找位置。你把想问的两处记在本子上。</p>',[['看完展台，回到公布结果的地方',()=>act('judged'),true],['先记下这次的观察',notes],b],'观展 · 可直接继续');
  else if(s==='results')Awards.render(c,{...ui,work:w});
  else if(s==='after-award')talk('continuationFinalAfter');
  else panel('第三名，还有下一页','<p>你把证书夹进本子，合影也收好了。周伯的消息还停在手机上。你翻了翻刚收到的合影，觉得得挑一张洗出来带给他。</p><p>'+w.name+'还放在身边，等着带回去用。你在手记里补上侧销的方向。下次回溪桥，准备把这一页摊在传习屋的桌上。</p><p class="muted">从一场雨开始的这段旅程，就记到这里。</p>',[['再看看作品',()=>ui.stay(),true],['回看领奖与报喜',ui.recap],['展开获奖证书',ui.certificate],['看看领奖合影',ui.photo],['旅行笔记',notes],['重练自己的作品',rehearse],['主菜单',menu]],'第三名 · 还有下次');
  return true;
 }
 function art(c,P,E){const w=choice(c);if(!w)return null;if(c.stage==='results'&&c.awardStep>=1&&c.awardStep<=3)return 'assets/campaign-2d/contest-0143/award-stage.webp';const built=c.packed&&done(c,'contestRun',P,E)&&(!done(c,'serviceDemoRun',P,E)||done(c,'serviceReturnRun',P,E));return 'assets/campaign-2d/contest-014/'+w.key+'-'+(c.packed?built?'contest-built':'contest':done(c,'entryRun',P,E)?'workshop':'workshop-loose')+'.webp';}
 const api={fresh,choice,proof,done,restore,stage,goals,specs,task,nodes,allowed,resolve,action,render,recordText,art};root.CampaignFinale=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
