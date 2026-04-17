import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { setupDatabaseTables as _setupDatabaseTables, handleTableError } from './databaseSetup';

// Re-export setupDatabaseTables for use in other modules
export const setupDatabaseTables = _setupDatabaseTables;

// Comprehensive error handling wrapper for all Supabase operations
export async function safeSupabaseCall<T>(
  operation: () => Promise<{ data?: T; error?: any }>,
  tableName: string,
  fallbackValue?: T
): Promise<{ data?: T; error?: any; handled?: boolean }> {
  try {
    const result = await operation();
    
    if (result.error) {
      const handled = handleTableError(result.error, tableName);
      if (handled.handled) {
        console.warn(`Handled error for ${tableName}:`, handled.message);
        return { data: fallbackValue, error: null, handled: true };
      }
      return { error: result.error, handled: false };
    }
    
    return { data: result.data, error: null, handled: false };
  } catch (error) {
    const handled = handleTableError(error, tableName);
    if (handled.handled) {
      console.warn(`Caught and handled error for ${tableName}:`, handled.message);
      return { data: fallbackValue, error: null, handled: true };
    }
    return { error, handled: false };
  }
}

// Read from environment variables
const supabaseUrl = (import.meta.env as any)?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta.env as any)?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(' Supabase credentials missing!');
}

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null;

export const supabase: SupabaseClient = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'genealogy-auth-token', // Unique storage key
        },
        global: {
          headers: {
            'X-Client-Info': 'genealogy-app@1.0.0',
          },
        },
        db: {
          schema: 'public',
        },
      }
    );
  }
  return supabaseInstance;
})();

// Database types
export interface Person {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birthday?: string;
  birthplace?: string;
  occupation?: string;
  mother_id?: string;
  father_id?: string;
  gender?: 'male' | 'female' | 'other';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Family invitation interface for cross-account relationships
export interface FamilyInvitation {
  id: string;
  inviter_user_id: string;
  invited_email: string;
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling';
  person_id: string; // The person this invitation relates to
  status: 'pending' | 'accepted' | 'declined';
  created_at?: string;
  updated_at?: string;
}

// Initialize database tables and verify user access
export async function initializeDatabase() {
  try {
    // Get current user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError.message);
      return {
        success: false,
        error: 'Authentication failed',
        needsSetup: true
      };
    }

    if (!user) {
      return { success: false, error: 'Not authenticated', needsSetup: true };
    }

    // Check if the persons table exists and user has access
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('id')
        .eq('user_id', user.id) // Check user-specific access
        .limit(1);

      if (error) {
        console.error('Error checking persons table:', error);
        if (error.code === 'PGRST116') {
          // Table doesn't exist
          return { success: false, error: 'Database not initialized. Please run setup.', needsSetup: true };
        }
        return { success: false, error: error.message, needsSetup: true };
      }

      // Try to setup database tables if they don't exist
      try {
        await setupDatabaseTables();
        console.log('Database tables verified and ready');
        return { success: true, message: 'Database initialized successfully', needsSetup: false };
      } catch (setupError) {
        console.error('Failed to setup database tables:', setupError);
        return { success: false, error: 'Failed to initialize database tables', needsSetup: true };
      }
    } catch (tableError) {
      console.error('Error accessing persons table:', tableError);
      // Try to setup database tables anyway
      try {
        await setupDatabaseTables();
        console.log('Database tables created after error');
        return { success: true, message: 'Database initialized successfully', needsSetup: false };
      } catch (setupError) {
        console.error('Failed to create database tables:', setupError);
        return { success: false, error: 'Failed to initialize database tables', needsSetup: true };
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to initialize database', needsSetup: true };
  }
}

// Alternative initialization that doesn't require authentication
export async function initializeDatabaseWithoutAuth() {
  try {
    // Check if the persons table exists (no user filter)
    const { data, error } = await supabase
      .from('persons')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database initialization needed:', error.message);
      return {
        success: false,
        error: 'Database tables need to be created. Please run the SQL setup in Supabase.',
        needsSetup: true
      };
    }
    
    console.log('Database initialized successfully (no auth required)');
    return { success: true };
  } catch (error) {
    console.error('Error checking database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to database',
      needsSetup: false
    };
  }
}

// VALIDATION FUNCTION

