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
} from './utils';
import {
  PROVINCES,
  QUEBEC_GYMS,
  getCitiesByProvince,
  getGymsByProvinceAndCity,
  getGymById,
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
  const checkInData = aggregateCheckIns(gymId, checkIns);
  
  // Blend real check-in data with mock data
  if (checkInData.hasRealData) {
    // Weight: 40% check-ins + 60% mock (initial blend)
    live.percentage = Math.round(
      0.4 * checkInData.adjustedPercentage + 0.6 * live.percentage
    );
    live.confidence = Math.min(100, live.confidence + 15); // Higher confidence with real data
    live.checkInCount = checkInData.checkInCount;
  } else {
    live.checkInCount = 0;
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

const StatusCard = ({ live, onCheckIn, checkInSuccess }) => {
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
          aria-label="Check in at this gym"
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          I'm Here
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

  // Derived state
  const cities = useMemo(() => getCitiesByProvince(province), [province]);
  const gyms = useMemo(() => getGymsByProvinceAndCity(province, city), [province, city]);
  
  // Check-in handler
  const handleCheckIn = () => {
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
    
    const newCheckIn = { gymId, timestamp: now, userId };
    const updated = [...checkIns, newCheckIn];
    setCheckIns(updated);
    localStorage.setItem('gymPulseCheckIns', JSON.stringify(updated));
    
    const gym = getGymById(gymId);
    setCheckInSuccess(`✓ Checked in at ${gym?.brand || 'gym'}`);
    setTimeout(() => setCheckInSuccess(''), 3000);
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
          
          {/* Location Selectors */}
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
        </header>

        <div id="main-content">
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
              <StatusCard 
                live={live} 
                onCheckIn={handleCheckIn}
                checkInSuccess={checkInSuccess}
              />
              <div className="grid">
                <TrendChartCard trend={trend} />
                <PredictionChartCard predictions={predictions} />
              </div>
              <WeeklyHeatmapCard weeklyHeatmap={weeklyHeatmap} />
              <div className="recommendation" role="status" aria-live="polite">{bestVisitText}</div>
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
