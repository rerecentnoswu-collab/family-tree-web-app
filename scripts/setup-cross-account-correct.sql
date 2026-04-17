-- Cross-Account Family Setup for rerecentnoswu-collab project
-- Account: rere.centno.swu@phinmaed.com

-- Step 1: Check current family members
SELECT 
  id,
  first_name,
  last_name,
  user_id,
  birthday,
  created_at,
  CASE 
    WHEN user_id::text LIKE '%rere.centno%' THEN 'rere.centno.swu@phinmaed.com'
    WHEN user_id::text LIKE '%kensite24%' THEN 'kensite24@gmail.com'
    ELSE 'Unknown Account'
  END as account_name
FROM persons 
ORDER BY last_name, first_name;

-- Step 2: Create family_connections table if needed
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

-- Step 3: Enable Row Level Security
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Users can view family connections" ON family_connections;
CREATE POLICY "Users can view family connections" ON family_connections
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can manage family connections" ON family_connections;
CREATE POLICY "Users can manage family connections" ON family_connections
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- Step 5: Update person records with correct account associations
-- First, let's see what user IDs we have
SELECT id, email, created_at FROM auth.users 
WHERE email IN ('rere.centno.swu@phinmaed.com', 'kensite24@gmail.com')
ORDER BY email;

-- Update persons to associate with correct accounts
-- Replace these UUIDs with actual user IDs from the query above
UPDATE persons 
SET user_id = (SELECT id FROM auth.users WHERE email = 'rere.centno.swu@phinmaed.com' LIMIT 1)
WHERE user_id::text LIKE '%rere.centno%';

UPDATE persons 
SET user_id = (SELECT id FROM auth.users WHERE email = 'kensite24@gmail.com' LIMIT 1)
WHERE user_id::text LIKE '%kensite24%';

-- Step 6: Create family relationships based on your current family members
-- Current family: Andressa (70), John Marc (29), Reycel (46), Celestino (76)

-- Get the actual person IDs first (run this to get the IDs)
SELECT id, first_name, last_name, birthday FROM persons 
WHERE last_name = 'Centino' 
ORDER BY birthday DESC;

-- Then replace these placeholder IDs with the actual IDs from the query above
-- Example relationships (replace PLACEHOLDER_IDs with actual UUIDs):

INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence) VALUES
-- Celestino (76) as parent to Reycel (46)
('CELESTINO_PLACEHOLDER_ID', 'REYCEL_PLACEHOLDER_ID', 'parent', 'accepted', 85),
-- Andressa (70) as parent to Reycel (46)
('ANDRESSA_PLACEHOLDER_ID', 'REYCEL_PLACEHOLDER_ID', 'parent', 'accepted', 85),
-- Reycel (46) as parent to John Marc (29)
('REYCEL_PLACEHOLDER_ID', 'JOHN_MARC_PLACEHOLDER_ID', 'parent', 'accepted', 80),
-- Celestino (76) as grandparent to John Marc (29)
('CELESTINO_PLACEHOLDER_ID', 'JOHN_MARC_PLACEHOLDER_ID', 'parent', 'accepted', 70),
-- Andressa (70) as grandparent to John Marc (29)
('ANDRESSA_PLACEHOLDER_ID', 'JOHN_MARC_PLACEHOLDER_ID', 'parent', 'accepted', 70)
ON CONFLICT (person_id, related_person_id) DO NOTHING;

-- Reciprocal relationships (reverse direction)
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence) VALUES
-- Reycel (46) as child of Celestino (76)
('REYCEL_PLACEHOLDER_ID', 'CELESTINO_PLACEHOLDER_ID', 'child', 'accepted', 85),
-- Reycel (46) as child of Andressa (70)
('REYCEL_PLACEHOLDER_ID', 'ANDRESSA_PLACEHOLDER_ID', 'child', 'accepted', 85),
-- John Marc (29) as child of Reycel (46)
('JOHN_MARC_PLACEHOLDER_ID', 'REYCEL_PLACEHOLDER_ID', 'child', 'accepted', 80),
-- John Marc (29) as grandchild of Celestino (76)
('JOHN_MARC_PLACEHOLDER_ID', 'CELESTINO_PLACEHOLDER_ID', 'child', 'accepted', 70),
-- John Marc (29) as grandchild of Andressa (70)
('JOHN_MARC_PLACEHOLDER_ID', 'ANDRESSA_PLACEHOLDER_ID', 'child', 'accepted', 70)
ON CONFLICT (person_id, related_person_id) DO NOTHING;

-- Step 7: Verify the setup
SELECT 
  fc.person_id,
  p1.first_name || ' ' || p1.last_name || ' (' || 
    CASE 
      WHEN p1.birthday THEN (2024 - EXTRACT(YEAR FROM p1.birthday::date))::text || ' years'
      ELSE 'unknown age'
    END || ')' as person_name,
  fc.related_person_id,
  p2.first_name || ' ' || p2.last_name || ' (' || 
    CASE 
      WHEN p2.birthday THEN (2024 - EXTRACT(YEAR FROM p2.birthday::date))::text || ' years'
      ELSE 'unknown age'
    END || ')' as related_person_name,
  fc.relationship_type,
  fc.status,
  fc.confidence,
  fc.created_at
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
ORDER BY fc.created_at DESC;

-- Step 8: Check cross-account family groups
SELECT 
  last_name,
  COUNT(*) as total_members,
  COUNT(DISTINCT user_id) as number_of_accounts,
  STRING_AGG(
    first_name || ' (' || 
    CASE 
      WHEN user_id::text LIKE '%rere.centno%' THEN 'rere.centno.swu@phinmaed.com'
      WHEN user_id::text LIKE '%kensite24%' THEN 'kensite24@gmail.com'
      ELSE 'Unknown'
    END || ')', 
    ', '
  ) as members
FROM persons 
WHERE last_name IS NOT NULL AND last_name != ''
GROUP BY last_name
HAVING COUNT(*) > 1
ORDER BY total_members DESC;
