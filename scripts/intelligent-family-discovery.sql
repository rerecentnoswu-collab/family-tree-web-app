-- Intelligent Family Tree Discovery System
-- Automatically discovers and maps family trees across unlimited accounts
-- Based on parent-child relationships using family name matching

-- 1. Core family discovery function
CREATE OR REPLACE FUNCTION discover_family_trees()
RETURNS TABLE (
  family_group_id UUID,
  family_name TEXT,
  root_person_id UUID,
  root_person_name TEXT,
  total_members INTEGER,
  total_accounts INTEGER,
  confidence_score INTEGER,
  discovery_evidence JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH family_groups AS (
    -- Group by last name to identify potential families
    SELECT 
      last_name as family_name,
      COUNT(*) as member_count,
      COUNT(DISTINCT user_id) as account_count,
      STRING_AGG(DISTINCT user_id::text, ',') as account_ids,
      STRING_AGG(id::text, ',') as person_ids,
      MIN(birthday) as oldest_birthdate
    FROM persons 
    WHERE last_name IS NOT NULL 
      AND last_name != ''
      AND user_id IS NOT NULL
    GROUP BY last_name
    HAVING COUNT(*) >= 2 OR COUNT(DISTINCT user_id) >= 2
  ),
  potential_parents AS (
    -- Identify potential parents (oldest members)
    SELECT 
      fg.family_name,
      fg.account_ids,
      fg.person_ids,
      UNNEST(STRING_TO_ARRAY(fg.person_ids, ','))::UUID as person_id,
      UNNEST(STRING_TO_ARRAY(fg.account_ids, ','))::UUID as account_id,
      fg.oldest_birthdate,
      ROW_NUMBER() OVER (PARTITION BY fg.family_name ORDER BY fg.oldest_birthdate) as age_rank
    FROM family_groups fg
  ),
  family_trees AS (
    -- Build family tree structures
    SELECT 
      pg.family_name,
      pp.person_id as root_person_id,
      pp.first_name || ' ' || pp.last_name as root_person_name,
      pp.birthday,
      pp.user_id as root_account_id,
      pg.member_count,
      pg.account_count,
      -- Calculate confidence based on data quality
      CASE 
        WHEN pg.account_count >= 3 AND pg.member_count >= 5 THEN 95
        WHEN pg.account_count >= 2 AND pg.member_count >= 3 THEN 85
        WHEN pg.account_count >= 2 OR pg.member_count >= 3 THEN 70
        ELSE 50
      END as confidence_score,
      jsonb_build_object(
        'family_name', pg.family_name,
        'member_count', pg.member_count,
        'account_count', pg.account_count,
        'oldest_member', pg.oldest_birthdate,
        'has_multiple_accounts', pg.account_count >= 2,
        'has_multiple_generations', pg.member_count >= 3
      ) as discovery_evidence
    FROM potential_parents pp
    JOIN family_groups pg ON pp.family_name = pg.family_name 
      AND pp.age_rank = 1
  )
  SELECT 
    gen_random_uuid() as family_group_id,
    ft.family_name,
    ft.root_person_id,
    ft.root_person_name,
    ft.member_count as total_members,
    ft.account_count as total_accounts,
    ft.confidence_score,
    ft.discovery_evidence
  FROM family_trees ft
  ORDER BY ft.confidence_score DESC, ft.family_name;
END;
$$ LANGUAGE plpgsql;

-- 2. Parent-child relationship mapper
CREATE OR REPLACE FUNCTION map_parent_child_relationships(
  family_name_param TEXT DEFAULT NULL
) RETURNS TABLE (
  parent_id UUID,
  parent_name TEXT,
  parent_account UUID,
  child_id UUID,
  child_name TEXT,
  child_account UUID,
  relationship_type TEXT,
  confidence_score INTEGER,
  relationship_evidence JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH family_members AS (
    SELECT 
      id, first_name, last_name, birthday, user_id,
      EXTRACT(YEAR FROM birthday::date) as birth_year,
      CASE 
        WHEN user_id IS NOT NULL THEN 'linked'
        ELSE 'unlinked'
      END as account_status
    FROM persons 
    WHERE last_name = family_name_param OR family_name_param IS NULL
      AND user_id IS NOT NULL
  ),
  potential_parents AS (
    -- Identify likely parents based on age and generation
    SELECT 
      p1.id as parent_id,
      p1.first_name || ' ' || p1.last_name as parent_name,
      p1.user_id as parent_account,
      p2.id as child_id,
      p2.first_name || ' ' || p2.last_name as child_name,
      p2.user_id as child_account,
      CASE 
        -- Parent-child relationship: parent at least 15 years older
        WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent'
        -- Sibling relationship: similar age
        WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling'
        -- Grandparent-grandchild: parent at least 30 years older
        WHEN p1.birth_year - p2.birth_year >= 30 AND p1.birth_year - p2.birth_year <= 70 THEN 'grandparent'
        -- Spouse relationship: similar age range
        WHEN ABS(p1.birth_year - p2.birth_year) <= 10 THEN 'potential_spouse'
        ELSE 'unknown'
      END as relationship_type,
      -- Calculate confidence based on multiple factors
      CASE 
        WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 AND p1.last_name = p2.last_name THEN 95
        WHEN p1.birth_year - p2.birth_year BETWEEN 15 AND 25 AND p1.last_name = p2.last_name THEN 85
        WHEN ABS(p1.birth_year - p2.birth_year) < 10 AND p1.last_name = p2.last_name THEN 75
        WHEN p1.birth_year - p2.birth_year BETWEEN 30 AND 55 AND p1.last_name = p2.last_name THEN 80
        ELSE 40
      END as confidence_score,
      jsonb_build_object(
        'age_gap', p1.birth_year - p2.birth_year,
        'same_last_name', p1.last_name = p2.last_name,
        'both_have_accounts', p1.account_status = 'linked' AND p2.account_status = 'linked',
        'age_gap_reason', CASE 
          WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent_child_range'
          WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling_range'
          WHEN p1.birth_year - p2.birth_year >= 30 THEN 'grandparent_range'
          ELSE 'other'
        END
      ) as relationship_evidence
    FROM family_members p1
    CROSS JOIN family_members p2 ON (
      p1.id != p2.id 
      AND p1.last_name = p2.last_name
      AND (
        -- Parent-child: reasonable age gap
        (p1.birth_year - p2.birth_year BETWEEN 15 AND 50) OR
        -- Siblings: similar age
        (ABS(p1.birth_year - p2.birth_year) < 15) OR
        -- Grandparent-grandchild: large age gap
        (p1.birth_year - p2.birth_year BETWEEN 30 AND 70) OR
        -- Spouse: similar age
        (ABS(p1.birth_year - p2.birth_year) <= 10)
      )
    )
  )
  SELECT 
    pp.parent_id,
    pp.parent_name,
    pp.parent_account,
    pp.child_id,
    pp.child_name,
    pp.child_account,
    pp.relationship_type,
    pp.confidence_score,
    pp.relationship_evidence
  FROM potential_parents pp
  WHERE pp.confidence_score >= 60 -- Only include relationships with reasonable confidence
  ORDER BY pp.confidence_score DESC, pp.parent_name, pp.child_name;
END;
$$ LANGUAGE plpgsql;

-- 3. Cross-account family tree builder
CREATE OR REPLACE FUNCTION build_cross_account_family_trees()
RETURNS TABLE (
  family_name TEXT,
  total_members INTEGER,
  total_accounts INTEGER,
  cross_account_connections INTEGER,
  tree_depth INTEGER,
  confidence_score INTEGER,
  tree_structure JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH discovered_families AS (
    SELECT * FROM discover_family_trees()
  ),
  family_relationships AS (
    SELECT 
      df.family_name,
      pr.parent_id, pr.parent_name, pr.parent_account,
      pr.child_id, pr.child_name, pr.child_account,
      pr.relationship_type, pr.confidence_score, pr.relationship_evidence
    FROM discovered_families df
    CROSS JOIN LATERAL map_parent_child_relationships(df.family_name) pr
  ),
  family_trees_built AS (
    -- Build hierarchical tree structures
    SELECT 
      fr.family_name,
      COUNT(DISTINCT CASE WHEN pr.parent_id IS NOT NULL THEN pr.parent_id END) as total_members,
      COUNT(DISTINCT CASE WHEN pr.parent_account IS NOT NULL THEN pr.parent_account END) as total_accounts,
      COUNT(DISTINCT CASE WHEN pr.parent_account != pr.child_account THEN 1 END) as cross_account_connections,
      -- Calculate tree depth
      MAX(
        CASE 
          WHEN pr.relationship_type = 'grandparent' THEN 3
          WHEN pr.relationship_type = 'parent' THEN 2
          WHEN pr.relationship_type = 'sibling' THEN 1
          ELSE 0
        END
      ) as tree_depth,
      AVG(pr.confidence_score)::integer as confidence_score,
      -- Build JSON tree structure
      jsonb_build_object(
        'family_name', fr.family_name,
        'root_members', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', pr.parent_id,
              'name', pr.parent_name,
              'account', pr.parent_account,
              'children', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', child_pr.child_id,
                    'name', child_pr.child_name,
                    'account', child_pr.child_account,
                    'relationship', child_pr.relationship_type,
                    'confidence', child_pr.confidence_score
                  )
                )
                FROM family_relationships child_pr
                WHERE child_pr.parent_id = pr.parent_id
              )
            )
          )
          FROM family_relationships pr
          WHERE pr.relationship_type IN ('parent', 'grandparent')
          GROUP BY pr.parent_id
        ),
        'statistics', jsonb_build_object(
          'total_members', COUNT(DISTINCT pr.parent_id),
          'total_accounts', COUNT(DISTINCT CASE WHEN pr.parent_account IS NOT NULL THEN pr.parent_account END),
          'cross_account_connections', COUNT(DISTINCT CASE WHEN pr.parent_account != pr.child_account THEN 1 END),
          'average_confidence', AVG(pr.confidence_score)
        )
      ) as tree_structure
    FROM family_relationships fr
    GROUP BY fr.family_name
  )
  SELECT 
    ftb.family_name,
    ftb.total_members,
    ftb.total_accounts,
    ftb.cross_account_connections,
    ftb.tree_depth,
    ftb.confidence_score,
    ftb.tree_structure
  FROM family_trees_built ftb
  ORDER BY ftb.confidence_score DESC, ftb.cross_account_connections DESC, ftb.total_members DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Real-time family discovery trigger
