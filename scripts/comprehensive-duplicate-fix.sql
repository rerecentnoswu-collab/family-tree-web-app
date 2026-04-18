-- Comprehensive Duplicate Fix
-- Clean up any remaining duplicate records in the database

-- Step 1: Check for exact duplicates (same person appearing multiple times)
SELECT 
  'Exact Duplicate Check' as step,
  jsonb_build_object(
    'duplicates_found', COUNT(*) - COUNT(DISTINCT id),
    'total_records', COUNT(*),
    'unique_ids', COUNT(DISTINCT id),
    'duplicate_details', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id,
        'created_at', created_at
      )
    )
  ) as result
FROM persons 
WHERE last_name = 'Centino' AND user_id IS NOT NULL
GROUP BY id
HAVING COUNT(*) > 1;

-- Step 2: Check for name duplicates (same name, different IDs)
WITH name_duplicates AS (
  SELECT 
    first_name,
    last_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as all_ids,
    STRING_AGG(user_id::text, ', ') as all_user_ids,
    ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id,
        'created_at', created_at
      )
    ) as details
  FROM persons 
  WHERE last_name = 'Centino' AND user_id IS NOT NULL
  GROUP BY first_name, last_name
  HAVING COUNT(*) > 1
)
SELECT 
  'Name Duplicates Found' as step,
  jsonb_build_object(
    'duplicate_groups', ARRAY_AGG(
      jsonb_build_object(
        'name', first_name || ' ' || last_name,
        'count', duplicate_count,
        'all_ids', all_ids,
        'all_user_ids', all_user_ids,
        'details', details
      )
    )
  ) as result
FROM name_duplicates;

-- Step 3: Create a clean view of unique family members
WITH unique_persons AS (
  SELECT 
    id,
    first_name,
    last_name,
    birthday,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY first_name, last_name ORDER BY created_at ASC) as record_rank
  FROM persons 
  WHERE last_name = 'Centino' AND user_id IS NOT NULL
)
SELECT 
  'Clean Family Members (Rank 1 Only)' as step,
  jsonb_build_object(
    'unique_members', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id,
        'rank', record_rank,
        'keep', CASE WHEN record_rank = 1 THEN 'YES' ELSE 'NO' END
      )
    )
  ) as result
FROM unique_persons;
