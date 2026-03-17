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

-- Admins can do everything
CREATE POLICY "Admins can do everything on events" 
ON events 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Approved users can SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Approved users can do everything on events" 
ON events 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
);

-- UPDATE PROFILES RLS
-- Drop old policies if modifying
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate policies for profiles
-- 1. Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Admins can update all profiles (needed to change status)
CREATE POLICY "Admins can update all profiles" 
ON profiles 
FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Users can update their own profile (e.g. name)
CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