CREATE OR REPLACE FUNCTION trigger_family_discovery()
RETURNS TRIGGER AS $$
BEGIN
  -- When new person is added or updated, check for family connections
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    -- Log potential family discoveries
    INSERT INTO account_discovery_log (
      discovered_by,
      discovered_account,
      discovery_method,
      confidence_score,
      metadata
    ) SELECT 
      NEW.user_id,
      au.id,
      'automatic_detection',
      CASE 
        WHEN NEW.last_name IS NOT NULL THEN 70
        ELSE 30
      END,
      jsonb_build_object(
        'trigger', TG_OP,
        'person_id', NEW.id,
        'family_name', NEW.last_name,
        'timestamp', NOW()
      )
    FROM auth.users au
    WHERE au.email = NEW.first_name || '.' || NEW.last_name || '@family.com'
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS family_discovery_trigger ON persons;
CREATE TRIGGER family_discovery_trigger
  AFTER INSERT OR UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION trigger_family_discovery();

-- 6. Family tree validation function
CREATE OR REPLACE FUNCTION validate_family_tree_integrity(
  family_name_param TEXT
) RETURNS TABLE (
  validation_type TEXT,
  status TEXT,
  issues_found INTEGER,
  recommendations JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH family_analysis AS (
    SELECT 
      p.id, p.first_name, p.last_name, p.birthday, p.user_id,
      fc.relationship_type, fc.confidence_score
    FROM persons p
    LEFT JOIN family_connections fc ON (
      fc.person_id = p.id OR fc.related_person_id = p.id
    )
    WHERE p.last_name = family_name_param
  ),
  validation_checks AS (
    -- Check for various integrity issues
    SELECT 
      'orphaned_members' as validation_type,
      CASE 
        WHEN COUNT(*) FILTER (WHERE fc.id IS NULL) > 0 THEN 'warning'
        ELSE 'ok'
      END as status,
      COUNT(*) FILTER (WHERE fc.id IS NULL) as issues_found,
      jsonb_build_array(
        'Found ' || COUNT(*) FILTER (WHERE fc.id IS NULL) || ' members without family connections'
      ) as recommendations
    FROM family_analysis p
    GROUP BY p.last_name
    
    UNION ALL
    
    SELECT 
      'circular_relationships' as validation_type,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM family_connections fc1
          JOIN family_connections fc2 ON fc1.related_person_id = fc2.person_id
          WHERE fc1.person_id = fc2.related_person_id
        ) THEN 'error'
        ELSE 'ok'
      END as status,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM family_connections fc1
          JOIN family_connections fc2 ON fc1.related_person_id = fc2.person_id
          WHERE fc1.person_id = fc2.related_person_id
        ) THEN 1
        ELSE 0
      END as issues_found,
      jsonb_build_array(
        'Circular reference detected in family relationships'
      ) as recommendations
    FROM family_analysis p
    GROUP BY p.last_name
    
    UNION ALL
    
    SELECT 
      'age_inconsistencies' as validation_type,
      CASE 
        WHEN COUNT(*) FILTER (WHERE fc.confidence_score < 50) > 0 THEN 'warning'
        ELSE 'ok'
      END as status,
      COUNT(*) FILTER (WHERE fc.confidence_score < 50) as issues_found,
      jsonb_build_array(
        'Found ' || COUNT(*) FILTER (WHERE fc.confidence_score < 50) || ' low-confidence relationships'
      ) as recommendations
    FROM family_analysis p
    LEFT JOIN family_connections fc ON (
      fc.person_id = p.id OR fc.related_person_id = p.id
    )
    GROUP BY p.last_name
  )
  SELECT 
    vc.validation_type,
    vc.status,
    vc.issues_found,
    vc.recommendations
  FROM validation_checks vc
  ORDER BY 
    CASE 
      WHEN vc.status = 'error' THEN 1
      WHEN vc.status = 'warning' THEN 2
      ELSE 3
    END;
END;
$$ LANGUAGE plpgsql;
