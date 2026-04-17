-- Simple Account Discovery for Third Account
-- This works immediately without requiring complex functions

-- Step 1: Check current family group status
SELECT 
  fg.group_name,
  fg.primary_account_id,
  au.email as primary_email,
  COUNT(fam.user_id) as current_accounts,
  STRING_AGG(au2.email, ', ') as current_members
FROM family_groups fg
JOIN auth.users au ON fg.primary_account_id = au.id
JOIN family_account_memberships fam ON fg.id = fam.family_group_id
JOIN auth.users au2 ON fam.user_id = au2.id
WHERE fg.group_name = 'Centino Family'
GROUP BY fg.id, fg.group_name, fg.primary_account_id, au.email;

-- Step 2: Discover potential family accounts (simple version)
SELECT 
  au.email,
  au.created_at,
  CASE 
    WHEN au.email ILIKE '%centino%' THEN 85
    WHEN au.email ILIKE '%family%' THEN 60
    WHEN au.email ILIKE '%relatives%' THEN 50
    ELSE 30
  END as confidence_score,
  CASE 
    WHEN au.email ILIKE '%centino%' THEN 'High Priority - Same Last Name'
    WHEN au.email ILIKE '%family%' THEN 'Medium Priority - Family Domain'
    WHEN au.email ILIKE '%relatives%' THEN 'Medium Priority - Relatives'
    ELSE 'Low Priority - Generic'
  END as priority_level,
  jsonb_build_object(
    'email_pattern', au.email,
    'domain', SPLIT_PART(au.email, '@', 2),
    'created_date', au.created_at::date
  ) as evidence
FROM auth.users au
WHERE au.email NOT IN (
  SELECT user_id::text FROM family_account_memberships WHERE status = 'active'
)
AND au.email NOT IN ('rere.centno.swu@phinmaed.com', 'kensite24@gmail.com')
ORDER BY confidence_score DESC
LIMIT 10;

-- Step 3: Create a simple family invitation
-- Replace 'thirdfamilymember@example.com' with actual email
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'rere.centno.swu@phinmaed.com' LIMIT 1
)
INSERT INTO family_invitations (
  inviter_user_id,
  invited_email,
  family_name,
  relationship_type,
  message,
  expires_at
) VALUES (
  (SELECT id FROM admin_user),
  'thirdfamilymember@example.com', -- Replace with actual email
  'Centino Family',
  'sibling',
  'You are invited to join the Centino Family network. This invitation suggests a sibling relationship based on family name matching and age proximity.',
  NOW() + INTERVAL '7 days'
) RETURNING id, created_at, expires_at;

-- Step 4: Check invitation status
SELECT 
  fi.id,
  fi.invited_email,
  fi.status,
  fi.created_at,
  fi.expires_at,
  fi.family_name,
  inviter.email as invited_by_email,
  fi.relationship_type,
  fi.message
FROM family_invitations fi
JOIN auth.users inviter ON fi.inviter_user_id = inviter.id
WHERE fi.family_name = 'Centino Family'
ORDER BY fi.created_at DESC;

-- Step 5: Manual account addition (if invitation is accepted)
-- This simulates adding the account manually for testing
-- Replace 'thirdfamilymember@example.com' with the actual account email
WITH centino_group AS (
  SELECT id FROM family_groups WHERE group_name = 'Centino Family' LIMIT 1
),
new_account AS (
  SELECT id FROM auth.users WHERE email = 'thirdfamilymember@example.com' LIMIT 1
)
INSERT INTO family_account_memberships (
  family_group_id,
  user_id,
  role,
  status,
  joined_at
) VALUES (
  (SELECT id FROM centino_group),
  (SELECT id FROM new_account),
  'editor', -- New accounts start as editors
  'active',
  NOW()
) ON CONFLICT (family_group_id, user_id) DO UPDATE SET
  status = 'active',
  joined_at = NOW()
RETURNING *;

-- Step 6: Create sample family members for the new account (if needed)
-- This simulates the new account having existing family members
WITH new_account AS (
  SELECT id FROM auth.users WHERE email = 'thirdfamilymember@example.com' LIMIT 1
)
INSERT INTO persons (
  first_name,
  last_name,
  birthday,
  user_id,
  created_at
) VALUES 
  ('Maria', 'Centino', '1985-03-15', (SELECT id FROM new_account), NOW()),
  ('Carlos', 'Centino', '1988-07-22', (SELECT id FROM new_account), NOW())
ON CONFLICT DO NOTHING
RETURNING id, first_name, last_name, user_id;

-- Step 7: Create cross-account connections (manual version)
-- Connect Maria Centino (1985) as sibling to Reycel (1980)
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  p_new.id,
  p_existing.id,
  'sibling',
  'accepted',
  75
FROM persons p_new, persons p_existing
WHERE p_new.first_name = 'Maria' 
  AND p_new.last_name = 'Centino'
  AND p_existing.first_name = 'Reycel'
  AND p_existing.last_name = 'Centino'
  AND p_new.user_id != p_existing.user_id
ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING;

-- Step 8: Verify the expanded family network
SELECT 
  'Family Network Summary' as metric,
  jsonb_build_object(
    'total_accounts', COUNT(DISTINCT user_id),
    'total_members', COUNT(DISTINCT id),
    'total_connections', COUNT(DISTINCT fc.id),
    'cross_account_connections', COUNT(DISTINCT CASE 
      WHEN p1.user_id != p2.user_id THEN fc.id 
    END),
    'accounts_with_members', COUNT(DISTINCT CASE 
      WHEN user_id IS NOT NULL THEN user_id 
    END)
  ) as value
FROM persons p
LEFT JOIN family_connections fc ON fc.person_id = p.id
LEFT JOIN persons p2 ON fc.related_person_id = p2.id
WHERE last_name = 'Centino'

UNION ALL

-- Account breakdown
SELECT 
  'Account Breakdown' as metric,
  jsonb_build_object(
    'account_email', COALESCE(au.email, 'No Account'),
    'member_count', COUNT(p.id),
    'account_role', COALESCE(fam.role, 'none')
  ) as value
FROM persons p
LEFT JOIN auth.users au ON p.user_id = au.id
LEFT JOIN family_account_memberships fam ON p.user_id = fam.user_id
WHERE last_name = 'Centino'
GROUP BY au.email, fam.role
ORDER BY COUNT(p.id) DESC;
