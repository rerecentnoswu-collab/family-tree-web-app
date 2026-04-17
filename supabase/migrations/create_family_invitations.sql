-- Create family_invitations table for cross-account family connections
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  family_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'sibling', 'spouse')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create indexes for performance
CREATE INDEX idx_family_invitations_invited_email ON family_invitations(invited_email);
CREATE INDEX idx_family_invitations_status ON family_invitations(status);
CREATE INDEX idx_family_invitations_inviter_user_id ON family_invitations(inviter_user_id);
CREATE INDEX idx_family_invitations_expires_at ON family_invitations(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_family_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER family_invitations_updated_at
  BEFORE UPDATE ON family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_family_invitations_updated_at();

-- Row Level Security
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invitations sent to their email"
  ON family_invitations FOR SELECT
  USING (invited_email = auth.email() OR inviter_user_id = auth.uid());

CREATE POLICY "Users can create invitations"
  ON family_invitations FOR INSERT
  WITH CHECK (inviter_user_id = auth.uid());

CREATE POLICY "Users can update invitations they sent"
  ON family_invitations FOR UPDATE
  USING (inviter_user_id = auth.uid())
  WITH CHECK (inviter_user_id = auth.uid());

CREATE POLICY "Users can delete invitations they sent"
  ON family_invitations FOR DELETE
  USING (inviter_user_id = auth.uid());

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM family_invitations 
  WHERE expires_at < NOW() 
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up expired invitations (optional)
-- CREATE TRIGGER auto_cleanup_expired_invitations
--   AFTER INSERT ON family_invitations
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION cleanup_expired_invitations();
