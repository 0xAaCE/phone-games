-- Drop the partial unique index
DROP INDEX IF EXISTS unique_user_active_party;

-- Drop the function since we no longer need it
DROP FUNCTION IF EXISTS is_party_active(text);

-- Add a trigger-based constraint instead
-- First, create a function that checks for duplicate active parties
CREATE OR REPLACE FUNCTION check_user_active_party()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM party_players pp
    JOIN parties p ON pp.party_id = p.id
    WHERE pp.user_id = NEW.user_id
      AND pp.id != COALESCE(NEW.id, '')
      AND p.status IN ('WAITING', 'ACTIVE')
  ) THEN
    RAISE EXCEPTION 'User already has an active party';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER enforce_single_active_party
  BEFORE INSERT OR UPDATE ON party_players
  FOR EACH ROW
  EXECUTE FUNCTION check_user_active_party();