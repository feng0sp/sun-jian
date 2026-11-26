/* Surface-only wood geometry. Collision solids remain authoritative. */
(function(root){
  'use strict';
  const EPS=1e-6,sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
  const normal=p=>unit(cross(sub(p[1],p[0]),sub(p[2],p[0])));
  const key=v=>v.map(x=>Math.round(x*1e6)).join(',');
  function clean(p){
    p=p.filter((v,i)=>Math.hypot(...sub(v,p[(i+p.length-1)%p.length]))>EPS);
    let changed=true;
    while(changed&&p.length>=3){changed=false;for(let i=0;i<p.length;i++)if(Math.hypot(...cross(sub(p[i],p[(i+p.length-1)%p.length]),sub(p[(i+1)%p.length],p[i])))<EPS){p.splice(i,1);changed=true;break;}}
    return p.length>=3?p:[];
  }
  function split(poly,n,w){
    const inside=[],outside=[],cuts=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=dot(n,a)-w,db=dot(n,b)-w;
      if(da<=EPS)inside.push(a);if(da>=-EPS)outside.push(a);
      if((da>EPS&&db<-EPS)||(da<-EPS&&db>EPS)){
        const t=da/(da-db),v=a.map((x,j)=>x+(b[j]-x)*t);inside.push(v);outside.push(v);cuts.push(v);
      }else if(Math.abs(da)<=EPS)cuts.push(a);
    }
    return {inside:clean(inside),outside:clean(outside),cuts};
  }
  function clipSolid(polys,n,w){
    const next=[],cut=new Map();let sliced=false;
    for(const p of polys){const d=p.map(v=>dot(n,v)-w);if(d.some(x=>x>EPS))sliced=true;const r=split(p,n,w);if(r.inside.length)next.push(r.inside);r.cuts.forEach(v=>cut.set(key(v),v));}
    if(sliced&&cut.size>=3){
      const points=[...cut.values()],center=points[0].map((_,i)=>points.reduce((s,p)=>s+p[i],0)/points.length);
      const u=unit(cross(n,Math.abs(n[0])<.8?[1,0,0]:[0,1,0])),v=cross(n,u);
      points.sort((a,b)=>Math.atan2(dot(sub(a,center),v),dot(sub(a,center),u))-Math.atan2(dot(sub(b,center),v),dot(sub(b,center),u)));
      const cap=clean(points);if(cap.length)next.push(cap);
    }
    return next;
  }
  function surfaces(shapes,radius=.035){
    const vertices=shapes.flatMap(s=>s.vertices),lo=[0,1,2].map(i=>Math.min(...vertices.map(v=>v[i]))),hi=[0,1,2].map(i=>Math.max(...vertices.map(v=>v[i])));
    const r=Math.min(radius,...hi.map((x,i)=>(x-lo[i])*.09)),planes=[];
    // Chamfer the outer envelope of the WHOLE part, never each constituent block.
    for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)for(const sa of [-1,1])for(const sb of [-1,1]){
      const n=[0,0,0];n[a]=sa;n[b]=sb;planes.push({n,w:sa*(sa>0?hi[a]:lo[a])+sb*(sb>0?hi[b]:lo[b])-r});
    }
    const solids=shapes.map(s=>{let p=s.faces.map(f=>f.map(i=>s.vertices[i]));if(r>EPS)for(const {n,w}of planes)p=clipSolid(p,n,w);return p;}).filter(p=>p.length);
    const boundaries=solids.map(polys=>polys.map(p=>{const n=normal(p);return {n,w:dot(n,p[0])};}));
    const result=[];
    solids.forEach((polys,i)=>polys.forEach(face=>{
      const fn=normal(face);let fragments=[face];
      solids.forEach((_,j)=>{
        if(i===j||!fragments.length)return;
        // Keep just one copy of coincident outward faces.
        if(j>i&&boundaries[j].some(p=>dot(p.n,fn)>1-EPS&&Math.abs(dot(p.n,face[0])-p.w)<EPS))return;
        const remaining=[];
        for(const fragment of fragments){let inside=fragment;
          for(const {n,w}of boundaries[j]){
            if(!inside.length)break;
            const distances=inside.map(v=>dot(n,v)-w);
            if(distances.every(d=>d<=EPS))continue;
            if(distances.every(d=>d>=-EPS)){remaining.push(inside);inside=[];break;}
            const parts=split(inside,n,w);if(parts.outside.length)remaining.push(parts.outside);inside=parts.inside;
          }
        }
        fragments=remaining;
      });
      fragments.forEach(p=>result.push({vertices:p,normal:fn}));
    }));
    return result;
  }
  function edges(faces){
    const unique=new Map();faces.forEach(f=>f.vertices.forEach(v=>unique.set(key(v),v)));const vertices=[...unique.values()],segments=new Map();
    for(const face of faces)for(let i=0;i<face.vertices.length;i++){
      const a=face.vertices[i],b=face.vertices[(i+1)%face.vertices.length],ab=sub(b,a),length2=dot(ab,ab);
      const cuts=vertices.map(v=>({v,t:dot(sub(v,a),ab)/length2})).filter(({v,t})=>t>=-EPS&&t<=1+EPS&&Math.hypot(...cross(sub(v,a),ab))<EPS).sort((a,b)=>a.t-b.t);
      for(let j=1;j<cuts.length;j++){
        const p=cuts[j-1].v,q=cuts[j].v;if(key(p)===key(q))continue;
        const k=[key(p),key(q)].sort().join('|');if(!segments.has(k))segments.set(k,{p,q,normals:[]});segments.get(k).normals.push(face.normal);
      }
    }
    // Coplanar triangulation/partition edges disappear; only physical creases remain.
    return [...segments.values()].filter(s=>s.normals.some(n=>dot(n,s.normals[0])<.985)).flatMap(s=>[s.p,s.q]);
  }
  function geometry(THREE,faces,grainAxis){
    const positions=[],normals=[],uvs=[];
    for(const face of faces){
      const n=face.normal;
      const normalAxis=[0,1,2].reduce((a,b)=>Math.abs(n[a])>=Math.abs(n[b])?a:b);
      const across=[0,1,2].find(a=>a!==normalAxis&&a!==grainAxis)??((grainAxis+1)%3);
      for(let j=1;j<face.vertices.length-1;j++){
        for(const v of [face.vertices[0],face.vertices[j],face.vertices[j+1]]){
          positions.push(...v);normals.push(...n);uvs.push(v[across]*.38,v[grainAxis]*.22);
        }
      }
    }
    const mesh=new THREE.BufferGeometry();
    mesh.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    mesh.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    mesh.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    return mesh;
  }
  const api={surfaces,edges,geometry};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.WoodMesh=api;
})(typeof window==='undefined'?globalThis:window);
