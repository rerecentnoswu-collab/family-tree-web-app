-- Multi-Account Family Network Architecture
-- Best practices for scaling beyond 2 accounts

-- 1. Enhanced family_groups table for managing multiple accounts
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL, -- e.g., "Centino Family"
  description TEXT,
  primary_account_id UUID REFERENCES auth.users(id), -- Admin account
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Account membership table for tracking which accounts belong to which families
CREATE TABLE IF NOT EXISTS family_account_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'viewer', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  UNIQUE(family_group_id, user_id)
);

-- 3. Enhanced family_invitations table for multi-account invitations
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  relationship_suggestion JSONB, -- Suggested relationships based on existing data
  invitation_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- 4. Account discovery log for tracking how accounts were connected
CREATE TABLE IF NOT EXISTS account_discovery_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discovered_by UUID REFERENCES auth.users(id),
  discovered_account UUID REFERENCES auth.users(id),
  discovery_method TEXT NOT NULL CHECK (discovery_method IN ('invitation', 'email_match', 'name_match', 'manual')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  metadata JSONB, -- Additional discovery context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Cross-account relationship suggestions with AI scoring
CREATE TABLE IF NOT EXISTS relationship_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  suggested_account UUID REFERENCES auth.users(id),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'sibling', 'spouse', 'other')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  evidence JSONB, -- AI reasoning for the suggestion
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'ignored')),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all new tables
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_account_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_discovery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_groups
CREATE POLICY "Users can view family groups they belong to" ON family_groups
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_account_memberships 
      WHERE family_group_id = family_groups.id AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage family groups" ON family_groups
  FOR ALL USING (
    auth.uid() = primary_account_id OR
    auth.uid() IN (
      SELECT user_id FROM family_account_memberships 
      WHERE family_group_id = family_groups.id AND role = 'admin' AND status = 'active'
    )
  );

-- RLS Policies for family_account_memberships
CREATE POLICY "Users can view memberships in their groups" ON family_account_memberships
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_account_memberships fam
      WHERE fam.family_group_id = family_account_memberships.family_group_id 
        AND fam.status = 'active'
    )
  );

CREATE POLICY "Admins can manage memberships" ON family_account_memberships
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM family_account_memberships fam
      WHERE fam.family_group_id = family_account_memberships.family_group_id 
        AND fam.role = 'admin' AND fam.status = 'active'
    )
  );

-- Initialize the Centino Family Group
INSERT INTO family_groups (group_name, description, primary_account_id) 
VALUES (
  'Centino Family',
  'Centino family network spanning multiple accounts and generations',
  (SELECT id FROM auth.users WHERE email = 'rere.centno.swu@phinmaed.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Add existing accounts to the Centino Family Group
INSERT INTO family_account_memberships (family_group_id, user_id, role, status) 
SELECT 
  fg.id,
  au.id,
  CASE 
    WHEN au.email = 'rere.centno.swu@phinmaed.com' THEN 'admin'
    ELSE 'editor'
  END as role,
  'active' as status
FROM family_groups fg, auth.users au
WHERE fg.group_name = 'Centino Family'
  AND au.email IN ('rere.centno.swu@phinmaed.com', 'kensite24@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM family_account_memberships fam 
    WHERE fam.family_group_id = fg.id AND fam.user_id = au.id
  )
ON CONFLICT (family_group_id, user_id) DO NOTHING;
