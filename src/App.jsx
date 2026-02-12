import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './App.css';
import {
  generateLiveOccupancy,
  generatePredictionData,
  generateTrendData,
  generateWeeklyHeatmap,
  getBestVisitWindow,
  getConfidenceLabel,
  isDataStale,
  aggregateCheckIns,
  calculateDistance,
  getUserLocation,
  analyzeCheckIns,
  analyzeCommunityCheckIns,
  calculateAdvancedAnalytics,
  generatePartnershipDataExport,
} from './utils';
import {
  PROVINCES,
  QUEBEC_GYMS,
  getCitiesByProvince,
  getGymsByProvinceAndCity,
  getGymById,
  getGymCapacity,
} from './gymsDatabase';

// Error Boundary: Catches component errors and displays a friendly message
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GymPulse encountered an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <main className="container">
            <div className="card error" role="alert">
              <h2>Something went wrong</h2>
              <p>GymPulse encountered an unexpected error. Please refresh the page.</p>
              <details style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                <summary>Error details</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1rem',
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Reload page
              </button>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

const OCCUPANCY_COLORS = {
  Low: '#059669',
  Moderate: '#2563eb',
  High: '#dc2626',
};

const HEATMAP_STEPS = ['#ecfeff', '#cffafe', '#67e8f9', '#22d3ee', '#0891b2'];

const getHeatmapColor = (value) => {
  if (value < 20) return HEATMAP_STEPS[0];
  if (value < 40) return HEATMAP_STEPS[1];
  if (value < 60) return HEATMAP_STEPS[2];
  if (value < 80) return HEATMAP_STEPS[3];
  return HEATMAP_STEPS[4];
};

const fetchDashboardData = async (gymId, checkIns = []) => {
  await new Promise((resolve) => setTimeout(resolve, 450));
  
  if (Math.random() < 0.04) {
    throw new Error('Unable to reach sensor network.');
  }

  const gym = getGymById(gymId);
  const gymName = gym ? gym.name : 'Unknown Gym';
  
  // Generate base occupancy data
  const live = generateLiveOccupancy();
  
  // Aggregate check-in data for this gym
  const checkInData = aggregateCheckIns(gymId, checkIns, gym);
  
  // Blend real check-in data with mock data
  if (checkInData.hasRealData) {
    // Weight: 40% check-ins + 60% mock (initial blend)
    live.percentage = Math.round(
      0.4 * checkInData.adjustedPercentage + 0.6 * live.percentage
    );
    live.confidence = Math.min(100, live.confidence + 15); // Higher confidence with real data
    live.checkInCount = checkInData.checkInCount;
    live.estimatedActualCount = checkInData.estimatedActualCount;
    live.capacity = gym?.capacity || 100;
  } else {
    live.checkInCount = 0;
    live.capacity = gym?.capacity || 100;
  }
  
  // Adjust occupancy based on gym brand/location (peaks at different times)
  if (gym?.brand.includes('Anytime')) {
    live.percentage = Math.min(100, live.percentage + 5); // Slightly busier
  }
  if (gymName.includes('Downtown')) {
    live.percentage = Math.min(100, live.percentage + 10); // Downtown is busier
  }
  
  // Re-derive level after percentage adjustments
  live.level = live.percentage < 35 ? 'Low' : live.percentage < 75 ? 'Moderate' : 'High';
  live.gymName = gymName;
  live.gymId = gymId;

  return {
    live,
    trend: generateTrendData(),
    predictions: generatePredictionData(),
    weeklyHeatmap: generateWeeklyHeatmap(),
  };
};

const FreshnessBadge = ({ lastUpdatedAt, checkInCount }) => {
  const stale = isDataStale(lastUpdatedAt);
  const date = new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const hasRealData = checkInCount > 0;
  const badgeClass = hasRealData ? 'badge-ok' : (stale ? 'badge-warn' : 'badge-ok');
  const badgeText = hasRealData 
    ? `${checkInCount} check-in${checkInCount > 1 ? 's' : ''} • ${date}`
    : (stale ? 'Data delayed' : 'Live data') + ` • Updated ${date}`;

  return (
    <div className={`badge ${badgeClass}`} role="status" aria-live="polite">
      {badgeText}
    </div>
  );
};

