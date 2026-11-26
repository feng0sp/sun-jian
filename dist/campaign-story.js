/* Original dialogue for the illustrated journey. Craft detail belongs in optional help. */
(function(root){
 'use strict';
 const revision=(root.CampaignData||(typeof require==='function'&&require('./campaign-data.js'))).storyRevision;
 const requiredCaveIds=['mouth-latch','rack-frame','stone-box'];
 const nodes={
  opening:{lines:[['旁白','陈屿是个大学生。这个周末，他背着包，一个人进山徒步，本想赶在天黑前走到山脚。'],['我','才把地图拿出来，纸都湿透了。'],['我','下面有灯。先进去躲会儿雨吧。']],action:'openingDone',last:'沿石阶往村里走'},
  villageArrival:{lines:[['旁白','石阶接上村道。右手边有个雨棚，对面那户还亮着灯。'],['我','雨还在下，先找个能站住脚的地方。']],action:'close',last:'找个地方避雨'},
  shelterFirst:{lines:[["旁白","屋檐挡住了雨。长凳少了座板，旧板靠在一旁。"],["我","能躲雨，可惜坐不下。对面那户还亮着灯，去问问吧。"]],repeat:[["我","还是过去问问，总不能在这儿站一晚上。"]],action:'close',last:'去亮灯的小屋'},
  doorKnock:{lines:[["旁白","你拢了拢湿袖口，轻轻敲了两下门。"],["我","您好，有人吗？能让我在这儿躲会儿雨吗？"],["屋内","门没关，进来吧。别站那儿淋着。"]],action:'doorInvited',last:'应一声，再进屋'},
  welcomeInside:{lines:[['我','谢谢您。我鞋上全是泥。'],['老人','垫子就在脚边，蹭两下就行。包也搁门边吧。'],['周伯','我姓周。暖水瓶在桌上，想喝水就倒。','zhou-warm']],action:'close',last:'先擦擦鞋，放下背包'},
  unpack:{lines:[['旁白','你擦净鞋底，把湿背包靠在门边。']],action:'bagPlaced',last:'问问下山的路'},
  arrival:{lines:[['我','周伯，从这儿下山，天黑了还能走吗？'],['周伯','平时能。今天石阶上全是水，别走了，等明早。']],choices:[['村里有能借住的地方吗？','stay'],['我先歇口气。','close']]},
  road:{lines:[["周伯","这雨一时半会儿停不了。夜里路又看不清，等明早再走。"],["我","那今晚得在村里找个地方了。"]],choices:[['村里有能借住的地方吗？','stay']]},
  stay:{lines:[['周伯','里屋有张空床，今晚就住这儿吧。外套挂门后，明早说不准就干了。','zhou-warm'],['我','好，那就打扰您一晚。有什么要帮忙的，您叫我。']],action:'settle',last:'挂好外套，看看屋里'},
  zhou:{lines:[["周伯","坐这边，刚收拾过。桌上那几件也能看，拿起来不要紧。"]],repeat:[["周伯","还想看什么？"]],choices:[['桌上这些木块，我能试试吗？','invite'],['您平时还教人木工？','heritage'],['我先看看屋里。','close']]},
  heritage:{lines:[['周伯','周六我去传习屋。来的人有的空着手，有的拎把晃椅子，问我还能不能修。'],['我','您给他们修？'],['周伯','我先拆一段给他们看，剩下的让他们自己试。上回有个姑娘把自家的凳子修好了，扛过半条街，非要我坐坐。'],['我','那您坐着怎么样？'],['周伯','挺稳。我还想多坐会儿呢，她拍拍我，说她自己还没坐过，让我起来。','zhou-smile']],repeat:[['周伯','下回赶上周六，来传习点坐坐就知道了。']],choices:[['那我也从这几块开始吧。','invite'],['您当年也是这么学的？','teacherMemory'],['我先看看。','close']]},
  teacherMemory:{lines:[['周伯','跟我父亲学的。头一天就给我一把晃腿的椅子，叫我找毛病。'],['我','您把松的那边敲紧了？'],['周伯','敲紧了这边，那边又松了。'],['周伯','他搬过来一坐，说，这回好，两边一样晃。','zhou-smile']],repeat:[['周伯','我父亲让我听哪儿松，可没让我比谁敲得响。']],choices:[['那我先拿样件练练。','invite'],['我再看看这把椅子。','close']]},
  invite:{lines:[['周伯','拿台前这块试试。碰住就停，换个面看看。','zhou-look']],repeat:[['周伯','给你留着呢，台前那块。','zhou-look']],choices:[['那我动手了。','accept'],['我等会儿再试。','close']]},
  night:{lines:[['周伯','来，先吃饭。木头不怕凉，菜可不行。']],repeat:[['周伯','不急。想再看看就看，累了去里间歇着。']],action:'close',last:'好，我来端碗'},
  morning:{lines:[['我','周伯，您在画长凳？'],['周伯','村口雨棚那条。要换座板和两根横梁，我试配过新料了。'],['我','要是好找，我去拿吧。'],['周伯','沿屋旁石路到旧木料库，找绑浅色布带的那组。草图另外收在石台的木匣里。']],repeat:[['周伯','认浅色布带，草图在石台的木匣里。料长，推小车回来，别自己扛。']],choices:[['我去拿。','depart'],['旧木料库里都放些什么？','caveBackground'],['我先把东西收一下。','close']]},
  caveBackground:{lines:[["周伯","木料，还有些以前教人做的样件，放在柜架旁。"],["我","那些也可以拿起来试试？"],["周伯","可以。取料就开门闩、卸挡框，再拿草图。其他的随你看，撑架子的木头别拆就行。"]],repeat:[["周伯","那些都是练习用的，想试哪件就试哪件，不用全拆一遍。"]],choices:[['明白了，我去拿料。','depart'],['我收拾一下就走。','close']]},
  travelMessage:{lines:[['周伯','架子旁有辆小车。轮子有点响，你推回来就行。'],['旁白','你收好晾干的背包，沿石路往旧库走。']],action:'departRoute',last:'去屋旁石路'},
  departing:{lines:[["周伯","包带好了？料先放雨棚，回来叫我。"]],repeat:[["周伯","去吧，我把碗洗了，等你回来。"]],choices:[['好，一会儿见。','close'],['再说说旧木料库。','caveBackground']]},
  caveEnter:{lines:[["旁白","石路走到尽头，一枚宽木钥扣在旧库的长门闩上。门旁的岩缝透着光，里面能看见几排柜架。"]],action:'enterCave',last:'查看库门'},
  supplies:{lines:[["旁白","浅色布带绑着两根横梁、一块座板，两枚木销收在一起。和草图上的五件一一对上了。"],["我","齐了，收上车吧。"]],repeat:[["我","料和草图都收好了，可以回去了。"]],choices:[['推着小车回村。','return'],['展开草图看看。','supplySketch'],['我再看看这里的样件。','close']]},
  supplySketch:{lines:[["旁白","草图折过好几次，五件木料都标了记号。"],["我","先夹进本子里，回去装的时候再拿出来。"]],choices:[['把草图收好，推车回村。','return'],['收好，继续看看。','close']]},
  returned:{lines:[['我','周伯，料放在雨棚了。'],['周伯','那辆车老远就能听见。走，横梁我来搭。'],['我','好。座板和木销，我照着图来。']],choices:[['好，先把料摆开。','bench']]},
  benchHelp:{lines:[["周伯","两根横梁我搭好了。你来合座板，最后把这两根小销装上。"]],repeat:[["周伯","慢慢来，碰上了就停一下。我在旁边呢。"]],choices:[['我再试试。','close'],['这条凳子一直摆在这儿？','benchMemory']]},
  benchMemory:{lines:[["周伯","摆了十几年了。等车的、买菜回来的，谁累了都坐。"],["我","怪不得板没了也没搬走。"],["周伯","这两头的架子还好好的。以后哪一块再松，先看能不能只动那一块。"]],repeat:[["周伯","等车的人爱坐这儿。修稳了，还能用呢。"]],action:'close',last:'回到长凳边'},
  checked:{lines:[["旁白","周伯把掌心沿座板边摸过去，又扶住两端凳架，轻轻晃了晃。"],["我","我还怕这两头也得换。"],["周伯","稳着呢。来，你装的，你先坐。"]],action:'sitReady',last:'坐下试试'},
  farewellReady:{lines:[["周伯","放心，刚检查过。坐吧，别一直盯着那道缝。"]],action:'close',last:'坐一会儿'},
  farewellChat:{lines:[['周伯','下次路过，还来喝水。'],['我','好。您把这凳子给我留个位置。'],['周伯','那你得来早点，赶集那天可不一定。']],action:'close',last:'再会，周伯'},
  chair:{lines:[["旁白","横枨接头的木色比旁边浅些，椅子擦得很干净。"],["周伯","邻居送来的，原来有点晃。刚修好，你坐坐看。"]],repeat:[["周伯","修稳了，放心坐。"]],choices:[['这里没钉子，是怎么接牢的？','chairJoint'],['坐坐看。','chairSit'],['这椅子用了多久？','chairAge'],['先看看别的。','close']]},
  chairJoint:{lines:[["周伯","你摸摸椅腿边上这道缝。横枨的头在腿里头，原先松的也是这儿。"],["我","就换了这根浅色的？椅腿我看还是旧的。"],["周伯","腿还结实，留着就好。想看看榫头，可以试桌上的样件。这把明早邻居来取。"]],repeat:[["周伯","想看里面就试桌上的样件，椅子给邻居留着。"]],choices:[['那我试试桌上的样木。','invite'],['好，我不拆它。','close']]},
  chairAge:{lines:[['周伯','二十来年了。原先坐着写作业的孩子，现在抱着自己的孩子来坐。'],['我','那确实得修结实点。']],repeat:[['周伯','二十来年，座沿都磨亮了。邻居舍不得换，我也觉得还能用。']],action:'close',last:'再看看屋里'},
  chairSit:{lines:[["我","这么老的椅子，坐着倒挺稳。"],["周伯","这就好，邻居来拿的时候，敢坐了。"]],repeat:[["旁白","椅背有一点凉，座面倒很光滑。"]],action:'close',last:'坐一会儿'},
  cup:{lines:[["旁白","暖水瓶旁放着一只干净的搪瓷杯，瓶盖上还有水汽。"]],repeat:[["旁白","杯子还放在暖水瓶边。"]],choices:[['倒杯热水。','teaPour'],['周伯平时也是一个人在这儿忙？','dailyLife'],['先放下。','close']]},
  teaPour:{lines:[["旁白","热水倒进杯里，冒起薄薄一层白气。"],["周伯","刚烧的，烫，吹吹再喝。"]],repeat:[["旁白","你又给杯里添了一点热水。"]],action:'close',last:'把杯子放稳'},
  dailyLife:{lines:[["周伯","早上去地里看看，回来修修东西。门开着，总有人来坐。"],["我","我今天倒是赶巧了。"],["周伯","可不，正好多摆一副碗筷。"]],repeat:[["周伯","下回路过也进来，添副碗筷的事。"]],action:'close',last:'再看看屋里'},
  tools:{lines:[["旁白","工具一排排挂着，常握的木柄都磨亮了。"],["周伯","可以拿，别碰刃口。看完放原位，省得我满屋找。"]],repeat:[["旁白","常用的几把就挂在伸手够得着的地方。"]],choices:[['走近工具角看看。','toolCorner'],['现在还常用这些？','toolsUse'],['您是跟谁学的木工？','teacherMemory'],['放回去。','close']]},
  toolsUse:{lines:[["周伯","常用。粗活用电动的省力，最后差的那一点，还是这几把顺手。"],["我","这把手都握出凹槽了，用挺久了吧？"],["周伯","久了。换把新的，还得重新磨合。"]],repeat:[["周伯","用惯了，手往哪儿放都不用想。"]],action:'close',last:'再看看工具'},
  earlySample:{lines:[["周伯","修椅子剩的几块试配料。想看看接头怎么接的？"]],repeat:[["周伯","桌边那几块，你拿起来试就是。"]],choices:[['教我试试吧。','invite'],['我再看看。','close']]}
 };
 const reflections={
  'learn-straight-out':{lines:[['周伯','瞧，底下藏着这么长一截。']]},
  'learn-lap-out':{lines:[['周伯','这两根是一对，搁进同一个格子吧。']]},
  'learn-pinned-out':{lines:[['周伯','对，就是这根小销。替我收进盘里，省得满桌子找。']]},
  'learn-straight-back':{lines:[['周伯','齐了，这块就留在桌上吧。']]}
 };
 for(const [task,n]of Object.entries(reflections))nodes['after:'+task]={...n,action:'reflectionDone',last:'放好样木'};
 function canReturn(s){return typeof root.CampaignData?.canReturn==='function'?root.CampaignData.canReturn(s):requiredCaveIds.every(id=>s.cave?.completed?.includes(id));}
 function resolve(id,state){if(root.CampaignContinuation?.nodes[id])return root.CampaignContinuation.resolve(id,state);const raw=nodes[id];if(!raw||!allowed(id,state))return null;const n={...raw,lines:raw.lines.map(l=>[...l]),choices:raw.choices?.map(c=>[...c])};
  if(state.spoken?.includes(id)&&raw.repeat)n.lines=raw.repeat.map(l=>[...l]);
  if(id==='arrival'&&state.prologue?.legacy&&!state.spoken?.includes('arrival')){n.lines=[['我','您好，借屋檐躲会儿雨行吗？'],['周伯','进来吧。门边垫子蹭蹭鞋，包先放下。'],['我','谢谢您，怎么称呼？'],['周伯','我姓周，叫周伯就好。']];n.choices=[['周伯，村里有能借住的地方吗？','stay'],['这雨一时停不了吧？山路还好走吗？','road']];}
  if(n.choices)n.choices=n.choices.filter(([,next])=>next!=='invite'||['arrival','settle'].includes(state.phase));
  if(state.phase==='arrival'&&['earlySample','chair','cup','tools'].includes(id)){
   n.lines=[['旁白',({earlySample:'桌边摆着几块试接头的样木。今晚怎么落脚还没说好，等会儿再慢慢看。',chair:'椅子收拾得干干净净。周伯还在桌边，先问问今晚住哪儿。',cup:'暖水瓶就在手边。先和周伯说好住处，再坐下歇歇。',tools:'几把常用的工具放在最顺手的位置。可以等安顿好以后再问。'})[id]]];n.choices=[['问问今晚在哪里落脚。','arrival'],['先看看。','close']];
  }
  if(id==='morning'&&!state.spoken?.includes(id)&&state.nightBenchSeen){n.lines[0]=['我','昨晚雨棚那条凳子，是您在修？'];n.lines[1]=['周伯','是啊。座板和两根横梁得换，新料我已经试配好了。'];n.lines[0][3]='周伯把草图摊平，正低头核对尺寸。';}
  if(id==='morning'&&!state.spoken?.includes(id)&&!state.nightBenchSeen)n.lines[0][3]='周伯把草图摊平，正低头核对尺寸。';
  if(id==='night'&&state.spoken?.includes('night'))n.last='再看看屋里';
  if(id==='benchHelp'&&state.phase==='bench'){
   const fitted=new Set();for(const move of state.runs?.bench?.history||[]){if(move.kind==='insert')fitted.add(move.piece);else if(move.kind==='extract')fitted.delete(move.piece);}
   if(fitted.has('seat')){const pins=Number(fitted.has('left-pin'))+Number(fitted.has('right-pin'));n.lines=[['周伯',pins===1?'还差一根小销，对好孔就行。':'座板齐了，再把两根销装上。哪边先都行。']];}
  }
  if(id==='checked'&&state.nightBenchSeen)n.lines[2]=['周伯','稳了。昨晚没坐成，今天你先坐。明早等车的人也有地方歇脚了。'];
  if(id==='zhou'&&state.phase==='learning'){
   n.lines=[['周伯','接着试吧，有不明白的叫我。']];
   n.choices=[['您平时还教人木工？','heritage'],['我接着看看样件。','close']];
  }
  // Indoor objects stay available after Zhou has gone to the shelter, without remote replies.
  if(['bench','farewell','complete'].includes(state.phase)){
   if(id==='tools'){n.lines=[['旁白','工具都挂回去了。周伯在雨棚那边，屋里很安静。']];n.choices=[['走近工具角看看。','toolCorner'],['去雨棚找周伯。','findZhou'],['放回去。','close']];}
   if(id==='chair'){n.lines=[['旁白','修好的旧椅子还靠在墙边。横枨颜色浅一点，接头贴得很紧。']];n.choices=[['坐坐看。','chairSit'],['看看接头。','chairJoint'],['回到屋里。','close']];}
   if(id==='chairJoint'){n.lines=[['旁白','横枨紧贴着椅腿。近看才看得清那道接缝，手摸过去几乎是平的。']];n.choices=[['放回去。','close']];}
   if(id==='chairSit')n.lines=[['旁白','坐下去很稳。窗外传来几声鸟叫。']];
   if(id==='cup'){n.lines=[['旁白','杯子和暖水瓶还在桌边。']];n.choices=[['倒杯热水。','teaPour'],['先放下。','close']];}
   if(id==='teaPour')n.lines=[['旁白','往杯中添了些水，喝完放回原处。']];
  }
  if(id==='teaPour'&&['morning','depart','return'].includes(state.phase))n.lines=[['旁白','添了半杯水。门开着，外面有雨后潮湿的草木气味。']];
  if(id==='chairJoint'&&['morning','depart','return'].includes(state.phase)&&!state.spoken?.includes(id))n.lines[2][1]='桌上有样木，拿那个试。这把给邻居留着，今天还得来取。';
  if(id==='teacherMemory'&&!state.spoken?.includes(id)&&state.spoken?.includes('heritage'))n.lines[0][1]='刚学那会儿，我父亲拿来一把晃腿的椅子，叫我找毛病。';
  if(id==='dailyLife'&&['morning','depart','return'].includes(state.phase))n.lines=state.spoken?.includes(id)?[['周伯','门常开着。下回路过，进来坐坐就是。']]:[['周伯','早上去菜地，回来修点东西。门开着，总有人进来坐坐。'],['我','昨晚幸好您还没关门。'],['周伯','下回路过直接喊我，别站外头淋着。']];
  if(id==='travelMessage'&&state.companionUpdated)n.lines=[['周伯','认浅色布带。回来推小车，别硬扛。']];
  if(id==='benchMemory'&&!state.spoken?.includes(id)&&state.fieldNotes?.includes('chair-patina'))n.lines=[['周伯','十几年了。等车的、买菜回来的，走累了都坐这儿。'],['我','和屋里那把椅子一样，没坏的木头就留下？'],['周伯','对。坐了这么多年，没必要全换新的。修稳当了，接着用。']];
  if(id==='benchMemory'&&['farewell','complete'].includes(state.phase))n.lines=state.spoken?.includes(id)?[['周伯','这回稳了，又能接着用了。等车的人常坐这里。']]:[['周伯','十几年了。等车的、买菜回来的，走累了都坐这儿。'],['我','换了几块木头，看着还是原来那条凳子。'],['周伯','好的留着，坏的换掉。坐上去稳当就好。']];
  if(id==='chairAge'&&['bench','farewell','complete'].includes(state.phase))n.lines=[['旁白','旧椅子靠在墙边，座沿磨得发亮。想问它的来历，得去雨棚找周伯。']];
  return n;
 }
 function allowed(id,s){
  if(root.CampaignContinuation?.nodes[id])return root.CampaignContinuation.allowed(id,s);
  if(!s||!nodes[id])return false;
  if(['opening','villageArrival','shelterFirst','doorKnock','welcomeInside','unpack','arrival','road','stay'].includes(id)){
   if(s.phase!=='arrival')return false;
   const p=s.prologue;if(!p||p.legacy)return !['doorKnock','welcomeInside','unpack','villageArrival'].includes(id);
   if(id==='opening')return p.stage==='mountain';
   if(id==='doorKnock')return !p.invited&&p.stage!=='mountain';
   if(id==='welcomeInside'||id==='unpack')return p.invited&&!p.bagPlaced&&p.stage==='indoors';
   if(['arrival','road','stay'].includes(id))return p.bagPlaced;
   return p.stage!=='mountain';
  }
  if(id.startsWith('after:'))return ['learning','night'].includes(s.phase)&&s.done?.includes(id.slice(6));
  if(['morning','caveBackground','travelMessage'].includes(id))return ['morning','depart'].includes(s.phase)&&s.scene!=='cave';
  if(['departing','caveEnter'].includes(id))return s.phase==='depart'&&s.scene!=='cave';
  if(['supplies','supplySketch'].includes(id))return s.phase==='cave'&&canReturn(s);
  if(id==='returned')return s.phase==='return';
  if(id==='checked')return s.phase==='farewell'&&!s.benchChecked;
  if(id==='night')return s.phase==='night';
  if(id==='invite')return ['arrival','settle'].includes(s.phase)&&s.scene!=='cave';
  if(['heritage','teacherMemory','dailyLife','toolsUse','zhou'].includes(id))return s.scene!=='cave'&&!['bench','farewell','complete'].includes(s.phase);
  if(['benchHelp','benchMemory'].includes(id))return ['bench','farewell','complete'].includes(s.phase);
  if(id==='farewellReady')return s.phase==='farewell'&&s.benchChecked;
  if(id==='farewellChat')return s.phase==='complete';
  return s.scene!=='cave';
 }
 function hostTopic(s){if(s.phase==='arrival')return 'arrival';if(s.phase==='morning')return 'morning';if(s.phase==='depart')return 'departing';if(s.phase==='return')return 'returned';if(s.phase==='bench')return 'benchHelp';if(s.phase==='farewell')return s.benchChecked?'farewellReady':'checked';if(s.phase==='complete')return 'farewellChat';if(s.phase==='night')return 'night';return 'zhou';}
 // Recover a suspended conversation where its speaker and referenced objects are present.
 // Old saves may contain a talk left behind after a notebook rehearsal and later travel.
 function frameFor(id,s){
  if(!allowed(id,s))return null;
  if(root.CampaignContinuation?.nodes[id])return root.CampaignContinuation.away(s)?null:'shelter';
  const frames=id==='opening'?[s.prologue?.legacy?'village':'mountain-rain']:id==='villageArrival'?['village']:id==='shelterFirst'?['shelter']:id==='doorKnock'?['zhou-door']:['welcomeInside','unpack','arrival','road','stay'].includes(id)?['room']:id==='caveEnter'?['trail','store-door']:['supplies','supplySketch'].includes(id)?['store-sky','store-middle','store-shallow','store-door']:['benchHelp','benchMemory','checked','farewellReady','farewellChat'].includes(id)?['shelter','bench-detail']:['room','workbench','chair-detail','tools-detail','chair-seat'];
  return frames.includes(s.frame)?s.frame:frames[0];
 }
 const api={revision,nodes,resolve,hostTopic,allowed,frameFor};root.CampaignStory=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);


