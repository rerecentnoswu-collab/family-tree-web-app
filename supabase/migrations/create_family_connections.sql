-- Create family_connections table for cross-account family relationships
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
  
  -- Ensure no duplicate connections
  UNIQUE(person_id, related_person_id, relationship_type)
);

-- Create indexes for performance
CREATE INDEX idx_family_connections_person_id ON family_connections(person_id);
CREATE INDEX idx_family_connections_related_person_id ON family_connections(related_person_id);
CREATE INDEX idx_family_connections_status ON family_connections(status);
CREATE INDEX idx_family_connections_relationship_type ON family_connections(relationship_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_family_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER family_connections_updated_at
  BEFORE UPDATE ON family_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_family_connections_updated_at();

-- Row Level Security
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own family connections"
  ON family_connections FOR SELECT
  USING (
    auth.uid() = created_by OR 
    auth.uid() = accepted_by OR
    person_id IN (SELECT id FROM persons WHERE user_id = auth.uid()) OR
    related_person_id IN (SELECT id FROM persons WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create family connections"
  ON family_connections FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    (person_id IN (SELECT id FROM persons WHERE user_id = auth.uid()) OR
     related_person_id IN (SELECT id FROM persons WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can update family connections they created"
  ON family_connections FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete family connections they created"
  ON family_connections FOR DELETE
  USING (auth.uid() = created_by);
