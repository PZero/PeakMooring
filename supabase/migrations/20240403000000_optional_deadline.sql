-- Make registration_deadline optional
ALTER TABLE events ALTER COLUMN registration_deadline DROP NOT NULL;
