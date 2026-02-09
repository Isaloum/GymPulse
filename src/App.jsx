import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

// Mock data generators
const generateLiveOccupancy = () => {
  const base = Math.floor(Math.random() * 100);
  return {
    percentage: base,
    level: base < 30 ? 'Low' : base < 70 ? 'Moderate' : 'High',
    timestamp: new Date().toLocaleTimeString()
  };
};

const generateTrendData = () => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const hourAgo = new Date(Date.now() - i * 60 * 60 * 1000);
    data.push({
      time: hourAgo.toLocaleTimeString([], {hour: '2-digit'}),
      occupancy: Math.floor(Math.random() * 100)
    });
  }
  return data;
};

const generatePredictionData = () => {
  const data = [];
  for (let i = 0; i < 12; i++) {
    const futureHour = new Date(Date.now() + i * 60 * 60 * 1000);
    data.push({
      time: futureHour.toLocaleTimeString([], {hour: '2-digit'}),
      predicted: Math.floor(Math.random() * 100),
      low: Math.floor(Math.random() * 30),
      high: Math.floor(Math.random() * 100)
    });
  }
  return data;
};

const OccupancyIndicator = ({ occupancy }) => {
  const getLevelColor = (level) => {
    switch(level) {
      case 'Low': return '#10B981'; // green
      case 'Moderate': return '#F59E0B'; // amber
      case 'High': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Occupancy</h2>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-5xl font-bold" style={{color: getLevelColor(occupancy.level)}}>
            {occupancy.percentage}%
          </div>
          <div className="text-lg capitalize" style={{color: getLevelColor(occupancy.level)}}>
            {occupancy.level}
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-500">Last updated</div>
          <div className="font-medium">{occupancy.timestamp}</div>
        </div>
      </div>
    </div>
  );
};

const TrendChart = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Occupancy Trend (Last 24 Hours)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
          <Line type="monotone" dataKey="occupancy" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const PredictionChart = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Predicted Occupancy (Next 12 Hours)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, 'Predicted']} />
          <Legend />
          <Bar dataKey="predicted" fill="#8B5CF6" name="Predicted Occupancy" />
          <Bar dataKey="low" fill="#10B981" name="Low Estimate" />
          <Bar dataKey="high" fill="#EF4444" name="High Estimate" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const App = () => {
  const [liveOccupancy, setLiveOccupancy] = useState(generateLiveOccupancy());
  const [trendData, setTrendData] = useState(generateTrendData());
  const [predictionData, setPredictionData] = useState(generatePredictionData());

  // Update live occupancy every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveOccupancy(generateLiveOccupancy());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh trend and prediction data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendData(generateTrendData());
      setPredictionData(generatePredictionData());
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            GymPulse
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Real-time gym occupancy tracker
          </p>
        </header>

        <main>
          <OccupancyIndicator occupancy={liveOccupancy} />
          <TrendChart data={trendData} />
          <PredictionChart data={predictionData} />
        </main>

        <footer className="mt-12 text-center text-gray-600">
          <p>Data refreshes automatically • Updated just now</p>
        </footer>
      </div>
    </div>
  );
};

export default App;