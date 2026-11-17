/* The next chapter is independent of the certified village histories. */
(function(root){
 'use strict';
 if(typeof module!=='undefined')require('./service-puzzle.js');
 const F=typeof module!=='undefined'?require('./campaign-finale.js'):root.CampaignFinale;
 const stages=['meetup','notice','goodbye','home','practice','review','registered','purpose','peer','service-check','service-choice','service-build','service-test','service-review','design-ready',...Object.keys(F.goals)];
 const fresh=()=>({...F.fresh(),revision:5,zhouContact:false,departurePrepared:false,goodbyeSeen:false,resting:false,reviewingFirstAct:false,rehearsals:{},designStarted:false,purpose:null,purposeChoice:null,peerMet:false,serviceRun:null,variant:null,serviceBackRun:null,serviceOutRun:null,designReviewed:false,active:false,started:false,noticeSeen:false,departed:false,workshopSeen:false,reviewed:false,entryAccepted:false,run:null,stage:'meetup'});
 function legalRun(c,P,E){const r=c?.run;return r?.level==='pinned'&&r.mode==='assemble'?E.restoreSession(JSON.stringify(r),P):null;}
 function restore(v,eligible,P,E){
  const c=fresh();if(!eligible||!v||![1,2,3,4,5].includes(v.revision)||v.started!==true)return c;
  c.started=true;c.active=v.active===true;c.noticeSeen=v.noticeSeen===true;c.departed=c.noticeSeen&&v.departed===true;c.workshopSeen=c.departed&&v.workshopSeen===true;
  c.goodbyeSeen=c.departed||v.goodbyeSeen===true;c.departurePrepared=c.goodbyeSeen||c.noticeSeen&&v.departurePrepared===true;c.reviewingFirstAct=v.reviewingFirstAct===true;
  c.zhouContact=c.departed||v.zhouContact===true;
  const legal=c.workshopSeen&&legalRun(v,P,E);if(legal)c.run={version:1,level:'pinned',mode:'assemble',action:'extract',history:legal.history,trial:legal.trial};
  c.reviewed=!!legal?.completed&&v.reviewed===true;c.entryAccepted=c.reviewed&&v.entryAccepted===true;
  c.designStarted=c.entryAccepted&&v.designStarted===true;
  c.purposeChoice=['comfort','moving','repair'].includes(v.purposeChoice)?v.purposeChoice:null;
  c.purpose=c.designStarted&&['comfort','moving','repair'].includes(v.purpose)?v.purpose:null;c.peerMet=!!c.purpose&&v.peerMet===true;
  for(const [slot,level,mode]of [['serviceRun','service-access-closed','dismantle'],['serviceBackRun','service-access-open','assemble'],['serviceOutRun','service-access-open','dismantle']]){
   if(!c.peerMet||slot!=='serviceRun'&&(!done(c,'serviceRun',P,E)||v.variant!=='side')||slot==='serviceOutRun'&&!done(c,'serviceBackRun',P,E))continue;
   const r=v[slot],ok=r?.level===level&&r.mode===mode&&E.restoreSession(JSON.stringify(r),P);if(ok)c[slot]={version:1,level,mode,action:'extract',history:ok.history,trial:ok.trial};
  }
  c.variant=done(c,'serviceRun',P,E)&&v.variant==='side'?'side':null;
  c.designReviewed=done(c,'serviceOutRun',P,E)&&v.designReviewed===true;c.stage=stage(c,P,E);c.resting=c.workshopSeen&&(v.resting===true||v.revision<3&&c.stage==='design-ready');if(v.revision<3&&c.workshopSeen)c.active=true;
  F.restore(c,v,P,E);c.stage=stage(c,P,E);
  for(const [slot,level,mode]of [['run','pinned','assemble'],...Object.values(serviceTasks).map(t=>[t.slot,t.level,t.mode]),...Object.entries(F.specs).map(([id,t])=>[t.slot,F.choice(c)?.id,t.mode])]){const r=v.rehearsals?.[slot],ok=!!r&&!!level&&r.level===level&&r.mode===mode&&E.restoreSession(JSON.stringify(r),P);if(ok)c.rehearsals[slot]={...r,history:ok.history,trial:ok.trial};}
  return c;
 }
 const serviceTasks={
  'practice-service-access':{slot:'serviceRun',level:'service-access-closed',mode:'dismantle',name:'维修通路 · 先找被挡住的出口',goal:'观察销帽前的挡条，拆开这件教学样机。',opening:'这是非承重教学夹具。销头虽看得见，前方挡条却挡住了退出通路。碰住时可以换面观察、撤销或求助。',completion:{title:'挡住的是出口',text:'挡条、小销和榫头已经取下。接下来把挡条留在侧边固定位置，再验证原接头还能合回、拆开。'}},
  'practice-service-open-back':{slot:'serviceBackRun',level:'service-access-open',mode:'assemble',name:'侧置方案 · 亲手合回',goal:'挡条已侧置。先合榫头，再让小销固定。',opening:'侧置位置在夹具上，已经固定好。合回主接头时仍要给大件留路；碰住可撤销修正。',completion:{title:'这次合好了',text:'侧置挡条没有占住销头前方。先收好装配记录，下一步亲手检查它还能不能拆开。'}},
  'practice-service-open-out':{slot:'serviceOutRun',level:'service-access-open',mode:'dismantle',name:'侧置方案 · 验证拆修',goal:'保持挡条在侧边，取销并退出大件。',opening:'这次不用先卸挡条。看看销帽前方的空处，验证它是否真能退出。',completion:{title:'给下一次维修留了路',text:'取销和退出大件都已经亲手验证。把这个取舍记下来，再整理自己的作品需求。'}}
 };
 function done(c,slot,P,E){const t=Object.values(serviceTasks).find(t=>t.slot===slot),r=c[slot];return !!(t&&r?.level===t.level&&r.mode===t.mode&&E.restoreSession(JSON.stringify(r),P)?.completed);}
 function stage(c,P,E){
  if(!c.entryAccepted)return legalRun(c,P,E)?.completed?'review':c.workshopSeen?'practice':c.departed?'home':c.departurePrepared?'goodbye':c.noticeSeen?'notice':'meetup';
  if(!c.designStarted)return 'registered';if(!c.purpose)return 'purpose';if(!c.peerMet)return 'peer';
  if(!done(c,'serviceRun',P,E))return 'service-check';if(c.variant!=='side')return 'service-choice';if(!done(c,'serviceBackRun',P,E))return 'service-build';if(!done(c,'serviceOutRun',P,E))return 'service-test';return c.designReviewed?F.stage(c,P,E):'service-review';
 }
 function task(id,c){const t=serviceTasks[id];if(!t)return c?F.task(c,id):null;return t?{...t,id,extension:true}:null;}
 function slotFor(id){return serviceTasks[id]?.slot||F.specs[id]?.slot||'run';}
 function seed(P,E){
  return {version:1,level:'pinned',mode:'assemble',history:[],trial:E.trial('pinned','assemble'),action:'extract'};


 }
 const nodes={
  continuationMeetup:{lines:[['小许','这就是你修的凳子？给我挪点地方。'],['我','来。周伯修好的，我帮着合了上面几件。'],['小许','给你带了张折页。吃完面出门，瞥见“木作”两个字，我就想起你了。你看，十周后在省城，还有新人组。']],choices:[['展开折页，看看要求。','continuation:read'],['先收好，路上再看。','continuation:stow']]},
  continuationDeparture:{lines:[['我','这两天麻烦您了。回学校以后，我还想接着学。'],['周伯','找个有人带的工坊，工具也得慢慢练。'],['我','以后卡住了，能给您发照片吗？'],['周伯','能，来，把我加上。接头拍近点，我眼神可没以前好了。'],['我','那我做出件像样的，再给您看。','player-smile'],['周伯','刚开始做的也发，别只挑好看的。','zhou-smile','你把周伯的联系方式存进手机。']],action:'continuation:goodbye',last:'收好手机，到门口道别'},
  continuationGoodbye:{lines:[['周伯','路上慢点，到山脚报个平安。'],['我','好。下次来，我想带件自己做的给您看看。'],['周伯','带来吧。先坐下喝口水，再慢慢看。'],['小许','车快到了。周伯，再见！']],action:'continuation:home',last:'和小许沿石阶下山'},
  continuationWorkshop:{lines:[['旁白','回学校后的第一个周末，你按预约来到附近的开放工坊。装配台上放着一组散件。'],['工作人员','这回试着合起来。先装大件，再用小销固定，给它留条进出的路。'],['我','好，我从榫头开始。']],action:'continuation:ready',last:'到装配台，试着合回'},
  continuationEntry:{lines:[['折页','新人组：准备一件日常使用、可以拆修的小家具。现场完成关键装配，带上过程记录；请教和加工协助如实写明。'],['小许（消息）','你来真的啊？'],['我（消息）','嗯。先把一件做完整，拿去给人看看。'],['小许（消息）','那到时候我去。试坐的活先给我留着。'],['我（消息）','行，先让工坊检查。你别急着上岗。']],choices:[['报名新人组，保存准备计划。','continuation:register'],['先不提交，再看看要求。','continuation:rules']]}
 };
 const purposeTalk={
  comfort:[['我（消息）','你在门口换鞋，最不方便的是哪一下？'],['小许（消息）','系鞋带。我得扶着墙单脚站，鞋倒还好，墙都让我蹭花了。'],['我（消息）','那就让你坐着弯腰，座面给你留宽些。']],
  moving:[['我（消息）','扫地的时候，你怎么挪门口那张凳子？'],['小许（消息）','一手拿扫帚，一手抓凳边。抓不住就只好先放下扫帚。'],['我（消息）','懂了。画凳边的时候，我给那只手留点地方。']],
  repair:[['我（消息）','你家门口那张旧凳，哪儿先坏的？'],['小许（消息）','就座面裂了。四条腿都好好的，换掉整张怪可惜。'],['我（消息）','那我试试，让坏的那块能单独拿下来。']]
 };
 nodes.continuationPurpose={lines:purposeTalk.comfort,action:'continuation:brief',last:'把小许的话记在草图旁'};
 nodes.continuationPeer={lines:[['林岚','这儿没人吧？我叫林岚，也报了新人组。'],['我','没人，你放这儿吧。'],['林岚','你这根销，我能从这边看看吗？','lin-study'],['我','可以，销头就在这儿。'],['林岚','嗯。以后要换座板，手从哪边伸？','lin-study'],['我','……等一下，我把它拿过来试试。']],action:'continuation:peer-met',last:'拿起样机，看看销头前面'};
 nodes.continuationServiceReflection={lines:[['我','这次不用挪挡条，也拿得出来了。'],['林岚','我上星期也干过这事。装完才发现，手根本伸不进去。','lin-smile'],['我','幸好先试了。铅笔借我一下，我把这儿圈出来。'],['林岚','给。等我的改好，你也帮我看看。']],action:'continuation:design-reviewed',last:'在草图上圈出取销的位置'};
 function allowed(id,s){if(F.nodes[id])return F.allowed(id,s);const c=s.continuation;if(s.phase!=='complete'||!c?.active)return false;return id==='continuationGoodbye'?c.stage==='goodbye':id==='continuationPurpose'?c.stage==='purpose':id==='continuationPeer'?c.stage==='peer':id==='continuationServiceReflection'?c.stage==='service-review':id==='continuationMeetup'?c.stage==='meetup':id==='continuationDeparture'?c.stage==='notice':id==='continuationWorkshop'?c.stage==='home':id==='continuationEntry'?c.stage==='review'&&c.reviewed:false;}
 function resolve(id,s){if(F.nodes[id])return F.resolve(id,s);const n=nodes[id];if(!n||!allowed(id,s))return null;const copy={...n,lines:n.lines.map(l=>[...l]),choices:n.choices?.map(c=>[...c])};
  if(id==='continuationPurpose'){
   copy.lines=(purposeTalk[s.continuation.purposeChoice]||purposeTalk.comfort).map(line=>[...line]);


  }return copy;}
 Object.assign(nodes,F.nodes);
 const away=s=>s.continuation?.active&&(s.continuation.departed||s.continuation.stage==='goodbye');
 const api={stages,fresh,restore,legalRun,seed,nodes,allowed,resolve,away,serviceTasks,task,slotFor,done,stage};root.CampaignContinuation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
