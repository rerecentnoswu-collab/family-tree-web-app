-- Create Family Connections for Centino Family
-- Step 1: Map parent-child relationships

-- First, get all Centino family members with their details
SELECT 
  id,
  first_name,
  last_name,
  birthday,
  user_id,
  EXTRACT(YEAR FROM birthday::date) as birth_year,
  ROW_NUMBER() OVER (PARTITION BY last_name ORDER BY birthday) as age_rank
FROM persons 
WHERE last_name = 'Centino' 
  AND user_id IS NOT NULL
ORDER BY birthday;

-- Step 2: Find potential parent-child relationships
WITH centino_members AS (
  SELECT 
    id, first_name, last_name, birthday, user_id,
    EXTRACT(YEAR FROM birthday::date) as birth_year
  FROM persons 
  WHERE last_name = 'Centino' 
    AND user_id IS NOT NULL
),
potential_relationships AS (
  SELECT 
    p1.id as parent_id,
    p1.first_name || ' ' || p1.last_name as parent_name,
    p1.user_id as parent_account,
    p2.id as child_id,
    p2.first_name || ' ' || p2.last_name as child_name,
    p2.user_id as child_account,
    CASE 
      WHEN p1.birth_year - p2.birth_year >= 15 AND p1.birth_year - p2.birth_year <= 50 THEN 'parent'
      WHEN ABS(p1.birth_year - p2.birth_year) < 15 THEN 'sibling'
      WHEN p1.birth_year - p2.birth_year >= 30 AND p1.birth_year - p2.birth_year <= 70 THEN 'grandparent'
      ELSE 'unknown'
    END as relationship_type,
    CASE 
      WHEN p1.birth_year - p2.birth_year BETWEEN 18 AND 45 THEN 95
      WHEN p1.birth_year - p2.birth_year BETWEEN 15 AND 25 THEN 85
      WHEN ABS(p1.birth_year - p2.birth_year) < 10 THEN 75
      WHEN p1.birth_year - p2.birth_year BETWEEN 30 AND 55 THEN 80
      ELSE 40
    END as confidence_score,
    CASE 
      WHEN p1.user_id != p2.user_id THEN 'cross-account'
      ELSE 'same-account'
    END as connection_type
  FROM centino_members p1
  JOIN centino_members p2 ON (
    p1.id != p2.id 
    AND p1.last_name = p2.last_name
    AND (
      (p1.birth_year - p2.birth_year BETWEEN 15 AND 50) OR
      (ABS(p1.birth_year - p2.birth_year) < 15) OR
      (p1.birth_year - p2.birth_year BETWEEN 30 AND 70)
    )
  )
)
SELECT 
  parent_id,
  parent_name,
  parent_account,
  child_id,
  child_name,
  child_account,
  relationship_type,
  confidence_score,
  connection_type
FROM potential_relationships
WHERE confidence_score >= 60
ORDER BY confidence_score DESC, connection_type, parent_name, child_name;
