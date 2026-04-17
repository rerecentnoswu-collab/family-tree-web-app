import { useState, useEffect } from 'react';
import { getPersons, initializeDatabase, checkFamilyInheritance, acceptFamilyInvitation, autoGenerateFamilyTree, cleanupDuplicates, forceCleanupDuplicatesByName, setupDatabaseTables, type Person as DBPerson } from '../../../utils/supabase/client';
import { findCrossAccountFamilyMembers, suggestCrossAccountConnections, type CrossAccountFamilyMember } from '../../../utils/supabase/familyMapping';
import { Person } from '../types/Person';
import { useAuth } from './useAuth';

const dbToAppPerson = (dbPerson: DBPerson): Person => ({
  id: dbPerson.id,
  firstName: dbPerson.first_name,
  middleName: dbPerson.middle_name,
  lastName: dbPerson.last_name,
  birthday: dbPerson.birthday || undefined,
  birthplace: dbPerson.birthplace,
  gender: dbPerson.gender,
  motherId: dbPerson.mother_id,
  fatherId: dbPerson.father_id,
  occupation: dbPerson.occupation,
  deathDate: dbPerson.death_date,
  deathPlace: dbPerson.death_place
});

interface UseFamilyDataReturn {
  persons: Person[];
  loading: boolean;
  error: string | null;
  needsSetup: boolean;
  refetch: () => Promise<void>;
  familyInheritance: {
    hasInvitations: boolean;
    invitations: any[];
    familyMatches: any[];
    error?: string;
  } | null;
  acceptInvitation: (invitationId: string) => Promise<void>;
  crossAccountFamilyMembers: CrossAccountFamilyMember[];
  crossAccountConnections: {
    suggestedParents: CrossAccountFamilyMember[];
    suggestedSiblings: CrossAccountFamilyMember[];
    suggestedChildren: CrossAccountFamilyMember[];
    confidence: number;
  };
}

