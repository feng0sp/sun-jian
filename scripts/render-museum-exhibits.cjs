'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');

async function renderExhibits(){
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  await page.goto((process.env.TEST_URL||'http://127.0.0.1:4173/')+'?practice=1');
  await page.waitForFunction(()=>window.CampaignMuseum&&window.THREE&&window.WoodMesh&&window.WoodFinish);
  const output=path.resolve(__dirname,'../dist/assets/museum');
  await fs.mkdir(output,{recursive:true});
  const requested=new Set(process.argv.slice(2));
  const exhibits=await page.evaluate(()=>CampaignMuseum.landmarks.map(item=>item.id));
  for(const exhibit of exhibits.filter(id=>!requested.size||requested.has(id))){
   const renders=await page.evaluate(id=>{
    const P=JointPuzzle,B=P.box;
    const model=(id)=>P.LEVELS.find(level=>level.id===id).pieces;
    const piece=(id,color,shapes,grainAxis=0)=>({id,color,shapes,grainAxis});
    const chair=[
     piece('posts','#75513c',[-1.18,1.18].flatMap(x=>[-1.04,1.04].map(z=>B(x-.12,x+.12,0,z<0?3.90:1.77,z-.13,z+.13))),1),
     piece('seat','#ba9068',[B(-1.3,1.3,1.66,1.84,-1.15,1.14),B(-1.27,1.27,1.42,1.66,.94,1.14)]),
     piece('rails','#98643f',[B(-1.22,1.22,.58,.77,.95,1.13),B(-1.22,1.22,.58,.77,-1.13,-.95)]),
     piece('side','#98643f',[-1.18,1.18].map(x=>B(x-.11,x+.11,.60,.77,-1.02,1.05)),2),
     piece('back','#946949',[B(-1.32,1.32,3.86,4.06,-1.2,-.92),B(-.34,.34,1.84,3.86,-1.09,-.96)],1)
    ];
    const definitions={
     hemudu:{whole:model('museum-hemudu-beam').filter(part=>part.id==='beam'),
      joint:model('museum-hemudu-beam'),apart:model('museum-hemudu-beam'),peek:{beam:[-.45,0,0]},split:{beam:[-1.55,0,0]}},
     dougong:{whole:model('museum-dougong'),peek:{beam:[0,.32,0]},split:{beam:[0,2.5,0],
      'bar-left':[0,1.84,0],'bar-right':[0,1.84,0],'block-left':[0,1.18,0],'block-right':[0,1.18,0],gong:[0,.66,0],dou:[0,.32,0]}},
     clamp:{whole:model('museum-clamp-apron'),peek:{top:[0,.60,0]},split:{top:[-.26,2.02,-.20],apron:[1.2,.75,.31]}},
     corner:{whole:model('museum-miter-corner'),peek:{front:[.24,0,0],side:[0,0,.25]},split:{front:[1.45,0,0],side:[0,0,1.45]}},
     chair:{whole:chair,joint:model('chair-rail-joint'),apart:model('chair-rail-joint'),split:{tenon:[1.7,0,.22]}},
     dovetail:{whole:model('dovetail'),peek:{key:[0,.55,0]},split:{slide:[4.8,0,0],key:[2.0,-1,1.9]}},
     'sliding-pin':{whole:model('museum-sliding-pin'),peek:{stop:[0,.55,0],slide:[-.79,0,0]},
      split:{stop:[0,1.28,.42],slide:[-5.16,.68,0]}},
     burr:{whole:model('burr-six'),peek:{'bar-6':[0,0,.73]},split:{}}
    };
    const width=1000,height=680;
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    renderer.setSize(width,height);
    renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const spec=definitions[id];
    const frames=['whole','joint','apart'].map(mode=>{
     const scene=new THREE.Scene();
     const camera=new THREE.OrthographicCamera(-1,1,1,-1,.05,120);
     const view=mode==='whole'?[7,5.1,10]:mode==='joint'?[8,8.8,10]:[7,10,14];
     camera.position.set(...view).multiplyScalar(1.9);
     camera.lookAt(0,.1,0);camera.updateMatrixWorld();
     const parts=mode==='whole'?spec.whole:spec[mode]||spec.whole;
     const offset=mode==='joint'?spec.peek:mode==='apart'?spec.split:null;
     const subject=new THREE.Group();
     scene.add(subject);
     for(const [index,part] of parts.entries()){
      const axis=part.grainAxis??(part.id==='key'?1:0);
      const faces=WoodMesh.surfaces(part.shapes,WoodFinish.chamfer(id==='hemudu'?'dovetail':id));
      const mesh=new THREE.Mesh(WoodMesh.geometry(THREE,faces,axis),
       WoodFinish.material(THREE,WoodFinish.piece(id,part),axis,1,true));
      mesh.castShadow=true;mesh.receiveShadow=true;
      if(offset?.[part.id])mesh.position.set(...offset[part.id]);
      if(id==='burr'&&mode==='apart'){
       mesh.geometry.center();
       if(axis===1)mesh.rotation.z=Math.PI/2;
       if(axis===2)mesh.rotation.y=Math.PI/2;
       mesh.position.set((index%3-1)*5.8,0,(Math.floor(index/3)-.5)*3.1);
       mesh.updateMatrixWorld();
       mesh.position.y=-new THREE.Box3().setFromObject(mesh).min.y;
      }
      subject.add(mesh);
     }
     subject.updateMatrixWorld(true);
     const frame=new THREE.Box3(),worldBounds=new THREE.Box3().setFromObject(subject);
     for(const mesh of subject.children){
      const positions=mesh.geometry.getAttribute('position');
      for(let i=0;i<positions.count;i++){
       const position=new THREE.Vector3().fromBufferAttribute(positions,i);
       frame.expandByPoint(position.applyMatrix4(mesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse));
      }
     }
     const center=frame.getCenter(new THREE.Vector3()),size=frame.getSize(new THREE.Vector3());
     const span=Math.max(size.x,size.y*width/height)*(mode==='joint'?1.18:1.26),heightSpan=span*height/width;
     Object.assign(camera,{left:center.x-span/2,right:center.x+span/2,bottom:center.y-heightSpan*.55,top:center.y+heightSpan*.45});
     camera.updateProjectionMatrix();
     const board=new THREE.Mesh(new THREE.PlaneGeometry(130,130),new THREE.MeshStandardMaterial({color:0xc7b08a,roughness:1}));
     board.rotation.x=-Math.PI/2;board.position.y=worldBounds.min.y-.025;board.receiveShadow=true;scene.add(board);
     const key=new THREE.DirectionalLight(0xffe7c4,1.5);
     key.position.set(-7,13,7);key.castShadow=true;
     key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.02;key.shadow.bias=-.0005;
     Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12});
     scene.add(key,new THREE.HemisphereLight(0xfff2db,0x68543e,.76));
     renderer.render(scene,camera);
     const bytes=renderer.domElement.toDataURL('image/webp',.93).split(',')[1];
     scene.traverse(item=>{item.geometry?.dispose();item.material?.dispose();});
     key.shadow.dispose();
     return [mode,bytes];
    });
    renderer.dispose();renderer.forceContextLoss();
    return frames;
   },exhibit);
   for(const [mode,bytes] of renders)await fs.writeFile(path.join(output,exhibit+'-'+mode+'.webp'),Buffer.from(bytes,'base64'));
   console.log('Rendered',exhibit);
  }
 }finally{await browser.close();}
}
renderExhibits().catch(error=>{console.error(error);process.exitCode=1;});
