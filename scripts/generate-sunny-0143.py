"""Original 104 BPM D-major arrangements for Sun Jian, composed and synthesized locally.

No samples, copyrighted recordings, external services, or impersonated voices.
The source is editable; generated assets are built from deterministic musical events.
"""
from __future__ import annotations
import array, base64, hashlib, json, math, pathlib, subprocess, wave
import numpy as np
import imageio_ffmpeg

ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'output/awards-0143/music'
ASSETS=ROOT/'dist/assets/audio'
SR=44100
BPM=104
BEAT=60/BPM
TAIL=3.2
RNG=np.random.default_rng(143)

# Each melody event is (beat offset, MIDI note, length in beats). A rest is
# represented by absence of an event, not a sustained background tone.
A=[
 [(0,74,.7),(1,78,.35),(1.5,81,.8),(2.5,78,.35),(3,76,.75)],
 [(0,74,.8),(1,71,.4),(1.5,69,.4),(2.5,71,.35),(3,74,.75)],
 [(0,76,.4),(.5,78,.4),(1.5,79,.7),(2.5,78,.4),(3,76,.75)],
 [(0,73,.75),(1,69,.35),(1.5,71,.35),(2.5,73,.4),(3,76,.75)],
 [(0,78,.7),(1,81,.35),(1.5,83,.7),(2.5,81,.35),(3,78,.75)],
 [(0,76,.35),(.5,74,.35),(1.5,71,.75),(2.5,74,.4),(3,78,.75)],
 [(0,79,.7),(1,78,.35),(1.5,76,.35),(2.5,74,.4),(3,71,.75)],
 [(0,73,.4),(.5,76,.4),(1.5,78,.6),(2.5,76,.35),(3,74,.8)]
]
B=[
 [(0,81,1.2),(1.5,78,.35),(2,76,.35),(3,78,.75)],
 [(0,83,.7),(1,81,.35),(1.5,78,.75),(2.5,76,.35),(3,74,.75)],
 [(0,79,.7),(1,83,.35),(1.5,81,.75),(2.5,79,.35),(3,78,.75)],
 [(0,76,.75),(1,73,.35),(1.5,69,.5),(2.5,73,.35),(3,76,.75)],
 [(0,78,.35),(.5,81,.35),(1.5,86,1.1),(3,83,.75)],
 [(0,81,.75),(1,78,.35),(1.5,76,.5),(2.5,74,.35),(3,71,.75)],
 [(0,74,.35),(.5,76,.35),(1.5,79,.65),(2.5,78,.35),(3,76,.75)],
 [(0,73,.5),(1,76,.5),(2,69,.45),(3,73,.7)]
]
# Root, three-note close piano voicing, six-note guitar pattern.
CHORDS=[
 (50,[66,69,74],[62,69,66,74,69,66]),
 (47,[66,71,74],[59,66,62,71,66,62]),
 (55,[67,71,74],[62,67,71,74,71,67]),
 (57,[64,69,73],[61,69,64,73,69,64]),
 (50,[66,69,74],[62,69,66,74,69,66]),
 (47,[66,71,74],[59,66,62,71,66,62]),
 (55,[67,71,74],[62,67,71,74,71,67]),
 (57,[64,69,73],[61,69,64,73,69,64])
]

def hz(midi): return 440*2**((midi-69)/12)

