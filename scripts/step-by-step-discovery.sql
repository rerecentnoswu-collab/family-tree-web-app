-- Step-by-Step Family Discovery System
-- Each query works independently and can be run separately

-- Step 1: Discover family groups by last name
SELECT 
  last_name as family_name,
  COUNT(*) as total_members,
  COUNT(DISTINCT user_id) as account_count,
  STRING_AGG(DISTINCT user_id::text, ', ') as account_ids,
  MIN(birthday) as oldest_birthdate,
  MAX(birthday) as newest_birthdate,
  CASE 
    WHEN COUNT(DISTINCT user_id) >= 3 THEN 95
    WHEN COUNT(DISTINCT user_id) >= 2 THEN 85
    WHEN COUNT(*) >= 3 THEN 70
    ELSE 50
  END as confidence_score
FROM persons 
WHERE last_name IS NOT NULL 
  AND last_name != ''
  AND user_id IS NOT NULL
GROUP BY last_name
HAVING COUNT(*) >= 2 OR COUNT(DISTINCT user_id) >= 2
ORDER BY confidence_score DESC, total_members DESC;

-- Step 2: Find parent-child relationships for Centino family
WITH family_members AS (
  SELECT 
    id, first_name, last_name, birthday, user_id,
    EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
)
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
  END as confidence_score
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
WHERE p1.birth_year - p2.birth_year >= 15
ORDER BY confidence_score DESC, parent_name, child_name;

-- Step 3: Create family connections from discovered relationships
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  p1.id as person_id,
  p2.id as related_person_id,
  CASE 
    WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent'
    WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling'
    WHEN p1.birth_year - p2.birth_year >= 30 AND p1.birth_year - p2.birth_year <= 70 THEN 'grandparent'
    ELSE 'unknown'
  END as relationship_type,
  'accepted' as status,
  CASE 
    WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 THEN 95
    WHEN p1.birth_year - p2.birth_year BETWEEN 15 AND 25 THEN 85
    WHEN ABS(p1.birth_year - p2.birth_year) < 10 THEN 75
    WHEN p1.birth_year - p2.birth_year BETWEEN 30 AND 55 THEN 80
    ELSE 40
  END as confidence_score
FROM (
  SELECT 
    id, first_name, last_name, birthday, user_id,
    EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
) p1
JOIN (
  SELECT 
    id, first_name, last_name, birthday, user_id,
    EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
) p2 ON (
  p1.id != p2.id 
  AND p1.last_name = p2.last_name
  AND p1.birth_year - p2.birth_year >= 15
  AND p1.birth_year - p2.birth_year <= 50
)
WHERE 
  CASE 
    WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 THEN 95
    WHEN p1.birth_year - p2.birth_year BETWEEN 15 AND 25 THEN 85
    WHEN p1.birth_year - p2.birth_year BETWEEN 30 AND 55 THEN 80
    ELSE 40
  END >= 70
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Step 4: Get cross-account family statistics
SELECT 
  'Family Network Summary' as report_type,
  jsonb_build_object(
    'total_families', COUNT(DISTINCT last_name),
    'total_members', COUNT(*),
    'total_accounts', COUNT(DISTINCT user_id),
    'cross_account_relationships', COUNT(DISTINCT CASE 
      WHEN p1.user_id != p2.user_id THEN fc.id 
    END),
    'average_confidence', ROUND(AVG(fc.confidence_score), 2)
  ) as statistics
FROM persons p
LEFT JOIN family_connections fc ON fc.person_id = p.id
LEFT JOIN persons p2 ON fc.related_person_id = p2.id
WHERE p.last_name IS NOT NULL 
  AND p.last_name != ''
  AND p.user_id IS NOT NULL

UNION ALL

SELECT 
  'Account Breakdown' as report_type,
  jsonb_build_object(
    'account_email', COALESCE(au.email, 'No Account'),
    'member_count', COUNT(p.id),
    'family_name', MAX(p.last_name),
    'cross_account_connections', COUNT(DISTINCT CASE WHEN p.user_id != au.id THEN 1 END)
  ) as details
FROM persons p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.last_name IS NOT NULL 
  AND p.last_name != ''
GROUP BY au.email, p.last_name
ORDER BY COUNT(p.id) DESC;
