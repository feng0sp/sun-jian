/* Stable conversation nodes for a rainy evening. Choices never move puzzle pieces. */
(function(root){
 'use strict';
 const nodes={
  "arrival":{"lines":[["我","您好，能进来躲会儿雨吗？我们刚从山上下来。"],["周伯","进来，鞋在垫子上蹭蹭。我姓周。前面的路窄，天黑又下雨，今天别赶了。"]],"choices":[{"id":"ask-stay","text":"要是方便，能在您这儿借住一晚吗？","to":"stay"},{"id":"ask-road","text":"村口还有能落脚的地方吗？","to":"road"}]},
  "road":{"lines":[["周伯","雨棚后面有家民宿。你先问问同伴住哪儿；实在不方便，我后屋也空着。"]],"next":"arrival-choice"},
  "arrival-choice":{"lines":[["我","窗外已经看不清山路了。我掏出手机，看了看同伴发来的消息。"]],"choices":[{"id":"ask-stay","text":"要是方便，能在您这儿借住一晚吗？","to":"stay"}]},
  "stay":{"lines":[["周伯","后屋有床，就住这儿吧。包靠门边放，湿外套搭起来。"],["同伴的消息","我们住进村口民宿了。知道你在周伯家就放心了，明早联系。"],["周伯","那把椅子刚修好，坐坐看。热水也有，自己倒。"]],"next":"$settled"},
  "chair":{"focus":"chair","lines":[["周伯","邻居送来的旧椅子，今天刚修好。底下这根横木原先松了，一坐就晃。你坐坐看。"]],"choices":[{"id":"chair-sit","text":"坐坐看","to":"sit","experience":"chair-sit"},{"id":"chair-joint","text":"没用钉子，是怎么接牢的？","to":"chair-joint","experience":"chair-joint"},{"id":"chair-age","text":"这把椅子用了多久？","to":"chair-age","experience":"chair-age"},{"id":"chair-leave","text":"我再看看别的","to":"$close"}],"revisit":{"when":["chair-sit"],"line":["周伯","刚坐着还稳吧？哪处想看，你慢慢问。"]}},
  "sit":{"action":"sit","resume":"chair","lines":[["我","坐下的一瞬，走山路的酸劲儿才涌上来。我轻轻动了动，椅子很稳。"],["我","哎，还真一点也不晃。"],["周伯","那就对了。刚送来的时候，可没这么老实。你先歇着，别替我试到天亮啊。"]],"choices":[{"id":"stand-up","text":"起身，再看看椅子的接头","to":"chair-joint","complete":"chair-sit"},{"id":"stand-back","text":"起身，回到屋里看看","to":"$close","complete":"chair-sit"}]},
  "chair-joint":{"shot":"chair","lines":[["周伯","你看，横木有一截伸进椅腿里。伸进去的叫榫，里面接它的孔叫卯。"],["我","外面只看见一道缝，里面还藏着这么一截。"],["周伯","嗯，几面贴好了，它就不容易晃。修的时候，我得先看是哪一处松了。"],["周伯","桌上有几块我做的小样。比椅子上的接头大，拿开就能看见里面。想看的话，待会儿试试。"]],"choices":[{"id":"chair-learn","text":"您平时也教别人做吗？","to":"heritage","complete":"chair-joint"},{"id":"chair-back","text":"再看看这把椅子","to":"chair","complete":"chair-joint"},{"id":"chair-close","text":"我先自己观察一会儿","to":"$close","complete":"chair-joint"}]},
  "chair-age":{"lines":[["周伯","二十多年了。邻居搬家都带着，说坐惯了。木料还好，修稳了接着用。"]],"next":"$back","complete":"chair-age"},
  "tea":{"focus":"tea","lines":[["周伯","杯子是洗过的，暖水瓶就在边上。先喝点热的，手都冻凉了吧。"]],"choices":[{"id":"tea-pour","text":"倒一杯热水","to":"pour","experience":"tea-pour"},{"id":"tea-life","text":"您平时都在这里做木工吗？","to":"daily","experience":"tea-life"},{"id":"tea-leave","text":"我先看看别处","to":"$close"}],"revisit":{"when":["tea-pour"],"line":["周伯","水就放这儿，凉一点再喝。暖水瓶里还有，自己添。"]}},
  "pour":{"focus":"tea","action":"pour","resume":"tea","lines":[["我","我倒了半杯热水，把暖水瓶放回原处。杯口慢慢冒出白汽。"],["周伯","刚灌的，烫。搁那儿一会儿，别急着喝。"],["我","好。隔着杯子暖暖手，也挺舒服。"]],"choices":[{"id":"tea-put","text":"放好杯子，再聊两句","to":"tea","complete":"tea-pour"},{"id":"tea-done","text":"放好杯子，看看别处","to":"$close","complete":"tea-pour"}]},
  "daily":{"lines":[["周伯","早上买菜，谁家有松椅子、卡柜门，就捎回来。下午有人来学，这儿才热闹。"]],"next":"$back","complete":"tea-life"},
  "tools":{"focus":"tools","lines":[["我","几把刨子排在一起，把手磨得发亮。一旁的凿子大小不一，挂回去的位置都留着印子。"]],"choices":[{"id":"tools-plane","text":"看看那把刨子","to":"plane","experience":"tools-plane"},{"id":"tools-use","text":"这些工具现在还常用吗？","to":"tool-use","experience":"tools-use"},{"id":"tools-past","text":"您是怎么学会这门手艺的？","to":"past","experience":"tools-past"},{"id":"tools-leave","text":"我再看看别的","to":"$close"}],"revisit":{"when":["tools-plane","tools-use","tools-past"],"line":["周伯","这些我天天用。还有哪把想问的？"]}},
  "plane":{"focus":"tools","lines":[["周伯","右边这把常用，把手都磨亮了。刃磨好、木料顺，能刨出一长条木花。刀口利，别上手摸。"]],"next":"$back","complete":"tools-plane"},
  "tool-use":{"lines":[["周伯","用。开大料会用电动的，修这些小地方，还是老家伙顺手。"],["我","那这墙上挂的，都是在干活的。"],["周伯","那可不是摆设。哪把少了，我一摸就知道。"]],"next":"$back","complete":"tools-use"},
  "past":{"lines":[["周伯","年轻时跟师傅干，先收料，再站旁边看。也急着做过，做歪了自己拆，才知道动手前得想明白。"]],"next":"heritage","complete":"tools-past"},
  "zhou":{"lines":[["周伯","暖和些了吧？想问什么就问。我手上这点活儿，不耽误说话。"]],"choices":[{"id":"zhou-wood","text":"您修东西，怎么看出毛病的？","to":"wood","experience":"zhou-wood"},{"id":"zhou-teach","text":"您平时也教别人吗？","to":"heritage","experience":"heritage-known"},{"id":"zhou-try","text":"桌上这几块，能让我试试吗？","to":"$invite","when":"unlearned"},{"id":"zhou-task","text":"手边这件，您再给我提个醒？","to":"task-help","when":"learning"},{"id":"zhou-evening","text":"今天这些接头，我还想再想想","to":"reflection","when":"finished"},{"id":"zhou-leave","text":"我先自己看看","to":"$close"}],"revisit":{"when":["zhou-wood","heritage-known"],"line":["周伯","歇过来些了？我在这儿呢，想聊什么接着聊。"]}},
  "wood":{"lines":[["周伯","也得晃一晃、摸一摸，拆开才知道。你来得巧，没看见我前面折腾。"]],"next":"$back","complete":"zhou-wood"},
  "heritage":{"lines":[["周伯","村里的传统木作传习，我也带一带。他们叫我非遗传承人，你还是叫周伯就好。"],["周伯","先认接头，再学着做东西。有人肯接着做，这手艺就留得住。"]],"choices":[{"id":"heritage-try","text":"那我能试试吗？","to":"invitation","when":"unlearned","heritage":true},{"id":"heritage-more","text":"刚上手，先学什么比较好？","to":"teaching","heritage":true},{"id":"heritage-back","text":"我先看看，待会儿再麻烦您","to":"$close","heritage":true}],"revisit":{"when":["heritage-known"],"line":["周伯","周末来的人多些，屋里满地木屑。今天不赶时间，想看哪处，咱们接着聊。"]}},
  "teaching":{"lines":[["周伯","别急着使劲。拿不动，就先停一下，看是哪儿顶住了。"],["我","我刚才还想着，手劲够不够。"],["周伯","哈哈，这几块还用不上拼手劲。先弄明白往哪儿有空，比硬拔省事。"]],"next":"invitation"},
  "invitation":{"lines":[["周伯","拿台前这块试试。先拆开，最后再合回去；碰住了就停一下，看清接头。"]],"choices":[{"id":"accept-learning","text":"好，我来试试","to":"$learn","when":"unlearned"},{"id":"continue-learning","text":"我再去摆弄一会儿","to":"$close","when":"learned"},{"id":"defer-learning","text":"我先歇会儿，待会儿再试","to":"$close"}]},
  "sample":{"lines":[["我","桌上的木块留着几道整齐的接缝。我凑近看了看，还没弄懂里面怎么连着。"],["周伯","想看就拿近些。要是想拆，我陪你试。"]],"choices":[{"id":"sample-ask","text":"您常用这些教人吗？","to":"heritage"},{"id":"sample-try","text":"您教我试试？","to":"$invite"},{"id":"sample-leave","text":"先放回去","to":"$close"}]},
  "task-help":{"lines":[["周伯","你先转着看看。这里碰住了，别处说不定还有个口。"],["周伯","不放心就撤回上一步。台边也有线索，卡住了再看，不着急。"]],"next":"$back","taskLines":{"straight-out":[["周伯","看台前这一块，深色和浅色交界的那一圈就是接缝。先分清哪些面贴着。"],["周伯","转个角度也行。手上碰住就停，不用一次猜准。"]],"lap-out":[["周伯","这两根在中间交叠。你从侧面看看，哪儿少了一块，哪儿又压在上面。"],["周伯","看明白眼前这处就行，别急着记先后。拿开一根，剩下的还得再看。"]],"pinned-out":[["周伯","先把大木榫和小销认清，看看它们各穿到哪儿。里面看不清，也可以透着看。"],["周伯","碰到谁，就盯着那个接点看看。卡着你的，未必是最大的那块。"]],"straight-back":[["周伯","刚才取下的木榫，再对着卯口看看。榫肩留在外面，别把它也往里面塞。"],["周伯","选中木件后，把鼠标停在方向按钮上，先看箭头从哪一侧进来，再动手。"]]}},
  "reflection":{"lines":[["我","现在看桌上的木头，和刚进门的时候不一样了。"],["周伯","里面藏着什么，心里有个数了吧。换件家具，还得重新看，别照着今天这几块硬套。"]],"next":"$back"},
  "after-2":{"lines":[["周伯","没有钉子也能接牢。凸出来的叫榫，接它的口叫卯；留意刚才贴在一起的几面。"]],"choices":[{"id":"ask-straight","text":"是不是塞得越紧就越牢？","to":"explain-2"},{"id":"next-lap","text":"旁边那两根，也让我看看","to":"$advance"}],"revisit":{"when":["asked-fit"],"line":["周伯","还想看看这处，还是试试旁边的两根？"]}},
  "explain-2":{"lines":[["周伯","也不能一味求紧。太紧了不好装，还得考虑木料和用途。先配得合适，才有后面的稳当。"]],"next":"after-2","complete":"asked-fit"},
  "after-4":{"lines":[["周伯","两根各让出一半，合起来不变厚。能从哪边拿开，要看接面有没有挡住。"]],"choices":[{"id":"ask-lap","text":"这两根一定要按顺序拿吗？","to":"explain-4"},{"id":"next-pin","text":"后面带小销的那块呢？","to":"$advance"}],"revisit":{"when":["asked-lap-order"],"line":["周伯","这两根放好了。还有哪儿没看明白？"]}},
  "explain-4":{"lines":[["周伯","不一定。这两根都有能出去的时候。你看眼前谁被挡住，别只背先拿哪一根。"]],"next":"after-4","complete":"asked-lap-order"},
  "after-6":{"lines":[["周伯","小销正好穿过接点。它一退出来，大木榫才有地方动。"]],"choices":[{"id":"ask-pin","text":"做成小销，是不是也方便以后拆开？","to":"explain-6"},{"id":"next-assembly","text":"我来把第一件装回去","to":"$advance"}],"revisit":{"when":["asked-pin-repair"],"line":["周伯","小销收好就行。要不，把第一件合回去试试？"]}},
  "explain-6":{"lines":[["周伯","这块小样是专门做成能拆的。真碰到家具，还得看它怎么做，不能见着一根销就拔。"]],"next":"after-6","complete":"asked-pin-repair"},
  "after-8":{"lines":[["周伯","榫肩贴齐，接缝就对上了。这块留着，下次给别人试。"],["周伯","旁边还有三件，想玩就接着玩。饭好了我叫你。"]],"choices":[{"id":"end-note","text":"记两笔，留下吃晚饭","to":"$end"},{"id":"end-thanks","text":"谢谢您，明早走前我再帮着收拾","to":"thanks"}]},
  "thanks":{"lines":[["周伯","客气什么。鞋子放门边晾晾，明早走着也舒服些。"]],"next":"$end"},
  "sample-straight":{"sample":"straight","label":"直榫样木","stored":"木榫放在托盘里，台前留下空卯座。原来藏在里面的那一截，现在可以仔细看看。","lines":[["我","浅色木榫与深色卯座接在一起。接口上方，留着一圈平整的榫肩。"]],"choices":[{"id":"sample-task","text":"接着动手","to":"$task","when":"sample-current"},{"id":"sample-inspect","text":"转着观察","to":"$inspect"},{"id":"sample-question","text":"问周伯","to":"sample-straight-talk","experience":"sample-straight-talk"},{"id":"sample-dismantle","text":"拿出来拆拆看","to":"$study:dismantle","when":"sample-learned"},{"id":"sample-assemble","text":"试着拼回去","to":"$study:assemble","when":"sample-learned"},{"id":"sample-try","text":"您教我试试？","to":"$invite","when":"unlearned"},{"id":"sample-leave","text":"放回","to":"$close"}]},
  "sample-straight-talk":{"lines":[["周伯","这一圈叫榫肩，合好时贴着卯座。不是把木头塞进去就行，还得看看这一圈齐不齐。"],["我","所以从外面的接缝，也能看出有没有装到位？"],["周伯","对。里面贴得怎样，外面也会露出点消息。拿近些，两边都看看。"]],"next":"$back","complete":"sample-straight-talk","revisit":{"when":["sample-straight-talk"],"line":["周伯","还是看榫肩这一圈：合好了，它和卯座贴得齐不齐？"]}},
  "sample-lap":{"sample":"lap","label":"半榫木条","stored":"两根木条并排收在箱里，凹口都露着。拿出来，就能重新配在一起。","lines":[["我","两根木条交叠的地方，各挖去一半厚度。凹口一上一下，刚好错开。"]],"choices":[{"id":"sample-task","text":"接着动手","to":"$task","when":"sample-current"},{"id":"sample-inspect","text":"转着观察","to":"$inspect"},{"id":"sample-question","text":"问周伯","to":"sample-lap-talk","experience":"sample-lap-talk"},{"id":"sample-dismantle","text":"拿出来拆拆看","to":"$study:dismantle","when":"sample-learned"},{"id":"sample-assemble","text":"试着拼回去","to":"$study:assemble","when":"sample-learned"},{"id":"sample-try","text":"您教我试试？","to":"$invite","when":"unlearned"},{"id":"sample-leave","text":"放回","to":"$close"}]},
  "sample-lap-talk":{"lines":[["周伯","一根让一点，另一根也让一点，叠起来就不会鼓出一块。"],["我","我从旁边比比看——合起来，还是原来的厚度。"],["周伯","是啊。再看看哪一根压着哪一根，心里就有数了。"]],"next":"$back","complete":"sample-lap-talk","revisit":{"when":["sample-lap-talk"],"line":["周伯","从侧面比比厚度，再转过来看凹口。两种看法对照着来。"]}},
  "sample-pinned":{"sample":"pinned","label":"穿销样木","stored":"木榫和小销分开放在托盘里。台上的空卯座露出了销孔，里面的关系清楚多了。","lines":[["我","一根小销横穿接点。比起大木榫，它很不起眼，却正好挡在相接的地方。"]],"choices":[{"id":"sample-task","text":"接着动手","to":"$task","when":"sample-current"},{"id":"sample-inspect","text":"转着观察","to":"$inspect"},{"id":"sample-question","text":"问周伯","to":"sample-pinned-talk","experience":"sample-pinned-talk"},{"id":"sample-dismantle","text":"拿出来拆拆看","to":"$study:dismantle","when":"sample-learned"},{"id":"sample-assemble","text":"试着拼回去","to":"$study:assemble","when":"sample-learned"},{"id":"sample-try","text":"您教我试试？","to":"$invite","when":"unlearned"},{"id":"sample-leave","text":"放回","to":"$close"}]},
  "sample-pinned-talk":{"lines":[["周伯","看小销穿过的位置。大木榫想挪动，就先碰上它了。"],["我","两处孔都对上，它才能从中间穿过去。"],["周伯","没错。你拆开再配一遍，看看孔是怎么对上的。"]],"next":"$back","complete":"sample-pinned-talk","revisit":{"when":["sample-pinned-talk"],"line":["周伯","两处孔对上，小销才穿得过去。拿近些看，挺清楚的。"]}},
  "sample-dovetail":{"sample":"dovetail","label":"燕尾滑榫","lines":[["我","木条嵌在一道斜槽里。槽口的宽窄有变化，一端还立着一枚小木钥。"]],"choices":[{"id":"sample-task","text":"接着动手","to":"$task","when":"sample-current"},{"id":"sample-inspect","text":"转着观察","to":"$inspect"},{"id":"sample-question","text":"问周伯","to":"sample-dovetail-talk","experience":"sample-dovetail-talk"},{"id":"sample-dismantle","text":"拿出来拆拆看","to":"$study:dismantle","when":"sample-learned"},{"id":"sample-assemble","text":"试着拼回去","to":"$study:assemble","when":"sample-learned"},{"id":"sample-try","text":"您教我试试？","to":"$invite","when":"unlearned"},{"id":"sample-leave","text":"放回","to":"$close"}],"stored":"燕尾榫和小木钥分开放在卯座旁边。槽里的斜面，这回能完整地看到了。"},
  "sample-dovetail-talk":{"lines":[["周伯","看它的截面，下边宽，上边窄。往上拿和顺着槽走，碰到的地方就不一样。"],["我","出口这儿，还有一枚小木钥。"],["周伯","嗯，和刚才的销放一块儿想想。一个看形状，一个看谁挡着谁。"]],"next":"$back","complete":"sample-dovetail-talk","revisit":{"when":["sample-dovetail-talk"],"line":["周伯","顺着槽看一遍，再从上面看一遍，同一处斜面，两边都管着。"]}},
  "sample-shoulder-lap":{"sample":"shoulder-lap","label":"锁肩搭接","lines":[["我","一枚横销、两根搭木，还有底下的承座，几处熟悉的接头连在了一起。"]],"choices":[{"id":"sample-task","text":"接着动手","to":"$task","when":"sample-current"},{"id":"sample-inspect","text":"转着观察","to":"$inspect"},{"id":"sample-question","text":"问周伯","to":"sample-shoulder-lap-talk","experience":"sample-shoulder-lap-talk"},{"id":"sample-dismantle","text":"拿出来拆拆看","to":"$study:dismantle","when":"sample-learned"},{"id":"sample-assemble","text":"试着拼回去","to":"$study:assemble","when":"sample-learned"},{"id":"sample-try","text":"您教我试试？","to":"$invite","when":"unlearned"},{"id":"sample-leave","text":"放回","to":"$close"}],"stored":"横销与两根搭木排在承座前。分开看，几处孔槽各管着不同的地方。"},
  "sample-shoulder-lap-talk":{"lines":[["周伯","先认眼熟的地方。这儿有销，也有两根木相搭的口，都是前面见过的。"],["我","只是这回放在了一起，得多看几处。"],["周伯","嗯。解开一处，再看剩下的，别想着一把全拿下来。"]],"next":"$back","complete":"sample-shoulder-lap-talk","revisit":{"when":["sample-shoulder-lap-talk"],"line":["周伯","先认一处熟悉的接头。解开以后，再看还有谁贴着谁。"]}},
  "sample-burr-three":{"sample":"burr-three","label":"三件初锁","lines":[["我","三根开槽木条交错成一个结。顺着木纹看过去，中央的槽口还有另一番样子。"]],"choices":[{"id":"sample-task","text":"接着动手","to":"$task","when":"sample-current"},{"id":"sample-inspect","text":"转着观察","to":"$inspect"},{"id":"sample-question","text":"问周伯","to":"sample-burr-three-talk","experience":"sample-burr-three-talk"},{"id":"sample-dismantle","text":"拿出来拆拆看","to":"$study:dismantle","when":"sample-learned"},{"id":"sample-assemble","text":"试着拼回去","to":"$study:assemble","when":"sample-learned"},{"id":"sample-try","text":"您教我试试？","to":"$invite","when":"unlearned"},{"id":"sample-leave","text":"放回","to":"$close"}],"stored":"三根开槽木条并排放在桌上。原来在中央抱成一团的凹口，都露了出来。"},
  "sample-burr-three-talk":{"lines":[["周伯","每根都空出一点地方，先让别的木条进来。配上以后，剩下的木面又互相挡住。"],["我","看着绕，不过还是得找谁挡着谁。"],["周伯","没错。别急着拔，先把中央转到眼前。就三根，咱一根根看。"]],"next":"$back","complete":"sample-burr-three-talk","revisit":{"when":["sample-burr-three-talk"],"line":["周伯","就看中间这几道口，别被外面伸出来的木条绕住。"]}}
 };
 const roots=["chair","tea","tools","zhou","sample","sample-straight","sample-lap","sample-pinned","sample-dovetail","sample-shoulder-lap","sample-burr-three"];
 nodes['doubt-2']={lines:[['我','刚才是拆开了，可让我再讲一遍，我还说不清。'],['周伯','不急。拿开以后再看看：哪一面是实木，哪一处留着口。先把眼前这块认清，就已经学到一点了。']],choices:[{id:'doubt-inspect',text:'我拿近些，再转着看看',to:'$inspect-last'},{id:'doubt-back',text:'嗯，我慢慢来',to:'after-2',complete:'asked-look-again'}]};
 nodes['doubt-8']={lines:[['我','这几块算是认得了。换个样子，我可能还是不知道从哪儿下手。'],['周伯','谁也不是看一眼就都知道。换了样子，就重新找接缝、看接点。碰住了，停下来再看。'],['周伯','不用今晚全学会。饭前愿意再摆弄两下就摆弄，累了就歇着。']],choices:[{id:'doubt-last-look',text:'那我再看看刚合好的这一件',to:'$inspect-last'},{id:'doubt-finish',text:'好，先把今天看懂的记下来',to:'after-8',complete:'asked-next-time'}]};
 nodes['after-2'].choices.unshift({id:'still-looking',text:'拆开了，我还想再看明白一点',to:'doubt-2'});
 nodes['after-8'].choices.unshift({id:'next-time',text:'换一个样子，我还能认出来吗？',to:'doubt-8'});
 for(const beat of [2,4,6,8])nodes['after-'+beat].choices.splice(-1,0,{id:'review-my-move',text:'我再看看刚才是怎么动的',to:'$record'});
 // Respond to what actually happened, without saving another copy of the dialogue.
 // Keep each node's line count stable so older in-conversation saves still resume.
 function contextualLines(id,state){
  const original=nodes[id]?.lines;if(!original)return null;
  const lines=original.map(line=>[...line]),runs=state.runs||{},studies=state.studyRuns||{},run=runs[{'after-2':'straight-out','after-4':'lap-out','after-6':'pinned-out','after-8':'straight-back'}[id]];
  if(id==='chair-joint'&&state.completed.includes('pinned-out'))return [
   ['周伯','刚才那几块拆过了，再看这里，是不是好认些？横木这一头伸进椅腿，外面留着一道接缝。'],
   ['我','刚进门只顾着坐，现在会先看它们接在什么地方了。'],
   ['周伯','嗯。不过真家具不能照着小样去拔。得先查哪一处松了，再决定怎么修。'],
   ['周伯','这把是把松动处重新配好了。坐着稳，是几处接头一块儿起作用，不只眼前这一处。']
  ];
  if(id==='sit'&&state.experienced.includes('chair-sit'))return [
   ['我','我又坐回椅子上，肩膀跟着松下来。桌上的木件还摆在灯下。'],
   ['我',state.completed.includes('straight-out')?'这次会留意下面的接缝了。轻轻动了动，还是很稳。':'坐着确实舒服些，刚才走路的酸劲还没散。'],
   ['周伯','稳就好。歇着吧，屋里又没谁催你。']
  ];
  if(id==='sample-straight-talk'&&(studies['straight:assemble']?.history.length||runs['straight-back']?.history.length))return [
   ['周伯','你合回去时，有留意到外面这一圈吗？榫肩贴齐了，接缝才利落。'],
   ['我','原来装没装到位，不只看它有没有进去，还要看看外面。'],
   ['周伯','对。转过来，两边都看看。手上做过一遍，再看这圈就好认了。']
  ];
  const pinFit=studies['pinned:assemble'];
  if(id==='sample-pinned-talk'&&pinFit?.history.length===1&&pinFit.history[0].piece==='pin'&&pinFit.trial?.blockedSinceProgress>0)return [
   ['我','我先把小销放回去了，大木榫反而进不来了。'],
   ['周伯','小销穿在中间，先归位就又挡住了。把上一步撤回来，再看看孔要怎样才能对上。'],
   ['周伯','拆的时候看谁挡着谁，合回去也一样。留一点位置，别急着把每件都塞回去。']
  ];
  if(id==='sample-burr-three-talk'&&studies['burr-three:dismantle']?.history.length===3)return [
   ['我','拆开摆在一起，中间这几道槽就不那么绕了。刚才从外面看，还以为它是实心的一团。'],
   ['周伯','每根都让出了一点地方，合起来才互相抱住。别光看伸出来的木条，得看中间留下了什么。'],
   ['周伯','要不试着合回去？拿不准，就回看你刚才怎么拆的，再转着对照。']
  ];
  if(!run?.history?.length)return lines;
  if(id==='after-2'&&run.trial?.blocked>0){lines[0]=['我','刚才碰住的时候，我还想再使点劲。拆开才看见，碰住的那面是实木，当然挪不动。'];lines[1]=['周伯','碰住的是实木，别跟它较劲。凸的叫榫，接它的口叫卯；先看清哪几面贴着。'];}
  else if(id==='after-2'&&run.trial?.hintLevel>0){lines[0]=['我','顺着您说的接缝看过去，才发现里面藏着这么长一截。'];lines[1]=['周伯','嗯，取下来就看清了。凸的叫榫，接它的口叫卯。下一块，你先自己看看。'];}
  if(id==='after-4'&&run.history[0].piece==='lower'){lines[0]=['我','我先拿下面这根，也能分开。两道缺口一露出来，才看清它们是怎么搭着的。'];lines[1]=['周伯','下面这根也能先拿，关键是那一侧有没有挡住。两根各让出一半，搭起来厚度刚好。'];}
  else if(id==='after-4'){lines[0]=['我','上面这根一拿开，底下的缺口就看清了。'];lines[1]=['周伯','上面这根拿开，交叠的接面就露出来了。两根各让出一半，搭起来厚度刚好。'];}
  if(id==='after-6'&&run.trial?.blocked>0){lines[0]=['我','难怪刚才拿不动。这根小销一退出，大木榫就松开了。'];lines[1]=['周伯','对，得看它卡在哪儿，不是看它有多大。这根单放，混进木屑里可不好找。'];}
  if(id==='after-8'&&run.trial?.blocked>0){lines[0]=['我','刚才没对上开口，难怪碰住了。对着卯口，才贴得进去。'];lines[1]=['周伯','嗯。再看看这一圈榫肩，贴齐了，就装到位了。留着，下次有人来给他试。'];}
  return lines;
 }
 function linesFor(id,state){const lines=contextualLines(id,state);if(!lines)return null;const run=state.runs?.[{'after-2':'straight-out','after-4':'lap-out','after-6':'pinned-out','after-8':'straight-back'}[id]];if(['after-2','after-4','after-6'].includes(id))return [lines[1]||nodes[id].lines[0]];if(id==='after-8')return [run?.trial?.blocked>0?lines[1]:nodes[id].lines[0],nodes[id].lines.at(-1)];return lines;}

 function sampleReply(id,state){
  const pin=state.studyRuns?.['pinned:assemble'];
  if(id==='pinned'&&pin?.history.length===1&&pin.history[0].piece==='pin'&&pin.trial?.blockedSinceProgress>0)return '小销先进去，大木榫反而进不来。撤回那一步，留出通道，再看看两处孔怎么对齐。';
  return {straight:'这一圈叫榫肩，合好时贴住卯座。看接缝齐不齐，就能判断有没有装到位。',lap:'两根各让出一半厚度，叠起来才不会鼓起。转到侧面，看凹口怎么相搭。',pinned:'小销同时穿过两处孔，大木榫一动就碰上它。拆开后，看看销孔各在哪儿。',dovetail:'槽的斜面管住上拔，出口的木钥管住滑动。两处限制要分开看。','shoulder-lap':'先认横销，再看两根木的搭口。解开一处后，重新看看还剩谁挡着谁。','burr-three':'看中央的槽，别只看伸出的木条。每根让出的位置，正好容得下另外的木件。'}[id]||'转着看看接面，碰住了就停。';
 }
 const api={nodes,roots,linesFor,sampleReply};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.JourneyTalk=api;
})(typeof window==='undefined'?globalThis:window);
