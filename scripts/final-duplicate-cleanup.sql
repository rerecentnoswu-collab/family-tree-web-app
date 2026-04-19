-- Final Duplicate Cleanup Script
-- Complete solution to eliminate all duplicate family members

-- Step 1: Check for actual duplicate records in database
WITH duplicate_check AS (
  SELECT 
    first_name,
    last_name,
    COUNT(*) as record_count,
    STRING_AGG(id::text, ', ') as duplicate_ids,
    STRING_AGG(user_id::text, ', ') as user_ids,
    MIN(created_at) as oldest_created,
    MAX(created_at) as newest_created
  FROM persons 
  WHERE last_name = 'Centino' AND user_id IS NOT NULL
  GROUP BY first_name, last_name
  HAVING COUNT(*) > 1
)
SELECT 
  'Database Duplicate Records Found' as step,
  jsonb_build_object(
    'duplicate_groups', ARRAY_AGG(
      jsonb_build_object(
        'name', first_name || ' ' || last_name,
        'record_count', record_count,
        'duplicate_ids', duplicate_ids,
        'user_ids', user_ids,
        'oldest_created', oldest_created,
        'newest_created', newest_created,
        'needs_cleanup', record_count > 1
      )
    )
  ) as result
FROM duplicate_check;

-- Step 2: Create unique person records and delete duplicates
-- This will keep the oldest record for each person
WITH ranked_persons AS (
  SELECT 
    id,
    first_name,
    last_name,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY first_name, last_name ORDER BY created_at ASC) as record_rank
  FROM persons 
  WHERE last_name = 'Centino' AND user_id IS NOT NULL
)
SELECT 
  'Records to Keep vs Delete' as step,
  jsonb_build_object(
    'cleanup_plan', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'user_id', user_id,
        'record_rank', record_rank,
        'action', CASE WHEN record_rank = 1 THEN 'KEEP' ELSE 'DELETE' END,
        'created_at', created_at
      )
    )
  ) as result
FROM ranked_persons;

-- Step 3: Execute the cleanup (this will actually delete duplicate records)
-- WARNING: This will permanently delete duplicate records
DELETE FROM persons 
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY first_name, last_name ORDER BY created_at ASC) as record_rank
    FROM persons 
    WHERE last_name = 'Centino' AND user_id IS NOT NULL
  ) ranked
  WHERE record_rank > 1
);

-- Step 4: Verify cleanup was successful
SELECT 
  'Cleanup Verification' as step,
  jsonb_build_object(
    'remaining_records', COUNT(*),
    'unique_names', COUNT(DISTINCT first_name || ' ' || last_name),
    'duplicates_remaining', COUNT(*) - COUNT(DISTINCT first_name || ' ' || last_name),
    'clean_records', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'user_id', user_id,
        'created_at', created_at
      )
    )
  ) as result
FROM persons 
WHERE last_name = 'Centino' AND user_id IS NOT NULL;
