import { supabase, Person } from './client';

// Cross-account family mapping based on parent relationships
export interface FamilyGroup {
  id: string;
  familyName: string;
  parents: Person[];
  children: Person[];
  accounts: string[]; // Array of user IDs who have members in this family
  confidence: number; // How confident we are about this family grouping
}

export interface CrossAccountFamilyMember {
  person: Person;
  accountId: string;
  relationship: 'parent' | 'child' | 'sibling';
  confidence: number;
}

// Find family groups across all accounts based on parent relationships
export async function findCrossAccountFamilyGroups(): Promise<FamilyGroup[]> {
  try {
    // Get all persons from all accounts
    const { data: allPersons, error } = await supabase
      .from('persons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!allPersons || allPersons.length === 0) return [];

    console.log(`Analyzing ${allPersons.length} persons across all accounts for family groups...`);

    // Group persons by parent relationships
    const parentGroups = new Map<string, Person[]>();
    const childToParentsMap = new Map<string, Person[]>();

    // First, build parent-child relationships
    allPersons.forEach(person => {
      if (person.mother_id || person.father_id) {
        const parentIds = [person.mother_id, person.father_id].filter(Boolean);
        const parentKey = parentIds.sort().join('-');
        
        if (!parentGroups.has(parentKey)) {
          parentGroups.set(parentKey, []);
        }
        parentGroups.get(parentKey)!.push(person);
        
        // Track child to parents mapping
        childToParentsMap.set(person.id, parentIds);
      }
    });

    // Build family groups
    const familyGroups: FamilyGroup[] = [];
    const processedParents = new Set<string>();

    parentGroups.forEach((children, parentKey) => {
      if (processedParents.has(parentKey)) return;
      
      const parentIds = parentKey.split('-').filter(Boolean);
      const parents = allPersons.filter(p => parentIds.includes(p.id));
      
      if (parents.length === 0) return;

      // Calculate family name (use most common surname among parents)
      const surnameCounts = new Map<string, number>();
      parents.forEach(parent => {
        const lastName = parent.last_name.toLowerCase();
        surnameCounts.set(lastName, (surnameCounts.get(lastName) || 0) + 1);
      });
      
      const familyName = Array.from(surnameCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      // Get all accounts that have members in this family
      const accounts = new Set<string>();
      parents.forEach(p => p.user_id && accounts.add(p.user_id));
      children.forEach(c => c.user_id && accounts.add(c.user_id));

      // Calculate confidence based on data completeness
      let confidence = 50; // Base confidence
      if (parents.length === 2) confidence += 25; // Both parents present
      if (children.length > 1) confidence += 15; // Multiple children
      if (accounts.size > 1) confidence += 10; // Cross-account presence
      
      // Validate age relationships
      const validAgeRelationships = children.every(child => {
        if (!child.birthday) return false;
        
        return parents.every(parent => {
          if (!parent.birthday) return false;
          
          const childAge = new Date(child.birthday!).getFullYear();
          const parentAge = new Date(parent.birthday!).getFullYear();
          const ageDiff = childAge - parentAge;
          
          return ageDiff >= 15 && ageDiff <= 60; // Reasonable parent-child age gap
        });
      });
      
      if (validAgeRelationships) {
        confidence += 20;
      }

      const familyGroup: FamilyGroup = {
        id: `family-${parentKey}`,
        familyName,
        parents,
        children,
        accounts: Array.from(accounts),
        confidence: Math.min(confidence, 100)
      };

      familyGroups.push(familyGroup);
      processedParents.add(parentKey);
    });

    console.log(`Found ${familyGroups.length} family groups across ${Array.from(new Set(allPersons.map(p => p.user_id))).length} accounts`);
    
    return familyGroups.sort((a, b) => b.confidence - a.confidence);
    
  } catch (error) {
    console.error('Error finding cross-account family groups:', error);
    return [];
  }
}

// Find related family members for a specific person across all accounts
export async function findCrossAccountFamilyMembers(personId: string): Promise<CrossAccountFamilyMember[]> {
  try {
    // Get the target person
    const { data: targetPerson, error: targetError } = await supabase
      .from('persons')
      .select('*')
      .eq('id', personId)
      .single();

    if (targetError) throw targetError;
    if (!targetPerson) return [];

    console.log(`Finding cross-account family members for ${targetPerson.first_name} ${targetPerson.last_name}...`);

    // Find all family groups
    const familyGroups = await findCrossAccountFamilyGroups();
    
    // Find groups that contain this person
    const relatedGroups = familyGroups.filter(group => 
      group.parents.some(p => p.id === personId) || 
      group.children.some(c => c.id === personId)
    );

    const crossAccountMembers: CrossAccountFamilyMember[] = [];

    relatedGroups.forEach(group => {
      // Add parents (if not the target person)
      group.parents.forEach(parent => {
        if (parent.id !== personId && parent.user_id !== targetPerson.user_id) {
          crossAccountMembers.push({
            person: parent,
            accountId: parent.user_id!,
            relationship: 'parent',
            confidence: group.confidence
          });
        }
      });

      // Add children (if not the target person)
      group.children.forEach(child => {
        if (child.id !== personId && child.user_id !== targetPerson.user_id) {
          crossAccountMembers.push({
            person: child,
            accountId: child.user_id!,
            relationship: 'child',
            confidence: group.confidence
          });
        }
      });

      // Add siblings (other children with same parents)
      if (group.parents.some(p => p.id === personId)) {
        // This person is a parent, so all children are related
        group.children.forEach(child => {
          if (child.id !== personId) {
            crossAccountMembers.push({
              person: child,
              accountId: child.user_id!,
              relationship: 'child',
              confidence: group.confidence
            });
          }
        });
      } else if (group.children.some(c => c.id === personId)) {
        // This person is a child, so other children are siblings
        group.children.forEach(child => {
          if (child.id !== personId && child.user_id !== targetPerson.user_id) {
            crossAccountMembers.push({
              person: child,
              accountId: child.user_id!,
              relationship: 'sibling',
              confidence: group.confidence
            });
          }
        });
      }
    });

    // Remove duplicates and sort by confidence
    const uniqueMembers = crossAccountMembers.filter((member, index, self) =>
      index === self.findIndex(m => m.person.id === member.person.id)
    );

    console.log(`Found ${uniqueMembers.length} cross-account family members for ${targetPerson.first_name} ${targetPerson.last_name}`);

    return uniqueMembers.sort((a, b) => b.confidence - a.confidence);
    
  } catch (error) {
    console.error('Error finding cross-account family members:', error);
    return [];
  }
}

// Suggest family connections for a person across accounts
export async function suggestCrossAccountConnections(personId: string): Promise<{
  suggestedParents: CrossAccountFamilyMember[];
  suggestedSiblings: CrossAccountFamilyMember[];
  suggestedChildren: CrossAccountFamilyMember[];
  confidence: number;
}> {
  try {
    const crossAccountMembers = await findCrossAccountFamilyMembers(personId);
    
    const suggestedParents = crossAccountMembers.filter(m => m.relationship === 'parent');
    const suggestedSiblings = crossAccountMembers.filter(m => m.relationship === 'sibling');
    const suggestedChildren = crossAccountMembers.filter(m => m.relationship === 'child');

    // Calculate overall confidence
    const allMembers = [...suggestedParents, ...suggestedSiblings, ...suggestedChildren];
    const avgConfidence = allMembers.length > 0 
      ? allMembers.reduce((sum, m) => sum + m.confidence, 0) / allMembers.length 
      : 0;

    return {
      suggestedParents,
      suggestedSiblings,
      suggestedChildren,
      confidence: Math.round(avgConfidence)
    };
    
  } catch (error) {
    console.error('Error suggesting cross-account connections:', error);
    return {
      suggestedParents: [],
      suggestedSiblings: [],
      suggestedChildren: [],
      confidence: 0
    };
  }
}

// Create family connection between accounts
export async function createCrossAccountConnection(
  personId: string, 
  relatedPersonId: string, 
  relationship: 'parent' | 'child' | 'sibling'
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate the connection makes sense
    const connections = await suggestCrossAccountConnections(personId);
    
    let isValidConnection = false;
    switch (relationship) {
      case 'parent':
        isValidConnection = connections.suggestedParents.some(p => p.person.id === relatedPersonId);
        break;
      case 'child':
        isValidConnection = connections.suggestedChildren.some(c => c.person.id === relatedPersonId);
        break;
      case 'sibling':
        isValidConnection = connections.suggestedSiblings.some(s => s.person.id === relatedPersonId);
        break;
    }

    if (!isValidConnection) {
      return {
        success: false,
        message: 'This family connection is not supported by the available data'
      };
    }

    // Create a family invitation or connection record
    const { error } = await supabase
      .from('family_connections')
      .insert([{
        person_id: personId,
        related_person_id: relatedPersonId,
        relationship_type: relationship,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    return {
      success: true,
      message: `Family connection request sent for ${relationship} relationship`
    };
    
  } catch (error) {
    console.error('Error creating cross-account connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create connection'
    };
  }
}

// Get family statistics across all accounts
export async function getCrossAccountFamilyStats(): Promise<{
  totalAccounts: number;
  totalPersons: number;
  familyGroups: number;
  crossAccountConnections: number;
  averageFamilySize: number;
}> {
  try {
    const { data: allPersons, error } = await supabase
      .from('persons')
      .select('user_id');

    if (error) throw error;
    if (!allPersons) return {
      totalAccounts: 0,
      totalPersons: 0,
      familyGroups: 0,
      crossAccountConnections: 0,
      averageFamilySize: 0
    };

    const uniqueAccounts = new Set(allPersons.map(p => p.user_id));
    const familyGroups = await findCrossAccountFamilyGroups();
    
    const crossAccountGroups = familyGroups.filter(group => group.accounts.length > 1);
    const totalMembersInCrossAccountGroups = crossAccountGroups.reduce((sum, group) => 
      sum + group.parents.length + group.children.length, 0
    );

    return {
      totalAccounts: uniqueAccounts.size,
      totalPersons: allPersons.length,
      familyGroups: familyGroups.length,
      crossAccountConnections: crossAccountGroups.length,
      averageFamilySize: familyGroups.length > 0 
        ? (familyGroups.reduce((sum, group) => sum + group.parents.length + group.children.length, 0) / familyGroups.length)
        : 0
    };
    
  } catch (error) {
    console.error('Error getting cross-account family stats:', error);
    return {
      totalAccounts: 0,
      totalPersons: 0,
      familyGroups: 0,
      crossAccountConnections: 0,
      averageFamilySize: 0
    };
  }
}
