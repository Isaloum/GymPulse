import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://swkqwqtgbxymyhcnhmfv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10;
};

// Initialize Supabase client (only if configured)
export const supabase = isSupabaseConfigured() 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ===== GYM QUERIES =====

/**
 * Fetch all gyms from database
 */
export async function fetchGyms() {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .order('province', { ascending: true })
    .order('city', { ascending: true });
  
  if (error) {
    console.error('Error fetching gyms:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch gyms by province and city
 */
export async function fetchGymsByLocation(province, city) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('province', province)
    .eq('city', city);
  
  if (error) {
    console.error('Error fetching gyms by location:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch single gym by ID
 */
export async function fetchGymById(gymId) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', gymId)
    .single();
  
  if (error) {
    console.error('Error fetching gym:', error);
    return null;
  }
  return data;
}

// ===== CHECK-IN QUERIES =====

/**
 * Submit a user check-in
 */
export async function submitCheckIn(gymId, userId, distanceMeters) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('check_ins')
    .insert([
      {
        gym_id: gymId,
        user_id: userId,
        distance_meters: distanceMeters,
        source: 'user'
      }
    ])
    .select();
  
  if (error) {
    console.error('Error submitting check-in:', error);
    throw error;
  }
  return data;
}

/**
 * Fetch recent check-ins for a gym (last 24 hours)
 */
export async function fetchRecentCheckIns(gymId, hoursBack = 24) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const since = new Date();
  since.setHours(since.getHours() - hoursBack);
  
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('gym_id', gymId)
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error('Error fetching check-ins:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch all user's check-ins (for personal analytics)
 */
export async function fetchUserCheckIns(userId, limit = 100) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('check_ins')
    .select('*, gyms(*)')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching user check-ins:', error);
    return [];
  }
  return data || [];
}

/**
 * Check if user recently checked in to gym (spam prevention)
 */
export async function hasRecentCheckIn(gymId, userId, minutesBack = 60) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const since = new Date();
  since.setMinutes(since.getMinutes() - minutesBack);
  
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, timestamp')
    .eq('gym_id', gymId)
    .eq('user_id', userId)
    .gte('timestamp', since.toISOString())
    .limit(1);
  
  if (error) {
    console.error('Error checking recent check-in:', error);
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}

// ===== SENSOR DATA QUERIES =====

/**
 * Fetch latest sensor reading for a gym (IoT data)
 */
export async function fetchLatestSensorReading(gymId) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('gym_id', gymId)
    .order('reading_timestamp', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error fetching sensor reading:', error);
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Get current occupancy using stored function (combines sensor + check-ins)
 */
export async function getCurrentOccupancy(gymId) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .rpc('get_gym_occupancy', { gym_id_param: gymId });
  
  if (error) {
    console.error('Error fetching occupancy:', error);
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Get community statistics
 */
export async function getCommunityStats() {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .rpc('get_community_stats');
  
  if (error) {
    console.error('Error fetching community stats:', error);
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Subscribe to real-time sensor updates for a gym
 */
export function subscribeToGymSensor(gymId, callback) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const subscription = supabase
    .channel(`gym:${gymId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
        filter: `gym_id=eq.${gymId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return subscription;
}

/**
 * Unsubscribe from real-time updates
 */
export function unsubscribeFromGym(subscription) {
  if (subscription && supabase) {
    supabase.removeChannel(subscription);
  }
}

// ===== ADMIN/IOT FUNCTIONS (Service role only) =====

/**
 * Insert sensor reading (called by IoT devices/backend)
 * Note: This requires service role key in production
 */
export async function insertSensorReading(gymId, occupancyCount, sensorType) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('sensor_readings')
    .insert([
      {
        gym_id: gymId,
        occupancy_count: occupancyCount,
        sensor_type: sensorType,
        capacity_percentage: null // Calculated by DB or client
      }
    ])
    .select();
  
  if (error) {
    console.error('Error inserting sensor reading:', error);
    throw error;
  }
  return data;
}

export default supabase;
