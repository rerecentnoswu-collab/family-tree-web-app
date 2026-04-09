import { useState, useEffect } from 'react';
import { getPersons, initializeDatabase, type Person as DBPerson } from '../../../utils/supabase/client';
import { Person } from '../types/Person';
import { sampleFamilyMembers } from '../components/SampleDataSeeder';

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
}

export const useFamilyData = (user: any): UseFamilyDataReturn => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

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
        console.log(' No persons found in database - using sample data');
        setPersons(sampleFamilyMembers);
      } else {
        console.log(` Successfully fetched ${data.length} persons`);
        setPersons(data.map(dbToAppPerson));
      }
    } catch (error) {
      console.error(' Error fetching persons:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch persons');
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
    refetch: fetchPersons
  };
};
