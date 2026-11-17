/* Fixed illustration camera: background, wood, contact shadows and foreground
   share one render. No external assets or changes to the puzzle geometry. */
(function(root){
 'use strict';
 root.RoomIntegration=function(T,renderer,camera,scene,photos){
  const W=1672,H=941,center=new T.Vector2(W/2,H/2);
  // Vanishing points measured from the four corners of the illustrated worktop.
  const vx=new T.Vector2(-432.435,223.838),vz=new T.Vector2(2313.461,117.936);
  const focal=Math.sqrt(-vx.clone().sub(center).dot(vz.clone().sub(center)));
  const x=new T.Vector3(center.x-vx.x,vx.y-center.y,focal).normalize();
  const z=new T.Vector3(center.x-vz.x,vz.y-center.y,focal).normalize();
  const y=new T.Vector3().crossVectors(z,x).normalize();
  const rotation=new T.Matrix4().makeBasis(x,y,z).transpose();
  camera.fov=T.MathUtils.radToDeg(2*Math.atan(H/2/focal));
  camera.quaternion.setFromRotationMatrix(rotation);camera.position.set(0,0,18).applyMatrix4(rotation);
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const ray=new T.Raycaster();
  function groundAt(u,v,height=0){ray.setFromCamera(new T.Vector2(u*2-1,1-v*2),camera);return ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-height),new T.Vector3());}
  const backdrop=new T.Scene(),foreground=new T.Scene(),screen=new T.OrthographicCamera(-1,1,1,-1,0,2);screen.position.z=1;
  const textures=new Map(),resources=[],plate=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({depthTest:false,depthWrite:false,toneMapped:false}));backdrop.add(plate);
  const polygons=[
   [[320,457],[1130,708],[1122,794],[325,530]],
   [[1130,708],[1485,531],[1470,608],[1122,794]],
   // Front lips actually cover pieces lowered into the tray and storage box.
   [[503,406],[628,387],[628,409],[503,428]],
   [[466,391],[503,406],[503,428],[466,413]],
   [[1382,750],[1594,814],[1594,941],[1382,941]]
  ];
  for(const polygon of polygons){const shape=new T.Shape(polygon.map(([u,v])=>new T.Vector2(u/W*2-1,1-v/H*2))),g=new T.ShapeGeometry(shape),uv=g.getAttribute('uv'),p=g.getAttribute('position');for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+1)/2,(p.getY(i)+1)/2);const m=new T.MeshBasicMaterial({depthTest:false,depthWrite:false,toneMapped:false});foreground.add(new T.Mesh(g,m));}
  function receiver(points,height){const shape=new T.Shape(points.map(([u,v])=>{const p=groundAt(u,v,height);return new T.Vector2(p.x,-p.z);})),mesh=new T.Mesh(new T.ShapeGeometry(shape),new T.ShadowMaterial({opacity:.42,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.y=height+.001;mesh.receiveShadow=true;scene.add(mesh);resources.push(mesh);}
  receiver([[320/W,457/H],[1130/W,708/H],[1485/W,531/H],[661/W,399/H]],0);
  receiver([[466/W,391/H],[591/W,378/H],[628/W,387/H],[503/W,406/H]],.2);
  receiver([[.83,.797],[.9,.737],[.988,.805],[.952,.891]],-1.5);
  const ambient=new T.HemisphereLight(0xb8cee0,0x62432d,.64);scene.add(ambient);
  const lamp=new T.DirectionalLight(0xffd493,1.7);lamp.position.copy(groundAt(.46,.07,5));lamp.target.position.copy(groundAt(.49,.53));lamp.castShadow=true;lamp.shadow.mapSize.set(2048,2048);Object.assign(lamp.shadow.camera,{left:-7,right:7,top:6,bottom:-6,near:.1,far:32});lamp.shadow.bias=-.0001;lamp.shadow.normalBias=.003;lamp.shadow.radius=2;scene.add(lamp,lamp.target);
  const windowLight=new T.DirectionalLight(0xc1ddf4,.32);windowLight.position.set(-8,4,1);scene.add(windowLight);
  const contactGroup=new T.Group();scene.add(contactGroup);const contactGeometry=new T.PlaneGeometry(1,1),contactMaterials=[];
  function contactMaterial(){const m=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,uniforms:{ink:{value:new T.Color(0x24150c)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform vec3 ink;void main(){vec2 d=max(abs(v-.5)-vec2(.31),vec2(0.));float a=exp(-dot(d,d)*100.)*.34;gl_FragColor=vec4(ink,a);}' });contactMaterials.push(m);return m;}
  function contacts(rootGroup){rootGroup.updateMatrixWorld(true);let count=0;for(const wrapper of rootGroup.children){if(!wrapper.visible)continue;const floor=wrapper.userData.surfaceY||0;wrapper.traverse(o=>{if(!o.isMesh)return;for(let a=o;a&&a!==rootGroup;a=a.parent)if(!a.visible)return;const box=new T.Box3().setFromObject(o);if(Math.abs(box.min.y-floor)>.04)return;let shadow=contactGroup.children[count++];if(!shadow){shadow=new T.Mesh(contactGeometry,contactMaterial());shadow.rotation.x=-Math.PI/2;contactGroup.add(shadow);}const size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());shadow.visible=true;shadow.position.set(c.x,floor+.003,c.z);shadow.scale.set(size.x*1.35,size.z*1.35,1);});}for(let i=count;i<contactGroup.children.length;i++)contactGroup.children[i].visible=false;}
  function finish(rootGroup){rootGroup.traverse(o=>{if(!o.isMesh)return;const previous=o.material;if(previous.userData.roomFinished)return;const m=new T.MeshStandardMaterial({map:previous.map,roughness:1,color:0xe3c7a2,side:T.DoubleSide});m.onBeforeCompile=previous.onBeforeCompile;m.customProgramCacheKey=()=> 'room-painted-wood-v1';m.userData.roomFinished=true;o.material=m;previous.dispose();});}
  function render(location,rootGroup){const im=photos[location];renderer.autoClear=false;renderer.clear();if(im?.dataset.loaded==='true'){
    let texture=textures.get(location);if(!texture||texture.image!==im||im.dataset.textureSrc!==im.src){texture?.dispose();texture=new T.Texture(im);texture.encoding=T.sRGBEncoding;texture.needsUpdate=true;textures.set(location,texture);im.dataset.textureSrc=im.src;}
    plate.material.map=texture;plate.material.needsUpdate=!plate.material.userData.ready;plate.material.userData.ready=true;renderer.render(backdrop,screen);renderer.clearDepth();
    // The HTML image remains underneath as the loading / WebGL fallback.
    for(const mesh of foreground.children){mesh.material.map=texture;mesh.material.needsUpdate=!mesh.material.userData.ready;mesh.material.userData.ready=true;}
   }
   contacts(rootGroup);contactGroup.visible=location==='room';renderer.render(scene,camera);
   if(location==='room'&&im?.dataset.loaded==='true'){renderer.clearDepth();renderer.render(foreground,screen);}
  }
  function occluded(u,v){const x=u*W,y=v*H;return polygons.some(poly=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;});}
  return {groundAt,finish,render,occluded,snapshot:()=>({composite:true,contactPatches:contactGroup.children.filter(o=>o.visible).length,foregroundMasks:polygons.length,fov:camera.fov}),dispose(){for(const s of [backdrop,foreground])s.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});for(const t of textures.values())t.dispose();contactGeometry.dispose();contactMaterials.forEach(m=>m.dispose());}};
 };
})(window);
