"""Bundle the self-contained desktop web build, with integrity metadata."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
output = root / 'output' / ('campaign-' + version.replace('.', ''))
output.mkdir(parents=True, exist_ok=True)
target = output / ('sun-jian-' + version + '-offline.zip')
files = sorted(p for p in (root / 'dist').rglob('*') if p.is_file())
manifest = {str(p.relative_to(root / 'dist')).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
with ZipFile(target, 'w', compression=ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, 'sun-jian/' + path.relative_to(root / 'dist').as_posix())
    archive.writestr('sun-jian/SHA256.json', json.dumps(manifest, indent=2))
    archive.writestr('sun-jian/开始游玩.txt', '榫间 ' + version + '\n\n解压全部文件后，用桌面版 Chrome 或 Edge 打开 index.html。无需登录或联网。\n点击继续旅程或开始新旅程；点击画面箭头切换场景，H 查看热点。\n三维拆装需启用 WebGL；不可用时可使用精确方向操作。\n网页存档保存在当前浏览器中，在线版与离线版的存档不自动互通。可在设置内下载旅程存档，再从文件恢复；恢复前可预览，也可撤回导入。\n请保留文件夹结构，勿只复制 index.html。\n')
    launcher = root / 'scripts/Start-Game.cmd'
    if launcher.is_file():
        archive.writestr('Start-Game.cmd', launcher.read_bytes())
with ZipFile(target) as archive:
    assert archive.testzip() is None
print(json.dumps({'archive': str(target), 'files': len(files), 'bytes': target.stat().st_size}))
