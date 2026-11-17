const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=process.env.TEST_URL,out=process.env.TEST_OUTPUT||'output/campaign-012';assert(base,'Set TEST_URL to the published visitor URL');fs.mkdirSync(out,{recursive:true});
(async()=>{const version=require('../package.json').version,items=[],hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const assets=fs.readdirSync('dist/assets/campaign-2d').filter(n=>n.endsWith('.webp')).map(n=>'assets/campaign-2d/'+n);
 for(const file of ['index.html','campaign.js','campaign-story.js','campaign-supplies.js','campaign-illustrated.js','campaign-data.js','campaign.css','first-person.js','assembly-drag.js','bench-puzzle.js','zhou-character.js','game.js','puzzle-core.js','cave-scene.js','cave.js','story.js','assets/campaign/zhou-model.json',...assets]){
  const response=await fetch(new URL(file,base),{signal:AbortSignal.timeout(90000)}),bytes=Buffer.from(await response.arrayBuffer()),local=fs.readFileSync('dist/'+file);assert.equal(response.status,200,file);
  let hostingAppendage=false;
  if(file==='index.html'&&!bytes.equals(local)){
   const expected=local.toString(),actual=bytes.toString(),end=expected.lastIndexOf('</body>');assert(end>0);
   assert.equal(actual.slice(0,end),expected.slice(0,end),'all application HTML matches the final source');
   assert(actual.endsWith(expected.slice(end)),'the original document ending is preserved');
   const extra=actual.slice(end,actual.length-(expected.length-end));
   assert(extra.startsWith('<script>')&&extra.endsWith('</script>')&&extra.includes('/cdn-cgi/challenge-platform/scripts/jsd/main.js')&&extra.includes('__CF$cv$params'),'only the recognized hosting security script may be appended');
   assert.equal((extra.match(/<script>/g)||[]).length,1);assert.equal((extra.match(/<\/script>/g)||[]).length,1);hostingAppendage=true;
  }else assert.equal(hash(bytes),hash(local),file+' matches the final source');
  items.push({file,status:response.status,sha256:hash(bytes),sourceSha256:hash(local),hostingAppendage});
 }
 assert(fs.readFileSync('dist/index.html','utf8').includes('assembly-drag.js?v='+version));fs.writeFileSync(out+'/online-assets.json',JSON.stringify({anonymous:true,version,items},null,2));console.log('PASS: anonymous application HTML matches (recognized hosting appendage allowed); '+(items.length-1)+' essential resources match byte-for-byte, version '+version+'.');
})().catch(e=>{console.error(e);process.exit(1)});
