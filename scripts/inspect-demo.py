import sys, json, subprocess, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'artifacts/python-packages'))
import imageio_ffmpeg
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();video=ROOT/'output/media/榫间_游戏演示.mp4'
info=subprocess.run([ffmpeg,'-hide_banner','-i',str(video)],capture_output=True,text=True,errors='replace').stderr
duration=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',info);seconds=sum(float(v)*m for v,m in zip(duration.groups(),[3600,60,1]));assert seconds<120
assert '1600x900' in info and 'h264' in info
subprocess.run([ffmpeg,'-v','error','-i',str(video),'-f','null','-'],check=True)
folder=ROOT/'artifacts/video-frames';folder.mkdir(exist_ok=True)
for t in sorted(set([0,1,7,22,38,55,75,int(seconds)-2])):subprocess.run([ffmpeg,'-v','error','-y','-ss',str(t),'-i',str(video),'-frames:v','1',str(folder/f'frame-{t}.png')],check=True)
print(json.dumps({'duration':seconds,'resolution':'1600x900','codec':'H.264','bytes':video.stat().st_size,'decodedAllFrames':True}))
