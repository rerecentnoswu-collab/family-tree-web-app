-- Genealogy App Database Setup
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  birthday DATE NOT NULL,
  birthplace TEXT NOT NULL,
  mother_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  father_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_persons_mother_id ON persons(mother_id);
CREATE INDEX IF NOT EXISTS idx_persons_father_id ON persons(father_id);
CREATE INDEX IF NOT EXISTS idx_persons_last_name ON persons(last_name);
CREATE INDEX IF NOT EXISTS idx_persons_birthday ON persons(birthday);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_persons_updated_at ON persons;
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for development/prototyping)
-- WARNING: These policies allow full public access. For production, implement proper authentication.

-- Policy for SELECT (read)
CREATE POLICY "Allow public read access" ON persons
  FOR SELECT
  USING (true);

-- Policy for INSERT (create)
CREATE POLICY "Allow public insert access" ON persons
  FOR INSERT
  WITH CHECK (true);

-- Policy for UPDATE (modify)
CREATE POLICY "Allow public update access" ON persons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy for DELETE (remove)
CREATE POLICY "Allow public delete access" ON persons
  FOR DELETE
  USING (true);

-- Insert sample data (optional)
-- Uncomment the lines below if you want to start with sample family data

/*
INSERT INTO persons (first_name, middle_name, last_name, birthday, birthplace, gender)
VALUES 
  ('John', 'Michael', 'Smith', '1950-05-15', 'New York, USA', 'male'),
  ('Mary', 'Elizabeth', 'Johnson', '1952-08-22', 'Boston, USA', 'female'),
  ('Robert', 'James', 'Smith', '1975-03-10', 'New York, USA', 'male'),
  ('Sarah', 'Anne', 'Smith', '1977-11-30', 'New York, USA', 'female');

-- Set up parent relationships for sample data
UPDATE persons SET mother_id = (SELECT id FROM persons WHERE first_name = 'Mary' AND last_name = 'Johnson'),
                   father_id = (SELECT id FROM persons WHERE first_name = 'John' AND last_name = 'Smith')
WHERE first_name IN ('Robert', 'Sarah') AND last_name = 'Smith';
*/
