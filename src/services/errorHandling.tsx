import { config } from '../config/api';

// Error Types
export interface AppError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorReport {
  error: AppError;
  context: {
    environment: string;
    version: string;
    buildNumber?: string;
    userId?: string;
    sessionId: string;
    timestamp: string;
  };
}

// Error Handler Class
class ErrorHandler {
  private errors: AppError[] = [];
  private maxErrors = 100;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        name: 'JavaScript Error',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        name: 'Unhandled Promise Rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });
  }

  // Set user context for error tracking
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Handle and log errors
  handleError(error: Partial<AppError>): void {
    const appError: AppError = {
      name: error.name || 'Unknown Error',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp || new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store error locally
    this.errors.push(appError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Application Error:', appError);
    }

    // Send to monitoring service
    this.reportError(appError);
  }

  // Report error to external service
  private async reportError(error: AppError): Promise<void> {
    if (!config.monitoring.enableErrorTracking) {
      return;
    }

    try {
      const errorReport: ErrorReport = {
        error,
        context: {
          environment: import.meta.env.MODE,
          version: import.meta.env.VITE_APP_VERSION || '1.0.0',
          buildNumber: import.meta.env.VITE_BUILD_NUMBER,
          userId: this.userId,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        },
      };

      // Send to error tracking service (Sentry, LogRocket, etc.)
      if (config.monitoring.sentryDsn) {
        // Integration with Sentry would go here
        console.log('Error reported to Sentry:', errorReport);
      }

      // Also send to our own API for logging
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Get recent errors for debugging
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  // Clear error history
  clearErrors(): void {
    this.errors = [];
  }

  // Create user-friendly error messages
  getUserFriendlyMessage(error: AppError): string {
    const errorMessages: Record<string, string> = {
      'Network Error': 'Unable to connect to the server. Please check your internet connection.',
      'Authentication Error': 'Please sign in to continue.',
      'Permission Denied': 'You don\'t have permission to perform this action.',
      'Not Found': 'The requested resource was not found.',
      'Server Error': 'Something went wrong on our end. Please try again later.',
      'Validation Error': 'Please check your input and try again.',
      'Rate Limit Error': 'Too many requests. Please wait a moment and try again.',
    };

    return errorMessages[error.name] || error.message || 'An unexpected error occurred.';
  }

  // Check if error should be retried
  shouldRetry(error: AppError): boolean {
    const retryableErrors = [
      'Network Error',
      'Server Error',
      'Rate Limit Error',
      'Timeout Error',
    ];

    return retryableErrors.includes(error.name) || 
           (error.statusCode && error.statusCode >= 500);
  }

  // Get retry delay with exponential backoff
  getRetryDelay(attempt: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 30000);
  }
}

// React Error Boundary Component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: AppError }> },
  { hasError: boolean; error: AppError | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: AppError } {
    return {
      hasError: true,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    errorHandler.handleError({
      name: 'React Error',
      message: error.message,
      stack: error.stack,
      details: { componentStack: errorInfo.componentStack },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({ error }: { error: AppError }): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 text-center mb-4">
          {errorHandler.getUserFriendlyMessage(error)}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
        {import.meta.env.DEV && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Custom hook for error handling
export function useErrorHandler() {
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    setUserId: errorHandler.setUserId.bind(errorHandler),
    getRecentErrors: errorHandler.getRecentErrors.bind(errorHandler),
    clearErrors: errorHandler.clearErrors.bind(errorHandler),
    getUserFriendlyMessage: errorHandler.getUserFriendlyMessage.bind(errorHandler),
    shouldRetry: errorHandler.shouldRetry.bind(errorHandler),
    getRetryDelay: errorHandler.getRetryDelay.bind(errorHandler),
  };
}

export default errorHandler;
