# Environment Setup Script for Family Tree Web App (Windows PowerShell)
# Usage: .\scripts\setup-env-simple.ps1 [environment]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development"
)

$ErrorActionPreference = "Stop"

# Get project root
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$EnvFile = "$ProjectRoot\.env.$Environment"

Write-Host "Setting up $Environment environment for Family Tree Web App" -ForegroundColor Green
Write-Host "Project root: $ProjectRoot" -ForegroundColor Blue

# Check if required tools are available
function Test-Dependencies {
    Write-Host "Checking dependencies..." -ForegroundColor Blue
    
    try {
        $null = Get-Command openssl -ErrorAction Stop
        Write-Host "OpenSSL found" -ForegroundColor Green
    }
    catch {
        Write-Host "OpenSSL is required but not found. Please install OpenSSL for Windows." -ForegroundColor Red
        Write-Host "Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Blue
        exit 1
    }
    
    try {
        $null = Get-Command node -ErrorAction Stop
        Write-Host "Node.js found" -ForegroundColor Green
    }
    catch {
        Write-Host "Node.js is required but not found. Please install Node.js." -ForegroundColor Red
        Write-Host "Download from: https://nodejs.org/" -ForegroundColor Blue
        exit 1
    }
    
    Write-Host "Dependencies check passed" -ForegroundColor Green
}

