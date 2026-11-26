/* Quiet, waxed wood. Locally generated grain is shared by a whole component. */
(function(root){
  'use strict';
  const cache=new Map(),paintedCache=new Map();let toonRamp=null;
  function tone(hex,fixed=false){
    const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)),average=rgb.reduce((s,v)=>s+v,0)/3;
    const warmth=fixed?.09:.08;
    return '#'+rgb.map((v,i)=>Math.round(v*(.96-warmth)+average*.04+[244,228,204][i]*warmth).toString(16).padStart(2,'0')).join('');
  }
  function textures(THREE,hex,anisotropy){
    if(cache.has(hex))return cache.get(hex);
    const width=512,height=512,canvas=document.createElement('canvas'),relief=document.createElement('canvas');canvas.width=relief.width=width;canvas.height=relief.height=height;
    const ctx=canvas.getContext('2d'),bctx=relief.getContext('2d'),pixels=ctx.createImageData(width,height),bump=bctx.createImageData(width,height),rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16));
    let seed=parseInt(hex.slice(1),16);const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const phase=random()*6.28,period=8+random()*3;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const u=x/width,v=y/height;
      const sweep=.14*Math.sin(v*3.6+phase)+.045*Math.sin(v*10.7+phase*.6);
      const growth=Math.sin((u*period+sweep)*Math.PI*2),latewood=Math.pow(.5+.5*growth,10);
      const fiber=Math.sin(u*340+sweep*21+Math.sin(v*25+phase)*.22);
      const pores=Math.pow(.5+.5*Math.sin(u*970+sweep*60),14),noise=random()-.5;
      const value=1+.018*growth-.047*latewood+.008*fiber-.012*pores+noise*.012,i=(y*width+x)*4;
      for(let c=0;c<3;c++){pixels.data[i+c]=Math.min(255,Math.max(0,rgb[c]*value));bump.data[i+c]=Math.round(239-6*latewood+3*fiber-3*pores+noise*2);}
      pixels.data[i+3]=bump.data[i+3]=255;
    }
    ctx.putImageData(pixels,0,0);bctx.putImageData(bump,0,0);
    const map=new THREE.CanvasTexture(canvas),detail=new THREE.CanvasTexture(relief);map.encoding=THREE.sRGBEncoding;
    for(const t of [map,detail]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(anisotropy,8);}
    const result={map,detail};cache.set(hex,result);return result;
  }
  function paintedGrain(THREE,color){
    if(paintedCache.has(color))return paintedCache.get(color);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,256,256);
    // Wide, quiet grain bands and finer fibres follow the long direction of the piece.
    for(let i=0;i<34;i++){
      const wide=i%4===0,phase=i*2.399;
      ctx.beginPath();ctx.lineWidth=wide?2.6+i%3:.5+i%3*.3;
      ctx.strokeStyle=wide?'rgba(68,39,23,.15)':i%2?'rgba(248,219,173,.12)':'rgba(76,45,29,.16)';
      for(let y=0;y<=256;y+=4){
        const x=i*7.85-4+Math.sin(y*Math.PI/128+phase)*3.3+Math.sin(y*Math.PI/64+phase*.6)*1.25;
        y?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.stroke();
    }
    const map=new THREE.CanvasTexture(canvas);map.encoding=THREE.sRGBEncoding;map.wrapS=map.wrapT=THREE.RepeatWrapping;paintedCache.set(color,map);return map;
  }
  function material(THREE,part,axis,anisotropy=1,illustrated=false){
    const color=illustrated?'#'+part.color.slice(1).match(/../g).map((h,i)=>Math.max(0,Math.min(255,Math.round(parseInt(h,16)*.95+[5,0,-7][i]))).toString(16).padStart(2,'0')).join(''):tone(part.color,part.fixed);
    let m;
    if(illustrated){
      if(!toonRamp){toonRamp=new THREE.DataTexture(new Uint8Array([51,51,51,101,101,101,157,157,157,205,205,205,236,236,236,255,255,255]),6,1,THREE.RGBFormat);toonRamp.minFilter=toonRamp.magFilter=THREE.LinearFilter;toonRamp.generateMipmaps=false;toonRamp.needsUpdate=true;}
      m=new THREE.MeshToonMaterial({map:paintedGrain(THREE,color),gradientMap:toonRamp,color:0xffffff,side:THREE.DoubleSide});
    }else{const grain=textures(THREE,color,anisotropy);m=new THREE.MeshPhysicalMaterial({map:grain.map,bumpMap:grain.detail,bumpScale:.018,roughnessMap:grain.detail,roughness:.72,metalness:0,clearcoat:.10,clearcoatRoughness:.65,color:0xffffff,side:THREE.DoubleSide});}
    m.onBeforeCompile=shader=>{
      shader.uniforms.uWoodAxis={value:new THREE.Vector3(axis===0?1:0,axis===1?1:0,axis===2?1:0)};
      shader.uniforms.uEndGrainColor={value:new THREE.Color(color).convertSRGBToLinear()};
      shader.vertexShader='varying vec3 vWoodPosition;\nvarying vec3 vWoodNormal;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWoodPosition = position;\nvWoodNormal = normalize(normal);');
      shader.fragmentShader='varying vec3 vWoodPosition;\nvarying vec3 vWoodNormal;\nuniform vec3 uWoodAxis;\nuniform vec3 uEndGrainColor;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec2 endPlane = uWoodAxis.x > 0.5 ? vWoodPosition.yz : (uWoodAxis.y > 0.5 ? vWoodPosition.xz : vWoodPosition.xy);
        float radial = length(endPlane * vec2(1.0, 0.76) + vec2(1.7, 2.9));
        float ripple = 0.026 * sin(dot(endPlane, vec2(4.4, 5.1)));
        float ring = pow(0.5 + 0.5 * sin((radial + ripple) * 28.0), 6.0);
        float endFace = smoothstep(0.72, 0.96, abs(dot(normalize(vWoodNormal), uWoodAxis)));
        float endTone = 0.92 - 0.22 * ring + 0.028 * sin(radial * 11.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, uEndGrainColor * endTone, endFace);
      `);
    };
    m.customProgramCacheKey=()=> illustrated?'sun-jian-painted-wood-v3':'sun-jian-waxed-wood-v3';return m;
  }
  function piece(level,part){
    if(level!=='burr-six')return part;
    const colors=['#ac7646','#bd8552','#85603d','#97704d','#b18d60','#c19c70'];
    return {...part,color:colors[Number(part.id.slice(4))-1]||part.color};
  }
  const chamfer=level=>['dovetail','burr-six','pinned','rain-shelter-bench'].includes(level)||level.startsWith('entry-') ? .048 : .035;
  function ink(hex){
    const linear=hex.slice(1).match(/../g).map(v=>{const c=parseInt(v,16)/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);});
    return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722<.24?'#fff4dc':'#49331f';
  }
  root.WoodFinish={material,tone,ink,piece,chamfer};
})(window);
