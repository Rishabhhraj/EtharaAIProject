$root = Split-Path $PSScriptRoot -Parent
$dataDir = Join-Path $root "data\mongodb"
$logDir = Join-Path $root "data\logs"
$mongod = Get-ChildItem (Join-Path $root "tools\mongodb") -Recurse -Filter "mongod.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $mongod) {
  Write-Host "mongod.exe not found. Run scripts\setup-portable-mongo.ps1 first." -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Force -Path $dataDir, $logDir | Out-Null

$existing = Get-Process mongod -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "mongod already running (PID $($existing.Id))"
  exit 0
}

Start-Process -FilePath $mongod.FullName -ArgumentList @(
  "--dbpath", "`"$dataDir`"",
  "--logpath", "`"$(Join-Path $logDir 'mongod.log')`"",
  "--bind_ip", "127.0.0.1",
  "--port", "27017"
) -WindowStyle Hidden

Start-Sleep -Seconds 3
Write-Host "MongoDB started on mongodb://127.0.0.1:27017"
