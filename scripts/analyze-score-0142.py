"""Measure actual captured score waveforms; this does not replace human listening."""
import array, json, math, pathlib, subprocess
import imageio_ffmpeg

root=pathlib.Path(__file__).resolve().parent.parent
folder=root/'output/polish-0142/music'
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
results=[]
for name in ['journey','home','store','workshop','gathering']:
    source=folder/(name+'.webm')
    raw=subprocess.check_output([ffmpeg,'-v','error','-i',str(source),'-ac','1','-ar','24000','-f','f32le','-'])
    samples=array.array('f',raw)
    rms=math.sqrt(sum(n*n for n in samples)/len(samples))
    peak=max(map(abs,samples))
    assert 0.001<peak<0.2, (name,peak)
    windows=[math.sqrt(sum(n*n for n in samples[i:i+2400])/len(samples[i:i+2400])) for i in range(0,len(samples),2400)]
    result=dict(profile=name,seconds=len(samples)/24000,peak=peak,rms=rms,peakDb=20*math.log10(peak),rmsDb=20*math.log10(rms),quietWindowFraction=sum(r<0.0002 for r in windows)/len(windows),clippedSamples=sum(abs(n)>=.999 for n in samples))
    assert result['clippedSamples']==0
    subprocess.run([ffmpeg,'-v','error','-y','-i',str(source),'-c:a','libmp3lame','-q:a','3',str(folder/(name+'.mp3'))],check=True)
    results.append(result)
(folder/'waveform-verification.json').write_text(json.dumps(dict(actualProductionCaptures=True,humanListening=False,results=results),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False))