def note(midi, length, instrument):
    f=hz(midi)
    if instrument=='piano':
        seconds=max(.65,length+.75)
        t=np.arange(round(SR*seconds),dtype=np.float64)/SR
        result=np.zeros(len(t),dtype=np.float64)
        for partial in range(1,10):
            inharmonic=math.sqrt(1+.00010*partial*partial)
            decay=(1.12/(1+.37*(partial-1)))*min(1.35,max(.65,length/.55))
            amplitude=1/partial**1.8
            result+=amplitude*np.exp(-t/decay)*np.sin(2*np.pi*f*partial*inharmonic*t)
            if partial<5:
                result+=amplitude*.14*np.exp(-t/(decay*.85))*np.sin(2*np.pi*f*partial*1.0015*t)
        # Gentle hammer transient, much quieter than the pitched body.
        result+=RNG.normal(0,.012,len(t))*np.exp(-t/.012)
        attack=1-np.exp(-t/.0038)
        release=np.where(t<length,1,np.exp(-(t-length)/.16))
        result*=attack*release
    elif instrument=='guitar':
        seconds=max(.5,length+.45)
        t=np.arange(round(SR*seconds),dtype=np.float64)/SR
        result=np.zeros(len(t),dtype=np.float64)
        for partial in range(1,11):
            # A pluck position suppresses selected upper partials like a string.
            a=np.sin(partial*np.pi*.22)/partial**1.35
            result+=a*np.exp(-t/(.72/(1+.24*(partial-1))))*np.sin(2*np.pi*f*partial*t)
        result*=1-np.exp(-t/.0015)
        result*=np.where(t<length,1,np.exp(-(t-length)/.11))
    elif instrument=='bass':
        seconds=length+.12
        t=np.arange(round(SR*seconds),dtype=np.float64)/SR
        result=(np.sin(2*np.pi*f*t)+.21*np.sin(2*np.pi*2*f*t))
        result*=(1-np.exp(-t/.005))*np.exp(-t/.12)*np.where(t<length,1,np.exp(-(t-length)/.04))
    elif instrument=='bell':
        seconds=length+.4
        t=np.arange(round(SR*seconds),dtype=np.float64)/SR
        result=(np.sin(2*np.pi*f*t)+.13*np.sin(2*np.pi*f*3.002*t))*np.exp(-t/.24)*(1-np.exp(-t/.003))
        result*=np.where(t<length,1,np.exp(-(t-length)/.08))
    else: raise ValueError(instrument)
    result*=np.minimum(1,(seconds-t)/.035)
    return result.astype(np.float32)

def drum(kind):
    seconds={'shaker':.08,'brush':.15,'kick':.14,'rim':.055}[kind]
    t=np.arange(round(SR*seconds),dtype=np.float64)/SR
    noise=RNG.normal(0,1,len(t))
    if kind=='shaker':
        high=np.concatenate([[0],np.diff(noise)])*.45
        result=high*np.exp(-t/.016)*(1-np.exp(-t/.001))*.23
    elif kind=='brush':
        high=noise-np.convolve(noise,np.ones(10)/10,mode='same')
        result=high*np.exp(-t/.035)*(1-np.exp(-t/.003))*.24
        result+=np.sin(2*np.pi*190*t)*np.exp(-t/.02)*.08
    elif kind=='kick':
        phase=2*np.pi*(122*t+1.5*(1-np.exp(-t/.018)))
        result=np.sin(phase)*np.exp(-t/.032)*(1-np.exp(-t/.001))*.48
    else:
        result=(np.sin(2*np.pi*1080*t)+.4*np.sin(2*np.pi*1840*t))*np.exp(-t/.009)*(1-np.exp(-t/.0006))*.2
    result*=np.minimum(1,(seconds-t)/.008)
    return result.astype(np.float32)

