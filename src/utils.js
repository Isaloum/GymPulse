export const STATUS_LEVELS = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
};

export const deriveOccupancyLevel = (percentage) => {
  if (percentage < 35) return STATUS_LEVELS.LOW;
  if (percentage < 75) return STATUS_LEVELS.MODERATE;
  return STATUS_LEVELS.HIGH;
};

export const getConfidenceLabel = (confidence) => {
  if (confidence >= 80) return 'High confidence';
  if (confidence >= 60) return 'Medium confidence';
  return 'Low confidence';
};

export const isDataStale = (lastUpdatedAt, staleAfterMinutes = 5) => {
  const ageMs = Date.now() - new Date(lastUpdatedAt).getTime();
  return ageMs > staleAfterMinutes * 60 * 1000;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatHour = (date) => date.toLocaleTimeString([], { hour: '2-digit' });

export const generateLiveOccupancy = () => {
  const percentage = Math.floor(Math.random() * 100);
  const estimatedHeadcount = Math.round((percentage / 100) * 120);
  const confidence = clamp(55 + Math.floor(Math.random() * 40), 0, 100);

  return {
    percentage,
    estimatedHeadcount,
    level: deriveOccupancyLevel(percentage),
    confidence,
    lastUpdatedAt: new Date().toISOString(),
  };
};

export const generateTrendData = () => {
  return Array.from({ length: 24 }, (_, index) => {
    const hourOffset = 23 - index;
    const timestamp = new Date(Date.now() - hourOffset * 60 * 60 * 1000);
    return {
      time: formatHour(timestamp),
      occupancy: Math.floor(Math.random() * 100),
    };
  });
};

export const generatePredictionData = () => {
  return Array.from({ length: 12 }, (_, index) => {
    const timestamp = new Date(Date.now() + index * 60 * 60 * 1000);
    const predicted = Math.floor(Math.random() * 100);
    const spread = Math.floor(Math.random() * 18) + 8;

    return {
      time: formatHour(timestamp),
      predicted,
      lowerBound: clamp(predicted - spread, 0, 100),
      upperBound: clamp(predicted + spread, 0, 100),
      peakWindow: predicted >= 75,
    };
  });
};

export const generateWeeklyHeatmap = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['6a', '9a', '12p', '3p', '6p', '9p'];

  return days.map((day, dayIndex) => ({
    day,
    ...hours.reduce((acc, hour, hourIndex) => {
      const base = 20 + ((dayIndex + hourIndex) % 5) * 15;
      acc[hour] = clamp(base + Math.floor(Math.random() * 25), 0, 100);
      return acc;
    }, {}),
  }));
};

export const getBestVisitWindow = (predictionData) => {
  if (!predictionData.length) return 'No forecast available yet';

  const bestIndex = predictionData.reduce((best, current, idx, arr) =>
    current.predicted < arr[best].predicted ? idx : best,
  0);

  const start = predictionData[bestIndex]?.time;
  const end = predictionData[bestIndex + 1]?.time;

  return end ? `Best time to go: ${start}–${end}` : `Best time to go: ${start}`;
};

/**
 * Aggregate user check-ins to estimate real occupancy
 * @param {string} gymId - The gym ID to check
 * @param {Array} checkIns - Array of check-in objects {gymId, timestamp, userId}
 * @param {Object} gym - Gym object with capacity property
 * @returns {Object} - Aggregated occupancy data with real check-in count
 */
export const aggregateCheckIns = (gymId, checkIns, gym = null) => {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;
  
  // Count recent check-ins for this gym
  const recentCheckIns = checkIns.filter(
    c => c.gymId === gymId && c.timestamp > fifteenMinutesAgo
  );
  
  const checkInCount = recentCheckIns.length;
  
  if (checkInCount === 0) {
    return {
      hasRealData: false,
      checkInCount: 0,
      adjustedPercentage: null,
    };
  }
  
  // Use real gym capacity if available, otherwise default to 100
  const capacity = gym?.capacity || 100;
  
  // Estimate: assume 30% of people check in (adoption rate)
  // If 10 people checked in and adoption is 30%, actual attendance ~= 33 people
  const estimatedActualCount = Math.round(checkInCount / 0.3);
  const estimatedPercentage = Math.min(100, Math.round((estimatedActualCount / capacity) * 100));
  
  return {
    hasRealData: true,
    checkInCount,
    adjustedPercentage: estimatedPercentage,
    estimatedActualCount,
  };
};

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<{lat: number, lng: number}>} - User's coordinates
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache location for 1 minute
      }
    );
  });
};

/**
 * Analyze check-in data to generate user analytics
 * @param {Array} checkIns - Array of check-in objects
 * @param {Function} getGymById - Function to get gym details by ID
 * @returns {Object} - Analytics data with stats and visualizations
 */
