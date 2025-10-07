-- Create a function to check if a party is active
CREATE OR REPLACE FUNCTION is_party_active(party_id text) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM parties
    WHERE id = party_id AND status IN ('WAITING', 'ACTIVE')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a unique partial index using the function
CREATE UNIQUE INDEX "unique_user_active_party"
ON "party_players"("user_id")
WHERE is_party_active(party_id);