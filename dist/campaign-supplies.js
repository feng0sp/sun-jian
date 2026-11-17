/* Shared physical bench supplies, built from the actual final puzzle shapes. */
(function(root){
 'use strict';
 function create(T){
  const group=new T.Group(),pieces={},heights={},resources=[],materials=[],bindings=[];
  const mat=color=>{const m=new T.MeshStandardMaterial({color,roughness:.9});m.color.convertSRGBToLinear();materials.push(m);return m;};
  const wood=mat('#6e5945'),rim=mat('#384a4c'),cloth=mat('#b4b6a0'),paper=mat('#dfd6b8');cloth.side=T.DoubleSide;
  function box(x,y,z,w,h,d,m){const g=new T.BoxGeometry(w,h,d);resources.push(g);const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;}
  box(0,.25,0,2.25,.08,.82,wood);for(const x of [-.8,.8]){const g=new T.CylinderGeometry(.15,.15,.07,18);resources.push(g);for(const z of [-.43,.43]){const wheel=new T.Mesh(g,rim);wheel.rotation.x=Math.PI/2;wheel.position.set(x,.15,z);wheel.castShadow=true;group.add(wheel);}}
  for(const z of [-.3,.3]){const handle=box(1.27,.42,z,.72,.055,.055,wood);handle.rotation.z=.3;}box(1.6,.52,0,.06,.06,.66,wood);
  const l=JointPuzzle.LEVELS.find(l=>l.id==='rain-shelter-bench');
  for(const p of l.pieces.filter(p=>!p.fixed)){
   const faces=WoodMesh.surfaces(p.shapes,.022),positions=[],normals=[],uv=[];for(const f of faces)for(let i=1;i<f.vertices.length-1;i++)for(const v of [f.vertices[0],f.vertices[i],f.vertices[i+1]]){positions.push(...v);normals.push(...f.normal);uv.push(v[0]*.3,v[1]*.3);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));resources.push(geo);
   const m=WoodFinish.material(T,p,p.grainAxis??0,2,true);materials.push(m);const o=new T.Mesh(geo,m),verts=p.shapes.flatMap(s=>s.vertices),min=[0,1,2].map(i=>Math.min(...verts.map(v=>v[i]))),max=[0,1,2].map(i=>Math.max(...verts.map(v=>v[i]))),center=min.map((v,i)=>(v+max[i])/2),scale=.4;
   heights[p.id]={min:min[1]*scale,height:(max[1]-min[1])*scale};o.name='supply:'+p.id;o.scale.setScalar(scale);const pin=p.id.endsWith('pin'),seat=p.id==='seat';o.position.set(-center[0]*scale+(pin?(p.id==='left-pin'?-.3:.3):0),(seat?.30:pin?.60:.47)-min[1]*scale,-center[2]*scale+(p.id==='front-beam'?-.16:p.id==='rear-beam'?.16:0));o.castShadow=o.receiveShadow=true;group.add(o);pieces[p.id]=o;
  }
  for(const x of [-.65,.65]){const loop=[[.293,-.40],[.49,-.40],[.80,-.22],[.80,.22],[.49,.40],[.293,.40],[.293,-.40]],v=[],idx=[];for(const [y,z]of loop)v.push(x-.028,y,z,x+.028,y,z);for(let i=0;i<loop.length-1;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();resources.push(g);const band=new T.Mesh(g,cloth);band.castShadow=true;group.add(band);bindings.push(band);}
  const page=box(-.65,.700,.16,.44,.012,.3,paper);page.rotation.y=.1;page.name='supply:sketch';
  // A readable local sketch connects the stored set to the finished object.
  if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=512;c.height=320;const a=c.getContext('2d');a.fillStyle='#dfd6b8';a.fillRect(0,0,512,320);a.strokeStyle='#536760';a.lineWidth=4;a.strokeRect(70,95,370,55);for(const x of [90,390]){a.strokeRect(x,150,25,95);a.strokeRect(x-5,180,35,12);}a.beginPath();a.moveTo(110,195);a.lineTo(400,195);a.stroke();a.font='27px Microsoft YaHei';a.fillStyle='#405650';a.fillText('雨棚长凳 · 试配料',90,55);a.font='20px Microsoft YaHei';a.fillText('横梁 × 2   座板 × 1   木销 × 2',70,290);const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;resources.push(tex);const pm=mat('#ffffff');pm.map=tex;page.material=pm;}
  function update(remaining){
   const list=remaining||Object.keys(pieces),has=id=>list.includes(id),base=.30;
   const seatTop=has('seat')?base+heights.seat.height:base;
   const beamBottom=has('seat')?seatTop+.01:base,beams=['front-beam','rear-beam'].filter(has),beamTop=beams.length?beamBottom+heights[beams[0]].height:seatTop;
   const pinBottom=(beams.length||has('seat'))?beamTop+.01:base;
   for(const [id,p]of Object.entries(pieces)){p.visible=has(id);const bottom=id==='seat'?base:id.endsWith('beam')?beamBottom:pinBottom;p.position.y=bottom-heights[id].min;}
   page.position.y=(beams.length?beamTop:seatTop)+.007;page.position.z=has('rear-beam')?.16:has('front-beam')?-.16:0;
   bindings.forEach(b=>b.visible=list.length===5);
  }
  update();
  return {group,pieces,update,dispose(){resources.forEach(r=>r.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});}};
 }
 root.CampaignSupplies={create};
})(window);
