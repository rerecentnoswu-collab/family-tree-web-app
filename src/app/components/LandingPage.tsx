import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, TreePine, Heart, Shield, ArrowRight, Mail, Lock } from 'lucide-react';

// Import image using URL constructor for TypeScript compatibility
const backgroundImg = new URL('/family-viewport-bg.png', import.meta.url).href;

export function LandingPage() {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Preload background image for better performance
  useEffect(() => {
    const preloadImage = new Image();
    preloadImage.src = '/family-viewport-bg.png';
    preloadImage.loading = 'eager';
    preloadImage.onload = () => {
      setImageLoaded(true);
    };
    preloadImage.onerror = () => {
      setImageLoaded(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Optimized Background Image with Best Practices */}
      <div 
        className={`fixed inset-0 transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: imageLoaded ? `url(${backgroundImg})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          // Performance optimizations
          imageRendering: 'auto'
        }}
        aria-hidden="true"
      />
      
      {/* Fallback gradient for better text readability when image loads */}
      {!imageLoaded && (
        <div 
          className="fixed inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #f0f9ff 100%)'
          }}
        />
      )}
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TreePine className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Family Tree</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/signin" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Discover Your Family's
            <span className="text-blue-600"> Story</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build, explore, and share your family tree with our modern genealogy platform. 
            Connect with your heritage and preserve memories for generations to come.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] font-semibold text-lg flex items-center justify-center"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              to="/signin" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] font-semibold text-lg border border-blue-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Family Tree?</h2>
          <p className="text-lg text-gray-600">Everything you need to build and explore your family history</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Easy to Use</h3>
            <p className="text-gray-600">
              Intuitive interface makes building your family tree simple and enjoyable for all ages.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Preserve Memories</h3>
            <p className="text-gray-600">
              Store photos, documents, and stories to keep your family's legacy alive for future generations.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Private</h3>
            <p className="text-gray-600">
              Your family data is protected with enterprise-grade security and privacy controls.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Discover Your Roots?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families who have already started their journey with Family Tree.
          </p>
          <Link 
            to="/signup" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] font-semibold text-lg inline-flex items-center"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Family Tree Web App. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
