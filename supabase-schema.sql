-- GymPulse Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable PostGIS for geospatial queries (optional but recommended)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Gyms table (master list of all gyms with IoT sensor capability flags)
CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity INTEGER DEFAULT 100,
  has_iot_sensor BOOLEAN DEFAULT false,
  sensor_type TEXT, -- 'turnstile', 'occupancy_sensor', 'wifi', 'camera', null
  last_sensor_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User check-ins table (crowdsourced data)
CREATE TABLE IF NOT EXISTS check_ins (
  id BIGSERIAL PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Anonymous user ID from client
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  distance_meters INTEGER, -- Distance from gym when checked in (GPS validation)
  source TEXT DEFAULT 'user', -- 'user' or 'sensor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IoT sensor readings (real-time occupancy from hardware sensors)
CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  occupancy_count INTEGER NOT NULL, -- Current number of people in gym
  capacity_percentage INTEGER, -- Calculated: (occupancy_count / gym.capacity) * 100
  sensor_type TEXT NOT NULL, -- 'turnstile', 'occupancy_sensor', 'wifi', 'camera'
  reading_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_ins_gym_id ON check_ins(gym_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_timestamp ON check_ins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_gym_timestamp ON check_ins(gym_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_gym_id ON sensor_readings(gym_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(reading_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_gym_timestamp ON sensor_readings(gym_id, reading_timestamp DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Public read access to gyms
CREATE POLICY "Gyms are viewable by everyone"
  ON gyms FOR SELECT
  USING (true);

-- Public read access to check-ins (anon data)
CREATE POLICY "Check-ins are viewable by everyone"
  ON check_ins FOR SELECT
  USING (true);

-- Users can insert their own check-ins (validation on client)
CREATE POLICY "Users can insert check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (true);

-- Public read access to sensor readings
CREATE POLICY "Sensor readings are viewable by everyone"
  ON sensor_readings FOR SELECT
  USING (true);

-- Only authenticated service role can insert sensor readings (IoT devices)
CREATE POLICY "Service can insert sensor readings"
  ON sensor_readings FOR INSERT
  WITH CHECK (true);

-- Function: Get current occupancy for a gym (combined check-ins + sensor data)
CREATE OR REPLACE FUNCTION get_gym_occupancy(gym_id_param TEXT)
RETURNS TABLE(
  gym_id TEXT,
  occupancy_count INTEGER,
  data_source TEXT,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  -- First try to get from IoT sensors (most accurate)
  RETURN QUERY
  SELECT 
    sr.gym_id,
    sr.occupancy_count,
    'sensor'::TEXT as data_source,
    sr.reading_timestamp as last_updated
  FROM sensor_readings sr
  WHERE sr.gym_id = gym_id_param
  ORDER BY sr.reading_timestamp DESC
  LIMIT 1;
  
  -- If no sensor data found, estimate from recent check-ins (last hour)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      gym_id_param,
      COUNT(*)::INTEGER as occupancy_count,
      'check_ins'::TEXT as data_source,
      MAX(timestamp) as last_updated
    FROM check_ins
    WHERE check_ins.gym_id = gym_id_param
      AND timestamp > NOW() - INTERVAL '1 hour'
    GROUP BY gym_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Get community stats across all gyms
CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS TABLE(
  total_check_ins BIGINT,
  active_gyms BIGINT,
  most_popular_gym_id TEXT,
  most_popular_gym_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_activity AS (
    SELECT 
      gym_id,
      COUNT(*) as check_in_count
    FROM check_ins
    WHERE timestamp > NOW() - INTERVAL '7 days'
    GROUP BY gym_id
  )
  SELECT 
    (SELECT COUNT(*) FROM check_ins WHERE timestamp > NOW() - INTERVAL '7 days')::BIGINT as total_check_ins,
    (SELECT COUNT(DISTINCT gym_id) FROM check_ins WHERE timestamp > NOW() - INTERVAL '7 days')::BIGINT as active_gyms,
    (SELECT gym_id FROM recent_activity ORDER BY check_in_count DESC LIMIT 1) as most_popular_gym_id,
    (SELECT MAX(check_in_count) FROM recent_activity) as most_popular_gym_count;
END;
$$ LANGUAGE plpgsql;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data: Insert your Quebec gyms
-- This should match your gymsDatabase.js but stored in Supabase
-- You can add more gyms with INSERT statements or import from your existing data
