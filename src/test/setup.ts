import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect
expect.extend(matchers);

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      single: vi.fn(),
    })),
  })),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Users: vi.fn(() => 'Users'),
  GitBranch: vi.fn(() => 'GitBranch'),
  AlertCircle: vi.fn(() => 'AlertCircle'),
  LogOut: vi.fn(() => 'LogOut'),
  Camera: vi.fn(() => 'Camera'),
  Shield: vi.fn(() => 'Shield'),
  Dna: vi.fn(() => 'Dna'),
  Brain: vi.fn(() => 'Brain'),
  TrendingUp: vi.fn(() => 'TrendingUp'),
  Search: vi.fn(() => 'Search'),
  Clock: vi.fn(() => 'Clock'),
  BookOpen: vi.fn(() => 'BookOpen'),
  Database: vi.fn(() => 'Database'),
  Sparkles: vi.fn(() => 'Sparkles'),
  Archive: vi.fn(() => 'Archive'),
  Users2: vi.fn(() => 'Users2'),
  History: vi.fn(() => 'History'),
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch for API tests
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', sessionStorageMock);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock crypto for JWT
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
});

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_ENVIRONMENT = 'test';
