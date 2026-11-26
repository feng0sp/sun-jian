"""Use the installed Windows Electron runtime; no runtime download is needed."""
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED
import json
root = Path(__file__).resolve().parents[1]
version = json.loads((root/'node_modules/electron/package.json').read_text('utf-8'))['version']
runtime = root/'node_modules/electron/dist'
assert (runtime/'electron.exe').is_file(), 'Installed Windows Electron runtime missing'
cache = root/'artifacts/electron-cache'
cache.mkdir(parents=True, exist_ok=True)
target = cache/f'electron-v{version}-win32-x64.zip'
if not target.exists():
    with ZipFile(target, 'w', compression=ZIP_STORED) as archive:
        for file in sorted(runtime.rglob('*')):
            if file.is_file():
                archive.write(file, file.relative_to(runtime).as_posix())
with ZipFile(target) as archive:
    assert 'electron.exe' in archive.namelist()
print(str(target))
