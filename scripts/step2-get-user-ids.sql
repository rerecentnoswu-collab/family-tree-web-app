-- Step 2: Get user IDs from auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email IN ('rere.centno.swu@phinmaed.com', 'kensite24@gmail.com')
ORDER BY email;
