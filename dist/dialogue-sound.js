/* Short original character cues. No speech service, text upload or per-letter chatter. */
(function(root){
 'use strict';
 const colors={
  zhou:{notes:[196,185],level:.085,cutoff:1050,length:.135,gap:.068},
  xiaoxu:{notes:[440,493.88],level:.058,cutoff:1700,length:.115,gap:.062},
  linlan:{notes:[329.63,369.99],level:.065,cutoff:1400,length:.12,gap:.07},
  player:{notes:[293.66],level:.066,cutoff:1200,length:.14,gap:0},
  staff:{notes:[349.23],level:.060,cutoff:1450,length:.12,gap:0},
  judge:{notes:[311.13,349.23],level:.057,cutoff:1320,length:.115,gap:.068},
  message:{notes:[587.33,659.25],level:.047,cutoff:1700,length:.095,gap:.052}
 };
 function plan(speaker,text){
  if(typeof speaker!=='string'||typeof text!=='string'||!text.trim())return null;
  const actor=/^(周伯|老人|屋内)/.test(speaker)?'zhou':/^小许/.test(speaker)?'xiaoxu':/^林岚/.test(speaker)?'linlan':/^我(?:$|[（(])/.test(speaker)?'player':/^工作人员/.test(speaker)?'staff':/^评审/.test(speaker)?'judge':null;
  if(!actor)return null;
  const channel=/消息/.test(speaker)?'message':'live';
  return {actor,channel,...colors[channel==='message'?'message':actor]};
 }
 function create(ctx,destination){
  const voices=new Set();let played=0,last=null;
  function release(voice){if(voices.delete(voice))voice.nodes.forEach(node=>node.disconnect());}
  function stop(immediate=false){
   const at=ctx.currentTime;
   for(const voice of voices){
    const gain=voice.envelope.gain;
    if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(at);
    else{gain.cancelScheduledValues(at);gain.setValueAtTime(Math.max(0,gain.value),at);}
    if(immediate){gain.setValueAtTime(0,at);for(const source of voice.sources)source.stop(at);release(voice);continue;}
    gain.linearRampToValueAtTime(0,at+.008);
    for(const source of voice.sources)source.stop(at+.012);
   }
  }
  function play(speaker,text){
   stop();const cue=plan(speaker,text);if(!cue)return false;
   played++;last={actor:cue.actor,channel:cue.channel};
   cue.notes.forEach((hz,index)=>{
    const at=ctx.currentTime+.003+index*cue.gap,end=at+cue.length;
    const source=ctx.createOscillator(),overtone=ctx.createOscillator(),tone=ctx.createGain(),filter=ctx.createBiquadFilter(),envelope=ctx.createGain();
    source.type=cue.channel==='message'?'sine':'triangle';source.frequency.value=hz;
    overtone.type='sine';overtone.frequency.value=hz*2;tone.gain.value=.09;
    filter.type='lowpass';filter.frequency.value=cue.cutoff;filter.Q.value=.4;
    source.connect(filter);overtone.connect(tone);tone.connect(filter);filter.connect(envelope);envelope.connect(destination);
    envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(cue.level,at+.008);
    envelope.gain.exponentialRampToValueAtTime(.0001,end);
    const voice={sources:[source,overtone],envelope,nodes:[source,overtone,tone,filter,envelope]};voices.add(voice);
    source.onended=()=>release(voice);
    for(const oscillator of voice.sources){oscillator.start(at);oscillator.stop(end+.008);}
   });
   return true;
  }
  return {play,stop,snapshot:()=>({played,voices:voices.size,last})};
 }
 const api={plan,create};root.DialogueSound=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
