# Origami Studio başlatıcı (Windows)
#  - Sunucu zaten çalışıyorsa yalnızca Chrome'u açar
#  - Çalışmıyorsa: gerekirse bağımlılıkları kurar, sunucuyu arka planda (penceresiz) başlatır,
#    hazır olunca Chrome'da açar
#  - Varsayılan: DİNAMİK mod (Vite geliştirme sunucusu; kod değişince arayüz anında güncellenir).
#    -Prod ile eski davranış: arayüzü derleyip statik (build edilmiş) olarak sunar.
#  - cloudflared kuruluysa telefon için geçici HTTPS tüneli açar; adres panoya kopyalanır ve
#    launcher\logs\tunel-url.txt dosyasına yazılır. -NoTunnel ile tünel açılmaz.
# Kullanım: masaüstü kısayolu (baslat.vbs üzerinden) ya da  powershell -File launcher\baslat.ps1 [-NoBrowser] [-Prod] [-NoTunnel]
param([switch]$NoBrowser, [switch]$Prod, [switch]$NoTunnel)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Port = 5180
$Url = "http://localhost:$Port"
$LogDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir 'sunucu.log'
$ErrLog = Join-Path $LogDir 'sunucu-hata.log'
$BuildLog = Join-Path $LogDir 'derleme.log'
$TunnelLog = Join-Path $LogDir 'tunel.log'
$TunnelUrlFile = Join-Path $LogDir 'tunel-url.txt'

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
  $needBuild = $Prod -and -not (Test-Path $dist)
  if ($Prod -and -not $needBuild) {
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
  $serverArgs = if ($Prod) { @('server/index.js', '--prod') } else { @('server/index.js') }
  Start-Process -FilePath $node -ArgumentList $serverArgs -WorkingDirectory $Root `
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

# ---------------------------------------------------------------- telefon için HTTPS tüneli
function Find-Cloudflared {
  $c = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  foreach ($p in @("$env:LOCALAPPDATA\Microsoft\WinGet\Links\cloudflared.exe", "$env:ProgramFiles\cloudflared\cloudflared.exe", "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe")) {
    if ($p -and (Test-Path $p)) { return $p }
  }
  return $null
}

function Read-TunnelUrl {
  if (-not (Test-Path $TunnelLog)) { return $null }
  $m = Select-String -Path $TunnelLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($m) { return $m.Matches[0].Value }
  return $null
}

if (-not $NoTunnel) {
  $cf = Find-Cloudflared
  if ($cf) {
    $running = Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match [regex]::Escape("localhost:$Port") }
    $url = $null
    if ($running) { $url = Read-TunnelUrl }
    else {
      Remove-Item $TunnelLog -ErrorAction SilentlyContinue
      Start-Process -FilePath $cf -ArgumentList @('tunnel', '--url', "http://localhost:$Port") -WindowStyle Hidden `
        -RedirectStandardError $TunnelLog -RedirectStandardOutput (Join-Path $LogDir 'tunel-out.log') | Out-Null
      for ($i = 0; $i -lt 40 -and -not $url; $i++) { Start-Sleep -Milliseconds 500; $url = Read-TunnelUrl }
    }
    if ($url) {
      Set-Content -Path $TunnelUrlFile -Value $url -Encoding utf8
      Set-Clipboard -Value $url
      Add-Type -AssemblyName PresentationFramework
      [System.Windows.MessageBox]::Show("Telefon adresi (panoya kopyalandı):`n`n$url`n`nAdresi bilen herkes Studio'ya erişebilir; işin bitince Durdur kısayolunu kullan.", 'Origami Studio', 'OK', 'Information') | Out-Null
    }
  }
}
