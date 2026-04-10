import { useState, useEffect } from 'react';
import { getPersons, initializeDatabase, checkFamilyInheritance, acceptFamilyInvitation, autoMapFamilyTree, type Person as DBPerson } from '../../../utils/supabase/client';
import { Person } from '../types/Person';

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

export interface UseFamilyDataReturn {
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
}

export const useFamilyData = (user: any): UseFamilyDataReturn => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [familyInheritance, setFamilyInheritance] = useState<UseFamilyDataReturn['familyInheritance']>(null);

  const fetchPersons = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsSetup(false);
    
    try {
      console.log(' Fetching persons from database...');
      const initResult = await initializeDatabase();
      
      if (!initResult.success) {
        console.error(' Database initialization failed:', initResult);
        if (initResult.needsSetup) {
          setNeedsSetup(true);
        }
        setError(initResult.error || 'Database error');
        setLoading(false);
        return;
      }

      console.log(' Fetching persons data...');
      const data = await getPersons();
      
      if (!data || data.length === 0) {
        console.log(' No persons found in database - checking for family inheritance');
        setPersons([]); // Start with empty family tree
        
        // Check for family inheritance opportunities
        if (user.email) {
          try {
            // First, try automatic family mapping based on user's name
            const userFirstName = user.user_metadata?.first_name || '';
            const userMiddleName = user.user_metadata?.middle_name || '';
            const userLastName = user.user_metadata?.last_name || '';
            
            if (userFirstName && userLastName) {
              console.log('🔍 Attempting automatic family mapping...');
              try {
                const autoMapResult = await autoMapFamilyTree(userFirstName, userMiddleName, userLastName, user.email);
                if (autoMapResult.success && 'familyMembersConnected' in autoMapResult) {
                  console.log(`✅ Automatic family mapping successful! Connected to ${autoMapResult.familyMembersConnected} family members`);
                  // Refetch data to get the mapped family tree
                  await fetchPersons();
                  return;
                } else {
                  console.log(`⚠️ Automatic mapping failed (${autoMapResult.confidence}% confidence). Checking invitations...`);
                }
              } catch (autoMapError) {
                console.log('❌ Automatic mapping error, falling back to invitation check:', autoMapError);
              }
            }
            
            // Fallback to invitation-based inheritance
            const inheritanceResult = await checkFamilyInheritance(user.email);
            setFamilyInheritance(inheritanceResult);
            console.log(' Family inheritance check completed:', inheritanceResult);
          } catch (inheritanceError) {
            console.error(' Error checking family inheritance:', inheritanceError);
            setFamilyInheritance({
              hasInvitations: false,
              invitations: [],
              familyMatches: [],
              error: inheritanceError instanceof Error ? inheritanceError.message : 'Failed to check family inheritance'
            });
          }
        }
      } else {
        console.log(` Successfully fetched ${data.length} persons for user ${user.id}`);
        setPersons(data.map(dbToAppPerson));
        setFamilyInheritance(null); // No inheritance needed if user has data
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
        console.log(` Successfully inherited ${result.inheritedMembers} family members`);
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
    if (user) {
      fetchPersons();
    }
  }, [user]);

  return {
    persons,
    loading,
    error,
    needsSetup,
    refetch: fetchPersons,
    familyInheritance,
    acceptInvitation
  };
};
