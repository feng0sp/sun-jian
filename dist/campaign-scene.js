/* A single real 3D village/workshop set. All near props share its depth buffer. */
(function(root){
 'use strict';
 function create(host,state,callbacks){
  const T=THREE,P=JointPuzzle,scene=new T.Scene(),camera=new T.PerspectiveCamera(62,1,.06,100),renderer=new T.WebGLRenderer({antialias:true});
  renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(renderer.domElement);
  const mats=[],geos=[],solids=[],targets=[],samples=[],settings=state.settings;let enabled=false,presenting=false,alive=true,last=performance.now(),raf,zhou=null,sitting=false,seatKind='bench';
  const mat=(color,more={})=>{const m=new T.MeshStandardMaterial({color,roughness:.9,...more});m.color.convertSRGBToLinear();mats.push(m);return m;};
  const plaster=mat('#a9b5ad'),floor=mat('#64777a'),timber=mat('#795e47'),lightWood=mat('#bfa47b'),dark=mat('#3d4746'),roofMat=mat('#435964'),paper=mat('#e5d9bb'),leaf=mat('#4f7966'),metal=mat('#647775'),cloth=mat('#6c7e78');
  const textureList=[];
  function surface(kind){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#eeeae0';ctx.fillRect(0,0,512,512);let seed=91;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<10000;i++){ctx.fillStyle=rand()>.5?'rgba(43,59,57,.025)':'rgba(255,255,240,.05)';ctx.fillRect(rand()*512,rand()*512,rand()*3+1,rand()*2+1);}if(kind==='wall'){for(let i=0;i<28;i++){const x=rand()*512,y=rand()*512;ctx.fillStyle='rgba(84,95,81,.025)';ctx.beginPath();ctx.ellipse(x,y,rand()*60+15,rand()*30+10,rand()*3,0,Math.PI*2);ctx.fill();}}else if(kind==='wood'){for(let i=0;i<100;i++){const y=rand()*512;ctx.strokeStyle='rgba(61,47,28,.035)';ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(150,y+rand()*9,300,y-rand()*7,512,y+rand()*5);ctx.stroke();}}else{ctx.strokeStyle='rgba(45,65,65,.1)';ctx.lineWidth=1;for(let y=0;y<512;y+=128)for(let x=0;x<512;x+=170)ctx.strokeRect(x+(y%256?40:0),y,168,126);}const t=new T.CanvasTexture(canvas);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;textureList.push(t);return t;}
  plaster.map=surface('wall');floor.map=surface('stone');floor.map.repeat.set(12,14);timber.map=surface('wood');lightWood.map=timber.map;
  const woodPart={color:'#9d7955',shapes:[]};const wood=WoodFinish.material(T,woodPart,0,2,true);mats.push(wood);
  function box(parent,x,y,z,w,h,d,m,collide=false,outline=false){const g=new T.BoxGeometry(w,h,d);geos.push(g);const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);if(collide)solids.push([x-w/2,x+w/2,z-d/2,z+d/2]);if(outline){const e=new T.EdgesGeometry(g,35);geos.push(e);mesh.add(new T.LineSegments(e,new T.LineBasicMaterial({color:'#263c3e',transparent:true,opacity:.2})));}return mesh;}
  function cylinder(parent,x,y,z,r,h,m){const g=new T.CylinderGeometry(r,r,h,12);geos.push(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function target(id,name,pos,r=2.7){targets.push({id,name,point:new T.Vector3(...pos),r});}
  function model(levelId,parent,scale,position){const l=P.LEVELS.find(l=>l.id===levelId),group=new T.Group(),parts={};group.scale.setScalar(scale);group.position.fromArray(position);parent.add(group);
   for(const p of l.pieces){const f=WoodMesh.surfaces(p.shapes,.022),a=[],n=[],uv=[];for(const face of f)for(let j=1;j<face.vertices.length-1;j++)for(const v of [face.vertices[0],face.vertices[j],face.vertices[j+1]]){a.push(...v);n.push(...face.normal);uv.push(v[0]*.3,v[1]*.3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geos.push(g);const m=WoodFinish.material(T,p,p.grainAxis??1,2,true);mats.push(m);const mesh=new T.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);parts[p.id]={mesh,definition:p};}
   const minY=Math.min(...l.pieces.flatMap(p=>p.shapes.flatMap(s=>s.vertices.map(v=>v[1]))));if(parent===scene&&['straight','lap','pinned'].includes(levelId))group.position.y=.928-minY*scale;return {group,parts,l};
  }
  scene.add(new T.HemisphereLight('#c2d7dd','#786950',.72));const sun=new T.DirectionalLight('#e2e6d7',1.3);sun.position.set(-8,16,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:50});sun.shadow.bias=-.00035;scene.add(sun);
  const lamp=new T.PointLight('#ffd49b',1.6,12,1.4);lamp.position.set(.3,2.7,-6);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-.0003;lamp.shadow.normalBias=.015;lamp.shadow.camera.near=.15;lamp.shadow.camera.far=12;scene.add(lamp);const windowLight=new T.DirectionalLight('#bdd8e8',.6);windowLight.position.set(-8,5,-6);scene.add(windowLight);
  box(scene,0,-.12,0,23,.24,27,floor);
  // A broad village lane, a bounded courtyard and a small lived-in house.
  for(let i=0;i<12;i++){box(scene,(i%3-1)*1.1,.012,10-Math.floor(i/3)*1.3,1.04,.025,1.2,mat(i%2?'#8c9992':'#9eaaa1'));}
  box(scene,0,.015,-5.8,8.2,.09,12,timber);for(let i=0;i<20;i++)box(scene,-3.9+i*.4,.062,-5.8,.009,.004,11.8,dark);
  for(const [z,d]of [[-10.45,3.1],[-5.5,3.2],[-1.05,2.1]])box(scene,-4.15,1.65,z,.28,3.3,d,plaster);
  box(scene,-4.15,.575,-6,.28,1.15,12,plaster);box(scene,-4.15,2.875,-6,.28,.85,12,plaster);solids.push([-4.29,-4.01,-12,0]);
  box(scene,4.15,1.65,-6,.28,3.3,12,plaster,true);box(scene,0,1.65,-12,8.4,3.3,.28,plaster,true);
  box(scene,-2.6,1.65,0,3.2,3.3,.25,plaster,true);box(scene,2.6,1.65,0,3.2,3.3,.25,plaster,true);box(scene,0,2.95,0,2,.7,.25,timber);
  for(const x of [-1.05,1.05])box(scene,x,1.25,.04,.12,2.5,.26,timber,true);box(scene,0,2.5,0,2.2,.15,.3,timber);
  // A true doorway and windows with geometric frames and a soft far landscape beyond.
  for(const z of [-3,-8]){box(scene,-3.97,1.8,z,.03,1.25,1.8,mat('#849d9f',{transparent:true,opacity:.22,depthWrite:false}));for(const a of [-.9,0,.9])box(scene,-3.91,1.8,z+a,.09,1.35,.045,timber);for(const y of [1.15,2.45])box(scene,-3.91,y,z,.1,.06,1.9,timber);}
  for(const x of [-4.3,4.3]){const r=box(scene,x/2,3.65,-6,4.7,.2,12.8,roofMat);r.rotation.z=x<0?.18:-.18;}
  for(let i=0;i<25;i++)for(const sign of [-1,1]){const t=box(scene,sign*2.15,3.78,-12.15+i*.51,4.72,.055,.075,dark);t.rotation.z=sign*-.18;}
  for(const x of [-4.02,4.02])box(scene,x,1.65,.16,.16,3.3,.16,timber);for(const y of [.12,.7])for(const x of [-2.65,2.65])box(scene,x,y,.16,3,.06,.04,timber);
  box(scene,0,3.2,-6,8.6,.12,12.6,dark);
  for(const z of [-.2,-4,-8,-11.8])box(scene,0,3.08,z,8.2,.18,.18,timber);
  // Neighboring homes and mountain silhouettes are actual geometry too.
  for(const [x,z,s] of [[-8,5,1],[8,-7,.8],[-8,-13,.9],[8,13,1]]){box(scene,x,1.7*s,z,4*s,3.4*s,4*s,plaster,true);for(const sign of [-1,1]){const r=box(scene,x+sign*s,3.5*s,z,2.4*s,.15,4.5*s,roofMat);r.rotation.z=sign*.3;}box(scene,x,1.5*s,z+2.01*s,.7,1.4,.03,dark);}
  for(let i=0;i<20;i++){const x=(i%2?1:-1)*(13+(i%4)),z=-20+(i*7%45),g=new T.ConeGeometry(3+(i%3),7+i%5,6);geos.push(g);const hill=new T.Mesh(g,mat(i%2?'#536e6d':'#6b8580'));hill.position.set(x,1,z);scene.add(hill);}
  for(let i=0;i<12;i++){const x=i%2?-9:9,z=-10+(i*3%23);cylinder(scene,x,1.5,z,.09,3,timber);for(let j=0;j<3;j++){const g=new T.IcosahedronGeometry(1,1);geos.push(g);const o=new T.Mesh(g,leaf);o.position.set(x+(j-1)*.45,2.9+j*.3,z);o.scale.set(1.2,1.0,1.15);scene.add(o);}}
  // Rain shelter and the bench, assembled from the same collision geometry as its puzzle.
  for(const x of [5,8.8])for(const z of [2.7,6.3])box(scene,x,1.6,z,.15,3.2,.15,timber,true);
  box(scene,6.9,3.25,4.5,4.7,.18,4.4,roofMat);box(scene,6.9,.05,4.5,4.4,.1,4.1,mat('#89948b'));
  const spareCart=CampaignSupplies.create(T);spareCart.group.position.set(6.8,.1,6.85);scene.add(spareCart.group);
  const bench=model('rain-shelter-bench',scene,.4,[6.85,.1,4.35]);target('bench','雨棚下的长凳',[6.85,.8,4.4],3.1);solids.push([5.5,8.2,3.9,4.9]);
  // The removed damaged board is visible before anyone explains the repair.
  for(const [x,h,z]of [[8.3,1.4,5.5],[8.5,.8,5.5]]){const old=box(scene,x,h*.5,z,.16,h,.08,dark);old.rotation.z=-.14;}box(scene,8.25,.075,5.4,.75,.05,.45,timber);
  const bag=new T.Group();scene.add(bag);box(bag,-1.65,.3,-.65,.36,.56,.24,cloth);box(bag,-1.65,.24,-.50,.28,.25,.06,dark);for(const x of [-1.79,-1.51])box(bag,x,.36,-.79,.035,.37,.035,dark);
  // Workbench and its honest feet/crossbars; no background-painted props.
  box(scene,0,.86,-6.4,3.6,.13,1.55,wood,true,true);for(const x of [-1.4,1.4])for(const z of [-6.95,-5.9])box(scene,x,.42,z,.13,.82,.13,timber);
  box(scene,0,.25,-6.4,2.9,.12,.12,timber);for(const x of [-.95,0,1]){box(scene,x,.935,-6.65,.77,.014,.34,lightWood);for(const z of [-6.83,-6.47])box(scene,x,.956,z,.79,.05,.022,timber);for(const dx of [-.39,.39])box(scene,x+dx,.956,-6.65,.022,.05,.37,timber);}
  for(const [id,x,z] of [['straight',-.95,-6.25],['lap',0,-6.4],['pinned',1,-6.3]]){const m=model(id,scene,.155,[x,1.19,z]);samples.push({id,...m});target(id,{straight:'直榫样木',lap:'半榫木条',pinned:'带销样木'}[id],[x,1.25,z]);}
  // Tool wall, storage, a plug, everyday cup and thermos.
  box(scene,0,1.8,-11.75,3.6,1.25,.08,timber);for(let i=0;i<5;i++){const x=-1.45+i*.26;cylinder(scene,x,1.58,-11.63,.035,.32+(.03*(i%2)),lightWood);box(scene,x,1.9,-11.64,.045+i*.007,.30,.025,metal);box(scene,x,1.72,-11.62,.07,.045,.06,dark);}box(scene,.35,1.55,-11.61,.36,.16,.20,timber,true);box(scene,.35,1.67,-11.60,.10,.16,.08,metal);for(const x of [.85,1.45])box(scene,x,1.8,-11.62,.055,.86,.07,timber);box(scene,1.15,2.17,-11.63,.65,.045,.08,timber);box(scene,1.15,1.41,-11.62,.65,.04,.016,metal);cylinder(scene,.35,2.13,-11.6,.028,.15,lightWood);box(scene,.35,2.22,-11.6,.30,.11,.12,timber);target('tools','常用的工具',[0,1.8,-11.5]);
  box(scene,2.95,.8,-9.8,1.5,1.6,1,wood,true);for(let i=0;i<5;i++)box(scene,2.95,.25+i*.3,-9.2,1.25,.035,.025,dark);
  box(scene,-2.6,.68,-3,1.6,.1,.8,timber,true);for(const x of [-3.2,-2])for(const z of [-3.3,-2.7])box(scene,x,.32,z,.07,.64,.07,timber);
  cylinder(scene,-2.7,.82,-3,.085,.18,paper);cylinder(scene,-2.7,.914,-3,.071,.004,mat('#7d8374'));const handleGeo=new T.TorusGeometry(.065,.013,8,16);geos.push(handleGeo);const handle=new T.Mesh(handleGeo,paper);handle.position.set(-2.60,.83,-3);scene.add(handle);cylinder(scene,-2.15,1.02,-3.1,.13,.6,mat('#8f5244'));target('cup','杯子和暖水瓶',[-2.5,1,-3]);
  box(scene,3.8,.9,-4,.04,.12,.08,paper);for(const z of [-4.025,-3.975])box(scene,3.775,.91,z,.008,.026,.008,dark);box(scene,3.8,1.5,-4,.025,1.2,.015,dark);
  cylinder(scene,0,2.78,-6,.22,.11,mat('#365a55'));cylinder(scene,0,2.71,-6,.08,.03,mat('#fff0b5',{emissive:'#ffdfa0',emissiveIntensity:1}));cylinder(scene,0,2.99,-6,.01,.4,dark);
  function chair(x,z){box(scene,x,.46,z,.5,.09,.5,timber);for(const dx of [-.2,.2])for(const dz of [-.2,.2])box(scene,x+dx,.22,z+dz,.05,.44,.05,timber);box(scene,x,1,z-.23,.5,.55,.05,timber);solids.push([x-.35,x+.35,z-.35,z+.35]);}
  chair(-2.7,-6.4);chair(2.75,-4);target('chair','刚修稳的旧椅',[2.75,.8,-4]);
  box(scene,5.05,.54,4.4,.48,.08,.46,timber);for(const x of [4.87,5.23])for(const z of [4.23,4.57])box(scene,x,.31,z,.055,.46,.055,timber);solids.push([4.75,5.35,4.1,4.7]);
  if(root.ZhouCharacter){zhou=ZhouCharacter.create(T);zhou.group.position.set(-2.7,0,-6.4);scene.add(zhou.group);}else callbacks.notice?.('周伯的角色未能加载，仍可通过对话继续。');target('zhou','周伯',[-2.7,1.15,-6.2],3);
  box(scene,2.7,.3,-10.8,1.1,.6,1.6,cloth,true);box(scene,2.7,.65,-10.8,1,.12,1.4,paper);target('rest','铺好的床位',[2.7,.75,-10.8]);
  // A visibly marked trail, not an invisible scene boundary.
  for(let i=0;i<7;i++)box(scene,-6,.03,2-i*1.5,1.7,.04,1.2,mat(i%2?'#a1aaa0':'#8e9b92'));box(scene,-6,1.1,-8,.12,2.2,.12,timber);box(scene,-6,1.9,-8,1.1,.45,.08,lightWood);
  target('trail','屋旁的旧储物洞小路',[-6,1.5,-8],2.7);target('door','周伯家的门口',[0,1.3,.2],2.5);
  const particles=new Float32Array(150*6);for(let i=0;i<150;i++){const x=-10+((i*71)%200)/10,z=-2+((i*37)%140)/10,y=(i%20)/4;particles.set([x,y,z,x-.03,y-.22,z],i*6);}const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(particles,3));geos.push(rainGeo);const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:'#c5e2e8',transparent:true,opacity:.22}));scene.add(rain);
  function safe(x,z){if(spareCart.group.visible&&x>5.35&&x<8.6&&z>6.15&&z<7.55)return false;return x>=-10&&x<=10&&z>=-11.5&&z<=11.5&&!solids.some(b=>x>b[0]-.23&&x<b[1]+.23&&z>b[2]-.23&&z<b[3]+.23);}
  spareCart.group.visible=state.suppliesCollected||['return','bench','farewell','complete'].includes(state.phase);
  const safeStart=FirstPerson.safePosition(state.village.position,(x,z)=>!safe(x,z),[0,1.65,2.2]);
  if(safeStart.some((v,i)=>v!==state.village.position[i])){state.village.position=safeStart;callbacks.notice?.('站位已移到旁边的空处，可以继续走动。');}
  const ray=new T.Raycaster(),occlusion=new T.Raycaster(),walls=[];
  scene.traverse(o=>{if(o.isMesh&&o.material===plaster)walls.push(o);});
  function getTarget(nx=0,ny=0){ray.setFromCamera(new T.Vector2(nx,ny),camera);let best=null;for(const t of targets){const delta=t.point.clone().sub(camera.position),distance=delta.length(),dot=delta.normalize().dot(ray.ray.direction);if(distance>t.r||dot<.93)continue;occlusion.set(camera.position,delta);occlusion.far=Math.max(0,distance-.48);if(occlusion.intersectObjects(walls,false).length)continue;if(!best||dot>best.dot)best={...t,distance,dot};}return best;}
  const walk=FirstPerson.create({canvas:renderer.domElement,camera,pose:state.village,blocked:(x,z)=>!safe(x,z),target:getTarget,interact:callbacks.interact,move:callbacks.move,settings,notice:callbacks.notice});
  function sync(){const day=['morning','depart','cave','return','bench','farewell','complete'].includes(state.phase);scene.background=new T.Color(day?'#b4cbd0':'#607f8c');scene.fog=new T.Fog(day?'#b4cbd0':'#607f8c',18,45);sun.intensity=day?1.45:.65;lamp.intensity=day?.65:1.8;rain.visible=!day&&!settings.reducedMotion;
   const outside=['bench','farewell','complete'].includes(state.phase);if(zhou){zhou.group.position.set(outside?5.05:-2.7,outside?.1:0,outside?4.4:-6.4);zhou.group.rotation.y=outside?Math.PI/2:0;}targets.find(t=>t.id==='zhou').point.set(outside?5.05:-2.7,outside?1.25:1.15,outside?4.4:-6.2);
   for(const sample of samples){const back=sample.id==='straight'&&state.runs['learn-straight-back'],run=back||state.runs['learn-'+sample.id+'-out'],r=run&&PuzzleExperience.restoreSession(JSON.stringify(run),P);let j=0;for(const {mesh,definition}of Object.values(sample.parts)){mesh.position.set(0,0,0);mesh.rotation.y=0;if(r?.removed.includes(definition.id)&&!definition.fixed){const min=Math.min(...definition.shapes.flatMap(s=>s.vertices.map(v=>v[1])));if(sample.id==='lap'){mesh.rotation.y=definition.id==='upper'?Math.PI/2:0;mesh.position.set(0,(.948-sample.group.position.y)/.155-min,-2.15+(j++-.5)*1.25);}else mesh.position.set((j++-.5)*1.8,(.948-sample.group.position.y)/.155-min,-2.15);}}}
   bag.visible=['settle','learning','night','morning'].includes(state.phase);spareCart.group.visible=state.suppliesCollected||['return','bench','farewell','complete'].includes(state.phase);
   const run=state.runs.bench,restored=run&&PuzzleExperience.restoreSession(JSON.stringify(run),P);spareCart.update(restored?.removed);for(const [id,part]of Object.entries(bench.parts))part.mesh.visible=part.definition.fixed||!!restored&&!restored.removed.includes(id);
  }
  function seatCamera(){camera.position.set(...(seatKind==='chair'?[2.75,1.12,-4]:[6.85,1.12,4.45]));camera.rotation.set(.02,seatKind==='chair'?.85:Math.PI*.5,0);camera.updateMatrixWorld();}
  function quality(){renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality==='high'?1.75:settings.quality==='low'?1:1.35));renderer.shadowMap.enabled=settings.quality!=='low';resize();}
  function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();walk.clear();}
  function frame(time){if(!alive)return;raf=requestAnimationFrame(frame);const dt=Math.min(.1,(time-last)/1000);last=time;if((!enabled&&!presenting)||document.hidden)return;if(enabled)walk.tick(dt);if(sitting)seatCamera();zhou?.update(settings.reducedMotion?0:time/1000,!!state.talk);if(rain.visible&&!settings.reducedMotion)rain.position.y=-((time/1000)*3%1);callbacks.target?.(sitting?null:walk.getTarget());renderer.render(scene,camera);}
  window.addEventListener('resize',resize);quality();sync();raf=requestAnimationFrame(frame);
  return {present(value){presenting=value;},enable(value){enabled=value;presenting=value;walk.enable(value&&!sitting);if(value){resize();sync();}},sync,resize,lock:walk.lock,quality,sit(value,kind='bench'){sitting=value;seatKind=kind;walk.enable(enabled&&!value);if(value)seatCamera();else walk.sync();renderer.render(scene,camera);},snapshot(){camera.updateMatrixWorld();const r=renderer.domElement.getBoundingClientRect();return {available:true,position:[...state.village.position],enabled,sitting,supplies:spareCart.group.visible,bag:bag.visible,character:!!zhou,targets:targets.map(t=>{const p=t.point.clone().project(camera);return {id:t.id,name:t.name,distance:camera.position.distanceTo(t.point),screen:{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2}};}),drawCalls:renderer.info.render.calls};},dispose(){alive=false;cancelAnimationFrame(raf);walk.dispose();zhou?.dispose?.();spareCart.dispose();window.removeEventListener('resize',resize);geos.forEach(g=>g.dispose());textureList.forEach(t=>t.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();}};
 }
 root.CampaignScene={create};
})(window);
