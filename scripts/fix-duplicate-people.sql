-- Fix Duplicate Person Records
-- Clean up redundant family members in the database

-- Step 1: Identify duplicate person records
SELECT 
  'Duplicate Person Analysis' as step,
  jsonb_build_object(
    'total_persons', COUNT(*),
    'unique_names', COUNT(DISTINCT first_name || ' ' || last_name),
    'duplicates', COUNT(*) - COUNT(DISTINCT first_name || ' ' || last_name),
    'duplicate_groups', ARRAY_AGG(
      jsonb_build_object(
        'name', first_name || ' ' || last_name,
        'count', COUNT(*),
        'ids', ARRAY_AGG(id),
        'ages', ARRAY_AGG(
          CASE 
            WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
              ELSE 'unknown'
          END
        )
      )
    )
  ) as analysis
FROM persons 
WHERE last_name = 'Centino'
GROUP BY first_name, last_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Step 2: Show all current Centino members with their details
SELECT 
  'Current Centino Members' as step,
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
        'created_at', created_at
      )
    )
  ) as result
FROM persons 
WHERE last_name = 'Centino' 
  AND user_id IS NOT NULL
ORDER BY first_name, birthday;

-- Step 3: Find the correct/unique person records to keep
-- This will help identify which records are duplicates
WITH person_analysis AS (
  SELECT 
    id,
    first_name,
    last_name,
    birthday,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY first_name, last_name ORDER BY created_at) as record_rank,
    COUNT(*) OVER (PARTITION BY first_name, last_name) as duplicate_count
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
)
SELECT 
  'Recommended Records to Keep' as step,
  jsonb_build_object(
    'unique_persons', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
            ELSE 'unknown'
          END,
        'user_id', user_id,
        'record_rank', record_rank,
        'duplicate_count', duplicate_count,
        'recommended_action', CASE 
          WHEN record_rank = 1 THEN 'KEEP'
          ELSE 'REVIEW FOR DELETION'
        END
      )
    )
  ) as recommendation
FROM person_analysis
ORDER BY first_name, record_rank;
