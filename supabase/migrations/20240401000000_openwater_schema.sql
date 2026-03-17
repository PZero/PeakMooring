-- Drop old tables if they exist
DROP TABLE IF EXISTS mooring_requests CASCADE;
DROP TABLE IF EXISTS mooring_types CASCADE;
DROP TABLE IF EXISTS request_preferred_types CASCADE;

-- Add status column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    organization TEXT NOT NULL CHECK (organization IN ('FIN', 'UISP', 'ALTRO')),
    registration_deadline DATE NOT NULL,
    event_link TEXT,
    distances TEXT,
    notes TEXT,
    results_link TEXT,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS POLICIES FOR EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on events" ON events;
-- Admins can do everything
CREATE POLICY "Admins can do everything on events" 
ON events 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

DROP POLICY IF EXISTS "Approved users can do everything on events" ON events;
-- Approved users can SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Approved users can do everything on events" 
ON events 
FOR ALL 
TO authenticated 
USING (
  (SELECT status FROM profiles WHERE id = auth.uid() LIMIT 1) = 'approved'
);

-- UPDATE PROFILES RLS
-- Drop old policies if modifying
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate policies for profiles
-- 1. Everyone authenticated can view all profiles (avoids recursion and allows checking created_by in events)
CREATE POLICY "Anyone can view profiles" 
ON profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Admins can update all profiles (using a non-recursive approach or targeted function if needed, but for simplicity we can check if the current user ID is the known admin email ID, or use a separate admin table. Since email isn't easily accessible in RLS without joining auth.users which requires elevated privileges, we'll use a Subquery that limits recursion by only checking the role of the auth.uid())
CREATE POLICY "Admins can update all profiles" 
ON profiles 
FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- 3. Users can update their own profile (e.g. name)
CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
