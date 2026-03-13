-- Add offered_type_id to track the specific mooring being proposed
ALTER TABLE mooring_requests 
ADD COLUMN offered_type_id BIGINT REFERENCES mooring_types(id);
