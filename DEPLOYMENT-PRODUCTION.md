# Production Deployment Guide

This guide covers the complete production deployment process for the Family Tree Web App with enterprise-grade features.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Database Setup](#database-setup)
5. [Build Process](#build-process)
6. [Deployment Options](#deployment-options)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Performance Optimization](#performance-optimization)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js 18+ 
- npm or pnpm
- Git
- Docker (optional)
- Kubernetes access (for containerized deployment)

### Required Services
- Supabase account (database and auth)
- Vercel account (hosting) or AWS/GCP/Azure
- Sentry account (error monitoring)
- Domain name (optional)

### Security Requirements
- SSL certificate
- API keys and secrets management
- Environment variable encryption
- Access control policies

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/family-tree-app.git
cd family-tree-app
npm install
```

### 2. Environment Variables

Create `.env.production`:

```bash
# Environment
VITE_ENVIRONMENT=production
NODE_ENV=production

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

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

# Monitoring
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_SENTRY_DSN=https://your-sentry-dsn

# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Security
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
VITE_JWT_SECRET=your-jwt-secret-key

# Build Info
VITE_APP_VERSION=1.0.0
VITE_BUILD_NUMBER=20240401-001
```

### 3. Security Hardening

```bash
# Generate secure keys
openssl rand -base64 32  # For encryption key
openssl rand -base64 64  # For JWT secret
```

## Security Configuration

### 1. Content Security Policy

The application includes a comprehensive CSP configured in `src/utils/security.ts`:

```javascript
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://vercel.live"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:", "blob:"],
  'connect-src': ["'self'", "https://api.supabase.co", "https://familytree.com"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
};
```

### 2. Security Headers

Configure these headers in your hosting platform:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: [generated CSP]
```

### 3. Authentication Security

- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration
- Rate limiting on auth endpoints
- CSRF protection for state-changing operations
- Secure, HttpOnly cookies for tokens

## Database Setup

### 1. Supabase Production Setup

```sql
-- Enable RLS on all tables
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;

-- Production RLS policies
CREATE POLICY "Users can view own family data" ON persons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family data" ON persons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family data" ON persons
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 2. Database Security

- Enable SSL connections
- Use connection pooling
- Implement read replicas for scaling
- Regular backups with encryption
- Audit logging enabled

### 3. Performance Optimization

```sql
-- Add production indexes
CREATE INDEX CONCURRENTLY idx_persons_user_id_created ON persons(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_persons_birth_date ON persons(birth_date) WHERE birth_date IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_relationships_person_id ON family_relationships(person_id);

-- Partition large tables if needed
CREATE TABLE persons_partitioned (
  LIKE persons INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE persons_2024 PARTITION OF persons_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

## Build Process

### 1. Production Build

```bash
# Clean build
npm run build

# Build with specific environment
NODE_ENV=production VITE_ENVIRONMENT=production npm run build

# Verify build output
ls -la dist/
```

### 2. Build Optimization

The Vite configuration includes:

- Code splitting for optimal loading
- Tree shaking to remove unused code
- Minification with Terser
- Asset optimization
- Source maps disabled for production

### 3. Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Analyze bundle
npm run build -- --analyze
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Configure Environment Variables**
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### Option 2: Docker Deployment

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Build and Deploy**
```bash
docker build -t family-tree-app .
docker run -p 80:80 family-tree-app
```

### Option 3: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: family-tree-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: family-tree-app
  template:
    metadata:
      labels:
        app: family-tree-app
    spec:
      containers:
      - name: family-tree-app
        image: family-tree-app:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
```

## Monitoring and Logging

### 1. Error Monitoring with Sentry

```javascript
// src/services/monitoring.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.exception) {
      event.exception.values?.forEach(exception => {
        delete exception.stacktrace;
      });
    }
    return event;
  },
});
```

### 2. Performance Monitoring

```javascript
// Performance metrics collection
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      const metrics = {
        loadTime: entry.loadEventEnd - entry.loadEventStart,
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        firstPaint: entry.responseStart - entry.requestStart,
      };
      
      // Send to analytics
      gtag('event', 'performance_metrics', metrics);
    }
  }
});

observer.observe({ entryTypes: ['navigation'] });
```

### 3. Health Checks

```bash
# Health endpoint
curl https://familytree.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-04-01T12:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "services": {
    "supabase": "healthy",
    "storage": "healthy",
    "monitoring": "healthy"
  }
}
```

## Performance Optimization

### 1. Caching Strategy

- **Static Assets**: 1 year cache with content hashing
- **API Responses**: 5-minute cache for GET requests
- **Database Queries**: Query result caching
- **CDN**: Global CDN distribution

### 2. Image Optimization

```javascript
// Image optimization configuration
export const imageConfig = {
  formats: ['webp', 'avif', 'jpg'],
  quality: 80,
  sizes: [320, 640, 960, 1280],
  placeholder: 'blur',
  loading: 'lazy',
};
```

### 3. Bundle Optimization

- **Code Splitting**: Route-based and component-based
- **Tree Shaking**: Remove unused dependencies
- **Dynamic Imports**: Load features on demand
- **Service Worker**: Offline caching

## Backup and Recovery

### 1. Database Backups

```bash
# Automated daily backups
pg_dump "$DATABASE_URL" | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup verification
gunzip -c backup_20240401.sql.gz | psql "$DATABASE_URL"
```

### 2. Application Backups

```bash
# Backup build artifacts and configuration
tar -czf backup_$(date +%Y%m%d).tar.gz dist/ .env.production vercel.json
```

### 3. Recovery Procedures

1. **Database Recovery**
```bash
# Restore from backup
gunzip -c backup_20240401.sql.gz | psql "$DATABASE_URL"
```

2. **Application Recovery**
```bash
# Redeploy application
vercel --prod
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### 2. Runtime Errors
- Check browser console for errors
- Verify environment variables
- Check network requests in dev tools
- Review Sentry error reports

#### 3. Performance Issues
- Analyze bundle size
- Check database query performance
- Monitor API response times
- Review Core Web Vitals

### Debugging Tools

```bash
# Local debugging
npm run dev

# Production debugging
vercel logs

# Database debugging
supabase db shell

# Performance debugging
npm run build -- --analyze
```

### Support Contacts

- **Technical Support**: tech-support@familytree.com
- **Security Issues**: security@familytree.com
- **Emergency**: +1-555-EMERG

## Maintenance Schedule

### Daily
- Backup verification
- Error log review
- Performance metrics check

### Weekly
- Security scan
- Dependency updates
- Performance optimization

### Monthly
- Database optimization
- SSL certificate renewal
- Security audit

### Quarterly
- Major updates
- Architecture review
- Disaster recovery testing

## Compliance and Auditing

### Data Protection
- GDPR compliance
- CCPA compliance
- Data retention policies
- Right to deletion

### Security Standards
- SOC 2 Type II
- ISO 27001
- OWASP Top 10
- Penetration testing

### Audit Trail
- All user actions logged
- Admin actions tracked
- Data access monitored
- Change management

---

For additional support or questions, please refer to the [GitHub repository](https://github.com/your-org/family-tree-app) or contact the development team.
