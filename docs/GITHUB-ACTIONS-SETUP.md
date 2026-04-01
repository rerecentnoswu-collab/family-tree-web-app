# GitHub Actions CI/CD Setup Guide

This guide walks you through setting up the GitHub Actions CI/CD pipeline for automated testing, security scanning, and deployment.

## 🔧 Required GitHub Secrets

Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** and add the following secrets:

### **Vercel Deployment Secrets**

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create a new token with "Full Access" scope
   - Copy the token value

2. **VERCEL_ORG_ID**
   - Get from: Vercel dashboard → Settings → General
   - Copy your Organization ID

3. **VERCEL_PROJECT_ID**
   - Get from: Vercel dashboard → Your Project → Settings → General
   - Copy your Project ID

### **Supabase Secrets**

4. **STAGING_SUPABASE_URL**
   - Your staging Supabase project URL
   - Format: `https://your-staging-project.supabase.co`

5. **STAGING_SUPABASE_ANON_KEY**
   - Your staging Supabase anonymous key
   - Get from: Supabase dashboard → Project Settings → API

6. **PROD_SUPABASE_URL**
   - Your production Supabase project URL
   - Format: `https://your-prod-project.supabase.co`

7. **PROD_SUPABASE_ANON_KEY**
   - Your production Supabase anonymous key
   - Get from: Supabase dashboard → Project Settings → API

### **Monitoring Secrets**

8. **STAGING_SENTRY_DSN**
   - Your Sentry DSN for staging environment
   - Get from: Sentry dashboard → Your Project → Settings → Client Keys (DSN)

9. **PROD_SENTRY_DSN**
   - Your Sentry DSN for production environment
   - Get from: Sentry dashboard → Your Project → Settings → Client Keys (DSN)

10. **GOOGLE_ANALYTICS_ID**
    - Your Google Analytics 4 Measurement ID
    - Format: `G-XXXXXXXXXX`

### **Optional Secrets**

11. **SLACK_WEBHOOK**
    - Your Slack webhook URL for deployment notifications
    - Get from: Slack workspace → Apps → Incoming Webhooks

## 🚀 Pipeline Triggers

The CI/CD pipeline runs on:

### **Automatic Triggers**
- **Push to `main` branch** → Full pipeline + Production deployment
- **Push to `develop` branch** → Full pipeline + Staging deployment
- **Pull requests to `main`** → Testing only (no deployment)

### **Manual Triggers**
- You can also trigger workflows manually from GitHub Actions tab

## 🔄 Pipeline Stages

### **1. Testing Stage** (`test` job)
- **Multi-node testing** (Node.js 18, 20)
- **Type checking** with TypeScript
- **Unit tests** with Vitest
- **Integration tests**
- **Coverage reporting** to Codecov

### **2. E2E Testing Stage** (`e2e` job)
- **Cypress end-to-end tests**
- **User journey testing**
- **Cross-browser testing**

### **3. Security Stage** (`security` job)
- **Trivy vulnerability scanning**
- **npm audit** for security vulnerabilities
- **SARIF report upload** to GitHub Security tab

### **4. Deployment Stages**

#### **Staging Deployment** (`deploy-staging` job)
- **Triggers**: Push to `develop` branch
- **Build**: Staging environment variables
- **Deploy**: Vercel staging environment
- **Environment**: `staging`

#### **Production Deployment** (`deploy-production` job)
- **Triggers**: Push to `main` branch
- **Build**: Production environment variables
- **Deploy**: Vercel production environment
- **Smoke tests**: Health checks
- **Notifications**: Slack deployment success

### **5. Performance Testing** (`performance` job)
- **Triggers**: After production deployment
- **Lighthouse CI** performance audits
- **Core Web Vitals** monitoring
- **Performance report** upload

## 🛠️ Environment Configuration

### **Development Environment**
```yaml
VITE_ENVIRONMENT: development
VITE_DEBUG_MODE: true
VITE_MOCK_API: true
VITE_ENABLE_ERROR_TRACKING: false
VITE_ENABLE_PERFORMANCE_MONITORING: false
```

