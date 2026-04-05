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
}
