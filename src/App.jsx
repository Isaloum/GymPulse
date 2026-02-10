import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  getBestVisitWindow,
  getConfidenceLabel,
  isDataStale,
} from './utils';

const OCCUPANCY_COLORS = {
  Low: '#059669',
  Moderate: '#2563eb',
  High: '#dc2626',
};

const fetchDashboardData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 450));

  if (Math.random() < 0.04) {
    throw new Error('Unable to reach sensor network.');
  }

  return {
    live: generateLiveOccupancy(),
    trend: generateTrendData(),
    predictions: generatePredictionData(),
  };
};

const FreshnessBadge = ({ lastUpdatedAt }) => {
  const stale = isDataStale(lastUpdatedAt);
  const date = new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`badge ${stale ? 'badge-warn' : 'badge-ok'}`} role="status" aria-live="polite">
      {stale ? 'Data delayed' : 'Live data'} • Updated {date}
    </div>
  );
};

const StatusCard = ({ live }) => {
  const levelColor = OCCUPANCY_COLORS[live.level] || '#334155';

  return (
    <section className="card">
      <div className="card-header">
        <h2>Current occupancy</h2>
        <FreshnessBadge lastUpdatedAt={live.lastUpdatedAt} />
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
      <BarChart data={predictions}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="time" />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip formatter={(value) => [`${value}%`, 'Forecast']} />
        <Legend />
        <Bar dataKey="predicted" name="Predicted occupancy">
          {predictions.map((entry) => (
            <Cell key={entry.time} fill={entry.peakWindow ? '#dc2626' : '#0ea5e9'} />
          ))}
        </Bar>
        <Area type="monotone" dataKey="upperBound" fill="#bfdbfe" stroke="#93c5fd" name="High estimate" />
        <Area type="monotone" dataKey="lowerBound" fill="#dcfce7" stroke="#86efac" name="Low estimate" />
      </BarChart>
    </ResponsiveContainer>
  </section>
);

function App() {
  const [live, setLive] = useState(null);
  const [trend, setTrend] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bestVisitText = useMemo(() => getBestVisitWindow(predictions), [predictions]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setError('');
        const data = await fetchDashboardData();
        if (!mounted) return;
        setLive(data.live);
        setTrend(data.trend);
        setPredictions(data.predictions);
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

    const fastRefresh = setInterval(load, 30_000);
    const slowRefresh = setInterval(load, 5 * 60_000);

    return () => {
      mounted = false;
      clearInterval(fastRefresh);
      clearInterval(slowRefresh);
    };
  }, []);

  return (
    <div className="app-shell">
      <main className="container">
        <header>
          <h1>GymPulse</h1>
          <p>Know when to go in under 5 seconds.</p>
        </header>

        {loading && <div className="card">Loading live occupancy…</div>}

        {!loading && error && (
          <div className="card error" role="alert">
            {error} Please retry in a moment.
          </div>
        )}

        {!loading && !error && live && (
          <>
            <StatusCard live={live} />
            <div className="grid">
              <TrendChartCard trend={trend} />
              <PredictionChartCard predictions={predictions} />
            </div>
            <div className="recommendation">{bestVisitText}</div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
