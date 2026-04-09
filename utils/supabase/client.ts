import { createClient } from '@supabase/supabase-js';

// ✅ Read from environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(' Supabase credentials missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Person {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birthday?: string;
  birthplace?: string;
  mother_id?: string;
  father_id?: string;
  gender?: 'male' | 'female' | 'other';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Check if the persons table exists by trying to query it
    const { error } = await supabase
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
    
    return { success: true };
  } catch (error) {
    console.error('Error checking database:', error);
    return {
      success: false,
      error: 'Failed to connect to database',
      needsSetup: false
    };
  }
}

// Get all persons
export async function getPersons() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Add a new person
export async function addPerson(person: Omit<Person, 'id' | 'created_at' | 'updated_at'>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('persons')
    .insert([{
      ...person,
      user_id: user.id, // ✅ Add owner
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update a person
export async function updatePerson(id: string, updates: Partial<Person>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('persons')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // ✅ Ensure user owns the record
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete a person
export async function deletePerson(id: string) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('persons')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user owns the record
  
  if (error) throw error;
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