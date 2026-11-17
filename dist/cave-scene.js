(function(root){
 'use strict';
 function create(host,state,callbacks){
  const T=THREE,D=CaveData,P=JointPuzzle;
  const scene=new T.Scene();scene.background=new T.Color('#627c7f');scene.fog=new T.FogExp2('#7b9090',.026);
  const camera=new T.PerspectiveCamera(65,1,.08,110);camera.rotation.order='YXZ';
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','静洞寻木：WASD 行走，鼠标观察，E 查看接点');
  const keys=new Set(),objects=[],solids=[],wallBounds=[],gates=[],materials=[],geometries=[],textures=[],markers=[];
  let enabled=false,disposed=false,raf,now=performance.now(),dragLook=null,target=null,zoom=null,dirtyTime=0,walker=null;
  let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||callbacks.settings?.reducedMotion;
  let seed=1847;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:1,...extra});m.color.convertSRGBToLinear();materials.push(m);return m;};
  const stone=Array.from({length:6},(_,i)=>mat(['#586b70','#697b7e','#83908b','#465b63','#6e817f','#81908b'][i],{flatShading:false}));
  const moss=mat('#4e6855'),floorMat=mat('#697e7c'),wood=mat('#816044'),darkWood=mat('#4c4337'),trim=mat('#b29462');
  const rockReady={value:0};
  const rockTexture=new T.TextureLoader().load('assets/cave/rock.png',()=>{rockReady.value=1;},undefined,()=>callbacks.notice?.('岩壁纹理未能加载，已使用基础材质；仍可继续探索。'));
  rockTexture.wrapS=rockTexture.wrapT=T.RepeatWrapping;rockTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.push(rockTexture);
  for(const m of [...stone,floorMat,moss]){
   m.onBeforeCompile=shader=>{
    shader.uniforms.uCaveRock={value:rockTexture};shader.uniforms.uCaveRockReady=rockReady;
    shader.vertexShader='varying vec3 vRockWorld;\nvarying vec3 vRockNormal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvRockWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\nvRockNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader='varying vec3 vRockWorld;\nvarying vec3 vRockNormal;\nuniform sampler2D uCaveRock;\nuniform float uCaveRockReady;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
     float strata=sin(vRockWorld.y*8.0+sin(vRockWorld.x*1.4)*1.1+sin(vRockWorld.z*.9)*2.5);
     float fleck=fract(sin(dot(floor(vRockWorld*92.0),vec3(12.9,78.2,32.1)))*43758.5);
     float broad=sin(vRockWorld.x*3.1+vRockWorld.z*2.5)*sin(vRockWorld.y*2.3+vRockWorld.z*.7);
     diffuseColor.rgb *= .86+.09*strata+.09*broad+.06*fleck;
     vec3 weight=pow(abs(normalize(vRockNormal)),vec3(4.0));weight/=max(.001,weight.x+weight.y+weight.z);
     vec3 albedo=texture2D(uCaveRock,vRockWorld.zy*.21).rgb*weight.x+texture2D(uCaveRock,vRockWorld.xz*.21).rgb*weight.y+texture2D(uCaveRock,vRockWorld.xy*.21).rgb*weight.z;
     albedo=pow(albedo,vec3(2.2));
     diffuseColor.rgb *= mix(vec3(1.0),vec3(.65)+albedo*4.0,.7*uCaveRockReady);
    `);
   };
   m.customProgramCacheKey=()=> 'cave-rock-strata-v2';
  }
  const paint=document.createElement('canvas');paint.width=paint.height=256;const pc=paint.getContext('2d');
  pc.fillStyle='#ab8e64';pc.fillRect(0,0,256,256);
  for(let i=0;i<160;i++){pc.strokeStyle=i%3?'#6c503c18':'#ede2bb28';pc.lineWidth=random()*1.4;pc.beginPath();const x=random()*256;pc.moveTo(x,0);pc.bezierCurveTo(x+5,70,x-4,170,x,256);pc.stroke();}
  const grain=new T.CanvasTexture(paint);grain.encoding=T.sRGBEncoding;grain.wrapS=grain.wrapT=T.RepeatWrapping;textures.push(grain);wood.map=grain;trim.map=grain;
  const boxGeo=new T.BoxGeometry(1,1,1);geometries.push(boxGeo);
  function box(parent,x,y,z,w,h,d,m=wood){const o=new T.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function collider(x,z,w,d){solids.push({x,z,w,d});}
  function label(text){
   const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');
   g.fillStyle='#283e39';g.fillRect(0,0,512,128);g.strokeStyle='#b7a278';g.lineWidth=3;g.strokeRect(9,9,494,110);
   g.fillStyle='#ecdfb4';g.font='34px Microsoft YaHei';g.textAlign='center';g.fillText(text,256,78);
   const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;textures.push(tex);
   return mat('#ffffff',{map:tex});
  }
  scene.add(new T.HemisphereLight('#c8ded7','#4d5552',.85));
  const sun=new T.DirectionalLight('#fff2cc',1.15);sun.position.set(-6,13,5);sun.target.position.set(0,0,-17);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:18,bottom:-18,near:1,far:65});sun.shadow.bias=-.0007;
  for(let a=0;a<4;a++){
   const z=-7-a*18;const light=new T.PointLight(a%2?'#d8e9da':'#eedbb0',.75,26,1.4);light.position.set(-1.6,5,z);scene.add(light);
   // Skylight shafts are subtle volume cues; the floor and furniture receive real lights.
   const beamGeo=new T.CylinderGeometry(.5,2.1,5,12,1,true);geometries.push(beamGeo);
   const beam=new T.Mesh(beamGeo,mat('#d4e6d6',{transparent:true,opacity:.035,depthWrite:false,side:T.DoubleSide}));
   beam.position.set(-1.6,3.3,z-2);beam.rotation.z=-.18;scene.add(beam);
  }
  box(scene,0,-.18,-34,9,.36,82,floorMat);
  // Layered continuous cave walls. Faceted rocks break their silhouette, rather than floating in front of an image.
  const wallGeo=new T.IcosahedronGeometry(1,2);
  const wp=wallGeo.attributes.position;
  for(let i=0;i<wp.count;i++){const x=wp.getX(i),y=wp.getY(i),z=wp.getZ(i),r=1+.09*Math.sin(x*8+z*3)*Math.cos(y*7)+.04*Math.sin(z*13+y*5);wp.setXYZ(i,x*r,y*r,z*r);}
  // Keep shared radial normals: recomputing a non-indexed mesh would turn every triangle into a hard facet.
  geometries.push(wallGeo);
  for(let side of [-1,1]){
   box(scene,side*5.6,3,-34,2.8,7,83,stone[0]);
   for(let z=5;z>-76;z-=2.0){
    for(let y=0;y<6;y+=2.1){
     const rock=new T.Mesh(wallGeo,stone[Math.floor(random()*stone.length)]);
     rock.position.set(side*(5.0+random()*.7),y+.7,z+random());rock.scale.set(1.2+random()*.6,1.3+random()*.7,1.6+random());
     rock.rotation.set(random()*.5,random(),random()*.6);rock.castShadow=rock.receiveShadow=true;scene.add(rock);
     if(y<3){const dy=Math.max(0,rock.position.y-1.75,.25-rock.position.y),f=Math.sqrt(Math.max(0,1-(dy/rock.scale.y)**2));if(f>0)wallBounds.push({x:rock.position.x,z:rock.position.z,rx:rock.scale.x*f,rz:rock.scale.z*f});}
    }
    const pebble=new T.Mesh(wallGeo,random()>.5?moss:stone[2]);pebble.position.set(side*(3.85+random()*.4),.12,z);pebble.scale.set(.3+random()*.4,.12+random()*.15,.4+random()*.4);scene.add(pebble);
   }
  }
  // Roof spans leave four natural light fissures, while arches establish depth.
  for(let z=3;z>-75;z-=3){
   if([-7,-25,-43,-61].some(k=>Math.abs(k-z)<2.5))continue;
   const rock=new T.Mesh(wallGeo,stone[1]);rock.position.set(0,6.8,z);rock.scale.set(6,1.6,2.3);rock.receiveShadow=true;scene.add(rock);
  }
  for(let z=-2;z>-74;z-=18){
   for(let i=0;i<=9;i++){const angle=Math.PI*i/9,rock=new T.Mesh(wallGeo,stone[(i+2)%6]);rock.position.set(Math.cos(angle)*4.8,1+Math.sin(angle)*4.8,z);rock.scale.set(.8,1.1,1.25);rock.rotation.z=angle;scene.add(rock);}
  }
  // A walkable, gently worn stone path: all raised stones stay outside the walking corridor.
  for(let z=3;z>-74;z-=1.8){
   box(scene,Math.sin(z*.3)*.2,.008,z,2.2+random()*.3,.018,1.55,stone[2]);
   if(random()>.4){const p=new T.Mesh(new T.CircleGeometry(.5+random(),20),mat('#7d9c9a',{roughness:.24,metalness:.12,transparent:true,opacity:.35}));geometries.push(p.geometry);p.rotation.x=-Math.PI/2;p.scale.y=.45;p.position.set(2.4,.025,z);scene.add(p);}
  }
  for(let a=0;a<4;a++){
   const sign=box(scene,-3.7,2.5,-4-a*18,1.7,.43,.08,label(['一 · 洞口','二 · 浅洞','三 · 中洞','四 · 天光'][a]));sign.rotation.y=.25;
   // Abandoned supplies give each bay a human scale.
   for(let i=0;i<3;i++){box(scene,3.35,.35+i*.34,-12-a*18,.8,.3,1.2,darkWood);box(scene,3.35,.35+i*.34,-11.38,.85,.32,.035,trim);}
   collider(3.35,-12-a*18,1,1.4);
   for(let i=0;i<4;i++){const fern=new T.Mesh(new T.ConeGeometry(.15,.65,4),moss);geometries.push(fern.geometry);fern.position.set(-3.7+i*.16,.22,-9-a*18);fern.rotation.z=(i-1.5)*.3;scene.add(fern);}
  }
  const endLight=new T.DirectionalLight('#e6f3d1',2);endLight.position.set(0,5,-78);scene.add(endLight);
  const outside=mat('#b6d0b8',{emissive:'#b0ceb0',emissiveIntensity:.3});box(scene,0,3,-77,9,8,.2,outside);
  for(let i=0;i<10;i++){const tree=new T.Mesh(wallGeo,mat(i%2?'#718f73':'#45695e'));tree.position.set((i-4.5)*1.1,2+random()*2,-76);tree.scale.set(.8,1.6,1);scene.add(tree);}
  function partModel(part){
   const faces=WoodMesh.surfaces(part.shapes,.025),pos=[],normal=[],uv=[];
   for(const f of faces)for(let j=1;j<f.vertices.length-1;j++)for(const v of [f.vertices[0],f.vertices[j],f.vertices[j+1]]){pos.push(...v);normal.push(...f.normal);uv.push(v[0]*.35,v[1]*.3);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometries.push(g);
   const material=WoodFinish.material(T,part,part.grainAxis??1,2,true);material.color.set('#d7c6a7').convertSRGBToLinear();materials.push(material);
   const m=new T.Mesh(g,material);m.castShadow=m.receiveShadow=true;return m;
  }
  D.nodes.forEach((n,index)=>{
   const group=new T.Group();group.position.set(n.x,n.y,n.z+.22);scene.add(group);
   const mechanism=new T.Group();mechanism.scale.setScalar(n.kind==='box'?.29:n.kind==='case'?.22:.20);group.add(mechanism);
   const level=P.LEVELS.find(l=>l.id===n.level),parts=[];
   for(const part of level.pieces){const mesh=partModel(part);mesh.userData.part=part.id;mechanism.add(mesh);parts.push({mesh,part});}
   let leaf=null;
   if(n.kind==='case'||n.kind==='box'){
    box(scene,n.x,.52,n.z,1.95,1.04,1.3,n.kind==='box'?stone[1]:darkWood);collider(n.x,n.z,2,1.4);
    if(n.kind==='case'){box(scene,n.x,1.04,n.z,2.0,.09,1.35,wood);}
   }else{
    // Side panels meet the rock walls; the central movable leaf and its catch share one location.
    for(const side of [-1,1]){
     box(scene,side*3.05,1.25,n.z,2.6,2.5,.17,darkWood);
     for(let i=0;i<6;i++)box(scene,side*(1.87+i*.47),1.25,n.z+.11,.36,2.5,.12,i%3?wood:darkWood);
     box(scene,side*1.72,1.4,n.z,.21,2.8,.33,trim);
    }
    leaf=new T.Group();leaf.position.set(-1.6,0,n.z);scene.add(leaf);
    if(n.kind==='frame'){
     // This is a removable front frame on a storage rack, not another solid fence.
     box(leaf,.12,1.18,0,.20,2.36,.18,wood);box(leaf,3.08,1.18,0,.20,2.36,.18,wood);
     for(const y of [.25,1.1,2.2])box(leaf,1.6,y,0,3.2,.18,.2,wood);
     for(const side of [-1,1])for(let j=0;j<3;j++){
      box(scene,side*2.9,.35+j*.78,n.z+.15,2,.10,.8,trim);
      box(scene,side*2.9,.55+j*.78,n.z+.18,1.5,.3,.45,darkWood);
     }
    }else if(n.kind==='cabinet'){
     for(let i=0;i<8;i++)box(leaf,.2+i*.4,1.18,0,.392,2.36,.16,i%3?wood:darkWood);
     box(leaf,1.6,1.18,.12,2.8,1.9,.05,darkWood);
     for(const x of [.3,2.9])box(leaf,x,1.18,.16,.08,2.12,.05,trim);
     for(const y of [.18,2.18])box(leaf,1.6,y,.16,2.8,.08,.05,trim);
    }else if(n.id==='exit-knot'){
     for(let i=0;i<12;i++)box(leaf,.12+i*.27,1.18,0,.09,2.36,.12,wood);
     for(let j=0;j<5;j++)box(leaf,1.6,.3+j*.4,.06,3.2,.08,.09,wood);
    }else{
     for(let i=0;i<8;i++){const board=box(leaf,.2+i*.4,1.16,0,.35,2.3+(i%3)*.035,.16,i%4?wood:darkWood);board.rotation.z=(i%3-1)*.003;}
    }
    box(leaf,1.6,.4,.13,3.25,.16,.13,darkWood);box(leaf,1.6,1.82,.13,3.25,.16,.13,darkWood);
    // Metal-free wooden ears visibly connect the removable catch to the door and fixed jamb.
    box(leaf,1.6,n.y,-.04,1.2,.12,.32,trim);
    gates.push({node:n,leaf,angle:state.completed.includes(n.id)?1:0});
    box(scene,.65,.35,n.z+.35,.8,.12,.55,darkWood); // catch tray, below the working area
   }
   const tab=box(scene,n.x-.5,n.y+.76,n.z+.23,1.05,.22,.04,label(String(index+1).padStart(2,'0')+' · '+n.short));
   const ring=new T.Mesh(new T.TorusGeometry(.045,.004,6,24),mat('#d7c48d',{emissive:'#e1c88b',emissiveIntensity:.15,depthTest:true}));geometries.push(ring.geometry);ring.position.set(n.x,n.y+.55,n.z+.55);scene.add(ring);markers.push(ring);
   const sketch=new T.Group();sketch.position.set(n.x,n.kind==='box'?1.06:1.1,n.z+.05);scene.add(sketch);
   if(['box','case'].includes(n.kind)){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#d5cba7';c.fillRect(0,0,512,256);c.strokeStyle='#53655b';c.lineWidth=5;c.beginPath();
    if(n.kind==='case'){c.moveTo(45,180);c.bezierCurveTo(80,15,220,220,270,100);c.bezierCurveTo(350,10,400,190,470,70);c.stroke();for(let i=0;i<4;i++){c.strokeRect(65+i*110,95,35,35);}}
    else{for(let i=0;i<3;i++){c.strokeRect(50+i*150,80,110,65);c.strokeRect(88+i*150,40,32,145);}}
    const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;textures.push(tex);
    const page=box(sketch,0,0,0,1.3,.012,.7,mat('#ffffff',{map:tex}));page.rotation.y=.1;
   }
   const storage=new T.Group();scene.add(storage);
   storage.position.set(n.kind==='box'||n.kind==='case'?n.x+.55:.67,n.kind==='box'||n.kind==='case'?1.08:.44,n.z+.45);
   if(leaf){leaf.add(group);group.position.set(1.6,n.y,.22);}
   objects.push({node:n,group,mechanism,parts,leaf,ring,sketch,tab,storage});
  });
  const supplyCart=callbacks.campaign&&root.CampaignSupplies?CampaignSupplies.create(T):null;if(supplyCart){supplyCart.group.position.set(2.1,0,-72.2);supplyCart.group.rotation.y=Math.PI/2;scene.add(supplyCart.group);collider(2.1,-72.2,1.1,2.5);}
  function sync(){
   for(const o of objects){
    const complete=state.completed.includes(o.node.id),r=state.runs[o.node.id+':dismantle'],removed=complete?o.parts.filter(p=>!p.part.fixed).map(p=>p.part.id):(r?.history||[]).filter(m=>m.kind==='extract').map(m=>m.piece);
    for(const {mesh,part}of o.parts){mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.visible=true;
     if(removed.includes(part.id)){
      o.storage.add(mesh);const i=o.parts.filter(p=>!p.part.fixed).findIndex(p=>p.part.id===part.id);
      const scale=.07,bounds=part.shapes.flatMap(s=>s.vertices),minY=Math.min(...bounds.map(v=>v[1]));
      mesh.position.set((i%3-1)*.22,-minY*scale+.025,Math.floor(i/3)*.18-.12);mesh.scale.setScalar(scale);
     }else{o.mechanism.add(mesh);mesh.scale.setScalar(1);}
    }
    o.sketch.visible=complete;o.ring.material.color.set(complete?'#849f91':'#e6ce90');
    o.ring.visible=complete||D.nodes.indexOf(o.node)===state.completed.length;
    if(complete&&o.leaf)o.ring.position.set(.67,.9,o.node.z+.5);
   }
  }
  function blocked(x,z){
   if(x<-3.75||x>3.75||z>4.4||z<-74.5)return true;
   if(wallBounds.some(w=>((x-w.x)/(w.rx+.22))**2+((z-w.z)/(w.rz+.22))**2<1))return true;
   for(const s of solids)if(Math.abs(x-s.x)<s.w/2+.27&&Math.abs(z-s.z)<s.d/2+.27)return true;
   for(const g of gates){
    if(Math.abs(z-g.node.z)<.48){
     if(!state.completed.includes(g.node.id)||Math.abs(x)>1.35)return true;
    }
    // The open door rests against its jamb and remains a physical surface.
    if(state.completed.includes(g.node.id)&&x<-1.32&&x>-1.92&&z>g.node.z&&z<g.node.z+3.4)return true;
   }
   return false;
  }
  function setPose(){camera.position.fromArray(state.position);camera.rotation.set(state.pitch,state.yaw,0);camera.updateMatrixWorld();}
  function resize(){const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();dragLook=null;keys.clear();walker?.clear();}
  function movement(dt){
   const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),right=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
   if(!forward&&!right)return;const length=Math.hypot(forward,right),speed=2.6*dt/length;
   const dx=(-Math.sin(state.yaw)*forward+Math.cos(state.yaw)*right)*speed,dz=(-Math.cos(state.yaw)*forward-Math.sin(state.yaw)*right)*speed;
   // Small substeps prevent tunnelling even after a slow frame.
   const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.08);
   for(let i=0;i<steps;i++){if(!blocked(state.position[0]+dx/steps,state.position[2]))state.position[0]+=dx/steps;if(!blocked(state.position[0],state.position[2]+dz/steps))state.position[2]+=dz/steps;}
   callbacks.move?.();
  }
  const ray=new T.Raycaster();
  function getTarget(nx=0,ny=0){
   ray.setFromCamera(new T.Vector2(nx,ny),camera);
   let best=null;
   for(const o of objects){
    const p=targetPosition(o.node),v=p.clone().sub(camera.position),distance=v.length(),dot=v.normalize().dot(ray.ray.direction);
    if(distance<3.8&&dot>.89&&(!best||dot>best.dot))best={id:o.node.id,distance,dot};
   }
   // A closed foreground gate prevents selecting through it.
   if(best){const n=D.nodes.find(n=>n.id===best.id);if(gates.some(g=>!state.completed.includes(g.node.id)&&g.node.id!==best.id&&g.node.z<camera.position.z-.1&&g.node.z>n.z+.1))return null;}
   if(supplyCart&&state.completed.length===8){const delta=new T.Vector3(2.1,.8,-72.2).sub(camera.position),distance=delta.length(),dot=delta.normalize().dot(ray.ray.direction);if(distance<3.3&&dot>.94&&(!best||dot>best.dot))best={id:'supplies',name:'带布带的备用料与小车',distance,dot};}
   return best;
  }
  function targetPosition(n){return state.completed.includes(n.id)&&!['box','case'].includes(n.kind)?new T.Vector3(.67,.8,n.z+.4):new T.Vector3(n.x,n.y,n.z+.25);}
  function frame(time){
   if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min(.1,(time-now)/1000);now=time;
   if(!enabled&&!zoom)return;
   if(zoom){const t=reduced?1:Math.min(1,(time-zoom.start)/600),s=t*t*(3-2*t);camera.position.lerpVectors(zoom.from,zoom.to,s);camera.lookAt(zoom.look);if(t>=1){const cb=zoom.done;zoom=null;cb?.();}}
   else{walker.tick(dt);setPose();}
   for(const g of gates){const desired=state.completed.includes(g.node.id)?1:0;g.angle=reduced?desired:g.angle+(desired-g.angle)*Math.min(1,dt*3.7);g.leaf.rotation.y=-g.angle*Math.PI*.49;}
   target=enabled?walker.getTarget():null;callbacks.target?.(target);
   for(const o of objects)o.ring.scale.setScalar(target?.id===o.node.id?1.3:1);
   renderer.render(scene,camera);
   if(time-dirtyTime>1500){dirtyTime=time;callbacks.save?.();}
  }
  const down=e=>{
   if(!enabled||zoom||e.target.closest('button,dialog'))return;
   if(e.code==='KeyE'&&!e.repeat){e.preventDefault();if(target)callbacks.interact(target.id);return;}
   if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){keys.add(e.code);e.preventDefault();}
  };
  const up=e=>keys.delete(e.code);
  const mouse=e=>{
   if(!enabled||zoom)return;
   if(document.pointerLockElement===renderer.domElement||dragLook){
    const mx=document.pointerLockElement?e.movementX:e.clientX-dragLook.x,my=document.pointerLockElement?e.movementY:e.clientY-dragLook.y;
    state.yaw-=mx*.0022;state.pitch=Math.max(-1.15,Math.min(1.15,state.pitch-my*.0022));
    if(dragLook){dragLook.moved+=Math.abs(mx)+Math.abs(my);dragLook.x=e.clientX;dragLook.y=e.clientY;}
   }
  };
  const pointerdown=e=>{if(enabled&&e.button===0&&document.pointerLockElement!==renderer.domElement)dragLook={x:e.clientX,y:e.clientY,moved:0};};
  const pointerup=e=>{
   if(!enabled)return;const click=!dragLook||dragLook.moved<6;dragLook=null;
   if(click&&e.button===0){const r=renderer.domElement.getBoundingClientRect(),t=getTarget(document.pointerLockElement?0:(e.clientX-r.left)/r.width*2-1,document.pointerLockElement?0:1-(e.clientY-r.top)/r.height*2);if(t)callbacks.interact(t.id);else lock();}
  };
  function lock(){if(enabled)try{const p=renderer.domElement.requestPointerLock?.();p?.catch(()=>callbacks.notice?.('也可以按住空白拖动观察，WASD 行走。'));}catch{}}
  const clear=()=>{keys.clear();dragLook=null;callbacks.save?.();};
  const firstClosed=gates.find(g=>!state.completed.includes(g.node.id));
  const safeStart=FirstPerson.safePosition(state.position,(x,z)=>blocked(x,z)||!!firstClosed&&z<firstClosed.node.z+.8,[0,1.65,3]);
  if(safeStart.some((v,i)=>v!==state.position[i])){state.position=safeStart;callbacks.notice?.('站位已移到旁边的空处，可以继续走动。');}
  walker=FirstPerson.create({canvas:renderer.domElement,camera,pose:state,blocked,target:getTarget,interact:callbacks.interact,move:callbacks.move,settings:callbacks.settings||{},notice:callbacks.notice});
  window.addEventListener('blur',clear);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',clear);
  setPose();resize();sync();renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  return {
   enable(value){enabled=value;clear();walker.enable(value);if(value){setPose();resize();renderer.domElement.focus({preventScroll:true});}},
   approach(id,done){const n=D.nodes.find(n=>n.id===id),look=targetPosition(n);enabled=false;clear();walker.enable(false);if(document.pointerLockElement)document.exitPointerLock();zoom={start:performance.now(),from:camera.position.clone(),to:look.clone().add(new T.Vector3(0,.25,1.5)),look,done};},
   cancel(){zoom=null;clear();walker.clear();setPose();},sync,resize,lock:()=>walker.lock(),
   quality(){const s=callbacks.settings||{};renderer.setPixelRatio(Math.min(devicePixelRatio,s.quality==='low'?1:s.quality==='high'?1.75:1.35));renderer.shadowMap.enabled=s.quality!=='low';reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||s.reducedMotion;resize();},
   snapshot(){return {available:true,supplies:!!supplyCart,position:[...state.position],yaw:state.yaw,pitch:state.pitch,enabled,target:target?.id||null,transition:!!zoom,gates:gates.map(g=>({id:g.node.id,open:state.completed.includes(g.node.id),angle:g.angle})),nodes:objects.map(o=>{const p=targetPosition(o.node).project(camera),r=renderer.domElement.getBoundingClientRect();return {id:o.node.id,screen:{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2},distance:camera.position.distanceTo(targetPosition(o.node))};}),drawCalls:renderer.info.render.calls};},
   dispose(){disposed=true;cancelAnimationFrame(raf);clear();walker.dispose();supplyCart?.dispose();window.removeEventListener('resize',resize);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();}
  };
 }
 root.CaveScene={create};
})(window);
