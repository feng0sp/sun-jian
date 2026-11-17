/* One local identity and one narrative prize. No accounts or spendable wallet. */
(function(root){
 'use strict';
 const DEFAULT_NAME='陈屿',PRIZE=3000;
 const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function name(value){const text=String(value||'').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim();const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(text)].map(p=>p.segment):Array.from(text);return parts.slice(0,12).join('')||DEFAULT_NAME;}
 function certificate(player,work){return '<article class="award-paper"><small>省级木作交流赛 · 新人组</small><h3>荣誉证书</h3><p class="award-owner">'+escape(name(player))+'</p><p>作品《'+escape(work)+'》</p><strong>第三名</strong><p>从日常使用出发，为下一次维修留出空间。</p><span>奖金 <b>3,000</b> 元</span></article>';}
 function photo(player,work){return '<figure class="award-photo"><img decoding="async" data-src="assets/campaign-2d/contest-0143/award-stage.webp" alt="三名获奖者同台合影，台下的同行与观众鼓掌"><figcaption>新人组领奖合影 · '+escape(name(player))+' · 《'+escape(work)+'》 · 第三名</figcaption></figure>';}
 function render(c,ui){const step=c.awardStep||0,w=ui.work,n=ui.playerName,panel=ui.panel,act=ui.act,back=['先收好，稍后继续',ui.back];
  if(step===0)panel('名单快念到新人组了',(ui.replay?'<p>“新人组第三名——'+escape(name(n))+'，作品《'+escape(w.name)+'》！”</p>':'')+'<p>展厅里的交谈声渐渐停下来。小许挤到你身边，林岚也抬起了头。</p><p>你把手里的记录本合上，等工作人员念到自己的作品。</p>',[['听公布结果',()=>ui.talk('continuationFinalResult'),true],['略过演出，查看领奖摘要',()=>act('award:skip')],back],'省城 · 新人组颁奖');
  else if(step===1)panel('上台吧，轮到你了','<p>“请前三名的同学上台。”</p><p>林岚从另一侧过来，朝你笑了笑。台下有人举起了手机，小许正使劲向你挥手。</p><p>工作人员把写着《'+escape(w.name)+'》的证书转向你。</p>',[['领取证书与奖金',()=>act('award:receive'),true],['略过演出，查看领奖摘要',()=>act('award:skip')],back],'新人组 · 第三名');
  else if(step===2)panel('这回，真的拿到了',certificate(n,w.name)+'<p>你接过证书和奖金凭证。掌声从台下传来，刚才排在旁边的一位参赛者也冲你竖起了拇指。</p><p>评审：“能想到以后怎么修，也真的演示得出来。这件东西考虑得挺完整。”</p>',[['和大家拍张合影',()=>act('award:photo'),true],['展开证书',ui.certificate],back],'第三名 · 荣誉证书 · 奖金3000元');
  else panel('看这里，三、二、一',photo(n,w.name)+'<p>快门响起，你终于不用忍着笑了。林岚小声说：“刚才你上来得比我还快。”</p>',[['收好合影，回到朋友身边',()=>act('award:return'),true],['展开证书',ui.certificate],back],'领奖合影 · 已收进随行手记');
 }
 const api={DEFAULT_NAME,PRIZE,name,escape,certificate,photo,render};root.CampaignAwards=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