const StatusCard = ({ live, onCheckIn, checkInSuccess, checkInLoading }) => {
  const levelColor = OCCUPANCY_COLORS[live.level] || '#334155';

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Current occupancy</h2>
          <p className="subtle" style={{ margin: '0.3rem 0 0 0' }}>{live.gymName}</p>
        </div>
        <FreshnessBadge 
          lastUpdatedAt={live.lastUpdatedAt} 
          checkInCount={live.checkInCount || 0}
        />
      </div>

      <div className="status-grid">
        <div>
          <p className="big-number" style={{ color: levelColor }}>{live.percentage}%</p>
          <p className="level" style={{ color: levelColor }}>{live.level}</p>
          <p className="subtle">Estimated headcount: {live.estimatedHeadcount} members</p>
        </div>

        <div className="confidence-box">
          <p className="subtle">Prediction trust</p>
          <p className="confidence-label">{getConfidenceLabel(live.confidence)}</p>
          <div className="meter" aria-label="Prediction confidence meter">
            <span style={{ width: `${live.confidence}%` }} />
          </div>
          <p className="subtle">{live.confidence}% confidence</p>
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button 
          className="check-in-button"
          onClick={onCheckIn}
          disabled={checkInLoading}
          aria-label="Check in at this gym - your primary action"
          data-loading={checkInLoading ? 'true' : 'false'}
        >
          {checkInLoading ? '⏳ Verifying location...' : '✓ I\'m Here'}
        </button>
        
        {checkInSuccess && (
          <p 
            style={{
              marginTop: '0.75rem',
              fontSize: '0.9rem',
              color: '#059669',
              fontWeight: '500'
            }}
            role="status" 
            aria-live="polite"
          >
            {checkInSuccess}
          </p>
        )}
      </div>
    </section>
  );
};

