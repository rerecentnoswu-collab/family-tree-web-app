#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are properly set
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Required environment variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_ENCRYPTION_KEY',
  'VITE_JWT_SECRET'
];

// Optional but recommended variables
const recommendedVars = [
  'VITE_API_BASE_URL',
  'VITE_SENTRY_DSN',
  'VITE_GOOGLE_ANALYTICS_ID'
];

// Environment-specific requirements
const environmentRequirements = {
  production: {
    required: [...requiredVars],
    recommended: [...recommendedVars, 'VITE_ENABLE_ERROR_TRACKING', 'VITE_ENABLE_PERFORMANCE_MONITORING'],
    apiBaseUrl: 'https://api.familytree.com',
    errorTracking: true,
    performanceMonitoring: true
  },
  staging: {
    required: [...requiredVars],
    recommended: [...recommendedVars, 'VITE_ENABLE_ERROR_TRACKING', 'VITE_ENABLE_PERFORMANCE_MONITORING'],
    apiBaseUrl: 'https://staging-api.familytree.com',
    errorTracking: true,
    performanceMonitoring: true
  },
  development: {
    required: [...requiredVars],
    recommended: ['VITE_API_BASE_URL'],
    apiBaseUrl: 'http://localhost:3001/api',
    errorTracking: false,
    performanceMonitoring: false
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

// Load environment variables from file
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });

  return env;
}

// Validate Supabase URL
function validateSupabaseUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co');
  } catch {
    return false;
  }
}

// Validate API key format
function validateApiKey(key) {
  if (!key) return false;
  
  // Basic validation - should be a reasonable length and not placeholder text
  return key.length > 20 && 
         !key.includes('your-') && 
         !key.includes('placeholder') &&
         !key.includes('example');
}

// Validate encryption key
function validateEncryptionKey(key) {
  if (!key) return false;
  
  // Should be at least 32 characters
  return key.length >= 32;
}

// Validate JWT secret
function validateJWTSecret(secret) {
  if (!secret) return false;
  
  // Should be at least 64 characters for production
  return secret.length >= 64;
}

// Validate environment configuration
function validateEnvironment(envName, env) {
  logHeader(`\n🔍 Validating ${envName} environment`);
  
  const requirements = environmentRequirements[envName];
  if (!requirements) {
    logError(`Unknown environment: ${envName}`);
    return false;
  }

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  logInfo('\n📋 Checking required variables:');
  requirements.required.forEach(varName => {
    const value = env[varName];
    
    if (!value) {
      logError(`${varName}: NOT SET`);
      hasErrors = true;
    } else {
      let isValid = true;
      let validationMessage = '';

      switch (varName) {
        case 'VITE_SUPABASE_URL':
          isValid = validateSupabaseUrl(value);
          validationMessage = isValid ? 'Valid Supabase URL' : 'Invalid Supabase URL format';
          break;
        case 'VITE_SUPABASE_ANON_KEY':
          isValid = validateApiKey(value);
          validationMessage = isValid ? 'Valid API key format' : 'Invalid API key format';
          break;
        case 'VITE_ENCRYPTION_KEY':
          isValid = validateEncryptionKey(value);
          validationMessage = isValid ? 'Valid encryption key length' : 'Encryption key too short (min 32 chars)';
          break;
        case 'VITE_JWT_SECRET':
          isValid = validateJWTSecret(value);
          validationMessage = isValid ? 'Valid JWT secret length' : 'JWT secret too short (min 64 chars)';
          break;
      }

      if (isValid) {
        logSuccess(`${varName}: ${validationMessage}`);
      } else {
        logError(`${varName}: ${validationMessage}`);
        hasErrors = true;
      }
    }
  });

  // Check recommended variables
  logInfo('\n💡 Checking recommended variables:');
  requirements.recommended.forEach(varName => {
    const value = env[varName];
    
    if (!value) {
      logWarning(`${varName}: NOT SET (recommended)`);
      hasWarnings = true;
    } else {
      logSuccess(`${varName}: SET`);
    }
  });

  // Check environment-specific settings
  logInfo('\n⚙️  Checking environment-specific settings:');
  
  // API Base URL
  const apiBaseUrl = env['VITE_API_BASE_URL'];
  if (apiBaseUrl) {
    if (apiBaseUrl === requirements.apiBaseUrl) {
      logSuccess(`VITE_API_BASE_URL: Correct (${apiBaseUrl})`);
    } else {
      logWarning(`VITE_API_BASE_URL: Expected ${requirements.apiBaseUrl}, got ${apiBaseUrl}`);
      hasWarnings = true;
    }
  } else {
    logWarning(`VITE_API_BASE_URL: NOT SET (should be ${requirements.apiBaseUrl})`);
    hasWarnings = true;
  }

  // Error tracking
  const errorTracking = env['VITE_ENABLE_ERROR_TRACKING'];
  if (errorTracking === requirements.errorTracking.toString()) {
    logSuccess(`VITE_ENABLE_ERROR_TRACKING: Correct (${errorTracking})`);
  } else {
    logWarning(`VITE_ENABLE_ERROR_TRACKING: Expected ${requirements.errorTracking}, got ${errorTracking || 'NOT SET'}`);
    hasWarnings = true;
  }

  // Performance monitoring
  const perfMonitoring = env['VITE_ENABLE_PERFORMANCE_MONITORING'];
  if (perfMonitoring === requirements.performanceMonitoring.toString()) {
    logSuccess(`VITE_ENABLE_PERFORMANCE_MONITORING: Correct (${perfMonitoring})`);
  } else {
    logWarning(`VITE_ENABLE_PERFORMANCE_MONITORING: Expected ${requirements.performanceMonitoring}, got ${perfMonitoring || 'NOT SET'}`);
    hasWarnings = true;
  }

  // Summary
  logHeader(`\n📊 Validation Summary for ${envName}:`);
  
  if (hasErrors) {
    logError('❌ Validation FAILED - Fix required errors before deployment');
    return false;
  } else if (hasWarnings) {
    logWarning('⚠️  Validation PASSED with warnings - Review recommended settings');
    return true;
  } else {
    logSuccess('✅ Validation PASSED - Environment is ready for deployment');
    return true;
  }
}

// Main validation function
function main() {
  logHeader('🔍 Family Tree Web App Environment Validation');
  logHeader('==========================================');

  const args = process.argv.slice(2);
  const environment = args[0] || process.env.NODE_ENV || 'development';

  logInfo(`Validating environment: ${environment}`);

  // Try different environment file locations
  const envFiles = [
    `.env.${environment}`,
    '.env.local',
    '.env'
  ];

  let env = {};
  let usedFile = null;

  for (const file of envFiles) {
    const filePath = join(projectRoot, file);
    if (existsSync(filePath)) {
      env = loadEnvFile(filePath);
      usedFile = file;
      break;
    }
  }

  if (usedFile) {
    logInfo(`Loaded environment from: ${usedFile}`);
  } else {
    logError('No environment file found!');
    logInfo('Create one with: npm run setup-env');
    process.exit(1);
  }

  // Check if environment variable matches file
  const envEnvironment = env['VITE_ENVIRONMENT'];
  if (envEnvironment && envEnvironment !== environment) {
    logWarning(`Environment mismatch: file is ${envEnvironment}, validating as ${environment}`);
  }

  // Validate the environment
  const isValid = validateEnvironment(environment, env);

  // Exit with appropriate code
  process.exit(isValid ? 0 : 1);
}

// Run validation
main();
