# Masaüstüne "Origami Studio" kısayolu oluşturur (ve launcher klasörüne bir "durdur" kısayolu).
#   powershell -ExecutionPolicy Bypass -File launcher\kisayol-olustur.ps1
$Here = $PSScriptRoot
$Root = Split-Path -Parent $Here
$Icon = Join-Path $Here 'origami-studio.ico'
$Wscript = Join-Path $env:WINDIR 'System32\wscript.exe'
$Desktop = [Environment]::GetFolderPath('Desktop')  # OneDrive'a yönlendirilmiş masaüstünü de bulur
$Shell = New-Object -ComObject WScript.Shell

function New-Shortcut($path, $vbs, $desc) {
  $s = $Shell.CreateShortcut($path)
  $s.TargetPath = $Wscript
  $s.Arguments = "`"$(Join-Path $Here $vbs)`""
  $s.WorkingDirectory = $Root
  $s.IconLocation = "$Icon,0"
  $s.Description = $desc
  $s.Save()
  Write-Output "Oluşturuldu: $path"
}

New-Shortcut (Join-Path $Desktop 'Origami Studio.lnk') 'baslat.vbs' 'Origami Studio — sunucuyu başlat ve Chrome''da aç'
New-Shortcut (Join-Path $Here 'Origami Studio - Durdur.lnk') 'durdur.vbs' 'Origami Studio sunucusunu durdur'