export const useFamilyData = (): UseFamilyDataReturn => {
  const { user, isAuthenticated } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [familyInheritance, setFamilyInheritance] = useState<UseFamilyDataReturn['familyInheritance']>(null);
  const [crossAccountFamilyMembers, setCrossAccountFamilyMembers] = useState<CrossAccountFamilyMember[]>([]);
  const [crossAccountConnections, setCrossAccountConnections] = useState<{
    suggestedParents: CrossAccountFamilyMember[];
    suggestedSiblings: CrossAccountFamilyMember[];
    suggestedChildren: CrossAccountFamilyMember[];
    confidence: number;
  }>({
    suggestedParents: [],
    suggestedSiblings: [],
    suggestedChildren: [],
    confidence: 0
  });

  const fetchPersons = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsSetup(false);

    try {
      // Initialize database if needed
      const initResult = await initializeDatabase();
      if (!initResult.success) {
        setError(initResult.message);
        setNeedsSetup(true);
        return;
      }

      // Setup missing database tables gracefully
      try {
        await setupDatabaseTables();
      } catch (setupError) {
        console.log('Database setup failed, continuing with basic functionality:', setupError);
      }

      // Check for family inheritance
      const inheritanceResult = await checkFamilyInheritance(user.email || '');
      
      if (inheritanceResult.hasInvitations) {
        console.log('User has family invitations available');
        setFamilyInheritance(inheritanceResult);
      } else {
        console.log('No family invitations found');
        setFamilyInheritance(null);
      }

      // Get current user's persons
      const { data, error: fetchError } = await getPersons();
      
      if (fetchError) {
        console.error('Error fetching persons:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No persons found for user');
        setPersons([]);
        setFamilyInheritance(null);
        return;
      }

      console.log(` Successfully fetched ${data.length} persons for user ${user.id}`);
      console.log('Raw data from database:', data);
      const mappedPersons = data.map(dbToAppPerson);
      console.log('Mapped persons:', mappedPersons);
      
      // Force clean up specific duplicates first
      try {
        // Force cleanup John Marc Centino duplicates
        const johnMarcCleanup = await forceCleanupDuplicatesByName('John Marc', 'Centino');
        console.log('John Marc cleanup result:', johnMarcCleanup);
        
        // Force cleanup Reycel Centino duplicates
        const reycelCleanup = await forceCleanupDuplicatesByName('Reycel', 'Centino');
        console.log('Reycel cleanup result:', reycelCleanup);
        
        // Run general cleanup as well
        const cleanupResult = await cleanupDuplicates();
        console.log('General cleanup result:', cleanupResult);
        
        if ((johnMarcCleanup.success && johnMarcCleanup.cleaned > 0) || 
            (reycelCleanup.success && reycelCleanup.cleaned > 0) ||
            (cleanupResult.success && cleanupResult.cleaned > 0)) {
          console.log('Duplicates were cleaned up, refetching data...');
          // Refetch data after cleanup
          await fetchPersons();
          return;
        }
      } catch (cleanupError) {
        console.log('Cleanup failed:', cleanupError);
      }
      
      // Trigger automatic family tree generation for persons without parents
      for (const person of mappedPersons) {
        if (!person.motherId && !person.fatherId && person.birthday && person.lastName) {
          console.log(`Running automatic family tree generation for ${person.firstName} ${person.lastName}`);
          try {
            const autoGenResult = await autoGenerateFamilyTree({
              id: person.id,
              first_name: person.firstName,
              middle_name: person.middleName,
              last_name: person.lastName,
              birthday: person.birthday,
              birthplace: person.birthplace,
              gender: person.gender,
              mother_id: person.motherId,
              father_id: person.fatherId
            } as DBPerson);
            
            if (autoGenResult.success && autoGenResult.autoAssignedParents.length > 0) {
              console.log(`Auto-assigned parents for ${person.firstName}:`, autoGenResult.autoAssignedParents);
              // Refetch data to get updated relationships
              await fetchPersons();
              return; // Exit early since we're refetching
            }
          } catch (autoGenError) {
            console.log('Auto-generation failed for', person.firstName, ':', autoGenError);
          }
        }
      }
      
      setPersons(mappedPersons);
      setFamilyInheritance(null); // No inheritance needed if user has data
      
      // Discover cross-account family members
      try {
        console.log('Discovering cross-account family members...');
        const allCrossAccountMembers: CrossAccountFamilyMember[] = [];
        
        for (const person of mappedPersons) {
          const crossAccountMembers = await findCrossAccountFamilyMembers(person.id);
          allCrossAccountMembers.push(...crossAccountMembers);
        }
        
        // Remove duplicates
        const uniqueMembers = allCrossAccountMembers.filter((member, index, self) =>
          index === self.findIndex(m => m.person.id === member.person.id)
        );
        
        setCrossAccountFamilyMembers(uniqueMembers);
        console.log(`Found ${uniqueMembers.length} cross-account family members`);
        
        // Get suggested connections for each person
        const allConnections = {
          suggestedParents: [] as CrossAccountFamilyMember[],
          suggestedSiblings: [] as CrossAccountFamilyMember[],
          suggestedChildren: [] as CrossAccountFamilyMember[],
          confidence: 0
        };
        
        for (const person of mappedPersons) {
          const connections = await suggestCrossAccountConnections(person.id);
          allConnections.suggestedParents.push(...connections.suggestedParents);
          allConnections.suggestedSiblings.push(...connections.suggestedSiblings);
          allConnections.suggestedChildren.push(...connections.suggestedChildren);
        }
        
        // Remove duplicates and calculate average confidence
        const uniqueParents = allConnections.suggestedParents.filter((member, index, self) =>
          index === self.findIndex(m => m.person.id === member.person.id)
        );
        const uniqueSiblings = allConnections.suggestedSiblings.filter((member, index, self) =>
          index === self.findIndex(m => m.person.id === member.person.id)
        );
        const uniqueChildren = allConnections.suggestedChildren.filter((member, index, self) =>
          index === self.findIndex(m => m.person.id === member.person.id)
        );
        
        const allConfidenceScores = [
          ...uniqueParents.map(m => m.confidence),
          ...uniqueSiblings.map(m => m.confidence),
          ...uniqueChildren.map(m => m.confidence)
        ];
        
        const avgConfidence = allConfidenceScores.length > 0 
          ? allConfidenceScores.reduce((sum, score) => sum + score, 0) / allConfidenceScores.length 
          : 0;
        
        setCrossAccountConnections({
          suggestedParents: uniqueParents,
          suggestedSiblings: uniqueSiblings,
          suggestedChildren: uniqueChildren,
          confidence: Math.round(avgConfidence)
        });
        
      } catch (crossAccountError) {
        console.log('Cross-account discovery failed:', crossAccountError);
      }
    } catch (error) {
      console.error(' Error fetching persons:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch persons');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      const result = await acceptFamilyInvitation(invitationId);
      
      if (result.success) {
        console.log(` Successfully accepted family invitation`);
        // Refetch persons to get the updated family tree
        await fetchPersons();
      }
    } catch (error) {
      console.error(' Error accepting family invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept family invitation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPersons();
    } else if (!isAuthenticated) {
      setLoading(false);
      setPersons([]);
    }
  }, [isAuthenticated, user]);

  return {
    persons,
    loading,
    error,
    needsSetup,
    refetch: fetchPersons,
    familyInheritance,
    acceptInvitation,
    crossAccountFamilyMembers,
    crossAccountConnections
  };
};
