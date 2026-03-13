-- Junction table for multiple preferred mooring types per request
CREATE TABLE request_preferred_types (
    request_id UUID REFERENCES mooring_requests(id) ON DELETE CASCADE,
    type_id BIGINT REFERENCES mooring_types(id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, type_id)
);

-- RLS for preferred types
ALTER TABLE request_preferred_types ENABLE ROW LEVEL SECURITY;

-- Users can view their own selections
CREATE POLICY "Users can view their own preferred types" ON request_preferred_types
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mooring_requests r
        WHERE r.id = request_id AND r.user_id = auth.uid()
    )
);

-- Users can insert their own selections
CREATE POLICY "Users can insert their own preferred types" ON request_preferred_types
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM mooring_requests r
        WHERE r.id = request_id AND r.user_id = auth.uid()
    )
);

-- Admins can view everything
CREATE POLICY "Admins can view all preferred types" ON request_preferred_types
FOR SELECT USING (public.is_admin());
