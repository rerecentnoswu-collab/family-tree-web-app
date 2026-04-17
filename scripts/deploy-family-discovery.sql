-- Family Discovery System Deployment
-- Complete production deployment script

-- Step 1: Verify current system status
SELECT 'System Status Check' as deployment_step,
       jsonb_build_object(
         'total_persons', (SELECT COUNT(*) FROM persons WHERE user_id IS NOT NULL),
         'family_groups', (SELECT COUNT(DISTINCT last_name) FROM persons WHERE last_name IS NOT NULL),
         'accounts_with_data', (SELECT COUNT(DISTINCT user_id) FROM persons WHERE user_id IS NOT NULL),
         'existing_connections', (SELECT COUNT(*) FROM family_connections)
       ) as status;

-- Step 2: Deploy multi-account architecture (if not exists)
-- This creates the infrastructure for unlimited account support

-- Family groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,
  description TEXT,
  primary_account_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account memberships table
CREATE TABLE IF NOT EXISTS family_account_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'viewer', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  UNIQUE(family_group_id, user_id)
);

-- Enable RLS
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_account_memberships ENABLE ROW LEVEL SECURITY;

-- Step 3: Initialize Centino Family Group
INSERT INTO family_groups (group_name, description, primary_account_id) 
VALUES (
  'Centino Family',
  'Centino family network spanning multiple accounts and generations',
  (SELECT id FROM auth.users WHERE email = 'rere.centno.swu@phinmaed.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Add existing accounts to the Centino Family Group
INSERT INTO family_account_memberships (family_group_id, user_id, role, status) 
SELECT 
  fg.id,
  au.id,
  CASE 
    WHEN au.email = 'rere.centno.swu@phinmaed.com' THEN 'admin'
    ELSE 'editor'
  END as role,
  'active' as status
FROM family_groups fg, auth.users au
WHERE fg.group_name = 'Centino Family'
  AND au.email IN ('rere.centno.swu@phinmaed.com', 'kensite24@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM family_account_memberships fam 
    WHERE fam.family_group_id = fg.id AND fam.user_id = au.id
  )
ON CONFLICT (family_group_id, user_id) DO NOTHING;

-- Step 4: Deploy family discovery functions
-- Create family discovery function
CREATE OR REPLACE FUNCTION discover_family_trees()
RETURNS TABLE (
  family_group_id UUID,
  family_name TEXT,
  root_person_id UUID,
  root_person_name TEXT,
  total_members INTEGER,
  total_accounts INTEGER,
  confidence_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH family_groups AS (
    SELECT 
      last_name as family_name,
      COUNT(*) as member_count,
      COUNT(DISTINCT user_id) as account_count,
      STRING_AGG(DISTINCT user_id::text, ',') as account_ids,
      MIN(birthday) as oldest_birthdate
    FROM persons 
    WHERE last_name IS NOT NULL 
      AND last_name != ''
      AND user_id IS NOT NULL
    GROUP BY last_name
    HAVING COUNT(*) >= 2 OR COUNT(DISTINCT user_id) >= 2
  ),
  family_trees AS (
    SELECT 
      fg.family_name,
      UNNEST(STRING_TO_ARRAY(fg.account_ids, ','))::UUID as root_account_id,
      fg.member_count,
      fg.account_count,
      fg.oldest_birthdate,
      CASE 
        WHEN fg.account_count >= 3 AND fg.member_count >= 5 THEN 95
        WHEN fg.account_count >= 2 AND fg.member_count >= 3 THEN 85
        WHEN fg.account_count >= 2 OR fg.member_count >= 3 THEN 70
        ELSE 50
      END as confidence_score
    FROM family_groups fg
  )
  SELECT 
    gen_random_uuid() as family_group_id,
    ft.family_name,
    (SELECT id FROM persons WHERE user_id = ft.root_account_id AND last_name = ft.family_name ORDER BY birthday LIMIT 1) as root_person_id,
    (SELECT first_name || ' ' || last_name FROM persons WHERE user_id = ft.root_account_id AND last_name = ft.family_name ORDER BY birthday LIMIT 1) as root_person_name,
    ft.member_count as total_members,
    ft.account_count as total_accounts,
    ft.confidence_score
  FROM family_trees ft
  ORDER BY ft.confidence_score DESC, ft.family_name;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Deploy relationship mapping function
CREATE OR REPLACE FUNCTION map_family_relationships(family_name_param TEXT DEFAULT NULL)
RETURNS TABLE (
  parent_id UUID,
  parent_name TEXT,
  parent_account UUID,
  child_id UUID,
  child_name TEXT,
  child_account UUID,
  relationship_type TEXT,
  confidence_score INTEGER,
  is_cross_account BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH family_members AS (
    SELECT 
      id, first_name, last_name, birthday, user_id,
      EXTRACT(YEAR FROM birthday::date) as birth_year
    FROM persons 
    WHERE last_name = family_name_param OR family_name_param IS NULL
      AND user_id IS NOT NULL
  ),
  potential_relationships AS (
    SELECT 
      p1.id as parent_id,
      p1.first_name || ' ' || p1.last_name as parent_name,
      p1.user_id as parent_account,
      p2.id as child_id,
      p2.first_name || ' ' || p2.last_name as child_name,
      p2.user_id as child_account,
      CASE 
        WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent'
        WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling'
        WHEN p1.birth_year - p2.birth_year >= 30 AND p1.birth_year - p2.birth_year <= 70 THEN 'grandparent'
        ELSE 'unknown'
      END as relationship_type,
      CASE 
        WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 THEN 95
        WHEN p1.birth_year - p2.birth_year BETWEEN 15 AND 25 THEN 85
        WHEN ABS(p1.birth_year - p2.birth_year) < 10 THEN 75
        WHEN p1.birth_year - p2.birth_year BETWEEN 30 AND 55 THEN 80
        ELSE 40
      END as confidence_score,
      p1.user_id != p2.user_id as is_cross_account
    FROM family_members p1
    JOIN family_members p2 ON (
      p1.id != p2.id 
      AND p1.last_name = p2.last_name
      AND (
        (p1.birth_year - p2.birth_year BETWEEN 15 AND 50) OR
        (ABS(p1.birth_year - p2.birth_year) < 15) OR
        (p1.birth_year - p2.birth_year BETWEEN 30 AND 70)
      )
    )
  )
  SELECT 
    pr.parent_id,
    pr.parent_name,
    pr.parent_account,
    pr.child_id,
    pr.child_name,
    pr.child_account,
    pr.relationship_type,
    pr.confidence_score,
    pr.is_cross_account
  FROM potential_relationships pr
  WHERE pr.confidence_score >= 60
  ORDER BY pr.confidence_score DESC, pr.is_cross_account DESC, pr.parent_name, pr.child_name;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create automatic family connections
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  parent_id,
  child_id,
  relationship_type,
  'accepted',
  confidence_score
FROM map_family_relationships('Centino')
WHERE confidence_score >= 70
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Step 7: Deploy monitoring and statistics function
CREATE OR REPLACE FUNCTION get_family_network_stats()
RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Total Families' as metric_name,
    COUNT(DISTINCT last_name)::text as metric_value
  FROM persons 
  WHERE last_name IS NOT NULL AND user_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Total Members' as metric_name,
    COUNT(*)::text as metric_value
  FROM persons 
  WHERE user_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Total Accounts' as metric_name,
    COUNT(DISTINCT user_id)::text as metric_value
  FROM persons 
  WHERE user_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Cross-Account Connections' as metric_name,
    COUNT(DISTINCT CASE WHEN p1.user_id != p2.user_id THEN fc.id END)::text as metric_value
  FROM family_connections fc
  JOIN persons p1 ON fc.person_id = p1.id
  JOIN persons p2 ON fc.related_person_id = p2.id
  
  UNION ALL
  
  SELECT 
    'Average Confidence' as metric_name,
    ROUND(AVG(confidence_score), 2)::text as metric_value
  FROM family_connections;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Final deployment verification
SELECT 'Deployment Complete' as deployment_step,
       jsonb_build_object(
         'status', 'success',
         'functions_deployed', 3,
         'tables_created', 2,
         'connections_created', (SELECT COUNT(*) FROM family_connections),
         'next_steps', jsonb_build_array(
           'Test with: SELECT * FROM discover_family_trees()',
           'Test with: SELECT * FROM map_family_relationships(''Centino'')',
           'Test with: SELECT * FROM get_family_network_stats()'
         )
       ) as verification;

-- Step 9: Quick test of the deployed system
SELECT * FROM get_family_network_stats();