def build(kind,bars):
    length=bars*4*BEAT
    n=round(length*SR)
    mix=np.zeros((n+round(TAIL*SR),2),dtype=np.float32)
    events=[]
    cache={}
    def add(time,signal,gain,pan,tag,midi=None):
        start=round(time*SR)
        if start<0:return
        end=min(len(mix),start+len(signal))
        signal=signal[:end-start]
        # Equal power panning, clipped to gentle stereo width.
        angle=(pan+1)*np.pi/4
        mix[start:end,0]+=signal*(gain*np.cos(angle))
        mix[start:end,1]+=signal*(gain*np.sin(angle))
        events.append(dict(time=round(time,6),instrument=tag,midi=midi,gain=round(gain,6),pan=pan))
    def instrument(midi,beats,ins):
        key=(midi,beats,ins)
        if key not in cache:cache[key]=note(midi,beats*BEAT,ins)
        return cache[key]
    for bar in range(bars):
        local=bar%8
        root,chord,arp=CHORDS[local]
        section=bar//8
        melody=(A if section in (0,2) else B)[local]
        if kind=='award':melody=(A if section==0 else B)[local]
        # Four-bar dynamics breathe; melody is a foreground line above accompaniment.
        dynamic=[.94,1,.97,1.03][bar%4]
        for beat,midi,duration in melody:
            gain=.108*dynamic*(1.07 if kind=='award' else 1)
            add((bar*4+beat)*BEAT,instrument(midi,duration,'piano'),gain,-.04,'melody',midi)
            if kind=='award' and bar>=8 and beat in (0,3):
                add((bar*4+beat)*BEAT,instrument(midi+12,.34,'bell'),.012,.25,'upper-answer',midi+12)
        # Guitar arpeggios provide a genuinely separate moving layer.
        for index,beat in enumerate([0,.5,1.5,2,2.5,3.5]):
            midi=arp[index]
            add((bar*4+beat)*BEAT,instrument(midi,.68,'guitar'),.039*(.86 if index in (1,4) else 1),-.30 if index%2==0 else .30,'guitar',midi)
        # Short voiced chords, not an organ pad or low-frequency drone.
        for beat in (1,3):
            for index,midi in enumerate(chord):
                add((bar*4+beat+index*.017)*BEAT,instrument(midi,.48,'piano'),.023*(1.12 if kind=='award' else 1),.18,'chord',midi)
        for beat,midi in [(0,root),(2,root+7)]:
            add((bar*4+beat)*BEAT,instrument(midi,.38,'bass'),.041,0,'short-bass',midi)
        for eighth in range(8):
            add((bar*4+eighth*.5)*BEAT,drum('shaker'),.014*(.65 if eighth%2==0 else 1),.35,'shaker')
        for beat in (0,2):add((bar*4+beat)*BEAT,drum('kick'),.025,0,'soft-kick')
        for beat in (1,3):
            add((bar*4+beat)*BEAT,drum('brush'),.032,-.18,'brush')
            add((bar*4+beat+.025)*BEAT,drum('rim'),.026,.13,'wood-rim')
        # The return of A has a sparse guitar response; it is not just a repeated loop.
        if section==2 and local in (1,3,5,7):
            for beat,midi in [(2.5,chord[0]+12),(3.5,chord[1]+12)]:
                add((bar*4+beat)*BEAT,instrument(midi,.32,'guitar'),.018,.42,'counter-answer',midi)
    # Small room reflections. Finite feed-forward taps wrap at the musical period,
    # so the end and start are one continuous repeating arrangement.
    dry=mix.copy()
    for delay,level,cross in [(0.047,.11,False),(0.071,.085,True),(.113,.055,True),(.181,.032,False)]:
        offset=round(delay*SR)
        source=dry[:-offset,::-1] if cross else dry[:-offset]
        mix[offset:]+=source*level
    tail=mix[n:]
    mix[:len(tail)]+=tail
    mix=mix[:n]
    # Remove tiny DC offsets without clipping/transient limiting.
    mix-=mix.mean(axis=0)
    before=float(np.max(np.abs(mix)))
    mix*=.58/before
    return mix,length,events

def wav(path,data):
    with wave.open(str(path),'wb') as handle:
        handle.setnchannels(2);handle.setsampwidth(2);handle.setframerate(SR)
        handle.writeframes(np.clip(data*32767,-32768,32767).astype('<i2').tobytes())

def one_shot(kind):
    """Game-feedback synthesis, not a claim of a recorded audience."""
    length=5.6 if kind=='applause' else 2.8
    data=np.zeros((round(length*SR),2),dtype=np.float32)
    def put(at,sound,gain,pan):
        start=round(at*SR);end=min(len(data),start+len(sound));angle=(pan+1)*np.pi/4
        data[start:end,0]+=sound[:end-start]*gain*np.cos(angle)
        data[start:end,1]+=sound[:end-start]*gain*np.sin(angle)
    if kind=='jingle':
        for i,midi in enumerate([74,78,81,86]):
            put(.08+i*.245,note(midi,.48 if i<3 else .95,'piano'),.15,0)
        for i,midi in enumerate([62,66,69]):put(.82+i*.018,note(midi,.6,'guitar'),.045,(-1+i)*.23)
    else:
        for person in range(18):
            pan=-.85+person/17*1.7;interval=RNG.uniform(.34,.57);at=RNG.uniform(.02,.38)
            while at<4.6:
                t=np.arange(round(SR*.19))/SR
                noise=RNG.normal(0,1,len(t));low=np.convolve(noise,np.ones(8)/8,mode='same')
                body=(noise-low)*np.exp(-t/.024)*(1-np.exp(-t/.0008))
                second=np.roll(body,round(SR*.007))* .34;second[:round(SR*.007)]=0
                sound=(body+second).astype(np.float32)
                gain=RNG.uniform(.009,.018)*(1 if at<3.4 else max(.1,(4.6-at)/1.2))
                put(at,sound,gain,pan)
                put(at+.065,sound,gain*.13,-pan*.6)
                at+=interval+RNG.uniform(-.06,.06)
    tail=np.minimum(1,np.arange(len(data))/SR/.05)*np.minimum(1,(len(data)-np.arange(len(data)))/SR/.35)
    data*=tail[:,None]
    data-=data.mean(axis=0)
    data*=.49/np.max(np.abs(data))
    return data,length

