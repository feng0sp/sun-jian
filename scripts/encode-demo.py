import sys, json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'artifacts/python-packages'))
import imageio_ffmpeg
manifest=json.loads((ROOT/'artifacts/video/manifest.json').read_text('utf-8'))
out=ROOT/'output/media/榫间_游戏演示.mp4';out.parent.mkdir(parents=True,exist_ok=True)
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
args=[ffmpeg,'-hide_banner','-y','-ss','0.8','-i',manifest['videoPath'],'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','medium','-crf','20','-movflags','+faststart','-an',str(out)]
subprocess.run(args,check=True)
print(str(out))
