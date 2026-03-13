-- Add position and price columns to mooring_types
ALTER TABLE mooring_types ADD COLUMN position TEXT;
ALTER TABLE mooring_types ADD COLUMN price DECIMAL;

-- Update existing records if any (optional, but good practice if you want to avoid NULLs)
-- UPDATE mooring_types SET position = 'Molo A', price = 0 WHERE position IS NULL;
