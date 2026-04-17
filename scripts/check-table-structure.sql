-- Check if family_connections table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'family_connections' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
