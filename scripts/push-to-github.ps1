# Push to GitHub using a Personal Access Token (PAT)
# GitHub no longer accepts account passwords for git/API.
#
# 1. Create PAT: https://github.com/settings/tokens (classic, repo scope)
# 2. Run in PowerShell:
#      $env:GITHUB_TOKEN = "ghp_your_token_here"
#      .\scripts\push-to-github.ps1

param(
  [string]$Token = $env:GITHUB_TOKEN,
  [string]$User = "Rishabhhraj",
  [string]$Repo = "team-task-manager"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

if (-not $Token) {
  Write-Host "Set GITHUB_TOKEN first (PAT with repo scope)." -ForegroundColor Yellow
  Write-Host '  $env:GITHUB_TOKEN = "ghp_..."'
  Write-Host "  .\scripts\push-to-github.ps1"
  exit 1
}

$headers = @{
  Authorization        = "Bearer $Token"
  "User-Agent"         = "team-task-manager-push"
  "X-GitHub-Api-Version" = "2022-11-28"
}

try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$User/$Repo" -Headers $headers | Out-Null
  Write-Host "Repository $User/$Repo exists."
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 404) {
    $body = @{
      name        = $Repo
      description = "Team Task Manager - MERN full-stack"
      private     = $false
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Created repository $User/$Repo"
  } else {
    throw
  }
}

Set-Location $root
git remote remove origin 2>$null
git remote add origin "https://github.com/${User}/${Repo}.git"
git -c http.extraHeader="Authorization: Bearer $Token" push -u origin main
Write-Host "Pushed to https://github.com/$User/$Repo" -ForegroundColor Green
