/* Shared first-person navigation. It owns input only while its scene is enabled. */
(function(root){
 'use strict';
 function create({canvas,camera,pose,blocked=()=>false,target=()=>null,interact,move,settings={},notice}){
  const keys=new Set();let enabled=false,look=null,current=null;
  camera.rotation.order='YXZ';canvas.tabIndex=0;
  const savePose=()=>{camera.position.fromArray(pose.position);camera.rotation.set(pose.pitch||0,pose.yaw||0,0);camera.updateMatrixWorld();};
  function clear(){keys.clear();current=null;const old=look;look=null;if(old&&canvas.hasPointerCapture(old.pointer))canvas.releasePointerCapture(old.pointer);}
  function lock(){if(!enabled)return;try{canvas.requestPointerLock?.()?.catch(()=>notice?.('按住空白拖动也能观察。'));}catch{}}
  const down=e=>{if(!enabled||e.target.closest('input,select,textarea,[contenteditable="true"]'))return;if(e.code==='KeyE'&&!e.repeat){e.preventDefault();const fresh=target();if(fresh)interact(fresh.id);return;}if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){keys.add(e.code);e.preventDefault();}};
  const up=e=>keys.delete(e.code);
  const mouse=e=>{if(!enabled||(!look&&document.pointerLockElement!==canvas))return;const locked=document.pointerLockElement===canvas,mx=locked?e.movementX:e.clientX-look.x,my=locked?e.movementY:e.clientY-look.y,s=.0022*(settings.sensitivity||1);pose.yaw=(pose.yaw||0)-mx*s;pose.pitch=Math.max(-1.15,Math.min(1.15,(pose.pitch||0)-my*s));if(look){look.moved+=Math.abs(mx)+Math.abs(my);look.x=e.clientX;look.y=e.clientY;}savePose();};
  const start=e=>{if(enabled&&e.button===0&&!document.pointerLockElement){look={x:e.clientX,y:e.clientY,moved:0,pointer:e.pointerId};canvas.setPointerCapture(e.pointerId);}};
  const end=e=>{if(!enabled||e.button!==0)return;const click=!look||look.moved<6,old=look;look=null;if(old&&canvas.hasPointerCapture(old.pointer))canvas.releasePointerCapture(old.pointer);if(!click)return;const r=canvas.getBoundingClientRect(),locked=document.pointerLockElement===canvas,t=target(locked?0:(e.clientX-r.left)/r.width*2-1,locked?0:1-(e.clientY-r.top)/r.height*2);if(t)interact(t.id);else lock();};
  const lost=e=>{if(look?.pointer===e.pointerId)clear();};
  document.addEventListener('keydown',down);document.addEventListener('keyup',up);document.addEventListener('mousemove',mouse);canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',clear);canvas.addEventListener('lostpointercapture',lost);document.addEventListener('pointerlockchange',clear);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
  function tick(dt){if(!enabled)return;dt=Math.min(.1,Math.max(0,dt));const f=+keys.has('KeyW')-+keys.has('KeyS'),r=+keys.has('KeyD')-+keys.has('KeyA'),n=Math.hypot(f,r);if(n){const s=2.4*dt/n,dx=(-Math.sin(pose.yaw)*f+Math.cos(pose.yaw)*r)*s,dz=(-Math.cos(pose.yaw)*f-Math.sin(pose.yaw)*r)*s,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.07));for(let i=0;i<steps;i++){if(!blocked(pose.position[0]+dx/steps,pose.position[2]))pose.position[0]+=dx/steps;if(!blocked(pose.position[0],pose.position[2]+dz/steps))pose.position[2]+=dz/steps;}move?.();}savePose();current=target();}
  savePose();
  return {tick,lock,clear,sync:savePose,getTarget:()=>current,enable(value){enabled=value;clear();if(!value&&document.pointerLockElement===canvas)document.exitPointerLock();if(value){savePose();canvas.focus({preventScroll:true});}},dispose(){clear();document.removeEventListener('keydown',down);document.removeEventListener('keyup',up);document.removeEventListener('mousemove',mouse);canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',clear);canvas.removeEventListener('lostpointercapture',lost);document.removeEventListener('pointerlockchange',clear);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);}};
 }
 function safePosition(position,blocked,fallback){
  if(!blocked(position[0],position[2]))return [...position];
  // Check nearby ground before falling back to the entrance. Used only when restoring a scene.
  for(let radius=.25;radius<=5;radius+=.25)for(let i=0;i<24;i++){
   const angle=i*Math.PI/12,x=position[0]+Math.sin(angle)*radius,z=position[2]+Math.cos(angle)*radius;
   if(!blocked(x,z))return [x,1.65,z];
  }
  return [...fallback];
 }
 root.FirstPerson={create,safePosition};
})(window);
