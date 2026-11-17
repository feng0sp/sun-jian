const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/',out=process.env.TEST_OUTPUT||'output/campaign-0113';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:720}});await p.goto(base+'?practice=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.AssemblyDrag);if(await p.locator('#skip-tutorial').isVisible())await p.locator('#skip-tutorial').click();const results=[];
 for(const camera of [[8,7,10],[-10,7,8]])for(const direction of ['xp','xn','yp','yn','zp','zn']){
  const path=await p.evaluate(({camera:position,direction})=>{
   window.assemblyProbe?.controls.cancel();document.getElementById('assembly-probe')?.remove();
   const T=THREE,canvas=document.createElement('canvas');canvas.id='assembly-probe';canvas.style.cssText='position:fixed;left:100px;top:100px;width:720px;height:480px;z-index:99999;background:#eee';document.body.append(canvas);
   const camera=new T.PerspectiveCamera(45,1.5,.1,100);camera.position.fromArray(position);camera.lookAt(0,0,0);camera.updateMatrixWorld();const mesh=new T.Mesh(new T.BoxGeometry(.5,.5,.5),new T.MeshBasicMaterial());mesh.updateMatrixWorld();const ray=new T.Raycaster(),vector=new T.Vector3(...JointPuzzle.DIRECTIONS.find(d=>d.id===direction).vector),probe={distance:0,applies:0,camera,mesh,vector,canvas};
   const screen=v=>{const r=canvas.getBoundingClientRect(),q=v.clone().project(camera);return{x:r.x+(q.x+1)*r.width/2,y:r.y+(1-q.y)*r.height/2};};
   const pick=(x,y)=>{const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-r.x)/r.width*2-1,1-(y-r.y)/r.height*2),camera);mesh.updateMatrixWorld();const hit=ray.intersectObject(mesh)[0];return hit&&{id:'sample',point:hit.point};};
   const start=screen(new T.Vector3()),hit=pick(start.x,start.y);probe.grab=hit.point.clone();
   probe.controls=AssemblyDrag.install({canvas,camera,T,disabled:()=>false,pick,hand:()=>({id:'sample',direction}),start(){},finish(){},range:(id,d,requested)=>({distance:requested,blocked:false,canSeat:false}),apply:(id,d,status)=>{probe.distance=status.distance;probe.applies++;mesh.position.copy(vector).multiplyScalar(status.distance);},restore:()=>{mesh.position.set(0,0,0);},ambiguous(){},blocked(){},commit(){throw Error('Probe must not commit');}});window.assemblyProbe=probe;
   return{start,end:screen(hit.point.clone().addScaledVector(vector,1.2))};
  },{camera,direction});
  await p.mouse.move(path.start.x,path.start.y);await p.mouse.down();await p.mouse.move(path.end.x,path.end.y,{steps:16});const got=await p.evaluate(()=>{const a=assemblyProbe,r=a.canvas.getBoundingClientRect(),q=a.grab.clone().add(a.mesh.position).project(a.camera);return{distance:a.distance,applies:a.applies,x:r.x+(q.x+1)*r.width/2,y:r.y+(1-q.y)*r.height/2};});await p.mouse.up();assert(got.applies>0,direction+' starts a drag');assert(Math.abs(got.distance-1.2)<.015,direction+' follows the requested world distance');const error=Math.hypot(got.x-path.end.x,got.y-path.end.y);assert(error<1,direction+' grip stays with pointer');results.push({camera,direction,distance:got.distance,pixelError:error});
 }
 fs.writeFileSync(out+'/assembly-projection-verification.json',JSON.stringify({actualPointerEvents:true,cases:results},null,2));console.log('PASS: six assembly directions at two camera angles, world displacement error < 0.015 and grip error < 1 px.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
