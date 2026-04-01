# Git Remote Setup Script for Family Tree Web App (PowerShell)
# Usage: .\scripts\setup-git-remote.ps1 YOUR_GITHUB_USERNAME

param(
    [Parameter(Mandatory=$true)]
    [string]$Username
)

$RepoName = "family-tree-web-app"
$RepoUrl = "https://github.com/$Username/$RepoName.git"

Write-Host "🔧 Setting up Git remote for: $RepoUrl" -ForegroundColor Green

# Remove existing origin if any
git remote remove origin 2>$null

# Add new origin
git remote add origin $RepoUrl

Write-Host "✅ Remote added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "1. Push to your repository:" -ForegroundColor White
Write-Host "   git push -u origin master" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Set up GitHub Secrets for CI/CD:" -ForegroundColor White
Write-Host "   - VERCEL_TOKEN" -ForegroundColor Gray
Write-Host "   - VERCEL_ORG_ID" -ForegroundColor Gray
Write-Host "   - VERCEL_PROJECT_ID" -ForegroundColor Gray
Write-Host "   - PROD_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - PROD_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Your production-ready app will be deployed automatically!" -ForegroundColor Green
