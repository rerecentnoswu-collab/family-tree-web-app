# Environment Variables and Secrets Setup Guide

This guide walks you through setting up environment variables and secrets for different deployment platforms.

## Table of Contents

1. [Environment Variables Overview](#environment-variables-overview)
2. [Local Development Setup](#local-development-setup)
3. [Vercel Setup](#vercel-setup)
4. [AWS Setup](#aws-setup)
5. [Docker Setup](#docker-setup)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## Environment Variables Overview

### Required Variables

```bash
# Core Configuration
VITE_ENVIRONMENT=production
NODE_ENV=production

# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
VITE_API_BASE_URL=https://api.familytree.com
VITE_API_TIMEOUT=20000
VITE_API_RETRY_ATTEMPTS=5
VITE_API_RETRY_DELAY=3000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DNA_ANALYSIS=true
VITE_ENABLE_COLLABORATION=true
VITE_ENABLE_OFFLINE_MODE=true

# Monitoring (Optional but Recommended)
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_SENTRY_DSN=https://your-sentry-dsn

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_HOTJAR_ID=123456
VITE_INTERCOM_APP_ID=abc123

# AI Services (Optional)
VITE_OPENAI_API_KEY=sk-...
VITE_REPLICATE_API_TOKEN=r8_...
VITE_HUGGING_FACE_API_KEY=hf_...

# Storage Services (Optional)
VITE_AWS_S3_BUCKET=your-bucket
VITE_AWS_ACCESS_KEY_ID=AKIA...
VITE_AWS_SECRET_ACCESS_KEY=...
VITE_AWS_REGION=us-east-1

# Email Services (Optional)
VITE_SENDGRID_API_KEY=SG.xyz...
VITE_EMAIL_FROM=noreply@familytree.com

# Security (Required for Production)
VITE_ENCRYPTION_KEY=your-32-character-key
VITE_JWT_SECRET=your-jwt-secret-key

# Build Information
VITE_APP_VERSION=1.0.0
VITE_BUILD_NUMBER=20240401-001
```

## Local Development Setup

### 1. Create Local Environment File

```bash
# Copy the example file
cp .env.example .env.local
```

### 2. Configure Local Variables

Edit `.env.local` with your development values:

```bash
# Development Environment
VITE_ENVIRONMENT=development
VITE_DEBUG_MODE=true
VITE_MOCK_API=true

# Use development Supabase instance
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key

# Development API
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_TIMEOUT=10000

# Development features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
```

### 3. Generate Development Keys

```bash
# Generate encryption key (32 characters)
openssl rand -base64 32

# Generate JWT secret (64 characters)
openssl rand -base64 64
```

### 4. Verify Setup

```bash
# Test environment variables
npm run dev

# Check if variables are loaded
curl http://localhost:3000/api/env-check
```

## Vercel Setup

### 1. Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

### 2. Link Project

```bash
cd family-tree-app
vercel link
```

### 3. Add Environment Variables

#### Method A: Using CLI

```bash
# Core variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_API_BASE_URL production
vercel env add VITE_ENCRYPTION_KEY production
vercel env add VITE_JWT_SECRET production

# Optional variables
vercel env add VITE_SENTRY_DSN production
vercel env add VITE_GOOGLE_ANALYTICS_ID production
vercel env add VITE_OPENAI_API_KEY production
```

#### Method B: Using Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add each variable with:
   - **Name**: Variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: Your secret value
   - **Environments**: Production, Preview, Development

### 4. Configure Production Values

```bash
# Production Supabase
vercel env add VITE_SUPABASE_URL production
# When prompted, enter: https://your-prod-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# When prompted, enter your production anon key

# Production API
vercel env add VITE_API_BASE_URL production
# When prompted, enter: https://api.familytree.com

# Security keys (generate new ones for production)
vercel env add VITE_ENCRYPTION_KEY production
# Generate with: openssl rand -base64 32

vercel env add VITE_JWT_SECRET production
# Generate with: openssl rand -base64 64
```

### 5. Verify Vercel Setup

```bash
# List all environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.production

# Deploy with environment variables
vercel --prod
```

## AWS Setup

### 1. AWS Systems Manager Parameter Store

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure
```

### 2. Store Secrets in Parameter Store

```bash
# Store Supabase URL
aws ssm put-parameter \
  --name "/familytree/prod/supabase-url" \
  --value "https://your-project.supabase.co" \
  --type "SecureString" \
  --description "Supabase project URL"

# Store Supabase Anon Key
aws ssm put-parameter \
  --name "/familytree/prod/supabase-anon-key" \
  --value "your-anon-key" \
  --type "SecureString" \
  --description "Supabase anonymous key"

# Store Encryption Key
aws ssm put-parameter \
  --name "/familytree/prod/encryption-key" \
  --value "your-32-character-key" \
  --type "SecureString" \
  --description "Application encryption key"
```

### 3. AWS ECS/EKS Deployment

Create a Kubernetes secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: familytree-secrets
type: Opaque
stringData:
  VITE_SUPABASE_URL: "https://your-project.supabase.co"
  VITE_SUPABASE_ANON_KEY: "your-anon-key"
  VITE_ENCRYPTION_KEY: "your-32-character-key"
  VITE_JWT_SECRET: "your-jwt-secret"
```

### 4. AWS Amplify Setup

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add environment variables
amplify env add
```

## Docker Setup

### 1. Create Docker Compose Override

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  app:
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - VITE_ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - VITE_JWT_SECRET=${JWT_SECRET}
      - VITE_SENTRY_DSN=${SENTRY_DSN}
```

### 2. Create Environment File

```bash
# .env.production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ENCRYPTION_KEY=your-32-character-key
JWT_SECRET=your-jwt-secret
SENTRY_DSN=your-sentry-dsn
```

### 3. Deploy with Docker

```bash
# Build and run with environment variables
docker-compose --env-file .env.production up --build -d

# Or use Docker secrets
docker secret create supabase-url supabase-url.txt
docker secret create supabase-key supabase-key.txt
```

## Security Best Practices

### 1. Generate Strong Keys

```bash
# Encryption Key (32 characters)
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# JWT Secret (64 characters)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

echo "Encryption Key: $ENCRYPTION_KEY"
echo "JWT Secret: $JWT_SECRET"
```

### 2. Validate Environment Variables

Create a validation script:

```javascript
// scripts/validate-env.js
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_ENCRYPTION_KEY',
  'VITE_JWT_SECRET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

console.log('All required environment variables are present');
```

### 3. Use Environment-Specific Files

```bash
# Development
.env.development

# Staging  
.env.staging

# Production
.env.production

# Local overrides (never commit)
.env.local
```

### 4. Rotate Secrets Regularly

```bash
# Create a rotation script
#!/bin/bash
# scripts/rotate-secrets.sh

echo "Rotating production secrets..."

# Generate new keys
NEW_ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEW_JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Update Vercel
vercel env add VITE_ENCRYPTION_KEY production
# Enter new key when prompted

vercel env add VITE_JWT_SECRET production
# Enter new secret when prompted

echo "Secret rotation completed!"
```

## Troubleshooting

### Common Issues

#### 1. Variables Not Loading

```bash
# Check if variables are set
echo $VITE_SUPABASE_URL

# Verify in application
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

#### 2. Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### 3. Vercel Deployment Issues

```bash
# Check Vercel logs
vercel logs

# Verify environment variables
vercel env ls

# Redeploy
vercel --prod --force
```

#### 4. Permission Issues

```bash
# Check file permissions
ls -la .env*

# Fix permissions
chmod 600 .env.local
chmod 644 .env.example
```

### Debug Environment Variables

Create a debug endpoint:

```javascript
// src/debug/env-debug.ts (only in development)
export function debugEnvironment() {
  if (import.meta.env.DEV) {
    console.log('Environment Variables:', {
      VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      VITE_ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY ? 'SET' : 'NOT SET',
    });
  }
}
```

### Validation Checklist

- [ ] All required variables are set
- [ ] Supabase URL is accessible
- [ ] API keys are valid
- [ ] Encryption keys are 32+ characters
- [ ] JWT secret is 64+ characters
- [ ] No sensitive data in code
- [ ] Environment files are in .gitignore
- [ ] Production secrets differ from development
- [ ] Variables are properly masked in logs
- [ ] Application builds successfully

## Quick Start Script

Create a setup script for new environments:

```bash
#!/bin/bash
# scripts/setup-env.sh

ENVIRONMENT=${1:-development}

echo "Setting up $ENVIRONMENT environment..."

# Copy appropriate env file
cp .env.example .env.$ENVIRONMENT

# Generate keys
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Add to env file
echo "VITE_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.$ENVIRONMENT
echo "VITE_JWT_SECRET=$JWT_SECRET" >> .env.$ENVIRONMENT

echo "Environment setup complete!"
echo "Please edit .env.$ENVIRONMENT with your specific values."
```

Usage:
```bash
# Setup development environment
./scripts/setup-env.sh development

# Setup production environment  
./scripts/setup-env.sh production
```

---

For platform-specific instructions, refer to the official documentation:
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [AWS Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store.html)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