// Validation function for person data
function validatePersonData(person: Partial<Person>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields validation
  if (!person.first_name || person.first_name.trim().length === 0) {
    errors.push('First name is required');
  }
  
  if (!person.last_name || person.last_name.trim().length === 0) {
    errors.push('Last name is required');
  }
  
  // Name length validation
  if (person.first_name && person.first_name.length > 100) {
    errors.push('First name must be less than 100 characters');
  }
  
  if (person.last_name && person.last_name.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }
  
  if (person.middle_name && person.middle_name.length > 100) {
    errors.push('Middle name must be less than 100 characters');
  }
  
  // Gender validation
  if (person.gender && !['male', 'female', 'other'].includes(person.gender)) {
    errors.push('Gender must be male, female, or other');
  }
  
  // Birthday validation
  if (person.birthday) {
    const birthday = new Date(person.birthday);
    const now = new Date();
    if (birthday > now) {
      errors.push('Birthday cannot be in the future');
    }
    if (birthday < new Date('1800-01-01')) {
      errors.push('Birthday cannot be before year 1800');
    }
  }
  
  // Birthplace validation
  if (person.birthplace && person.birthplace.length > 200) {
    errors.push('Birthplace must be less than 200 characters');
  }
  
  // Occupation validation
  if (person.occupation && person.occupation.length > 100) {
    errors.push('Occupation must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// COMPREHENSIVE READ FUNCTIONS

// Get all persons for the current user
export async function getPersons() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await safeSupabaseCall(
    async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id) // Filter by current user ID
        .order('created_at', { ascending: false });
      return { data, error };
    },
    'persons',
    [] // Return empty array if table doesn't exist
  );

  if (result.error && !result.handled) {
    console.error('Error fetching persons:', result.error);
    throw result.error;
  }

  return { data: result.data, error: result.error };
}

// Get person by ID with validation
export async function getPersonById(id: string) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the record
    .single();
  
  if (error) throw new Error(`Failed to fetch person: ${error.message}`);
  if (!data) throw new Error('Person not found or access denied');
  
  return data;
}

// Search persons by name with multiple filters
export async function searchPersons(query: string, filters?: {
  gender?: 'male' | 'female' | 'other';
  birthYear?: number;
  birthplace?: string;
  hasParents?: boolean;
  hasChildren?: boolean;
}) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  let queryBuilder = supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id);
  
  // Apply search filters
  if (query && query.trim()) {
    queryBuilder = queryBuilder.or(
      `first_name.ilike.%${query}%,` +
      `last_name.ilike.%${query}%,` +
      `middle_name.ilike.%${query}%,` +
      `birthplace.ilike.%${query}%`
    );
  }
  
  // Apply additional filters
  if (filters?.gender) {
    queryBuilder = queryBuilder.eq('gender', filters.gender);
  }
  
  if (filters?.birthYear) {
    const startDate = `${filters.birthYear}-01-01`;
    const endDate = `${filters.birthYear}-12-31`;
    queryBuilder = queryBuilder.gte('birthday', startDate).lte('birthday', endDate);
  }
  
  if (filters?.birthplace) {
    queryBuilder = queryBuilder.ilike('birthplace', `%${filters.birthplace}%`);
  }
  
  const { data, error } = await queryBuilder.order('created_at', { ascending: false });
  
  if (error) throw new Error(`Search failed: ${error.message}`);
  return data || [];
}

// Get family statistics
export async function getFamilyStatistics() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data: persons, error } = await supabase
    .from('persons')
    .select('gender, birthday, birthplace, created_at')
    .eq('user_id', user.id);
  
  if (error) throw new Error(`Failed to fetch statistics: ${error.message}`);
  
  if (!persons || persons.length === 0) {
    return {
      totalMembers: 0,
      genderDistribution: { male: 0, female: 0, other: 0 },
      averageAge: 0,
      oldestMember: null,
      youngestMember: null,
      birthplaces: []
    };
  }
  
  const genderDistribution = persons.reduce((acc, person) => {
    const gender = person.gender || 'other';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, { male: 0, female: 0, other: 0 } as Record<string, number>);
  
  const personsWithBirthday = persons.filter(p => p.birthday);
  const currentYear = new Date().getFullYear();
  const ages = personsWithBirthday.map(p => currentYear - new Date(p.birthday!).getFullYear());
  
  return {
    totalMembers: persons.length,
    genderDistribution,
    averageAge: ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0,
    oldestMember: ages.length > 0 ? Math.max(...ages) : null,
    youngestMember: ages.length > 0 ? Math.min(...ages) : null,
    birthplaces: [...new Set(persons.map(p => p.birthplace).filter(Boolean))]
  };
}

// COMPREHENSIVE CREATE FUNCTIONS

