-- Step 4: Create family relationships with actual person IDs

-- First create the family_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS family_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  related_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'sibling', 'spouse')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person_id, related_person_id)
);

-- Enable RLS
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view family connections" ON family_connections;
CREATE POLICY "Users can view family connections" ON family_connections
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage family connections" ON family_connections;
CREATE POLICY "Users can manage family connections" ON family_connections
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert family relationships for the main Centino family
-- Celestino (74) as parent to Reycel (44)
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score) VALUES
('da8f1962-328a-496d-bfcf-377fc0dd755f', 'b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'parent', 'accepted', 85),
-- Andressa (68) as parent to Reycel (44)
('6089ef3e-60a9-492e-9c32-72e8fd6a9472', 'b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'parent', 'accepted', 85),
-- Reycel (44) as parent to John Marc (27)
('b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', '3ff481c3-2599-416a-b12d-1b6ef2e86520', 'parent', 'accepted', 80),
-- Celestino (74) as grandparent to John Marc (27)
('da8f1962-328a-496d-bfcf-377fc0dd755f', '3ff481c3-2599-416a-b12d-1b6ef2e86520', 'parent', 'accepted', 70),
-- Andressa (68) as grandparent to John Marc (27)
('6089ef3e-60a9-492e-9c32-72e8fd6a9472', '3ff481c3-2599-416a-b12d-1b6ef2e86520', 'parent', 'accepted', 70)
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Reciprocal relationships (reverse direction)
-- Reycel (44) as child of Celestino (74)
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score) VALUES
('b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'da8f1962-328a-496d-bfcf-377fc0dd755f', 'child', 'accepted', 85),
-- Reycel (44) as child of Andressa (68)
('b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', '6089ef3e-60a9-492e-9c32-72e8fd6a9472', 'child', 'accepted', 85),
-- John Marc (27) as child of Reycel (44)
('3ff481c3-2599-416a-b12d-1b6ef2e86520', 'b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'child', 'accepted', 80),
-- John Marc (27) as grandchild of Celestino (74)
('3ff481c3-2599-416a-b12d-1b6ef2e86520', 'da8f1962-328a-496d-bfcf-377fc0dd755f', 'child', 'accepted', 70),
-- John Marc (27) as grandchild of Andressa (68)
('3ff481c3-2599-416a-b12d-1b6ef2e86520', '6089ef3e-60a9-492e-9c32-72e8fd6a9472', 'child', 'accepted', 70)
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Cross-account connections: Connect celestino jr (34) to the main family
-- celestino jr as child of Celestino (74) - possible father-son
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score) VALUES
('da8f1962-328a-496d-bfcf-377fc0dd755f', '948d43ec-0304-41a2-9a99-fe480571d441', 'parent', 'accepted', 75),
-- celestino jr as child of Andressa (68) - possible mother-son
('6089ef3e-60a9-492e-9c32-72e8fd6a9472', '948d43ec-0304-41a2-9a99-fe480571d441', 'parent', 'accepted', 75),
-- celestino jr as sibling to Reycel (44) - possible siblings
('b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', '948d43ec-0304-41a2-9a99-fe480571d441', 'sibling', 'accepted', 60)
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Reciprocal relationships for celestino jr
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score) VALUES
('948d43ec-0304-41a2-9a99-fe480571d441', 'da8f1962-328a-496d-bfcf-377fc0dd755f', 'child', 'accepted', 75),
('948d43ec-0304-41a2-9a99-fe480571d441', '6089ef3e-60a9-492e-9c32-72e8fd6a9472', 'child', 'accepted', 75),
('948d43ec-0304-41a2-9a99-fe480571d441', 'b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'sibling', 'accepted', 60)
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Cross-account connections: Connect Reycelyn (35) to the main family
-- Reycelyn as sibling to Reycel (44) - possible siblings (similar age)
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score) VALUES
('b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'a6b1a674-ccdf-42a3-a380-b465643b46a9', 'sibling', 'accepted', 65),
-- Reycelyn as child of Celestino (74)
('da8f1962-328a-496d-bfcf-377fc0dd755f', 'a6b1a674-ccdf-42a3-a380-b465643b46a9', 'parent', 'accepted', 70),
-- Reycelyn as child of Andressa (68)
('6089ef3e-60a9-492e-9c32-72e8fd6a9472', 'a6b1a674-ccdf-42a3-a380-b465643b46a9', 'parent', 'accepted', 70)
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Reciprocal relationships for Reycelyn
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score) VALUES
('a6b1a674-ccdf-42a3-a380-b465643b46a9', 'b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'sibling', 'accepted', 65),
('a6b1a674-ccdf-42a3-a380-b465643b46a9', 'da8f1962-328a-496d-bfcf-377fc0dd755f', 'child', 'accepted', 70),
('a6b1a674-ccdf-42a3-a380-b465643b46a9', '6089ef3e-60a9-492e-9c32-72e8fd6a9472', 'child', 'accepted', 70)
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;
