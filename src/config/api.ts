// API Configuration and Connection Management
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface EnvironmentConfig {
  api: ApiConfig;
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    enableAnalytics: boolean;
    enableDNAAnalysis: boolean;
    enableCollaboration: boolean;
    enableOfflineMode: boolean;
  };
  monitoring: {
    enableErrorTracking: boolean;
    enablePerformanceMonitoring: boolean;
    sentryDsn?: string;
  };
}

// Default configurations for different environments
const environments: Record<string, EnvironmentConfig> = {
  development: {
    api: {
      baseUrl: 'http://localhost:3001/api',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    features: {
      enableAnalytics: true,
      enableDNAAnalysis: true,
      enableCollaboration: true,
      enableOfflineMode: true,
    },
    monitoring: {
      enableErrorTracking: false,
      enablePerformanceMonitoring: false,
    },
  },
  staging: {
    api: {
      baseUrl: 'https://staging-api.familytree.com/api',
      timeout: 15000,
      retryAttempts: 3,
      retryDelay: 2000,
    },
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://staging-project.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    features: {
      enableAnalytics: true,
      enableDNAAnalysis: true,
      enableCollaboration: true,
      enableOfflineMode: true,
    },
    monitoring: {
      enableErrorTracking: true,
      enablePerformanceMonitoring: true,
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    },
  },
  production: {
    api: {
      baseUrl: 'https://api.familytree.com/api',
      timeout: 20000,
      retryAttempts: 5,
      retryDelay: 3000,
    },
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://prod-project.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    features: {
      enableAnalytics: true,
      enableDNAAnalysis: true,
      enableCollaboration: true,
      enableOfflineMode: true,
    },
    monitoring: {
      enableErrorTracking: true,
      enablePerformanceMonitoring: true,
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    },
  },
};

// Get current environment
const getEnvironment = (): string => {
  const env = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';
  return environments[env] ? env : 'development';
};

// Export current configuration
export const config: EnvironmentConfig = environments[getEnvironment()];

// API endpoints
export const apiEndpoints = {
  // Persons
  persons: '/persons',
  personById: (id: string) => `/persons/${id}`,
  personRelationships: (id: string) => `/persons/${id}/relationships`,
  
  // Family Tree
  familyTree: '/family-tree',
  ancestors: (id: string) => `/persons/${id}/ancestors`,
  descendants: (id: string) => `/persons/${id}/descendants`,
  
  // DNA Analysis
  dnaAnalysis: '/dna/analysis',
  dnaMatches: '/dna/matches',
  ethnicity: '/dna/ethnicity',
  
  // Research & Collaboration
  researchTasks: '/research/tasks',
  teamMembers: '/research/team',
  discussions: '/research/discussions',
  
  // Timeline
  timelineEvents: '/timeline/events',
  historicalEvents: '/timeline/historical',
  
  // Sources & Citations
  sources: '/sources',
  citations: '/citations',
  evidence: '/evidence',
  
  // Backup & Sync
  backups: '/backups',
  sync: '/sync',
  
  // Stories
  stories: '/stories',
  storyTemplates: '/stories/templates',
  
  // Analytics
  analytics: '/analytics',
  insights: '/analytics/insights',
  
  // Media
  photos: '/media/photos',
  documents: '/media/documents',
  
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    resetPassword: '/auth/reset-password',
    profile: '/auth/profile',
  },
} as const;

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint}`;
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  return config.features[feature];
};

// Helper function to check if monitoring is enabled
export const isMonitoringEnabled = (type: keyof EnvironmentConfig['monitoring']): boolean => {
  return config.monitoring[type];
};

export default config;
