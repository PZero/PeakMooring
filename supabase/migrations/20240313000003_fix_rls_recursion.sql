-- Fix for Infinite Recursion in RLS policies
-- 1. Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage mooring types" ON mooring_types;
DROP POLICY IF EXISTS "Admins can view and update all requests" ON mooring_requests;

-- 3. Re-create policies using the secure check
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage mooring types" ON mooring_types 
FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view and update all requests" ON mooring_requests 
FOR ALL USING (public.is_admin());
