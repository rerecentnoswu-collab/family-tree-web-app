# 🚀 DEPLOYMENT GUIDE
**Family Tree Application - Production Setup**
Version: 1.0.0
Updated: 2026-04-01

---

## 📋 DEPLOYMENT CHECKLIST

### ✅ Prerequisites
- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] Domain name configured (optional)
- [ ] SSL certificate (recommended)

### ✅ Security Setup
- [ ] Environment variables configured
- [ ] Row Level Security enabled
- [ ] Authentication providers configured
- [ ] Database migrations applied

---

## 🔧 ENVIRONMENT CONFIGURATION

### 1. **Supabase Setup**
```sql
-- Run these SQL commands in Supabase SQL Editor
-- File: security-setup.sql

-- Add user_id column
ALTER TABLE persons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can read own data" ON persons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON persons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON persons FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON persons FOR DELETE USING (auth.uid() = user_id);
```

### 2. **Environment Variables**
Create `.env.production`:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_PHOTO_RECOGNITION=true
VITE_ENABLE_DNA_PROCESSING=true
```

### 3. **Build Configuration**
Update `vite.config.ts` for production:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Don't expose source maps in production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          ai: ['@tensorflow/tfjs', 'face-api.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
```

---

## 🌐 DEPLOYMENT OPTIONS

### Option 1: **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Add all variables from .env.production
```

### Option 2: **Netlify**
```bash
# Build
npm run build

# Deploy to Netlify
# Upload dist/ folder
# Configure environment variables in Netlify dashboard
```

### Option 3: **AWS S3 + CloudFront**
```bash
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/*"
```

### Option 4: **Self-Hosted (Docker)**
```dockerfile
# Dockerfile
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

---

## 🔒 PRODUCTION SECURITY

### 1. **Supabase Security**
```sql
-- Additional security policies
CREATE POLICY "Users cannot impersonate others"
  ON persons FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable audit logging
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for audit logging
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. **Application Security**
```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Add security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

---

## 📊 MONITORING & LOGGING

### 1. **Application Monitoring**
```typescript
// Add error tracking
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance:', entry.name, entry.duration);
  }
});
observer.observe({ entryTypes: ['measure', 'navigation'] });
```

### 2. **Database Monitoring**
```sql
-- Enable query logging
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_duration = on;

-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🚀 DEPLOYMENT SCRIPTS

### Automated Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting deployment..."

# Check environment
if [ ! -f ".env.production" ]; then
  echo "❌ .env.production not found"
  exit 1
fi

# Build application
echo "📦 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Deploy to chosen platform
case $1 in
  "vercel")
    vercel --prod
    ;;
  "netlify")
    netlify deploy --prod --dir=dist
    ;;
  "aws")
    aws s3 sync dist/ s3://$BUCKET_NAME --delete
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    ;;
  *)
    echo "❌ Unknown deployment platform"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"
```

---

## 🔧 MAINTENANCE

### Regular Tasks
- **Weekly**: Check error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Security audit and penetration testing
- **Annually**: Review and update security policies

### Backup Strategy
```bash
# Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Application backup
tar -czf app-backup-$(date +%Y%m%d).tar.gz dist/ .env.production
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues
1. **Authentication failures**: Check Supabase auth configuration
2. **Database connection**: Verify environment variables
3. **Build errors**: Check Node.js version compatibility
4. **Performance issues**: Monitor database queries and AI processing

### Emergency Procedures
1. **Security breach**: Immediately revoke all API keys
2. **Data loss**: Restore from latest backup
3. **Service outage**: Check Supabase status page
4. **High traffic**: Enable rate limiting and caching

---

## 🎯 SUCCESS METRICS

### Key Performance Indicators
- **Uptime**: >99.9%
- **Response time**: <2 seconds
- **Error rate**: <0.1%
- **Security incidents**: 0
- **User satisfaction**: >4.5/5

### Monitoring Dashboard
- Real-time user count
- API response times
- Error rates by feature
- Database performance
- AI processing metrics

---

## 🏁 CONCLUSION

Your Family Tree application is now **production-ready** with:
- ✅ Enterprise-grade security
- ✅ Scalable architecture
- ✅ Comprehensive monitoring
- ✅ Automated deployment
- ✅ Disaster recovery plan

**Ready for production deployment!** 🚀

---

**Next Steps:**
1. Choose deployment platform
2. Configure production environment
3. Run deployment script
4. Monitor initial performance
5. Set up alerting and monitoring
