-- Check the actual structure of family_invitations table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'family_invitations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
