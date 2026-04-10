import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Mobile-optimized Vite configuration
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations for mobile
  build: {
    // Code splitting for better mobile performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'reactflow'],
          
          // Mobile-specific chunks
          mobile: [
            './src/app/components/mobile/MobileOptimizedFamilyTree.tsx',
            './src/app/components/family-tree/MobilePersonNode.tsx',
            './src/app/components/family-tree/MobileVirtualizedFamilyTree.tsx'
          ],
          
          // Core functionality
          core: [
            './src/app/hooks/useMobileOptimizedFamilyData.tsx',
            './src/utils/supabase/mobile-optimized-client.ts'
          ]
        }
      },
      
      // Optimize bundle size
      chunkSizeWarningLimit: 1000, // Increase warning limit for mobile
      
      // Minification options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          safari10: true, // Safari 10+ compatibility
        }
      }
    },
    
    // Target modern browsers for better performance
    target: ['es2015', 'chrome58', 'firefox57', 'safari11'],
    
    // CSS optimizations
    cssCodeSplit: true,
    
    // Enable source maps for debugging (disable in production)
    sourcemap: process.env.NODE_ENV !== 'production'
  },
  
  // Development server optimizations
  server: {
    // Enable HMR for faster development
    hmr: {
      overlay: false, // Disable overlay for mobile testing
    },
    
    // Optimize for mobile testing
    host: true,
    port: 3000
  },
  
  // Preview server optimizations
  preview: {
    port: 4173,
    host: true
  },
  
  // Resolve optimizations
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/app/components'),
      '@hooks': resolve(__dirname, 'src/app/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@mobile': resolve(__dirname, 'src/app/components/mobile')
    }
  },
  
  // CSS optimizations
  css: {
    // Enable CSS modules for component-scoped styles
    modules: {
      localsConvention: 'camelCase'
    },
    
    // PostCSS configuration for mobile optimization
    postcss: './postcss.mobile.config.js'
  },
  
  // Optimizations for mobile
  optimizeDeps: {
    // Pre-bundle dependencies for faster startup
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'reactflow'
    ],
    
    // Exclude large dependencies from pre-bundling
    exclude: ['@types/react']
  },
  
  // Define global constants for mobile optimization
  define: {
    __IS_MOBILE__: JSON.stringify(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
});
