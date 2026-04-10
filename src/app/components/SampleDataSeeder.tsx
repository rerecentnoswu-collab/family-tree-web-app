import { Person } from '../types/Person';

export const sampleFamilyMembers: Person[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    birthday: '1950-01-01',
    birthplace: 'New York, USA',
    gender: 'male',
    occupation: 'Engineer'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    birthday: '1952-03-15',
    birthplace: 'New York, USA',
    gender: 'female',
    occupation: 'Teacher',
    spouse_ids: ['1']
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Smith',
    birthday: '1975-06-20',
    birthplace: 'New York, USA',
    gender: 'male',
    fatherId: '1',
    motherId: '2'
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Smith',
    birthday: '1978-09-10',
    birthplace: 'New York, USA',
    gender: 'female',
    fatherId: '1',
    motherId: '2'
  }
];
