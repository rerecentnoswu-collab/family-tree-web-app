# Cross-Account Family Setup for rerecentnoswu-collab

## Account Information
- **Project**: `rerecentnoswu-collab`
- **Primary Account**: `rere.centno.swu@phinmaed.com`
- **Secondary Account**: `kensite24@gmail.com`

## Quick Setup Steps

### 1. Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select the `rerecentnoswu-collab` project
3. Go to **SQL Editor**

### 2. Run the Setup Script
Execute the SQL script at `scripts/setup-cross-account-correct.sql` step by step:

**Step 1**: Check current family members
```sql
SELECT id, first_name, last_name, email, user_id, birthday, created_at FROM persons ORDER BY last_name, first_name;
```

**Step 2**: Get user IDs
```sql
SELECT id, email, created_at FROM auth.users WHERE email IN ('rere.centno.swu@phinmaed.com', 'kensite24@gmail.com');
```

**Step 3**: Get person IDs for Centino family
```sql
SELECT id, first_name, last_name, birthday FROM persons WHERE last_name = 'Centino' ORDER BY birthday DESC;
```

**Step 4**: Replace placeholder IDs in the script and run the INSERT statements

### 3. Expected Results
After setup, you should see:
- "Found X family groups across 2 accounts" (instead of 1)
- Cross-account family members in the family tree
- All 4 family members visible from both accounts

### 4. Test the Setup
1. Log in with `rere.centno.swu@phinmaed.com`
2. Go to `/tree` route
3. Check console for cross-account discovery messages
4. Log out and log in with `kensite24@gmail.com`
5. Verify you see the same family members

## Family Relationships
Based on ages, the suggested relationships are:
- Celestino (76) & Andressa (70) as parents/grandparents
- Reycel (46) as their child
- John Marc (29) as Reycel's child

This creates a 3-generation family tree that will be visible across both accounts.
