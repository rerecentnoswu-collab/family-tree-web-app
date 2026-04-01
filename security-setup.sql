-- Step 1: Add user_id column to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 2: Drop any existing insecure policies
DROP POLICY IF EXISTS "Allow public read access" ON persons;
DROP POLICY IF EXISTS "Allow public insert access" ON persons;
DROP POLICY IF EXISTS "Allow public update access" ON persons;
DROP POLICY IF EXISTS "Allow public delete access" ON persons;

-- Step 3: Enable RLS on the table
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Step 4: Create secure policies (users can only see their own data)
CREATE POLICY "Users can read own data"
  ON persons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON persons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON persons FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
