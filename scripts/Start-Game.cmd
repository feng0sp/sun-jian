@echo off
setlocal
set "SUN_JIAN_ROOT=%~dp0sun-jian"
if not exist "%SUN_JIAN_ROOT%\index.html" (
  echo Game files are missing. Extract the complete offline package first.
  pause
  exit /b 1
)
powershell.exe -NoLogo -NoProfile -Command "$entry=Join-Path $env:SUN_JIAN_ROOT 'index.html'; $url=([System.Uri]::new($entry)).AbsoluteUri+'?journey=1'; $candidates=@((Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),(Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'),(Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),(Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe')); $browser=$candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1; if(-not $browser){Write-Error 'Chrome or Edge is required'; exit 1}; Start-Process -FilePath $browser -ArgumentList $url"
if errorlevel 1 (
  echo Please open sun-jian\index.html in Chrome or Edge.
  pause
  exit /b 1
)
endlocal
