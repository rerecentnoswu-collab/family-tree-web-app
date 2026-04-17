-- Safe migration to create missing family tables and indexes
-- This script handles existing tables gracefully

-- Create family_invitations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'family_invitations') THEN
        CREATE TABLE family_invitations (
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
        
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_family_invitations_invited_email ON family_invitations(invited_email);
        CREATE INDEX IF NOT EXISTS idx_family_invitations_status ON family_invitations(status);
        CREATE INDEX IF NOT EXISTS idx_family_invitations_inviter_user_id ON family_invitations(inviter_user_id);
        CREATE INDEX IF NOT EXISTS idx_family_invitations_expires_at ON family_invitations(expires_at);
        
        -- Enable RLS
        ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
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
    END IF;
END
$$;

-- Create family_connections table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'family_connections') THEN
        CREATE TABLE family_connections (
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
          
          -- Ensure no duplicate connections
          UNIQUE(person_id, related_person_id, relationship_type)
        );
        
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_family_connections_person_id ON family_connections(person_id);
        CREATE INDEX IF NOT EXISTS idx_family_connections_related_person_id ON family_connections(related_person_id);
        CREATE INDEX IF NOT EXISTS idx_family_connections_status ON family_connections(status);
        CREATE INDEX IF NOT EXISTS idx_family_connections_relationship_type ON family_connections(relationship_type);
        
        -- Enable RLS
        ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
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
    END IF;
END
$$;

-- Ensure persons table has proper structure and indexes
DO $$
BEGIN
    -- Check if persons table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'persons') THEN
        -- Create missing indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
        CREATE INDEX IF NOT EXISTS idx_persons_last_name ON persons(last_name);
        CREATE INDEX IF NOT EXISTS idx_persons_mother_id ON persons(mother_id);
        CREATE INDEX IF NOT EXISTS idx_persons_father_id ON persons(father_id);
        CREATE INDEX IF NOT EXISTS idx_persons_birthday ON persons(birthday);
        CREATE INDEX IF NOT EXISTS idx_persons_created_at ON persons(created_at);
        
        -- Ensure RLS is enabled
        ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
        
        -- Create or update policies
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
    END IF;
END
$$;

-- Create or replace functions for timestamp updates
CREATE OR REPLACE FUNCTION update_family_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS family_invitations_updated_at ON family_invitations;
CREATE TRIGGER family_invitations_updated_at
  BEFORE UPDATE ON family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_family_invitations_updated_at();

CREATE OR REPLACE FUNCTION update_family_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS family_connections_updated_at ON family_connections;
CREATE TRIGGER family_connections_updated_at
  BEFORE UPDATE ON family_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_family_connections_updated_at();

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM family_invitations 
  WHERE expires_at < NOW() 
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;
