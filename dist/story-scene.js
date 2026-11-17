/* Local illustrated backgrounds, calibrated transparent wood overlay, and notebook models. */
(function(root){
 'use strict';
 const T=root.THREE;
 function mesh(geometry,material,parent,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function partGroup(part){
  const group=new T.Group(),bounds=new T.Box3();part.shapes.forEach(s=>s.vertices.forEach(v=>bounds.expandByPoint(new T.Vector3(...v))));const size=bounds.getSize(new T.Vector3()),axis=size.y>size.x&&size.y>size.z?1:size.z>size.x?2:0;
  const faces=WoodMesh.surfaces(part.shapes,.035),positions=[],normals=[],uv=[];
  for(const face of faces){const n=face.normal,faceAxis=n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs))),across=[0,1,2].find(a=>a!==faceAxis&&a!==axis)??((axis+1)%3);for(let i=1;i<face.vertices.length-1;i++)for(const v of [face.vertices[0],face.vertices[i],face.vertices[i+1]]){positions.push(...v);normals.push(...n);uv.push(v[across]*.38,v[axis]*.22);}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  mesh(geometry,WoodFinish.material(T,part,axis,2,true),group);
  const edges=new T.BufferGeometry();edges.setAttribute('position',new T.Float32BufferAttribute(WoodMesh.edges(faces).flat(),3));group.add(new T.LineSegments(edges,new T.LineBasicMaterial({color:0x67513c,transparent:true,opacity:.3,depthWrite:false})));return group;
 }
 function sample(id){const group=new T.Group(),parts={};(JointPuzzle.LEVELS.find(l=>l.id===id)||JointPuzzle.EXPERIMENT).pieces.forEach(p=>{parts[p.id]=partGroup(p);group.add(parts[p.id]);});return {group,parts};}
 function lightScene(scene){scene.add(new T.HemisphereLight(0xe5edf4,0x81867c,1.05));const sun=new T.DirectionalLight(0xf1eee7,1.1);sun.position.set(-6,10,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:8,bottom:-7,near:.5,far:30});sun.shadow.bias=-.0008;sun.shadow.normalBias=.025;sun.shadow.radius=5;scene.add(sun);const fill=new T.DirectionalLight(0xd8e7e0,.35);fill.position.set(6,5,3);scene.add(fill);}
 function setupRenderer(host){const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;host.append(renderer.domElement);return renderer;}
 function release(rootGroup){const gs=new Set(),ms=new Set();rootGroup.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 function create(host,onSelect){
  // All image, geometry and hotspot coordinates belong to this single fixed frame.
  // contain (not cover) preserves the entire illustration at every desktop ratio.
  const frame=document.createElement('div');frame.className='workshop-frame';host.replaceChildren(frame);
  const photos={};let location='room',active=false,dirty=true,disposed=false,lastState=null,raf=0,zoomTimer=null,zoomDone=null;
  const loading=document.createElement('div');loading.className='story-image-loading';loading.textContent='正在走近小屋…';loading.setAttribute('role','status');
  const error=document.createElement('div');error.className='story-image-error';error.hidden=true;error.setAttribute('role','alert');error.innerHTML='<strong>场景图片暂时没有载入</strong><p>可以重试，或返回自由练习。已完成的整理会保留。</p><button type="button">重新加载图片</button><button type="button">返回自由练习</button>';
  const sources={village:'village-anime.webp',room:'room-lodging.webp',chair:'chair-detail.webp',seated:'chair-seated.webp'};
  for(const id of Object.keys(sources)){const im=new Image();im.className='workshop-photo';im.alt=id==='chair'?'旧椅子的椅腿与横枨接点特写。':id==='seated'?'坐在旧椅子上，望向工作台与窗边的周伯。':id==='room'?'周伯坐在窗边，旧工作台留着一片空处；墙上有工具和插座，右边放着修好的旧椅子。':'雨中的溪桥村，水泥路通向雨棚，同伴的徒步背包放在檐下。';im.dataset.scene=id;im.decoding='async';im.onload=()=>{im.dataset.loaded='true';dirty=true;if(location===id){loading.hidden=true;error.hidden=true;}};im.onerror=()=>{im.dataset.loaded='error';if(location===id){loading.hidden=true;error.hidden=false;}};im.src='assets/story-modern/'+sources[id];frame.append(im);photos[id]=im;}
  const steam=document.createElement('div');steam.className='story-steam';steam.setAttribute('aria-hidden','true');steam.innerHTML='<i></i><i></i><i></i>';frame.append(steam,loading,error);error.children[2].onclick=()=>{const im=photos[location];delete im.dataset.loaded;error.hidden=true;loading.hidden=false;im.src='assets/story-modern/'+sources[location]+'?retry='+Date.now();};error.children[3].onclick=()=>document.getElementById('story-exit').click();
  let renderer=null,scene=null,camera=null,rootGroup=null,integration=null,layoutShot=()=>{};
  try{renderer=setupRenderer(frame);renderer.setClearColor(0x000000,0);renderer.toneMappingExposure=.98;scene=new T.Scene();camera=new T.PerspectiveCamera(36,1672/941,.1,100);camera.position.set(7,8,11);camera.lookAt(0,0,0);camera.updateMatrixWorld();
   integration=RoomIntegration(T,renderer,camera,scene,photos);renderer.toneMappingExposure=.94;rootGroup=new T.Group();scene.add(rootGroup);
  }catch{renderer?.domElement.remove();renderer?.dispose();renderer=null;document.getElementById('story-renderer-error').hidden=false;}
  const anchors={straight:[.405,.59],lap:[.655,.603],pinned:[.535,.507],dovetail:[.57,.66],'shoulder-lap':[.76,.60],'burr-three':[.67,.56],tea:[.071,.362],tools:[.65,.19],chair:[.902,.478],zhou:[.22,.35]};
  const buttons=new Map(),labels={straight:'台前样木',lap:'交叠木条',pinned:'带销样木',dovetail:'燕尾滑榫','shoulder-lap':'锁肩搭接','burr-three':'三件初锁',tea:'搪瓷杯',tools:'工具挂板',chair:'修好的旧椅子',zhou:'周伯'};
  const extraIds=['dovetail','shoulder-lap','burr-three'],woodIds=['straight','lap','pinned',...extraIds],extraModels={},extraLayouts={};let highlightSample=()=>{};
  for(const [id,point]of Object.entries(anchors)){const button=document.createElement('button');button.className='workshop-hotspot';button.classList.toggle('wood-sample',woodIds.includes(id));button.classList.toggle('extra-sample',extraIds.includes(id));button.dataset.hotspot=id;button.setAttribute('aria-label',labels[id]);button.style.left=point[0]*100+'%';button.style.top=(point[1]+(woodIds.includes(id)?-.012:0))*100+'%';button.innerHTML='<i></i><span>'+labels[id]+'</span>';button.onclick=()=>onSelect(id);button.addEventListener('pointerenter',()=>highlightSample(id));button.addEventListener('pointerleave',()=>highlightSample(null));button.addEventListener('focus',()=>highlightSample(id));button.addEventListener('blur',()=>highlightSample(null));frame.append(button);buttons.set(id,button);}
  let A,B,C,aLoose,cLoose,pinLoose,bLoose1,bLoose2;
  function storedTargets(){if(!renderer)return {};rootGroup.updateMatrixWorld(true);return Object.fromEntries([['straight',aLoose],['pinned',cLoose],['pin',pinLoose],['lap',bLoose1],['lapSecond',bLoose2]].filter(([,o])=>o?.visible).map(([id,o])=>{const c=new T.Box3().setFromObject(o).getCenter(new T.Vector3()).project(camera);return [id,{x:(c.x+1)/2,y:(1-c.y)/2}];}));}
  if(renderer){
   const plane=new T.Plane(new T.Vector3(0,1,0),0),ray=new T.Raycaster();
   function groundAt(x,y,height=0){return integration.groundAt(x,y,height);}
   function place(object,x,y,scale,rotation=[0,0,0],surfaceY=0){const wrapper=new T.Group();wrapper.add(object);object.rotation.set(...rotation);object.scale.setScalar(scale);const bounds=new T.Box3().setFromObject(object);object.position.y-=bounds.min.y;const center=bounds.getCenter(new T.Vector3());object.position.x-=center.x;object.position.z-=center.z;wrapper.position.copy(groundAt(x,y,surfaceY));wrapper.userData.surfaceY=surfaceY;rootGroup.add(wrapper);return wrapper;}
   A=sample('straight');B=sample('lap');C=sample('pinned');for(const [id,sample]of [['straight',A],['lap',B],['pinned',C]])sample.group.userData.hotspot=id;place(A.group,...anchors.straight,.145,[0,0,0]);place(B.group,...anchors.lap,.155,[0,0,0]);place(C.group,...anchors.pinned,.115,[0,0,0]);
   aLoose=place(A.parts.tenon.clone(true),.304,.416,.09,[0,0,Math.PI/2],.2);cLoose=place(C.parts.tenon.clone(true),.333,.411,.085,[0,0,Math.PI/2],.2);pinLoose=place(C.parts.pin.clone(true),.355,.409,.07,[0,Math.PI/2,0],.2);
   bLoose1=place(B.parts.lower.clone(true),.895,.817,.08,[0,0,0],-1.5);bLoose2=place(B.parts.upper.clone(true),.93,.832,.08,[0,Math.PI/2,0],-1.5);
   for(const [object,id] of [[aLoose,'straight'],[cLoose,'pinned'],[pinLoose,'pinned'],[bLoose1,'lap'],[bLoose2,'lap']])object.userData.hotspot=id;
   for(const id of extraIds){
    const definition=JointPuzzle.LEVELS.find(l=>l.id===id)||JointPuzzle.EXPERIMENT,model=sample(id),floor=Math.min(...definition.pieces.flatMap(p=>p.shapes.flatMap(s=>s.vertices.map(v=>v[1])))),loose=definition.pieces.filter(p=>!p.fixed),hasBase=definition.pieces.some(p=>p.fixed);
    model.group.userData.hotspot=id;extraModels[id]=place(model.group,...anchors[id],id==='burr-three'?.1:.105,[0,0,0]);extraModels[id].visible=false;
    extraLayouts[id]=loose.map((piece,index)=>{
     const points=piece.shapes.flatMap(s=>s.vertices),bounds=new T.Box3().setFromPoints(points.map(v=>new T.Vector3(...v))),size=bounds.getSize(new T.Vector3()),rotation=new T.Euler();
     if(size.y>=size.x&&size.y>=size.z)rotation.z=Math.PI/2;else if(size.z>size.x)rotation.y=Math.PI/2;
     const flat=new T.Box3().setFromPoints(points.map(v=>new T.Vector3(...v).applyEuler(rotation))),center=flat.getCenter(new T.Vector3()),z=hasBase?3+index*2:(index-(loose.length-1)/2)*2;
     return {part:model.parts[piece.id],rotation,position:new T.Vector3(-center.x,floor-flat.min.y,z-center.z)};
    });
   }
   integration.finish(rootGroup);
   const placed=[A.group.parent,B.group.parent,C.group.parent,aLoose,cLoose,pinLoose,bLoose1,bLoose2,...Object.values(extraModels)],roomPlaces=placed.map(o=>o.position.clone());
   const seatedPoints=[[.22,.67],[.42,.56],[.30,.55],[.274,.477],[.29,.478],[.306,.479],[-2,-2],[-2,-2]];
   layoutShot=id=>{placed.forEach((o,i)=>o.position.copy(id==='seated'?(i<6?groundAt(...seatedPoints[i]):new T.Vector3(1000,0,1000)):roomPlaces[i]));};
   function hitSample(e){if(location!=='room'||!active)return null;const r=renderer.domElement.getBoundingClientRect();if(integration.occluded((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height))return null;ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);rootGroup.updateMatrixWorld(true);for(const hit of ray.intersectObjects(rootGroup.children,true)){if(!hit.object.isMesh)continue;let visible=true;for(let parent=hit.object;parent;parent=parent.parent){if(!parent.visible){visible=false;break;}}if(!visible)continue;let object=hit.object;while(object&&object!==rootGroup&&!object.userData.hotspot)object=object.parent;if(object?.userData.hotspot)return object.userData.hotspot;}return null;}
   renderer.domElement.addEventListener('click',e=>{const id=hitSample(e);if(id&&!buttons.get(id).disabled)onSelect(id);});
   highlightSample=id=>{const valid=id&&!buttons.get(id)?.disabled?id:null;for(const [key,b]of buttons)b.classList.toggle('hovered',key===valid);rootGroup.traverse(o=>{if(!o.isLineSegments)return;let parent=o;while(parent&&parent!==rootGroup&&!parent.userData.hotspot)parent=parent.parent;const lit=parent?.userData.hotspot===valid&&!!valid;o.material.color.set(lit?0xc58a43:0x67513c);o.material.opacity=lit?.95:.3;});renderer.domElement.style.cursor=valid?'pointer':'default';dirty=true;};
   renderer.domElement.addEventListener('pointermove',e=>highlightSample(hitSample(e)));renderer.domElement.addEventListener('pointerleave',()=>highlightSample(null));
  }
  function layout(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;const width=Math.min(r.width,r.height*1672/941),height=width*941/1672;frame.style.width=width+'px';frame.style.height=height+'px';renderer?.setSize(width,height,false);dirty=true;}
  const observer=new ResizeObserver(layout);observer.observe(host);layout();
  function paint(){if(disposed)return;raf=requestAnimationFrame(paint);if(active&&!document.hidden&&dirty&&renderer){dirty=false;integration.render(location,rootGroup);}}paint();
  function update(completed,current,blocked=false,extraAvailable=false,layouts={}){
   const d=id=>completed.includes(id),open=id=>layouts[id]?layouts[id]==='dismantle':id==='straight'?d('straight-out')&&!d('straight-back'):id==='lap'?d('lap-out'):id==='pinned'?d('pinned-out'):false;
   lastState={completed:[...completed],current,extraAvailable,layouts:{...layouts},looseExtras:Object.fromEntries(extraIds.map(id=>[id,open(id)]))};
   for(const [id,model]of Object.entries(extraModels)){
    model.visible=extraAvailable;for(const item of extraLayouts[id]){item.part.rotation.copy(open(id)?item.rotation:new T.Euler());item.part.position.copy(open(id)?item.position:new T.Vector3());}
   }
   if(renderer){A.parts.tenon.visible=!open('straight');aLoose.visible=open('straight');B.group.visible=!open('lap');bLoose1.visible=bLoose2.visible=open('lap');C.parts.tenon.visible=C.parts.pin.visible=!open('pinned');cLoose.visible=pinLoose.visible=open('pinned');}
   anchors.lap=open('lap')?[.915,.824]:[.655,.603];
   for(const [id,button]of buttons){button.style.left=anchors[id][0]*100+'%';button.style.top=(anchors[id][1]+(woodIds.includes(id)?-.012:0))*100+'%';button.disabled=blocked||location!=='room'||extraIds.includes(id)&&!extraAvailable;button.hidden=location!=='room'||extraIds.includes(id)&&!extraAvailable;if(blocked)button.classList.remove('hovered');button.classList.toggle('current',id===current);button.classList.toggle('completed',(id==='straight'&&d('straight-back'))||(id==='lap'&&d('lap-out'))||(id==='pinned'&&d('pinned-out')));}
   if(blocked)highlightSample(null);lastState.visual={straightAssembled:!open('straight'),straightInTray:open('straight'),lapInBox:open('lap'),pinnedInTray:open('pinned')};dirty=true;
  }
  function setLocation(id){if(location!==id)layoutShot(id);location=id;frame.dataset.location=id;for(const [key,im]of Object.entries(photos))im.hidden=key!==id;if(renderer)renderer.domElement.hidden=!['room','seated'].includes(id);loading.textContent=id==='village'?'正在进入溪桥村…':'正在走近小屋…';loading.hidden=photos[id].dataset.loaded!==undefined;error.hidden=photos[id].dataset.loaded!=='error';for(const [key,b] of buttons)b.hidden=id!=='room'||extraIds.includes(key)&&!lastState?.extraAvailable;dirty=true;}
  function zoom(id,duration){clearTimeout(zoomTimer);zoomDone?.();return new Promise(resolve=>{zoomDone=resolve;frame.style.transition=duration?'transform '+duration+'ms cubic-bezier(.25,.1,.25,1)':'none';const p=anchors[id];frame.style.transformOrigin=p?p[0]*100+'% '+p[1]*100+'%':'50% 50%';frame.style.transform=p?'scale(1.52)':'scale(1)';if(!duration){zoomDone=null;resolve();}else zoomTimer=setTimeout(()=>{zoomDone=null;resolve();},duration);});}
  setLocation('room');
  return {setActive(value){active=value;if(value){layout();dirty=true;}},setLabels(value){frame.classList.toggle('show-object-names',!!value);},setLocation,update,focus:(id,duration=600)=>zoom(id,duration),reset:(duration=600)=>zoom(null,duration),snapshot:()=>({available:!!renderer,integration:integration?.snapshot(),storedTargets:storedTargets(),location,labels:frame.classList.contains('show-object-names'),images:Object.fromEntries(Object.entries(photos).map(([id,im])=>[id,im.dataset.loaded||'loading'])),...lastState,objects:lastState?.visual||{}}),dispose(){disposed=true;clearTimeout(zoomTimer);zoomDone?.();cancelAnimationFrame(raf);observer.disconnect();integration?.dispose();if(scene)release(scene);renderer?.dispose();renderer?.forceContextLoss();host.replaceChildren();}};
 }
 function notebook(host,id,{onSelect=()=>{},initialPart=null,solo=false,viewDirection=null,playbackPoints=null}={}){
  const renderer=setupRenderer(host),scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,150);renderer.setClearColor(0x000000,0);lightScene(scene);
  const definition=JointPuzzle.LEVELS.find(l=>l.id===id)||JointPuzzle.EXPERIMENT,model=sample(id),ray=new T.Raycaster(),home=new T.Vector3(...(Array.isArray(viewDirection)&&viewDirection.length===3&&viewDirection.every(Number.isFinite)&&Math.hypot(...viewDirection)>.01?viewDirection:[1,.8,1.2])).normalize();scene.add(model.group);
  // Cached source textures belong to the persistent workbench. Each temporary
  // renderer needs its own texture handles: renderer.dispose() alone leaves
  // its disposal listeners on shared textures, retaining the closed viewer.
  const ownedTextures=new Map();
  model.group.traverse(o=>{if(!o.material)return;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const key of ['map','gradientMap','bumpMap','roughnessMap']){
   const source=m[key];if(!source)continue;
   if(!ownedTextures.has(source)){const texture=source.clone();texture.needsUpdate=true;ownedTextures.set(source,texture);}
   m[key]=ownedTextures.get(source);
  }});
  const controls=new T.OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;camera.position.copy(home).multiplyScalar(12);controls.update();
  let raf=0,alive=true,dirty=true,separated=false,selected=null,pointerStart=null,manualZoom=false,isolated=false;
  const bounds=piece=>new T.Box3().setFromPoints(piece.shapes.flatMap(s=>s.vertices.map(v=>new T.Vector3(...v))));
  const row=new T.Vector3().crossVectors(new T.Vector3(0,1,0),home).normalize(),sizes=definition.pieces.map(p=>bounds(p).getSize(new T.Vector3())),widths=definition.pieces.map(p=>{const points=p.shapes.flatMap(s=>s.vertices.map(v=>new T.Vector3(...v).dot(row)));return Math.max(...points)-Math.min(...points);}),gap=Math.max(...sizes.map(s=>s.length()))*.15,total=widths.reduce((sum,s)=>sum+s,0)+gap*(sizes.length-1);
  let cursor=-total/2;const loose=definition.pieces.map((p,i)=>{const center=bounds(p).getCenter(new T.Vector3()),position=row.clone().multiplyScalar(cursor+widths[i]/2).sub(center);cursor+=widths[i]+gap;return position;});
  function framing(direction){
   const points=playbackPoints?playbackPoints.map(v=>new T.Vector3(...v)):definition.pieces.filter(p=>model.parts[p.id].visible).flatMap(p=>p.shapes.flatMap(s=>s.vertices.map(v=>new T.Vector3(...v).add(model.parts[p.id].position)))),box=new T.Box3().setFromPoints(points),center=box.getCenter(new T.Vector3()),up=new T.Vector3(0,1,0),right=new T.Vector3().crossVectors(up,direction).normalize(),vertical=new T.Vector3().crossVectors(direction,right).normalize(),tv=Math.tan(T.MathUtils.degToRad(camera.fov/2)),th=tv*camera.aspect;let distance=1;
   for(const point of points){const q=point.clone().sub(center);distance=Math.max(distance,q.dot(direction)+Math.max(Math.abs(q.dot(right))/th,Math.abs(q.dot(vertical))/tv)*1.22);}
   return {center,distance};
  }
  function fit(direction=camera.position.clone().sub(controls.target).normalize()){
   manualZoom=false;const {center,distance}=framing(direction);controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);controls.minDistance=Math.max(1,distance*.48);controls.maxDistance=distance*2.5;controls.update();camera.updateMatrixWorld();dirty=true;
  }
  function select(id){selected=definition.pieces.some(p=>p.id===id)?id:null;if(!selected)isolated=false;for(const [key,group]of Object.entries(model.parts)){group.visible=!isolated||key===selected;group.traverse(o=>{if(o.isLineSegments){o.material.color.set(key===selected?0x91491d:0x67513c);o.material.opacity=key===selected?.9:.3;}});}if(isolated)fit();onSelect(selected);dirty=true;}
  function isolate(value){isolated=!!value&&!!selected;for(const [key,group]of Object.entries(model.parts))group.visible=!isolated||key===selected;fit();}
  function separate(value){separated=!!value;definition.pieces.forEach((p,i)=>model.parts[p.id].position.copy(separated?loose[i]:new T.Vector3()));host.dataset.separated=String(separated);fit();}
  controls.addEventListener('change',()=>{if(!manualZoom){const direction=camera.position.clone().sub(controls.target).normalize(),frame=framing(direction);camera.position.copy(controls.target).addScaledVector(direction,frame.distance);controls.minDistance=Math.max(1,frame.distance*.35);controls.maxDistance=frame.distance*2.5;camera.updateMatrixWorld();}dirty=true;});
  renderer.domElement.addEventListener('wheel',()=>manualZoom=true,{capture:true,passive:true});
  renderer.domElement.addEventListener('pointerdown',e=>pointerStart={x:e.clientX,y:e.clientY});
  renderer.domElement.addEventListener('pointerup',e=>{if(playbackPoints||!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);const hit=ray.intersectObjects(model.group.children,true).find(h=>h.object.isMesh&&h.object.parent.visible);if(hit){const group=hit.object.parent;select(Object.keys(model.parts).find(id=>model.parts[id]===group));}pointerStart=null;});
  function resize(){const r=host.getBoundingClientRect();if(r.width&&r.height){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();fit();}}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();separate(false);if(initialPart)select(initialPart);if(solo)isolate(true);
  function render(){if(!alive)return;raf=requestAnimationFrame(render);if(dirty&&!document.hidden){dirty=false;renderer.render(scene,camera);}}render();
  const dispose=()=>{if(!alive)return;alive=false;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();release(scene);ownedTextures.forEach(texture=>texture.dispose());ownedTextures.clear();scene.traverse(o=>o.shadow?.dispose());renderer.dispose();renderer.forceContextLoss();host.replaceChildren();};
  dispose.separate=separate;dispose.select=select;dispose.isolate=isolate;dispose.reset=()=>fit(home);
  dispose.pose=frame=>{if(!playbackPoints)return;selected=frame.active;for(const [id,group]of Object.entries(model.parts)){group.visible=!frame.removed.includes(id);group.position.fromArray(frame.offsets[id]||[0,0,0]);group.traverse(o=>{if(o.isLineSegments){o.material.color.set(id===frame.active?0x91491d:0x67513c);o.material.opacity=id===frame.active?.85:.3;}});}dirty=true;};
  dispose.snapshot=()=>{camera.updateMatrixWorld();const rect=renderer.domElement.getBoundingClientRect();return {id,separated,isolated,selected,manualZoom,camera:camera.position.toArray(),direction:camera.position.clone().sub(controls.target).normalize().toArray(),pieces:Object.fromEntries(definition.pieces.filter(p=>model.parts[p.id].visible).map(p=>{const offset=model.parts[p.id].position,points=p.shapes.flatMap(s=>s.vertices.map(v=>new T.Vector3(...v).add(offset).project(camera)));return [p.id,{x0:Math.min(...points.map(v=>v.x)),x1:Math.max(...points.map(v=>v.x)),y0:Math.min(...points.map(v=>v.y)),y1:Math.max(...points.map(v=>v.y))}];})),width:rect.width,height:rect.height};};return dispose;
 }
 root.WoodWorkshop={create,notebook};
})(window);
