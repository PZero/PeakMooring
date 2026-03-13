-- Final Fix for RLS Recursion and Permissions
-- 1. Ensure fnicora@gmail.com is admin in the database
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'fnicora@gmail.com';

-- 2. Security definer function to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Robust Policies for Mooring Types
-- Use both USING (for select/delete) and WITH CHECK (for insert/update)
DROP POLICY IF EXISTS "Admins can manage mooring types" ON mooring_types;
CREATE POLICY "Admins can manage mooring types" ON mooring_types 
FOR ALL TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Robust Policies for Mooring Requests
DROP POLICY IF EXISTS "Admins can view and update all requests" ON mooring_requests;
CREATE POLICY "Admins can view and update all requests" ON mooring_requests 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Fix Profiles Select Policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (public.is_admin());