// Peak Hour Alerts Settings Component
const AlertSettings = ({ alertPreferences, onUpdate }) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = () => {
    const updated = { ...alertPreferences, enabled: !alertPreferences.enabled };
    onUpdate(updated);
  };

  const handleThresholdChange = (e) => {
    const updated = { ...alertPreferences, threshold: parseInt(e.target.value, 10) };
    onUpdate(updated);
  };

  return (
    <section className="card card--soft section-stack">
      <div className="row-between">
        <div>
          <h3>🔔 Peak Hour Alerts</h3>
          <p className="subtle text-xs" style={{ margin: 0 }}>
            Get notified when gym is {alertPreferences.enabled ? `below ${alertPreferences.threshold}%` : 'quiet'}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="ghost-button"
        >
          {showSettings ? 'Hide' : 'Settings'}
        </button>
      </div>

      {showSettings && (
        <div className="section-divider">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={alertPreferences.enabled}
              onChange={handleToggle}
              className="toggle-input"
            />
            <span className="text-sm">Enable alerts for this gym</span>
          </label>

          {alertPreferences.enabled && (
            <div>
              <label className="text-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Alert when occupancy is below:
              </label>
              <div className="row-center">
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="10"
                  value={alertPreferences.threshold}
                  onChange={handleThresholdChange}
                  style={{ flex: 1 }}
                />
                <span style={{ 
                  minWidth: '60px', 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  fontSize: '1.1rem',
                  color: '#2563eb'
                }}>
                  {alertPreferences.threshold}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const TrendChartCard = ({ trend }) => (
  <section className="card">
    <h2>Last 24 hours</h2>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={trend}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="time" />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
        <Line dataKey="occupancy" stroke="#2563eb" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </section>
);

const PredictionChartCard = ({ predictions }) => (
  <section className="card">
    <h2>Next 12 hours forecast</h2>
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={predictions}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="time" />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip formatter={(value) => [`${value}%`, 'Forecast']} />
        <Legend />
        <Area type="monotone" dataKey="upperBound" fill="#bfdbfe" stroke="#93c5fd" name="High estimate" />
        <Area type="monotone" dataKey="lowerBound" fill="#dcfce7" stroke="#86efac" name="Low estimate" />
        <Bar dataKey="predicted" name="Predicted occupancy">
          {predictions.map((entry) => (
            <Cell key={entry.time} fill={entry.peakWindow ? '#dc2626' : '#0ea5e9'} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  </section>
);

const WeeklyHeatmapCard = ({ weeklyHeatmap }) => {
  const slots = ['6a', '9a', '12p', '3p', '6p', '9p'];

  return (
    <section className="card">
      <h2>Typical weekly busy hours</h2>
      <div className="heatmap" role="table" aria-label="Weekly gym occupancy heatmap">
        <div className="heatmap-header" role="row">
          <span role="columnheader">Day</span>
          {slots.map((slot) => (
            <span key={slot} role="columnheader">{slot}</span>
          ))}
        </div>
        {weeklyHeatmap.map((row) => (
          <div className="heatmap-row" role="row" key={row.day}>
            <span className="day-label" role="rowheader">{row.day}</span>
            {slots.map((slot) => (
              <span
                key={`${row.day}-${slot}`}
                className="heat-cell"
                style={{ background: getHeatmapColor(row[slot]) }}
                aria-label={`${row.day} ${slot} typical occupancy ${row[slot]}%`}
                role="cell"
              >
                {row[slot]}%
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

// Analytics Dashboard Components
const AnalyticsDashboard = ({ analytics, checkIns }) => {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Prepare hourly chart data
  const hourlyData = analytics.hourlyDistribution.map((count, hour) => ({
    hour: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
    checkIns: count,
  }));

  return (
    <div>
      {/* Stats Overview */}
      <div className="stat-grid">
        <section className="card stat-card">
          <p className="stat-label">Total Check-ins</p>
          <p className="stat-number" data-variant="blue">
            {analytics.totalCheckIns}
          </p>
        </section>
        
        <section className="card stat-card">
          <p className="stat-label">Unique Gyms</p>
          <p className="stat-number" data-variant="green">
            {analytics.uniqueGyms}
          </p>
        </section>
        
        <section className="card stat-card">
          <p className="stat-label">This Week</p>
          <p className="stat-number" data-variant="purple">
            {analytics.thisWeekCheckIns}
          </p>
        </section>
      </div>

      {/* Most Visited Gym */}
      {analytics.mostVisited && (
        <section className="card section-stack">
          <h2>Most Visited Gym</h2>
          <div className="row-between">
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0.5rem 0' }}>
                {analytics.mostVisited.gym.brand}
              </p>
              <p className="subtle" style={{ margin: 0 }}>
                {analytics.mostVisited.gym.name}
              </p>
            </div>
            <div className="centered" style={{ textAlign: 'right' }}>
              <p className="stat-number" data-variant="blue" style={{ fontSize: '2rem', margin: 0 }}>
                {analytics.mostVisited.count}
              </p>
              <p className="subtle" style={{ margin: 0 }}>visits</p>
            </div>
          </div>
        </section>
      )}

      {/* Hourly Distribution Chart */}
      <section className="card section-stack">
        <h2>Check-in Times</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="hour" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="checkIns" 
              stroke="#2563eb" 
              strokeWidth={2}
              name="Check-ins"
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="subtle centered" style={{ margin: '0.5rem 0 0 0' }}>
          {analytics.averageDistance > 0 && `Average distance: ${analytics.averageDistance}m from gym`}
        </p>
      </section>

      {/* Recent Check-ins */}
      <section className="card">
        <h2>Recent Check-ins</h2>
        {analytics.recentCheckIns.length === 0 ? (
          <p className="subtle">No check-ins yet. Visit a gym and tap "I'm Here" to start tracking!</p>
        ) : (
          <div className="scroll-area">
            {analytics.recentCheckIns.map((checkIn, idx) => (
              <div 
                key={idx}
                className="list-item"
              >
                <div className="list-row" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      {checkIn.gym?.brand || 'Unknown Gym'}
                    </p>
                    <p className="subtle text-xs" style={{ margin: 0 }}>
                      {checkIn.gym?.city || 'Unknown City'}
                      {checkIn.distance !== undefined && ` • ${checkIn.distance}m away`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <p className="subtle text-xs" style={{ margin: 0 }}>
                      {checkIn.date.toLocaleDateString()}
                    </p>
                    <p className="subtle text-xs" style={{ margin: 0 }}>
                      {checkIn.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Community Stats View
const CommunityStatsView = ({ communityStats }) => {
  const HOURS = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', 
                  '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];

  return (
    <div>
      {/* Community Overview Stats */}
      <div className="stat-grid">
        <section className="card stat-card">
          <p className="stat-label">Community Check-ins</p>
          <p className="stat-number" data-variant="blue">
            {communityStats.totalCommunityCheckIns}
          </p>
          <p className="subtle text-xs" style={{ margin: '0.5rem 0 0 0' }}>all users</p>
        </section>
        
        <section className="card stat-card">
          <p className="stat-label">Gyms with Activity</p>
          <p className="stat-number" data-variant="green">
            {communityStats.gymsWithActivity.length}
          </p>
          <p className="subtle text-xs" style={{ margin: '0.5rem 0 0 0' }}>active locations</p>
        </section>
        
        <section className="card stat-card">
          <p className="stat-label">Peak Hours</p>
          <p className="stat-number" data-variant="purple">
            {communityStats.peakHours.length > 0 
              ? HOURS[Math.floor(communityStats.peakHours[0].hour)]
              : 'N/A'
            }
          </p>
          <p className="subtle text-xs" style={{ margin: '0.5rem 0 0 0' }}>busiest time</p>
        </section>
      </div>

      {/* Most Popular Gym */}
      {communityStats.mostPopularGym && (
        <section className="card section-stack">
          <h2>🔥 Busiest Right Now</h2>
          <div className="row-between align-start">
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0.5rem 0' }}>
                {communityStats.mostPopularGym.gym.brand}
              </p>
              <p className="subtle text-sm" style={{ margin: 0 }}>
                {communityStats.mostPopularGym.gym.city} • {communityStats.mostPopularGym.gym.name}
              </p>
              <p className="subtle text-xs" style={{ margin: '0.75rem 0 0 0' }}>
                Capacity: {communityStats.mostPopularGym.capacity} members
              </p>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#dc2626', margin: 0 }}>
                {communityStats.mostPopularGym.estimatedOccupancy}%
              </p>
              <p className="subtle text-xs" style={{ margin: '0.25rem 0 0 0' }}>
                occupancy
              </p>
              <p className="subtle text-xs" style={{ margin: '0.5rem 0 0 0' }}>
                {communityStats.mostPopularGym.recentCheckIns} people now
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Active Gyms Leaderboard */}
      <section className="card section-stack">
        <h2>Gym Leaderboard</h2>
        <p className="subtle" style={{ margin: '0 0 1rem 0' }}>Based on recent community check-ins</p>
        {communityStats.gymsWithActivity.length === 0 ? (
          <p className="subtle">No community activity yet. Be the first to check in!</p>
        ) : (
          <div>
            {communityStats.gymsWithActivity
              .sort((a, b) => b.recentCheckIns - a.recentCheckIns)
              .slice(0, 10)
              .map((item, idx) => (
                <div 
                  key={idx}
                  className="list-item"
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', margin: 0 }}>
                      #{idx + 1} {item.gym.brand}
                    </p>
                    <p className="subtle text-xs" style={{ margin: '0.25rem 0 0 0' }}>
                      {item.gym.name} • {item.gym.city}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <p style={{ fontWeight: '600', margin: 0, color: '#2563eb' }}>
                      {item.recentCheckIns}
                    </p>
                    <p className="subtle text-xs" style={{ margin: '0.25rem 0 0 0' }}>
                      recent
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Peak Hours */}
      <section className="card">
        <h2>Peak Hours (Community)</h2>
        <p className="subtle" style={{ margin: '0 0 1rem 0' }}>When most people work out</p>
        {communityStats.peakHours.length === 0 ? (
          <p className="subtle">Insufficient data. Check back later!</p>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            {communityStats.peakHours.map((peak, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ minWidth: '60px', fontWeight: '600', margin: 0 }}>
                  {HOURS[peak.hour]}
                </p>
                <div style={{
                  flex: 1,
                  height: '24px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '0.25rem',
                  overflow: 'hidden',
                }}>
                  <div 
                    style={{
                      height: '100%',
                      backgroundColor: idx === 0 ? '#dc2626' : idx === 1 ? '#f97316' : '#eab308',
                      width: `${(peak.count / Math.max(...communityStats.peakHours.map(p => p.count))) * 100}%`,
                    }}
                  />
                </div>
                <p style={{ minWidth: '40px', margin: 0, textAlign: 'right', fontSize: '0.85rem' }}>
                  {peak.count}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Premium Paywall Component
const PremiumPaywall = ({ isPremium, onUpgrade, onAppleHealthSync }) => {
  return (
    <div>
      {!isPremium ? (
        <section className="card card--warm section-stack">
          <div className="premium-hero">
            <div style={{ fontSize: '2.5rem' }}>✨</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>Unlock GymPulse Premium</h2>
              <p className="subtle" style={{ margin: 0 }}>
                Advanced analytics, health integration, partnership data exports
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="premium-cta"
            >
              Upgrade Now
            </button>
          </div>
        </section>
      ) : (
        <section className="card card--success section-stack">
          <div className="row-between">
            <div>
              <p style={{ margin: 0, fontWeight: '600', color: '#047857' }}>
                ✓ Premium Active
              </p>
              <p className="subtle" style={{ margin: '0.25rem 0 0 0', color: '#065f46' }}>
                All premium features unlocked
              </p>
            </div>
            <button
              onClick={onAppleHealthSync}
              className="premium-secondary"
            >
              Connect Apple Health
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

// Advanced Analytics View (Premium)
const AdvancedAnalyticsView = ({ advancedAnalytics, isPremium }) => {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  if (!isPremium) {
    return (
      <div className="empty-state">
        <p style={{ marginBottom: '1rem' }}>
          Advanced Analytics requires Premium
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Consistency Score */}
      <section className="card section-stack">
        <h2>Fitness Consistency Score</h2>
        <div className="row-center" style={{ gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <p className="score-number">
              {advancedAnalytics.consistencyScore}%
            </p>
            <p className="subtle" style={{ margin: '0.5rem 0 0 0' }}>
              Based on {advancedAnalytics.consistencyScore < 50 ? 'Developing' : advancedAnalytics.consistencyScore < 80 ? 'Good' : 'Excellent'} frequency
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '600', marginTop: 0, marginBottom: '0.5rem' }}>
              🎯 Stretch Goal: {advancedAnalytics.stretchGoal}%
            </p>
            <p className="subtle" style={{ margin: 0, fontSize: '0.9rem' }}>
              Increase consistency by 25% for elite status
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Forecast */}
      <section className="card section-stack">
        <h2>Next 7 Days Forecast</h2>
        <div className="forecast-grid">
          {advancedAnalytics.forecastedCheckIns.map((forecast, idx) => (
            <div 
              key={idx}
              className="forecast-cell"
              data-best={idx === advancedAnalytics.bestDayOfWeek ? 'true' : 'false'}
            >
              <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>
                {DAYS[idx]}
              </p>
              <p className="forecast-count">
                {forecast}
              </p>
              <p className="subtle text-xs" style={{ margin: '0.25rem 0 0 0' }}>
                {idx === advancedAnalytics.bestDayOfWeek ? '⭐ Best' : 'workouts'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Best Day Achievement */}
      <section className="card">
        <h2>Your Best Workout Day</h2>
        <div className="best-day-card">
          <p style={{ fontSize: '2rem', margin: 0 }}>
            {DAYS[advancedAnalytics.bestDayOfWeek]}
          </p>
          <p className="subtle" style={{ margin: '0.5rem 0 0 0' }}>
            You're most consistent on {DAYS[advancedAnalytics.bestDayOfWeek].toLowerCase()}s
          </p>
        </div>
      </section>
    </div>
  );
};

// Partnership Data Export View (Premium)
const PartnershipExportView = ({ partnershipData, isPremium, onExport }) => {
  if (!isPremium) {
    return (
      <div className="empty-state">
        <p style={{ marginBottom: '1rem' }}>
          Partnership Data requires Premium
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="card card--soft section-stack">
        <h2>Gym Partnership Data</h2>
        <p className="subtle" style={{ marginTop: 0 }}>
          Aggregated, anonymized insights for gym partners
        </p>
        <div className="stat-grid" style={{ marginTop: '1rem' }}>
          <div className="card stat-card">
            <p className="stat-label">Active Users</p>
            <p className="stat-number" data-variant="blue">
              {partnershipData.summary.totalActiveUsers}
            </p>
          </div>
          <div className="card stat-card">
            <p className="stat-label">Total Check-ins</p>
            <p className="stat-number" data-variant="green">
              {partnershipData.summary.totalCheckIns}
            </p>
          </div>
          <div className="card stat-card">
            <p className="stat-label">Partnered Gyms</p>
            <p className="stat-number" data-variant="purple">
              {partnershipData.gynInsights.length}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={onExport}
            className="primary-button"
          >
            📥 Download Partnership Data (JSON)
          </button>
          <p className="subtle text-xs" style={{ margin: '1rem 0 0 0' }}>
            Format: Anonymized hourly/weekly patterns per gym
          </p>
        </div>
      </section>

      {/* Top Partnered Gyms */}
      <section className="card">
        <h2>Top Gyms by Activity</h2>
        {partnershipData.gynInsights.length === 0 ? (
          <p className="subtle">No gym data available yet</p>
        ) : (
          <div>
            {partnershipData.gynInsights
              .sort((a, b) => b.metrics.totalCheckIns - a.metrics.totalCheckIns)
              .slice(0, 5)
              .map((gym, idx) => (
                <div 
                  key={idx}
                  className="list-item"
                >
                  <div className="list-row">
                    <div>
                      <p style={{ fontWeight: '600', margin: 0 }}>
                        #{idx + 1} {gym.gym.brand}
                      </p>
                      <p className="subtle text-xs" style={{ margin: '0.25rem 0 0 0' }}>
                        {gym.gym.city} • {gym.metrics.uniqueUsers} members active
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '600', margin: 0, color: '#2563eb', fontSize: '1.2rem' }}>
                        {gym.metrics.estimatedOccupancy}%
                      </p>
                      <p className="subtle text-xs" style={{ margin: '0.25rem 0 0 0' }}>
                        avg occupancy
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
};

function App() {
  const [live, setLive] = useState(null);
  const [trend, setTrend] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [weeklyHeatmap, setWeeklyHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Location selection state
  const [province, setProvince] = useState('Quebec');
  const [city, setCity] = useState('Montreal');
  const [gymId, setGymId] = useState('mtl-anytime-1'); // Initial gym
  
  // Check-in state
  const [checkIns, setCheckIns] = useState(() => {
    const saved = localStorage.getItem('gymPulseCheckIns');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Remove check-ins older than 24 hours
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return parsed.filter(c => c.timestamp > dayAgo);
    } catch {
      return [];
    }
  });
  const [userId] = useState(() => {
    let id = localStorage.getItem('gymPulseUserId');
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem('gymPulseUserId', id);
    }
    return id;
  });
  const [checkInSuccess, setCheckInSuccess] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'analytics', or 'community'
  const [expandedSections, setExpandedSections] = useState({}); // For progressive disclosure

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Derived state
  const cities = useMemo(() => getCitiesByProvince(province), [province]);
  const gyms = useMemo(() => getGymsByProvinceAndCity(province, city), [province, city]);
  
  // Check-in handler with GPS proximity validation
  const handleCheckIn = async () => {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    
    // Prevent spam: max 1 check-in per gym per hour
    const recentCheckIn = checkIns.find(
      c => c.gymId === gymId && c.timestamp > hourAgo
    );
    
    if (recentCheckIn) {
      const minutesRemaining = Math.ceil((recentCheckIn.timestamp + 60 * 60 * 1000 - now) / 60000);
      setCheckInSuccess(`Already checked in. Try again in ${minutesRemaining} min.`);
      setTimeout(() => setCheckInSuccess(''), 3000);
      return;
    }
    
    setCheckInLoading(true);
    
    try {
      // Get user's current location
      const userLocation = await getUserLocation();
      const gym = getGymById(gymId);
      
      if (!gym || !gym.coordinates) {
        setCheckInSuccess('⚠️ Gym location unavailable');
        setTimeout(() => setCheckInSuccess(''), 3000);
        setCheckInLoading(false);
        return;
      }
      
      // Calculate distance from gym
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        gym.coordinates.lat,
        gym.coordinates.lng
      );
      
      // Validate proximity (200 meters = ~2 blocks)
      const MAX_DISTANCE = 200;
      if (distance > MAX_DISTANCE) {
        const distanceKm = (distance / 1000).toFixed(1);
        setCheckInSuccess(`⚠️ Too far from gym (${distanceKm} km away)`);
        setTimeout(() => setCheckInSuccess(''), 4000);
        setCheckInLoading(false);
        return;
      }
      
      // Valid check-in - save it
      const newCheckIn = { gymId, timestamp: now, userId, distance: Math.round(distance) };
      const updated = [...checkIns, newCheckIn];
      setCheckIns(updated);
      localStorage.setItem('gymPulseCheckIns', JSON.stringify(updated));
      
      setCheckInSuccess(`✓ Checked in at ${gym?.brand || 'gym'}`);
      setTimeout(() => setCheckInSuccess(''), 3000);
    } catch (error) {
      if (error.code === 1) {
        setCheckInSuccess('⚠️ Enable location access to check in');
      } else if (error.code === 2) {
        setCheckInSuccess('⚠️ Location unavailable');
      } else if (error.code === 3) {
        setCheckInSuccess('⚠️ Location timeout');
      } else {
        setCheckInSuccess('⚠️ Unable to verify location');
      }
      setTimeout(() => setCheckInSuccess(''), 4000);
    } finally {
      setCheckInLoading(false);
    }
  };
  
  // Reset city when province changes
  useEffect(() => {
    const newCities = getCitiesByProvince(province);
    if (newCities.length > 0 && !newCities.includes(city)) {
      setCity(newCities[0]);
    }
  }, [province, city]);

  // Reset gym when province or city changes
  useEffect(() => {
    const newGyms = getGymsByProvinceAndCity(province, city);
    if (newGyms.length > 0 && !newGyms.find((g) => g.id === gymId)) {
      setGymId(newGyms[0].id);
    }
  }, [province, city, gymId]);

  const bestVisitText = useMemo(() => getBestVisitWindow(predictions), [predictions]);
  const analytics = useMemo(() => analyzeCheckIns(checkIns, getGymById), [checkIns]);
  const communityStats = useMemo(() => analyzeCommunityCheckIns(checkIns, getGymById), [checkIns]);
  const advancedAnalytics = useMemo(() => calculateAdvancedAnalytics(analytics, checkIns), [analytics, checkIns]);
  const partnershipData = useMemo(() => generatePartnershipDataExport(communityStats, checkIns, getGymById), [communityStats, checkIns]);

  // Premium membership handler
  const handlePremiumUpgrade = () => {
    // In production: integrate Stripe, RevenueCat, or other payment platform
    // For MVP: mock upgrade
    setIsPremium(true);
    localStorage.setItem('gymPulsePremium', JSON.stringify(true));
  };

  // Export partnership data
  const exportPartnershipData = () => {
    const dataStr = JSON.stringify(partnershipData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `gym-pulse-partnership-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Apple Health integration
  const requestAppleHealthAccess = async () => {
    if (!navigator.permissions) {
      setHasAppleHealthAccess(false);
      return;
    }

    try {
      // Note: Actual Apple HealthKit integration requires native iOS wrapper
      // This is a placeholder for future "Apple Health by GymPulse" app
      const result = await navigator.permissions.query({ name: 'health' });
      if (result.state === 'granted') {
        setHasAppleHealthAccess(true);
        localStorage.setItem('gymPulseAppleHealth', 'true');
      }
    } catch (error) {
      console.log('Apple Health permission request:', error.message);
    }
  };
  const handleUpdateAlertPreferences = (newPrefs) => {
    const updated = { ...newPrefs, gymId };
    setAlertPreferences(updated);
    localStorage.setItem('gymPulseAlertPrefs', JSON.stringify(updated));
  };

  // Check for peak hour alerts
  useEffect(() => {
    if (!live || !alertPreferences.enabled || alertPreferences.gymId !== gymId) {
      setShowAlert(false);
      return;
    }

    // Show alert if occupancy is below threshold
    if (live.percentage < alertPreferences.threshold) {
      setShowAlert(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowAlert(false);
    }
  }, [live, alertPreferences, gymId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setError('');
        const data = await fetchDashboardData(gymId, checkIns);
        if (!mounted) return;
        setLive(data.live);
        setTrend(data.trend);
        setPredictions(data.predictions);
        setWeeklyHeatmap(data.weeklyHeatmap);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError.message || 'Something went wrong while loading occupancy data.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    const refresh = setInterval(load, 30_000);

    return () => {
      mounted = false;
      clearInterval(refresh);
    };
  }, [gymId, checkIns]);

  return (
    <div className="app-shell">
      <main className="container">
        <a href="#main-content" className="skip-link">Skip to main content</a>

        <header className="title-row">
          <div>
            <h1>GymPulse</h1>
            <p>Know when to go in under 5 seconds.</p>
          </div>
        </header>

        <div className="control-panel" aria-label="View and location controls">
          <div className="control-block">
            <span className="control-label">View</span>
            <div className="tabs">
              <button
                onClick={() => setActiveView('dashboard')}
                className="tab-button"
                data-active={activeView === 'dashboard' ? 'true' : 'false'}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className="tab-button"
                data-active={activeView === 'analytics' ? 'true' : 'false'}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveView('community')}
                className="tab-button"
                data-active={activeView === 'community' ? 'true' : 'false'}
              >
                Community
              </button>
              <button
                onClick={() => setActiveView('premium')}
                className="tab-button"
                data-active={activeView === 'premium' ? 'true' : 'false'}
                data-variant="premium"
              >
                Premium {isPremium ? '✓' : ''}
              </button>
            </div>
          </div>

          {activeView === 'dashboard' && (
            <div className="control-block">
              <span className="control-label">Location</span>
              <div className="location-selectors">
                <label className="location-picker">
                  Province
                  <select 
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    aria-label="Select province"
                  >
                    {Object.entries(PROVINCES).map(([key, label]) => (
                      <option key={key} value={label}>{label}</option>
                    ))}
                  </select>
                </label>

                <label className="location-picker">
                  City
                  <select 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    aria-label="Select city"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="location-picker">
                  Gym
                  <select 
                    value={gymId}
                    onChange={(e) => setGymId(e.target.value)}
                    aria-label="Select gym"
                  >
                    {gyms.map((gym) => (
                      <option key={gym.id} value={gym.id}>
                        {gym.brand} - {gym.name.split(' ').slice(-1)[0]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        <div id="main-content">
          {activeView === 'premium' ? (
            <div>
              <PremiumPaywall 
                isPremium={isPremium}
                onUpgrade={handlePremiumUpgrade}
                onAppleHealthSync={requestAppleHealthAccess}
              />
              <div className="premium-grid">
                <div>
                  <h2 style={{ marginTop: 0 }}>Advanced Analytics</h2>
                  <AdvancedAnalyticsView 
                    advancedAnalytics={advancedAnalytics} 
                    isPremium={isPremium}
                  />
                </div>
                <div>
                  <h2 style={{ marginTop: 0 }}>Partnership Data</h2>
                  <PartnershipExportView
                    partnershipData={partnershipData}
                    isPremium={isPremium}
                    onExport={exportPartnershipData}
                  />
                </div>
              </div>
            </div>
          ) : activeView === 'community' ? (
            <CommunityStatsView communityStats={communityStats} />
          ) : activeView === 'analytics' ? (
            <AnalyticsDashboard analytics={analytics} checkIns={checkIns} />
          ) : (
            <>
              {loading && (
                <div className="card" role="status" aria-live="polite" aria-label="Loading occupancy data">
                  <div className="loading">Loading live occupancy…</div>
                </div>
              )}

              {!loading && error && (
                <div className="card error" role="alert" aria-label="Error loading data">
                  {error} Please retry in a moment.
                </div>
              )}

              {!loading && !error && live && (
                <>
                  {/* Peak Hour Alert Notification */}
                  {showAlert && (
                    <div className="alert-banner" role="alert">
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', color: '#065f46' }}>
                          🎉 Great time to visit!
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#047857' }}>
                          Gym is only {live.percentage}% full — below your {alertPreferences.threshold}% threshold
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAlert(false)}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <AlertSettings
                    alertPreferences={alertPreferences}
                    onUpdate={handleUpdateAlertPreferences}
                  />
                  <StatusCard 
                    live={live} 
                    onCheckIn={handleCheckIn}
                    checkInSuccess={checkInSuccess}
                    checkInLoading={checkInLoading}
                  />
                  <div className="recommendation" role="status" aria-live="polite">{bestVisitText}</div>

                  <section className="card section-stack">
                    <div className="row-between">
                      <h2>Patterns & Insights</h2>
                      <button
                        className="expand-button"
                        onClick={() => toggleSection('charts')}
                        aria-label="Toggle patterns and insights visibility"
                      >
                        {expandedSections.charts ? '−' : '+'} Details
                      </button>
                    </div>
                    <div className="collapsible-section" data-open={expandedSections.charts ? 'true' : 'false'}>
                      <div className="grid" style={{ marginTop: '1rem' }}>
                        <TrendChartCard trend={trend} />
                        <PredictionChartCard predictions={predictions} />
                      </div>
                      <WeeklyHeatmapCard weeklyHeatmap={weeklyHeatmap} />
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Wrap the App with ErrorBoundary for production safety
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
