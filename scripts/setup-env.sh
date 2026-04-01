#!/bin/bash

# Environment Setup Script for Family Tree Web App
# Usage: ./scripts/setup-env.sh [environment]

set -e

ENVIRONMENT=${1:-development}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Setting up $ENVIRONMENT environment for Family Tree Web App"
echo "📁 Project root: $PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is required but not installed. Please install OpenSSL."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed. Please install Node.js."
        exit 1
    fi
    
    print_status "Dependencies check passed"
}

# Generate secure keys
generate_keys() {
    print_info "Generating secure keys..."
    
    # Generate encryption key (32 characters)
    ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Generate JWT secret (64 characters)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    
    print_status "Generated encryption key and JWT secret"
}

# Create environment file
create_env_file() {
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    
    if [ -f "$env_file" ]; then
        print_warning "Environment file already exists: $env_file"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping environment file creation"
            return
        fi
    fi
    
    print_info "Creating environment file: $env_file"
    
    cat > "$env_file" << EOF
# Environment Configuration
VITE_ENVIRONMENT=$ENVIRONMENT
NODE_ENV=$ENVIRONMENT

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
VITE_ENCRYPTION_KEY=$ENCRYPTION_KEY
VITE_JWT_SECRET=$JWT_SECRET

# Development Only
VITE_DEBUG_MODE=true
VITE_MOCK_API=true
EOF
    
    print_status "Environment file created: $env_file"
}

# Setup production-specific configuration
setup_production() {
    if [ "$ENVIRONMENT" = "production" ]; then
        print_info "Configuring production environment..."
        
        # Update production values
        sed -i 's|VITE_API_BASE_URL=http://localhost:3001/api|VITE_API_BASE_URL=https://api.familytree.com|' "$PROJECT_ROOT/.env.production"
        sed -i 's|VITE_API_TIMEOUT=10000|VITE_API_TIMEOUT=20000|' "$PROJECT_ROOT/.env.production"
        sed -i 's|VITE_API_RETRY_ATTEMPTS=3|VITE_API_RETRY_ATTEMPTS=5|' "$PROJECT_ROOT/.env.production"
        sed -i 's|VITE_ENABLE_ERROR_TRACKING=false|VITE_ENABLE_ERROR_TRACKING=true|' "$PROJECT_ROOT/.env.production"
        sed -i 's|VITE_ENABLE_PERFORMANCE_MONITORING=false|VITE_ENABLE_PERFORMANCE_MONITORING=true|' "$PROJECT_ROOT/.env.production"
        sed -i 's|VITE_DEBUG_MODE=true|VITE_DEBUG_MODE=false|' "$PROJECT_ROOT/.env.production"
        sed -i 's|VITE_MOCK_API=true|VITE_MOCK_API=false|' "$PROJECT_ROOT/.env.production"
        
        print_status "Production environment configured"
    fi
}

# Setup staging-specific configuration
setup_staging() {
    if [ "$ENVIRONMENT" = "staging" ]; then
        print_info "Configuring staging environment..."
        
        # Update staging values
        sed -i 's|VITE_API_BASE_URL=http://localhost:3001/api|VITE_API_BASE_URL=https://staging-api.familytree.com|' "$PROJECT_ROOT/.env.staging"
        sed -i 's|VITE_API_TIMEOUT=10000|VITE_API_TIMEOUT=15000|' "$PROJECT_ROOT/.env.staging"
        sed -i 's|VITE_ENABLE_ERROR_TRACKING=false|VITE_ENABLE_ERROR_TRACKING=true|' "$PROJECT_ROOT/.env.staging"
        sed -i 's|VITE_ENABLE_PERFORMANCE_MONITORING=false|VITE_ENABLE_PERFORMANCE_MONITORING=true|' "$PROJECT_ROOT/.env.staging"
        sed -i 's|VITE_DEBUG_MODE=true|VITE_DEBUG_MODE=false|' "$PROJECT_ROOT/.env.staging"
        sed -i 's|VITE_MOCK_API=true|VITE_MOCK_API=false|' "$PROJECT_ROOT/.env.staging"
        
        print_status "Staging environment configured"
    fi
}

# Validate environment file
validate_env_file() {
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    
    print_info "Validating environment file..."
    
    # Check if file exists
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        exit 1
    fi
    
    # Check for required variables
    local required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_ENCRYPTION_KEY" "VITE_JWT_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required variables: ${missing_vars[*]}"
        exit 1
    fi
    
    print_status "Environment file validation passed"
}

# Create local environment file
create_local_env() {
    if [ "$ENVIRONMENT" = "development" ]; then
        local local_env_file="$PROJECT_ROOT/.env.local"
        
        if [ ! -f "$local_env_file" ]; then
            print_info "Creating local environment file..."
            ln -sf ".env.development" "$local_env_file"
            print_status "Created .env.local symlink to .env.development"
        fi
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    print_info "🎉 Environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.$ENVIRONMENT and add your actual values:"
    echo "   - VITE_SUPABASE_URL (from Supabase dashboard)"
    echo "   - VITE_SUPABASE_ANON_KEY (from Supabase dashboard)"
    echo "   - Optional: Add your API keys for third-party services"
    echo ""
    echo "2. Install dependencies:"
    echo "   npm install"
    echo ""
    echo "3. Start development server:"
    echo "   npm run dev"
    echo ""
    echo "4. For production deployment:"
    echo "   - Vercel: vercel env add VITE_SUPABASE_URL production"
    echo "   - Check docs/ENVIRONMENT-SETUP.md for detailed instructions"
    echo ""
}

# Main execution
main() {
    echo "========================================"
    echo "  Family Tree Web App Environment Setup"
    echo "========================================"
    echo ""
    
    check_dependencies
    generate_keys
    create_env_file
    setup_production
    setup_staging
    validate_env_file
    create_local_env
    show_next_steps
}

# Run main function
main "$@"