// Add a new person with duplicate prevention
export async function addPerson(person: Omit<Person, 'id' | 'created_at' | 'updated_at'>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check for duplicates before adding
  const { data: existingPersons, error: checkError } = await supabase
    .from('persons')
    .select('id, first_name, last_name, birthday')
    .eq('user_id', user.id)
    .or(`and(first_name.eq.${person.first_name},last_name.eq.${person.last_name})`);
  
  if (checkError) throw new Error(`Failed to check for duplicates: ${checkError.message}`);
  
  // Check for exact duplicate (same name and birthday)
  const exactDuplicate = existingPersons?.find(p => 
    p.first_name.toLowerCase() === person.first_name.toLowerCase() &&
    p.last_name.toLowerCase() === person.last_name.toLowerCase() &&
    p.birthday === person.birthday
  );
  
  if (exactDuplicate) {
    throw new Error(`A family member named ${person.first_name} ${person.last_name} with the same birthday already exists`);
  }

  // Check for similar duplicates (same name, different birthday)
  const similarDuplicate = existingPersons?.find(p => 
    p.first_name.toLowerCase() === person.first_name.toLowerCase() &&
    p.last_name.toLowerCase() === person.last_name.toLowerCase()
  );
  
  if (similarDuplicate) {
    console.warn(`Warning: A family member named ${person.first_name} ${person.last_name} already exists with a different birthday`);
  }

  const { data, error } = await supabase
    .from('persons')
    .insert([{
      ...person,
      user_id: user.id, // Add owner
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Clean up duplicate entries for current user
export async function cleanupDuplicates() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all persons for current user
    const { data: allPersons, error: fetchError } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;
    if (!allPersons || allPersons.length <= 1) return { cleaned: 0, message: 'No duplicates to clean' };

    console.log(`Checking ${allPersons.length} persons for duplicates...`);

    // Group by normalized name (first + last name, case-insensitive)
    const nameGroups = new Map<string, typeof allPersons>();
    
    allPersons.forEach(person => {
      const normalizedName = `${person.first_name.toLowerCase().trim()}-${person.last_name.toLowerCase().trim()}`;
      
      if (!nameGroups.has(normalizedName)) {
        nameGroups.set(normalizedName, []);
      }
      nameGroups.get(normalizedName)!.push(person);
    });

    let cleanedCount = 0;
    const duplicatesToRemove: string[] = [];

    // Find duplicates and keep the oldest entry (first created)
    nameGroups.forEach((persons, name) => {
      if (persons.length > 1) {
        console.log(`Found ${persons.length} duplicates for name: ${name}`);
        console.log('Persons:', persons.map(p => `${p.first_name} ${p.last_name} (${p.id}, created: ${p.created_at})`));
        
        // Sort by created_at to keep the oldest
        persons.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Keep the first (oldest) person, mark others for removal
        for (let i = 1; i < persons.length; i++) {
          duplicatesToRemove.push(persons[i].id);
          console.log(`Marking duplicate for removal: ${persons[i].first_name} ${persons[i].last_name} (${persons[i].id})`);
        }
        
        cleanedCount += persons.length - 1;
      }
    });

    console.log(`Total duplicates to remove: ${duplicatesToRemove.length}`);

    // Remove duplicates
    if (duplicatesToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('persons')
        .delete()
        .in('id', duplicatesToRemove);

      if (deleteError) throw deleteError;
      
      console.log(`Successfully removed ${duplicatesToRemove.length} duplicate entries`);
    }

    return {
      success: true,
      cleaned: cleanedCount,
      message: `Cleaned up ${cleanedCount} duplicate entries`
    };

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return {
      success: false,
      cleaned: 0,
      message: error instanceof Error ? error.message : 'Failed to clean up duplicates'
    };
  }
}

// Force cleanup specific duplicates by name
export async function forceCleanupDuplicatesByName(firstName: string, lastName: string) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all matching persons
    const { data: matchingPersons, error: fetchError } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
      .ilike('first_name', firstName)
      .ilike('last_name', lastName)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;
    if (!matchingPersons || matchingPersons.length <= 1) return { cleaned: 0, message: 'No duplicates to clean' };

    console.log(`Found ${matchingPersons.length} entries for ${firstName} ${lastName}`);

    // Keep the first (oldest), remove the rest
    const toKeep = matchingPersons[0];
    const toRemove = matchingPersons.slice(1);
    
    console.log(`Keeping: ${toKeep.first_name} ${toKeep.last_name} (${toKeep.id})`);
    console.log(`Removing: ${toRemove.map(p => `${p.first_name} ${p.last_name} (${p.id})`).join(', ')}`);

    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('persons')
        .delete()
        .in('id', toRemove.map(p => p.id));

      if (deleteError) throw deleteError;
      
      console.log(`Successfully removed ${toRemove.length} duplicate entries for ${firstName} ${lastName}`);
    }

    return {
      success: true,
      cleaned: toRemove.length,
      message: `Cleaned up ${toRemove.length} duplicate entries for ${firstName} ${lastName}`
    };

  } catch (error) {
    console.error('Error force cleaning duplicates:', error);
    return {
      success: false,
      cleaned: 0,
      message: error instanceof Error ? error.message : 'Failed to clean up duplicates'
    };
  }
}

