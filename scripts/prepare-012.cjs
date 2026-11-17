const fs=require('node:fs');
for(const path of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(path,'utf8'));p.version='0.12.0';if(p.packages?.[''])p.packages[''].version='0.12.0';if(path==='package.json'){
 p.scripts['test:illustrated']='node tests/campaign-2d-state.test.cjs && node tests/campaign-2d-dialogue.test.cjs && node tests/campaign-2d-edges.test.cjs && node tests/campaign-2d.test.cjs';
 p.scripts['test:campaign']='node tests/bench.test.cjs && node tests/assembly-recovery.test.cjs && node tests/campaign-2d.test.cjs && node tests/campaign-2d-edges.test.cjs';
 p.scripts['test:narrative']='node tests/campaign-2d-dialogue.test.cjs && node tests/campaign-2d-edges.test.cjs';
 p.scripts['test:campaign-polish']='node tests/campaign-2d-edges.test.cjs && node tests/assembly-inputs.test.cjs';
 p.scripts['test:stability']='node tests/campaign-2d-state.test.cjs && node tests/campaign-2d-edges.test.cjs && node tests/mode-save-isolation.test.cjs && node tests/assembly-projection.test.cjs && node tests/assembly-recovery.test.cjs';
 }fs.writeFileSync(path,JSON.stringify(p,null,2)+'\n');}
const html=fs.readFileSync('dist/index.html','utf8').replaceAll('?v=0.11.3','?v=0.12.0');fs.writeFileSync('dist/index.html',html);
console.log('Prepared version 0.12.0 and illustrated-campaign verification commands.');
