# Origami Studio başlatıcı (Windows)
#  - Sunucu zaten çalışıyorsa yalnızca Chrome'u açar
#  - Çalışmıyorsa: gerekirse bağımlılıkları kurar ve arayüzü derler, sunucuyu arka planda
#    (penceresiz) üretim modunda başlatır, hazır olunca Chrome'da açar
# Kullanım: masaüstü kısayolu (baslat.vbs üzerinden) ya da  powershell -File launcher\baslat.ps1 [-NoBrowser]
param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Port = 5180
$Url = "http://localhost:$Port"
$LogDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir 'sunucu.log'
$ErrLog = Join-Path $LogDir 'sunucu-hata.log'
$BuildLog = Join-Path $LogDir 'derleme.log'

function Test-Server {
  try {
    $r = Invoke-WebRequest -Uri "$Url/api/projects" -UseBasicParsing -TimeoutSec 2
    return $r.StatusCode -eq 200
  } catch { return $false }
}

function Show-Error([string]$msg) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($msg, 'Origami Studio', 'OK', 'Error') | Out-Null
}

function Find-Node {
  $c = Get-Command node -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  foreach ($p in @("$env:ProgramFiles\nodejs\node.exe", "${env:ProgramFiles(x86)}\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")) {
    if ($p -and (Test-Path $p)) { return $p }
  }
  return $null
}

function Find-Chrome {
  foreach ($p in @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")) {
    if ($p -and (Test-Path $p)) { return $p }
  }
  foreach ($hive in @('HKLM:', 'HKCU:')) {
    $reg = Get-ItemProperty "$hive\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue
    if ($reg -and $reg.'(default)' -and (Test-Path $reg.'(default)')) { return $reg.'(default)' }
  }
  return $null
}

if (-not (Test-Server)) {
  $node = Find-Node
  if (-not $node) {
    Show-Error "Node.js bulunamadı.`nhttps://nodejs.org adresinden LTS sürümünü kurup tekrar deneyin."
    exit 1
  }
  $nodeDir = Split-Path -Parent $node
  $env:PATH = "$nodeDir;$env:PATH"

  # İlk çalıştırma: bağımlılıklar
  if (-not (Test-Path (Join-Path $Root 'node_modules\vite'))) {
    & (Join-Path $nodeDir 'npm.cmd') install --prefix $Root *> $BuildLog
    if ($LASTEXITCODE -ne 0) { Show-Error "Bağımlılıklar kurulamadı.`nAyrıntı: $BuildLog"; exit 1 }
  }

  # Arayüz derlemesi eksik ya da kaynak kod daha yeniyse yeniden derle
  $dist = Join-Path $Root 'web\dist\index.html'
  $needBuild = -not (Test-Path $dist)
  if (-not $needBuild) {
    $built = (Get-Item $dist).LastWriteTime
    $newer = Get-ChildItem (Join-Path $Root 'web') -Recurse -File |
      Where-Object { $_.FullName -notlike '*\web\dist\*' -and $_.LastWriteTime -gt $built } |
      Select-Object -First 1
    $needBuild = [bool]$newer
  }
  if ($needBuild) {
    Push-Location $Root
    try { & $node (Join-Path $Root 'node_modules\vite\bin\vite.js') build *> $BuildLog } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Show-Error "Arayüz derlenemedi.`nAyrıntı: $BuildLog"; exit 1 }
  }

  # Sunucuyu penceresiz başlat (bu betik kapansa da çalışmaya devam eder)
  Start-Process -FilePath $node -ArgumentList @('server/index.js', '--prod') -WorkingDirectory $Root `
    -WindowStyle Hidden -RedirectStandardOutput $Log -RedirectStandardError $ErrLog | Out-Null

  $ok = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Server) { $ok = $true; break }
  }
  if (-not $ok) {
    Show-Error "Sunucu başlatılamadı (port $Port kullanımda olabilir).`nAyrıntı: $ErrLog"
    exit 1
  }
}

if (-not $NoBrowser) {
  $chrome = Find-Chrome
  if ($chrome) { Start-Process -FilePath $chrome -ArgumentList @('--new-window', $Url) }
  else { Start-Process $Url }  # Chrome yoksa varsayılan tarayıcı
}