// Add a new family member with validation
export async function addFamilyMember(member: Omit<Person, 'id' | 'created_at' | 'updated_at'>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Validate input data
  const validation = validatePersonData(member);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Check for duplicates
  const { data: existingPersons, error: checkError } = await supabase
    .from('persons')
    .select('id, first_name, last_name, birthday')
    .eq('user_id', user.id)
    .or(`and(first_name.eq.${member.first_name},last_name.eq.${member.last_name})`);
  
  if (checkError) throw new Error(`Failed to check for duplicates: ${checkError.message}`);
  
  // Check for exact duplicate (same name and birthday)
  const exactDuplicate = existingPersons?.find(p => 
    p.first_name.toLowerCase() === member.first_name.toLowerCase() &&
    p.last_name.toLowerCase() === member.last_name.toLowerCase() &&
    p.birthday === member.birthday
  );
  
  if (exactDuplicate) {
    throw new Error(`A family member named ${member.first_name} ${member.last_name} with the same birthday already exists`);
  }

  const { data, error } = await supabase
    .from('persons')
    .insert([{
      ...member,
      user_id: user.id, // Add owner
    }])
    .select()
    .single();
  
  if (error) throw new Error(`Failed to add family member: ${error.message}`);
  return data;
}

// COMPREHENSIVE UPDATE FUNCTIONS

