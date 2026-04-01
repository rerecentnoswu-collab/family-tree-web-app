import { security } from '../utils/security';

// Security middleware for API requests
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private csrfToken: string;

  private constructor() {
    this.csrfToken = this.generateCSRFToken();
  }

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  private generateCSRFToken(): string {
    return security.generateCSRFToken();
  }

  // Validate and sanitize request data
  validateRequest(data: any, schema: any): { isValid: boolean; sanitizedData?: any; errors?: string[] } {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Sanitize input
        const sanitized = security.sanitizeInput(value);
        
        // Validate against schema
        const fieldSchema = schema[key];
        if (fieldSchema) {
          const validation = security.validateField(sanitized, fieldSchema);
          if (!validation.isValid) {
            errors.push(`${key}: ${validation.error}`);
            continue;
          }
        }
        
        sanitizedData[key] = sanitized;
      } else {
        sanitizedData[key] = value;
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Rate limiting middleware
  checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
    return security.rateLimiter.isAllowed(identifier);
  }

  // CSRF protection middleware
  validateCSRF(requestToken: string): boolean {
    return security.validateCSRFToken(requestToken, this.csrfToken);
  }

  getCSRFToken(): string {
    return this.csrfToken;
  }

  // Content Security Policy middleware
  getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': security.generateCSP(),
      ...security.securityHeaders,
    };
  }

  // Input sanitization middleware
  sanitizeRequestBody(body: any): any {
    if (typeof body === 'string') {
      return security.sanitizeInput(body);
    }

    if (Array.isArray(body)) {
      return body.map(item => this.sanitizeRequestBody(item));
    }

    if (typeof body === 'object' && body !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string') {
          sanitized[key] = security.sanitizeInput(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => this.sanitizeRequestBody(item));
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeRequestBody(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return body;
  }

  // Authentication middleware
  validateAuthToken(token: string): { isValid: boolean; userId?: string; error?: string } {
    try {
      // In a real implementation, this would validate JWT tokens
      // For now, just basic validation
      if (!token || token.length < 10) {
        return { isValid: false, error: 'Invalid token format' };
      }

      // Parse JWT (simplified)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false, error: 'Invalid JWT format' };
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { isValid: false, error: 'Token expired' };
      }

      return { isValid: true, userId: payload.sub };
    } catch (error) {
      return { isValid: false, error: 'Token validation failed' };
    }
  }

  // Permission checking middleware
  hasPermission(userId: string, resource: string, action: string): boolean {
    // In a real implementation, this would check against a permissions database
    // For now, just basic role-based checking
    const userRoles = this.getUserRoles(userId);
    
    return userRoles.some(role => {
      const permissions = this.getRolePermissions(role);
      return permissions.some(permission => 
        permission.resource === resource && permission.actions.includes(action)
      );
    });
  }

  private getUserRoles(userId: string): string[] {
    // Mock implementation - in real app, fetch from database
    return ['user']; // Default role
  }

  private getRolePermissions(role: string): Array<{ resource: string; actions: string[] }> {
    const permissions: Record<string, Array<{ resource: string; actions: string[] }>> = {
      admin: [
        { resource: '*', actions: ['*'] }, // All permissions
      ],
      user: [
        { resource: 'persons', actions: ['read', 'create', 'update'] },
        { resource: 'family-tree', actions: ['read'] },
        { resource: 'photos', actions: ['read', 'upload'] },
      ],
      guest: [
        { resource: 'persons', actions: ['read'] },
        { resource: 'family-tree', actions: ['read'] },
      ],
    };

    return permissions[role] || [];
  }

  // Data encryption utilities
  encryptSensitiveData(data: string): string {
    // In a real implementation, use proper encryption like AES-256
    // For now, just basic encoding
    return btoa(data);
  }

  decryptSensitiveData(encryptedData: string): string {
    // In a real implementation, use proper decryption
    // For now, just basic decoding
    try {
      return atob(encryptedData);
    } catch {
      throw new Error('Invalid encrypted data');
    }
  }

  // Audit logging
  logSecurityEvent(event: {
    type: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    details?: any;
    timestamp?: string;
  }): void {
    const auditLog = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      sessionId: this.getSessionId(),
    };

    // In a real implementation, send to secure logging service
    console.log('Security Event:', auditLog);

    // Also send to API for persistent logging
    this.sendToSecurityAPI(auditLog);
  }

  private getSessionId(): string {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }

  private async sendToSecurityAPI(logEntry: any): Promise<void> {
    try {
      await fetch('/api/security/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to send security log:', error);
    }
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();

// React hook for security
export function useSecurity() {
  return {
    validateRequest: securityMiddleware.validateRequest.bind(securityMiddleware),
    checkRateLimit: securityMiddleware.checkRateLimit.bind(securityMiddleware),
    validateCSRF: securityMiddleware.validateCSRF.bind(securityMiddleware),
    getCSRFToken: securityMiddleware.getCSRFToken.bind(securityMiddleware),
    getCSPHeaders: securityMiddleware.getCSPHeaders.bind(securityMiddleware),
    sanitizeRequestBody: securityMiddleware.sanitizeRequestBody.bind(securityMiddleware),
    validateAuthToken: securityMiddleware.validateAuthToken.bind(securityMiddleware),
    hasPermission: securityMiddleware.hasPermission.bind(securityMiddleware),
    encryptSensitiveData: securityMiddleware.encryptSensitiveData.bind(securityMiddleware),
    decryptSensitiveData: securityMiddleware.decryptSensitiveData.bind(securityMiddleware),
    logSecurityEvent: securityMiddleware.logSecurityEvent.bind(securityMiddleware),
  };
}

export default securityMiddleware;
