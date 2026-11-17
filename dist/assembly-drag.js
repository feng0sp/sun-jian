/* A staged loose part follows an axis gesture back into its joint. No state is committed by previews. */
(function(root){
 'use strict';
 function install(c){
  const {canvas,camera,T}=c;let g=null,returning=null,raf,previewDistance=0;
  function project(v){const r=canvas.getBoundingClientRect(),p=v.clone().project(camera);return [r.x+(p.x+1)*r.width/2,r.y+(1-p.y)*r.height/2];}
  function releaseCapture(){const old=g;g=null;if(old&&canvas.hasPointerCapture(old.pointer))canvas.releasePointerCapture(old.pointer);canvas.style.cursor='';c.finish?.();}
  function cancel(){cancelAnimationFrame(raf);returning=null;previewDistance=0;releaseCapture();c.restore();}
  const down=e=>{
   if(c.disabled()||e.button!==0)return;const hit=c.pick(e.clientX,e.clientY),hand=c.hand();if(!hand||hit?.id!==hand.id)return;
   e.stopImmediatePropagation();e.preventDefault();cancelAnimationFrame(raf);returning=null;
   const d=JointPuzzle.DIRECTIONS.find(d=>d.id===hand.direction),origin=hit.point.clone(),xy=project(origin),axes=[[1,0,0],[0,1,0],[0,0,1]].map(a=>{const q=project(origin.clone().add(new T.Vector3(...a)));return[q[0]-xy[0],q[1]-xy[1]];}),axis=d.vector.findIndex(v=>v!==0);
   const clip=new T.Vector4(origin.x,origin.y,origin.z,1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix),depth=new T.Vector4(...d.vector,0).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix).w;
   // In perspective, the projection of -1 unit is not the negated projection of +1.
   // Use the actual chosen direction for both its screen vector and depth change.
   const unit=project(origin.clone().add(new T.Vector3(...d.vector))),projected=[unit[0]-xy[0],unit[1]-xy[1]];
   g={id:hand.id,direction:hand.direction,pointer:e.pointerId,start:[e.clientX,e.clientY],axis,axes,projected,depth:clip.w,depthAxis:depth,vector:d.vector,distance:previewDistance,base:previewDistance,threshold:e.pointerType==='touch'?12:8,active:false,blocked:false};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';c.start();
  };
  const move=e=>{
   if(!g||e.pointerId!==g.pointer)return;e.stopImmediatePropagation();e.preventDefault();const delta=[e.clientX-g.start[0],e.clientY-g.start[1]];if(Math.hypot(...delta)<g.threshold&&!g.active)return;
   if(!g.active){const axis=JointDrag.chooseAxis(delta,g.axes);if(axis===null||axis!==g.axis){c.ambiguous();return;}g.active=true;}
   const v=g.projected,q=(delta[0]*v[0]+delta[1]*v[1])/(v[0]*v[0]+v[1]*v[1]),den=g.depth+g.depthAxis-q*g.depthAxis;if(den<g.depth*.08)return;
   const requested=Math.max(0,g.base+q*g.depth/den),status=c.range(g.id,g.direction,requested);previewDistance=g.distance=status.distance;g.blocked=status.blocked;c.apply(g.id,g.direction,status);
   if(status.canSeat){const done={...g};releaseCapture();previewDistance=0;c.commit(done.id,done.direction);}
  };
  const up=e=>{if(!g||e.pointerId!==g.pointer)return;e.stopImmediatePropagation();e.preventDefault();const old={...g};releaseCapture();if(old.blocked)c.blocked();if(!old.distance||c.reduced?.()){previewDistance=0;c.restore();return;}returning=old;const start=performance.now();function frame(now){if(!returning)return;const t=Math.min(1,(now-start)/180);previewDistance=old.distance*Math.pow(1-t,3);c.apply(old.id,old.direction,c.range(old.id,old.direction,previewDistance));if(t<1)raf=requestAnimationFrame(frame);else{returning=null;previewDistance=0;c.restore();}}raf=requestAnimationFrame(frame);};
  canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointermove',move,true);canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',cancel,true);canvas.addEventListener('lostpointercapture',()=>{if(g)cancel();},true);window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);
  return {cancel,active:()=>!!g||!!returning,snapshot:()=>g?{...g,start:[...g.start],axes:undefined}:null};
 }
 root.AssemblyDrag={install};
})(window);
