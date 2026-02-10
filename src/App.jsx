import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  codex/build-gympulse-real-time-occupancy-tracker-dyko17
  codex/build-gympulse-real-time-occupancy-tracker-r63qxw
  codex/build-gympulse-real-time-occupancy-tracker-6g1grv
  main
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  codex/build-gympulse-real-time-occupancy-tracker-dyko17
  codex/build-gympulse-real-time-occupancy-tracker-r63qxw
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  main
  Line,
  main
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
  codex/build-gympulse-real-time-occupancy-tracker-dyko17
  codex/build-gympulse-real-time-occupancy-tracker-r63qxw
  generateWeeklyHeatmap,
  codex/build-gympulse-real-time-occupancy-tracker-6g1grv
  main
  generateWeeklyHeatmap,
  getBestVisitWindow,
  getConfidenceLabel,
  isDataStale,
} from './utils';

const OCCUPANCY_COLORS = {
  Low: '#059669',
  Moderate: '#2563eb',
  High: '#dc2626',
};

const HEATMAP_STEPS = ['#ecfeff', '#cffafe', '#67e8f9', '#22d3ee', '#0891b2'];
codex/build-gympulse-real-time-occupancy-tracker-dyko17
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
const HEATMAP_STEPS = ['#ecfeff', '#cffafe', '#67e8f9', '#22d3ee', '#0891b2'];
main
const getHeatmapColor = (value) => {
  if (value < 20) return HEATMAP_STEPS[0];
  if (value < 40) return HEATMAP_STEPS[1];
  if (value < 60) return HEATMAP_STEPS[2];
  if (value < 80) return HEATMAP_STEPS[3];
  return HEATMAP_STEPS[4];
};

const fetchDashboardData = async (location) => {
  await new Promise((resolve) => setTimeout(resolve, 450));
  codex/build-gympulse-real-time-occupancy-tracker-dyko17
  if (Math.random() < 0.04) {
    throw new Error('Unable to reach sensor network.');
  }

  const live = generateLiveOccupancy();
  if (location === 'Downtown') {
    live.percentage = Math.min(100, live.percentage + 12);
    live.level = live.percentage < 35 ? 'Low' : live.percentage < 75 ? 'Moderate' : 'High';
  }
  
  codex/build-gympulse-real-time-occupancy-tracker-r63qxw
  if (Math.random() < 0.04) {
    throw new Error('Unable to reach sensor network.');
  }

  const live = generateLiveOccupancy();
  if (location === 'Downtown') {
    live.percentage = Math.min(100, live.percentage + 12);
    live.level = live.percentage < 35 ? 'Low' : live.percentage < 75 ? 'Moderate' : 'High';
  }
const fetchDashboardData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 450));
main
  if (Math.random() < 0.04) {
    throw new Error('Unable to reach sensor network.');
  }

  const live = generateLiveOccupancy();
  if (location === 'Downtown') {
    live.percentage = Math.min(100, live.percentage + 12);
    live.level = live.percentage < 35 ? 'Low' : live.percentage < 75 ? 'Moderate' : 'High';
  }

main
  return {
    live,
    trend: generateTrendData(),
    predictions: generatePredictionData(),
    weeklyHeatmap: generateWeeklyHeatmap(),
  };
};

const FreshnessBadge = ({ lastUpdatedAt }) => {
  const stale = isDataStale(lastUpdatedAt);
  const date = new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   codex/build-gympulse-real-time-occupancy-tracker-dyko17
   codex/build-gympulse-real-time-occupancy-tracker-r63qxw
   main
  return (
    <div className={`badge ${stale ? 'badge-warn' : 'badge-ok'}`} role="status" aria-live="polite">
      {stale ? 'Data delayed' : 'Live data'} • Updated {date}
    </div>
     codex/build-gympulse-real-time-occupancy-tracker-dyko17
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
  const [location, setLocation] = useState('Main Street');

  const bestVisitText = useMemo(() => getBestVisitWindow(predictions), [predictions]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setError('');
        const data = await fetchDashboardData(location);
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
  }, [location]);
  codex/build-gympulse-real-time-occupancy-tracker-r63qxw
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
        main
      </div>
    </section>
  );
};

codex/build-gympulse-real-time-occupancy-tracker-dyko17
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
main
function App() {
  const [live, setLive] = useState(null);
  const [trend, setTrend] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [weeklyHeatmap, setWeeklyHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState('Main Street');

  const bestVisitText = useMemo(() => getBestVisitWindow(predictions), [predictions]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setError('');
        const data = await fetchDashboardData(location);
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
codex/build-gympulse-real-time-occupancy-tracker-dyko17

    load();
    const refresh = setInterval(load, 30_000);

    return () => {
      mounted = false;
      clearInterval(refresh);
    };
  }, [location]);

    load();
    const refresh = setInterval(load, 30_000);

    return () => {
      mounted = false;
      clearInterval(refresh);
    };
  }, [location]);
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
main

    load();

    const fastRefresh = setInterval(load, 30_000);
    const slowRefresh = setInterval(load, 5 * 60_000);

    return () => {
      mounted = false;
      clearInterval(fastRefresh);
      clearInterval(slowRefresh);
    };
  }, []);
  main
  return (
    <div className="app-shell">
      <main className="container">
  codex/build-gympulse-real-time-occupancy-tracker-dyko17
  codex/build-gympulse-real-time-occupancy-tracker-r63qxw
  codex/build-gympulse-real-time-occupancy-tracker-6g1grv
  main
        <header className="title-row">
          <div>
            <h1>GymPulse</h1>
            <p>Know when to go in under 5 seconds.</p>
          </div>
          <label className="location-picker">
            Location
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              <option>Main Street</option>
              <option>Downtown</option>
              <option>West End</option>
            </select>
          </label>
  codex/build-gympulse-real-time-occupancy-tracker-dyko17
  codex/build-gympulse-real-time-occupancy-tracker-r63qxw
        <header>
          <h1>GymPulse</h1>
          <p>Know when to go in under 5 seconds.</p>
  main
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
 codex/build-gympulse-real-time-occupancy-tracker-dyko17
 codex/build-gympulse-real-time-occupancy-tracker-r63qxw
            <WeeklyHeatmapCard weeklyHeatmap={weeklyHeatmap} />
 codex/build-gympulse-real-time-occupancy-tracker-6g1grv
            <WeeklyHeatmapCard weeklyHeatmap={weeklyHeatmap} />
 main
            <WeeklyHeatmapCard weeklyHeatmap={weeklyHeatmap} />
            <div className="recommendation">{bestVisitText}</div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
