-- Create user account for rere.centno.swu@phinmaed.com
-- This will create the user and send a confirmation email

INSERT INTO auth.users (
  email,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  aud
) VALUES (
  'rere.centno.swu@phinmaed.com',
  now(), -- Set as confirmed, or NULL to require email confirmation
  NULL,
  NULL,
  '{}',
  '{}',
  now(),
  now(),
  'authenticated'
);

-- Alternative: Create with email confirmation required
-- Uncomment below and comment above if you want email confirmation

/*
INSERT INTO auth.users (
  email,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  aud
) VALUES (
  'rere.centno.swu@phinmaed.com',
  NULL, -- Requires email confirmation
  NULL,
  NULL,
  '{}',
  '{}',
  now(),
  now(),
  'authenticated'
);
*/
