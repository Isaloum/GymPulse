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

codex/build-gympulse-real-time-occupancy-tracker-dyko17
const formatHour = (date) => date.toLocaleTimeString([], { hour: '2-digit' });

codex/build-gympulse-real-time-occupancy-tracker-r63qxw
const formatHour = (date) => date.toLocaleTimeString([], { hour: '2-digit' });

 codex/build-gympulse-real-time-occupancy-tracker-6g1grv
const formatHour = (date) => date.toLocaleTimeString([], { hour: '2-digit' });
main
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
 codex/build-gympulse-real-time-occupancy-tracker-dyko17
      time: formatHour(timestamp),
 codex/build-gympulse-real-time-occupancy-tracker-r63qxw
      time: formatHour(timestamp),
 codex/build-gympulse-real-time-occupancy-tracker-6g1grv
      time: formatHour(timestamp),
      time: timestamp.toLocaleTimeString([], { hour: '2-digit' }),
 main

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
      codex/build-gympulse-real-time-occupancy-tracker-dyko17
      time: formatHour(timestamp),
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
      time: formatHour(timestamp),
      codex/build-gympulse-real-time-occupancy-tracker-6g1grv
      time: formatHour(timestamp),
      time: timestamp.toLocaleTimeString([], { hour: '2-digit' }),
main
      predicted,
      lowerBound: clamp(predicted - spread, 0, 100),
      upperBound: clamp(predicted + spread, 0, 100),
      peakWindow: predicted >= 75,
    };
  });
};
 codex/build-gympulse-real-time-occupancy-tracker-dyko17
 codex/build-gympulse-real-time-occupancy-tracker-r63qxw
 codex/build-gympulse-real-time-occupancy-tracker-6g1grv
 main
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
codex/build-gympulse-real-time-occupancy-tracker-dyko17
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
export const getBestVisitWindow = (predictionData) => {
  if (!predictionData.length) return 'No forecast available yet';

  const sorted = [...predictionData].sort((a, b) => a.predicted - b.predicted);
  const best = sorted[0];
  return `Best time to go: ${best.time}`;
main
};
