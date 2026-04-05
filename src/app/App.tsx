import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { PersonForm } from './components/PersonForm';
import { PersonCard } from './components/PersonCard';
import { FamilyTree } from './components/FamilyTree';
import { StoryGenerator } from './components/StoryGenerator';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { InteractiveTimeline } from './components/InteractiveTimeline';
import { PhotoRecognition } from './components/PhotoRecognition';
import { DNAAnalysis } from './components/DNAAnalysis';
import { DocumentProcessor } from './components/DocumentProcessor';
import { PredictiveAnalytics } from './components/PredictiveAnalytics';
import { AdvancedRelationshipDiscovery } from './components/AdvancedRelationshipDiscovery';
import { CollaborativeResearch } from './components/CollaborativeResearch';
import { PrivacyFramework } from './components/PrivacyFramework';
import { SourceCitationManager } from './components/SourceCitationManager';
import { BackupManager } from './components/BackupManager';
import { AppLayout } from './components/layout/AppLayout';
import { Users, GitBranch, LogOut, Home, BookOpen, Clock, Camera, Dna, FileText, BarChart3, Network, Search, Shield, Library, Archive } from 'lucide-react';
import { getPersons, initializeDatabase, type Person as DBPerson } from '../../utils/supabase/client';
import { Person } from './types/Person';

const dbToAppPerson = (dbPerson: DBPerson): Person => ({
  id: dbPerson.id,
  firstName: dbPerson.first_name,
  middleName: dbPerson.middle_name,
  lastName: dbPerson.last_name,
  birthday: dbPerson.birthday || undefined,
  birthplace: dbPerson.birthplace,
  motherId: dbPerson.mother_id,
  fatherId: dbPerson.father_id,
  spouse_ids: [], // Default to empty array since DB doesn't have this field
  gender: dbPerson.gender,
  events: [], // Default to empty array since DB doesn't have this field
});

function AppContent() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();

  console.log('🔍 AppContent - User state:', { user: !!user, email: user?.email, loading: authLoading });

  const fetchPersons = async () => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setError(null);
    setNeedsSetup(false);
    
    try {
      console.log('🔍 Fetching persons from database...');
      const initResult = await initializeDatabase();
      
      if (!initResult.success) {
        console.error('❌ Database initialization failed:', initResult);
        if (initResult.needsSetup) {
          setNeedsSetup(true);
        }
        setError(initResult.error || 'Database error');
        setDataLoading(false);
        return;
      }

      console.log('📊 Fetching persons data...');
      const data = await getPersons();
      
      if (!data || data.length === 0) {
        console.log('ℹ️ No persons found in database');
        setPersons([]);
      } else {
        console.log(`✅ Successfully fetched ${data.length} persons`);
        setPersons(data.map(dbToAppPerson));
      }
    } catch (error) {
      console.error('❌ Error fetching persons:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch persons');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPersons();
    } else {
      setDataLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen relative">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/family-viewport-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen relative">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/family-viewport-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your family tree...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen relative">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/family-viewport-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Setup Required</h2>
            <p className="text-gray-600 mb-6">
              Your family tree database needs to be initialized. Please run the SQL setup script in your Supabase dashboard.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              I've Run the SQL - Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative">
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/family-viewport-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchPersons}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout signOut={signOut} user={user}>
      <Routes>
        <Route path="/" element={<Dashboard persons={persons} onPersonAdded={fetchPersons} />} />
        <Route 
          path="/dashboard" 
          element={<Dashboard persons={persons} onPersonAdded={fetchPersons} />}
        />
        <Route 
          path="/persons" 
          element={
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
                <PersonForm onPersonAdded={fetchPersons} />
              </div>
              {persons.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No family members yet</h3>
                  <p className="text-gray-600">Click "Add Person" to start building your family tree!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {persons.map(person => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      allPersons={persons}
                      onUpdate={fetchPersons}
                    />
                  ))}
                </div>
              )}
            </div>
          }
        />
        <Route path="/tree" element={<FamilyTree persons={persons} />} />
        <Route path="/timeline" element={<InteractiveTimeline persons={persons} />} />
        <Route path="/photos" element={<PhotoRecognition onFacesDetected={() => {}} onPersonMatched={() => {}} />} />
        <Route path="/dna" element={<DNAAnalysis persons={persons} />} />
        <Route path="/documents" element={<DocumentProcessor persons={[]} onDocumentProcessed={() => {}} onRelationshipFound={() => {}} />} />
        <Route path="/analytics" element={<PredictiveAnalytics persons={[]} onInsightSelected={() => {}} />} />
        <Route path="/relationships" element={<AdvancedRelationshipDiscovery persons={persons} />} />
        <Route path="/research" element={<CollaborativeResearch persons={persons} />} />
        <Route path="/privacy" element={<PrivacyFramework />} />
        <Route path="/sources" element={<SourceCitationManager persons={persons} />} />
        <Route path="/backup" element={<BackupManager persons={[]} />} />
        <Route path="/stories" element={<StoryGenerator persons={persons} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
          
          {/* Protected Routes - all go to the same AppContent but different tabs */}
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