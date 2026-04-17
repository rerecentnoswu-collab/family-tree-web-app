-- Create persons table for family members
CREATE TABLE IF NOT EXISTS persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  birthday DATE,
  birthplace TEXT,
  occupation TEXT,
  mother_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  father_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  death_date DATE,
  death_place TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_persons_user_id ON persons(user_id);
CREATE INDEX idx_persons_last_name ON persons(last_name);
CREATE INDEX idx_persons_mother_id ON persons(mother_id);
CREATE INDEX idx_persons_father_id ON persons(father_id);
CREATE INDEX idx_persons_birthday ON persons(birthday);
CREATE INDEX idx_persons_created_at ON persons(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_persons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_persons_updated_at();

-- Row Level Security
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own persons"
  ON persons FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own persons"
  ON persons FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own persons"
  ON persons FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own persons"
  ON persons FOR DELETE
  USING (user_id = auth.uid());

-- Function to prevent duplicate entries for same user
CREATE OR REPLACE FUNCTION prevent_duplicate_persons()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for existing person with same name and birthday for this user
  IF EXISTS (
    SELECT 1 FROM persons 
    WHERE user_id = NEW.user_id 
      AND first_name ILIKE NEW.first_name 
      AND last_name ILIKE NEW.last_name 
      AND (birthday = NEW.birthday OR (birthday IS NULL AND NEW.birthday IS NULL))
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate person entry: A person with the same name and birthday already exists for this user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
CREATE TRIGGER prevent_duplicate_persons_trigger
  BEFORE INSERT OR UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_persons();
