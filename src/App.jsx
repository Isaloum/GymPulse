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
          aria-label="Check in at this gym"
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            backgroundColor: checkInLoading ? '#9ca3af' : '#2563eb',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: checkInLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            opacity: checkInLoading ? 0.6 : 1,
          }}
          onMouseOver={(e) => !checkInLoading && (e.target.style.backgroundColor = '#1d4ed8')}
          onMouseOut={(e) => !checkInLoading && (e.target.style.backgroundColor = '#2563eb')}
        >
          {checkInLoading ? 'Verifying location...' : 'I\'m Here'}
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
    <section className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#eff6ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>🔔 Peak Hour Alerts</h3>
          <p className="subtle" style={{ margin: 0, fontSize: '0.85rem' }}>
            Get notified when gym is {alertPreferences.enabled ? `below ${alertPreferences.threshold}%` : 'quiet'}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            backgroundColor: 'white',
            color: '#2563eb',
            fontWeight: '600',
          }}
        >
          {showSettings ? 'Hide' : 'Settings'}
        </button>
      </div>

      {showSettings && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #dbeafe' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={alertPreferences.enabled}
              onChange={handleToggle}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9rem' }}>Enable alerts for this gym</span>
          </label>

          {alertPreferences.enabled && (
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Alert when occupancy is below:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
      <div className="grid" style={{ marginBottom: '1.5rem' }}>
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="subtle" style={{ margin: 0 }}>Total Check-ins</p>
          <p className="big-number" style={{ color: '#2563eb', margin: '0.5rem 0 0 0' }}>
            {analytics.totalCheckIns}
          </p>
        </section>
        
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="subtle" style={{ margin: 0 }}>Unique Gyms</p>
          <p className="big-number" style={{ color: '#059669', margin: '0.5rem 0 0 0' }}>
            {analytics.uniqueGyms}
          </p>
        </section>
        
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="subtle" style={{ margin: 0 }}>This Week</p>
          <p className="big-number" style={{ color: '#7c3aed', margin: '0.5rem 0 0 0' }}>
            {analytics.thisWeekCheckIns}
          </p>
        </section>
      </div>

      {/* Most Visited Gym */}
      {analytics.mostVisited && (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Most Visited Gym</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0.5rem 0' }}>
                {analytics.mostVisited.gym.brand}
              </p>
              <p className="subtle" style={{ margin: 0 }}>
                {analytics.mostVisited.gym.name}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                {analytics.mostVisited.count}
              </p>
              <p className="subtle" style={{ margin: 0 }}>visits</p>
            </div>
          </div>
        </section>
      )}

      {/* Hourly Distribution Chart */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
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
        <p className="subtle" style={{ textAlign: 'center', margin: '0.5rem 0 0 0' }}>
          {analytics.averageDistance > 0 && `Average distance: ${analytics.averageDistance}m from gym`}
        </p>
      </section>

      {/* Recent Check-ins */}
      <section className="card">
        <h2>Recent Check-ins</h2>
        {analytics.recentCheckIns.length === 0 ? (
          <p className="subtle">No check-ins yet. Visit a gym and tap "I'm Here" to start tracking!</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {analytics.recentCheckIns.map((checkIn, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '1rem',
                  borderBottom: idx < analytics.recentCheckIns.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      {checkIn.gym?.brand || 'Unknown Gym'}
                    </p>
                    <p className="subtle" style={{ margin: 0, fontSize: '0.85rem' }}>
                      {checkIn.gym?.city || 'Unknown City'}
                      {checkIn.distance !== undefined && ` • ${checkIn.distance}m away`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <p className="subtle" style={{ margin: 0, fontSize: '0.85rem' }}>
                      {checkIn.date.toLocaleDateString()}
                    </p>
                    <p className="subtle" style={{ margin: 0, fontSize: '0.85rem' }}>
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
      <div className="grid" style={{ marginBottom: '1.5rem' }}>
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="subtle" style={{ margin: 0 }}>Community Check-ins</p>
          <p className="big-number" style={{ color: '#2563eb', margin: '0.5rem 0 0 0' }}>
            {communityStats.totalCommunityCheckIns}
          </p>
          <p className="subtle" style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>all users</p>
        </section>
        
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="subtle" style={{ margin: 0 }}>Gyms with Activity</p>
          <p className="big-number" style={{ color: '#059669', margin: '0.5rem 0 0 0' }}>
            {communityStats.gymsWithActivity.length}
          </p>
          <p className="subtle" style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>active locations</p>
        </section>
        
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="subtle" style={{ margin: 0 }}>Peak Hours</p>
          <p className="big-number" style={{ color: '#7c3aed', margin: '0.5rem 0 0 0' }}>
            {communityStats.peakHours.length > 0 
              ? HOURS[Math.floor(communityStats.peakHours[0].hour)]
              : 'N/A'
            }
          </p>
          <p className="subtle" style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>busiest time</p>
        </section>
      </div>

      {/* Most Popular Gym */}
      {communityStats.mostPopularGym && (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>🔥 Busiest Right Now</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0.5rem 0' }}>
                {communityStats.mostPopularGym.gym.brand}
              </p>
              <p className="subtle" style={{ margin: 0, fontSize: '0.9rem' }}>
                {communityStats.mostPopularGym.gym.city} • {communityStats.mostPopularGym.gym.name}
              </p>
              <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                Capacity: {communityStats.mostPopularGym.capacity} members
              </p>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#dc2626', margin: 0 }}>
                {communityStats.mostPopularGym.estimatedOccupancy}%
              </p>
              <p className="subtle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
                occupancy
              </p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                {communityStats.mostPopularGym.recentCheckIns} people now
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Active Gyms Leaderboard */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
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
                  style={{
                    padding: '1rem',
                    borderBottom: idx < Math.min(10, communityStats.gymsWithActivity.length - 1) ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', margin: 0 }}>
                      #{idx + 1} {item.gym.brand}
                    </p>
                    <p className="subtle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                      {item.gym.name} • {item.gym.city}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <p style={{ fontWeight: '600', margin: 0, color: '#2563eb' }}>
                      {item.recentCheckIns}
                    </p>
                    <p className="subtle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
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

  // Update alert preferences
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
            
            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => setActiveView('dashboard')}
                style={{
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  backgroundColor: activeView === 'dashboard' ? '#2563eb' : '#f3f4f6',
                  color: activeView === 'dashboard' ? 'white' : '#6b7280',
                  transition: 'all 0.2s',
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                style={{
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  backgroundColor: activeView === 'analytics' ? '#2563eb' : '#f3f4f6',
                  color: activeView === 'analytics' ? 'white' : '#6b7280',
                  transition: 'all 0.2s',
                }}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveView('community')}
                style={{
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  backgroundColor: activeView === 'community' ? '#2563eb' : '#f3f4f6',
                  color: activeView === 'community' ? 'white' : '#6b7280',
                  transition: 'all 0.2s',
                }}
              >
                Community
              </button>
            </div>
          </div>
          
          {/* Location Selectors - only show on dashboard view */}
          {activeView === 'dashboard' && (
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
          )}
        </header>

        <div id="main-content">
          {activeView === 'community' ? (
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
                    <div 
                      style={{
                        padding: '1rem',
                        backgroundColor: '#d1fae5',
                        border: '2px solid #059669',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      role="alert"
                    >
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
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.85rem',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          backgroundColor: '#059669',
                          color: 'white',
                        }}
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
                  <div className="grid">
                    <TrendChartCard trend={trend} />
                    <PredictionChartCard predictions={predictions} />
                  </div>
                  <WeeklyHeatmapCard weeklyHeatmap={weeklyHeatmap} />
                  <div className="recommendation" role="status" aria-live="polite">{bestVisitText}</div>
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
