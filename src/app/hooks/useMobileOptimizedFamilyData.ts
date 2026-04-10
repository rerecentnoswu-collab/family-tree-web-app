import { useState, useEffect, useCallback } from 'react';
import { getPersons, initializeDatabase, checkFamilyInheritance, acceptFamilyInvitation, autoMapFamilyTree, type Person as DBPerson } from '../../../utils/supabase/client';
import { Person } from '../types/Person';

// Mobile-optimized data fetching with pagination and caching
interface UseMobileOptimizedFamilyDataReturn {
  persons: Person[];
  loading: boolean;
  error: string | null;
  needsSetup: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  totalCount: number;
  familyInheritance: {
    hasInvitations: boolean;
    invitations: any[];
    familyMatches: any[];
    error?: string;
  } | null;
  acceptInvitation: (invitationId: string) => Promise<void>;
}

const dbToAppPerson = (dbPerson: DBPerson): Person => ({
  id: dbPerson.id,
  firstName: dbPerson.first_name,
  middleName: dbPerson.middle_name,
  lastName: dbPerson.last_name,
  birthday: dbPerson.birthday || undefined,
  birthplace: dbPerson.birthplace,
  motherId: dbPerson.mother_id,
  fatherId: dbPerson.father_id,
  spouse_ids: [],
  gender: dbPerson.gender,
  events: [],
});

// Mobile-specific cache with size limit
class MobileCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize = 50; // Limit cache size for mobile
  private ttl = 5 * 60 * 1000; // 5 minutes TTL

  set(key: string, data: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const mobileCache = new MobileCache();

export const useMobileOptimizedFamilyData = (user: any, pageSize = 20): UseMobileOptimizedFamilyDataReturn => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [familyInheritance, setFamilyInheritance] = useState<UseMobileOptimizedFamilyDataReturn['familyInheritance']>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Optimized fetch with pagination and caching
  const fetchPersons = useCallback(async (isLoadMore = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isLoadMore) {
      setLoading(true);
      setPage(0);
      setPersons([]);
    }

    setError(null);
    setNeedsSetup(false);
    
    try {
      const cacheKey = `persons_${user.id}_${page}`;
      let data: DBPerson[];

      // Try cache first for mobile performance
      const cachedData = mobileCache.get(cacheKey);
      if (cachedData && !isLoadMore) {
        data = cachedData;
        console.log(' Using cached data for mobile performance');
      } else {
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

        // Fetch with pagination for mobile
        const allData = await getPersons();
        const startIndex = isLoadMore ? page * pageSize : 0;
        const endIndex = startIndex + pageSize;
        data = allData.slice(startIndex, endIndex);
        
        // Cache the result
        mobileCache.set(cacheKey, data);
        setTotalCount(allData.length);
        setHasMore(endIndex < allData.length);
      }
      
      if (!data || data.length === 0) {
        if (!isLoadMore) {
          console.log(' No persons found in database - checking for family inheritance');
          setPersons([]);
          
          // Check for family inheritance opportunities (optimized for mobile)
          if (user.email) {
            try {
              const userFirstName = user.user_metadata?.first_name || '';
              const userMiddleName = user.user_metadata?.middle_name || '';
              const userLastName = user.user_metadata?.last_name || '';
              
              if (userFirstName && userLastName) {
                console.log(' Attempting automatic family mapping...');
                try {
                  const autoMapResult = await autoMapFamilyTree(userFirstName, userMiddleName, userLastName, user.email!);
                  if (autoMapResult.success && 'familyMembersConnected' in autoMapResult) {
                    console.log(` Automatic family mapping successful! Connected to ${autoMapResult.familyMembersConnected} family members`);
                    await fetchPersons();
                    return;
                  }
                } catch (autoMapError) {
                  console.log(' Automatic mapping error, falling back to invitation check:', autoMapError);
                }
              }
              
              // Fallback to invitation-based inheritance
              const inheritanceResult = await checkFamilyInheritance(user.email!);
              setFamilyInheritance(inheritanceResult);
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
        }
      } else {
        console.log(` Successfully fetched ${data.length} persons for user ${user.id}`);
        const mappedPersons = data.map(dbToAppPerson);
        
        if (isLoadMore) {
          setPersons(prev => [...prev, ...mappedPersons]);
          setPage(prev => prev + 1);
        } else {
          setPersons(mappedPersons);
          setFamilyInheritance(null);
        }
      }
    } catch (error) {
      console.error(' Error fetching persons:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch persons');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize]);

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPersons(true);
    }
  }, [loading, hasMore, fetchPersons]);

  // Optimized accept invitation
  const acceptInvitation = useCallback(async (invitationId: string) => {
    try {
      setLoading(true);
      const result = await acceptFamilyInvitation(invitationId);
      
      if (result.success) {
        console.log(` Successfully inherited family members`);
        // Clear cache and refetch
        mobileCache.clear();
        await fetchPersons();
      }
    } catch (error) {
      console.error(' Error accepting family invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept family invitation');
    } finally {
      setLoading(false);
    }
  }, [fetchPersons]);

  // Memoized refetch function
  const refetch = useCallback(async () => {
    mobileCache.clear();
    await fetchPersons();
  }, [fetchPersons]);

  useEffect(() => {
    if (user) {
      fetchPersons();
    }
  }, [user, fetchPersons]);

  return {
    persons,
    loading,
    error,
    needsSetup,
    refetch,
    loadMore,
    hasMore,
    totalCount,
    familyInheritance,
    acceptInvitation
  };
};
