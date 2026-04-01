import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Supabase client setup
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAME = 'kv_store_753cbdd3';

// KV Store helper functions
const kv = {
  async get(key: string): Promise<any> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.value;
  },

  async set(key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
  },

  async del(key: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('key', key);

    if (error) throw error;
  },

  async getByPrefix(prefix: string): Promise<any[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .like('key', `${prefix}%`);

    if (error) throw error;
    return data?.map(item => item.value) || [];
  }
};

app.use('*', cors());
app.use('*', logger(console.log));

// Types
interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: string;
  birthplace: string;
  motherId?: string;
  fatherId?: string;
  gender?: 'male' | 'female' | 'other';
  createdAt: string;
}

interface ParentMatch {
  personId: string;
  score: number;
  reasons: string[];
}

// Helper: Calculate age difference in years
function getAgeDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(d1.getFullYear() - d2.getFullYear());
}

// Helper: Calculate string similarity (Levenshtein-based)
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(s1, s2);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// AI/ML Algorithm: Find potential parents
function findPotentialParents(person: Person, allPersons: Person[], gender: 'male' | 'female'): ParentMatch[] {
  const matches: ParentMatch[] = [];

  for (const candidate of allPersons) {
    // Skip self
    if (candidate.id === person.id) continue;

    // Skip if gender doesn't match (if specified)
    if (candidate.gender && candidate.gender !== gender) continue;

    // Skip if already assigned as parent
    if (gender === 'female' && person.motherId === candidate.id) continue;
    if (gender === 'male' && person.fatherId === candidate.id) continue;

    let score = 0;
    const reasons: string[] = [];

    // 1. Age check: parent should be 15-60 years older
    const ageDiff = getAgeDifference(candidate.birthday, person.birthday);
    const candidateBirthYear = new Date(candidate.birthday).getFullYear();
    const personBirthYear = new Date(person.birthday).getFullYear();

    if (candidateBirthYear < personBirthYear) {
      if (ageDiff >= 15 && ageDiff <= 60) {
        score += 30;
        reasons.push(`Age difference: ${ageDiff} years (optimal range)`);
      } else if (ageDiff > 12 && ageDiff < 70) {
        score += 15;
        reasons.push(`Age difference: ${ageDiff} years (acceptable range)`);
      }
    } else {
      // Candidate is younger than person, very unlikely to be parent
      continue;
    }

    // 2. Last name matching (especially for fathers)
    if (gender === 'male') {
      const lastNameSim = stringSimilarity(candidate.lastName, person.lastName);
      if (lastNameSim > 0.8) {
        score += 25;
        reasons.push(`Last name match: ${(lastNameSim * 100).toFixed(0)}%`);
      } else if (lastNameSim > 0.6) {
        score += 10;
        reasons.push(`Last name similarity: ${(lastNameSim * 100).toFixed(0)}%`);
      }
    }

    // 3. Birthplace proximity
    const placeSim = stringSimilarity(candidate.birthplace, person.birthplace);
    if (placeSim > 0.7) {
      score += 20;
      reasons.push(`Same/similar birthplace: ${(placeSim * 100).toFixed(0)}% match`);
    } else if (placeSim > 0.4) {
      score += 10;
      reasons.push(`Birthplace similarity: ${(placeSim * 100).toFixed(0)}%`);
    }

    // 4. Name pattern matching (for mothers - maiden name considerations)
    if (gender === 'female') {
      // Check if mother's maiden name might match person's middle name
      const middleNameSim = person.middleName
        ? stringSimilarity(candidate.lastName, person.middleName)
        : 0;
      if (middleNameSim > 0.8) {
        score += 15;
        reasons.push(`Mother's last name matches middle name`);
      }
    }

    // 5. First name similarity (weak signal but can help)
    const firstNameSim = stringSimilarity(candidate.firstName, person.firstName);
    if (firstNameSim > 0.7) {
      score += 5;
      reasons.push(`Similar first name (possible family naming pattern)`);
    }

    // Only include if score is meaningful
    if (score >= 20) {
      matches.push({
        personId: candidate.id,
        score,
        reasons
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, 10); // Return top 10 matches
}

// Routes
app.post('/make-server-753cbdd3/persons', async (c) => {
  try {
    const person: Omit<Person, 'id' | 'createdAt'> = await c.req.json();

    // Generate ID
    const id = crypto.randomUUID();
    const newPerson: Person = {
      ...person,
      id,
      createdAt: new Date().toISOString()
    };

    // Store in KV
    await kv.set(`person:${id}`, newPerson);

    console.log(`Created person: ${id} - ${newPerson.firstName} ${newPerson.lastName}`);

    return c.json({ success: true, data: newPerson });
  } catch (error) {
    console.log(`Error creating person: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get('/make-server-753cbdd3/persons', async (c) => {
  try {
    const persons = await kv.getByPrefix('person:');
    console.log(`Retrieved ${persons.length} persons`);
    return c.json({ success: true, data: persons });
  } catch (error) {
    console.log(`Error retrieving persons: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get('/make-server-753cbdd3/persons/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const person = await kv.get(`person:${id}`);

    if (!person) {
      return c.json({ success: false, error: 'Person not found' }, 404);
    }

    return c.json({ success: true, data: person });
  } catch (error) {
    console.log(`Error retrieving person: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-753cbdd3/persons/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();

    const existing = await kv.get(`person:${id}`);
    if (!existing) {
      return c.json({ success: false, error: 'Person not found' }, 404);
    }

    const updated = { ...existing, ...updates, id };
    await kv.set(`person:${id}`, updated);

    console.log(`Updated person: ${id}`);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.log(`Error updating person: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete('/make-server-753cbdd3/persons/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`person:${id}`);

    console.log(`Deleted person: ${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting person: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// AI/ML endpoint: Find potential parents
app.post('/make-server-753cbdd3/find-parents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const person = await kv.get(`person:${id}`);

    if (!person) {
      return c.json({ success: false, error: 'Person not found' }, 404);
    }

    // Get all persons
    const allPersons = await kv.getByPrefix('person:');

    // Find potential mothers and fathers
    const potentialMothers = findPotentialParents(person, allPersons, 'female');
    const potentialFathers = findPotentialParents(person, allPersons, 'male');

    console.log(`Found ${potentialMothers.length} potential mothers and ${potentialFathers.length} potential fathers for ${person.firstName} ${person.lastName}`);

    return c.json({
      success: true,
      data: {
        mothers: potentialMothers,
        fathers: potentialFathers
      }
    });
  } catch (error) {
    console.log(`Error finding parents: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Auto-assign best matching parents
app.post('/make-server-753cbdd3/auto-assign-parents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { motherThreshold = 50, fatherThreshold = 50 } = await c.req.json();

    const person = await kv.get(`person:${id}`);

    if (!person) {
      return c.json({ success: false, error: 'Person not found' }, 404);
    }

    // Get all persons
    const allPersons = await kv.getByPrefix('person:');

    // Find potential parents
    const potentialMothers = findPotentialParents(person, allPersons, 'female');
    const potentialFathers = findPotentialParents(person, allPersons, 'male');

    let updated = false;
    const assignments: { mother?: string, father?: string } = {};

    // Auto-assign mother if score is above threshold
    if (!person.motherId && potentialMothers.length > 0 && potentialMothers[0].score >= motherThreshold) {
      person.motherId = potentialMothers[0].personId;
      assignments.mother = potentialMothers[0].personId;
      updated = true;
    }

    // Auto-assign father if score is above threshold
    if (!person.fatherId && potentialFathers.length > 0 && potentialFathers[0].score >= fatherThreshold) {
      person.fatherId = potentialFathers[0].personId;
      assignments.father = potentialFathers[0].personId;
      updated = true;
    }

    if (updated) {
      await kv.set(`person:${id}`, person);
      console.log(`Auto-assigned parents for ${person.firstName} ${person.lastName}:`, assignments);
    }

    return c.json({
      success: true,
      data: {
        updated,
        person,
        assignments
      }
    });
  } catch (error) {
    console.log(`Error auto-assigning parents: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
