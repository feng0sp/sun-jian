/* Pointer-owned wood manipulation. Preview never mutates the puzzle state. */
(function(root){
  'use strict';
  function chooseAxis(delta,axes){
    const length=Math.hypot(...delta);if(!length)return null;
    const scores=axes.map((v,index)=>({index,length:Math.hypot(...v),score:Math.abs(delta[0]*v[0]+delta[1]*v[1])/(length*Math.hypot(...v))})).filter(a=>a.length>=12&&Number.isFinite(a.score)).sort((a,b)=>b.score-a.score);
    return scores.length&&scores[0].score>=.88&&(!scores[1]||scores[0].score-scores[1].score>=.12)?scores[0].index:null;
  }
  function install(c){
    const {canvas,camera,controls,THREE}=c,pointers=new Map();let gesture=null,suppress=false,lastHover=0;
    const axes=[[1,0,0],[0,1,0],[0,0,1]],ids=[['xp','xn'],['yp','yn'],['zp','zn']];
    const screen=p=>{const r=canvas.getBoundingClientRect(),v=p.clone().project(camera);return [r.left+(v.x+1)*r.width/2,r.top+(1-v.y)*r.height/2];};
    function orbit(dx,dy,ratio=1){
      const r=canvas.getBoundingClientRect(),offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);
      s.theta-=dx/r.height*Math.PI*2;s.phi=Math.max(controls.minPolarAngle,Math.min(controls.maxPolarAngle,s.phi-dy/r.height*Math.PI*2));s.radius=Math.max(controls.minDistance,Math.min(controls.maxDistance,s.radius*ratio));
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();camera.updateMatrixWorld();c.dirty();
    }
    function multi(){const a=[...pointers.values()];return {x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};}
    function cancel(){c.cancel();c.hover?.(null);gesture=null;canvas.style.cursor='';c.dirty();}
    function down(e){
      e.stopImmediatePropagation();e.preventDefault();if(c.disabled())return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
      if(pointers.size>=2){cancel();suppress=true;gesture={kind:'multi',last:multi()};return;}
      if(suppress)return;
      c.prepare?.();c.hover?.(null);const hit=c.pick(e.clientX,e.clientY);
      if(e.button===0&&hit&&c.draggable(hit.id)){
        const resume=c.begin(hit.id,hit.point),origin=hit.point.clone(),p=screen(origin);
        const clip=new THREE.Vector4(origin.x,origin.y,origin.z,1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
        const home=origin.clone();if(resume)home.addScaledVector(new THREE.Vector3(...axes[resume.axis]),-resume.amount);
        gesture={kind:'wood',id:hit.id,pointer:e.pointerId,start:[e.clientX,e.clientY],origin,home,homeScreen:screen(home),departed:false,contactAttempt:null,axes:axes.map(a=>{const q=screen(origin.clone().add(new THREE.Vector3(...a)));return q.map((v,i)=>v-p[i]);}),depth:clip.w,depthAxes:axes.map(a=>new THREE.Vector4(...a,0).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix).w),axis:resume?.axis??null,base:resume?.amount||0,direction:resume?ids[resume.axis][resume.amount>=0?0:1]:null,distance:Math.abs(resume?.amount||0),ready:false,blocked:false,active:!!resume,threshold:e.pointerType==='touch'?6:4,ranges:{}};canvas.style.cursor='grabbing';
      }else{if(e.button===0&&hit)c.select(hit.id);gesture={kind:'orbit',start:{x:e.clientX,y:e.clientY},last:{x:e.clientX,y:e.clientY},active:false,threshold:e.pointerType==='touch'?6:4};canvas.style.cursor='grabbing';}
    }
    function move(e){
      if(!pointers.has(e.pointerId)){if(e.pointerType==='mouse'&&!c.disabled()&&performance.now()-lastHover>32){lastHover=performance.now();const hit=c.pick(e.clientX,e.clientY);c.hover?.(hit&&(c.hoverable||c.draggable)(hit.id)?hit.id:null);}return;}e.stopImmediatePropagation();e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(!gesture)return;
      if(gesture.kind==='multi'){if(pointers.size<2)return;const now=multi(),last=gesture.last;orbit(now.x-last.x,now.y-last.y,last.d/Math.max(1,now.d));gesture.last=now;return;}
      if(gesture.kind==='orbit'){if(!gesture.active&&Math.hypot(e.clientX-gesture.start.x,e.clientY-gesture.start.y)<gesture.threshold)return;gesture.active=true;orbit(e.clientX-gesture.last.x,e.clientY-gesture.last.y);gesture.last={x:e.clientX,y:e.clientY};return;}
      if(gesture.kind==='released')return; // A successful pull owns this pointer until it lifts.
      const g=gesture,delta=[e.clientX-g.start[0],e.clientY-g.start[1]];
      if(!g.active&&Math.hypot(...delta)<g.threshold)return;g.active=true;
      const homeDistance=Math.hypot(e.clientX-g.homeScreen[0],e.clientY-g.homeScreen[1]);
      if(homeDistance>=Math.max(12,g.threshold*2))g.departed=true;
      if(g.axis!==null&&g.departed&&homeDistance<=g.threshold){
        if(g.contactAttempt)c.blocked(g.id,g.contactAttempt.direction,g.contactAttempt.range);
        const lastDirection=g.direction,range=g.ranges[lastDirection]||c.range(g.id,lastDirection);if(range)c.preview(g.id,lastDirection,0,{ready:false,blocked:false,range});
        g.start=[...g.homeScreen];g.origin.copy(g.home);g.base=0;g.axis=null;g.direction=null;g.distance=0;g.ready=g.blocked=g.departed=false;g.contactAttempt=null;
        const p=screen(g.home),clip=new THREE.Vector4(g.home.x,g.home.y,g.home.z,1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);g.depth=clip.w;g.axes=axes.map(a=>{const q=screen(g.home.clone().add(new THREE.Vector3(...a)));return q.map((v,i)=>v-p[i]);});
        (c.reconsider||c.ambiguous)({start:g.start,axes:g.axes});return;
      }
      if(g.axis===null){if(Math.hypot(...delta)<g.threshold)return;g.axis=chooseAxis(delta,g.axes);if(g.axis===null){c.ambiguous({start:g.start,axes:g.axes});return;}}
      // Project the pointer onto the screen axis, then invert perspective exactly.
      // Sideways finger drift must not push a piece further along its locked axis.
      const v=g.axes[g.axis],q=(delta[0]*v[0]+delta[1]*v[1])/(v[0]*v[0]+v[1]*v[1]),depth=g.depthAxes[g.axis],den=g.depth+depth-q*depth;
      if(den<g.depth*.08)return; // Beyond the axis vanishing point: keep the last stable pose.
      const amount=g.base+q*g.depth/den;g.direction=ids[g.axis][amount>=0?0:1];
      const range=g.ranges[g.direction]||(g.ranges[g.direction]=c.range(g.id,g.direction));if(!range)return;
      const desired=Math.abs(amount),limit=range.step||range.exitDistance;
      g.distance=Math.min(desired,range.blocker?range.freeDistance:Infinity,limit);g.blocked=!!range.blocker&&desired>range.freeDistance+.025;
      if(g.blocked&&!g.contactAttempt)g.contactAttempt={direction:g.direction,range};
      g.ready=range.step?range.freeDistance>=range.step-1e-5&&g.distance>=range.step/2:!range.blocker&&desired>=range.exitDistance;
      c.preview(g.id,g.direction,g.distance,{ready:g.ready,blocked:g.blocked,range});
      if(g.ready&&!range.step){if(g.contactAttempt)c.blocked(g.id,g.contactAttempt.direction,g.contactAttempt.range);gesture={...g,kind:'released',committed:true};canvas.style.cursor='default';c.commit(g.id,g.direction,g.distance);}
    }
    function up(e){
      if(!pointers.has(e.pointerId))return;e.stopImmediatePropagation();e.preventDefault();pointers.delete(e.pointerId);
      const g=gesture;if(g?.kind==='wood'){
        gesture=null;if(g.active&&g.ready)c.commit(g.id,g.direction,g.distance);else{c.release(g.id,g.direction,g.distance);if(g.active&&g.contactAttempt)c.blocked(g.id,g.contactAttempt.direction,g.contactAttempt.range);else if(g.active)c.returned();}
      }else gesture=null;
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(!pointers.size)suppress=false;else suppress=true;canvas.style.cursor='';
    }
    function abort(e){if(e){e.stopImmediatePropagation();pointers.delete(e.pointerId);}cancel();if(!e){const captured=[...pointers.keys()];pointers.clear();for(const id of captured)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}suppress=pointers.size>0;}
    canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointermove',move,true);canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',abort,true);
    canvas.addEventListener('pointerleave',()=>c.hover?.(null));
    canvas.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))abort(e);},true);
    // OrbitControls r128 also listens to legacy TouchEvents: never let a second controller own them.
    for(const type of ['touchstart','touchmove','touchend'])canvas.addEventListener(type,e=>{e.stopImmediatePropagation();e.preventDefault();},{capture:true,passive:false});
    canvas.addEventListener('wheel',e=>{e.stopImmediatePropagation();e.preventDefault();if(!gesture&&!c.disabled())orbit(0,0,Math.exp(Math.max(-100,Math.min(100,e.deltaY))*.002));},{capture:true,passive:false});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.addEventListener('blur',()=>abort());document.addEventListener('visibilitychange',()=>{if(document.hidden)abort();});
    return {cancel:()=>abort(),active:()=>gesture?.kind==='wood',snapshot:()=>gesture?.id?{piece:gesture.id,active:gesture.active,axis:gesture.axis,direction:gesture.direction,distance:gesture.distance,home:[...gesture.homeScreen],ready:gesture.ready,blocked:gesture.blocked,committed:!!gesture.committed}:null};
  }
  const api={chooseAxis,install};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.JointDrag=api;
})(typeof window==='undefined'?globalThis:window);
