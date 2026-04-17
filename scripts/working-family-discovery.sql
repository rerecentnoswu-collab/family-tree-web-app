-- Working Family Discovery System
-- Simple, reliable approach that works immediately

-- 1. Discover family groups by last name
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

-- 2. Find parent-child relationships within each family
WITH family_members AS (
  SELECT 
    id, first_name, last_name, birthday, user_id,
    EXTRACT(YEAR FROM birthday::date) as birth_year,
    ROW_NUMBER() OVER (PARTITION BY last_name ORDER BY birthday) as age_rank
  FROM persons 
  WHERE last_name IS NOT NULL 
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
    jsonb_build_object(
      'age_gap', p1.birth_year - p2.birth_year,
      'same_last_name', p1.last_name = p2.last_name,
      'both_have_accounts', p1.user_id IS NOT NULL AND p2.user_id IS NOT NULL,
      'cross_account', p1.user_id != p2.user_id
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
SELECT 
  pr.parent_id,
  pr.parent_name,
  pr.parent_account,
  pr.child_id,
  pr.child_name,
  pr.child_account,
  pr.relationship_type,
  pr.confidence_score,
  pr.relationship_evidence
FROM potential_relationships pr
WHERE pr.confidence_score >= 60 -- Only include relationships with reasonable confidence
ORDER BY pr.confidence_score DESC, pr.parent_name, pr.child_name;

-- 3. Create family connections from discovered relationships
-- This creates actual family_connections records
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  pr.parent_id,
  pr.child_id,
  pr.relationship_type,
  'accepted',
  pr.confidence_score
FROM potential_relationships pr
WHERE pr.confidence_score >= 70 -- Only create high-confidence relationships
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- 4. Get cross-account family statistics
SELECT 
  'Cross-Account Family Statistics' as report_type,
  jsonb_build_object(
    'total_families', COUNT(DISTINCT last_name),
    'total_members', COUNT(*),
    'total_accounts', COUNT(DISTINCT user_id),
    'cross_account_relationships', COUNT(DISTINCT CASE WHEN parent_account != child_account THEN 1 END),
    'average_confidence', ROUND(AVG(confidence_score), 2),
    'families_with_multiple_accounts', COUNT(DISTINCT CASE WHEN COUNT(DISTINCT user_id) > 1 THEN last_name END)
  ) as statistics
FROM persons 
WHERE last_name IS NOT NULL 
  AND last_name != ''
  AND user_id IS NOT NULL
GROUP BY last_name

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
