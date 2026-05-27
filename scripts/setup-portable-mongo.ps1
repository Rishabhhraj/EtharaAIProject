# Downloads portable MongoDB into tools/mongodb (no admin required)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$toolsDir = Join-Path $root "tools\mongodb"
$dataDir = Join-Path $root "data\mongodb"
$zipPath = Join-Path $toolsDir "mongodb.zip"
$version = "7.0.14"
$url = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-$version.zip"

New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

$mongod = Get-ChildItem -Path $toolsDir -Recurse -Filter "mongod.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mongod) {
  Write-Host "Portable MongoDB already present: $($mongod.FullName)"
  exit 0
}

Write-Host "Downloading MongoDB $version (this may take several minutes)..."
$maxRetries = 5
for ($i = 1; $i -le $maxRetries; $i++) {
  try {
    curl.exe -L $url -o $zipPath --retry 5 --retry-delay 3 --connect-timeout 30
    if (Test-Path $zipPath) { break }
  } catch {
    Write-Host "Attempt $i failed: $_"
    if ($i -eq $maxRetries) { throw }
    Start-Sleep -Seconds 5
  }
}

Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
Remove-Item $zipPath -Force
Write-Host "Done. mongod.exe is under tools/mongodb"
