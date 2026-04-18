-- Simple Family Connections Fix
-- Direct fix for Reycelyn and celestino jr Centino

-- Step 1: Get the IDs of Reycelyn and celestino jr
SELECT 
  id,
  first_name,
  last_name,
  user_id
FROM persons 
WHERE last_name = 'Centino' 
  AND (first_name ILIKE '%reycelyn%' OR first_name ILIKE '%celestino%')
ORDER BY first_name;

-- Step 2: Create sibling relationship between them
-- This assumes they are siblings based on similar age (37 and 36)
INSERT INTO family_connections (
  person_id, 
  related_person_id, 
  relationship_type, 
  status, 
  confidence_score
)
SELECT 
  p1.id,
  p2.id,
  'sibling',
  'accepted',
  85
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
  )
RETURNING 
  'Sibling relationship created' as result,
  (SELECT first_name || ' ' || last_name FROM persons WHERE id = p1.id) as person1,
  (SELECT first_name || ' ' || last_name FROM persons WHERE id = p2.id) as person2;

-- Step 3: Verify the connection was created
SELECT 
  'Family Connection Verification' as status,
  p1.first_name || ' ' || p1.last_name as person1,
  p2.first_name || ' ' || p2.last_name as person2,
  fc.relationship_type,
  fc.status,
  fc.confidence_score
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
WHERE p1.last_name = 'Centino' AND p2.last_name = 'Centino'
ORDER BY fc.confidence_score DESC;
