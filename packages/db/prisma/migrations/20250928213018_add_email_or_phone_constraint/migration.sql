-- Add check constraint to ensure at least one of email or phone_number is provided
ALTER TABLE "users"
ADD CONSTRAINT "users_email_or_phone_check"
CHECK (email IS NOT NULL OR phone_number IS NOT NULL);