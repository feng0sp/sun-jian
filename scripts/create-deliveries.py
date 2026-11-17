"""Create portable release archives, with SHA-256 and zip integrity checks."""
from pathlib import Path
import hashlib, json, subprocess, zipfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/packages';OUT.mkdir(parents=True,exist_ok=True)
def archive(name,folder,prefix,extra=None):
    target=OUT/name
    resolved=folder.resolve();assert resolved.is_relative_to(ROOT)
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(folder.rglob('*')):
            if p.is_file():z.write(p,str(Path(prefix)/p.relative_to(folder)))
        for name,content in (extra or {}).items():z.writestr(str(Path(prefix)/name),content)
    with zipfile.ZipFile(target) as z:assert z.testzip() is None
    return target
web_readme='榫间 · 网页离线版\n\n双击 index.html，用 Chrome 或 Edge 打开即可试玩，无需联网。\n全部图形与脚本已随包提供。\n六个主关卡可拆开与合回；借位实验需要先移动一格。\n旋转观察、选木、选择方向。可用透视、提示、撤销、重试。\n1-5 选木；W/S 上下；A/D 左右；Q/E 前后。\nH 提示；Z 撤销；R 重试；V 透视。\n\n这是教学化设计原型，未进行真实玩家与木工专家校核。\n'
web=archive('榫间_网页离线版.zip',ROOT/'dist','榫间_网页离线版',{'开始试玩.txt':web_readme})
desktop_folder=ROOT/'artifacts/desktop/SunJian-win32-x64'
assert (desktop_folder/'SunJian.exe').exists() and (desktop_folder/'resources/app.asar').exists()
desktop=archive('榫间_Windows离线版.zip',desktop_folder,'榫间_Windows离线版')
source=OUT/'榫间_源代码.zip'
tracked=subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=ROOT).decode('utf-8').split('\0')
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for rel in sorted(set(tracked)):
        if not rel:continue
        p=(ROOT/rel).resolve();assert p.is_relative_to(ROOT)
        if p.is_file():z.write(p,str(Path('榫间_源代码')/rel))
with zipfile.ZipFile(source) as z:assert z.testzip() is None
pdf=ROOT/'output/pdf/榫间_游戏设计说明.pdf';video=ROOT/'output/media/榫间_游戏演示.mp4'
files=[web,desktop,source,pdf,video]
manifest={
    'title':'榫间 · 榫卯解谜','version':'0.3.0','main_levels':6,'main_modes':['拆开','合回'],'experiment':'借位 · 锁钥',
    'site':'https://sun-jian-wood-puzzle.beige-acorn-8677.chatgpt.site',
    'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
    'files':[{'path':str(p.relative_to(ROOT/'output')),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
}
(ROOT/'output/交付清单.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({'verifiedZipIntegrity':True,'files':[{'name':p.name,'MiB':round(p.stat().st_size/1048576,2)} for p in files]},ensure_ascii=True))