def main():
    OUT.mkdir(parents=True,exist_ok=True);ASSETS.mkdir(parents=True,exist_ok=True)
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    manifest={};payload={}
    for kind,bars,title in [('contest',32,'把作品摆出来'),('award',16,'今天值得高兴')]:
        data,duration,events=build(kind,bars)
        source=OUT/(kind+'-sunny-0143.wav');wav(source,data)
        target=ASSETS/(kind+'-sunny-0143.mp3')
        subprocess.run([ffmpeg,'-v','error','-y','-i',str(source),'-codec:a','libmp3lame','-q:a','4','-metadata','title='+title,'-metadata','artist=Sun Jian original local score',str(target)],check=True)
        decoded=subprocess.check_output([ffmpeg,'-v','error','-i',str(target),'-ac','2','-ar',str(SR),'-f','f32le','-'])
        decoded_array=np.frombuffer(decoded,dtype='<f4').reshape(-1,2)
        peak=float(np.max(np.abs(decoded_array)));rms=float(np.sqrt(np.mean(decoded_array.astype(np.float64)**2)))
        assert 0.01<peak<.8 and 0.02<rms<.25
        assert not np.any(np.abs(decoded_array)>=.999)
        assert abs(len(decoded_array)/SR-duration)<.02
        jump=float(np.max(np.abs(decoded_array[0]-decoded_array[-1])))
        manifest[kind]=dict(title=title,bars=bars,bpm=BPM,duration=duration,decodedDuration=len(decoded_array)/SR,peak=peak,rms=rms,clippedSamples=0,boundarySampleJump=jump,events=len(events),instruments=sorted({e['instrument'] for e in events}),mp3Bytes=target.stat().st_size,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),recommendedGain=.24)
        (OUT/(kind+'-events.json')).write_text(json.dumps(events,ensure_ascii=False,indent=2),encoding='utf-8')
        payload[kind]=dict(mime='audio/mpeg',data=base64.b64encode(target.read_bytes()).decode('ascii'),duration=duration,loopStart=0,loopEnd=duration,bpm=BPM,title=title,recommendedGain=.24)
    effects={}
    for kind in ['jingle','applause']:
        data,duration=one_shot(kind)
        source=OUT/(kind+'-0143.wav');wav(source,data)
        target=ASSETS/(kind+'-0143.mp3')
        subprocess.run([ffmpeg,'-v','error','-y','-i',str(source),'-codec:a','libmp3lame','-q:a','4',str(target)],check=True)
        effects[kind]=dict(mime='audio/mpeg',data=base64.b64encode(target.read_bytes()).decode('ascii'),duration=duration,loop=False,recommendedGain=.24 if kind=='jingle' else .18,synthetic=True)
    wrapper=ASSETS/'music-celebration-0143.js'
    wrapper.write_text('/* Original local compositions and synthetic feedback; generated by scripts/generate-sunny-0143.py. No third-party samples. */\n(function(root){root.JourneyMusicData=Object.assign(root.JourneyMusicData||{},'+json.dumps(payload,separators=(',',':'),ensure_ascii=False)+');root.JourneyCelebrationFx='+json.dumps(effects,separators=(',',':'),ensure_ascii=False)+';})(window);\n',encoding='utf-8')
    assert wrapper.stat().st_size<6*1024*1024
    result=dict(originalCompositions=True,externalSamples=False,humanListening=False,sampleRate=SR,tracks=manifest,syntheticEffects={key:{k:v for k,v in fx.items() if k!='data'} for key,fx in effects.items()},payloadBytes=wrapper.stat().st_size)
    (OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
