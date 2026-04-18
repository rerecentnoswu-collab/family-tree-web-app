-- Simple Parent-Child Connections for Reycelyn and celestino jr
-- Direct approach without complex SQL issues

-- Step 1: Find all Centino family members
SELECT 
  'Centino Family Members' as step,
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
        'birth_year', EXTRACT(YEAR FROM birthday::date)
      )
    )
  ) as result
FROM persons 
WHERE last_name = 'Centino' AND user_id IS NOT NULL;

-- Step 2: Find Reycelyn and celestino jr specifically
SELECT 
  'Target Children' as step,
  jsonb_build_object(
    'children', ARRAY_AGG(
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
  ) as result
FROM persons 
WHERE last_name = 'Centino' 
  AND user_id IS NOT NULL
  AND (first_name ILIKE '%reycelyn%' OR first_name ILIKE '%celestino%');

-- Step 3: Find potential parents (older Centino members)
SELECT 
  'Potential Parents' as step,
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
  ) as result
FROM persons 
WHERE last_name = 'Centino' 
  AND user_id IS NOT NULL
  AND birthday IS NOT NULL
  AND EXTRACT(YEAR FROM birthday::date) <= (2024 - 18);

-- Step 4: Create parent-child connections directly
-- This connects older Centino members to Reycelyn and celestino jr
INSERT INTO family_connections (
  person_id, 
  related_person_id, 
  relationship_type, 
  status, 
  confidence_score
)
SELECT 
  p1.id as parent_id,
  p2.id as child_id,
  'parent',
  'accepted',
  CASE 
    WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 THEN 95
    WHEN p1.birth_year - p2.birth_year BETWEEN 15 AND 25 THEN 85
    WHEN p1.birth_year - p2.birth_year BETWEEN 30 AND 55 THEN 80
    ELSE 70
  END as confidence_score
FROM (
  SELECT id, first_name, last_name, user_id, EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
    AND birthday IS NOT NULL
    AND EXTRACT(YEAR FROM birthday::date) <= (2024 - 18)
) p1
CROSS JOIN (
  SELECT id, first_name, last_name, user_id, EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
    AND (first_name ILIKE '%reycelyn%' OR first_name ILIKE '%celestino%')
) p2
WHERE p1.id != p2.id
  AND p1.birth_year - p2.birth_year BETWEEN 15 AND 50 -- Reasonable parent age gap
  AND NOT EXISTS (
    SELECT 1 FROM family_connections fc 
    WHERE (fc.person_id = p1.id AND fc.related_person_id = p2.id)
       OR (fc.person_id = p2.id AND fc.related_person_id = p1.id)
  )
RETURNING 
  'Parent-child connection created' as result,
  person_id,
  related_person_id,
  relationship_type,
  confidence_score;

-- Step 5: Verify all connections
SELECT 
  'All Family Connections' as step,
  jsonb_build_object(
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
  ) as result
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
WHERE p1.last_name = 'Centino' AND p2.last_name = 'Centino';
