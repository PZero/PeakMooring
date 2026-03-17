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
  INSERT INTO public.profiles (id, first_name, last_name, role, status, is_admin, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    'user', 
    'pending', 
    false, 
    new.email
  );
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
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  OR auth.jwt()->>'email' = 'fnicora@gmail.com'
);

DROP POLICY IF EXISTS "Approved users can manage events" ON events;
CREATE POLICY "Approved users can manage events" 
ON events 
FOR ALL
TO authenticated 
USING (
  (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved'
)
WITH CHECK (
  (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved'
  AND (
    -- Approved users can do everything EXCEPT DELETE
    -- We'll explicitly handle DELETE in a separate policy or by splitting this one
    -- However, in Supabase, if ANY policy allows a DELETE, it happens.
    -- So we need to ensure DELETE is ONLY in the admin policy.
    true
  )
);

-- Refined: Explicitly split policies to ensure DELETE is ADMIN ONLY
DROP POLICY IF EXISTS "Approved users can do everything on events" ON events;
DROP POLICY IF EXISTS "Approved users can manage events" ON events;

CREATE POLICY "Approved users can view and edit events"
ON events
FOR ALL -- This includes SELECT, INSERT, UPDATE
TO authenticated
USING (
  (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved'
)
WITH CHECK (
  (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved'
);

-- We need to make sure the "FOR ALL" above doesn't allow DELETE for non-admins.
-- Actually, "FOR ALL" does allow DELETE. We should use specific actions.

DROP POLICY IF EXISTS "Approved users can view and edit events" ON events;

CREATE POLICY "Approved users can select events" ON events FOR SELECT TO authenticated USING ( (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved' );
CREATE POLICY "Approved users can insert events" ON events FOR INSERT TO authenticated WITH CHECK ( (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved' );
CREATE POLICY "Approved users can update events" ON events FOR UPDATE TO authenticated USING ( (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved' );
-- DELETE is intentionally missing here, so only the Admin ALL policy will permit it.


-- Profiles policies: update Admin policy to use is_admin
-- We use a simpler check: is the current user's entry in profiles marked as is_admin?
-- Note: Supabase RLS policies on the same table can sometimes cause recursion if not careful.
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" 
ON profiles 
FOR UPDATE
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  OR auth.jwt()->>'email' = 'fnicora@gmail.com'
);

UPDATE public.profiles 
SET is_admin = true, status = 'approved'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'fnicora@gmail.com');

-- Enable Realtime for the profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
