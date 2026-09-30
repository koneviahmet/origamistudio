# Origami Studio sunucusunu durdurur (port 5180'i dinleyen Node sürecini kapatır).
param([switch]$Quiet)
$Port = 5180
$conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
$stopped = 0
foreach ($c in $conns) {
  $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
  if ($p -and $p.ProcessName -eq 'node') {
    Stop-Process -Id $p.Id -Force
    $stopped++
  }
}
if (-not $Quiet) {
  Add-Type -AssemblyName PresentationFramework
  $msg = if ($stopped) { 'Origami Studio sunucusu durduruldu.' } else { 'Çalışan bir Origami Studio sunucusu bulunamadı.' }
  [System.Windows.MessageBox]::Show($msg, 'Origami Studio', 'OK', 'Information') | Out-Null
}