export const analyzeCheckIns = (checkIns, getGymById) => {
  if (!checkIns || checkIns.length === 0) {
    return {
      totalCheckIns: 0,
      uniqueGyms: 0,
      mostVisited: null,
      recentCheckIns: [],
      hourlyDistribution: Array(24).fill(0),
      weeklyDistribution: Array(7).fill(0),
      averageDistance: 0,
    };
  }

  // Total check-ins
  const totalCheckIns = checkIns.length;

  // Unique gyms visited
  const uniqueGymIds = [...new Set(checkIns.map(c => c.gymId))];
  const uniqueGyms = uniqueGymIds.length;

  // Most visited gym
  const gymCounts = {};
  checkIns.forEach(c => {
    gymCounts[c.gymId] = (gymCounts[c.gymId] || 0) + 1;
  });
  const mostVisitedId = Object.keys(gymCounts).reduce((a, b) => 
    gymCounts[a] > gymCounts[b] ? a : b
  );
  const mostVisitedGym = getGymById(mostVisitedId);
  const mostVisited = mostVisitedGym ? {
    gym: mostVisitedGym,
    count: gymCounts[mostVisitedId],
  } : null;

  // Recent check-ins (last 10)
  const recentCheckIns = [...checkIns]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
    .map(c => ({
      ...c,
      gym: getGymById(c.gymId),
      date: new Date(c.timestamp),
    }));

  // Hourly distribution (0-23)
  const hourlyDistribution = Array(24).fill(0);
  checkIns.forEach(c => {
    const hour = new Date(c.timestamp).getHours();
    hourlyDistribution[hour]++;
  });

  // Weekly distribution (0=Sun, 1=Mon, ..., 6=Sat)
  const weeklyDistribution = Array(7).fill(0);
  checkIns.forEach(c => {
    const day = new Date(c.timestamp).getDay();
    weeklyDistribution[day]++;
  });

  // Average distance from gym
  const checkInsWithDistance = checkIns.filter(c => c.distance !== undefined);
  const averageDistance = checkInsWithDistance.length > 0
    ? Math.round(checkInsWithDistance.reduce((sum, c) => sum + c.distance, 0) / checkInsWithDistance.length)
    : 0;

  // This week's check-ins
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekCheckIns = checkIns.filter(c => c.timestamp > oneWeekAgo).length;

  return {
    totalCheckIns,
    uniqueGyms,
    mostVisited,
    recentCheckIns,
    hourlyDistribution,
    weeklyDistribution,
    averageDistance,
    thisWeekCheckIns,
  };
};

/**
 * Aggregate community check-in data across all gyms
 * @param {Array} checkIns - All check-ins from all users
 * @param {Function} getGymById - Function to get gym details
 * @returns {Object} - Community-wide analytics
 */
export const analyzeCommunityCheckIns = (checkIns, getGymById) => {
  if (!checkIns || checkIns.length === 0) {
    return {
      totalCommunityCheckIns: 0,
      activeGyms: 0,
      topGyms: [],
      recentCommunityActivity: [],
      peakHours: [],
      gymsWithActivity: [],
      mostPopularGym: null,
    };
  }

  const now = Date.now();
  const last24Hours = now - 24 * 60 * 60 * 1000;
  const last15Minutes = now - 15 * 60 * 1000;
  const recentCheckIns = checkIns.filter(c => c.timestamp > last24Hours);

  // Total community check-ins (last 24 hours)
  const totalCommunityCheckIns = recentCheckIns.length;

  // Count check-ins per gym
  const gymCheckInCounts = {};
  const recentGymCheckIns = {}; // Last 15 minutes
  
  recentCheckIns.forEach(c => {
    gymCheckInCounts[c.gymId] = (gymCheckInCounts[c.gymId] || 0) + 1;
  });
  
  checkIns.filter(c => c.timestamp > last15Minutes).forEach(c => {
    recentGymCheckIns[c.gymId] = (recentGymCheckIns[c.gymId] || 0) + 1;
  });

  // Active gyms (with at least 1 check-in in last 24 hours)
  const activeGyms = Object.keys(gymCheckInCounts).length;

  // Gyms with activity details
  const gymsWithActivity = Object.entries(gymCheckInCounts)
    .map(([gymId, count]) => {
      const gym = getGymById(gymId);
      if (!gym) return null;
      
      const recentCount = recentGymCheckIns[gymId] || 0;
      const capacity = gym.capacity || 100;
      const estimatedActual = Math.round(recentCount / 0.3); // 30% adoption rate
      const estimatedOccupancy = Math.min(100, Math.round((estimatedActual / capacity) * 100));
      
      return {
        gym,
        gymId,
        recentCheckIns: recentCount,
        last24HoursCheckIns: count,
        capacity,
        estimatedOccupancy,
      };
    })
    .filter(Boolean);

  // Most popular gym right now (highest recent check-ins)
  const mostPopularGym = gymsWithActivity.length > 0
    ? gymsWithActivity.sort((a, b) => b.recentCheckIns - a.recentCheckIns)[0]
    : null;

  // Top 5 most active gyms (last 24 hours)
  const topGyms = [...gymsWithActivity]
    .sort((a, b) => b.last24HoursCheckIns - a.last24HoursCheckIns)
    .slice(0, 5);

  // Recent community activity (last 20 check-ins)
  const recentCommunityActivity = [...recentCheckIns]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
    .map(c => ({
      ...c,
      gym: getGymById(c.gymId),
      date: new Date(c.timestamp),
    }))
    .filter(item => item.gym);

  // Peak hours (hourly distribution for last 24 hours)
  const hourlyActivity = Array(24).fill(0);
  recentCheckIns.forEach(c => {
    const hour = new Date(c.timestamp).getHours();
    hourlyActivity[hour]++;
  });

  // Find top 3 peak hours
  const peakHours = hourlyActivity
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter(h => h.count > 0);

  return {
    totalCommunityCheckIns,
    activeGyms,
    topGyms,
    recentCommunityActivity,
    peakHours,
    gymsWithActivity,
    mostPopularGym,
  };
};
