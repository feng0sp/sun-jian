/* Painted-scene coordinates: rain is clipped to outdoor apertures, never the furniture. */
(function(root){
 'use strict';
 const masks={
  'mountain-rain':[[[0,0],[1,0],[1,1],[0,1]]],
  'zhou-door':[[[.84,.10],[1,.10],[1,1],[.83,1],[.86,.63]]],
  village:[[[.405,0],[1,0],[1,.19],[.70,.34],[.66,.66],[.8,.84],[1,1],[0,1],[0,.82],[.38,.62]]],
  shelter:[[[.10,.05],[.31,.05],[.46,.20],[.46,.49],[.30,.60],[.30,.76],[.09,.76]]],
  room:[[[.067,0],[.137,0],[.137,.15],[.095,.22],[.067,.22]],[[.16,0],[.216,0],[.216,.14],[.16,.14]],[[.235,0],[.309,0],[.309,.25],[.235,.25]]],
  'chair-seat':[[[.111,0],[.292,0],[.292,.525],[.111,.53]],[[.326,0],[.502,0],[.502,.516],[.326,.522]],[[.527,.063],[.648,.091],[.648,.504],[.527,.512]]],
  workbench:[[[0,0],[.29,0],[.29,.065],[0,.14]]]
 };
 // Registered to the existing cup and electric pendant in all five night paintings.
 // Slow light variation, not flicker: no flame is painted over an electric lamp.
 function home(c,w,h,t){
  const breath=.5+.5*Math.sin(t*.62),x=.458*w,y=.077*h;
  c.save();c.globalCompositeOperation='screen';
  const glow=c.createRadialGradient(x,y,0,x,y,w*.095);
  glow.addColorStop(0,'rgba(255,207,128,'+(.09+breath*.035)+')');glow.addColorStop(.28,'rgba(255,197,107,'+(.035+breath*.015)+')');glow.addColorStop(1,'rgba(255,185,92,0)');
  c.fillStyle=glow;c.fillRect(x-w*.095,y-w*.095,w*.19,w*.19);
  // A soft pool of lamplight; no rectangular boundary or moving hotspot overlay.
  c.translate(w*.51,h*.52);c.scale(1,.32);const pool=c.createRadialGradient(0,0,0,0,0,w*.16);pool.addColorStop(0,'rgba(255,207,138,'+(.024+breath*.012)+')');pool.addColorStop(1,'rgba(255,207,138,0)');c.fillStyle=pool;c.fillRect(-w*.16,-w*.16,w*.32,w*.32);c.restore();
  // Each wisp leaves the cup rim, rises slowly and fades before reaching the window.
  c.save();c.beginPath();c.rect(.051*w,.265*h,.043*w,.1*h);c.clip();
  for(let i=0;i<5;i++){
   const life=(t/5.8+i*.2)%1,alpha=Math.sin(Math.PI*life)*.27;
   const sx=(.067+Math.sin(t*.7+i*1.8)*.003*life)*w,sy=(.349-life*.083)*h;
   c.strokeStyle='rgba(239,238,224,'+alpha+')';c.lineWidth=w*(.0011+life*.0012);c.lineCap='round';c.shadowColor='rgba(235,237,222,.12)';c.shadowBlur=w*.003;
   c.beginPath();c.moveTo(sx,sy);c.bezierCurveTo(sx-w*.006,sy-h*.01,sx+w*.008,sy-h*.017,sx+w*.002,sy-h*.027);c.stroke();
  }
  c.restore();
 }
 function chairWarmth(c,w,h,t){
  c.save();c.beginPath();c.rect(.103*w,.49*h,.073*w,.1*h);c.clip();
  for(let i=0;i<4;i++){
   const life=(t/6.2+i*.25)%1,sx=(.132+Math.sin(t*.5+i)*.003*life)*w,sy=(.587-life*.067)*h;
   c.strokeStyle='rgba(241,239,224,'+(Math.sin(Math.PI*life)*.23)+')';c.lineWidth=w*(.001+life*.0014);c.lineCap='round';
   c.beginPath();c.moveTo(sx,sy);c.bezierCurveTo(sx-w*.004,sy-h*.008,sx+w*.005,sy-h*.014,sx+w*.002,sy-h*.024);c.stroke();
  }c.restore();
 }
 function create(host){
  const canvas=document.createElement('canvas');canvas.className='journey-rain';canvas.setAttribute('aria-hidden','true');host.append(canvas);const c=canvas.getContext('2d');
  let id=0,frame='',visible=false,reduced=false,last=0,t=0,draws=0,dead=false;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  function stop(){cancelAnimationFrame(id);id=0;last=0;c?.clearRect(0,0,canvas.width,canvas.height);canvas.hidden=true;}
  function run(now){id=0;if(dead||!visible||reduced||media.matches||document.hidden||!masks[frame]||!c){stop();return;}id=requestAnimationFrame(run);if(now-last<33)return;t+=last?Math.min(.06,(now-last)/1000):.033;last=now;draws++;
   const w=Math.min(1440,Math.max(320,host.clientWidth)),h=Math.round(w*9/16);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}c.clearRect(0,0,w,h);c.save();c.beginPath();for(const polygon of masks[frame]){polygon.forEach(([x,y],i)=>i?c.lineTo(x*w,y*h):c.moveTo(x*w,y*h));c.closePath();}c.clip();
   const count=frame==='village'?135:frame==='shelter'?90:65;
   for(let i=0;i<count;i++){const depth=.45+(i%5)*.13,x=((i*.61803398875+t*.016)%1)*w,y=((i*.38196601125+t*(.22+depth*.16))%1)*h;c.strokeStyle='rgba(197,220,232,'+(.13+depth*.13)+')';c.lineWidth=.45+depth*.5;c.beginPath();c.moveTo(x,y);c.lineTo(x-w*.003*depth,y+h*.014*depth);c.stroke();}
   // Small, low-contrast rings only on the village's exposed foreground paving.
   if(frame==='village')for(let i=0;i<10;i++){const p=(t*.65+i*.73)%1,x=(.22+(i*.173)% .6)*w,y=(.86+(i*.047)%.13)*h;c.strokeStyle='rgba(206,225,231,'+(.13*(1-p))+')';c.lineWidth=.7;c.beginPath();c.ellipse(x,y,(2+p*10)*w/1440,(.7+p*2.3)*w/1440,0,0,Math.PI*2);c.stroke();}c.restore();
   if(frame==='zhou-door'){c.save();c.strokeStyle='rgba(211,229,239,.27)';c.lineWidth=.8;for(let i=0;i<7;i++){const y=(.34+(t*.27+i*.17)% .52)*h,x=(.855+i*.011)*w;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h*.012);c.stroke();}c.restore();}
   if(frame==='room')home(c,w,h,t);
   if(frame==='chair-seat')chairWarmth(c,w,h,t);
  }
  function update(){if(visible&&!reduced&&!media.matches&&!document.hidden&&masks[frame]&&c){canvas.hidden=false;if(!id)id=requestAnimationFrame(run);}else stop();}
  document.addEventListener('visibilitychange',update);media.addEventListener('change',update);
  return {set(value){frame=value.frame;visible=value.visible;reduced=value.reduced;update();},snapshot:()=>({frame,running:!!id,draws,indoor:['room','chair-seat'].includes(frame)&&!!id}),dispose(){dead=true;stop();document.removeEventListener('visibilitychange',update);media.removeEventListener('change',update);canvas.remove();}};
 }
 root.JourneyWeather={create};
})(window);
