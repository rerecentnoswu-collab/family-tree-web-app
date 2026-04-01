import { useState, useEffect } from 'react';
import { PersonForm } from './components/PersonForm';
import { PersonCard } from './components/PersonCard';
import { FamilyTree } from './components/FamilyTree';
import { PhotoRecognition } from './components/PhotoRecognition';
import { PrivacyFramework } from './components/PrivacyFramework';
import { DNAIntegration } from './components/DNAIntegration';
import { DocumentProcessor } from './components/DocumentProcessor';
import { PredictiveAnalytics } from './components/PredictiveAnalytics';
import { AdvancedRelationshipDiscovery } from './components/AdvancedRelationshipDiscovery';
import { CollaborativeResearch } from './components/CollaborativeResearch';
import { InteractiveTimeline } from './components/InteractiveTimeline';
import { DNAAnalysis } from './components/DNAAnalysis';
import { SourceCitationManager } from './components/SourceCitationManager';
import { OfflinePWA } from './components/OfflinePWA';
import { BackupManager } from './components/BackupManager';
import { StoryGenerator } from './components/StoryGenerator';
import { DebugEnv } from './components/DebugEnv';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Login } from './components/Login';
import { Users, GitBranch, AlertCircle, LogOut, Camera, Shield, Dna, Brain, TrendingUp, Search, Clock, BookOpen, Database, Sparkles, Archive, Users2, History } from 'lucide-react';
import { getPersons, initializeDatabase, type Person as DBPerson } from '../../utils/supabase/client';

interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: string;
  birthplace: string;
  motherId?: string;
  fatherId?: string;
  gender?: 'male' | 'female' | 'other';
}

