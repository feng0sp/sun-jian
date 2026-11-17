/* A simple tool demonstration; the square checks an edge, the sample tests a joint. */
(function(root){
 'use strict';
 function open(ui){
  let step=0;
  function render(){
   const captions=['先握住尺柄，观察内侧两条直边。','尺柄贴着料边，再把尺舌靠到端面。','两边都贴齐了，直角处没有透出的缝。'];
   const diagram='<svg class="square-check-diagram step-'+step+'" viewBox="0 0 480 260" role="img" aria-label="'+captions[step]+'"><defs><pattern id="square-grain" width="18" height="10" patternUnits="userSpaceOnUse"><path d="M0 3h18M6 8h12" stroke="#715036" opacity=".25"/></pattern></defs><rect x="105" y="96" width="272" height="110" rx="2" fill="#b98d58"/><rect x="105" y="96" width="272" height="110" fill="url(#square-grain)"/><path class="square-reference" d="M105 206V96h272" fill="none" stroke="#d6d8bc" stroke-width="2" stroke-dasharray="6 5"/><g class="square-check-tool"><path d="M70 62h310v30H105v123H70z" fill="#725139" stroke="#352d23" stroke-width="2"/><path d="M70 62h310v30H105v123H70z" fill="url(#square-grain)"/></g></svg>';
   ui.panel('用角尺看一看','<p>'+captions[step]+'</p>'+diagram,
    [[step===0?'拿起角尺':step===1?'把两边靠齐':'看看试配木料',()=>{if(step<2){step++;render();}else ui.sample();},true],['放回工具角',ui.close]],'木角尺 · 检查方正');
  }
  render();
 }
 root.SquareCheck={open};
})(window);
