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
      time: timestamp.toLocaleTimeString([], { hour: '2-digit' }),
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
      time: timestamp.toLocaleTimeString([], { hour: '2-digit' }),
      predicted,
      lowerBound: clamp(predicted - spread, 0, 100),
      upperBound: clamp(predicted + spread, 0, 100),
      peakWindow: predicted >= 75,
    };
  });
};

export const getBestVisitWindow = (predictionData) => {
  if (!predictionData.length) return 'No forecast available yet';

  const sorted = [...predictionData].sort((a, b) => a.predicted - b.predicted);
  const best = sorted[0];
  return `Best time to go: ${best.time}`;
};
