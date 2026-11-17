/* Local save interchange. Gameplay proofs are rebuilt by the existing rule validator. */
(function(root){
 'use strict';
 const MAX_BYTES=4*1024*1024;
 const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 function inspect(text,D,P,E,C){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)throw Error('文件太大了。请选择游戏下载的旅程存档（不超过 4 MB）。');
  let file;try{file=JSON.parse(text);}catch{throw Error('这个文件不是有效的 JSON 存档，请重新选择。');}
  if(!record(file)||file.format!=='sun-jian-campaign-save'||file.version!==1||!record(file.save))throw Error('请选择“下载旅程存档”得到的文件，内测记录不能作为存档恢复。');
  const source=file.save;
  if(![1,2].includes(source.version)||!D.phases.includes(source.phase)||!record(source.runs)||!Array.isArray(source.done))throw Error('这份存档的格式无法识别，当前旅程没有改变。');
  const save=D.restore(JSON.stringify(source),P,E,C),c=save.continuation;
  const place=c.active?(c.endingSeen?'赛后 · 第三名':c.packed?'省城 · 木作交流赛':c.productionStarted?'工坊 · 制作参赛作品':c.departed?'开放工坊':c.stage==='goodbye'?'门前道别':'雨棚 · 继续学习'):save.scene==='cave'?'旧木料库':({arrival:'进村借宿',settle:'周伯家 · 安顿下来',learning:'周伯家 · 学木作',night:'周伯家 · 晚饭休息',morning:'周伯家 · 清晨',depart:'屋旁石路',return:'返村取料完成',bench:'雨棚 · 合好长凳',farewell:'雨棚 · 检查长凳',complete:'雨后再会'}[save.phase]||'溪桥村');
  const corrected=source.phase!==save.phase||source.done.length!==save.done.length||source.continuation?.resultSeen===true&&!c.resultSeen;
  return {save,summary:{place,lessons:save.done.length,required:D.requiredCaveIds.filter(id=>save.cave.completed.includes(id)).length,optional:D.optionalCaveIds.filter(id=>save.cave.completed.includes(id)).length,awarded:!!c.resultSeen,corrected}};
 }
 const api={MAX_BYTES,inspect};root.CampaignSaveTransfer=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
