'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');

async function main(){
 const output=path.join(__dirname,'../dist/assets/workshop-models');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  await page.goto((process.env.TEST_URL||'http://127.0.0.1:4173/')+'?practice=1');
  await page.waitForFunction(()=>window.THREE&&window.WoodFinish&&window.WoodMesh);
  const frames=await page.evaluate(()=>{
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
   renderer.setSize(960,520);renderer.outputEncoding=THREE.sRGBEncoding;
   renderer.toneMapping=THREE.ACESFilmicToneMapping;
   renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   const render=(id,open)=>{
    const model=JointPuzzle.LEVELS.find(l=>l.id===id);
    const scene=new THREE.Scene(),wood=new THREE.Group();
    scene.add(wood);
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,100);
    camera.position.set(open?7:8,open?13:8,14);
    camera.lookAt(0,0,0);camera.updateMatrixWorld();
    for(const [i,p]of model.pieces.entries()){
     const axis=p.grainAxis??(p.id==='key'?1:0),faces=WoodMesh.surfaces(p.shapes,WoodFinish.chamfer(id));
     const geometry=WoodMesh.geometry(THREE,faces,axis);
     const material=WoodFinish.material(THREE,WoodFinish.piece(id,p),axis,1,true);
     const mesh=new THREE.Mesh(geometry,material);
     mesh.castShadow=true;mesh.receiveShadow=true;
     if(open&&id==='burr-six'){
      geometry.center();
      mesh.rotation.z=axis===1?Math.PI/2:0;
      if(axis===2)mesh.rotation.y=Math.PI/2;
      mesh.updateMatrixWorld();
      mesh.position.set((i%3-1)*5.7,-new THREE.Box3().setFromObject(mesh).min.y,(Math.floor(i/3)-.5)*3.3);
     }else if(open&&id==='dovetail'){
      if(p.id==='slide')mesh.position.x=5;
      if(p.id==='key')mesh.position.set(3,-1.1,2.3);
     }
     wood.add(mesh);
    }
    wood.updateMatrixWorld();
    const bounds=new THREE.Box3().setFromObject(wood);
    const points=[];
    wood.traverse(mesh=>{
     if(!mesh.isMesh)return;
     const positions=mesh.geometry.getAttribute('position');
     for(let i=0;i<positions.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse));
    });
    const frame=new THREE.Box3().setFromPoints(points),center=frame.getCenter(new THREE.Vector3()),size=frame.getSize(new THREE.Vector3());
    const width=Math.max(size.x,size.y*960/520)*1.21,height=width*520/960;
    camera.left=center.x-width/2;camera.right=center.x+width/2;camera.bottom=center.y-height*.55;camera.top=camera.bottom+height;camera.updateProjectionMatrix();
    const board=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x54605a,roughness:1}));
    board.rotation.x=-Math.PI/2;board.position.y=bounds.min.y-.025;board.receiveShadow=true;scene.add(board);
    const key=new THREE.DirectionalLight(0xffe9c8,1.43);key.position.set(-6,14,8);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.018;key.shadow.bias=-.0005;
    Object.assign(key.shadow.camera,{left:-13,right:13,top:13,bottom:-13});
    scene.add(key,new THREE.HemisphereLight(0xfff0de,0x756255,.75));
    renderer.render(scene,camera);
    const result=renderer.domElement.toDataURL('image/webp',.92).split(',')[1];
    scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});key.shadow.dispose();
    return result;
   };
   return [['dovetail','dovetail'],['burr-six','burr']].flatMap(([id,label])=>[false,true].map(open=>[label+'-'+(open?'open':'joined'),render(id,open)]));
  });
  await fs.mkdir(output,{recursive:true});
  for(const [name,bytes]of frames)await fs.writeFile(path.join(output,name+'.webp'),Buffer.from(bytes,'base64'));
  console.log('Rendered four workshop views from the current gameplay meshes.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
