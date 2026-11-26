/* The next chapter is independent of the certified village histories. */
(function(root){
 'use strict';
 if(typeof module!=='undefined')require('./service-puzzle.js');
 const F=typeof module!=='undefined'?require('./campaign-finale.js'):root.CampaignFinale;
 const Guide=typeof module!=='undefined'?require('./assembly-guide.js'):root.AssemblyGuide;
 const Museum=typeof module!=='undefined'?require('./campaign-museum.js'):root.CampaignMuseum;
 const workshops={
  'workshop-dovetail-out':{slot:'dovetailOutRun',level:'dovetail',mode:'dismantle',stage:'workshop-dovetail-out',name:'燕尾滑盖 · 拆开',goal:'取出止退木钥，再沿斜槽把盖板抽出来。',opening:'先看看盖板能不能向上拿。贴着斜面拉时，留意哪一端被木钥挡住了。',completion:{title:'盖板沿槽抽出来了',text:'下宽上窄的斜面托住盖板，止退只靠出口处那枚木钥。匣体还留在台上。'}},
  'workshop-dovetail-back':{slot:'dovetailBackRun',level:'dovetail',mode:'assemble',stage:'workshop-dovetail-back',name:'燕尾滑盖 · 合回',goal:'① 沿槽推回宽盖板 · ② 装回止退木钥',opening:'盖板从刚才的出口滑回，贴齐后再插上木钥。',completion:{title:'滑盖贴齐了',text:'盖板和木钥合回原位。以后若要换这块盖板，匣体可以留下。'}},
  'workshop-burr-six-back':{slot:'burrBackRun',level:'burr-six',mode:'assemble',stage:'workshop-burr-six-back',name:'六件鲁班锁 · 复原',goal:'让六根木条沿各自的槽口合在一起。',opening:'相近颜色的两根木条朝同一方向。先看中央哪里有空，再选一根沿箭头推入。',completion:{title:'六根木条扣在一起了',text:'刚才还散在手边的木条，现在互相挡住。看看最后合入的那根，记住下次从哪儿打开。'}}
 };
 for(const task of Object.values(workshops)){task.workshop=true;task.locationLabel='开放工坊 · 传统接点';}
 const stages=['meetup','notice','goodbye','home','practice','review','registered','purpose','peer','service-check','service-choice','service-build','service-test','service-review',...Object.keys(workshops),'workshop-reflection','museum','design-ready',...Object.keys(F.goals)];
 const fresh=()=>({...F.fresh(),revision:7,museum:Museum.fresh(),zhouContact:false,departurePrepared:false,goodbyeSeen:false,resting:false,rehearsals:{},designStarted:false,purpose:null,purposeChoice:null,peerMet:false,serviceRun:null,variant:null,serviceBackRun:null,serviceOutRun:null,designReviewed:false,dovetailOutRun:null,dovetailBackRun:null,burrBackRun:null,workshopReflected:false,workshopLegacy:false,active:false,started:false,noticeSeen:false,departed:false,workshopSeen:false,reviewed:false,entryAccepted:false,run:null,stage:'meetup'});
 function legalRun(c,P,E){const r=c?.run;return r?.level==='pinned'&&r.mode==='assemble'?E.restoreSession(JSON.stringify(r),P):null;}
 function restore(v,eligible,P,E){
  const c=fresh();if(!eligible||!v||![1,2,3,4,5,6,7].includes(v.revision)||v.started!==true)return c;
  c.started=true;c.active=v.active===true||v.reviewingFirstAct===true;c.noticeSeen=v.noticeSeen===true;c.departed=c.noticeSeen&&v.departed===true;c.workshopSeen=c.departed&&v.workshopSeen===true;
  c.goodbyeSeen=c.departed||v.goodbyeSeen===true;c.departurePrepared=c.goodbyeSeen||c.noticeSeen&&v.departurePrepared===true;
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
  c.designReviewed=done(c,'serviceOutRun',P,E)&&v.designReviewed===true;
  c.workshopLegacy=c.designReviewed&&(v.revision<6||v.workshopLegacy===true);
  if(c.designReviewed){
   for(const t of Object.values(workshops)){
    c[t.slot]=workshopRun(v[t.slot],t,P,E);
    if(!done(c,t.slot,P,E))break;
   }
   c.workshopReflected=done(c,'burrBackRun',P,E)&&v.workshopReflected===true;
  }
  if(workshopReady(c)){
   F.restore(c,v,P,E);
   c.museum=Museum.restore(v.museum,P,E);
   if(v.revision<7||c.productionStarted)c.museum.passed=true;
  }
  c.stage=stage(c,P,E);c.resting=c.workshopSeen&&(v.resting===true||v.revision<3&&c.stage==='design-ready');if(v.revision<3&&c.workshopSeen)c.active=true;
  for(const t of Object.values(workshops)){const r=workshopRun(v.rehearsals?.[t.slot],t,P,E);if(r&&c.designReviewed&&(c.workshopLegacy||done(c,t.slot,P,E)))c.rehearsals[t.slot]=r;}
  for(const [slot,level,mode]of [['run','pinned','assemble'],...Object.values(serviceTasks).map(t=>[t.slot,t.level,t.mode]),...Object.values(F.specs).map(t=>[t.slot,F.choice(c)?.id,t.mode])]){const r=v.rehearsals?.[slot],ok=!!r&&!!level&&r.level===level&&r.mode===mode&&E.restoreSession(JSON.stringify(r),P);if(ok)c.rehearsals[slot]={...r,history:ok.history,trial:ok.trial};}
  return c;
 }
 const serviceTasks={
  'practice-service-access':{slot:'serviceRun',level:'service-access-closed',mode:'dismantle',name:'维修通路 · 先找被挡住的出口',goal:'观察销帽前的挡条，拆开这件教学样机。',opening:'这是非承重教学夹具。销头虽看得见，前方挡条却挡住了退出通路。碰住时可以换面观察、撤销或求助。',completion:{title:'挡住的是出口',text:'挡条、小销和榫头已经取下。接下来把挡条留在侧边固定位置，再验证原接头还能合回、拆开。'}},
  'practice-service-open-back':{slot:'serviceBackRun',level:'service-access-open',mode:'assemble',name:'侧置方案 · 亲手合回',goal:'挡条已侧置。先合榫头，再让小销固定。',opening:'侧置位置在夹具上，已经固定好。合回主接头时仍要给大件留路；碰住可撤销修正。',completion:{title:'这次合好了',text:'侧置挡条没有占住销头前方。先收好装配记录，下一步亲手检查它还能不能拆开。'}},
  'practice-service-open-out':{slot:'serviceOutRun',level:'service-access-open',mode:'dismantle',name:'侧置方案 · 验证拆修',goal:'保持挡条在侧边，取销并退出大件。',opening:'这次不用先卸挡条。看看销帽前方的空处，验证它是否真能退出。',completion:{title:'给下一次维修留了路',text:'取销和退出大件都已经亲手验证。把这个取舍记下来，再整理自己的作品需求。'}}
 };
 function workshopRun(run,t,P,E){
  if(run?.level!==t.level||run.mode!==t.mode)return null;
  const legal=E.restoreSession(JSON.stringify(run),P);
  if(!legal)return null;
  const guide=Guide.forLevel(t.level,t.mode,true);
  if(guide){
   const normalized=Guide.normalize(P.LEVELS.find(l=>l.id===t.level),run,t.mode,P,E,guide);
   return {...normalized.run,trial:normalized.legal.trial};
  }
  return {...run,history:legal.history,trial:legal.trial};
 }
 const workshopReady=c=>c.designReviewed&&(c.workshopLegacy||c.workshopReflected);
 function done(c,slot,P,E){const t=[...Object.values(serviceTasks),...Object.values(workshops)].find(t=>t.slot===slot),r=c[slot];return !!(t&&r?.level===t.level&&r.mode===t.mode&&E.restoreSession(JSON.stringify(r),P)?.completed);}
 function stage(c,P,E){
  if(!c.entryAccepted)return legalRun(c,P,E)?.completed?'review':c.workshopSeen?'practice':c.departed?'home':c.departurePrepared?'goodbye':c.noticeSeen?'notice':'meetup';
  if(!c.designStarted)return 'registered';if(!c.purpose)return 'purpose';if(!c.peerMet)return 'peer';
  if(!done(c,'serviceRun',P,E))return 'service-check';if(c.variant!=='side')return 'service-choice';if(!done(c,'serviceBackRun',P,E))return 'service-build';if(!done(c,'serviceOutRun',P,E))return 'service-test';
  if(!c.designReviewed)return 'service-review';
  if(workshopReady(c))return c.museum.passed||c.productionStarted?F.stage(c,P,E):'museum';
  return Object.values(workshops).find(t=>!done(c,t.slot,P,E))?.stage||'workshop-reflection';
 }
 function task(id,c){const t=serviceTasks[id]||workshops[id];return t?{...t,id,extension:true}:c?F.task(c,id):null;}
 function slotFor(id){return serviceTasks[id]?.slot||workshops[id]?.slot||F.specs[id]?.slot||'run';}
 function seed(P,E){
  return {version:1,level:'pinned',mode:'assemble',history:[],trial:E.trial('pinned','assemble'),action:'extract'};


 }
 const nodes={
  continuationMeetup:{lines:[['旁白','你起身时，雨棚柱上的一张海报被风掀起一角。下面的小木盒里还剩几张折页。'],['我','省级木作交流赛……还有新人组。'],['周伯','前几天传习屋送来的。想看就拿一张，底下那个盒子还挡得住雨。']],choices:[['展开折页，看看要求。','continuation:read'],['先收好，路上再看。','continuation:stow']]},
  continuationDeparture:{lines:[['我','这两天麻烦您了。回学校以后，我还想接着学。'],['周伯','学校附近有木工坊吗？找个有人教的。合得松还是紧，得自己推一下才知道。'],['我','以后卡住了，能给您发照片吗？'],['周伯','能，来，把我加上。接头拍近点，我眼神可没以前好了。'],['我','那我做出件像样的，再给您看。','player-smile'],['周伯','刚开始做的也发，别只挑好看的。','zhou-smile','你把周伯的联系方式存进手机。']],action:'continuation:goodbye',last:'收好手机，到门口道别'},
  continuationGoodbye:{lines:[['周伯','路上慢点，出村那几级石阶还滑。'],['我','好。下次来，我想带件自己做的给您看看。'],['周伯','带来吧。先坐下喝口水，再慢慢看。']],action:'continuation:home',last:'背上包，沿石阶下山'},
  continuationWorkshop:{lines:[['旁白','回学校后的第一个周末，你按预约来到附近的开放工坊。装配台上放着一组散件。'],['工作人员','试试这副散件？大块的先放进去，小销先搁手边。'],['我','行。那这块大的我拿过来了。']],action:'continuation:ready',last:'到装配台，试着合回'},
  continuationEntry:{lines:[['折页','新人组：准备一件日常使用、可以拆修的小家具。带上过程记录，如实写明请教和加工协助。'],['我','先把一件做完整。到时候，人家问怎么换一块板，我也能当场拆给他看。']],choices:[['报名新人组，保存准备计划。','continuation:register'],['先不提交，再看看要求。','continuation:rules']]}
 };
 const purposeTalk={
  comfort:[['手记','雨棚那人弯腰换鞋，一只脚踩稳，另一只还有地方往前伸。'],['我','给门口的小凳留多大地方？我先拿张凳子试着系一次鞋带。']],
  moving:[['手记','换完鞋，那人弯腰把湿鞋拎走。要是还得腾手搬凳子，抓哪儿最顺？'],['我','先在草图上把手的位置圈出来。搬的时候得抓凳架，别把可拆的木销当把手。']],
  repair:[['手记','雨棚的座板换了，两头的旧凳架还在。'],['我','小凳也可以这样做。先给手留个取销的位置，以后坏了，就只拆那块板。']]
 };
 nodes.continuationPurpose={lines:purposeTalk.comfort,action:'continuation:brief',last:'把这条要求记在草图旁'};
 nodes.continuationPeer={lines:[['林岚','这儿没人吧？我叫林岚，也报了新人组。'],['我','没人，你放这儿吧。'],['林岚','你这根销，我能从这边看看吗？','lin-study'],['我','可以，销头就在这儿。'],['林岚','看见了。以后要换座板，你从哪边伸手取它？','lin-study'],['我','应该从这儿……等等，我拿过来试一下。']],action:'continuation:peer-met',last:'拿起样机，看看销头前面'};
 nodes.continuationServiceReflection={lines:[['我','你看，挡条没动，销已经拿出来了。'],['林岚','这下有地方捏了。我上周做的那件，缝看着挺宽，手伸过去还是捏不住。','lin-smile'],['我','铅笔借我一下？我把往哪儿抽画上。'],['林岚','给。等我的改好了，你也帮我试试。']],action:'continuation:design-reviewed',last:'在草图上标出取销方向'};
 nodes.continuationWorkshopReflection={lines:[['林岚','刚才最后合进去那根，要是先放，会挡住哪儿？','lin-study'],['我','中间这道槽。它在这儿一横，里头那根就过不去了。'],['林岚','把这两步画上呗。对了，附近的木作馆今天开门，要不要一起过去看看？','lin-smile']],action:'continuation:workshop-reflected',last:'记好顺序，去博物馆'};
 nodes.continuationMuseumIntro={lines:[
  ['林岚','你看，这张记录把换过哪根横枨都画了。',null,'林岚和你来到榫卯文化博物馆，在一张旧椅修复记录前停下。'],
  ['我','往哪边抽也有箭头。过几年再松动，接手的人照着图就能找。'],
  ['林岚','咱们也给自己的东西留一张图吧。']
 ],action:'continuation:museum-introduced',last:'逛逛展厅'};
 function allowed(id,s){if(F.nodes[id])return F.allowed(id,s);const c=s.continuation;if(s.phase!=='complete'||!c?.active)return false;
  if(id==='continuationMuseumIntro')return c.stage==='museum'&&c.museum.visit?.from==='story'&&!c.museum.introduced;
  return id==='continuationGoodbye'?c.stage==='goodbye':id==='continuationPurpose'?c.stage==='purpose':id==='continuationPeer'?c.stage==='peer':id==='continuationServiceReflection'?c.stage==='service-review':id==='continuationWorkshopReflection'?c.stage==='workshop-reflection':id==='continuationMeetup'?c.stage==='meetup':id==='continuationDeparture'?c.stage==='notice':id==='continuationWorkshop'?c.stage==='home':id==='continuationEntry'?c.stage==='review'&&c.reviewed:false;}
 function resolve(id,s){if(F.nodes[id])return F.resolve(id,s);const n=nodes[id];if(!n||!allowed(id,s))return null;const copy={...n,lines:n.lines.map(l=>[...l]),choices:n.choices?.map(c=>[...c])};
  if(id==='continuationPurpose'){
   copy.lines=(purposeTalk[s.continuation.purposeChoice]||purposeTalk.comfort).map(line=>[...line]);


  }return copy;}
 Object.assign(nodes,F.nodes);
 const away=s=>s.continuation?.active&&(s.continuation.departed||s.continuation.stage==='goodbye');
 const api={stages,fresh,restore,legalRun,seed,nodes,allowed,resolve,away,serviceTasks,workshops,workshopReady,task,slotFor,done,stage};root.CampaignContinuation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
