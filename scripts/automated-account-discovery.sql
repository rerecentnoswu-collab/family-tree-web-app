-- Automated Account Discovery System
-- Best practices for discovering and connecting new family accounts

-- 1. Smart account discovery function
CREATE OR REPLACE FUNCTION discover_family_accounts(
  search_email TEXT DEFAULT NULL,
  search_name TEXT DEFAULT NULL,
  confidence_threshold INTEGER DEFAULT 70
) RETURNS TABLE (
  suggested_email TEXT,
  confidence_score INTEGER,
  discovery_method TEXT,
  evidence JSONB,
  existing_connections INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH potential_accounts AS (
    -- Method 1: Email pattern matching
    SELECT 
      au.email,
      GREATEST(
        CASE 
          WHEN au.email ILIKE '%' || search_name || '%' THEN 60
          ELSE 0
        END,
        CASE 
          WHEN au.email ILIKE '%' || REPLACE(search_name, ' ', '') || '%' THEN 50
          ELSE 0
        END
      ) as confidence,
      'email_pattern' as method,
      jsonb_build_object(
        'email_match', au.email ILIKE '%' || search_name || '%',
        'domain_match', SPLIT_PART(au.email, '@', 2)
      ) as evidence
    FROM auth.users au
    WHERE au.email NOT IN (
      SELECT DISTINCT user_id FROM persons WHERE user_id IS NOT NULL
    )
    AND (
      search_email IS NULL OR au.email ILIKE '%' || search_email || '%'
    )
    AND (
      search_name IS NULL OR 
      au.email ILIKE '%' || search_name || '%' OR
      au.email ILIKE '%' || REPLACE(search_name, ' ', '') || '%'
    )
    
    UNION ALL
    
    -- Method 2: Name similarity from existing persons
    SELECT 
      au.email,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM persons p 
          WHERE p.user_id IS NULL 
          AND (
            LOWER(p.first_name || ' ' || p.last_name) = LOWER(au.email)
            OR LOWER(p.first_name) = LOWER(SPLIT_PART(au.email, '@', 1))
            OR LOWER(p.last_name) = LOWER(SPLIT_PART(au.email, '@', 1))
          )
        ) THEN 80
        WHEN EXISTS (
          SELECT 1 FROM persons p 
          WHERE p.user_id IS NULL 
          AND LEVENSHTEIN(LOWER(p.first_name || p.last_name), LOWER(SPLIT_PART(au.email, '@', 1))) < 3
        ) THEN 70
        ELSE 0
      END as confidence,
      'name_similarity' as method,
      jsonb_build_object(
        'name_parts', ARRAY[
          LOWER(SPLIT_PART(au.email, '@', 1))
        ]
      ) as evidence
    FROM auth_users au
    WHERE au.email NOT IN (
      SELECT DISTINCT user_id FROM persons WHERE user_id IS NOT NULL
    )
    AND EXISTS (
      SELECT 1 FROM persons p 
      WHERE p.user_id IS NULL 
      AND LEVENSHTEIN(LOWER(p.first_name || p.last_name), LOWER(SPLIT_PART(au.email, '@', 1))) < 5
    )
  )
  SELECT 
    pa.email,
    pa.confidence,
    pa.method,
    pa.evidence,
    COALESCE(connection_count.existing, 0) as existing_connections
  FROM potential_accounts pa
  LEFT JOIN (
    SELECT 
      COUNT(*) as existing,
      p1.user_id
    FROM family_connections fc
    JOIN persons p1 ON fc.person_id = p1.id
    WHERE p1.user_id IS NOT NULL
    GROUP BY p1.user_id
  ) connection_count ON connection_count.user_id = (
    SELECT user_id FROM persons WHERE user_id IS NOT NULL LIMIT 1
  )
  WHERE pa.confidence >= confidence_threshold
  ORDER BY pa.confidence DESC, pa.method;
END;
$$ LANGUAGE plpgsql;

