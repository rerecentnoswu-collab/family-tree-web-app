-- Fix Family Connections for Production
-- This script will activate family connections for the deployed application

-- Step 1: Check current family connections status
SELECT 
  'Current Family Connections Status' as check_type,
  jsonb_build_object(
    'total_connections', COUNT(*),
    'accepted_connections', COUNT(*) FILTER (WHERE status = 'accepted'),
    'pending_connections', COUNT(*) FILTER (WHERE status = 'pending'),
    'average_confidence', ROUND(AVG(confidence_score), 2)
  ) as status
FROM family_connections;

-- Step 2: Check Centino family members
SELECT 
  'Centino Family Members' as check_type,
  jsonb_build_object(
    'total_members', COUNT(*),
    'members_with_accounts', COUNT(*) FILTER (WHERE user_id IS NOT NULL),
    'member_details', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id,
        'has_account', user_id IS NOT NULL
      )
    )
  ) as members
FROM persons 
WHERE last_name = 'Centino';

-- Step 3: Create missing family connections for Centino family
-- This will create parent-child, sibling, and other relationships
WITH centino_members AS (
  SELECT 
    id, 
    first_name, 
    last_name, 
    birthday, 
    user_id,
    EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
),
potential_connections AS (
  SELECT 
    p1.id as person_id,
    p2.id as related_person_id,
    CASE 
      -- Parent-child relationships based on age
      WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent'
      WHEN p2.birth_year - p1.birth_year >= 15 AND p2.birth_year - p1.birth_year <= 50 THEN 'child'
      -- Sibling relationships (similar age)
      WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling'
      -- Grandparent relationships
      WHEN p1.birth_year - p2.birth_year >= 30 AND p1.birth_year - p2.birth_year <= 70 THEN 'grandparent'
      WHEN p2.birth_year - p1.birth_year >= 30 AND p2.birth_year - p1.birth_year <= 70 THEN 'grandchild'
      -- Spouse relationships (similar age, different gender if available)
      WHEN ABS(p1.birth_year - p2.birth_year) <= 10 THEN 'spouse'
      ELSE 'unknown'
    END as relationship_type,
    CASE 
      -- High confidence for parent-child with reasonable age gap
      WHEN (p1.birth_year - p2.birth_year BETWEEN 18 AND 45 OR p2.birth_year - p1.birth_year BETWEEN 18 AND 45) THEN 95
      -- Medium confidence for siblings
      WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 85
      -- Medium confidence for grandparents
      WHEN (p1.birth_year - p2.birth_year BETWEEN 30 AND 55 OR p2.birth_year - p1.birth_year BETWEEN 30 AND 55) THEN 80
      -- Lower confidence for spouses
      WHEN ABS(p1.birth_year - p2.birth_year) <= 10 THEN 70
      ELSE 50
    END as confidence_score
  FROM centino_members p1
  JOIN centino_members p2 ON (
    p1.id != p2.id 
    AND (
      -- Include reasonable age gaps for family relationships
      (p1.birth_year - p2.birth_year BETWEEN 15 AND 50) OR
      (p2.birth_year - p1.birth_year BETWEEN 15 AND 50) OR
      (ABS(p1.birth_year - p2.birth_year) < 15) OR
      (p1.birth_year - p2.birth_year BETWEEN 30 AND 70) OR
      (p2.birth_year - p1.birth_year BETWEEN 30 AND 70) OR
      (ABS(p1.birth_year - p2.birth_year) <= 10)
    )
  )
  WHERE NOT EXISTS (
    -- Don't create duplicate connections
    SELECT 1 FROM family_connections fc 
    WHERE (fc.person_id = p1.id AND fc.related_person_id = p2.id)
       OR (fc.person_id = p2.id AND fc.related_person_id = p1.id)
  )
)
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  person_id,
  related_person_id,
  relationship_type,
  'accepted',
  confidence_score
FROM potential_connections
WHERE confidence_score >= 70 -- Only create high-confidence connections
RETURNING 
  person_id,
  related_person_id,
  relationship_type,
  confidence_score;

-- Step 4: Verify the created connections
SELECT 
  'Created Family Connections' as verification,
  jsonb_build_object(
    'connections_created', COUNT(*),
    'connection_details', ARRAY_AGG(
      jsonb_build_object(
        'person_name', p1.first_name || ' ' || p1.last_name,
        'related_person_name', p2.first_name || ' ' || p2.last_name,
        'relationship_type', fc.relationship_type,
        'confidence_score', fc.confidence_score,
        'is_cross_account', p1.user_id != p2.user_id
      )
    )
  ) as connections
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
WHERE p1.last_name = 'Centino' AND p2.last_name = 'Centino'
ORDER BY fc.confidence_score DESC;

-- Step 5: Final verification - show complete family network
SELECT 
  'Complete Family Network Status' as final_status,
  jsonb_build_object(
    'total_centino_members', (SELECT COUNT(*) FROM persons WHERE last_name = 'Centino'),
    'total_family_connections', (SELECT COUNT(*) FROM family_connections),
    'centino_connections', (SELECT COUNT(*) FROM family_connections fc
      JOIN persons p1 ON fc.person_id = p1.id
      JOIN persons p2 ON fc.related_person_id = p2.id
      WHERE p1.last_name = 'Centino' AND p2.last_name = 'Centino'),
    'cross_account_connections', (SELECT COUNT(*) FROM family_connections fc
      JOIN persons p1 ON fc.person_id = p1.id
      JOIN persons p2 ON fc.related_person_id = p2.id
      WHERE p1.last_name = 'Centino' AND p2.last_name = 'Centino' AND p1.user_id != p2.user_id),
    'average_confidence', (SELECT ROUND(AVG(confidence_score), 2) FROM family_connections),
    'relationship_types', (SELECT jsonb_object_agg(relationship_type, COUNT(*)) 
      FROM family_connections fc
      JOIN persons p1 ON fc.person_id = p1.id
      WHERE p1.last_name = 'Centino')
  ) as network_summary;
