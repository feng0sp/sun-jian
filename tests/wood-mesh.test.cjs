const assert=require('node:assert/strict');
const P=require('../dist/puzzle-core.js'),W=require('../dist/wood-mesh.js');
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const area=faces=>faces.reduce((sum,f)=>sum+f.vertices.slice(2).reduce((s,v,i)=>s+Math.hypot(...cross(sub(f.vertices[i+1],f.vertices[0]),sub(v,f.vertices[0])))/2,0),0);
// Adjacent/overlapping partitions must produce one continuous exterior.
for(const solids of [[P.box(0,1,0,1,0,1),P.box(1,2,0,1,0,1)],[P.box(0,1.4,0,1,0,1),P.box(.6,2,0,1,0,1)]]){
 const faces=W.surfaces(solids,0);assert(Math.abs(area(faces)-10)<1e-6);
 const edges=W.edges(faces);for(let i=0;i<edges.length;i+=2)assert(!edges[i].every((v,k)=>k===0||v>0&&v<1),'no face-interior seams');
}
// Cutting a real hole must preserve its walls, not fill or hide it.
const frame=P.subtractBox([0,3,0,1,0,3],[1,2,0,1,1,2]);assert(Math.abs(area(W.surfaces(frame,0))-32)<1e-6);
for(const level of [...P.LEVELS,P.EXPERIMENT])for(const part of level.pieces){
 const faces=W.surfaces(part.shapes),edges=W.edges(faces);assert(faces.length>0);assert(edges.length>0);
 for(const f of faces){assert(f.vertices.length>=3);assert(f.normal.every(Number.isFinite));for(const v of f.vertices)assert(v.every(Number.isFinite));}
 // Micro-chamfers must stay inside the original envelope.
 const all=part.shapes.flatMap(s=>s.vertices);for(const v of faces.flatMap(f=>f.vertices))for(let a=0;a<3;a++)assert(v[a]>=Math.min(...all.map(p=>p[a]))-1e-6&&v[a]<=Math.max(...all.map(p=>p[a]))+1e-6);
}
console.log('PASS: continuous exterior, overlapping faces removed, open mortise preserved, finite chamfers in all 11 structures.');