// Convert database format to app format
function dbToAppPerson(dbPerson: DBPerson): Person {
  return {
    id: dbPerson.id,
    firstName: dbPerson.first_name,
    middleName: dbPerson.middle_name,
    lastName: dbPerson.last_name,
    birthday: dbPerson.birthday,
    birthplace: dbPerson.birthplace,
    motherId: dbPerson.mother_id,
    fatherId: dbPerson.father_id,
    gender: dbPerson.gender
  };
}

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'tree' | 'photos' | 'privacy' | 'dna' | 'documents' | 'analytics' | 'relationships' | 'research' | 'timeline' | 'dna-analysis' | 'citations' | 'offline' | 'backup' | 'stories'>('cards');
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setView('cards');
    // Scroll to the person's card after a brief delay to allow view switch
    setTimeout(() => {
      const element = document.getElementById(`person-${person.id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const fetchPersons = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsSetup(false);
    
    try {
      // First check if database is initialized
      const initResult = await initializeDatabase();
      
      if (!initResult.success) {
        if (initResult.needsSetup) {
          setNeedsSetup(true);
        }
        setError(initResult.error || 'Database error');
        setLoading(false);
        return;
      }

      // Fetch all persons
      const data = await getPersons();
      setPersons(data.map(dbToAppPerson));
    } catch (error) {
      console.error('Error fetching persons:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch persons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPersons();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="size-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  Family Genealogy Tracker
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Track your family lineage with AI-powered parent matching
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PersonForm onPersonAdded={fetchPersons} />
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setView('cards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'cards'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Card View
              </button>
              <button
                onClick={() => setView('tree')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'tree'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                Tree View
              </button>
              <button
                onClick={() => setView('photos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'photos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                Photo Recognition
              </button>
              <button
                onClick={() => setView('privacy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'privacy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Privacy & Security
              </button>
              <button
                onClick={() => setView('dna')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'dna'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Dna className="w-4 h-4" />
                DNA Integration
              </button>
              <button
                onClick={() => setView('documents')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'documents'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Brain className="w-4 h-4" />
                Document Processing
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'analytics'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Predictive Analytics
              </button>
              <button
                onClick={() => setView('relationships')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'relationships'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Search className="w-4 h-4" />
                Relationship Discovery
              </button>
              <button
                onClick={() => setView('research')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'research'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users2 className="w-4 h-4" />
                Collaborative Research
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'timeline'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                Timeline
              </button>
              <button
                onClick={() => setView('dna-analysis')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'dna-analysis'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Dna className="w-4 h-4" />
                DNA Analysis
              </button>
              <button
                onClick={() => setView('citations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'citations'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Citations
              </button>
              <button
                onClick={() => setView('offline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'offline'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Database className="w-4 h-4" />
                Offline & PWA
              </button>
              <button
                onClick={() => setView('backup')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'backup'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Archive className="w-4 h-4" />
                Backup
              </button>
              <button
                onClick={() => setView('stories')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'stories'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Story Generator
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading family members...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8 mx-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchPersons}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : needsSetup ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-2xl bg-white rounded-xl shadow-lg p-8 mx-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Database Setup Required</h2>
                <p className="text-gray-600 mb-6">
                  The Supabase database needs to be initialized before you can add family members.
                  This is a one-time setup that takes less than 1 minute.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-blue-900 mb-3">Setup Instructions:</h3>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Open your <a href="https://supabase.com/dashboard/project/mweatxonqtookmnluwnl" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Project Dashboard</a></li>
                    <li>Navigate to <strong>SQL Editor</strong> (in the left sidebar) → Click <strong>New query</strong></li>
                    <li>Copy the entire contents of <code className="bg-blue-100 px-2 py-0.5 rounded">supabase-setup.sql</code> from this project</li>
                    <li>Paste it into the SQL Editor and click the green <strong>Run</strong> button</li>
                    <li>Wait for "Success. No rows returned" message</li>
                    <li>Click the "I've Run the SQL" button below to reload the app</li>
                  </ol>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>What gets created:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• persons table with all family member fields</li>
                    <li>• Indexes for fast parent-child lookups</li>
                    <li>• Row Level Security policies for data access</li>
                    <li>• Foreign key relationships for family connections</li>
                  </ul>
                </div>
                
                <button
                  onClick={fetchPersons}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  I've Run the SQL - Retry Connection
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  See <strong>DATABASE-SETUP.md</strong> for detailed instructions
                </p>
              </div>
            </div>
          ) : persons.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No Family Members Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Start building your family tree by adding your first family member.
                  Our AI will help you find parent-child relationships automatically!
                </p>
              </div>
            </div>
          ) : view === 'cards' ? (
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {persons.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    allPersons={persons}
                    onUpdate={fetchPersons}
                    highlighted={selectedPerson?.id === person.id}
                  />
                ))}
              </div>
            </div>
          ) : view === 'tree' ? (
            <div className="h-full w-full" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
              <FamilyTree persons={persons} onPersonClick={handlePersonClick} />
            </div>
          ) : view === 'photos' ? (
            <div className="h-full w-full p-6">
              <PhotoRecognition 
                onFacesDetected={(faces) => {
                  console.log('Faces detected:', faces);
                }}
                onPersonMatched={(faceId, personId) => {
                  console.log('Person matched:', faceId, personId);
                }}
              />
            </div>
          ) : view === 'privacy' ? (
            <div className="h-full w-full p-6">
              <PrivacyFramework 
                onExportData={async () => {
                  console.log('Exporting data...');
                }}
                onDeleteData={async (dataType) => {
                  console.log('Deleting data:', dataType);
                }}
              />
            </div>
          ) : view === 'dna' ? (
            <div className="h-full w-full p-6">
              <DNAIntegration
                persons={persons}
                onDNAMatchFound={(match) => {
                  console.log('DNA match found:', match);
                }}
                onProfileUploaded={(profile) => {
                  console.log('DNA profile uploaded:', profile);
                }}
              />
            </div>
          ) : view === 'documents' ? (
            <div className="h-full w-full p-6">
              <DocumentProcessor
                persons={persons}
                onDocumentProcessed={(document) => {
                  console.log('Document processed:', document);
                }}
                onRelationshipFound={(relationship) => {
                  console.log('Document relationship found:', relationship);
                }}
              />
            </div>
          ) : view === 'analytics' ? (
            <div className="h-full w-full p-6">
              <PredictiveAnalytics
                persons={persons}
                onInsightSelected={(insight) => {
                  console.log('Predictive insight selected:', insight);
                }}
              />
            </div>
          ) : view === 'relationships' ? (
            <div className="h-full w-full p-6">
              <AdvancedRelationshipDiscovery
                persons={persons}
              />
            </div>
          ) : view === 'research' ? (
            <div className="h-full w-full p-6">
              <CollaborativeResearch
                persons={persons}
              />
            </div>
          ) : view === 'timeline' ? (
            <div className="h-full w-full p-6">
              <InteractiveTimeline
                persons={persons}
              />
            </div>
          ) : view === 'dna-analysis' ? (
            <div className="h-full w-full p-6">
              <DNAAnalysis
                persons={persons}
              />
            </div>
          ) : view === 'citations' ? (
            <div className="h-full w-full p-6">
              <SourceCitationManager
                persons={persons}
              />
            </div>
          ) : view === 'offline' ? (
            <div className="h-full w-full p-6">
              <OfflinePWA
                persons={persons}
              />
            </div>
          ) : view === 'backup' ? (
            <div className="h-full w-full p-6">
              <BackupManager
                persons={persons}
              />
            </div>
          ) : view === 'stories' ? (
            <div className="h-full w-full p-6">
              <StoryGenerator
                persons={persons}
              />
            </div>
          ) : null}
        </div>

        {/* Footer Stats */}
        {persons.length > 0 && (
          <div className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex gap-6">
                  <span>
                    <strong className="text-gray-900">{persons.length}</strong> family members
                  </span>
                  <span>
                    <strong className="text-gray-900">
                      {persons.filter(p => p.motherId && p.fatherId).length}
                    </strong>{' '}
                    with both parents assigned
                  </span>
                  <span>
                    <strong className="text-gray-900">
                      {persons.filter(p => !p.motherId && !p.fatherId).length}
                    </strong>{' '}
                    root members
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}