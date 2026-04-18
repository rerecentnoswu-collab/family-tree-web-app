-- Quick Family Connection Fix
-- Simple direct approach to connect Reycelyn and celestino jr to their parents

-- Step 1: Get the exact IDs
SELECT 
  'Get Exact IDs' as step,
  jsonb_build_object(
    'reycelyn', (SELECT id FROM persons WHERE first_name ILIKE '%reycelyn%' AND last_name = 'Centino' LIMIT 1),
    'celestino_jr', (SELECT id FROM persons WHERE first_name ILIKE '%celestino%' AND last_name = 'Centino' LIMIT 1),
    'potential_parents', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id
      )
    )
  ) as result
FROM persons 
WHERE last_name = 'Centino' 
  AND user_id IS NOT NULL
  AND birthday IS NOT NULL
  AND EXTRACT(YEAR FROM birthday::date) <= (2024 - 18);

-- Step 2: Create parent connections
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  parent.id as person_id,
  child.id as related_person_id,
  'parent',
  'accepted',
  85
FROM (
  SELECT id FROM persons WHERE first_name ILIKE '%reycelyn%' AND last_name = 'Centino' LIMIT 1
) child
CROSS JOIN (
  SELECT id FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
    AND birthday IS NOT NULL
    AND EXTRACT(YEAR FROM birthday::date) <= (2024 - 18)
    AND id != (SELECT id FROM persons WHERE first_name ILIKE '%reycelyn%' AND last_name = 'Centino' LIMIT 1)
) parent
WHERE NOT EXISTS (
  SELECT 1 FROM family_connections fc 
  WHERE fc.person_id = parent.id AND fc.related_person_id = child.id
);

-- Step 3: Create sibling connection between Reycelyn and celestino jr
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  p1.id as person_id,
  p2.id as related_person_id,
  'sibling',
  'accepted',
  90
FROM persons p1, persons p2
WHERE p1.last_name = 'Centino' 
  AND p2.last_name = 'Centino'
  AND p1.id != p2.id
  AND (
    (p1.first_name ILIKE '%reycelyn%' AND p2.first_name ILIKE '%celestino%') OR
    (p1.first_name ILIKE '%celestino%' AND p2.first_name ILIKE '%reycelyn%')
  )
  AND NOT EXISTS (
    SELECT 1 FROM family_connections fc 
    WHERE (fc.person_id = p1.id AND fc.related_person_id = p2.id)
       OR (fc.person_id = p2.id AND fc.related_person_id = p1.id)
  );

-- Step 4: Verify all connections
SELECT 
  'Final Verification' as step,
  jsonb_build_object(
    'total_connections', COUNT(*),
    'connections', ARRAY_AGG(
      jsonb_build_object(
        'person1', p1.first_name || ' ' || p1.last_name,
        'person2', p2.first_name || ' ' || p2.last_name,
        'relationship_type', fc.relationship_type,
        'confidence_score', fc.confidence_score,
        'is_cross_account', p1.user_id != p2.user_id
      )
    )
  ) as result
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
WHERE p1.last_name = 'Centino' AND p2.last_name = 'Centino';
