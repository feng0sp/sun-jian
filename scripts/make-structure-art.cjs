const fs=require('node:fs');
const path=require('node:path');
const P=require('../dist/puzzle-core.js');
const W=require('../dist/wood-mesh.js');
const output=path.resolve(__dirname,'../dist/assets');fs.mkdirSync(output,{recursive:true});
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const minus=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const project=v=>[(v[0]-v[2])*.7071,-v[1]*.8165+(v[0]+v[2])*.4082];
const tint=(hex,multiplier)=>'#'+hex.slice(1).match(/../g).map(c=>Math.min(255,Math.round(parseInt(c,16)*multiplier)).toString(16).padStart(2,'0')).join('');
for(const level of P.LEVELS){
  const faces=[];
  for(const part of level.pieces)for(const face of W.surfaces(part.shapes)){
    const vertices=face.vertices,normal=face.normal;
    if(dot(normal,[1,1,1])<=1e-7)continue;
    const depth=vertices.reduce((s,v)=>s+dot(v,[1,1,1]),0)/vertices.length;
    const multiplier=Math.abs(normal[1])>Math.abs(normal[0])&&Math.abs(normal[1])>Math.abs(normal[2])?1.16:Math.abs(normal[0])>Math.abs(normal[2])?.96:.83;
    faces.push({points:vertices.map(project),depth,fill:tint(part.color,multiplier)});
  }
  const points=faces.flatMap(f=>f.points),minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  const scale=Math.min(170/(maxX-minX),116/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const polys=faces.sort((a,b)=>a.depth-b.depth).map(f=>`<polygon points="${f.points.map(p=>`${((p[0]-cx)*scale+110).toFixed(2)},${((p[1]-cy)*scale+76).toFixed(2)}`).join(' ')}" fill="${f.fill}" stroke="none"/>`).join('');
  fs.writeFileSync(path.join(output,level.id+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 155"><title>${level.family}</title><rect width="220" height="155" rx="4" fill="#eeede2"/><ellipse cx="110" cy="123" rx="71" ry="19" fill="#a3ae93" opacity=".14"/>${polys}</svg>`);
}
console.log(`Generated ${P.LEVELS.length} structure illustrations.`);
