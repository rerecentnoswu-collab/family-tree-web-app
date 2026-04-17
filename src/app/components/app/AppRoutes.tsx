import { Routes, Route } from 'react-router-dom';
import { Person } from '../../types/Person';
import { PersonForm } from '../PersonForm';
import { PersonCard } from '../PersonCard';
import { FamilyTree } from '../FamilyTree';
import { FamilyInvitationSender } from '../FamilyInvitationSender';
import { StoryGenerator } from '../StoryGenerator';
import { Dashboard } from '../Dashboard';
import { InteractiveTimeline } from '../InteractiveTimeline';
import { PhotoRecognition } from '../PhotoRecognition';
import { DNAAnalysis } from '../DNAAnalysis';
import { DocumentProcessor } from '../DocumentProcessor';
import { AdvancedRelationshipDiscovery } from '../AdvancedRelationshipDiscovery';
import { CollaborativeResearch } from '../CollaborativeResearch';
import { PrivacyFramework } from '../PrivacyFramework';
import { SourceCitationManager } from '../SourceCitationManager';
import { BackupManager } from '../BackupManager';
import { FamilyMembersCRUD } from '../FamilyMembersCRUD';
import { PersonCardsSkeleton } from '../ui/SkeletonLoader';
import { Users } from 'lucide-react';

interface AppRoutesProps {
  persons: Person[];
  dataLoading: boolean;
  onPersonAdded: () => void;
}

export const AppRoutes = ({ persons, dataLoading, onPersonAdded }: AppRoutesProps) => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard persons={persons} onPersonAdded={onPersonAdded} />} />
      <Route 
        path="/dashboard" 
        element={<Dashboard persons={persons} onPersonAdded={onPersonAdded} />}
      />
      <Route 
        path="/persons" 
        element={
          dataLoading ? (
            <PersonCardsSkeleton />
          ) : (
            <FamilyMembersCRUD 
              persons={persons} 
              onPersonsChange={onPersonAdded} 
            />
          )
        }
      />
      <Route path="/tree" element={
        <div>
          <FamilyInvitationSender persons={persons} />
          <FamilyTree persons={persons} />
        </div>
      } />
      <Route path="/timeline" element={<InteractiveTimeline persons={persons} />} />
      <Route path="/photos" element={<PhotoRecognition onFacesDetected={() => {}} onPersonMatched={() => {}} />} />
      <Route path="/dna" element={<DNAAnalysis persons={persons} />} />
      <Route path="/documents" element={<DocumentProcessor persons={persons} onDocumentProcessed={() => {}} onRelationshipFound={() => {}} />} />
      <Route path="/analytics" element={<div className="p-8"><h2 className="text-2xl font-bold mb-4">Analytics</h2><p className="text-gray-600">Analytics tool is temporarily under maintenance.</p></div>} />
      <Route path="/relationships" element={<AdvancedRelationshipDiscovery persons={persons} />} />
      <Route path="/research" element={<CollaborativeResearch persons={persons} />} />
      <Route path="/privacy" element={<PrivacyFramework />} />
      <Route path="/sources" element={<SourceCitationManager persons={persons} />} />
      <Route path="/backup" element={<BackupManager persons={persons} />} />
      <Route path="/stories" element={<StoryGenerator persons={persons} />} />
    </Routes>
  );
};
