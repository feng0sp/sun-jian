/* Original local score, CC0 field rain and a short wooden-door interaction. */
(function (root) {
  'use strict';

  // Five original themes follow the places, with space between notes. No sustained sub-bass bed.
  // Rain-road plucks, a homelike piano phrase, workshop, stone store and gathering.
  // A pulse is [start in seconds, sounding length, peak amplitude].
  const scores = {
    contest:{recorded:true},award:{recorded:true},
    journey: {
      duration: 9.6, attack: .012, partial: .075, ratio: 2.002, ring: .2,
      pulse: [[0,.72,.033],[1.6,.48,.027],[2.4,.65,.03],[4.8,.78,.031],[5.6,.46,.024],[7.2,.82,.027]],
      bars: [[69,74,76,66,69,74],[71,69,66,62,66,69],
             [67,71,74,69,67,66],[64,69,73,76,74,69],
             [69,74,78,76,74,71],[66,69,74,71,69,66],
             [67,71,74,76,74,69],[64,69,73,74,69,62]]
    },
    home: {
      duration: 8, attack: .009, partial: .12, levelScale: 1.25, ratio: 2.003, ring: .22,
      pulse: [[0,.82,.041],[.67,.56,.03],[1.34,.64,.034],[2.68,.92,.039],
              [4.02,.73,.034],[4.69,.54,.027],[5.36,.68,.036],[6.7,.86,.033]],
      bars: [[62,66,69,74,71,69,66,64],[59,62,66,69,66,64,62,66],
             [55,71,74,76,74,71,69,67],[57,69,73,76,73,71,69,64],
             [62,66,69,78,76,74,71,69],[59,62,66,74,71,69,66,64],
             [55,71,74,76,74,69,67,66],[57,69,73,74,69,66,64,62]]
    },
    store: {
      duration:12.8,attack:.018,partial:.055,levelScale:1.1,ratio:2.997,ring:.28,
      pulse:[[0,1.05,.031],[2.4,.68,.024],[4.8,.9,.028],[7.2,.58,.022],[9.6,1.18,.027]],
      bars:[[74,69,66,71,74],[76,74,69,67,71],[78,74,71,69,66],[76,73,69,64,69],
            [74,78,76,71,69],[71,74,69,66,62],[67,74,76,71,69],[73,76,74,69,62]]
    },
    gathering: {
      duration:6.8,attack:.007,partial:.085,levelScale:1.1,ratio:2.004,ring:.16,
      pulse:[[0,.43,.037],[.425,.34,.027],[1.275,.46,.032],[2.125,.4,.03],[3.4,.52,.035],[4.25,.34,.026],[5.1,.55,.031]],
      bars:[[74,78,81,78,76,74,69],[71,74,78,76,74,71,66],[67,74,79,78,76,74,71],[69,73,78,76,74,73,69],
            [74,76,78,81,78,76,74],[71,74,76,78,76,74,71],[67,71,74,79,78,74,69],[69,73,76,78,76,73,74]]
    },
    workshop: {
      duration: 6.4, attack: .004, partial: .075, levelScale: 1.2, ratio: 3.005, ring: .14,
      pulse: [[0,.29,.041],[.4,.24,.03],[.8,.31,.035],[1.6,.34,.04],[2,.25,.027],
              [2.8,.32,.035],[3.2,.27,.03],[4,.38,.039],[4.4,.25,.029],[5.2,.43,.034]],
      bars: [[74,76,69,78,76,74,71,69,66,69],[71,74,66,76,74,71,69,66,64,66],
             [67,71,74,79,78,76,74,71,69,67],[69,73,76,78,76,73,71,69,64,69],
             [74,78,76,81,78,76,74,71,69,74],[71,74,78,76,74,71,69,66,64,66],
             [67,71,74,79,78,74,71,69,67,66],[69,73,76,78,76,74,73,69,66,74]]
    }
  };

  const state = {active:false, night:false, interior:false, quiet:false, volume:.65,musicVolume:1,ambienceVolume:1, profile:'journey', dialogue:true, rainScene:'courtyard', rainChoice:'auto'};
  const tails = new Set();
  const scorePositions = new Map();
  const musicBuffers=new Map(),celebrationVoices=new Set();
  const rainBuffers = new Map(), rainTails = new Set(), knocks = new Set();
  let enabled = false, unlocked = false, pageVisible = true;
  let dialogueFx, ctx, master, music, rain, rainFilter, timer = null, pending = null;
  let current = null, phraseGeneration = 0, musicTarget = 0, rainTarget = 0;
  let rainVoice = null, rainLoading = null, rainError = null, rainGeneration = 0;
  let preview = null, previewVoice = null, previewTimer = null, previewGeneration = 0, knocksPlayed = 0;

  function wantsSound() {
    return enabled && unlocked && state.active && pageVisible && !document.hidden && !preview;
  }

  function selectedRain() {
    return state.rainChoice === 'auto' ? state.rainScene : state.rainChoice;
  }

  function announce() {
    root.dispatchEvent(new CustomEvent('journey:rain-preview'));
  }

  function loopBuffer(original) {
    // Crossfade only the final 0.8 s into the first 0.8 s; preserve the full recording's variations.
    const seam = Math.min(Math.round(original.sampleRate * .8), Math.floor(original.length / 8));
    const length = original.length - seam;
    const buffer = ctx.createBuffer(original.numberOfChannels, length, original.sampleRate);
    for (let channel = 0; channel < original.numberOfChannels; channel++) {
      const source = original.getChannelData(channel), output = buffer.getChannelData(channel);
      output.set(source.subarray(seam));
      for (let i = 0; i < seam; i++) {
        const fade = Math.sin(i / seam * Math.PI / 2) ** 2;
        output[length - seam + i] = (1 - fade) * source[original.length - seam + i] + fade * source[i];
      }
    }
    return buffer;
  }

  function loadRain(id) {
    if (rainBuffers.has(id)) return rainBuffers.get(id);
    const job = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;clearTimeout(timeout);script.remove();
        if (error) { reject(error); return; }
        const recording = root.JourneyRainData?.[id];
        if (!recording) { reject(new Error('Missing recording payload')); return; }
        try {
          const binary = atob(recording.data), bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          ctx.decodeAudioData(bytes.buffer).then(buffer => resolve(loopBuffer(buffer)), reject);
        } catch (error) { reject(error); }
      };
      const timeout = setTimeout(() => finish(new Error('Rain recording timed out')), 15000);
      script.onload = () => finish();script.onerror = () => finish(new Error('Rain recording unavailable'));
      script.src = 'assets/audio/rain-' + id + '.js?v=0.13.9';
      document.head.append(script);
    });
    rainBuffers.set(id, job);
    job.catch(() => { if (rainBuffers.get(id) === job) rainBuffers.delete(id); });
    return job;
  }

  function fadeRecording(voice, seconds) {
    if (!voice) return;
    const at = ctx.currentTime;
    hold(voice.output.gain, at);
    voice.output.gain.linearRampToValueAtTime(0, at + seconds);
    voice.source.stop(at + seconds);
    if (!seconds) { voice.source.disconnect();voice.output.disconnect();rainTails.delete(voice); }
  }

  function recordVoice(id, buffer, destination, volume, looping) {
    const source = ctx.createBufferSource(), output = ctx.createGain(), now = ctx.currentTime;
    source.buffer = buffer;source.loop = looping;
    output.gain.value = 0;output.gain.linearRampToValueAtTime(volume, now + .65);
    source.connect(output);output.connect(destination);
    const voice = {id, source, output};
    source.onended = () => { source.disconnect();output.disconnect();rainTails.delete(voice); };
    source.start();return voice;
  }

  function stopRain(seconds = 0) {
    rainGeneration++;rainLoading = null;
    const old = rainVoice;rainVoice = null;
    if (old) { rainTails.add(old);fadeRecording(old, seconds); }
    if (!seconds) for (const tail of rainTails) fadeRecording(tail, 0);
  }

  function ensureRain() {
    if (!state.night || state.profile === 'workshop') { if (rainVoice || rainLoading) stopRain(.65);return; }
    const id = selectedRain();
    if (rainVoice?.id === id || rainLoading === id || rainError === id) return;
    const token = ++rainGeneration;rainLoading = id;
    loadRain(id).then(buffer => {
      if (token !== rainGeneration) return;
      rainLoading = null;
      if (!wantsSound() || selectedRain() !== id || !state.night || state.profile === 'workshop') return;
      for (const tail of rainTails) fadeRecording(tail, .025);
      if (rainVoice) { rainTails.add(rainVoice);fadeRecording(rainVoice, .65); }
      rainVoice = recordVoice(id, buffer, rainFilter, 1, true);rainError = null;announce();
    }).catch(() => { if (token === rainGeneration) {rainLoading = null;rainError = id;announce();} });
  }

  function init() {
    if (ctx) return true;
    const Audio = root.AudioContext || root.webkitAudioContext;
    if (!Audio) return false;
    try {
      ctx = new Audio();
      master = ctx.createGain();
      music = ctx.createGain();
      rain = ctx.createGain();
      master.gain.value = music.gain.value = rain.gain.value = 0;
      master.connect(ctx.destination);
      music.connect(master);
      dialogueFx = root.DialogueSound?.create(ctx, master);
      rain.connect(master);
      rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';rainFilter.Q.value = .55;rainFilter.connect(rain);
      return true;
    } catch {
      if (ctx) ctx.close().catch(() => {});
      ctx = null;
      return false;
    }
  }

  function hold(param, at) {
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(at);
    else {
      const value = param.value;
      param.cancelScheduledValues(at);
      param.setValueAtTime(value, at);
    }
  }

  function setMix() {
    const now = ctx.currentTime;
    const palette = {journey:.68, home:.88, workshop:.84,store:.62,gathering:.78,contest:.78,award:.82};
    musicTarget = palette[state.profile] * state.musicVolume * (state.quiet ? .38 : 1);
    rainTarget = state.night && state.profile !== 'workshop'
      ? (state.interior ? .085 : .23) * state.ambienceVolume * (state.quiet ? .64 : 1) : 0;
    master.gain.setTargetAtTime(state.volume, now, .12);
    music.gain.setTargetAtTime(musicTarget, now, .21);
    rain.gain.setTargetAtTime(rainTarget, now, .32);
    rainFilter.frequency.setTargetAtTime(state.interior ? 1160 : 3900, now, .29);
  }

  function release(group, voice) {
    if (!group.voices.delete(voice)) return;
    for (const node of voice.nodes) node.disconnect();
    if (group !== current && !group.voices.size) {
      group.output.disconnect();
      tails.delete(group);
    }
  }

  function playNote(group, midi, at, length, level) {
    const track = scores[group.profile], frequency = 440 * 2 ** ((midi - 69) / 12);
    level *= track.levelScale || 1;
    const fundamental = ctx.createOscillator(), overtone = ctx.createOscillator();
    const envelope = ctx.createGain(), brightness = ctx.createGain();
    fundamental.frequency.value = frequency;
    overtone.frequency.value = frequency * track.ratio;
    fundamental.connect(envelope);
    overtone.connect(brightness);
    brightness.connect(envelope);
    envelope.connect(group.output);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + track.attack);
    envelope.gain.exponentialRampToValueAtTime(level * .22, at + length * .67);
    envelope.gain.exponentialRampToValueAtTime(.00005, at + length);
    brightness.gain.setValueAtTime(track.partial, at);
    brightness.gain.exponentialRampToValueAtTime(.004, at + length * track.ring);
    const voice = {sources:[fundamental, overtone], nodes:[fundamental, overtone, brightness, envelope]};
    group.voices.add(voice);
    fundamental.onended = () => release(group, voice);
    fundamental.start(at);
    overtone.start(at);
    fundamental.stop(at + length + .015);
    overtone.stop(at + length + .015);
  }

  function finish(group, seconds) {
    if (!group) return;
    const now = ctx.currentTime, end = now + seconds;
    hold(group.output.gain, now);
    group.output.gain.linearRampToValueAtTime(0, end);
    tails.add(group);
    for (const voice of group.voices) {
      for (const source of voice.sources) source.stop(end);
      if (!seconds) release(group, voice);
    }
    if (!group.voices.size) {
      group.output.disconnect();
      tails.delete(group);
    }
  }

  function decodeMusic(id,fx=false){
    const key=(fx?'fx:':'')+id;if(musicBuffers.has(key))return musicBuffers.get(key);
    const data=fx?root.JourneyCelebrationFx?.[id]:root.JourneyMusicData?.[id];
    if(!data)return Promise.reject(Error('Local music payload missing'));
    const binary=atob(data.data),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const job=ctx.decodeAudioData(bytes.buffer);musicBuffers.set(key,job);job.catch(()=>musicBuffers.delete(key));return job;
  }
  function startRecording(group,bookmark){
    group.recorded=true;group.loading=true;group.offset=bookmark?.offset||0;group.startedAt=null;
    decodeMusic(group.profile).then(buffer=>{
      if(current!==group||!wantsSound()||ctx.state!=='running')return;
      const data=root.JourneyMusicData[group.profile],source=ctx.createBufferSource(),gain=ctx.createGain();
      source.buffer=buffer;source.loop=true;source.loopStart=data.loopStart||0;source.loopEnd=Math.min(buffer.duration,data.loopEnd||buffer.duration);gain.gain.value=data.recommendedGain||.24;source.connect(gain);gain.connect(group.output);
      const voice={sources:[source],nodes:[source,gain]};group.voices.add(voice);source.onended=()=>release(group,voice);
      group.offset%=source.loopEnd;group.startedAt=ctx.currentTime+.035;group.loading=false;source.start(group.startedAt,group.offset);
    },()=>{if(current===group){group.loading=false;group.error=true;}});
  }
  function celebration() {
    if (!wantsSound() || ctx?.state !== 'running') return false;
    const token = current;
    const cues = [{id:'jingle', delay:0}, {id:'applause', delay:.12}];
    Promise.allSettled(cues.map(async cue => decodeMusic(cue.id, true))).then(results => {
      if (current !== token || !wantsSound() || ctx.state !== 'running') return;
      const startAt = ctx.currentTime + .02;
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const {id, delay} = cues[index];
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = result.value;
        gain.gain.value = root.JourneyCelebrationFx[id].recommendedGain;
        source.connect(gain);
        gain.connect(master);
        const entry = {source, gain};
        celebrationVoices.add(entry);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          celebrationVoices.delete(entry);
        };
        source.start(startAt + delay);
      });
    });
    return true;
  }
  function rememberScore(group) {
    if (!group || !ctx) return;
    const track=scores[group.profile],now=ctx.currentTime;
    if(track.recorded){const length=root.JourneyMusicData?.[group.profile]?.loopEnd||1;scorePositions.set(group.profile,{offset:((group.offset||0)+(group.startedAt===null?0:Math.max(0,now-group.startedAt)))%length});return;}
    let bar=group.bar,firstBeat=group.firstBeat;
    let beat=track.pulse.findIndex(p=>firstBeat+p[0]>=now+.02);
    if(beat<0){beat=0;bar=(bar+1)%track.bars.length;firstBeat+=track.duration;}
    scorePositions.set(group.profile,{bar,beat,wait:Math.max(.05,firstBeat+track.pulse[beat][0]-now)});
  }
  function startScore() {
    // A second switch during a dissolve leaves only the latest tail audible.
    for (const tail of tails) finish(tail, .025);
    const previous = current;
    rememberScore(previous);
    const now = ctx.currentTime, output = ctx.createGain();
    output.gain.value = 0;
    output.gain.linearRampToValueAtTime(1, now + .56);
    output.connect(music);
    const bookmark=scorePositions.get(state.profile),track=scores[state.profile];
    current = {profile:state.profile,output,voices:new Set(),firstBeat:bookmark&&!track.recorded?now+bookmark.wait-track.pulse[bookmark.beat][0]:now+.1,bar:bookmark?.bar||0,beat:bookmark?.beat||0,resumed:!!bookmark};
    if(track.recorded)startRecording(current,bookmark);
    finish(previous, .52);
    phraseGeneration++;
  }

  function schedule() {
    if (!current || ctx.state !== 'running') return;
    const now = ctx.currentTime, track = scores[current.profile];
    if(track.recorded)return;
    let at = current.firstBeat + track.pulse[current.beat][0];
    // A stalled tab must not play a burst of overdue notes.
    if (at < now - .3) {
      current.firstBeat = now + .08;
      current.beat = 0;
      at = current.firstBeat;
    }
    while (at <= now + .24) {
      const [, length, level] = track.pulse[current.beat];
      playNote(current, track.bars[current.bar][current.beat], Math.max(now, at), length, level);
      current.beat++;
      if (current.beat === track.pulse.length) {
        current.beat = 0;
        current.bar = (current.bar + 1) % track.bars.length;
        current.firstBeat += track.duration;
      }
      at = current.firstBeat + track.pulse[current.beat][0];
    }
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    if (!ctx) return;
    stopRain();
    for(const entry of celebrationVoices){try{entry.source.stop();}catch{}entry.source.disconnect();entry.gain.disconnect();}celebrationVoices.clear();
    dialogueFx?.stop(true);
    for (const sound of knocks) { sound.stop();sound.disconnect(); }
    knocks.clear();
    const previous = current;
    rememberScore(previous);
    current = null;
    finish(previous, 0);
    for (const tail of tails) finish(tail, 0);
    const now = ctx.currentTime;
    for (const gain of [master.gain, music.gain, rain.gain]) {
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(0, now);
    }
    musicTarget = rainTarget = 0;
  }

  function changeContext(method) {
    if (pending) return;
    pending = ctx[method]();
    pending.then(() => {
      pending = null;
      reconcile();
    }, () => { pending = null; });
  }

  function reconcile() {
    if (!wantsSound()) {
      if (timer || current || rainVoice || rainLoading || knocks.size) stop();
      if (ctx?.state === 'running' && !preview) changeContext('suspend');
      return;
    }
    if (!init()) return;
    if (ctx.state !== 'running') {
      if (ctx.state !== 'closed') changeContext('resume');
      return;
    }
    if (!current || current.profile !== state.profile) startScore();
    setMix();
    ensureRain();
    if (!timer) {
      schedule();
      timer = setInterval(schedule, 100);
    }
  }

  function unlock(event) {
    if (!event.isTrusted || unlocked) return;
    unlocked = true;
    reconcile();
  }

  function configure(value) {
    const profile = Object.hasOwn(scores, value.profile) ? value.profile
      : typeof value.home === 'boolean' ? (value.home ? 'home' : 'journey') : state.profile;
    const next = {...state, profile};
    for (const key of ['active', 'night', 'interior', 'quiet', 'dialogue']) {
      if (typeof value[key] === 'boolean') next[key] = value[key];
    }
    for(const key of ['volume','musicVolume','ambienceVolume'])if(Number.isFinite(value[key]))next[key]=Math.max(0,Math.min(1,value[key]));
    if (['leaves', 'courtyard'].includes(value.rainScene)) next.rainScene = value.rainScene;
    if (['auto', 'leaves', 'courtyard'].includes(value.rainChoice)) next.rainChoice = value.rainChoice;
    if (Object.keys(next).every(key => next[key] === state[key])) return;
    if (next.rainScene !== state.rainScene || next.rainChoice !== state.rainChoice) rainError = null;
    Object.assign(state, next);
    if (!state.dialogue) dialogueFx?.stop();
    reconcile();
  }

  function stopPreview() {
    previewGeneration++;clearTimeout(previewTimer);previewTimer = null;
    const voice = previewVoice;previewVoice = null;preview = null;
    if (voice) fadeRecording(voice, 0);
    reconcile();announce();
  }

  async function previewRain(id) {
    if (!['leaves', 'courtyard'].includes(id) || !unlocked || document.hidden || !pageVisible) return false;
    stopPreview();
    const token = ++previewGeneration;
    preview = {id, loading:true};announce();
    if (!init()) { stopPreview();return false; }
    // Explicitly pressing the preview button may audition rain while the game's sound stays off.
    reconcile();
    try {
      await ctx.resume();
      const buffer = await loadRain(id);
      if (token !== previewGeneration || !preview || document.hidden || !pageVisible) return false;
      preview.loading = false;
      previewVoice = recordVoice(id, buffer, ctx.destination, state.volume * state.ambienceVolume * .65, false);
      previewTimer = setTimeout(stopPreview, 15000);rainError = null;announce();
      return true;
    } catch {
      if (token === previewGeneration) { stopPreview();rainError = id;announce(); }
      return false;
    }
  }

  function knock() {
    if (!wantsSound() || !ctx || ctx.state !== 'running') return false;
    knocksPlayed++;
    for (const offset of [0, .2]) {
      const at = ctx.currentTime + offset, length = Math.round(ctx.sampleRate * .075);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate), samples = buffer.getChannelData(0);
      let seed = 831;
      for (let i = 0; i < length; i++) { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;samples[i] = seed / 2147483648 - 1; }
      const tap = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      tap.buffer = buffer;filter.type = 'bandpass';filter.frequency.value = offset ? 1250 : 1060;filter.Q.value = .9;
      gain.gain.setValueAtTime(0, at);gain.gain.linearRampToValueAtTime(.24, at + .002);gain.gain.exponentialRampToValueAtTime(.0001, at + .072);
      tap.connect(filter);filter.connect(gain);gain.connect(master);knocks.add(tap);
      tap.onended = () => { knocks.delete(tap);tap.disconnect();filter.disconnect();gain.disconnect(); };
      tap.start(at);tap.stop(at + .075);
      const body = ctx.createOscillator(), bodyGain = ctx.createGain();
      body.type = 'triangle';body.frequency.setValueAtTime(offset ? 167 : 183, at);body.frequency.exponentialRampToValueAtTime(72, at + .085);
      bodyGain.gain.setValueAtTime(0, at);bodyGain.gain.linearRampToValueAtTime(.10, at + .003);bodyGain.gain.exponentialRampToValueAtTime(.0001, at + .12);
      body.connect(bodyGain);bodyGain.connect(master);knocks.add(body);
      body.onended = () => { knocks.delete(body);body.disconnect();bodyGain.disconnect(); };
      body.start(at);body.stop(at + .13);
    }
    return true;
  }

  function visibility() {
    if (document.hidden && preview) stopPreview();
    reconcile();
  }

  document.addEventListener('pointerdown', unlock, {passive:true});
  document.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', visibility);
  root.addEventListener('pagehide', () => { pageVisible = false;if (preview) stopPreview();reconcile(); });
  root.addEventListener('pageshow', () => { pageVisible = true; reconcile(); });

  root.JourneyAtmosphere = {
    configure,
    award:celebration,
    resetMusic(){scorePositions.clear();},
    previewRain,
    stopPreview,
    knock,
    dialogue(speaker, text) {
      if (!state.dialogue || !wantsSound() || ctx?.state !== 'running') return false;
      return dialogueFx?.play(speaker, text) || false;
    },
    silenceDialogue() { dialogueFx?.stop(); },
    sound(value) {
      if (enabled === !!value) return;
      enabled = !!value;
      reconcile();
    },
    snapshot() {
      const retiringVoices = Array.from(tails).reduce((sum, group) => sum + group.voices.size, 0);
      return {enabled, unlocked, active:state.active, running:ctx?.state === 'running',
        night:state.night, interior:state.interior, quiet:state.quiet, profile:state.profile,
        volume:state.volume,musicVolume:state.musicVolume,ambienceVolume:state.ambienceVolume, musicTarget, rainTarget, phraseGeneration, retiringVoices,
        position:current?{bar:current.bar,beat:current.beat,offset:current.recorded?((current.offset||0)+(current.startedAt===null?0:Math.max(0,ctx.currentTime-current.startedAt))):null,loading:!!current.loading,recorded:!!current.recorded,error:!!current.error,resumed:current.resumed}:null,savedPositions:Object.fromEntries([...scorePositions].map(([profile,p])=>[profile,{...p}])),
        dialogue:state.dialogue, dialogueCue:dialogueFx?.snapshot() || {played:0, voices:0, last:null},
        voices:(current?.voices.size || 0) + retiringVoices+celebrationVoices.size, scheduled:timer !== null,
        rainScene:state.rainScene, rainChoice:state.rainChoice, recording:rainVoice?.id || null,
        loading:rainLoading, error:rainError, rainDuration:rainVoice?.source.buffer.duration || 0,
        rainTails:rainTails.size, preview:preview?.id || null, previewLoading:!!preview?.loading, knocksPlayed};
    }
  };
})(window);
