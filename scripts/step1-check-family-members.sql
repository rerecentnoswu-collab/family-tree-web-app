-- Step 1: Check current family members
SELECT 
  id,
  first_name,
  last_name,
  user_id,
  birthday,
  created_at,
  CASE 
    WHEN user_id::text LIKE '%rere.centno%' THEN 'rere.centno.swu@phinmaed.com'
    WHEN user_id::text LIKE '%kensite24%' THEN 'kensite24@gmail.com'
    ELSE 'Unknown Account'
  END as account_name
FROM persons 
ORDER BY last_name, first_name;
