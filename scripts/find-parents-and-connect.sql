-- Find Parents and Create Cross-Account Family Connections
-- This script will identify parents and connect them to Reycelyn and celestino jr

-- Step 1: Find all Centino family members with their account details
SELECT 
  'All Centino Family Members' as analysis,
  jsonb_build_object(
    'members', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id,
        'email', (SELECT email FROM auth.users WHERE id = persons.user_id),
        'account_status', CASE WHEN user_id IS NOT NULL THEN 'linked' ELSE 'unlinked' END
      )
    )
  ) as family_analysis
FROM persons 
WHERE last_name = 'Centino' AND user_id IS NOT NULL;

-- Step 2: Identify potential parents (older Centino family members)
SELECT 
  'Potential Parents' as analysis,
  jsonb_build_object(
    'parents', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id,
        'email', (SELECT email FROM auth.users WHERE id = persons.user_id),
        'birth_year', EXTRACT(YEAR FROM birthday::date)
      )
    )
  ) as parent_candidates
FROM persons 
WHERE last_name = 'Centino' 
  AND user_id IS NOT NULL
  AND birthday IS NOT NULL
  AND EXTRACT(YEAR FROM birthday::date) <= (2024 - 18) -- At least 18 years older than 2024;

-- Step 3: Create parent-child connections for Reycelyn and celestino jr
-- This will connect them to older family members who are likely their parents
WITH children AS (
  SELECT id, first_name, last_name, user_id, EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
    AND (first_name ILIKE '%reycelyn%' OR first_name ILIKE '%celestino%')
),
potential_parents AS (
  SELECT id, first_name, last_name, user_id, EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
    AND birthday IS NOT NULL
    AND EXTRACT(YEAR FROM birthday::date) <= (2024 - 18) -- Parents at least 18 years old
)
INSERT INTO family_connections (
  person_id, 
  related_person_id, 
  relationship_type, 
  status, 
  confidence_score
)
SELECT 
  pp.id as parent_id,
  c.id as child_id,
  'parent',
  'accepted',
  CASE 
    WHEN pp.birth_year - c.birth_year BETWEEN 18 AND 45 THEN 95
    WHEN pp.birth_year - c.birth_year BETWEEN 15 AND 25 THEN 85
    WHEN pp.birth_year - c.birth_year BETWEEN 30 AND 55 THEN 80
    ELSE 70
  END as confidence_score
FROM potential_parents pp, children c
WHERE pp.id != c.id
  AND pp.birth_year - c.birth_year BETWEEN 15 AND 50 -- Reasonable parent age gap
  AND NOT EXISTS (
    SELECT 1 FROM family_connections fc 
    WHERE (fc.person_id = pp.id AND fc.related_person_id = c.id)
       OR (fc.person_id = c.id AND fc.related_person_id = pp.id)
  )
RETURNING 
  'Parent-child connection created' as result,
  (SELECT first_name || ' ' || last_name FROM persons WHERE id = pp.id) as parent_name,
  (SELECT first_name || ' ' || last_name FROM persons WHERE id = c.id) as child_name,
  confidence_score;

-- Step 4: Verify all family connections for Centino family
SELECT 
  'Complete Family Network' as verification,
  jsonb_build_object(
    'total_connections', COUNT(*),
    'connections', ARRAY_AGG(
      jsonb_build_object(
        'person1', p1.first_name || ' ' || p1.last_name,
        'person2', p2.first_name || ' ' || p2.last_name,
        'relationship_type', fc.relationship_type,
        'confidence_score', fc.confidence_score,
        'is_cross_account', p1.user_id != p2.user_id,
        'person1_email', (SELECT email FROM auth.users WHERE id = p1.user_id),
        'person2_email', (SELECT email FROM auth.users WHERE id = p2.user_id)
      )
    )
  ) as network
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
WHERE p1.last_name = 'Centino' AND p2.last_name = 'Centino'
ORDER BY fc.confidence_score DESC;