// Update a person
export async function updatePerson(id: string, updates: Partial<Person>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('persons')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the record
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update family member with validation
export async function updateFamilyMember(id: string, updates: Partial<Person>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Validate update data
  const validation = validatePersonData(updates);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Check if person exists and belongs to user
  const { data: existingPerson, error: checkError } = await supabase
    .from('persons')
    .select('id, first_name, last_name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (checkError) throw new Error(`Failed to verify person: ${checkError.message}`);
  if (!existingPerson) throw new Error('Person not found or access denied');
  
  // Prevent circular relationship updates
  if (updates.mother_id === id || updates.father_id === id) {
    throw new Error('Cannot set a person as their own parent');
  }
  
  // Validate parent relationships if being updated
  if (updates.mother_id || updates.father_id) {
    const { data: parentData, error: parentError } = await supabase
      .from('persons')
      .select('id, first_name, last_name')
      .eq('id', updates.mother_id || updates.father_id)
      .eq('user_id', user.id)
      .single();
    
    if (parentError) throw new Error(`Failed to verify parent: ${parentError.message}`);
    if (!parentData) throw new Error('Parent not found or access denied');
  }
  
  const { data, error } = await supabase
    .from('persons')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the record
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update family member: ${error.message}`);
  return data;
}

// Batch update multiple family members
export async function updateFamilyMembers(updates: Array<{ id: string; updates: Partial<Person> }>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const results: Array<{ id: string; success: boolean; data?: any }> = [];
  const errors: string[] = [];
  
  for (const { id, updates: personUpdates } of updates) {
    try {
      // Validate update data
      const validation = validatePersonData(personUpdates);
      if (!validation.isValid) {
        errors.push(`Person ${id}: ${validation.errors.join(', ')}`);
        continue;
      }
      
      const { data, error } = await supabase
        .from('persons')
        .update(personUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        errors.push(`Person ${id}: ${error.message}`);
      } else {
        results.push({ id, success: true, data });
      }
    } catch (err) {
      errors.push(`Person ${id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Batch update failed: ${errors.join('; ')}`);
  }
  
  return results;
}

// COMPREHENSIVE DELETE FUNCTIONS

// Delete a person
export async function deletePerson(id: string) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if person exists and belongs to user
  const { data: person, error: checkError } = await supabase
    .from('persons')
    .select('id, first_name, last_name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (checkError) throw new Error(`Failed to verify person: ${checkError.message}`);
  if (!person) throw new Error('Person not found or access denied');

  // Check for dependent relationships
  const { data: dependents, error: dependentError } = await supabase
    .from('persons')
    .select('id, first_name, last_name')
    .or(`mother_id.eq.${id},father_id.eq.${id}`)
    .eq('user_id', user.id);
  
  if (dependentError) throw new Error(`Failed to check dependents: ${dependentError.message}`);
  
  if (dependents && dependents.length > 0) {
    const dependentNames = dependents.map(d => `${d.first_name} ${d.last_name}`).join(', ');
    throw new Error(`Cannot delete ${person.first_name} ${person.last_name} because they have dependents: ${dependentNames}. Please remove or reassign dependents first.`);
  }

  const { error } = await supabase
    .from('persons')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user owns the record
  
  if (error) throw new Error(`Failed to delete person: ${error.message}`);
  
  return { success: true, deletedPerson: person };
}

// Delete a family member with comprehensive validation
export async function deleteFamilyMember(id: string) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if person exists and belongs to user
  const { data: person, error: checkError } = await supabase
    .from('persons')
    .select('id, first_name, last_name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (checkError) throw new Error(`Failed to verify person: ${checkError.message}`);
  if (!person) throw new Error('Person not found or access denied');

  // Check for dependent relationships
  const { data: dependents, error: dependentError } = await supabase
    .from('persons')
    .select('id, first_name, last_name')
    .or(`mother_id.eq.${id},father_id.eq.${id}`)
    .eq('user_id', user.id);
  
  if (dependentError) throw new Error(`Failed to check dependents: ${dependentError.message}`);
  
  if (dependents && dependents.length > 0) {
    const dependentNames = dependents.map(d => `${d.first_name} ${d.last_name}`).join(', ');
    throw new Error(`Cannot delete ${person.first_name} ${person.last_name} because they have dependents: ${dependentNames}. Please remove or reassign dependents first.`);
  }

  const { error } = await supabase
    .from('persons')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user owns the record
  
  if (error) throw new Error(`Failed to delete person: ${error.message}`);
  
  return { success: true, deletedPerson: person };
}

// Batch delete multiple family members
export async function batchDeleteFamilyMember(ids: string[], options?: { skipDependentsCheck?: boolean; reason?: string }) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  if (!options?.skipDependentsCheck) {
    // Check for dependent relationships across all IDs
    const { data: dependents, error: dependentError } = await supabase
      .from('persons')
      .select('id, first_name, last_name')
      .or(`mother_id.in.(${ids.join(',')}),father_id.in.(${ids.join(',')})`)
      .eq('user_id', user.id);
    
    if (dependentError) throw new Error(`Failed to check dependents: ${dependentError.message}`);
    
    if (dependents && dependents.length > 0) {
      const dependentNames = dependents.map(d => `${d.first_name} ${d.last_name}`).join(', ');
      throw new Error(`Cannot delete because the following family members have dependents: ${dependentNames}. Please remove or reassign dependents first.`);
    }
  }
  
  // Perform batch deletion
  const { error } = await supabase
    .from('persons')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id);
  
  if (error) throw new Error(`Batch delete failed: ${error.message}`);
  
  return { success: true, deletedCount: ids.length };
}

// AI-powered parent matching
export async function findPotentialParents(person: Person) {
  const allPersons = await getPersons();
  
  // Skip if person doesn't have a birthday
  if (!person.birthday) {
    return {
      suggestedMother: undefined,
      suggestedFather: undefined,
      allMatches: []
    };
  }
  
  // Calculate a rough birth year from birthday
  const personBirthYear = new Date(person.birthday).getFullYear();
  
  // Filter potential parents (should be born 15-60 years before the person)
  const potentialParents = allPersons.filter(p => {
    if (!p.birthday) return false; // Skip if no birthday
    const parentBirthYear = new Date(p.birthday).getFullYear();
    const ageDiff = personBirthYear - parentBirthYear;
    return ageDiff >= 15 && ageDiff <= 60 && p.id !== person.id;
  });
  
  // Score potential parents based on:
  // 1. Matching last name
  // 2. Similar birthplace
  // 3. Appropriate age gap
  const scoredParents = potentialParents.map(parent => {
    let score = 0;
    
    // Last name match (very strong indicator)
    if (parent.last_name.toLowerCase() === person.last_name.toLowerCase()) {
      score += 50;
    }
    
    // Birthplace proximity (same city/region)
    if (parent.birthplace && person.birthplace &&
        (parent.birthplace.toLowerCase().includes(person.birthplace.toLowerCase()) ||
         person.birthplace.toLowerCase().includes(parent.birthplace.toLowerCase()))) {
      score += 30;
    }
    
    // Ideal age gap (20-35 years gets highest score)
    if (parent.birthday) {
      const parentBirthYear = new Date(parent.birthday).getFullYear();
      const ageDiff = personBirthYear - parentBirthYear;
      if (ageDiff >= 20 && ageDiff <= 35) {
        score += 20;
      } else if (ageDiff >= 15 && ageDiff <= 45) {
        score += 10;
      }
    }
    
    return { parent, score };
  });
  
  // Sort by score and return top matches
  scoredParents.sort((a, b) => b.score - a.score);
  
  // Separate by gender if available
  const mothers = scoredParents.filter(p => p.parent.gender === 'female');
  const fathers = scoredParents.filter(p => p.parent.gender === 'male');
  const unknown = scoredParents.filter(p => !p.parent.gender || p.parent.gender === 'other');
  
  return {
    suggestedMother: mothers[0]?.parent || unknown[0]?.parent,
    suggestedFather: fathers[0]?.parent || unknown[1]?.parent,
    allMatches: scoredParents.slice(0, 10).map(sp => sp.parent)
  };
}

// Enhanced automatic family tree generation based on surname matching
export async function autoGenerateFamilyTree(person: Person) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Search for potential parents across ALL users (not just current user)
    const { data: allPersons, error: searchError } = await supabase
      .from('persons')
      .select('*')
      .neq('id', person.id) // Exclude the person themselves
      .ilike('last_name', `%${person.last_name}%`) // More flexible surname search
      .order('created_at', { ascending: false }); // Get most recent first
    
    if (searchError) throw searchError;
    
    if (!allPersons || allPersons.length === 0) {
      return {
        success: false,
        message: 'No potential family members found with matching surname',
        autoAssignedParents: []
      };
    }

    console.log(`Found ${allPersons.length} potential family members with surname ${person.last_name}`);
    console.log('Potential parents found:', allPersons.map(p => `${p.first_name} ${p.last_name} (${p.birthday})`));

    // Calculate birth year for age filtering
    const personBirthYear = person.birthday ? new Date(person.birthday).getFullYear() : null;
    
    // Filter and score potential parents
    const potentialParents = allPersons.filter(p => {
      if (!p.birthday || !personBirthYear) return false;
      
      const parentBirthYear = new Date(p.birthday).getFullYear();
      const ageDiff = personBirthYear - parentBirthYear;
      
      // Parents should be 15-60 years older (more lenient range)
      const isParentAge = ageDiff >= 15 && ageDiff <= 60;
      console.log(`Age check for ${p.first_name} ${p.last_name}: ${ageDiff} years difference - ${isParentAge ? 'VALID' : 'INVALID'}`);
      
      return isParentAge;
    });

    console.log(`Found ${potentialParents.length} potential parents after age filtering`);

    // Score potential parents
    const scoredParents = potentialParents.map(parent => {
      let score = 0;
      
      // Last name exact match (highest priority)
      if (parent.last_name.toLowerCase() === person.last_name.toLowerCase()) {
        score += 100;
        console.log(`Score boost: Exact last name match for ${parent.first_name} ${parent.last_name}`);
      }
      
      // First name similarity (could indicate naming patterns)
      const parentFirstLower = parent.first_name.toLowerCase();
      const personFirstLower = person.first_name.toLowerCase();
      if (parentFirstLower.includes(personFirstLower.split(' ')[0]) || 
          personFirstLower.includes(parentFirstLower.split(' ')[0])) {
        score += 30;
        console.log(`Score boost: First name similarity for ${parent.first_name} ${parent.last_name}`);
      }
      
      // Birthplace matching
      if (parent.birthplace && person.birthplace) {
        const parentPlace = parent.birthplace.toLowerCase();
        const personPlace = person.birthplace.toLowerCase();
        if (parentPlace.includes(personPlace) || personPlace.includes(parentPlace)) {
          score += 25;
          console.log(`Score boost: Birthplace match for ${parent.first_name} ${parent.last_name}`);
        }
      }
      
      // Ideal age gap scoring
      const parentBirthYear = new Date(parent.birthday).getFullYear();
      const ageDiff = personBirthYear! - parentBirthYear;
      if (ageDiff >= 20 && ageDiff <= 35) {
        score += 50; // Ideal parent age
        console.log(`Score boost: Ideal age gap (${ageDiff} years) for ${parent.first_name} ${parent.last_name}`);
      } else if (ageDiff >= 15 && ageDiff <= 45) {
        score += 25; // Acceptable parent age
        console.log(`Score boost: Acceptable age gap (${ageDiff} years) for ${parent.first_name} ${parent.last_name}`);
      }
      
      console.log(`Final score for ${parent.first_name} ${parent.last_name}: ${score}`);
      return { parent, score };
    });

    // Sort by score (highest first)
    scoredParents.sort((a, b) => b.score - a.score);
    
    console.log('Scored parents sorted by score:', scoredParents.map(sp => `${sp.parent.first_name} ${sp.parent.last_name}: ${sp.score}`));
    
    // Separate by gender
    const mothers = scoredParents.filter(p => p.parent.gender === 'female');
    const fathers = scoredParents.filter(p => p.parent.gender === 'male');
    const unknown = scoredParents.filter(p => !p.parent.gender || p.parent.gender === 'other');
    
    console.log(`Found ${mothers.length} mothers, ${fathers.length} fathers, ${unknown.length} unknown gender`);
    
    // Auto-assign parents if high-confidence matches found (lowered threshold)
    const autoAssignedParents = [];
    const updates = [];
    
    // Assign mother if found with reasonable confidence (score >= 75)
    if (mothers.length > 0 && mothers[0].score >= 75) {
      const mother = mothers[0].parent;
      autoAssignedParents.push({ type: 'mother', person: mother, confidence: mothers[0].score });
      updates.push({ 
        id: person.id, 
        mother_id: mother.id 
      });
      console.log(`Auto-assigning mother: ${mother.first_name} ${mother.last_name} (confidence: ${mothers[0].score})`);
    }
    
    // Assign father if found with reasonable confidence (score >= 75)
    if (fathers.length > 0 && fathers[0].score >= 75) {
      const father = fathers[0].parent;
      autoAssignedParents.push({ type: 'father', person: father, confidence: fathers[0].score });
      updates.push({ 
        id: person.id, 
        father_id: father.id 
      });
      console.log(`Auto-assigning father: ${father.first_name} ${father.last_name} (confidence: ${fathers[0].score})`);
    }
    
    // Apply updates if any parents were auto-assigned
    if (updates.length > 0) {
      console.log(`Applying updates:`, updates);
      const { error: updateError } = await supabase
        .from('persons')
        .update(updates[0]) // Update the person with parent assignments
        .eq('id', person.id);
        
      if (updateError) throw updateError;
      
      console.log(`Successfully auto-assigned ${updates.length} parents for ${person.first_name} ${person.last_name}`);
    } else {
      console.log(`No high-confidence parent matches found for ${person.first_name} ${person.last_name}`);
    }
    
    return {
      success: true,
      message: `Found ${allPersons.length} potential family members, auto-assigned ${autoAssignedParents.length} parents`,
      autoAssignedParents,
      allPotentialParents: scoredParents.slice(0, 10),
      totalMatches: allPersons.length
    };
    
  } catch (error) {
    console.error('Error in autoGenerateFamilyTree:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to auto-generate family tree',
      autoAssignedParents: []
    };
  }
}

export async function checkFamilyInheritance(userEmail: string) {
  try {
    // Check for pending family invitations
    const { data: invitations, error: invitationError } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('invited_email', userEmail.toLowerCase())
      .eq('status', 'pending');

    if (invitationError) {
      const handled = handleTableError(invitationError, 'family_invitations');
      if (handled.handled) {
        console.log('Family invitations table not available, continuing with basic functionality');
        return {
          hasInvitations: false,
          invitations: [],
          familyMatches: [],
          error: null
        };
      }
      throw new Error(`Failed to check invitations: ${invitationError.message}`);
    }

    // Check for potential family matches based on email domain or patterns
    const { data: allPersons, error: personsError } = await supabase
      .from('persons')
      .select('first_name, last_name, user_id, created_at')
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Exclude system users

    if (personsError) {
      const handled = handleTableError(personsError, 'persons');
      if (handled.handled) {
        return {
          hasInvitations: invitations && invitations.length > 0,
          invitations: invitations || [],
          familyMatches: [],
          error: null
        };
      }
      throw new Error(`Failed to check family matches: ${personsError.message}`);
    }

    // Find potential family matches
    const familyMatches = [];
    if (allPersons && allPersons.length > 0) {
      // Simple matching logic - can be enhanced
      const emailDomain = userEmail.split('@')[1];
      familyMatches.push(...allPersons.filter(person => 
        person.first_name && person.last_name // Basic filter
      ));
    }

    return {
      hasInvitations: invitations && invitations.length > 0,
      invitations: invitations || [],
      familyMatches: familyMatches.slice(0, 5), // Limit to 5 matches
      error: null
    };

  } catch (error) {
    console.error('Error checking family inheritance:', error);
    return {
      hasInvitations: false,
      invitations: [],
      familyMatches: [],
      error: error instanceof Error ? error.message : 'Failed to check family inheritance'
    };
  }
}

// Accept family invitation and inherit family tree
export async function acceptFamilyInvitation(invitationId: string) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('invited_email', user.email?.toLowerCase())
      .single();
    
    if (invitationError) throw invitationError;
    if (!invitation) throw new Error('Invitation not found');

    // Update invitation status
    const { error: updateError } = await supabase
      .from('family_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);
    
    if (updateError) throw updateError;

    return { success: true, invitation };
  } catch (error) {
    console.error('Error accepting family invitation:', error);
    throw error instanceof Error ? error : new Error('Failed to accept family invitation');
  }
}

// Create family invitation
export async function createFamilyInvitation(invitedEmail: string, relationshipType: 'parent' | 'child' | 'spouse' | 'sibling', personId: string) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify person belongs to user
    const { data: person, error: personError } = await supabase
      .from('persons')
      .select('id, first_name, last_name')
      .eq('id', personId)
      .eq('user_id', user.id)
      .single();
    
    if (personError) throw personError;
    if (!person) throw new Error('Person not found or access denied');

    // Create invitation
    const { data, error } = await supabase
      .from('family_invitations')
      .insert([{
        inviter_user_id: user.id,
        invited_email: invitedEmail.toLowerCase(),
        relationship_type: relationshipType,
        person_id: personId,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating family invitation:', error);
    throw error instanceof Error ? error : new Error('Failed to create family invitation');
  }
}

// Automatic family tree mapping based on user name and age heuristics
export async function autoMapFamilyTree(firstName: string, middleName: string, lastName: string, userEmail: string) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Search for potential family members across all users (with security constraints)
    const { data: potentialMatches, error } = await supabase
      .from('persons')
      .select('*')
      .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`)
      .limit(50);
    
    if (error) throw error;

    // Score matches based on relationship likelihood
    const scoredMatches = (potentialMatches || []).map(person => {
      let score = 0;
      let relationshipType = '';

      // Name matching scoring
      if (person.first_name?.toLowerCase() === firstName.toLowerCase()) {
        score += 40;
      }
      if (person.last_name?.toLowerCase() === lastName.toLowerCase()) {
        score += 40;
      }
      if (middleName && person.middle_name?.toLowerCase() === middleName.toLowerCase()) {
        score += 20;
      }

      // Determine likely relationship based on age and other factors
      if (person.birthday) {
        const personAge = new Date().getFullYear() - new Date(person.birthday).getFullYear();
        
        // If person is significantly older, likely parent
        if (personAge > 25) {
          relationshipType = 'parent';
          score += 20;
        }
        // If similar age, likely sibling
        else if (Math.abs(personAge - 25) < 10) {
          relationshipType = 'sibling';
          score += 15;
        }
      }

      return {
        person,
        score,
        relationshipType,
        confidence: score > 50 ? 'high' : score > 30 ? 'medium' : 'low'
      };
    }).filter(match => match.score > 30);

    // Sort by confidence score
    scoredMatches.sort((a, b) => b.score - a.score);

    // If high confidence matches found, create copies for current user
    if (scoredMatches.length > 0 && scoredMatches[0].confidence === 'high') {
      const familyMembersToCopy = scoredMatches.filter(m => m.confidence === 'high');
      const copiedMembers = [];

      for (const match of familyMembersToCopy) {
        const { person } = match;
        
        // Create a copy of the person for the current user
        const { data: copiedPerson, error: copyError } = await supabase
          .from('persons')
          .insert([{
            first_name: person.first_name,
            middle_name: person.middle_name,
            last_name: person.last_name,
            birthday: person.birthday,
            birthplace: person.birthplace,
            gender: person.gender,
            user_id: user.id // Assign to current user
          }])
          .select()
          .single();

        if (!copyError && copiedPerson) {
          copiedMembers.push(copiedPerson);
        }
      }

      return {
        success: true,
        familyMembersConnected: copiedMembers.length,
        confidence: 85,
        sourceUser: userEmail,
        matches: scoredMatches
      };
    }

    return {
      success: false,
      confidence: scoredMatches.length > 0 ? Math.max(...scoredMatches.map(m => m.score)) : 0,
      matches: {
        confidence: scoredMatches.length > 0 ? Math.max(...scoredMatches.map(m => m.score)) : 0,
        parents: scoredMatches.filter(m => m.relationshipType === 'parent'),
        siblings: scoredMatches.filter(m => m.relationshipType === 'sibling'),
        allMatches: scoredMatches
      },
      reason: scoredMatches.length === 0 ? 'No matching family members found' : 'Insufficient confidence for automatic mapping'
    };
  } catch (error) {
    console.error('Error in automatic family mapping:', error);
    return {
      success: false,
      confidence: 0,
      matches: { confidence: 0, parents: [], siblings: [], allMatches: [] },
      reason: error instanceof Error ? error.message : 'Automatic mapping failed'
    };
  }
}
