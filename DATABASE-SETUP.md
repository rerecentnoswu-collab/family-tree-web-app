# Genealogy App - Database Setup Instructions

Your Supabase connection is established, but the database needs to be initialized with the required tables and policies.

## Quick Setup Steps

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `mweatxonqtookmnluwnl`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run the Setup SQL**
   - Copy all the contents from `/supabase-setup.sql` in this project
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify the Setup**
   - Go to "Table Editor" in the left sidebar
   - You should see a table named `persons`
   - The app will now be able to store and retrieve family data!

## What the Setup SQL Does

The setup script creates:
- ✅ A `persons` table with all required fields
- ✅ Indexes for fast parent lookups
- ✅ Row Level Security (RLS) policies for public access
- ✅ Automatic timestamp updates
- ✅ Foreign key relationships for parent-child connections

## Security Note

⚠️ **Important**: The current setup allows public read/write access for prototyping purposes. For production use with real family data, you should:
- Implement proper user authentication
- Update RLS policies to restrict access based on user identity
- Consider data encryption for sensitive information

## Testing the App

Once the SQL setup is complete:
1. Refresh this page
2. Click "Add Family Member" to create your first person
3. Use the "Find Parents" and "Auto-Assign" features to test the AI matching!

## Troubleshooting

**Still getting errors after running SQL?**
- Make sure you clicked "Run" in the SQL Editor
- Check that the table was created in the Table Editor
- Verify there are no error messages in the SQL Editor output

**Need help?**
- Check the Supabase logs in your dashboard
- Review the browser console for detailed error messages
