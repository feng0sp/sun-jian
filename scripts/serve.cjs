const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  let rel;try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=path.resolve(base,'.'+(rel==='/'?'/index.html':rel));
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,buffer)=>{if(error){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(buffer);});
});
const port=Number(process.env.PORT||4173);
if(!Number.isInteger(port)||port<1||port>65535){throw new Error('PORT must be an integer between 1 and 65535');}
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