# Generate secure keys
function New-SecureKeys {
    Write-Host "Generating secure keys..." -ForegroundColor Blue
    
    try {
        # Generate encryption key (32 characters)
        $EncryptionKey = openssl rand -base64 32 | ForEach-Object { $_ -replace "[=+/]", "" } | ForEach-Object { $_.Substring(0, [Math]::Min(32, $_.Length)) }
        
        # Generate JWT secret (64 characters)
        $JWTSecret = openssl rand -base64 64 | ForEach-Object { $_ -replace "[=+/]", "" } | ForEach-Object { $_.Substring(0, [Math]::Min(64, $_.Length)) }
        
        Write-Host "Generated encryption key and JWT secret" -ForegroundColor Green
        
        return @{
            EncryptionKey = $EncryptionKey.Trim()
            JWTSecret = $JWTSecret.Trim()
        }
    }
    catch {
        Write-Host "Failed to generate secure keys: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Create environment file
function New-EnvironmentFile {
    param(
        [string]$Path,
        [hashtable]$Keys
    )
    
    if (Test-Path $Path) {
        Write-Host "Environment file already exists: $Path" -ForegroundColor Yellow
        $choice = Read-Host "Do you want to overwrite it? (y/N)"
        if ($choice -notmatch '^[Yy]$') {
            Write-Host "Skipping environment file creation" -ForegroundColor Blue
            return
        }
    }
    
    Write-Host "Creating environment file: $Path" -ForegroundColor Blue
    
    $EnvContent = @"
# Environment Configuration
VITE_ENVIRONMENT=$Environment
NODE_ENV=$Environment

# Supabase Configuration (REQUIRED)
# Get these from your Supabase project dashboard
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DNA_ANALYSIS=true
VITE_ENABLE_COLLABORATION=true
VITE_ENABLE_OFFLINE_MODE=true

# Monitoring and Error Tracking
VITE_ENABLE_ERROR_TRACKING=false
VITE_ENABLE_PERFORMANCE_MONITORING=false
VITE_SENTRY_DSN=

# Third-party Services (Optional)
VITE_GOOGLE_ANALYTICS_ID=
VITE_HOTJAR_ID=
VITE_INTERCOM_APP_ID=

# AI Services (Optional)
VITE_OPENAI_API_KEY=
VITE_REPLICATE_API_TOKEN=
VITE_HUGGING_FACE_API_KEY=

# Storage Services (Optional)
VITE_AWS_S3_BUCKET=
VITE_AWS_ACCESS_KEY_ID=
VITE_AWS_SECRET_ACCESS_KEY=
VITE_AWS_REGION=us-east-1

# Email Services (Optional)
VITE_SENDGRID_API_KEY=
VITE_EMAIL_FROM=noreply@familytree.com

# Security Keys (Auto-generated)
VITE_ENCRYPTION_KEY=$($Keys.EncryptionKey)
VITE_JWT_SECRET=$($Keys.JWTSecret)

# Development Only
VITE_DEBUG_MODE=true
VITE_MOCK_API=true
"@
    
    try {
        $EnvContent | Out-File -FilePath $Path -Encoding UTF8
        Write-Host "Environment file created: $Path" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to create environment file: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Update environment file for specific environment
function Update-EnvironmentFile {
    param([string]$Path)
    
    if (Test-Path $Path) {
        $Content = Get-Content $Path
        
        switch ($Environment) {
            "production" {
                Write-Host "Configuring production environment..." -ForegroundColor Blue
                $Content = $Content -replace 'VITE_API_BASE_URL=http://localhost:3001/api', 'VITE_API_BASE_URL=https://api.familytree.com'
                $Content = $Content -replace 'VITE_API_TIMEOUT=10000', 'VITE_API_TIMEOUT=20000'
                $Content = $Content -replace 'VITE_API_RETRY_ATTEMPTS=3', 'VITE_API_RETRY_ATTEMPTS=5'
                $Content = $Content -replace 'VITE_ENABLE_ERROR_TRACKING=false', 'VITE_ENABLE_ERROR_TRACKING=true'
                $Content = $Content -replace 'VITE_ENABLE_PERFORMANCE_MONITORING=false', 'VITE_ENABLE_PERFORMANCE_MONITORING=true'
                $Content = $Content -replace 'VITE_DEBUG_MODE=true', 'VITE_DEBUG_MODE=false'
                $Content = $Content -replace 'VITE_MOCK_API=true', 'VITE_MOCK_API=false'
            }
            "staging" {
                Write-Host "Configuring staging environment..." -ForegroundColor Blue
                $Content = $Content -replace 'VITE_API_BASE_URL=http://localhost:3001/api', 'VITE_API_BASE_URL=https://staging-api.familytree.com'
                $Content = $Content -replace 'VITE_API_TIMEOUT=10000', 'VITE_API_TIMEOUT=15000'
                $Content = $Content -replace 'VITE_ENABLE_ERROR_TRACKING=false', 'VITE_ENABLE_ERROR_TRACKING=true'
                $Content = $Content -replace 'VITE_ENABLE_PERFORMANCE_MONITORING=false', 'VITE_ENABLE_PERFORMANCE_MONITORING=true'
                $Content = $Content -replace 'VITE_DEBUG_MODE=true', 'VITE_DEBUG_MODE=false'
                $Content = $Content -replace 'VITE_MOCK_API=true', 'VITE_MOCK_API=false'
            }
        }
        
        $Content | Out-File -FilePath $Path -Encoding UTF8
        Write-Host "$Environment environment configured" -ForegroundColor Green
    }
}

# Show next steps
function Show-NextSteps {
    Write-Host ""
    Write-Host "Environment setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Edit .env.$Environment and add your actual values:"
    Write-Host "   - VITE_SUPABASE_URL (from Supabase dashboard)"
    Write-Host "   - VITE_SUPABASE_ANON_KEY (from Supabase dashboard)"
    Write-Host "   - Optional: Add your API keys for third-party services"
    Write-Host ""
    Write-Host "2. Install dependencies:"
    Write-Host "   npm install"
    Write-Host ""
    Write-Host "3. Start development server:"
    Write-Host "   npm run dev"
    Write-Host ""
    Write-Host "4. For production deployment:"
    Write-Host "   - Vercel: vercel env add VITE_SUPABASE_URL production"
    Write-Host "   - Check docs/ENVIRONMENT-SETUP.md for detailed instructions"
    Write-Host ""
}

# Main execution
function Main {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Family Tree Web App Environment Setup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Test-Dependencies
    $Keys = New-SecureKeys
    New-EnvironmentFile -Path $EnvFile -Keys $Keys
    Update-EnvironmentFile -Path $EnvFile
    Show-NextSteps
}

# Run main function
Main
