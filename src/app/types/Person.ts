export interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday?: string | undefined;
  birthplace?: string;
  motherId?: string;
  fatherId?: string;
  spouse_ids?: string[];
  gender?: string;
  occupation?: string;
  deathDate?: string;
  deathPlace?: string;
  events?: any[];
  
  // Enhanced relationship fields
  relationships?: Relationship[];
  marriageDate?: string;
  marriageLocation?: string;
  marriageStatus?: 'single' | 'married' | 'engaged' | 'partnered' | 'divorced' | 'widowed';
  anniversary?: string;
  relationshipNotes?: string;
}

export interface Relationship {
  id: string;
  personId: string;
  relatedPersonId: string;
  type: 'spouse' | 'partner' | 'engaged' | 'ex_spouse' | 'parent' | 'child' | 'sibling';
  startDate?: string;
  endDate?: string;
  location?: string;
  notes?: string;
  verified: boolean;
  sources?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarriageEvent {
  id: string;
  person1Id: string;
  person2Id: string;
  date: string;
  location: string;
  type: 'marriage' | 'engagement' | 'anniversary' | 'divorce';
  description?: string;
  sources?: string[];
  photos?: string[];
}
