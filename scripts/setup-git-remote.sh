#!/bin/bash

# Git Remote Setup Script for Family Tree Web App
# Usage: ./scripts/setup-git-remote.sh YOUR_GITHUB_USERNAME

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GitHub username"
    echo "Usage: ./scripts/setup-git-remote.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

USERNAME=$1
REPO_NAME="family-tree-web-app"
REPO_URL="https://github.com/$USERNAME/$REPO_NAME.git"

echo "🔧 Setting up Git remote for: $REPO_URL"

# Remove existing origin if any
git remote remove origin 2>/dev/null || true

# Add new origin
git remote add origin $REPO_URL

echo "✅ Remote added successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Push to your repository:"
echo "   git push -u origin master"
echo ""
echo "2. Set up GitHub Secrets for CI/CD:"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_PROJECT_ID"
echo "   - PROD_SUPABASE_URL"
echo "   - PROD_SUPABASE_ANON_KEY"
echo ""
echo "🚀 Your production-ready app will be deployed automatically!"
