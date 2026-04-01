# Supabase Setup Guide

This genealogy app requires Supabase for database and backend functionality. Follow these steps to get it working.

## Option 1: Using Figma Make Settings (Recommended)

The easiest way to connect Supabase:

1. **Click the settings gear icon** in Figma Make
2. **Select "Connect Supabase"**
3. Follow the prompts to authenticate
4. The environment variables will be automatically configured

Once connected, proceed to the "Database Initialization" section below.

## Option 2: Manual Environment Variables

If you prefer manual setup:

### Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select (or create) your project
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://mweatxonqtookmnluwnl.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOi...`)

### Step 2: Create Environment File

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   VITE_SUPABASE_PROJECT_ID=your_project_id
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Restart the development server

## Database Initialization

After connecting Supabase, you need to create the database tables:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Setup SQL

1. Open `supabase-setup.sql` in this project
2. **Copy all contents** of the file
3. **Paste into the SQL Editor**
4. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`

### Step 3: Verify

After running the SQL:
1. Go to **Table Editor** in the left sidebar
2. You should see a table named **`persons`**
3. The table should have columns: id, first_name, middle_name, last_name, birthday, birthplace, mother_id, father_id, gender, created_at, updated_at

### Step 4: Test the App

1. Refresh the genealogy app
2. The error should be gone
3. Click **"Add Family Member"** to create your first person
4. Test the AI parent matching features!

## Troubleshooting

### "Supabase Not Connected" Error

**Check:**
- Environment variables are set correctly
- You've restarted the dev server after adding `.env.local`
- The project ID and anon key are correct (no extra spaces)

**Console should show:**
```
✓ Supabase configuration loaded
```

If you see errors, check the browser console for details.

### "Invalid API Key" Error

**Causes:**
- Anon key is incorrect or expired
- Anon key has extra spaces or line breaks
- Using wrong key type (use "anon" not "service_role")

**Fix:**
- Re-copy the anon key from Supabase dashboard
- Make sure to copy the complete key
- The key should start with `eyJhbGciOi`

### "Database Setup Required" Message

**This means:**
- Supabase is connected ✓
- But database tables haven't been created yet

**Fix:**
- Follow the "Database Initialization" section above
- Run the SQL from `supabase-setup.sql`

### Permission Denied / 401 / 403 Errors

**Causes:**
- Row Level Security (RLS) policies not set up
- SQL script didn't run completely

**Fix:**
- Re-run the `supabase-setup.sql` script
- Make sure all sections executed successfully
- Check for any red error messages in SQL Editor

### Can't Insert Data

**Causes:**
- RLS policies not configured
- Anon key doesn't have permissions

**Fix:**
- The SQL script includes RLS policies
- Make sure the entire script ran successfully
- Check SQL Editor output for errors

## Security Notes

⚠️ **Important for Production Use:**

The current setup uses **public RLS policies** that allow anyone to read/write data. This is fine for:
- ✓ Prototyping and development
- ✓ Learning and testing
- ✓ Non-sensitive demo data

For production with real family data, you should:
- ✗ **Do NOT use** the current RLS policies
- ✓ Implement user authentication (Supabase Auth)
- ✓ Update RLS policies to restrict access by user
- ✓ Consider data encryption for sensitive PII
- ✓ Implement proper audit logging
- ✓ Add backup and recovery procedures

## Need More Help?

1. **Check browser console** for detailed error messages
2. **Check Supabase logs** in your dashboard (Logs section)
3. **Review the SQL output** when running setup script
4. **Make sure** you're using the correct project

## What Gets Created

The `supabase-setup.sql` script creates:

| Component | Purpose |
|-----------|---------|
| `persons` table | Stores all family member data |
| Indexes | Fast lookups for parent relationships |
| Foreign keys | Ensures data integrity for family connections |
| RLS policies | Controls who can access data |
| Triggers | Automatically updates timestamps |

## Sample Data (Optional)

The SQL file includes commented-out sample data. To add it:

1. Open `supabase-setup.sql`
2. Find the `/* INSERT INTO persons ...` section
3. Uncomment those lines (remove `/*` and `*/`)
4. Re-run the SQL script

This will add a sample family with parent-child relationships for testing.
