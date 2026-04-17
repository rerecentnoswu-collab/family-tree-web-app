-- Practical Example: Adding a Third Account to Centino Family
-- This demonstrates the complete workflow for adding a new family member account

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

-- Step 2: Discover potential family accounts
-- Example: Looking for accounts that might contain Centino family members
SELECT 
  au.email,
  'potential_family_account' as discovery_type,
  CASE 
    WHEN au.email ILIKE '%centino%' THEN 85
    WHEN au.email ILIKE '%family%' THEN 60
    WHEN au.email ILIKE '%relatives%' THEN 50
    ELSE 30
  END as confidence_score,
  jsonb_build_object(
    'email_pattern', au.email,
    'domain', SPLIT_PART(au.email, '@', 2)
  ) as evidence
FROM auth.users au
WHERE au.email NOT IN (
  SELECT user_id::text FROM family_account_memberships WHERE status = 'active'
)
AND au.email NOT IN ('rere.centno.swu@phinmaed.com', 'kensite24@gmail.com')
ORDER BY confidence_score DESC
LIMIT 5;

-- Step 3: Create a sample family invitation
-- Example: Inviting a hypothetical third account
WITH centino_group AS (
  SELECT id FROM family_groups WHERE group_name = 'Centino Family' LIMIT 1
),
admin_user AS (
  SELECT id FROM auth.users WHERE email = 'rere.centno.swu@phinmaed.com' LIMIT 1
)
INSERT INTO family_invitations (
  family_group_id,
  invited_email,
  invited_by,
  relationship_suggestion,
  invitation_token,
  expires_at
) VALUES (
  (SELECT id FROM centino_group),
  'thirdfamilymember@example.com', -- Replace with actual email
  (SELECT id FROM admin_user),
  jsonb_build_object(
    'likely_relationship', 'sibling',
    'confidence', 75,
    'evidence', jsonb_build_array(
      'same_last_name_pattern',
      'similar_email_domain',
      'age_appropriate'
    ),
    'suggested_connections', jsonb_build_array(
      jsonb_build_object('person_id', 'b92a7a0f-10c1-4d5d-960b-c0c2113d5b15', 'relationship', 'sibling')
    )
  ),
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '7 days'
) RETURNING id, invitation_token;

-- Step 4: Simulate accepting the invitation and adding the account
-- This would typically be done by the invited user accepting the invitation
WITH new_account AS (
  SELECT id FROM auth.users WHERE email = 'thirdfamilymember@example.com' LIMIT 1
),
centino_group AS (
  SELECT id FROM family_groups WHERE group_name = 'Centino Family' LIMIT 1
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

-- Step 5: Create sample family members for the new account
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

-- Step 6: Generate cross-account relationship suggestions
-- This would automatically suggest how the new members connect to existing family
WITH new_account AS (
  SELECT id FROM auth.users WHERE email = 'thirdfamilymember@example.com' LIMIT 1
),
new_members AS (
  SELECT id, first_name, last_name, birthday 
  FROM persons 
  WHERE user_id = (SELECT id FROM new_account)
)
SELECT 
  nm.id as new_person_id,
  nm.first_name || ' ' || nm.last_name as new_person,
  ep.first_name || ' ' || ep.last_name as existing_person,
  CASE 
    WHEN ABS(EXTRACT(YEAR FROM AGE(nm.birthday, ep.birthday))) < 10 THEN 'sibling'
    WHEN ABS(EXTRACT(YEAR FROM AGE(nm.birthday, ep.birthday))) BETWEEN 20 AND 40 THEN 'parent/child'
    ELSE 'unknown'
  END as suggested_relationship,
  CASE 
    WHEN nm.last_name = ep.last_name THEN 80
    ELSE 40
  END as confidence_score,
  jsonb_build_object(
    'age_difference', ABS(EXTRACT(YEAR FROM AGE(nm.birthday, ep.birthday))),
    'same_last_name', nm.last_name = ep.last_name
  ) as evidence
FROM new_members nm
CROSS JOIN persons ep
WHERE ep.user_id IS NOT NULL 
  AND ep.user_id != (SELECT id FROM new_account)
  AND ep.last_name = nm.last_name
ORDER BY confidence_score DESC;

-- Step 7: Create automated cross-account connections
-- This creates the actual family connections based on suggestions
WITH new_account AS (
  SELECT id FROM auth.users WHERE email = 'thirdfamilymember@example.com' LIMIT 1
),
new_members AS (
  SELECT id, first_name, last_name, birthday 
  FROM persons 
  WHERE user_id = (SELECT id FROM new_account)
),
existing_members AS (
  SELECT id, first_name, last_name, birthday 
  FROM persons 
  WHERE user_id IN ('88ffaf9c-1000-4be2-8415-d1c924d8bf9f', 'aea0c215-1e22-45fe-aa64-15e2d9604020')
)
-- Connect Maria Centino (1985) as sibling to Reycel (1980)
INSERT INTO family_connections (person_id, related_person_id, relationship_type, status, confidence_score)
SELECT 
  nm.id,
  ep.id,
  'sibling',
  'accepted',
  75
FROM new_members nm, existing_members ep
WHERE nm.first_name = 'Maria' 
  AND ep.first_name = 'Reycel'
  AND ABS(EXTRACT(YEAR FROM AGE(nm.birthday, ep.birthday))) < 10
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
