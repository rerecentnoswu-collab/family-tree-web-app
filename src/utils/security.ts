// Security utilities and best practices

// Content Security Policy
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://vercel.live"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:", "blob:"],
  'connect-src': ["'self'", "https://api.supabase.co", "https://familytree.com"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

// Generate CSP header
export function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      const sourceList = sources.length > 0 ? ' ' + sources.join(' ') : '';
      return `${directive}${sourceList};`;
    })
    .join(' ');
}

// XSS Protection
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Password strength validation
export interface PasswordStrength {
  isValid: boolean;
  score: number;
  feedback: string[];
}

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Password must be at least 8 characters long');

  if (password.length >= 12) score += 1;
  else feedback.push('Consider using 12+ characters for better security');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    score -= 1;
    feedback.push('Avoid sequential characters');
  }

  const isValid = score >= 4 && password.length >= 8;

  return {
    isValid,
    score: Math.max(0, Math.min(5, score)),
    feedback,
  };
}

// Rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    return entry?.resetTime || 0;
  }
}

// CSRF Protection
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// Secure storage
export class SecureStorage {
  private prefix = 'secure_';

  setItem(key: string, value: string): void {
    try {
      const encrypted = btoa(value); // In production, use proper encryption
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  }

  getItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(this.prefix + key);
      if (!encrypted) return null;
      return atob(encrypted); // In production, use proper decryption
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

// Input validation schemas
export const validationSchemas = {
  personName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'\.]+$/,
    message: 'Name must contain only letters, spaces, hyphens, apostrophes, and periods',
  },
  
  birthDate: {
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Date must be in YYYY-MM-DD format',
    validate: (date: string) => {
      const d = new Date(date);
      const now = new Date();
      return d <= now && d.getFullYear() >= 1800;
    },
  },
  
  birthplace: {
    required: false,
    minLength: 1,
    maxLength: 200,
    pattern: /^[a-zA-Z\s,\-\.]+$/,
    message: 'Birthplace must contain only letters, spaces, commas, hyphens, and periods',
  },
};

// Validation function
export function validateField(value: string, schema: any): { isValid: boolean; error?: string } {
  if (schema.required && !value.trim()) {
    return { isValid: false, error: 'This field is required' };
  }

  if (schema.minLength && value.length < schema.minLength) {
    return { isValid: false, error: `Must be at least ${schema.minLength} characters` };
  }

  if (schema.maxLength && value.length > schema.maxLength) {
    return { isValid: false, error: `Must be no more than ${schema.maxLength} characters` };
  }

  if (schema.pattern && !schema.pattern.test(value)) {
    return { isValid: false, error: schema.message };
  }

  if (schema.validate && !schema.validate(value)) {
    return { isValid: false, error: schema.message || 'Invalid value' };
  }

  return { isValid: true };
}

// Security headers for API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': generateCSP(),
};

// Export instances
export const rateLimiter = new RateLimiter();
export const secureStorage = new SecureStorage();

// Security utilities
export const security = {
  sanitizeInput,
  isValidEmail,
  validatePassword,
  generateCSRFToken,
  validateCSRFToken,
  validateField,
  securityHeaders,
  CSP_DIRECTIVES,
  generateCSP,
  rateLimiter,
  secureStorage,
  validationSchemas,
};

export default security;
