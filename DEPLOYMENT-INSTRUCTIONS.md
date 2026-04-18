# Family Discovery System Deployment Instructions

## Overview
This document provides step-by-step instructions for deploying the intelligent family discovery system to production.

## Prerequisites
- Access to Supabase SQL Editor
- Admin permissions on the Supabase project
- Existing family data in the `persons` table

## Deployment Steps

### Step 1: Run Production Deployment Script
1. Open Supabase SQL Editor
2. Copy and paste the contents of `scripts/production-deployment.sql`
3. Execute the script

### Step 2: Verify Deployment
After running the deployment script, verify it worked correctly:

```sql
-- Test family discovery
SELECT * FROM discover_family_trees();

-- Test relationship mapping
SELECT * FROM map_family_relationships('Centino');

-- Get network statistics
SELECT * FROM get_family_network_stats();
```

### Step 3: Create Family Connections
Run the automatic connection creation:

```sql
-- Create family connections with 70+ confidence
SELECT * FROM create_family_connections('Centino', 70);
```

## Production Functions Available

### 1. `discover_family_trees()`
- Discovers family groups across all accounts
- Returns family statistics and confidence scores
- Includes evidence for each discovery

### 2. `map_family_relationships(family_name)`
- Maps parent-child relationships within families
- Uses intelligent age-based algorithms
- Provides confidence scoring and evidence

### 3. `get_family_network_stats()`
- Returns comprehensive network statistics
- Includes cross-account connection metrics
- Provides detailed analytics

### 4. `create_family_connections(family_name, min_confidence)`
- Automatically creates family connections
- Only includes high-confidence relationships
- Returns creation statistics

## Expected Results

After deployment, you should see:
- **Centino Family**: 6 members across 2 accounts
- **Cross-Account Connections**: Multiple relationships between accounts
- **High Confidence**: Relationships with 70+ confidence scores
- **Intelligent Mapping**: Parent-child, sibling, grandparent relationships

## Monitoring

Use these queries to monitor the system:

```sql
-- Check system health
SELECT * FROM get_family_network_stats();

-- Verify cross-account functionality
SELECT 
  COUNT(*) as total_connections,
  COUNT(DISTINCT CASE WHEN p1.user_id != p2.user_id THEN fc.id END) as cross_account,
  ROUND(AVG(fc.confidence_score), 2) as avg_confidence
FROM family_connections fc
JOIN persons p1 ON fc.person_id = p1.id
JOIN persons p2 ON fc.related_person_id = p2.id;
```

## Troubleshooting

If issues occur:
1. Check that all functions deployed successfully
2. Verify existing data has valid user_id values
3. Ensure family members have valid birth dates
4. Check for any SQL constraint violations

## Next Steps

After deployment:
1. Test the web application with multiple accounts
2. Verify cross-account family discovery works
3. Monitor system performance and accuracy
4. Add more family accounts to test scalability

## Support

For issues or questions:
- Check the deployment logs in Supabase
- Review the function definitions in the production script
- Test with individual functions before running the full system
