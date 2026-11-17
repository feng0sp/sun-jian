// Offline design tool: search connected, grid-cut wooden bars with sequential releases.
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});
const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const key=v=>v.join(',');
let seed=4261;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
function search(n){
 const bars=n===3?[
  [-3,3,-2,0,-1,1],[-1,1,-3,3,-2,0],[-2,0,-1,1,-3,3]
 ]:[
  [-3,3,-2,0,-1,1],[-3,3,0,2,-1,1],
  [-1,1,-3,3,-2,0],[-1,1,-3,3,0,2],
  [-2,0,-1,1,-3,3],[0,2,-1,1,-3,3]
 ];
 const map=new Map();bars.forEach((b,i)=>{for(let x=b[0];x<b[1];x++)for(let y=b[2];y<b[3];y++)for(let z=b[4];z<b[5];z++){const v=[x,y,z],k=key(v);if(!map.has(k))map.set(k,{v,owners:[]});map.get(k).owners.push(i);}});
 const cells=[...map.values()],neighbors=cells.map(c=>dirs.map(d=>cells.findIndex(b=>key(b.v)===key(c.v.map((v,i)=>v+d[i])))).filter(i=>i>=0));
 const conflicts=Array.from({length:n},()=>Array.from({length:6},()=>new Set()));
 for(let trial=0;trial<300000;trial++){
  const assignment=cells.map(c=>n===6&&c.owners.includes(5)?5:c.owners[Math.floor(rand()*c.owners.length)]);
  const indices=bars.map((_,i)=>assignment.flatMap((p,j)=>p===i?[j]:[]));
  if(indices.some(ids=>{const seen=new Set([ids[0]]),todo=[ids[0]],owner=assignment[ids[0]];while(todo.length){for(const j of neighbors[todo.pop()])if(assignment[j]===owner&&!seen.has(j)){seen.add(j);todo.push(j);}}return seen.size!==ids.length;}))continue;
  // Voxel paths have exact unit contact; these masks enumerate all blocking pieces.
  for(const piece of conflicts)for(const d of piece)d.clear();
  const grid=new Map(cells.map((c,i)=>[key(c.v),assignment[i]]));
  indices.forEach((ids,i)=>dirs.forEach((d,di)=>ids.forEach(j=>{for(let t=1;t<=6;t++){const owner=grid.get(key(cells[j].v.map((v,a)=>v+t*d[a])));if(owner!==undefined&&owner!==i)conflicts[i][di].add(owner);}})));
  const moves=removed=>indices.flatMap((_,i)=>removed.has(i)?[]:dirs.flatMap((d,j)=>[...conflicts[i][j]].every(k=>removed.has(k))?[{piece:i,direction:j}]:[]));
  const first=moves(new Set());if(new Set(first.map(m=>m.piece)).size!==1)continue;
  // The six-piece design starts with an axial key; the three-piece uses a side release.
  const firstAxis=n===3?first[0].piece:Math.floor(first[0].piece/2);
  if(n===6&&first.some(m=>Math.floor(m.direction/2)!==firstAxis))continue;
  const removed=new Set(),route=[];while(removed.size<n){const next=moves(removed)[0];if(!next)break;route.push(next);removed.add(next.piece);}
  if(removed.size!==n)continue;
  const pieces=indices.map(ids=>ids.map(j=>cells[j].v));
  return {n,trial,bars,pieces,route,first};
 }
 throw Error('No sequential design found: '+n);
}
const designs=[search(3),search(6)];
fs.writeFileSync('artifacts/burr-designs.json',JSON.stringify(designs,null,2));
console.log(designs.map(({pieces,...d})=>({...d,volumes:pieces.map(p=>p.length)})));
