-- Simple Duplicate Person Fix
-- Direct approach without nested aggregates

-- Step 1: Show all Centino members to identify duplicates
SELECT 
  'All Centino Members' as step,
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
  AND user_id IS NOT NULL;

-- Step 2: Find duplicates by name
WITH name_groups AS (
  SELECT 
    first_name,
    last_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as all_ids,
    STRING_AGG(
      CASE 
        WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
        ELSE 'unknown'
      END, ', '
    ) as all_ages
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
  GROUP BY first_name, last_name
  HAVING COUNT(*) > 1
)
SELECT 
  'Duplicate Names Found' as step,
  jsonb_build_object(
    'duplicates', ARRAY_AGG(
      jsonb_build_object(
        'name', first_name || ' ' || last_name,
        'count', duplicate_count,
        'ids', all_ids,
        'ages', all_ages
      )
    )
  ) as result
FROM name_groups;

-- Step 3: Show which records to keep (oldest by creation date)
WITH ranked_persons AS (
  SELECT 
    id,
    first_name,
    last_name,
    birthday,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY first_name, last_name ORDER BY created_at ASC) as rank_num
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
)
SELECT 
  'Records to Keep (Rank 1)' as step,
  jsonb_build_object(
    'keep_records', ARRAY_AGG(
      jsonb_build_object(
        'id', id,
        'name', first_name || ' ' || last_name,
        'age', CASE 
          WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years'
          ELSE 'unknown'
        END,
        'user_id', user_id,
        'rank', rank_num,
        'action', CASE WHEN rank_num = 1 THEN 'KEEP' ELSE 'DELETE' END
      )
    )
  ) as result
FROM ranked_persons;
