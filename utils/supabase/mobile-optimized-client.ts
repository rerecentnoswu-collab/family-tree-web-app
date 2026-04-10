import { supabase } from './client';
import { Person } from './client';

// Mobile-optimized database queries with performance enhancements
export class MobileOptimizedQueries {
  // Cache for frequently accessed data
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static MAX_CACHE_SIZE = 100;

  // Optimized get persons with pagination and selective field loading
  static async getPersonsPaginated(
    page: number = 0, 
    pageSize: number = 20,
    fields: string[] = ['id', 'first_name', 'last_name', 'birthday', 'gender', 'birthplace']
  ): Promise<{ data: Person[]; totalCount: number; hasMore: boolean }> {
    const cacheKey = `persons_${page}_${pageSize}_${fields.join(',')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get total count first (cached separately)
      const totalCountCacheKey = 'persons_total_count';
      let totalCount = this.getFromCache(totalCountCacheKey)?.totalCount;
      
      if (!totalCount) {
        const { count, error: countError } = await supabase
          .from('persons')
          .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        totalCount = count || 0;
        this.setCache(totalCountCacheKey, { totalCount });
      }

      // Get paginated data with only required fields
      const { data, error } = await supabase
        .from('persons')
        .select(fields.join(','))
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const result = {
        data: data || [],
        totalCount,
        hasMore: (page + 1) * pageSize < totalCount
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching paginated persons:', error);
      throw error;
    }
  }

  // Optimized search with debouncing and minimal field selection
  static async searchPersonsOptimized(
    query: string,
    page: number = 0,
    pageSize: number = 10
  ): Promise<{ data: Person[]; totalCount: number }> {
    const cacheKey = `search_${query}_${page}_${pageSize}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use minimal fields for search performance
      const { data, error, count } = await supabase
        .from('persons')
        .select('id, first_name, last_name, birthday, gender', { count: 'exact' })
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const result = {
        data: data || [],
        totalCount: count || 0
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching persons:', error);
      throw error;
    }
  }

  // Batch operations for mobile to reduce round trips
  static async getPersonsWithRelationships(personIds: string[]): Promise<Person[]> {
    const cacheKey = `persons_with_relationships_${personIds.join(',')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Single query to get persons and their relationships
      const { data, error } = await supabase
        .from('persons')
        .select(`
          id,
          first_name,
          last_name,
          birthday,
          gender,
          birthplace,
          mother_id,
          father_id
        `)
        .in('id', personIds);

      if (error) throw error;

      this.setCache(cacheKey, data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching persons with relationships:', error);
      throw error;
    }
  }

  // Optimized family statistics with caching
  static async getFamilyStatisticsOptimized(): Promise<any> {
    const cacheKey = 'family_statistics';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use a single aggregated query instead of multiple queries
      const { data, error } = await supabase
        .from('persons')
        .select(`
          gender,
          birthday,
          birthplace,
          created_at
        `);

      if (error) throw error;

      if (!data || data.length === 0) {
        const emptyStats = {
          totalMembers: 0,
          genderDistribution: { male: 0, female: 0, other: 0 },
          averageAge: 0,
          oldestMember: null,
          youngestMember: null,
          birthplaces: []
        };
        this.setCache(cacheKey, emptyStats);
        return emptyStats;
      }

      // Process statistics efficiently
      const genderDistribution = data.reduce((acc, person) => {
        const gender = person.gender || 'other';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, { male: 0, female: 0, other: 0 } as Record<string, number>);

      const personsWithBirthday = data.filter(p => p.birthday);
      const currentYear = new Date().getFullYear();
      const ages = personsWithBirthday.map(p => currentYear - new Date(p.birthday!).getFullYear());

      const stats = {
        totalMembers: data.length,
        genderDistribution,
        averageAge: ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0,
        oldestMember: ages.length > 0 ? Math.max(...ages) : null,
        youngestMember: ages.length > 0 ? Math.min(...ages) : null,
        birthplaces: [...new Set(data.map(p => p.birthplace).filter(Boolean))]
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching family statistics:', error);
      throw error;
    }
  }

  // Cache management
  private static getFromCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  private static setCache(key: string, data: any): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static clearCache(): void {
    this.cache.clear();
  }

  // Preload commonly accessed data for mobile
  static async preloadMobileData(): Promise<void> {
    try {
      // Preload first page of persons
      await this.getPersonsPaginated(0, 10);
      
      // Preload statistics
      await this.getFamilyStatisticsOptimized();
      
      console.log('Mobile data preloaded successfully');
    } catch (error) {
      console.error('Error preloading mobile data:', error);
    }
  }
}

// Mobile-specific performance monitoring
export class MobilePerformanceMonitor {
  static logQueryPerformance(queryName: string, startTime: number, endTime: number): void {
    const duration = endTime - startTime;
    console.log(`[Mobile Performance] ${queryName}: ${duration}ms`);
    
    // Alert on slow queries
    if (duration > 1000) {
      console.warn(`[Mobile Performance Warning] Slow query detected: ${queryName} took ${duration}ms`);
    }
  }

  static measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      queryFn()
        .then(result => {
          const endTime = performance.now();
          this.logQueryPerformance(queryName, startTime, endTime);
          resolve(result);
        })
        .catch(error => {
          const endTime = performance.now();
          this.logQueryPerformance(queryName, startTime, endTime);
          reject(error);
        });
    });
  }
}
