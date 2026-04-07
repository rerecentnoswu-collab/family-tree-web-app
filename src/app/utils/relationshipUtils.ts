import { Person, Relationship, MarriageEvent } from '../types/Person';

export interface CoupleInfo {
  person1: Person;
  person2: Person;
  relationshipType: 'married' | 'engaged' | 'partnered' | 'divorced' | 'widowed' | 'single';
  marriageDate?: string;
  marriageLocation?: string;
  anniversary?: string;
  yearsTogether?: number;
  children?: Person[];
  verified: boolean;
  sources?: string[];
}

export interface RelationshipIndicator {
  type: 'line' | 'badge' | 'icon' | 'text';
  style: {
    color: string;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    strokeWidth?: number;
    opacity?: number;
  };
  label?: string;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
}

// Enhanced relationship detection with multiple methods
export function detectRelationships(person: Person, allPersons: Person[]): Relationship[] {
  const relationships: Relationship[] = [];

  // Detect spouse/partner relationships
  if (person.spouse_ids && person.spouse_ids.length > 0) {
    person.spouse_ids.forEach(spouseId => {
      const spouse = allPersons.find(p => p.id === spouseId);
      if (spouse) {
        const relationshipType = person.marriageStatus === 'engaged' ? 'engaged' : 
                              person.marriageStatus === 'partnered' ? 'partner' : 
                              person.marriageStatus === 'divorced' ? 'ex_spouse' :
                              person.marriageStatus === 'widowed' ? 'spouse' : 'spouse';
        
        relationships.push({
          id: `${person.id}-${spouseId}-spouse`,
          personId: person.id,
          relatedPersonId: spouseId,
          type: relationshipType,
          startDate: person.marriageDate,
          location: person.marriageLocation,
          notes: person.relationshipNotes,
          verified: true,
          sources: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
  }

  // Detect relationships through shared children (legacy method)
  const sharedChildren = allPersons.filter(child => 
    (child.motherId === person.id || child.fatherId === person.id) &&
    child.motherId && child.fatherId // Only if both parents are known
  );

  sharedChildren.forEach(child => {
    const coParentId = child.motherId === person.id ? child.fatherId : child.motherId;
    if (coParentId) {
      const coParent = allPersons.find(p => p.id === coParentId);
      if (coParent && !relationships.find(r => r.relatedPersonId === coParentId)) {
        relationships.push({
          id: `${person.id}-${coParentId}-co-parent`,
          personId: person.id,
          relatedPersonId: coParentId,
          type: 'spouse',
          location: child.birthplace || undefined,
          notes: 'Detected through shared children',
          verified: false,
          sources: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  });

  return relationships;
}

// Get all couples in the family tree
export function getAllCouples(persons: Person[]): CoupleInfo[] {
  const couples: CoupleInfo[] = [];
  const processedPairs = new Set<string>();

  persons.forEach(person => {
    const relationships = detectRelationships(person, persons);
    
    relationships.forEach(relationship => {
      const relatedPerson = persons.find(p => p.id === relationship.relatedPersonId);
      if (!relatedPerson) return;

      const pairKey = [person.id, relatedPerson.id].sort().join('-');
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      // Calculate years together
      const yearsTogether = relationship.startDate ? 
        Math.floor((new Date().getTime() - new Date(relationship.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 
        undefined;

      // Find shared children
      const children = persons.filter(child => 
        (child.motherId === person.id && child.fatherId === relatedPerson.id) ||
        (child.fatherId === person.id && child.motherId === relatedPerson.id)
      );

      couples.push({
        person1: person,
        person2: relatedPerson,
        relationshipType: person.marriageStatus || 'married',
        marriageDate: person.marriageDate,
        marriageLocation: person.marriageLocation,
        anniversary: person.anniversary,
        yearsTogether,
        children,
        verified: relationship.verified,
        sources: relationship.sources
      });
    });
  });

  return couples;
}

// Get visual styling for different relationship types
export function getRelationshipIndicator(relationshipType: string, verified: boolean = true): RelationshipIndicator {
  const baseOpacity = verified ? 1 : 0.7;
  
  // Handle all possible relationship types including 'single'
  switch (relationshipType) {
    case 'married':
      return {
        type: 'line',
        style: {
          color: '#F59E0B', // Orange
          strokeStyle: 'solid',
          strokeWidth: 3,
          opacity: baseOpacity
        },
        label: 'Married',
        icon: '💍',
        priority: 'high'
      };
    
    case 'engaged':
      return {
        type: 'line',
        style: {
          color: '#EC4899', // Pink
          strokeStyle: 'dashed',
          strokeWidth: 2,
          opacity: baseOpacity
        },
        label: 'Engaged',
        icon: '💍',
        priority: 'high'
      };
    
    case 'partnered':
      return {
        type: 'line',
        style: {
          color: '#8B5CF6', // Purple
          strokeStyle: 'dotted',
          strokeWidth: 2,
          opacity: baseOpacity
        },
        label: 'Partnered',
        icon: '💜',
        priority: 'medium'
      };
    
    case 'divorced':
      return {
        type: 'line',
        style: {
          color: '#6B7280', // Gray
          strokeStyle: 'dashed',
          strokeWidth: 1,
          opacity: 0.5
        },
        label: 'Divorced',
        icon: '💔',
        priority: 'low'
      };
    
    case 'widowed':
      return {
        type: 'line',
        style: {
          color: '#6B7280', // Gray
          strokeStyle: 'solid',
          strokeWidth: 1,
          opacity: 0.5
        },
        label: 'Widowed',
        icon: '⚫',
        priority: 'low'
      };
    
    case 'single':
      return {
        type: 'line',
        style: {
          color: '#94A3B8', // Slate
          strokeStyle: 'dotted',
          strokeWidth: 1,
          opacity: 0.3
        },
        label: 'Single',
        icon: '👤',
        priority: 'low'
      };
    
    default:
      return {
        type: 'line',
        style: {
          color: '#94A3B8', // Slate
          strokeStyle: 'dashed',
          strokeWidth: 2,
          opacity: baseOpacity
        },
        label: 'Related',
        icon: '🔗',
        priority: 'medium'
      };
  }
}

// Calculate anniversary information
export function getAnniversaryInfo(marriageDate?: string): {
  nextAnniversary?: Date;
  yearsMarried?: number;
  isAnniversaryToday: boolean;
  daysUntilAnniversary?: number;
} {
  if (!marriageDate) {
    return { isAnniversaryToday: false };
  }

  const marriage = new Date(marriageDate);
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Next anniversary
  const nextAnniversary = new Date(currentYear, marriage.getMonth(), marriage.getDate());
  if (nextAnniversary < today) {
    nextAnniversary.setFullYear(currentYear + 1);
  }

  // Years married
  const yearsMarried = today.getFullYear() - marriage.getFullYear();
  
  // Days until next anniversary
  const daysUntil = Math.floor((nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Is anniversary today?
  const isAnniversaryToday = today.getMonth() === marriage.getMonth() && 
                           today.getDate() === marriage.getDate();

  return {
    nextAnniversary: isAnniversaryToday ? today : nextAnniversary,
    yearsMarried,
    isAnniversaryToday,
    daysUntilAnniversary: daysUntil
  };
}

// Generate marriage events for timeline
export function generateMarriageEvents(persons: Person[]): MarriageEvent[] {
  const events: MarriageEvent[] = [];
  const processedPairs = new Set<string>();

  persons.forEach(person => {
    if (person.marriageDate) {
      const relationships = detectRelationships(person, persons);
      
      relationships.forEach(relationship => {
        const relatedPerson = persons.find(p => p.id === relationship.relatedPersonId);
        if (!relatedPerson) return;

        const pairKey = [person.id, relatedPerson.id].sort().join('-');
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        events.push({
          id: `marriage-${pairKey}`,
          person1Id: person.id,
          person2Id: relatedPerson.id,
          date: person.marriageDate!, // We know it's defined from the if condition
          location: person.marriageLocation || 'Unknown',
          type: person.marriageStatus === 'engaged' ? 'engagement' : 'marriage',
          description: `${person.firstName} ${person.lastName} and ${relatedPerson.firstName} ${relatedPerson.lastName}`,
          sources: relationship.sources || [],
          photos: []
        });
      });
    }
  });

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Relationship validation utilities
export function validateRelationship(person1: Person, person2: Person, type: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Self-relationship check
  if (person1.id === person2.id) {
    errors.push('Person cannot be in a relationship with themselves');
  }

  // Age validation
  if (person1.birthday && person2.birthday) {
    const age1 = new Date().getFullYear() - new Date(person1.birthday).getFullYear();
    const age2 = new Date().getFullYear() - new Date(person2.birthday).getFullYear();
    
    if (Math.abs(age1 - age2) > 50) {
      warnings.push('Large age difference detected');
    }
    
    if (age1 < 16 || age2 < 16) {
      errors.push('Both individuals must be at least 16 years old');
    }
  }

  // Existing relationship check
  const existingRelationship = detectRelationships(person1, [person2]).some(r => 
    r.relatedPersonId === person2.id
  );
  if (existingRelationship) {
    errors.push('Relationship already exists between these individuals');
  }

  // Family relationship check (basic consanguinity)
  if (person1.motherId === person2.motherId || person1.fatherId === person2.fatherId) {
    errors.push('Cannot establish relationship between siblings');
  }

  if (person1.motherId === person2.id || person1.fatherId === person2.id ||
      person2.motherId === person1.id || person2.fatherId === person1.id) {
    errors.push('Cannot establish relationship between parent and child');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Get relationship statistics
export function getRelationshipStatistics(persons: Person[]): {
  totalCouples: number;
  marriedCouples: number;
  engagedCouples: number;
  partneredCouples: number;
  divorcedCouples: number;
  averageMarriageLength?: number;
  couplesWithChildren: number;
} {
  const couples = getAllCouples(persons);
  
  const stats = {
    totalCouples: couples.length,
    marriedCouples: couples.filter(c => c.relationshipType === 'married').length,
    engagedCouples: couples.filter(c => c.relationshipType === 'engaged').length,
    partneredCouples: couples.filter(c => c.relationshipType === 'partnered').length,
    divorcedCouples: couples.filter(c => c.relationshipType === 'divorced').length,
    averageMarriageLength: undefined as number | undefined,
    couplesWithChildren: couples.filter(c => c.children && c.children.length > 0).length
  };

  // Calculate average marriage length
  const marriagesWithDates = couples.filter(c => c.marriageDate && c.yearsTogether);
  if (marriagesWithDates.length > 0) {
    stats.averageMarriageLength = marriagesWithDates.reduce((sum, c) => 
      sum + (c.yearsTogether || 0), 0) / marriagesWithDates.length;
  }

  return stats;
}
