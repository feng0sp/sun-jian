/* 榫间 — convex geometry and continuous swept collision. No rendering dependency. */
(function (root) {
  'use strict';
  const EPS = 1e-6;
  const dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const sub = (a, b) => a.map((v, i) => v-b[i]);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const normalize = a => { const n = Math.hypot(...a); return n > EPS ? a.map(v=>v/n) : null; };
  const AXES = [[1,0,0],[0,1,0],[0,0,1]];
  function uniqueAxes(list) {
    const result=[];
    for (const candidate of list) {
      const a=normalize(candidate);
      if (a && !result.some(b=>Math.abs(dot(a,b))>1-EPS)) result.push(a);
    }
    return result;
  }
  function shape(vertices, faces, edges) {
    return {vertices, faces, normals:uniqueAxes(faces.map(f=>cross(sub(vertices[f[1]],vertices[f[0]]),sub(vertices[f[2]],vertices[f[0]])))), edges:uniqueAxes(edges)};
  }
  function box(x0,x1,y0,y1,z0,z1) {
    const v=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    return shape(v,[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]],AXES);
  }
  // Convex polygon in the yz-plane, extruded along x. Polygon is counterclockwise.
  function prismX(x0,x1,polygon) {
    const n=polygon.length, v=[...polygon.map(p=>[x0,p[0],p[1]]),...polygon.map(p=>[x1,p[0],p[1]])];
    const faces=[Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i)];
    const edges=[[1,0,0]];
    for(let i=0;i<n;i++){const j=(i+1)%n;faces.push([i,j,n+j,n+i]);edges.push([0,polygon[j][0]-polygon[i][0],polygon[j][1]-polygon[i][1]]);}
    return shape(v,faces,edges);
  }
  // Partition a rectangular solid around a rectangular aperture, retaining exact surfaces.
  function subtractBox(outer,hole) {
    const bounds=outer.map((v,i)=>i%2===0?Math.max(v,hole[i]):Math.min(v,hole[i]));
    if(bounds.some((v,i)=>i%2===0 && v>=bounds[i+1]-EPS))return [box(...outer)];
    const [a,b,c,d,e,f]=outer, [u,v,w,t,s,r]=bounds;
    const chunks=[[a,u,c,d,e,f],[v,b,c,d,e,f],[u,v,c,w,e,f],[u,v,t,d,e,f],[u,v,w,t,e,s],[u,v,w,t,r,f]];
    return chunks.filter(k=>k[1]-k[0]>EPS&&k[3]-k[2]>EPS&&k[5]-k[4]>EPS).map(k=>box(...k));
  }
  function pairAxes(a,b) {return uniqueAxes([...a.normals,...b.normals,...a.edges.flatMap(e=>b.edges.map(f=>cross(e,f)))]);}
  function interval(s,axis) {const p=s.vertices.map(v=>dot(v,axis));return [Math.min(...p),Math.max(...p)];}
  function overlaps(a,b) {
    return pairAxes(a,b).every(axis=>{const x=interval(a,axis),y=interval(b,axis);return Math.min(x[1],y[1])-Math.max(x[0],y[0])>EPS;});
  }
  // True continuous swept collision: no tunneling through thin keys or dovetail sides.
  function sweep(a,b,direction,travel=12) {
    let enter=0, exit=travel;
    for(const axis of pairAxes(a,b)) {
      const p=interval(a,axis),q=interval(b,axis),speed=dot(direction,axis);
      if(Math.abs(speed)<EPS){if(p[1]<=q[0]+EPS||q[1]<=p[0]+EPS)return null;continue;}
      let lo=(q[0]-p[1]+EPS)/speed,hi=(q[1]-p[0]-EPS)/speed;
      if(lo>hi)[lo,hi]=[hi,lo];
      enter=Math.max(enter,lo);exit=Math.min(exit,hi);
      if(enter>=exit-EPS)return null;
    }
    return exit>EPS&&enter<travel-EPS?Math.max(0,enter):null;
  }
  const DIRECTIONS=[
    {id:'yp',vector:[0,1,0],label:'向上',axis:'Y+',key:'w'},
    {id:'yn',vector:[0,-1,0],label:'向下',axis:'Y−',key:'s'},
    {id:'xn',vector:[-1,0,0],label:'向左',axis:'X−',key:'a'},
    {id:'xp',vector:[1,0,0],label:'向右',axis:'X+',key:'d'},
    {id:'zp',vector:[0,0,1],label:'向前',axis:'Z+',key:'q'},
    {id:'zn',vector:[0,0,-1],label:'向后',axis:'Z−',key:'e'}
  ];
  const part=(id,name,color,shapes,extra={})=>({id,name,color,shapes,...extra});
  function straight(pinned=false) {
    const outer=[-1.5,1.5,-1.5,.25,-1.7,1.7];
    const hole=[-.51,.51,-1.5,.25,-.51,.51];
    let housing=subtractBox(outer,hole);
    housing.push(box(-1.5,1.5,-1.68,-1.5,-1.7,1.7));
    const tenon=box(-.48,.48,-1.47,1.95,-.48,.48);
    let stem=[tenon,box(-.73,.73,.25,.59,-.73,.73)];
    const pieces=[];
    if(pinned){
      const tunnel=[-.2,.2,-.65,-.25,-3,3];
      housing=housing.flatMap(s=>{
        const xs=s.vertices.map(v=>v[0]),ys=s.vertices.map(v=>v[1]),zs=s.vertices.map(v=>v[2]);
        return subtractBox([Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys),Math.min(...zs),Math.max(...zs)],tunnel);
      });
      stem=[...subtractBox([-.48,.48,-1.47,1.95,-.48,.48],tunnel),box(-.73,.73,.25,.59,-.73,.73)];
      pieces.push(part('pin','穿销', '#c68a51',[box(-.18,.18,-.63,-.27,-2.4,2.1),box(-.34,.34,-.79,-.11,2.1,2.3)],{symbol:'乙',description:'贯穿榫头与卯座的木销。销帽较宽，抽出时也要留意方向。'}));
    }
    return [part('base','卯座','#69503d',housing,{fixed:true,description:'固定的卯座，围合出容纳榫头的空间。'}),part('tenon','榫头','#c39869',stem,{symbol:'甲',description:pinned?'榫头被穿销锁住。先观察两者如何相互约束。':'凸出的榫头嵌入卯眼，榫肩贴合卯口。'}),...pieces];
  }
  function dovetail(keyed=true) {
    const housing=[
      box(-2.5,2.5,-1.05,-.8,-1.5,1.5),
      prismX(-2.5,2.5,[[-.8,-1.5],[.5,-1.5],[.5,-.44],[-.8,-.87]]),
      prismX(-2.5,2.5,[[-.8,.87],[.5,.44],[.5,1.5],[-.8,1.5]]),
      box(-2.5,-2.03,-.8,.85,-1.5,1.5)
    ];
    const pieces=[part('rail','燕尾卯座','#69503d',housing,{fixed:true}),part('slide','燕尾榫','#bd9464',[
      prismX(-2,1.6,[[-.78,-.84],[.51,-.41],[.51,.41],[-.78,.84]]),box(-2,1.6,.51,.74,-1.15,1.15)
    ],{symbol:'甲',description:'下宽上窄的榫形限制了上拔。观察卯槽向哪一侧敞开。'})];
    if(keyed){
      housing.push(box(1.5,2.5,.5,1.31,-1.5,-1.26),box(1.5,2.5,.5,1.31,1.26,1.5));
      housing.push(...subtractBox([1.5,2.5,1,1.31,-1.5,1.5],[1.63,2.03,1,1.31,-.22,.22]));
      pieces.push(part('key','止退木钥','#c88754',[
        box(1.65,2.01,-.79,1.34,-.2,.2),box(1.51,2.15,1.34,1.53,-.36,.36)
      ],{symbol:'乙',description:'木钥挡在滑动出口处。先把钥与卯座的关系看清楚。'}));
    }
    return pieces;
  }
  function halfLap() {
    return [
      part('lower','下搭木','#9e784f',subtractBox([-2.7,2.7,-.5,.5,-.46,.46],[-.48,.48,0,.5,-.46,.46]),{symbol:'甲',description:'中央切去了上半部，另一根木条嵌在它上面。看看上下两层的关系。'}),
      part('upper','上搭木','#c3996a',subtractBox([-.46,.46,-.5,.5,-2.7,2.7],[-.46,.46,-.5,0,-.48,.48]),{symbol:'乙',description:'中央切去了下半部。相互搭接的两根木条，有各自的退出方向。'})
    ];
  }
  function doublePin() {
    const pieces=straight(true),base=pieces.find(p=>p.id==='base'),pin=pieces.find(p=>p.id==='pin');
    pin.name='主穿销';pin.description='主穿销锁住榫头，又被一根小销限制。先观察突出卯座的那一端。';
    pin.shapes=[...subtractBox([-.18,.18,-.63,-.27,-2.4,2.1],[-3,3,-.55,-.35,1.81,2.01]),box(-.34,.34,-.79,-.11,2.1,2.3)];
    for(const [a,b]of [[-.9,-.5],[.5,.9]])base.shapes.push(...subtractBox([a,b,-.82,-.08,1.73,2.09],[-3,3,-.55,-.35,1.81,2.01]));
    pieces.push(part('crosspin','横向小销','#a46c43',[box(-1.22,1.5,-.53,-.37,1.83,1.99),box(1.5,1.68,-.65,-.25,1.73,2.09)],{symbol:'丙',description:'这根小销从侧面穿过主穿销。较宽的销帽告诉你从哪一端抽出。'}));
    return pieces;
  }
  function woodenBox() {
    const base=[box(-2.47,2.47,-1.62,-1.4,-2.09,2.09),...subtractBox([-2.47,2.47,-1.4,-.99,-2.09,2.09],[-2.35,2.35,-1.4,-.85,-1.95,1.95]),box(-1.93,1.93,-1.4,-.85,-1.53,1.53)];
    return [
      part('bottom','匣底','#76563b',base,{fixed:true}),
      part('lid','滑动匣盖','#bc9569',[prismX(-2,2.3,[[1.51,-1.90],[1.85,-1.615],[1.85,1.615],[1.51,1.90]])],{symbol:'甲',description:'匣盖沿侧板上的燕尾槽滑动。一端有止口，另一端留着出口。'}),
      part('front','前侧板','#b88a5b',[box(-1.93,1.93,-1.39,1.5,1.55,1.91),prismX(-2.31,2.31,[[1.5,1.93],[1.9,1.60],[1.9,2.01],[1.5,2.01]])],{symbol:'乙',description:'上端的轨道托住匣盖，下端的榫舌嵌入匣底。'}),
      part('back','后侧板','#a58057',[box(-1.93,1.93,-1.39,1.5,-1.91,-1.55),prismX(-2.31,2.31,[[1.5,-2.01],[1.9,-2.01],[1.9,-1.60],[1.5,-1.93]])],{symbol:'丙',description:'这块侧板与前侧板相对，它们共同形成滑盖的轨道。'}),
      part('left','止口端板','#c19a6c',[box(-2.31,-1.95,-1.39,1.5,-1.91,1.91),box(-2.31,-2.02,1.5,1.95,-1.53,1.53)],{symbol:'丁',description:'端板上的止口挡住匣盖的一端。侧板的上沿也限制了端板的移动。'}),
      part('right','出口端板','#c6a378',[box(1.95,2.31,-1.39,1.5,-1.91,1.91)],{symbol:'戊',description:'匣盖从这块端板上方滑出。注意侧板轨道与端板之间的关系。'})
    ];
  }
  // Original notch layouts, designed on a unit grid and checked for connected bars.
  // Render geometry and collision geometry consume the same solids.
  const BURR_CELLS = {"3":[[[-3,-2,-1],[-3,-2,0],[-3,-1,-1],[-3,-1,0],[-2,-2,-1],[-2,-2,0],[-2,-1,0],[-1,-2,-1],[-1,-2,0],[-1,-1,-1],[0,-2,-1],[0,-2,0],[0,-1,-1],[0,-1,0],[1,-2,-1],[1,-2,0],[1,-1,-1],[1,-1,0],[2,-2,-1],[2,-2,0],[2,-1,-1],[2,-1,0]],[[-1,-3,-2],[-1,-3,-1],[-1,-2,-2],[-1,-1,-2],[-1,0,-1],[-1,1,-2],[-1,1,-1],[-1,2,-2],[-1,2,-1],[0,-3,-2],[0,-3,-1],[0,-2,-2],[0,-1,-2],[0,0,-2],[0,0,-1],[0,1,-2],[0,1,-1],[0,2,-2],[0,2,-1]],[[-2,-1,-1],[-1,-1,0],[-1,0,-2],[-2,-1,-3],[-2,-1,-2],[-2,-1,1],[-2,-1,2],[-2,0,-3],[-2,0,-2],[-2,0,-1],[-2,0,0],[-2,0,1],[-2,0,2],[-1,-1,-3],[-1,-1,1],[-1,-1,2],[-1,0,-3],[-1,0,0],[-1,0,1],[-1,0,2]]],"6":[[[-3,-2,-1],[-3,-2,0],[-3,-1,-1],[-3,-1,0],[-2,-2,-1],[-2,-2,0],[-2,-1,-1],[-1,-2,-1],[-1,-2,0],[-1,-1,-1],[0,-2,-1],[0,-2,0],[1,-2,-1],[1,-2,0],[2,-2,-1],[2,-2,0],[2,-1,-1],[2,-1,0]],[[-3,0,-1],[-3,0,0],[-3,1,-1],[-3,1,0],[-2,1,-1],[-2,1,0],[-1,0,0],[-1,1,0],[0,1,0],[1,1,-1],[1,1,0],[2,0,-1],[2,0,0],[2,1,-1],[2,1,0]],[[-1,1,-1],[0,1,-1],[-1,-3,-2],[-1,-3,-1],[-1,-2,-2],[-1,-1,-2],[-1,0,-2],[-1,1,-2],[-1,2,-2],[-1,2,-1],[0,-3,-2],[0,-3,-1],[0,-2,-2],[0,1,-2],[0,2,-2],[0,2,-1]],[[-1,-3,0],[-1,-3,1],[-1,-2,1],[-1,-1,1],[-1,0,1],[-1,1,1],[-1,2,0],[-1,2,1],[0,-3,0],[0,-3,1],[0,-2,1],[0,1,1],[0,2,0],[0,2,1]],[[-2,-1,0],[-1,-1,0],[-2,0,-1],[-2,0,0],[-1,0,-1],[-2,-1,-3],[-2,-1,-2],[-2,-1,1],[-2,-1,2],[-2,0,-3],[-2,0,-2],[-2,0,1],[-2,0,2],[-1,-1,-3],[-1,-1,2],[-1,0,-3],[-1,0,2]],[[0,-1,-1],[0,-1,0],[1,-1,-1],[1,-1,0],[0,0,-1],[0,0,0],[1,0,-1],[1,0,0],[0,-1,-2],[0,0,-2],[0,-1,1],[0,0,1],[0,-1,-3],[0,-1,2],[0,0,-3],[0,0,2],[1,-1,-3],[1,-1,-2],[1,-1,1],[1,-1,2],[1,0,-3],[1,0,-2],[1,0,1],[1,0,2]]]};
  function voxelBars(count) {
    const colors=['#906342','#bca077','#785438','#ceb18a','#9d7a55','#b98e60'];
    const names=count===3?['横搭木','立锁木','纵抱木']:['下横木','上横木','后立木','前立木','左纵木','右锁木'];
    return BURR_CELLS[count].map((cells,index)=>{
      const remaining=new Set(cells.map(v=>v.join(','))),solids=[];
      // Greedy cuboids keep the exact notches while reducing SAT and surface work.
      for(const [x,y,z] of cells){
        if(!remaining.has([x,y,z].join(',')))continue;
        let dx=1,dy=1,dz=1;
        while(remaining.has([x+dx,y,z].join(',')))dx++;
        while(Array.from({length:dx},(_,i)=>remaining.has([x+i,y+dy,z].join(','))).every(Boolean))dy++;
        while(Array.from({length:dx*dy},(_,i)=>remaining.has([x+i%dx,y+Math.floor(i/dx),z+dz].join(','))).every(Boolean))dz++;
        for(let a=0;a<dx;a++)for(let b=0;b<dy;b++)for(let c=0;c<dz;c++)remaining.delete([x+a,y+b,z+c].join(','));
        const scale=.76;solids.push(box(x*scale,(x+dx)*scale,y*scale,(y+dy)*scale,z*scale,(z+dz)*scale));
      }
      return part('bar-'+(index+1),names[index],colors[index],solids,{symbol:'甲乙丙丁戊己'[index],grainAxis:count===3?index:Math.floor(index/2),description:'沿木纹观察这根木件的开槽与相邻构件。退出方向由槽口决定，也可能与木纹方向不同。'});
    });
  }
  function lockedLap(double=false){
    const lower=subtractBox([-2.6,2.6,-.5,.5,-.6,.6],[-.6,.6,0,.5,-.6,.6]);
    let upper=subtractBox([-.58,.58,-.5,.5,-2,2],[-.58,.58,-.5,0,-.62,.62]);
    const base=[box(-2.8,2.8,-.88,-.52,-2.35,2.35)];
    for(const x of [-1.65,1.35]){
      base.push(box(x,x+.3,-.52,.52,-.94,-.63),box(x,x+.3,-.52,.52,.63,.94),box(x,x+.3,.52,.76,-.94,.94));
    }
    let mounts=[box(-.8,.8,-.52,.67,-2.34,-2.05),box(-.8,.8,-.52,.67,2.05,2.34)];
    const centers=double?[-.3,.3]:[0],keys=[];
    const cut=(solids,hole)=>solids.flatMap(s=>subtractBox([0,1,2].flatMap(a=>[Math.min(...s.vertices.map(v=>v[a])),Math.max(...s.vertices.map(v=>v[a]))]),hole));
    centers.forEach((x,i)=>{
      const hole=[x-.13,x+.13,.12,.4,-3,3];upper=cut(upper,hole);mounts=cut(mounts,hole);
      const positive=i===0,head=positive?[2.48,2.68]:[-2.68,-2.48];
      keys.push(part(double?'key-'+(i+1):'pin',double?(i===0?'前木钥':'后木钥'):'横销',i===0?'#b78b58':'#91704c',[
        box(x-.11,x+.11,.14,.38,-2.48,2.48),box(x-.23,x+.23,.04,.48,...head)
      ],{symbol:'丙丁'[i],grainAxis:2,labelAnchor:[x,.32,positive?2.78:-2.78],description:'这根木钥贯穿承座与搭接木。观察销帽和接触处，试着轻轻拖动。'}));
    });
    return [part('base','承座','#69503d',[...base,...mounts],{fixed:true}),part('lower','下搭木','#a98054',lower,{symbol:'甲',grainAxis:0,description:'下搭木嵌在承座的限位环内，中央的槽口与另一件木交叠。'}),part('upper','上搭木','#cfb087',upper,{symbol:'乙',grainAxis:2,labelAnchor:[0,.58,1.05],description:'上搭木与下搭木各让出半厚。观察穿过它的木钥。'}),...keys];
  }
  const LEVELS=[
    {id:'straight',title:'初识 · 直榫',subtitle:'从一条轴线，理解一榫一卯。',chapter:'01',difficulty:'入门',skill:'观察方向',family:'直榫',pieces:straight(false),goal:'抽出榫头，保留卯座。',hints:['卯眼四周围合，只有一侧留出了开口。','榫肩贴在卯口上方。沿榫头的长轴寻找出口。'],insight:'榫是凸出的部分，卯是容纳它的孔或槽。侧壁限制横向移动，榫肩限制继续压入，沿开口方向才能抽出。',ideal:1},
    {id:'lap',title:'交叠 · 半榫',subtitle:'各退一步，恰好合为一体。',chapter:'02',difficulty:'入门',skill:'理解搭接',family:'十字半搭接',pieces:halfLap(),goal:'分开两根互相搭接的木条。',hints:['两根木条各让出了一半厚度，重叠处才保持平整。','先看哪根木条在重叠处位于上方。上下退出都值得观察。'],insight:'半搭接把两根木条各切去一半厚度，使重叠处保持原来的总厚度。上搭木可向上退出，下搭木可向下退出；结构允许不止一种拆解顺序。',ideal:2},
    {id:'pinned',title:'解锁 · 穿销',subtitle:'一个小小的销，改变整个结构。',chapter:'03',difficulty:'进阶',skill:'判断先后',family:'穿销直榫',pieces:straight(true),goal:'先解除穿销，再抽出榫头。',hints:['榫头想要向上移动，谁穿过了它？','销帽比销身更宽。沿销帽所在的一侧退出。'],insight:'穿销同时贯穿榫头与卯座，把原本可抽出的榫头锁住。解除销的约束，结构才重新获得移动自由。',ideal:2},
    {id:'dovetail',title:'循轨 · 燕尾',subtitle:'宽与窄之间，藏着另一种答案。',chapter:'04',difficulty:'进阶',skill:'识别形状',family:'带木钥滑动燕尾',pieces:dovetail(true),goal:'移开止退木钥，沿卯槽滑出燕尾榫。',hints:['出口处有一把木钥。先看它能从哪里退出。','燕尾下宽上窄，不能直接上拔；卯槽一端封闭，一端敞开。'],insight:'燕尾的斜面让榫头无法直接上拔，却允许沿槽轴滑动。这一关增加了止退木钥，把形状约束与拆解顺序组合起来。',ideal:2},
    {id:'double-pin',title:'套锁 · 双销',subtitle:'先解最小的锁，再解最大的结。',chapter:'05',difficulty:'挑战',skill:'追踪约束',family:'双销组合结构',pieces:doublePin(),goal:'依次解除两根木销，再抽出榫头。',hints:['主穿销的末端又被谁穿过了？','最小的销沿横向穿过主穿销。先留意它的销帽。'],insight:'主穿销限制榫头，横向小销又限制主穿销。三块木件构成一条约束链：小销先退出，主销才自由，最后才能抽出榫头。',ideal:3},
    {id:'wooden-box',title:'匣间 · 合木',subtitle:'从一个接点，走向一件木器。',chapter:'06',difficulty:'综合',skill:'整体推理',family:'无钉滑盖木匣',pieces:woodenBox(),goal:'拆开匣盖与四块板，保留匣底。',hints:['先找到匣盖的滑动出口。其他板件仍被它和轨道约束。','移开匣盖后，先抬起形成轨道的前后侧板，再观察两块端板。'],insight:'这一关把方向、形状与先后顺序放进一件木匣。滑盖先退出，带轨道的侧板再抬起，最后移开端板。局部的榫卯关系共同决定整体的拆装顺序。',ideal:5}
  ];
  for(const l of LEVELS){
    const scale=l.id==='wooden-box'?[1,.82,1]:l.id==='dovetail'?[1,.92,1]:[1,1,1];
    for(const p of l.pieces)p.shapes=p.shapes.map(s=>shape(s.vertices.map(v=>v.map((n,i)=>n*scale[i])),s.faces,s.edges.map(e=>e.map((n,i)=>n*scale[i]))));
  }
  LEVELS.push(
    {id:'burr-three',title:'三向 · 初锁',subtitle:'三根木相互让位，合成一个结。',chapter:'07',difficulty:'进阶',skill:'观察互锁',family:'三件互锁 · 入门式',pieces:voxelBars(3),goal:'找到第一处出口，逐件拆开三向互锁。',hints:['三根木沿三个轴向交汇，藏在内部的槽口决定了谁先退出。','试着观察立锁木的侧面。退出方向不一定沿着木纹。'],insight:'三件互锁把不同方向的开槽组合在一起。立锁木先从侧面退出，余下两件便可分开。本关依据三件互锁形式设计槽口，用逐件直线拆解帮助理解空间约束。',ideal:3},
    {id:'burr-six',title:'六合 · 鲁班',subtitle:'六木相抱，一隙启合。',chapter:'08',difficulty:'挑战',skill:'解开锁钥',family:'六件鲁班锁 · 基础式',pieces:voxelBars(6),goal:'找出锁定木，依次拆开六根木件。',hints:['六根木分成三对，沿三个方向交错。先找槽口最少、能沿自身长轴退出的一根。','右锁木贯穿中央。试着沿前后方向移动它，再观察立木的侧向空间。'],insight:'传统鲁班锁常以六根木条形成互锁。关键木退出后，槽口逐步释放其余木件。本关采用自行设计、可逐件直线拆解的基础槽型；完成后可切换“合回”，倒过来体会锁合过程。',ideal:6}
  );
  const EXPERIMENT={id:'shift-key',title:'借位 · 锁钥',subtitle:'先让出一格，再解开彼此。',chapter:'EX',difficulty:'实验',skill:'局部移动',family:'借位组合结构',step:1,pieces:[
    part('guide','嵌轨卯座','#69503d',[
      box(-2.5,2,-.65,-.31,-1,1),box(-2.5,2,-.3,.31,-1,-.46),box(-2.5,2,-.3,.31,.46,1),box(-2.5,2,.31,.55,-1,-.3),box(-2.5,2,.31,.55,.3,1),box(-2.5,-2.01,-.3,.6,-1,1),
      box(1.21,1.61,.31,1.05,-.72,-.60),...subtractBox([1.21,1.61,.65,1.05,-.72,.6],[1.22,1.52,.65,1.05,-.22,.22])
    ],{fixed:true}),
    part('slider','带帽滑木','#bd9464',[
      box(-2,1.2,-.3,.30,-.44,.44),box(-2,1.2,.30,.6,-.28,.28),box(-1.8,-1.5,.56,.6,.28,1),box(-1.8,-1.5,.6,2.4,.8,1),box(-1.8,1.8,2.4,2.65,-.3,1)
    ],{symbol:'甲',description:'嵌轨限制上拔，锁钥挡住出口；上方的木帽又限制锁钥完全退出。'}),
    part('lift-key','升降木钥','#c88754',[box(1.24,1.49,-.25,1.07,-.2,.2),box(1.12,1.62,1.07,1.30,-.32,.32)],{symbol:'乙',description:'木帽限制它完全上拔，但仍留出一格可移动的空间。先尝试“移动一格”。'})
  ],goal:'先抬钥一格，滑出甲木，最后取出木钥。',hints:['两件木相互限制，但锁钥上方仍有一段空隙。','切换到“移动一格”，把升降木钥向上抬起；随后再完整抽出带帽滑木。'],insight:'有些互锁结构需要先借出一点空间。锁钥上抬一格后让开出口，滑木才能退出；滑木的木帽移开后，锁钥才可以完全取出。这一关演示局部移动如何改变后续的拆解路径。',ideal:3};
  LEVELS.push(
    {id:'shoulder-lap',title:'锁肩 · 搭接',subtitle:'一个接点，藏着两种约束。',difficulty:'进阶',skill:'连接两种关系',family:'锁肩搭接 · 组合练习',pieces:lockedLap(),ideal:3,insight:'横销连接上搭木与承座；承座又约束下搭木。退出横销、抬起上搭木后，下搭木便能从承座中侧向滑出。两种榫卯关系共同决定拆解顺序。'},
    {id:'double-key-frame',title:'双扣 · 梁架',subtitle:'两道约束，共同守住一个接点。',difficulty:'进阶',skill:'辨认多个阻挡',family:'双扣梁架 · 组合练习',pieces:lockedLap(true),ideal:4,insight:'两枚木钥都限制上搭木。它们可以任意顺序退出，但只移开一枚还不够。两道约束都解除后，才能抬起上搭木，再侧向退出下搭木。'}
  );
  const TUTORIALS=LEVELS.filter(l=>['straight','lap'].includes(l.id));
  const MAIN_LEVELS=['pinned','dovetail','shoulder-lap','burr-three','double-pin','double-key-frame','wooden-box','burr-six'].map(id=>LEVELS.find(l=>l.id===id));
  const observations={straight:'观察凸出的榫头与卯口，按住木件试着拖动。',lap:'观察交叠处的上下关系，试探哪件木有活动空间。',pinned:'观察穿过木件的小销，以及它和卯座的接触。',dovetail:'观察槽口的宽窄变化，想一想哪些接触面限制了移动。','shoulder-lap':'观察搭接处与承座：同一件木可能受到两种约束。','burr-three':'观察三根木如何交错；木纹方向与退出方向不一定相同。','double-pin':'观察两根销相交的位置，辨认它们如何限制彼此。','double-key-frame':'观察两枚木钥与上梁的接触，分清独立的约束。','wooden-box':'观察匣盖、轨道和侧板，寻找外部接点。','burr-six':'六根木分成三对。先辨认同向的一对，再观察中央交错处。'};
  for(const l of LEVELS){l.category=TUTORIALS.includes(l)?'tutorial':'main';l.chapter=l.category==='tutorial'?'T'+(TUTORIALS.indexOf(l)+1):String(MAIN_LEVELS.indexOf(l)+1).padStart(2,'0');l.observation=observations[l.id];l.goal=l.observation;l.hintFocus=l.pieces.filter(p=>!p.fixed).map(p=>p.id);}
  EXPERIMENT.category='experiment';EXPERIMENT.observation='观察木钥上方的空隙，试探完整移动和局部移动的区别。';EXPERIMENT.goal=EXPERIMENT.observation;
  function observation(level,removed=[]){
    const left=level.pieces.filter(p=>!p.fixed&&!removed.includes(p.id));if(!removed.length)return level.observation;
    if(left.length===1)return '只剩最后一件木。观察它与剩余结构的接触。';
    const clues={
      'shoulder-lap':'销孔已空出。观察搭接处的上下肩面，以及承座包住木件的位置。',
      'double-key-frame':left.some(p=>p.id.startsWith('key'))?'一枚木钥已经取下。观察另一处接点是否仍在限制上梁。':'两处销孔都已空出。重新观察梁的上下搭接关系。',
      'burr-three':'中央槽口已露出。比较剩下两件木的凹口，留意侧向活动空间。',
      'burr-six':'交错处已经松开。转动视角，比较剩余木件的槽肩与贯通空隙。',
      'wooden-box':'匣内接缝已经露出。观察侧板边缘与端板槽口的搭接。',
      'double-pin':'一个接点已经解除。再看销孔与榫头的接触位置。'
    };return clues[level.id]||`已取下 ${removed.length} 件木，接点已经变化。重新观察剩余 ${left.length} 件木的活动空间。`;
  }
  function movedShape(shape,offset=[0,0,0]) {
    if(offset.every(v=>Math.abs(v)<EPS))return shape;
    return {...shape,vertices:shape.vertices.map(v=>v.map((n,i)=>n+offset[i]))};
  }
  function canTranslate(level,removed,id,direction,distance,offsets={}) {
    const piece=level.pieces.find(p=>p.id===id);
    if(!piece||piece.fixed||removed.includes(id))return {ok:false,reason:'inactive'};
    const vector=typeof direction==='string'?DIRECTIONS.find(d=>d.id===direction)?.vector:direction;
    if(!vector)return {ok:false,reason:'direction'};
    let hit=null;
    for(const other of level.pieces){
      if(other.id===id||removed.includes(other.id))continue;
      for(const a of piece.shapes)for(const b of other.shapes){
        const t=sweep(movedShape(a,offsets[id]),movedShape(b,offsets[other.id]),vector,distance);
        if(t!==null&&(!hit||t<hit.distance))hit={piece:other.id,name:other.name,distance:t};
      }
    }
    return hit?{ok:false,reason:'blocked',...hit}:{ok:true};
  }
  function canExtract(level,removed,id,direction,offsets={}) {return canTranslate(level,removed,id,direction,12,offsets);}
  function availableMoves(level,removed=[],offsets={}) {
    return level.pieces.filter(p=>!p.fixed&&!removed.includes(p.id)).flatMap(p=>DIRECTIONS.filter(d=>canExtract(level,removed,p.id,d.id,offsets).ok).map(d=>({piece:p.id,direction:d.id})));
  }
  // Reassembly traverses the same unobstructed path in reverse.
  function canInsert(level,removed,id,direction) {
    const piece=level.pieces.find(p=>p.id===id);
    if(!piece||piece.fixed||!removed.includes(id))return {ok:false,reason:'inactive'};
    const vector=typeof direction==='string'?DIRECTIONS.find(d=>d.id===direction)?.vector:direction;
    if(!vector)return {ok:false,reason:'direction'};
    return canExtract(level,removed.filter(p=>p!==id),id,vector.map(v=>-v));
  }
  function availableInsertions(level,removed) {
    return level.pieces.filter(p=>!p.fixed&&removed.includes(p.id)).flatMap(p=>DIRECTIONS.filter(d=>canInsert(level,removed,p.id,d.id).ok).map(d=>({piece:p.id,direction:d.id})));
  }
  function initialIntersections(level) {
    const problems=[];
    for(let i=0;i<level.pieces.length;i++)for(let j=i+1;j<level.pieces.length;j++){
      const a=level.pieces[i],b=level.pieces[j];
      if(a.shapes.some(s=>b.shapes.some(t=>overlaps(s,t))))problems.push([a.id,b.id]);
    }
    return problems;
  }
  function motionRange(level,removed,id,direction,offsets={}){
    const piece=level.pieces.find(p=>p.id===id),d=DIRECTIONS.find(d=>d.id===direction);
    if(!piece||piece.fixed||removed.includes(id)||!d)return null;
    const a=piece.shapes.flatMap(s=>s.vertices).map(v=>dot(v.map((x,i)=>x+(offsets[id]?.[i]||0)),d.vector));
    const other=level.pieces.filter(p=>p.id!==id&&!removed.includes(p.id)).flatMap(p=>p.shapes.flatMap(s=>s.vertices.map(v=>dot(v.map((x,i)=>x+(offsets[p.id]?.[i]||0)),d.vector))));
    const exitDistance=other.length?Math.max(.65,Math.max(...other)-Math.min(...a)+.12):.8;
    const result=canTranslate(level,removed,id,direction,exitDistance,offsets);
    return {exitDistance,freeDistance:result.ok?exitDistance:Math.max(0,result.distance-1e-4),blocker:result.ok?null:result.piece,blockerName:result.ok?null:result.name};
  }
  // Sweep from outside towards the joint, so a failed fitting attempt stops at
  // its first actual contact rather than starting from inside the obstruction.
  function insertionRange(level,removed,id,direction){
    const d=DIRECTIONS.find(d=>d.id===direction),piece=level.pieces.find(p=>p.id===id);
    if(!d||!piece||piece.fixed||!removed.includes(id))return null;
    const opposite=DIRECTIONS.find(x=>x.vector.every((v,i)=>v===-d.vector[i])),present=removed.filter(x=>x!==id);
    const distance=motionRange(level,present,id,opposite.id).exitDistance,start=d.vector.map(v=>-v*distance);
    const hit=canTranslate(level,present,id,direction,distance,{[id]:start});
    return {distance,start,travel:hit.ok?distance:Math.max(0,hit.distance-1e-4),blocker:hit.ok?null:hit.piece,blockerName:hit.ok?null:hit.name};
  }
  function previewInsertion(level,removed,id,direction,requested){
    const range=insertionRange(level,removed,id,direction);if(!range)return null;
    const distance=Math.max(0,Math.min(Number.isFinite(requested)?requested:0,range.travel));
    return {...range,requested:Math.max(0,requested||0),distance,blocked:!!range.blocker&&requested>range.travel+.015,canSeat:!range.blocker&&requested>=range.distance*.95};
  }
  // A legal insertion can lock out the remaining pieces. Demonstrate a move
  // only when the remaining geometry can also be assembled afterwards.
  function assemblyRoute(level,removed){
    const failed=new Set();
    function visit(absent){
      if(!absent.length)return [];
      const key=[...absent].sort().join('|');if(failed.has(key))return null;
      for(const move of availableInsertions(level,absent)){const tail=visit(absent.filter(id=>id!==move.piece));if(tail)return [move,...tail];}
      failed.add(key);return null;
    }
    return visit(removed);
  }
  function hintContext(level,removed,mode='dismantle',offsets={}){
    const route=mode==='assemble'?assemblyRoute(level,removed):null;
    let moves=mode==='assemble'?(route?.length?[route[0]]:[]):availableMoves(level,removed,offsets);
    if(!moves.length&&level.step&&mode!=='assemble')moves=level.pieces.filter(p=>!p.fixed&&!removed.includes(p.id)).flatMap(p=>DIRECTIONS.filter(d=>canTranslate(level,removed,p.id,d.id,level.step,offsets).ok).map(d=>({piece:p.id,direction:d.id,kind:'shift'})));
    if(!moves.length)return {move:null,related:[],text:'提前归位的构件挡住了后续进入路线。撤销最近一步，再观察未装木件需要的空间。'};
    const move=moves[0];
    for(const p of level.pieces.filter(p=>!p.fixed&&p.id!==move.piece&&!removed.includes(p.id)))for(const d of DIRECTIONS){
      const hit=canExtract(level,removed,p.id,d.id,offsets);
      if(!hit.ok&&hit.piece===move.piece)return {move,related:[move.piece,p.id],text:`${p.name}在${d.axis}方向受到${hit.name}阻挡。观察亮起的接点，想一想怎样让出这段空间。`};
    }
    const p=level.pieces.find(p=>p.id===move.piece);
    return {move,related:[move.piece,...level.pieces.filter(p=>p.fixed).map(p=>p.id)],text:mode==='assemble'?`观察${p.name}的槽口与待装位置。先留出进入空间，再安装用于锁定的木件。`:`观察${p.name}与周围槽口的接触，区分封闭面与出口。`};
  }
  const api={box,prismX,subtractBox,overlaps,sweep,DIRECTIONS,LEVELS,MAIN_LEVELS,TUTORIALS,EXPERIMENT,observation,movedShape,canTranslate,canExtract,availableMoves,canInsert,availableInsertions,initialIntersections,motionRange,insertionRange,previewInsertion,hintContext};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.JointPuzzle=api;
})(typeof window==='undefined'?globalThis:window);
