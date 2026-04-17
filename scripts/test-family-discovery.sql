-- Simple Test Query for Family Discovery
-- Basic functionality test without complex syntax

-- Test 1: Check current family members
SELECT 
  last_name,
  COUNT(*) as member_count,
  COUNT(DISTINCT user_id) as account_count
FROM persons 
WHERE last_name IS NOT NULL 
  AND last_name != ''
  AND user_id IS NOT NULL
GROUP BY last_name
ORDER BY member_count DESC;
