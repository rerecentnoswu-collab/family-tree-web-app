import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { AppContent } from './components/app/AppContent';
import { LandingPage } from './components/LandingPage';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { AppLoadingState } from './components/app/AppLoadingStates';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return <AppLoadingState message="Loading..." />;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect all other routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
