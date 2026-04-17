import { supabase } from './client';

// Database setup and migration functions for production
export async function setupDatabaseTables() {
  try {
    console.log('Setting up database tables...');
    
    // Setup persons table
    await setupPersonsTable();
    
    // Setup family_invitations table
    await setupFamilyInvitationsTable();
    
    // Setup family_connections table
    await setupFamilyConnectionsTable();
    
    console.log('Database setup completed successfully');
    return { success: true, message: 'Database tables setup completed' };
  } catch (error) {
    console.error('Database setup failed:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Database setup failed' };
  }
}

async function setupPersonsTable() {
  try {
    // Check if persons table exists by trying to select from it
    const { error } = await supabase.from('persons').select('count').limit(1);
    
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating persons table...');
      
      // Create table using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS persons (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            first_name TEXT NOT NULL,
            middle_name TEXT,
            last_name TEXT NOT NULL,
            birthday DATE,
            birthplace TEXT,
            occupation TEXT,
            mother_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            father_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            gender TEXT CHECK (gender IN ('male', 'female', 'other')),
            death_date DATE,
            death_place TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
          CREATE INDEX IF NOT EXISTS idx_persons_last_name ON persons(last_name);
          CREATE INDEX IF NOT EXISTS idx_persons_mother_id ON persons(mother_id);
          CREATE INDEX IF NOT EXISTS idx_persons_father_id ON persons(father_id);
          CREATE INDEX IF NOT EXISTS idx_persons_birthday ON persons(birthday);
          CREATE INDEX IF NOT EXISTS idx_persons_created_at ON persons(created_at);
          
          ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can view their own persons" ON persons;
          CREATE POLICY "Users can view their own persons"
            ON persons FOR SELECT
            USING (user_id = auth.uid());

          DROP POLICY IF EXISTS "Users can insert their own persons" ON persons;
          CREATE POLICY "Users can insert their own persons"
            ON persons FOR INSERT
            WITH CHECK (user_id = auth.uid());

          DROP POLICY IF EXISTS "Users can update their own persons" ON persons;
          CREATE POLICY "Users can update their own persons"
            ON persons FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());

          DROP POLICY IF EXISTS "Users can delete their own persons" ON persons;
          CREATE POLICY "Users can delete their own persons"
            ON persons FOR DELETE
            USING (user_id = auth.uid());
        `
      });
      
      if (createError) {
        console.error('Error creating persons table:', createError);
        throw createError;
      }
    } else {
      console.log('Persons table already exists');
    }
  } catch (error) {
    console.error('Error setting up persons table:', error);
    throw error;
  }
}

async function setupFamilyInvitationsTable() {
  try {
    // Check if family_invitations table exists
    const { error } = await supabase.from('family_invitations').select('count').limit(1);
    
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating family_invitations table...');
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS family_invitations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            invited_email TEXT NOT NULL,
            family_name TEXT NOT NULL,
            relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'sibling', 'spouse')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
            message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            accepted_at TIMESTAMP WITH TIME ZONE,
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
          );
          
          CREATE INDEX IF NOT EXISTS idx_family_invitations_invited_email ON family_invitations(invited_email);
          CREATE INDEX IF NOT EXISTS idx_family_invitations_status ON family_invitations(status);
          CREATE INDEX IF NOT EXISTS idx_family_invitations_inviter_user_id ON family_invitations(inviter_user_id);
          CREATE INDEX IF NOT EXISTS idx_family_invitations_expires_at ON family_invitations(expires_at);
          
          ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON family_invitations;
          CREATE POLICY "Users can view invitations sent to their email"
            ON family_invitations FOR SELECT
            USING (invited_email = auth.email() OR inviter_user_id = auth.uid());

          DROP POLICY IF EXISTS "Users can create invitations" ON family_invitations;
          CREATE POLICY "Users can create invitations"
            ON family_invitations FOR INSERT
            WITH CHECK (inviter_user_id = auth.uid());

          DROP POLICY IF EXISTS "Users can update invitations they sent" ON family_invitations;
          CREATE POLICY "Users can update invitations they sent"
            ON family_invitations FOR UPDATE
            USING (inviter_user_id = auth.uid())
            WITH CHECK (inviter_user_id = auth.uid());

          DROP POLICY IF EXISTS "Users can delete invitations they sent" ON family_invitations;
          CREATE POLICY "Users can delete invitations they sent"
            ON family_invitations FOR DELETE
            USING (inviter_user_id = auth.uid());
        `
      });
      
      if (createError) {
        console.error('Error creating family_invitations table:', createError);
        throw createError;
      }
    } else {
      console.log('Family_invitations table already exists');
    }
  } catch (error) {
    console.error('Error setting up family_invitations table:', error);
    throw error;
  }
}

async function setupFamilyConnectionsTable() {
  try {
    // Check if family_connections table exists
    const { error } = await supabase.from('family_connections').select('count').limit(1);
    
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating family_connections table...');
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS family_connections (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            related_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'sibling', 'spouse')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
            confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            accepted_by UUID REFERENCES auth.users(id),
            
            UNIQUE(person_id, related_person_id, relationship_type)
          );
          
          CREATE INDEX IF NOT EXISTS idx_family_connections_person_id ON family_connections(person_id);
          CREATE INDEX IF NOT EXISTS idx_family_connections_related_person_id ON family_connections(related_person_id);
          CREATE INDEX IF NOT EXISTS idx_family_connections_status ON family_connections(status);
          CREATE INDEX IF NOT EXISTS idx_family_connections_relationship_type ON family_connections(relationship_type);
          
          ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can view their own family connections" ON family_connections;
          CREATE POLICY "Users can view their own family connections"
            ON family_connections FOR SELECT
            USING (
              auth.uid() = created_by OR 
              auth.uid() = accepted_by OR
              person_id IN (SELECT id FROM persons WHERE user_id = auth.uid()) OR
              related_person_id IN (SELECT id FROM persons WHERE user_id = auth.uid())
            );

          DROP POLICY IF EXISTS "Users can create family connections" ON family_connections;
          CREATE POLICY "Users can create family connections"
            ON family_connections FOR INSERT
            WITH CHECK (
              auth.uid() = created_by AND
              (person_id IN (SELECT id FROM persons WHERE user_id = auth.uid()) OR
               related_person_id IN (SELECT id FROM persons WHERE user_id = auth.uid()))
            );

          DROP POLICY IF EXISTS "Users can update family connections they created" ON family_connections;
          CREATE POLICY "Users can update family connections they created"
            ON family_connections FOR UPDATE
            USING (auth.uid() = created_by)
            WITH CHECK (auth.uid() = created_by);

          DROP POLICY IF EXISTS "Users can delete family connections they created" ON family_connections;
          CREATE POLICY "Users can delete family connections they created"
            ON family_connections FOR DELETE
            USING (auth.uid() = created_by);
        `
      });
      
      if (createError) {
        console.error('Error creating family_connections table:', createError);
        throw createError;
      }
    } else {
      console.log('Family_connections table already exists');
    }
  } catch (error) {
    console.error('Error setting up family_connections table:', error);
    throw error;
  }
}

// Graceful error handling for missing tables
export function handleTableError(error: any, tableName: string) {
  if (error?.code === '42P01') { // Table doesn't exist
    console.warn(`Table ${tableName} does not exist. Some features may be limited.`);
    return { handled: true, message: `Table ${tableName} is not available yet` };
  }
  return { handled: false, message: error?.message || 'Unknown error' };
}