-- 2. Family invitation system
CREATE OR REPLACE FUNCTION create_family_invitation(
  family_group_id UUID,
  invited_email TEXT,
  invited_by UUID,
  relationship_suggestions JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  invitation_id UUID;
  token TEXT;
BEGIN
  -- Generate unique invitation token
  token := encode(gen_random_bytes(32), 'base64');
  
  -- Create invitation
  INSERT INTO family_invitations (
    family_group_id,
    invited_email,
    invited_by,
    relationship_suggestion,
    invitation_token,
    expires_at
  ) VALUES (
    family_group_id,
    invited_email,
    invited_by,
    relationship_suggestions,
    token,
    NOW() + INTERVAL '7 days'
  ) RETURNING id INTO invitation_id;
  
  -- Log the discovery
  INSERT INTO account_discovery_log (
    discovered_by,
    discovered_account,
    discovery_method,
    confidence_score,
    metadata
  ) VALUES (
    invited_by,
    (SELECT id FROM auth.users WHERE email = invited_email LIMIT 1),
    'invitation',
    100,
    jsonb_build_object(
      'invitation_id', invitation_id,
      'family_group_id', family_group_id
    )
  );
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Automated relationship suggestions
CREATE OR REPLACE FUNCTION suggest_cross_account_relationships(
  new_account_id UUID,
  confidence_threshold INTEGER DEFAULT 60
) RETURNS TABLE (
  person_id UUID,
  suggested_relationship TEXT,
  confidence_score INTEGER,
  evidence JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH potential_matches AS (
    SELECT 
      p.id as person_id,
      p.first_name,
      p.last_name,
      p.birthday,
      p.user_id as existing_account,
      CASE 
        -- Name matching
        WHEN EXISTS (
          SELECT 1 FROM persons p2 
          WHERE p2.user_id = new_account_id
          AND LOWER(p2.first_name) = LOWER(p.first_name)
          AND LOWER(p2.last_name) = LOWER(p.last_name)
        ) THEN 90
        
        -- Similar names with age proximity
        WHEN EXISTS (
          SELECT 1 FROM persons p2 
          WHERE p2.user_id = new_account_id
          AND LEVENSHTEIN(LOWER(p.first_name), LOWER(p2.first_name)) < 2
          AND LEVENSHTEIN(LOWER(p.last_name), LOWER(p2.last_name)) < 2
          AND ABS(EXTRACT(YEAR FROM AGE(p.birthday, p2.birthday))) < 5
        ) THEN 75
        
        -- Same last name with reasonable age gap
        WHEN EXISTS (
          SELECT 1 FROM persons p2 
          WHERE p2.user_id = new_account_id
          AND LOWER(p.last_name) = LOWER(p.last_name)
          AND ABS(EXTRACT(YEAR FROM AGE(p.birthday, p2.birthday))) BETWEEN 15 AND 60
        ) THEN 65
        
        ELSE 0
      END as confidence,
      jsonb_build_object(
        'name_match', EXISTS (
          SELECT 1 FROM persons p2 
          WHERE p2.user_id = new_account_id
          AND LOWER(p.first_name) = LOWER(p.first_name)
          AND LOWER(p.last_name) = LOWER(p.last_name)
        ),
        'age_proximity', EXISTS (
          SELECT 1 FROM persons p2 
          WHERE p2.user_id = new_account_id
          AND ABS(EXTRACT(YEAR FROM AGE(p.birthday, p2.birthday))) < 5
        )
      ) as evidence
    FROM persons p
    WHERE p.user_id IS NOT NULL
    AND p.user_id != new_account_id
  )
  SELECT 
    pm.person_id,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM persons p2 
        WHERE p2.user_id = new_account_id
        AND p2.birthday < pm.birthday
        AND ABS(EXTRACT(YEAR FROM AGE(pm.birthday, p2.birthday))) BETWEEN 15 AND 60
      ) THEN 'child'
      WHEN EXISTS (
        SELECT 1 FROM persons p2 
        WHERE p2.user_id = new_account_id
        AND p2.birthday > pm.birthday
        AND ABS(EXTRACT(YEAR FROM AGE(pm.birthday, p2.birthday))) BETWEEN 15 AND 60
      ) THEN 'parent'
      WHEN EXISTS (
        SELECT 1 FROM persons p2 
        WHERE p2.user_id = new_account_id
        AND ABS(EXTRACT(YEAR FROM AGE(pm.birthday, p2.birthday))) < 15
      ) THEN 'sibling'
      ELSE 'unknown'
    END as suggested_relationship,
    pm.confidence,
    pm.evidence
  FROM potential_matches pm
  WHERE pm.confidence >= confidence_threshold
  ORDER BY pm.confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Account health monitoring
CREATE OR REPLACE FUNCTION check_account_health()
RETURNS TABLE (
  account_email TEXT,
  health_score INTEGER,
  issues JSONB,
  recommendations JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH account_analysis AS (
    SELECT 
      au.email,
      COUNT(DISTINCT p.id) as person_count,
      COUNT(DISTINCT fc.id) as connection_count,
      MAX(p.created_at) as last_person_added,
      MAX(fc.created_at) as last_connection_added
    FROM auth.users au
    LEFT JOIN persons p ON au.id = p.user_id
    LEFT JOIN family_connections fc ON (
      fc.person_id IN (SELECT id FROM persons WHERE user_id = au.id) OR
      fc.related_person_id IN (SELECT id FROM persons WHERE user_id = au.id)
    )
    WHERE au.email IN (
      SELECT user_id::text FROM family_account_memberships WHERE status = 'active'
    )
    GROUP BY au.email
  )
  SELECT 
    aa.email,
    LEAST(100, GREATEST(0, 
      (aa.person_count * 10) + -- 10 points per person
      (aa.connection_count * 5) + -- 5 points per connection
      CASE 
        WHEN aa.last_person_added > NOW() - INTERVAL '30 days' THEN 20
        WHEN aa.last_person_added > NOW() - INTERVAL '90 days' THEN 10
        ELSE 0
      END +
      CASE 
        WHEN aa.last_connection_added > NOW() - INTERVAL '30 days' THEN 20
        WHEN aa.last_connection_added > NOW() - INTERVAL '90 days' THEN 10
        ELSE 0
      END
    )) as health_score,
    jsonb_build_object(
      'person_count', aa.person_count,
      'connection_count', aa.connection_count,
      'last_activity', GREATEST(aa.last_person_added, aa.last_connection_added)
    ) as issues,
    jsonb_build_object(
      CASE 
        WHEN aa.person_count < 3 THEN 'add_more_family_members'
        WHEN aa.connection_count < 5 THEN 'create_more_connections'
        WHEN aa.last_person_added < NOW() - INTERVAL '90 days' THEN 'update_family_data'
        ELSE 'account_healthy'
      END
    ) as recommendations
  FROM account_analysis aa;
END;
$$ LANGUAGE plpgsql;
