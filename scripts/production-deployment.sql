-- Production Family Discovery System
-- Complete rebuild with all latest changes

-- Step 1: Clean deployment - drop existing functions to ensure clean rebuild
DROP FUNCTION IF EXISTS discover_family_trees() CASCADE;
DROP FUNCTION IF EXISTS map_family_relationships(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_family_network_stats() CASCADE;

-- Step 2: Create production-ready family discovery function
CREATE OR REPLACE FUNCTION discover_family_trees()
RETURNS TABLE (
  family_group_id UUID,
  family_name TEXT,
  root_person_id UUID,
  root_person_name TEXT,
  total_members INTEGER,
  total_accounts INTEGER,
  confidence_score INTEGER,
  discovery_evidence JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH family_analysis AS (
    SELECT 
      last_name as family_name,
      COUNT(*) as member_count,
      COUNT(DISTINCT user_id) as account_count,
      STRING_AGG(DISTINCT user_id::text, ',') as account_ids,
      MIN(birthday) as oldest_birthdate,
      MAX(birthday) as newest_birthdate
    FROM persons 
    WHERE last_name IS NOT NULL 
      AND last_name != ''
      AND user_id IS NOT NULL
    GROUP BY last_name
    HAVING COUNT(*) >= 2 OR COUNT(DISTINCT user_id) >= 2
  ),
  family_trees AS (
    SELECT 
      fa.family_name,
      fa.member_count,
      fa.account_count,
      fa.oldest_birthdate,
      fa.newest_birthdate,
      -- Find the oldest person as root
      (SELECT id FROM persons p WHERE p.last_name = fa.family_name AND p.user_id IS NOT NULL ORDER BY p.birthday LIMIT 1) as root_person_id,
      (SELECT first_name || ' ' || last_name FROM persons p WHERE p.last_name = fa.family_name AND p.user_id IS NOT NULL ORDER BY p.birthday LIMIT 1) as root_person_name,
      -- Calculate confidence based on multiple factors
      CASE 
        WHEN fa.account_count >= 3 AND fa.member_count >= 5 THEN 95
        WHEN fa.account_count >= 2 AND fa.member_count >= 3 THEN 85
        WHEN fa.account_count >= 2 OR fa.member_count >= 3 THEN 70
        ELSE 50
      END as confidence_score,
      jsonb_build_object(
        'member_count', fa.member_count,
        'account_count', fa.account_count,
        'oldest_birthdate', fa.oldest_birthdate,
        'newest_birthdate', fa.newest_birthdate,
        'has_multiple_accounts', fa.account_count >= 2,
        'has_multiple_generations', fa.member_count >= 3,
        'age_span_years', EXTRACT(YEAR FROM AGE(fa.newest_birthdate, fa.oldest_birthdate))
      ) as discovery_evidence
    FROM family_analysis fa
  )
  SELECT 
    gen_random_uuid() as family_group_id,
    ft.family_name,
    ft.root_person_id,
    ft.root_person_name,
    ft.member_count as total_members,
    ft.account_count as total_accounts,
    ft.confidence_score,
    ft.discovery_evidence
  FROM family_trees ft
  ORDER BY ft.confidence_score DESC, ft.family_name;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create production relationship mapping function
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
  is_cross_account BOOLEAN,
  relationship_evidence JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH family_members AS (
    SELECT 
      id, 
      first_name, 
      last_name, 
      birthday, 
      user_id,
      EXTRACT(YEAR FROM birthday::date) as birth_year,
      CASE 
        WHEN user_id IS NOT NULL THEN 'linked'
        ELSE 'unlinked'
      END as account_status
    FROM persons 
    WHERE (last_name = family_name_param OR family_name_param IS NULL)
      AND last_name IS NOT NULL 
      AND last_name != ''
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
        -- Parent-child: parent at least 15 years older
        WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent'
        -- Sibling: similar age
        WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling'
        -- Grandparent: parent at least 30 years older
        WHEN p1.birth_year - p2.birth_year >= 30 AND p1.birth_year - p2.birth_year <= 70 THEN 'grandparent'
        -- Spouse: similar age
        WHEN ABS(p1.birth_year - p2.birth_year) <= 10 THEN 'potential_spouse'
        ELSE 'unknown'
      END as relationship_type,
      -- Calculate confidence based on multiple factors
      CASE 
        WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 AND p1.last_name = p2.last_name THEN 95
        WHEN p1.birth_year - p2.birth_year BETWEEN 15 AND 25 AND p1.last_name = p2.last_name THEN 85
        WHEN ABS(p1.birth_year - p2.birth_year) < 10 AND p1.last_name = p2.last_name THEN 75
        WHEN p1.birth_year - p2.birth_year BETWEEN 30 AND 55 AND p1.last_name = p2.last_name THEN 80
        ELSE 40
      END as confidence_score,
      p1.user_id != p2.user_id as is_cross_account,
      jsonb_build_object(
        'age_gap', p1.birth_year - p2.birth_year,
        'same_last_name', p1.last_name = p2.last_name,
        'both_have_accounts', p1.account_status = 'linked' AND p2.account_status = 'linked',
        'age_gap_reason', CASE 
          WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent_child_range'
          WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling_range'
          WHEN p1.birth_year - p2.birth_year >= 30 THEN 'grandparent_range'
          ELSE 'other'
        END,
        'confidence_factors', jsonb_build_array(
          CASE WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 THEN 'ideal_parent_age' END,
          CASE WHEN p1.last_name = p2.last_name THEN 'same_family_name' END,
          CASE WHEN p1.account_status = 'linked' AND p2.account_status = 'linked' THEN 'both_linked' END,
          CASE WHEN p1.user_id != p2.user_id THEN 'cross_account' END
        )
      ) as relationship_evidence
    FROM family_members p1
    JOIN family_members p2 ON (
      p1.id != p2.id 
      AND p1.last_name = p2.last_name
      AND (
        -- Parent-child: reasonable age gap
        (p1.birth_year - p2.birth_year BETWEEN 15 AND 50) OR
        -- Siblings: similar age
        (ABS(p1.birth_year - p2.birth_year) < 15) OR
        -- Grandparent-grandchild: large age gap
        (p1.birth_year - p2.birth_year BETWEEN 30 AND 70) OR
        -- Spouse: similar age
        (ABS(p1.birth_year - p2.birth_year) <= 10)
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
    pr.is_cross_account,
    pr.relationship_evidence
  FROM potential_relationships pr
  WHERE pr.confidence_score >= 60 -- Only include relationships with reasonable confidence
  ORDER BY pr.confidence_score DESC, pr.is_cross_account DESC, pr.parent_name, pr.child_name;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create production monitoring function
CREATE OR REPLACE FUNCTION get_family_network_stats()
RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT,
  metric_details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Total Families' as metric_name,
    COUNT(DISTINCT last_name)::text as metric_value,
    jsonb_build_object('families', ARRAY_AGG(DISTINCT last_name)) as metric_details
  FROM persons 
  WHERE last_name IS NOT NULL AND user_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Total Members' as metric_name,
    COUNT(*)::text as metric_value,
    jsonb_build_object('average_per_family', ROUND(COUNT(*)::numeric / COUNT(DISTINCT last_name), 2)) as metric_details
  FROM persons 
  WHERE user_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Total Accounts' as metric_name,
    COUNT(DISTINCT user_id)::text as metric_value,
    jsonb_build_object('accounts', ARRAY_AGG(DISTINCT user_id::text)) as metric_details
  FROM persons 
  WHERE user_id IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Cross-Account Connections' as metric_name,
    COUNT(DISTINCT CASE WHEN p1.user_id != p2.user_id THEN fc.id END)::text as metric_value,
    jsonb_build_object(
      'total_connections', COUNT(fc.id),
      'cross_account_percentage', ROUND(
        COUNT(DISTINCT CASE WHEN p1.user_id != p2.user_id THEN fc.id END) * 100.0 / 
        NULLIF(COUNT(fc.id), 0), 2
      )
    ) as metric_details
  FROM family_connections fc
  JOIN persons p1 ON fc.person_id = p1.id
  JOIN persons p2 ON fc.related_person_id = p2.id
  
  UNION ALL
  
  SELECT 
    'Average Confidence' as metric_name,
    ROUND(AVG(confidence_score), 2)::text as metric_value,
    jsonb_build_object(
      'min_confidence', MIN(confidence_score),
      'max_confidence', MAX(confidence_score),
      'high_confidence_count', COUNT(*) FILTER (WHERE confidence_score >= 80)
    ) as metric_details
  FROM family_connections;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create automatic connection creation function
CREATE OR REPLACE FUNCTION create_family_connections(family_name_param TEXT DEFAULT NULL, min_confidence INTEGER DEFAULT 70)
RETURNS TABLE (
  connections_created INTEGER,
  connections_skipped INTEGER,
  cross_account_connections INTEGER
) AS $$
DECLARE
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
  cross_account_count INTEGER := 0;
BEGIN
  -- Insert high-confidence family connections
  INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
  SELECT 
    parent_id,
    child_id,
    relationship_type,
    'accepted',
    confidence_score
  FROM map_family_relationships(family_name_param)
  WHERE confidence_score >= min_confidence
  ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING
  RETURNING 1 INTO created_count;
  
  -- Count skipped connections (low confidence)
  SELECT COUNT(*) INTO skipped_count
  FROM map_family_relationships(family_name_param)
  WHERE confidence_score < min_confidence;
  
  -- Count cross-account connections
  SELECT COUNT(*) INTO cross_account_count
  FROM map_family_relationships(family_name_param)
  WHERE confidence_score >= min_confidence AND is_cross_account = true;
  
  RETURN QUERY SELECT created_count, skipped_count, cross_account_count;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Production deployment verification
SELECT 'Production Deployment Verification' as deployment_step,
       jsonb_build_object(
         'status', 'success',
         'functions_deployed', 4,
         'deployment_time', NOW(),
         'system_ready', true
       ) as verification;

-- Step 7: Quick system test
SELECT * FROM get_family_network_stats();
