# 🚀 Quick Start Guide

Get your Family Tree Web App running in production in minutes with this step-by-step guide.

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase account** - [Sign up free](https://supabase.com/)
- **Vercel account** (for deployment) - [Sign up free](https://vercel.com/)

## ⚡ One-Command Setup

### Option 1: Windows (PowerShell)
```powershell
# Clone and setup
git clone https://github.com/your-org/family-tree-app.git
cd family-tree-app
.\scripts\setup-env.ps1 production
```

### Option 2: macOS/Linux (Bash)
```bash
# Clone and setup
git clone https://github.com/your-org/family-tree-app.git
cd family-tree-app
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh production
```

## 🔧 Step-by-Step Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/family-tree-app.git
cd family-tree-app
```

### 2. Run Environment Setup Script
```bash
# For development
./scripts/setup-env.sh development

# For production
./scripts/setup-env.sh production

# For staging
./scripts/setup-env.sh staging
```

### 3. Configure Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Navigate to **Project Settings → API**
4. Copy your **Project URL** and **anon key**
5. Edit your `.env.production` file:

```bash
# Replace these with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Validate Environment
```bash
npm run validate-env production
```

### 6. Test Locally
```bash
npm run dev
```

Visit `http://localhost:3000` to verify everything works.

### 7. Deploy to Production

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

#### Option B: Manual Build
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## 🌐 Production Deployment

### Vercel Setup (5 minutes)

1. **Install Vercel CLI**
```bash
npm i -g vercel
vercel login
```

2. **Deploy Project**
```bash
vercel --prod
```

3. **Add Production Secrets**
```bash
# Add your Supabase credentials
vercel env add VITE_SUPABASE_URL production
# When prompted, enter: https://your-project-id.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# When prompted, enter your anon key

# Add security keys (generated automatically)
vercel env add VITE_ENCRYPTION_KEY production
vercel env add VITE_JWT_SECRET production
```

4. **Verify Deployment**
```bash
# Check deployment logs
vercel logs

# Test your live app
curl https://your-app.vercel.app/api/health
```

### Alternative Deployment Options

#### Docker Deployment
```bash
# Build Docker image
docker build -t family-tree-app .

# Run container
docker run -p 80:80 family-tree-app
```

#### Static Hosting (Netlify, GitHub Pages, etc.)
```bash
# Build for production
npm run build

# Deploy the 'dist' folder
# Upload contents of 'dist/' to your hosting provider
```

## 🔑 Environment Variables Explained

### Required Variables (Must Set)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_ENCRYPTION_KEY` - Auto-generated 32-character key
- `VITE_JWT_SECRET` - Auto-generated 64-character secret

### Optional but Recommended
- `VITE_SENTRY_DSN` - For error monitoring
- `VITE_GOOGLE_ANALYTICS_ID` - For analytics
- `VITE_OPENAI_API_KEY` - For AI story features

## 🧪 Testing Your Setup

### Validate Environment
```bash
# Validate production environment
npm run validate-env production

# Validate development environment
npm run validate-env development
```

### Run Tests
```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run cypress:run
```

### Health Check
```bash
# Test local health endpoint
curl http://localhost:3000/api/health

# Test production health endpoint
curl https://your-app.vercel.app/api/health
```

## 🔒 Security Checklist

### ✅ Production Security
- [ ] Environment variables are set in hosting platform (not in code)
- [ ] Supabase RLS policies are enabled
- [ ] SSL/HTTPS is enabled
- [ ] Security headers are configured
- [ ] API keys are properly secured

### ✅ Development Security
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets committed to repository
- [ ] Development API endpoints are not exposed
- [ ] Mock data is used for sensitive features

## 🚨 Troubleshooting

### Common Issues

#### "Environment variables not found"
```bash
# Check if env file exists
ls -la .env*

# Validate environment
npm run validate-env

# Recreate environment file
./scripts/setup-env.sh production
```

#### "Supabase connection failed"
```bash
# Verify Supabase URL format
curl https://your-project.supabase.co/rest/v1/

# Check API key format
# Should start with 'eyJ' and be long
```

#### "Build failed"
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### "Deployment failed"
```bash
# Check Vercel logs
vercel logs

# Verify environment variables
vercel env ls

# Redeploy
vercel --prod --force
```

### Get Help

- 📖 [Full Documentation](./docs/ENVIRONMENT-SETUP.md)
- 🐛 [Report Issues](https://github.com/your-org/family-tree-app/issues)
- 💬 [Discussions](https://github.com/your-org/family-tree-app/discussions)
- 📧 [Support](mailto:support@familytree.com)

## 🎯 Next Steps

1. **Customize Your App**
   - Add your family data
   - Configure features you want to use
   - Customize the UI

2. **Set Up Analytics**
   - Add Google Analytics
   - Configure error monitoring with Sentry
   - Set up performance monitoring

3. **Enable Advanced Features**
   - AI story generation (requires OpenAI API key)
   - DNA analysis integration
   - Collaborative research features

4. **Scale Your App**
   - Set up custom domain
   - Configure CDN
   - Set up monitoring alerts

## 📊 Production Features

Your deployed app includes:

- ✅ **Enterprise Security** - CSRF protection, XSS prevention, secure headers
- ✅ **Performance Optimization** - Code splitting, lazy loading, caching
- ✅ **Error Monitoring** - Comprehensive error tracking and reporting
- ✅ **Responsive Design** - Mobile-first, accessible UI
- ✅ **Offline Support** - PWA features with offline functionality
- ✅ **AI Features** - Relationship discovery, story generation, DNA analysis
- ✅ **Collaboration** - Real-time research tools and team features

---

**🎉 Congratulations!** Your Family Tree Web App is now running in production.

For detailed documentation, visit the [docs folder](./docs/) or check the [GitHub repository](https://github.com/your-org/family-tree-app).
