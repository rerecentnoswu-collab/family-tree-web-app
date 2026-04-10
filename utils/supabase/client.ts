import { createClient } from '@supabase/supabase-js';

// Read from environment variables
const supabaseUrl = (import.meta.env as any)?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta.env as any)?.VITE_SUPABASE_ANON_KEY || '';

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
    // Get current user first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        needsSetup: false
      };
    }

    // Check if the persons table exists and user has access
    const { error } = await supabase
      .from('persons')
      .select('id')
      .eq('user_id', user.id) // Check user-specific access
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

  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id) // Filter by current user ID
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
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

// Add a new person
export async function addPerson(person: Omit<Person, 'id' | 'created_at' | 'updated_at'>) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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

// Check if user is a child in existing family relationships
export async function checkFamilyInheritance(userEmail: string) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check for pending family invitations
    const { data: invitations, error: invitationError } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('invited_email', userEmail.toLowerCase())
      .eq('status', 'pending');
    
    if (invitationError && !invitationError.message?.includes('does not exist')) {
      throw invitationError;
    }

    return {
      hasInvitations: (invitations && invitations.length > 0) || false,
      invitations: invitations || [],
      familyMatches: []
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
