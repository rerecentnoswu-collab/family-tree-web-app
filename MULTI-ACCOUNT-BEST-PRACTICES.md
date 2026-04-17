# Multi-Account Family Network: Best Practices Guide

## Overview
This guide explains how to scale your family tree from 2 accounts to multiple accounts following enterprise-grade best practices for security, scalability, and maintainability.

## Architecture Overview

### Core Components
1. **Family Groups** - Centralized family management
2. **Account Memberships** - Role-based access control
3. **Automated Discovery** - Smart account detection
4. **Invitation System** - Secure onboarding
5. **Relationship Suggestions** - AI-powered matching

## Adding a Third Account: Step-by-Step

### Step 1: Initialize Multi-Account Architecture

```sql
-- Run the multi-account architecture setup
-- This creates the enhanced tables and policies
```

### Step 2: Discover Potential Accounts

```sql
-- Method 1: Email-based discovery
SELECT * FROM discover_family_accounts(
  search_email => '@familydomain.com',  -- Family email domain
  search_name => 'Centino',              -- Family name
  confidence_threshold => 70
);

-- Method 2: Name-based discovery  
SELECT * FROM discover_family_accounts(
  search_name => 'Centino',
  confidence_threshold => 60
);
```

### Step 3: Create Family Invitation

```sql
-- Create invitation for new account
SELECT create_family_invitation(
  family_group_id => (SELECT id FROM family_groups WHERE group_name = 'Centino Family'),
  invited_email => 'newfamilymember@gmail.com',
  invited_by => (SELECT id FROM auth.users WHERE email = 'rere.centno.swu@phinmaed.com'),
  relationship_suggestions => jsonb_build_object(
    'likely_relationship', 'sibling',
    'confidence', 75,
    'evidence', jsonb_build_array('same_last_name', 'age_proximity')
  )
);
```

### Step 4: Automated Relationship Matching

```sql
-- Once account accepts invitation, run relationship suggestions
SELECT * FROM suggest_cross_account_relationships(
  new_account_id => (SELECT id FROM auth.users WHERE email = 'newfamilymember@gmail.com'),
  confidence_threshold => 60
);
```

## Best Practices

### 1. Security & Permissions
- **Role-Based Access**: Admin, Editor, Viewer roles
- **Row-Level Security**: All tables have RLS policies
- **Audit Trail**: All actions logged in `account_discovery_log`

### 2. Scalability
- **Family Groups**: Support unlimited accounts per family
- **Hierarchical Permissions**: Admins can manage other admins
- **Performance Optimized**: Indexed queries and efficient joins

### 3. Data Quality
- **Confidence Scoring**: All suggestions have confidence levels
- **Evidence Tracking**: AI reasoning stored for transparency
- **Health Monitoring**: Account health scores and recommendations

### 4. User Experience
- **Smart Invitations**: Context-aware relationship suggestions
- **Automated Discovery**: Reduces manual setup
- **Progressive Onboarding**: Start with basic, add complexity gradually

## Implementation Examples

### Example 1: Adding a Sibling Account
```sql
-- 1. Discover sibling account
SELECT * FROM discover_family_accounts(
  search_name => 'Centino',
  confidence_threshold => 70
);

-- 2. Create targeted invitation
SELECT create_family_invitation(
  family_group_id => 'centino-family-uuid',
  invited_email => 'sibling@gmail.com',
  invited_by => 'admin-user-uuid',
  relationship_suggestions => jsonb_build_object(
    'likely_relationship', 'sibling',
    'confidence', 85,
    'evidence', jsonb_build_array('same_last_name', 'similar_age')
  )
);
```

### Example 2: Adding a Parent Account
```sql
-- 1. Create parent invitation with higher confidence
SELECT create_family_invitation(
  family_group_id => 'centino-family-uuid',
  invited_email => 'parent@gmail.com',
  invited_by => 'admin-user-uuid',
  relationship_suggestions => jsonb_build_object(
    'likely_relationship', 'parent',
    'confidence', 90,
    'evidence', jsonb_build_array('same_last_name', 'age_gap_appropriate')
  )
);
```

### Example 3: Bulk Account Discovery
```sql
-- Discover all potential family accounts
WITH potential_accounts AS (
  SELECT * FROM discover_family_accounts(confidence_threshold => 60)
)
SELECT 
  suggested_email,
  confidence_score,
  discovery_method,
  CASE 
    WHEN confidence_score >= 80 THEN 'High Priority'
    WHEN confidence_score >= 60 THEN 'Medium Priority'
    ELSE 'Low Priority'
  END as priority
FROM potential_accounts
ORDER BY confidence_score DESC;
```

## Monitoring & Maintenance

### Account Health Dashboard
```sql
-- Check overall family network health
SELECT * FROM check_account_health();

-- Monitor invitation status
SELECT 
  fi.invited_email,
  fi.status,
  fi.created_at,
  fi.expires_at,
  CASE 
    WHEN fi.expires_at < NOW() THEN 'Expired'
    WHEN fi.status = 'pending' AND fi.expires_at > NOW() THEN 'Pending'
    ELSE fi.status
  END as current_status
FROM family_invitations fi
JOIN family_groups fg ON fi.family_group_id = fg.id
WHERE fg.group_name = 'Centino Family';
```

### Performance Metrics
```sql
-- Cross-account connection statistics
SELECT 
  COUNT(DISTINCT fam.user_id) as total_accounts,
  COUNT(DISTINCT p.id) as total_persons,
  COUNT(DISTINCT fc.id) as total_connections,
  COUNT(DISTINCT CASE WHEN p1.user_id != p2.user_id THEN fc.id END) as cross_account_connections,
  ROUND(
    COUNT(DISTINCT CASE WHEN p1.user_id != p2.user_id THEN fc.id END) * 100.0 / 
    NULLIF(COUNT(DISTINCT fc.id), 0), 2
  ) as cross_account_percentage
FROM family_account_memberships fam
JOIN persons p ON fam.user_id = p.user_id
LEFT JOIN family_connections fc ON fc.person_id = p.id
LEFT JOIN persons p2 ON fc.related_person_id = p2.id
WHERE fam.status = 'active';
```

## Advanced Features

### 1. Automated Relationship Learning
The system learns from accepted/rejected suggestions to improve future matching accuracy.

### 2. Family Tree Merging
When accounts have overlapping family members, the system can intelligently merge trees.

### 3. Privacy Controls
Granular privacy settings allow users to control what information is shared across accounts.

### 4. Notification System
Automated notifications for invitations, relationship suggestions, and family updates.

## Rollout Strategy

### Phase 1: Foundation
- Set up multi-account architecture
- Migrate existing 2-account setup
- Test basic functionality

### Phase 2: Discovery
- Implement automated discovery
- Add invitation system
- Test with 3rd account

### Phase 3: Intelligence
- Add AI-powered suggestions
- Implement health monitoring
- Create management dashboard

### Phase 4: Scale
- Support 10+ accounts
- Add advanced privacy controls
- Implement notification system

## Troubleshooting

### Common Issues
1. **Low Confidence Scores**: Adjust thresholds or provide more context
2. **Duplicate Accounts**: Use account merging tools
3. **Permission Issues**: Check RLS policies and role assignments
4. **Performance**: Add indexes on frequently queried columns

### Debug Queries
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename LIKE '%family%';

-- Check table indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename LIKE '%family%';

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM discover_family_accounts();
```

This architecture provides a solid foundation for scaling your family tree to support unlimited accounts while maintaining security, performance, and data quality.
