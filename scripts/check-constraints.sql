-- Check unique constraints on family_connections table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'family_connections'::regclass 
  AND contype IN ('u', 'p')
ORDER BY conname;
