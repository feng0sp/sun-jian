/* Original editable mesh asset. Metric seated pose; skin and clothing are authored loft surfaces. */
(function(root){
 'use strict';
 function create(T){
  const group=new T.Group(),body=new T.Group(),head=new T.Group(),geos=[],mats=[];group.add(body);body.add(head);
  const material=(color)=>{const m=new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.96});m.color.convertSRGBToLinear();mats.push(m);return m;};
  const skin=material('#cda685'),shade=material('#896652'),jacket=material('#4b626b'),lapel=material('#6c7c82'),shirt=material('#b9b5a7'),pants=material('#3d4b54'),shoe=material('#334048'),hair=material('#a4a9a1'),hairShade=material('#737f7e'),ink=material('#263a3e'),eyeWhite=material('#d5c9b0'),iris=material('#493e32');
  function mesh(geo,m,parent=body){geos.push(geo);const o=new T.Mesh(geo,m);o.castShadow=true;o.receiveShadow=false;parent.add(o);return o;}
  function loft(rings,m,parent=body,sides=18,modifier=null){const a=[],uv=[],ix=[];for(let j=0;j<rings.length;j++){const [x,y,z,rx,rz]=rings[j];for(let i=0;i<=sides;i++){const q=i/sides*Math.PI*2,v=[x+Math.sin(q)*rx,y,z+Math.cos(q)*rz];if(modifier)modifier(v,q,j);a.push(...v);uv.push(i/sides,j/(rings.length-1));}}for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const k=j*(sides+1)+i;ix.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}for(const end of [0,rings.length-1]){const center=a.length/3;a.push(rings[end][0],rings[end][1],rings[end][2]);uv.push(.5,end?1:0);for(let i=0;i<sides;i++){const k=end*(sides+1)+i;if(end)ix.push(center,k,k+1);else ix.push(center,k+1,k);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return mesh(g,m,parent);}
  function limb(points,radii,m,parent=body,sides=12){const a=[],ix=[];for(let j=0;j<points.length;j++){const p=new T.Vector3(...points[j]),before=new T.Vector3(...points[Math.max(0,j-1)]),after=new T.Vector3(...points[Math.min(points.length-1,j+1)]),axis=after.sub(before).normalize(),u=new T.Vector3(0,0,1);if(Math.abs(u.dot(axis))>.95)u.set(0,1,0);u.cross(axis).normalize();const v=axis.clone().cross(u);for(let i=0;i<=sides;i++){const q=i/sides*Math.PI*2,o=p.clone().addScaledVector(u,Math.cos(q)*radii[j]).addScaledVector(v,Math.sin(q)*radii[j]);a.push(...o.toArray());}}for(let j=0;j<points.length-1;j++)for(let i=0;i<sides;i++){const k=j*(sides+1)+i;ix.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}for(const end of [0,points.length-1]){const center=a.length/3;a.push(...points[end]);for(let i=0;i<sides;i++){const k=end*(sides+1)+i;if(end)ix.push(center,k+1,k);else ix.push(center,k,k+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setIndex(ix);g.computeVertexNormals();return mesh(g,m,parent);}
  function line(points,color=ink,parent=head,width=.003){return limb(points,points.map(()=>width),color,parent,6);}
  function patch(vertices,indices,m,parent=head){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices.flat(),3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,m,parent);}
  // Jacket silhouette: broad shoulders, shaped waist and lap, continuous fabric panels.
  loft([[0,.47,.03,.18,.09],[0,.55,0,.22,.125],[0,.72,-.035,.205,.14],[0,.9,-.025,.215,.13],[0,1.015,-.02,.25,.105],[0,1.075,-.015,.12,.085],[0,1.09,-.015,.075,.06]],jacket);
  patch([[-.075,.58,.155],[.08,.58,.155],[.09,1.045,.09],[-.08,1.045,.09]],[0,1,2,0,2,3],shirt,body);
  for(const s of [-1,1]){
   patch([[s*.08,1.075,.075],[s*.18,1.01,.095],[s*.09,.88,.135],[s*.035,1.015,.108]],[0,1,2,0,2,3],lapel,body);
   line([[s*.11,.91,.13],[s*.12,.68,.15],[s*.13,.55,.14]],shade,body,.002);
   patch([[s*.12,.79,.143],[s*.20,.79,.127],[s*.20,.67,.13],[s*.12,.67,.15]],[0,1,2,0,2,3],lapel,body);
   line([[s*.12,.79,.146],[s*.20,.79,.13]],ink,body,.002);
   // Bent trouser legs and soft shoes, shaped along anatomical center lines.
   limb([[s*.12,.51,.02],[s*.15,.48,.18],[s*.16,.43,.37],[s*.16,.31,.40],[s*.16,.12,.38],[s*.16,.09,.39]],[.105,.105,.09,.075,.055,.048],pants);
   loft([[s*.16,.015,.46,.075,.145],[s*.16,.045,.46,.085,.15],[s*.16,.10,.43,.07,.12],[s*.16,.15,.38,.045,.045]],shoe);
   line([[s*.16-.07,.04,.59],[s*.16,.035,.615],[s*.16+.07,.04,.59]],lapel,body,.004);
   limb([[s*.22,1.015,0],[s*.265,.91,.045],[s*.29,.77,.14],[s*.24,.68,.25],[s*.18,.60,.34]],[.075,.075,.063,.06,.049],jacket);
   limb([[s*.18,.60,.34],[s*.177,.58,.36],[s*.17,.565,.39]],[.047,.039,.034],lapel);
   // A palm and five tapered curved fingers with natural resting separation.
   loft([[s*.17,.575,.39,.035,.042],[s*.17,.555,.4,.04,.048],[s*.17,.53,.41,.034,.04]],skin);
   for(let i=0;i<4;i++){const x=s*.17+(i-1.5)*.016,z=.414+(.018-Math.abs(i-1.5)*.008);limb([[x,.54,z],[x,.515,z+.027],[x,.495,z+.04]],[.009,.008,.0045],skin);}
   limb([[s*.17-s*.034,.56,.39],[s*.17-s*.055,.536,.41],[s*.17-s*.06,.515,.425]],[.013,.01,.005],skin);
  }
  loft([[0,1.025,0,.065,.055],[0,1.13,0,.068,.055],[0,1.17,.005,.055,.05]],skin,head);
  // Sculpted head rings: jaw/chin, cheekbones, brow and cranium, with flatter anime facial planes.
  loft([[0,1.13,.008,.025,.035],[0,1.16,.014,.065,.066],[0,1.205,.005,.082,.077],[0,1.27,0,.098,.083],[0,1.33,-.006,.097,.081],[0,1.39,-.01,.088,.078],[0,1.44,-.018,.062,.06],[0,1.463,-.02,.001,.001]],skin,head,28,(v,q)=>{if(Math.cos(q)>.55)v[2]=Math.min(v[2],.073+(v[1]>1.32?.001:.008));});
  // Nose bridge and its cheek transitions meet the facial surface, rather than a separate round nose.
  patch([[-.017,1.34,.075],[.017,1.34,.075],[-.022,1.265,.08],[.022,1.265,.08],[0,1.264,.128],[0,1.325,.09],[0,1.25,.09]],[0,5,2,5,4,2,5,1,4,1,3,4,2,4,6,4,3,6],skin);
  for(const s of [-1,1]){
   const x=s*.046;
   patch([[x-.025,1.314,.08],[x,1.324,.087],[x+.025,1.314,.079],[x,1.302,.085]],[0,1,2,0,2,3],eyeWhite);
   const eye=new T.CircleGeometry(.011,14);const o=mesh(eye,iris,head);o.position.set(x,1.313,.089);
   line([[x-.026,1.314,.082],[x-.005,1.325,.088],[x+.025,1.316,.082]],ink,head,.003);
   line([[x-.029,1.345,.08],[x-.004,1.351,.086],[x+.024,1.343,.081]],hairShade,head,.005);
   line([[s*.082,1.302,.067],[s*.093,1.291,.052]],shade,head,.0015);
   line([[s*.021,1.257,.092],[s*.031,1.233,.085],[s*.047,1.222,.071]],shade,head,.0014);
   loft([[s*.101,1.255,-.005,.012,.024],[s*.108,1.285,-.008,.016,.027],[s*.10,1.32,-.01,.009,.02]],skin,head,10);
  }
  line([[-.033,1.217,.077],[-.013,1.222,.084],[.01,1.221,.085],[.032,1.225,.076]],shade,head,.0025);
  line([[-.029,1.362,.075],[0,1.367,.078],[.029,1.363,.075]],shade,head,.001);
  loft([[0,1.32,-.034,.087,.065],[0,1.392,-.022,.098,.087],[0,1.448,-.02,.071,.07],[0,1.476,-.021,.001,.001]],hairShade,head,24,(v,q,j)=>{if(j===0&&Math.cos(q)>0)v[1]+=.067*Math.cos(q);});
  // Crisp clumps swept back and to one side, giving the gray hair an intentional silhouette.
  for(let i=0;i<14;i++){const a=(i/14)*Math.PI*2,x=Math.sin(a)*.083,z=-.02+Math.cos(a)*.066,y=1.404+(i%3)*.01;patch([[x-.02,y,z],[x+.02,y,z],[x+.009,y+.023,z+.012],[x-.024,y+.042,z-.025],[x,y+.005,z-.018]],[0,1,2,0,2,3,1,4,2,4,3,2,0,3,4,0,4,1],i%3?hair:hairShade);}
  // Seams, shirt collar, jacket buttons and trouser folds anchor the simple silhouette.
  line([[-.055,1.04,.105],[0,1.01,.117],[.055,1.04,.105]],shade,body,.002);
  for(const y of [.83,.72,.61]){const b=mesh(new T.SphereGeometry(.008,8,6),ink,body);b.position.set(.058,y,.154);}
  for(const sign of [-1,1]){
   line([[sign*.11,.445,.43],[sign*.16,.43,.46],[sign*.205,.445,.425]],lapel,body,.002);
   line([[sign*.27,.79,.19],[sign*.245,.77,.205],[sign*.222,.75,.22]],lapel,body,.002);
   line([[sign*.07,1.285,.072],[sign*.063,1.274,.084],[sign*.053,1.269,.085]],shade,head,.0012);
   line([[sign*.025,1.233,.087],[sign*.041,1.238,.077]],shade,head,.0011);
  }
  const baseRot=head.rotation.y;
  return {group,update(time,talking){body.scale.y=1+Math.sin(time*1.45)*.002;head.rotation.y=baseRot+(talking?Math.sin(time*.7)*.045:.015);head.rotation.x=talking?Math.sin(time*1.4)*.012:0;},dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
 }
 root.ZhouCharacter={create};
})(window);
