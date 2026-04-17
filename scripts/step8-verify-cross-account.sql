-- Step 8: Verify cross-account family groups and connections

-- Check family groups across accounts
SELECT 
  last_name,
  COUNT(*) as total_members,
  COUNT(DISTINCT user_id) as number_of_accounts,
  STRING_AGG(
    first_name || ' (' || 
    CASE 
      WHEN user_id = '88ffaf9c-1000-4be2-8415-d1c924d8bf9f' THEN 'rere.centno.swu@phinmaed.com'
      WHEN user_id = 'aea0c215-1e22-45fe-aa64-15e2d9604020' THEN 'kensite24@gmail.com'
      ELSE 'No Account'
    END || ')' , 
    ', '
  ) as members
FROM persons 
WHERE last_name IS NOT NULL AND last_name != ''
GROUP BY last_name
HAVING COUNT(*) > 1
ORDER BY total_members DESC;

-- Check family connections created
SELECT 
  fc.person_id,
  p1.first_name || ' ' || p1.last_name || ' (' || 
    CASE 
      WHEN p1.birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM p1.birthday::date))::text || ' years'
      ELSE 'unknown age'
    END || ')' as person_name,
  fc.related_person_id,
  p2.first_name || ' ' || p2.last_name || ' (' || 
    CASE 
      WHEN p2.birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM p2.birthday::date))::text || ' years'
      ELSE 'unknown age'
    END || ')' as related_person_name,
  fc.relationship_type,
  fc.status,
  fc.confidence_score,
  CASE 
    WHEN p1.user_id != p2.user_id THEN 'CROSS-ACCOUNT'
    ELSE 'SAME ACCOUNT'
  END as connection_type
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
ORDER BY 
  CASE 
    WHEN p1.user_id != p2.user_id THEN 1
    ELSE 2
  END,
  fc.created_at DESC;

-- Summary statistics
SELECT 
  'Total Family Members' as metric,
  COUNT(*) as value
FROM persons
WHERE last_name = 'Centino'

UNION ALL

SELECT 
  'Total Family Connections' as metric,
  COUNT(*) as value
FROM family_connections

UNION ALL

SELECT 
  'Cross-Account Connections' as metric,
  COUNT(*) as value
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id
WHERE p1.user_id != p2.user_id

UNION ALL

SELECT 
  'Accounts with Family Members' as metric,
  COUNT(DISTINCT user_id) as value
FROM persons
WHERE last_name = 'Centino' AND user_id IS NOT NULL;
