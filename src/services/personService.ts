import { apiClient, ApiResponse } from './apiClient';
import { apiEndpoints } from '../config/api';

// Person Types
export interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: string;
  birthplace: string;
  motherId?: string;
  fatherId?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface CreatePersonRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  birthplace?: string;
  gender?: 'male' | 'female' | 'other';
  motherId?: string;
  fatherId?: string;
  spouseId?: string;
  occupation?: string;
  biography?: string;
}

export interface UpdatePersonRequest extends Partial<CreatePersonRequest> {
  id: string;
}

export interface PersonRelationship {
  id: string;
  type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild';
  relatedPersonId: string;
  relatedPerson: Person;
  confidence?: number;
  verified: boolean;
}

export interface PersonSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: 'male' | 'female' | 'other';
  birthYearFrom?: number;
  birthYearTo?: number;
  location?: string;
  sortBy?: 'name' | 'birthDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Person Service
class PersonService {
  // Get all persons with optional filtering
  async getPersons(params?: PersonSearchParams): Promise<ApiResponse<Person[]>> {
    return apiClient.get<Person[]>(apiEndpoints.persons, params);
  }

  // Get person by ID
  async getPersonById(id: string): Promise<ApiResponse<Person>> {
    return apiClient.get<Person>(apiEndpoints.personById(id));
  }

  // Create new person
  async createPerson(data: CreatePersonRequest): Promise<ApiResponse<Person>> {
    return apiClient.post<Person>(apiEndpoints.persons, data);
  }

  // Update existing person
  async updatePerson(data: UpdatePersonRequest): Promise<ApiResponse<Person>> {
    return apiClient.put<Person>(apiEndpoints.personById(data.id), data);
  }

  // Delete person
  async deletePerson(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(apiEndpoints.personById(id));
  }

  // Get person relationships
  async getPersonRelationships(id: string): Promise<ApiResponse<PersonRelationship[]>> {
    return apiClient.get<PersonRelationship[]>(apiEndpoints.personRelationships(id));
  }

  // Get ancestors of a person
  async getAncestors(id: string, generations?: number): Promise<ApiResponse<Person[]>> {
    return apiClient.get<Person[]>(apiEndpoints.ancestors(id), { generations });
  }

  // Get descendants of a person
  async getDescendants(id: string, generations?: number): Promise<ApiResponse<Person[]>> {
    return apiClient.get<Person[]>(apiEndpoints.descendants(id), { generations });
  }

  // Upload person photo
  async uploadPersonPhoto(id: string, file: File): Promise<ApiResponse<{ photoUrl: string }>> {
    return apiClient.upload<{ photoUrl: string }>(
      `${apiEndpoints.personById(id)}/photo`,
      file
    );
  }

  // Search persons by name or other criteria
  async searchPersons(query: string, filters?: Partial<PersonSearchParams>): Promise<ApiResponse<Person[]>> {
    return apiClient.get<Person[]>(apiEndpoints.persons, {
      search: query,
      ...filters,
    });
  }

  // Get family tree for a person
  async getFamilyTree(id: string, depth?: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(apiEndpoints.familyTree, {
      rootId: id,
      depth,
    });
  }

  // Bulk operations
  async bulkCreatePersons(data: CreatePersonRequest[]): Promise<ApiResponse<Person[]>> {
    return apiClient.post<Person[]>(`${apiEndpoints.persons}/bulk`, { persons: data });
  }

  async bulkUpdatePersons(data: UpdatePersonRequest[]): Promise<ApiResponse<Person[]>> {
    return apiClient.put<Person[]>(`${apiEndpoints.persons}/bulk`, { persons: data });
  }

  async bulkDeletePersons(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${apiEndpoints.persons}/bulk`, { ids });
  }

  // Export persons data
  async exportPersons(format: 'json' | 'csv' | 'gedcom', filters?: PersonSearchParams): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get<{ downloadUrl: string }>(`${apiEndpoints.persons}/export`, {
      format,
      ...filters,
    });
  }

  // Import persons data
  async importPersons(file: File): Promise<ApiResponse<{ imported: number; errors: string[] }>> {
    return apiClient.upload<{ imported: number; errors: string[] }>(
      `${apiEndpoints.persons}/import`,
      file
    );
  }
}

export const personService = new PersonService();
export default personService;
