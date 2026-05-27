# Run this script in PowerShell AS ADMINISTRATOR to install MongoDB Server
# Right-click PowerShell -> Run as administrator, then:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   cd E:\EtharaAI\scripts
#   .\install-mongodb.ps1

Write-Host "Installing MongoDB Server via winget (requires admin)..." -ForegroundColor Cyan
winget install MongoDB.Server --accept-source-agreements --accept-package-agreements --silent

Write-Host "Starting MongoDB service..." -ForegroundColor Cyan
$service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($service) {
  if ($service.Status -ne "Running") {
    Start-Service MongoDB
  }
  Write-Host "MongoDB service is running." -ForegroundColor Green
} else {
  Write-Host "MongoDB service not found. Check installation or start manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "After install, set in backend/.env:" -ForegroundColor Cyan
Write-Host "  USE_EMBEDDED_MONGO=false"
Write-Host "  MONGODB_URI=mongodb://127.0.0.1:27017/team-task-manager"