### **Staging Environment**
```yaml
VITE_ENVIRONMENT: staging
VITE_API_BASE_URL: https://staging-api.familytree.com
VITE_API_TIMEOUT: 15000
VITE_ENABLE_ERROR_TRACKING: true
VITE_ENABLE_PERFORMANCE_MONITORING: true
VITE_DEBUG_MODE: false
VITE_MOCK_API: false
```

### **Production Environment**
```yaml
VITE_ENVIRONMENT: production
VITE_API_BASE_URL: https://api.familytree.com
VITE_API_TIMEOUT: 20000
VITE_API_RETRY_ATTEMPTS: 5
VITE_ENABLE_ERROR_TRACKING: true
VITE_ENABLE_PERFORMANCE_MONITORING: true
VITE_DEBUG_MODE: false
VITE_MOCK_API: false
```

## 📊 Monitoring and Alerts

### **Build Status**
- **GitHub Actions** dashboard shows real-time build status
- **Branch protection** rules prevent merging failed builds

### **Security Monitoring**
- **GitHub Security tab** shows vulnerability reports
- **Dependabot** automatically creates PRs for security updates
- **Trivy scans** container images for vulnerabilities

### **Performance Monitoring**
- **Lighthouse CI** runs performance audits
- **Core Web Vitals** thresholds enforced
- **Performance regression** detection

### **Deployment Notifications**
- **Slack integration** for deployment alerts
- **Email notifications** for build failures
- **GitHub status checks** for PR validation

## 🔍 Troubleshooting

### **Common Issues**

#### **Build Failures**
```bash
# Check build logs in GitHub Actions
# Look for:
# - TypeScript errors
# - Dependency installation failures
# - Environment variable issues
```

#### **Deployment Failures**
```bash
# Check Vercel deployment logs
# Verify:
# - Vercel token is valid
# - Project ID and Org ID are correct
# - Environment variables are set
```

#### **Test Failures**
```bash
# Run tests locally
npm run test:run

# Check test coverage
npm run test:coverage

# Run E2E tests
npm run cypress:run
```

#### **Security Scan Failures**
```bash
# Fix npm audit issues
npm audit fix

# Update dependencies
npm update

# Review Trivy scan results
```

### **Debugging Steps**

1. **Check GitHub Actions logs**
   - Navigate to Actions tab
   - Click on failed workflow run
   - Review job logs for errors

2. **Verify secrets**
   - Check GitHub repository secrets
   - Ensure all required secrets are set
   - Validate secret values

3. **Local testing**
   - Reproduce issues locally
   - Check environment configuration
   - Validate build process

4. **Rollback deployment**
   - Use Vercel dashboard to rollback
   - Or redeploy previous commit
   - Investigate root cause

## 📋 Best Practices

### **Repository Management**
- **Branch protection** enabled for `main`
- **Required status checks** for CI/CD
- **Pull request reviews** required
- **Automated merges** disabled

### **Secret Management**
- **Rotate secrets** regularly
- **Use least privilege** principle
- **Audit secret access** periodically
- **Never commit secrets** to repository

### **Performance Optimization**
- **Monitor build times**
- **Optimize bundle sizes**
- **Use caching** strategies
- **Parallelize jobs** where possible

### **Security**
- **Keep dependencies** updated
- **Monitor vulnerability** reports
- **Use security scanning** tools
- **Follow security** best practices

## 🚀 Quick Setup Checklist

- [ ] Create GitHub repository
- [ ] Add all required secrets
- [ ] Configure branch protection rules
- [ ] Set up staging Supabase project
- [ ] Set up production Supabase project
- [ ] Configure Sentry for error tracking
- [ ] Set up Google Analytics
- [ ] Configure Slack webhook (optional)
- [ ] Test CI/CD pipeline with a commit
- [ ] Verify deployment to staging
- [ ] Verify deployment to production

---

## 📞 Support

For issues with:
- **GitHub Actions**: https://github.community/c/github-actions
- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **Sentry**: https://sentry.io/support

For application-specific issues, create an issue in the GitHub repository.
