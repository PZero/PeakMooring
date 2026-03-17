-- Add new columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- Add is_admin column to profiles for delegation
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add email column to profiles to show email in the table view
-- Supabase Auth emails are not readable by default from the profiles table, 
-- but we need it since the user logs via OAuth/Magic Link and we want to see who last edited something.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Trigger to copy email from auth.users to public.profiles on insert
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status, is_admin, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user', 'pending', false, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- IMPORTANT: We need to update existing policies to use is_admin instead of role = 'admin'
-- And also allow users to read the new email column

-- Events policies: drop and replace with is_admin check
DROP POLICY IF EXISTS "Admins can do everything on events" ON events;
CREATE POLICY "Admins can do everything on events" 
ON events 
FOR ALL 
TO authenticated 
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid() LIMIT 1) = true
  OR auth.jwt()->>'email' = 'fnicora@gmail.com'
);

-- Profiles policies: update Admin policy to use is_admin
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" 
ON profiles 
FOR UPDATE
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid() LIMIT 1) = true
  OR auth.jwt()->>'email' = 'fnicora@gmail.com'
);

-- Ensure the main admin account is correctly set up with the new flags
UPDATE public.profiles 
SET is_admin = true, status = 'approved'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'fnicora@gmail.com');
