#!/usr/bin/env node

/**
 * Environment Setup Script for Family Tree Web App (Node.js version)
 * Usage: node scripts/setup-env-node.js [environment]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get environment from command line argument
const environment = process.argv[2] || 'development';

// Validate environment
const validEnvironments = ['development', 'staging', 'production'];
if (!validEnvironments.includes(environment)) {
  console.error('❌ Invalid environment. Use: development, staging, or production');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  colorLog('green', `✅ ${message}`);
}

function logWarning(message) {
  colorLog('yellow', `⚠️  ${message}`);
}

function logError(message) {
  colorLog('red', `❌ ${message}`);
}

function logInfo(message) {
  colorLog('blue', `ℹ️  ${message}`);
}

function logHeader(message) {
  colorLog('cyan', message);
}

// Generate secure keys using Node.js crypto
function generateKeys() {
  logInfo('Generating secure keys...');
  
  // Generate encryption key (32 characters)
  const encryptionKey = randomBytes(32).toString('base64').replace(/[+/=]/g, '').substring(0, 32);
  
  // Generate JWT secret (64 characters)
  const jwtSecret = randomBytes(64).toString('base64').replace(/[+/=]/g, '').substring(0, 64);
  
  logSuccess('Generated encryption key and JWT secret');
  
  return {
    encryptionKey,
    jwtSecret
  };
}

// Create environment file
function createEnvironmentFile(envPath, keys) {
  if (existsSync(envPath)) {
    logWarning(`Environment file already exists: ${envPath}`);
    
    // For non-interactive environments, we'll proceed with a backup
    const backupPath = `${envPath}.backup.${Date.now()}`;
    try {
      const existingContent = readFileSync(envPath, 'utf8');
      writeFileSync(backupPath, existingContent);
      logInfo(`Created backup: ${backupPath}`);
    } catch (error) {
      logError(`Failed to create backup: ${error.message}`);
    }
  }
  
  logInfo(`Creating environment file: ${envPath}`);
  
  let envContent = `# Environment Configuration
VITE_ENVIRONMENT=${environment}
NODE_ENV=${environment}

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
VITE_ENCRYPTION_KEY=${keys.encryptionKey}
VITE_JWT_SECRET=${keys.jwtSecret}

# Development Only
VITE_DEBUG_MODE=true
VITE_MOCK_API=true
`;

  // Update environment-specific settings
  switch (environment) {
    case 'production':
      logInfo('Configuring production environment...');
      envContent = envContent
        .replace('VITE_API_BASE_URL=http://localhost:3001/api', 'VITE_API_BASE_URL=https://api.familytree.com')
        .replace('VITE_API_TIMEOUT=10000', 'VITE_API_TIMEOUT=20000')
        .replace('VITE_API_RETRY_ATTEMPTS=3', 'VITE_API_RETRY_ATTEMPTS=5')
        .replace('VITE_ENABLE_ERROR_TRACKING=false', 'VITE_ENABLE_ERROR_TRACKING=true')
        .replace('VITE_ENABLE_PERFORMANCE_MONITORING=false', 'VITE_ENABLE_PERFORMANCE_MONITORING=true')
        .replace('VITE_DEBUG_MODE=true', 'VITE_DEBUG_MODE=false')
        .replace('VITE_MOCK_API=true', 'VITE_MOCK_API=false');
      break;
      
    case 'staging':
      logInfo('Configuring staging environment...');
      envContent = envContent
        .replace('VITE_API_BASE_URL=http://localhost:3001/api', 'VITE_API_BASE_URL=https://staging-api.familytree.com')
        .replace('VITE_API_TIMEOUT=10000', 'VITE_API_TIMEOUT=15000')
        .replace('VITE_ENABLE_ERROR_TRACKING=false', 'VITE_ENABLE_ERROR_TRACKING=true')
        .replace('VITE_ENABLE_PERFORMANCE_MONITORING=false', 'VITE_ENABLE_PERFORMANCE_MONITORING=true')
        .replace('VITE_DEBUG_MODE=true', 'VITE_DEBUG_MODE=false')
        .replace('VITE_MOCK_API=true', 'VITE_MOCK_API=false');
      break;
  }
  
  try {
    writeFileSync(envPath, envContent, 'utf8');
    logSuccess(`Environment file created: ${envPath}`);
  } catch (error) {
    logError(`Failed to create environment file: ${error.message}`);
    process.exit(1);
  }
}

// Create local environment file for development
function createLocalEnvFile() {
  if (environment === 'development') {
    const localEnvPath = join(projectRoot, '.env.local');
    
    if (!existsSync(localEnvPath)) {
      logInfo('Creating local environment file...');
      
      try {
        // Create a symlink or copy
        const devEnvPath = join(projectRoot, '.env.development');
        if (existsSync(devEnvPath)) {
          const devContent = readFileSync(devEnvPath, 'utf8');
          writeFileSync(localEnvPath, devContent);
          logSuccess('Created .env.local from .env.development');
        }
      } catch (error) {
        logWarning(`Could not create .env.local: ${error.message}`);
        logInfo('You can manually copy .env.development to .env.local');
      }
    }
  }
}

// Show next steps
function showNextSteps() {
  console.log('');
  logSuccess('🎉 Environment setup complete!');
  console.log('');
  logInfo('Next steps:');
  console.log('1. Edit .env.' + environment + ' and add your actual values:');
  console.log('   - VITE_SUPABASE_URL (from Supabase dashboard)');
  console.log('   - VITE_SUPABASE_ANON_KEY (from Supabase dashboard)');
  console.log('   - Optional: Add your API keys for third-party services');
  console.log('');
  console.log('2. Install dependencies:');
  console.log('   npm install');
  console.log('');
  console.log('3. Start development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('4. For production deployment:');
  console.log('   - Vercel: vercel env add VITE_SUPABASE_URL production');
  console.log('   - Check docs/ENVIRONMENT-SETUP.md for detailed instructions');
  console.log('');
}

// Main execution
function main() {
  logHeader('🔍 Family Tree Web App Environment Setup');
  logHeader('==========================================');
  console.log('');
  
  logInfo(`Setting up ${environment} environment`);
  logInfo(`Project root: ${projectRoot}`);
  
  const envPath = join(projectRoot, `.env.${environment}`);
  
  // Generate keys
  const keys = generateKeys();
  
  // Create environment file
  createEnvironmentFile(envPath, keys);
  
  // Create local env file if development
  createLocalEnvFile();
  
  // Show next steps
  showNextSteps();
}

// Run main function
try {
  main();
} catch (error) {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
}
