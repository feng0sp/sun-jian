(function(root){
 'use strict';
 const Talk=typeof module!=='undefined'&&module.exports?require('./story-talk.js'):root.JourneyTalk;
 const tasks=[
  {id:'straight-out',beat:1,levelId:'straight',mode:'dismantle',hotspot:'straight',title:'把台前的样木分开放',objective:'观察接缝，把可动的样木取下，放进托盘。',blocked:'周伯：碰住就先停一下。转过来看看，哪儿还留着口。'},
  {id:'lap-out',beat:3,levelId:'lap',mode:'dismantle',hotspot:'lap',title:'收好交叠的两根木条',objective:'看看交叠处，把两根木条分开放进箱里。',blocked:'周伯：先别急。看中间叠着的地方，哪根在上面？'},
  {id:'pinned-out',beat:5,levelId:'pinned',mode:'dismantle',hotspot:'pinned',title:'整理带销的接点样件',objective:'辨认接点，把可动的木件分别收进托盘。',blocked:'周伯：这里头好像还穿着点什么。你慢慢看，我不急。'},
  {id:'straight-back',beat:7,levelId:'straight',mode:'assemble',hotspot:'straight',title:'把最先的样木合回去',objective:'对准卯口，把托盘里的木榫装回原位。',blocked:'周伯：先把卯口找准。别往实木上顶，给它留条进来的路。'}
 ];
 const opening=[['路上','雨下起来时，我们刚走出山路。再往前不太好走，大家决定先到溪桥村落脚。'],['同伴的消息','我们去村口那家民宿问问。你先找个地方躲雨，安顿好了发消息，别一直淋着。'],['我','路边一户人家的门开着。屋里，一位老人正收拾工作台上的木料。'],['我','先去问问，能不能借个地方避雨。']];
 const dialogues=Object.fromEntries([0,2,4,6,8].map(beat=>[beat,Talk.nodes[beat?'after-'+beat:'arrival'].lines]));
 const notes=[
  {id:'straight',task:'straight-out',name:'一处直榫',text:'先找卯口，再看哪些接触面限制了移动。',memory:'台前的样木取下后，卯口终于露了出来。'},
  {id:'lap',task:'lap-out',name:'交叠的半榫',text:'看交叠处谁在上、谁在下，判断哪里还有活动空间。',memory:'两根木条各让出一半厚度，合起来仍是一根木料的厚度。'},
  {id:'pinned',task:'pinned-out',name:'小小的穿销',text:'遇到被贯穿的接点，先检查穿过它的小件。',memory:'那根小销退出后，原来被锁住的木榫重新有了活动空间。'}
 ];
 const inspections=Object.fromEntries(['tea','tools','chair','zhou'].map(id=>[id,Talk.nodes[id].lines[0]]));
 const extras=[
  {id:'dovetail',name:'燕尾滑榫',extra:true,text:'观察宽窄不同的槽口，分别判断滑动与上拔受到什么约束。',memory:'周伯：这件加了止退木钥。它是组合学习样件，先看形状，再看小件的作用。',response:'木条回到槽里，小木钥也放稳了。'},
  {id:'shoulder-lap',name:'锁肩搭接',extra:true,text:'一件木可能同时被横销、搭接面和承座限制，逐处检查接点。',memory:'周伯：这是把穿销和搭接放在一起的组合练习。想想前面两种观察方法怎样一起用。',response:'搭木对上了，横销也穿回原位。'},
  {id:'burr-three',name:'三件初锁',extra:true,text:'比较三根木条在中央的槽口，退出方向不一定沿着木纹。',memory:'周伯：这是三件互锁的学习模型。先弄清三根木各在什么方向，再看中央留出的空间。',response:'三根木又抱在一起。转一转，看看中央怎么接上。'}
 ];
 const samples=[...notes,...extras];
 function canStudy(s,id){const n=samples.find(n=>n.id===id);return !!n&&(n.extra?s.beat===9:s.completed.includes(n.task));}
 function displayMode(s,id){
  if(s.beat===9&&['dismantle','assemble'].includes(s.placements?.[id]))return s.placements[id];
  if(id==='straight')return s.completed.includes('straight-out')&&!s.completed.includes('straight-back')?'dismantle':'assemble';
  return samples.find(n=>n.id===id)?.task&&s.completed.includes(samples.find(n=>n.id===id).task)?'dismantle':'assemble';
 }
 function fresh(){return {version:1,revision:3,chapter:'workshop-first',active:false,beat:0,line:0,openingSeen:false,openingLine:0,completed:[],runs:{},study:null,studyRuns:{},placements:{},view:'world',heard:[],observed:[],arrivalDone:false,endingSeen:false,learningAccepted:false,heritageKnown:false,experienced:[],conversationLog:[],talk:{node:'arrival',line:0,returnTo:'zhou'},replaying:false};}
 function restore(raw,P,E){
  const s=fresh();try{const v=JSON.parse(raw);if(v?.version!==1||v.chapter!==s.chapter||!Array.isArray(v.completed))return s;
   let count=0;while(count<tasks.length&&v.completed[count]===tasks[count].id)count++;if(count!==v.completed.length)return s;
   s.completed=tasks.slice(0,count).map(t=>t.id);s.beat=Number.isInteger(v.beat)&&[count*2,count*2+1].includes(v.beat)?v.beat:count*2;
   const lines=dialogues[s.beat];s.line=v.revision===3&&lines&&Number.isInteger(v.line)?Math.max(0,Math.min(lines.length-1,v.line)):0;s.active=v.active===true;s.view=v.view==='puzzle'&&tasks.some(t=>t.beat===s.beat)?'puzzle':'world';
   s.openingSeen=v.revision>=2?v.openingSeen===true:true;s.openingLine=v.revision>=2&&Number.isInteger(v.openingLine)?Math.max(0,Math.min(opening.length-1,v.openingLine)):0;
   s.heard=tasks.map(t=>t.id).filter(id=>Array.isArray(v.heard)&&v.heard.includes(id));const observed=Array.isArray(v.observed)?v.observed.map(id=>id==='lamp'?'chair':id):[];s.observed=Object.keys(inspections).filter(id=>observed.includes(id));
   for(const t of tasks){const run=v.runs?.[t.id];if(!run||run.level!==t.levelId||run.mode!==t.mode)continue;const valid=E.restoreSession(JSON.stringify(run),P);if(valid)s.runs[t.id]={version:1,level:valid.level,mode:valid.mode,history:valid.history,action:valid.action,trial:valid.trial};}
   if(s.completed.some(id=>!s.runs[id]||!E.restoreSession(JSON.stringify(s.runs[id]),P)?.completed))return fresh();
   const current=v.revision===3;
   s.arrivalDone=current?v.arrivalDone===true:s.beat>0;s.endingSeen=s.beat===9&&v.endingSeen===true;
   s.learningAccepted=s.beat>0||(current&&v.learningAccepted===true);
   s.heritageKnown=current?v.heritageKnown===true:s.learningAccepted;
   const allowed=new Set(Object.values(Talk.nodes).flatMap(n=>[n.complete,...(n.choices||[]).map(c=>c.complete||c.experience)]).filter(Boolean));
   s.experienced=current&&Array.isArray(v.experienced)?[...new Set(v.experienced.filter(x=>allowed.has(x)))]:[];
   if(Array.isArray(v.conversationLog))s.conversationLog=v.conversationLog.slice(-120).filter(e=>e&&['line','choice'].includes(e.kind)&&typeof e.node==='string'&&(e.node==='opening'||Object.hasOwn(Talk.nodes,e.node))&&Number.isInteger(e.line)&&e.line>=0&&e.line<50&&typeof e.speaker==='string'&&typeof e.text==='string'&&e.text.length>0&&e.text.length<=300).map(e=>({kind:e.kind,node:e.node,line:e.line,speaker:e.speaker.slice(0,24),text:e.text}));
   s.replaying=current&&v.replaying===true;
   s.talk=s.beat===0&&!s.arrivalDone?{node:'arrival',line:0,returnTo:'zhou'}:s.beat%2===0&&s.beat>0?{node:'after-'+s.beat,line:0,returnTo:'zhou'}:null;
   if(current){
    const t=v.talk,n=t&&Talk.nodes[t.node];
    const validNode=n&&(!['after-','explain-','doubt-'].some(prefix=>t.node.startsWith(prefix))||Number(t.node.split('-')[1])===s.beat)&&(t.node!=='thanks'||s.beat===8);
    if(validNode){const node=n.action?n.resume:t.node;s.talk={node,line:n.action?0:Math.max(0,Math.min(Talk.nodes[node].lines.length-1,Number.isInteger(t.line)?t.line:0)),returnTo:Talk.roots.includes(t.returnTo)?t.returnTo:'zhou'};}
    else if(v.talk===null&&(s.arrivalDone&&(s.beat===0||s.beat%2===1)))s.talk=null;
   }else if(s.beat===9){s.beat=8;s.talk={node:'after-8',line:0,returnTo:'zhou'};}
   // Optional sample practice has its own validated histories, never task records.
   for(const note of samples){if(!canStudy(s,note.id))continue;for(const mode of ['dismantle','assemble']){
    const key=note.id+':'+mode,run=v.studyRuns?.[key];
    if(run?.level!==note.id||run.mode!==mode)continue;
    const valid=E.restoreSession(JSON.stringify(run),P);if(valid)s.studyRuns[key]={version:1,level:valid.level,mode:valid.mode,history:valid.history,action:valid.action,trial:valid.trial};
   }}
   if(v.view==='puzzle'&&typeof v.study==='string'&&Object.hasOwn(s.studyRuns,v.study)){s.study=v.study;s.view='puzzle';}
   if(s.beat===9)for(const sample of samples){const mode=v.placements?.[sample.id];if(['dismantle','assemble'].includes(mode))s.placements[sample.id]=mode;}
   if(s.view==='puzzle')s.talk=null;

  }catch{return fresh();}return s;
 }
 function sampleStatus(s,id,P,E){
  const definition=P.LEVELS.find(l=>l.id===id);if(!definition)return null;const total=definition.pieces.filter(p=>!p.fixed).length;
  const modes=Object.fromEntries(['dismantle','assemble'].map(mode=>{
   const original=tasks.find(t=>t.levelId===id&&t.mode===mode),raw=s.studyRuns?.[id+':'+mode]||s.runs?.[original?.id],valid=raw?.level===id&&raw.mode===mode?E.restoreSession(JSON.stringify(raw),P):null;
   const count=valid?(mode==='assemble'?total-valid.removed.length:valid.removed.length):0;
   return [mode,{count,completed:!!valid?.completed||!!original&&s.completed.includes(original.id),partial:!!valid?.history.length&&!valid.completed}];
  }));
  const current=tasks.find(t=>t.beat===s.beat&&t.hotspot===id),raw=current&&s.runs?.[current.id],valid=raw&&E.restoreSession(JSON.stringify(raw),P);
  const currentTask=current?{id:current.id,mode:current.mode,count:valid?(current.mode==='assemble'?total-valid.removed.length:valid.removed.length):0}:null;
  return {id,total,modes,learned:canStudy(s,id),current:!!current,currentTask};
 }
 const api={tasks,dialogues,opening,notes,extras,samples,canStudy,displayMode,sampleStatus,inspections,talk:Talk,fresh,restore};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.JourneyStory=api;
})(typeof window==='undefined'?globalThis:window);
