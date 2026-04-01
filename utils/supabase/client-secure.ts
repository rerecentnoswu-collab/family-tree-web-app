// SECURE Supabase client with authentication
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// ENVIRONMENT VARIABLES (SECURE APPROACH)
// ============================================

// ❌ NEVER hardcode credentials like this in production:
// export const publicAnonKey = "eyJhbGci..."

// ✅ ALWAYS use environment variables:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ SECURITY WARNING: Supabase credentials not configured properly. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

// ============================================
// SECURE CLIENT CONFIGURATION
// ============================================

export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage, // Secure session storage
      storageKey: 'genealogy-auth-token',
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

// ============================================
// DATABASE TYPES
// ============================================

export interface Person {
  id: string;
  user_id: string; // OWNER of this record
  first_name: string;
  middle_name?: string;
  last_name: string;
  birthday: string;
  birthplace: string;
  mother_id?: string;
  father_id?: string;
  gender?: 'male' | 'female' | 'other';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  deleted_at?: string | null;
}

export interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by?: string;
  joined_at?: string;
}

// ============================================
// AUTHENTICATION HELPERS
// ============================================

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .substring(0, 255); // Prevent buffer overflow
}

function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();

  // Must be a valid date
  if (isNaN(date.getTime())) return false;

  // Must be in the past
  if (date > now) return false;

  // Must be after year 1800 (reasonable for genealogy)
  if (date.getFullYear() < 1800) return false;

  return true;
}

function validatePersonInput(person: Partial<Person>): string[] {
  const errors: string[] = [];

  if (!person.first_name || person.first_name.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!person.last_name || person.last_name.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (!person.birthday || !validateDate(person.birthday)) {
    errors.push('Valid birthday is required');
  }

  if (!person.birthplace || person.birthplace.trim().length === 0) {
    errors.push('Birthplace is required');
  }

  if (person.gender && !['male', 'female', 'other'].includes(person.gender)) {
    errors.push('Invalid gender value');
  }

  return errors;
}

// ============================================
// SECURE DATABASE OPERATIONS
// ============================================

export async function initializeDatabase() {
  try {
    const { error } = await supabase.from('persons').select('id').limit(1);

    if (error) {
      console.error('Database initialization needed:', error.message);
      return {
        success: false,
        error: 'Database tables need to be created. Please run the SQL setup in Supabase.',
        needsSetup: true,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error checking database:', error);
    return {
      success: false,
      error: 'Failed to connect to database',
      needsSetup: false,
    };
  }
}

// Get all persons for CURRENT USER only
export async function getPersons(): Promise<Person[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id) // ✅ SECURITY: Only user's own records
    .is('deleted_at', null) // ✅ SECURITY: Exclude soft-deleted records
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Add a new person (with security checks)
export async function addPerson(
  person: Omit<Person, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'created_by' | 'deleted_at'>
): Promise<Person> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');

  // ✅ SECURITY: Validate input
  const errors = validatePersonInput(person);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // ✅ SECURITY: Sanitize input
  const sanitizedPerson = {
    ...person,
    first_name: sanitizeString(person.first_name),
    middle_name: person.middle_name ? sanitizeString(person.middle_name) : undefined,
    last_name: sanitizeString(person.last_name),
    birthplace: sanitizeString(person.birthplace),
    user_id: user.id, // ✅ SECURITY: Set owner
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('persons')
    .insert([sanitizedPerson])
    .select()
    .single();

  if (error) {
    console.error('Error adding person:', error);
    throw new Error('Failed to add person: ' + error.message);
  }

  return data;
}

// Update a person (with ownership check)
export async function updatePerson(
  id: string,
  updates: Partial<Person>
): Promise<Person> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');

  // ✅ SECURITY: Validate input
  const errors = validatePersonInput(updates);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // ✅ SECURITY: Sanitize input
  const sanitizedUpdates: any = {};
  if (updates.first_name) sanitizedUpdates.first_name = sanitizeString(updates.first_name);
  if (updates.middle_name) sanitizedUpdates.middle_name = sanitizeString(updates.middle_name);
  if (updates.last_name) sanitizedUpdates.last_name = sanitizeString(updates.last_name);
  if (updates.birthplace) sanitizedUpdates.birthplace = sanitizeString(updates.birthplace);
  if (updates.birthday) sanitizedUpdates.birthday = updates.birthday;
  if (updates.gender) sanitizedUpdates.gender = updates.gender;
  if (updates.mother_id !== undefined) sanitizedUpdates.mother_id = updates.mother_id;
  if (updates.father_id !== undefined) sanitizedUpdates.father_id = updates.father_id;

  // ⚠️ SECURITY: Prevent tampering with ownership fields
  delete sanitizedUpdates.user_id;
  delete sanitizedUpdates.created_by;
  delete sanitizedUpdates.created_at;

  const { data, error } = await supabase
    .from('persons')
    .update(sanitizedUpdates)
    .eq('id', id)
    .eq('user_id', user.id) // ✅ SECURITY: Only update own records
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    console.error('Error updating person:', error);
    throw new Error('Failed to update person: ' + error.message);
  }

  return data;
}

// Soft delete a person
export async function deletePerson(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');

  const { error } = await supabase
    .from('persons')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id); // ✅ SECURITY: Only delete own records

  if (error) {
    console.error('Error deleting person:', error);
    throw new Error('Failed to delete person: ' + error.message);
  }
}

// ============================================
// RATE LIMITING (CLIENT-SIDE)
// ============================================

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(action: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(action) || [];

  // Remove old timestamps outside the window
  const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  rateLimitMap.set(action, validTimestamps);
  return true;
}

export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: string,
  maxRequests = 10,
  windowMs = 60000
): T {
  return (async (...args: any[]) => {
    if (!checkRateLimit(action, maxRequests, windowMs)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    return fn(...args);
  }) as T;
}

// Rate-limited versions of functions
export const addPersonRateLimited = withRateLimit(addPerson, 'addPerson', 10, 60000);
export const updatePersonRateLimited = withRateLimit(updatePerson, 'updatePerson', 20, 60000);

// ============================================
// AI-POWERED PARENT MATCHING (SECURE)
// ============================================

export async function findPotentialParents(person: Person) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');

  // ✅ SECURITY: Only get user's own persons
  const allPersons = await getPersons();

  const personBirthYear = new Date(person.birthday).getFullYear();

  const potentialParents = allPersons.filter((p) => {
    const parentBirthYear = new Date(p.birthday).getFullYear();
    const ageDiff = personBirthYear - parentBirthYear;
    return ageDiff >= 15 && ageDiff <= 60 && p.id !== person.id;
  });

  const scoredParents = potentialParents.map((parent) => {
    let score = 0;

    if (parent.last_name.toLowerCase() === person.last_name.toLowerCase()) {
      score += 50;
    }

    if (
      parent.birthplace.toLowerCase().includes(person.birthplace.toLowerCase()) ||
      person.birthplace.toLowerCase().includes(parent.birthplace.toLowerCase())
    ) {
      score += 30;
    }

    const parentBirthYear = new Date(parent.birthday).getFullYear();
    const ageDiff = personBirthYear - parentBirthYear;
    if (ageDiff >= 20 && ageDiff <= 35) {
      score += 20;
    } else if (ageDiff >= 15 && ageDiff <= 45) {
      score += 10;
    }

    return { parent, score };
  });

  scoredParents.sort((a, b) => b.score - a.score);

  const mothers = scoredParents.filter((p) => p.parent.gender === 'female');
  const fathers = scoredParents.filter((p) => p.parent.gender === 'male');
  const unknown = scoredParents.filter((p) => !p.parent.gender || p.parent.gender === 'other');

  return {
    suggestedMother: mothers[0]?.parent || unknown[0]?.parent,
    suggestedFather: fathers[0]?.parent || unknown[1]?.parent,
    allMatches: scoredParents.slice(0, 10).map((sp) => sp.parent),
  };
}

// ============================================
// SECURITY MONITORING
// ============================================

export function logSecurityEvent(event: string, details: any) {
  console.warn(`[SECURITY EVENT] ${event}`, details);

  // In production, send to monitoring service like Sentry
  // Sentry.captureMessage(event, { level: 'warning', extra: details });
}

// Monitor auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    logSecurityEvent('User signed in', { userId: session?.user?.id });
  } else if (event === 'SIGNED_OUT') {
    logSecurityEvent('User signed out', {});
  } else if (event === 'TOKEN_REFRESHED') {
    logSecurityEvent('Token refreshed', { userId: session?.user?.id });
  }
});
