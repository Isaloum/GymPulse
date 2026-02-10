import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveOccupancyLevel,
  generatePredictionData,
  generateWeeklyHeatmap,
  getBestVisitWindow,
  getConfidenceLabel,
  isDataStale,
  generateLiveOccupancy,
  STATUS_LEVELS,
} from './utils.js';

/**
 * Test suite for utils.js
 * Functions critical to GymPulse's core functionality
 */

// === Occupancy Level Tests ===
test('deriveOccupancyLevel returns expected labels', () => {
  assert.equal(deriveOccupancyLevel(20), 'Low');
  assert.equal(deriveOccupancyLevel(55), 'Moderate');
  assert.equal(deriveOccupancyLevel(95), 'High');
});

test('deriveOccupancyLevel handles boundary values', () => {
  assert.equal(deriveOccupancyLevel(0), 'Low');
  assert.equal(deriveOccupancyLevel(34), 'Low');
  assert.equal(deriveOccupancyLevel(35), 'Moderate');
  assert.equal(deriveOccupancyLevel(74), 'Moderate');
  assert.equal(deriveOccupancyLevel(75), 'High');
  assert.equal(deriveOccupancyLevel(100), 'High');
});

test('STATUS_LEVELS constants match deriveOccupancyLevel output', () => {
  assert.equal(deriveOccupancyLevel(20), STATUS_LEVELS.LOW);
  assert.equal(deriveOccupancyLevel(55), STATUS_LEVELS.MODERATE);
  assert.equal(deriveOccupancyLevel(95), STATUS_LEVELS.HIGH);
});

// === Confidence Label Tests ===
test('getConfidenceLabel returns high confidence for >= 80%', () => {
  assert.equal(getConfidenceLabel(85), 'High confidence');
  assert.equal(getConfidenceLabel(100), 'High confidence');
});

test('getConfidenceLabel returns medium confidence for 60-79%', () => {
  assert.equal(getConfidenceLabel(65), 'Medium confidence');
  assert.equal(getConfidenceLabel(79), 'Medium confidence');
});

test('getConfidenceLabel returns low confidence for < 60%', () => {
  assert.equal(getConfidenceLabel(42), 'Low confidence');
  assert.equal(getConfidenceLabel(0), 'Low confidence');
  assert.equal(getConfidenceLabel(59), 'Low confidence');
});

// === Data Freshness Tests ===
test('isDataStale flags delayed snapshots (> 5 minutes)', () => {
  const staleDate = new Date(Date.now() - 8 * 60 * 1000).toISOString();
  assert.ok(isDataStale(staleDate));
});

test('isDataStale allows fresh data (< 5 minutes)', () => {
  const freshDate = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  assert.ok(!isDataStale(freshDate));
});

test('isDataStale respects custom staleAfterMinutes parameter', () => {
  const date = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  assert.ok(isDataStale(date, 5)); // Stale after 5 min
  assert.ok(!isDataStale(date, 15)); // Fresh within 15 min
});

// === Live Occupancy Tests ===
test('generateLiveOccupancy returns valid structure', () => {
  const live = generateLiveOccupancy();
  assert.ok(typeof live.percentage === 'number');
  assert.ok(live.percentage >= 0 && live.percentage <= 100);
  assert.ok(typeof live.estimatedHeadcount === 'number');
  assert.ok(live.estimatedHeadcount >= 0);
  assert.ok(['Low', 'Moderate', 'High'].includes(live.level));
  assert.ok(typeof live.confidence === 'number');
  assert.ok(live.confidence >= 0 && live.confidence <= 100);
  assert.ok(live.lastUpdatedAt);
});

test('generateLiveOccupancy confidence is between 55-100%', () => {
  for (let i = 0; i < 20; i++) {
    const live = generateLiveOccupancy();
    assert.ok(live.confidence >= 55, `Confidence ${live.confidence} < 55`);
    assert.ok(live.confidence <= 100, `Confidence ${live.confidence} > 100`);
  }
});

test('generateLiveOccupancy headcount is proportional to percentage', () => {
  const live = generateLiveOccupancy();
  const expectedHeadcount = Math.round((live.percentage / 100) * 120);
  assert.equal(live.estimatedHeadcount, expectedHeadcount);
});

// === Best Visit Window Tests ===
test('getBestVisitWindow returns lowest predicted slot range', () => {
  const recommendation = getBestVisitWindow([
    { time: '03 PM', predicted: 72 },
    { time: '04 PM', predicted: 30 },
    { time: '05 PM', predicted: 48 },
  ]);
  assert.equal(recommendation, 'Best time to go: 04 PM–05 PM');
});

test('getBestVisitWindow handles single prediction', () => {
  const recommendation = getBestVisitWindow([{ time: '02 PM', predicted: 25 }]);
  assert.equal(recommendation, 'Best time to go: 02 PM');
});

test('getBestVisitWindow handles empty predictions', () => {
  const recommendation = getBestVisitWindow([]);
  assert.equal(recommendation, 'No forecast available yet');
});

// === Prediction Data Tests ===
test('prediction generator produces 12 data points', () => {
  const data = generatePredictionData();
  assert.equal(data.length, 12);
});

test('prediction generator creates bounded values', () => {
  const data = generatePredictionData();
  data.forEach((row) => {
    assert.ok(row.lowerBound >= 0, `Lower bound ${row.lowerBound} < 0`);
    assert.ok(row.upperBound <= 100, `Upper bound ${row.upperBound} > 100`);
    assert.ok(row.lowerBound <= row.predicted, 'Lower bound > predicted');
    assert.ok(row.predicted <= row.upperBound, 'Predicted > upper bound');
  });
});

test('prediction peakWindow flag marks high occupancy', () => {
  const data = generatePredictionData();
  data.forEach((row) => {
    if (row.predicted >= 75) {
      assert.ok(row.peakWindow, `Peak window not flagged for ${row.predicted}%`);
    }
  });
});

// === Weekly Heatmap Tests ===
test('weekly heatmap generator creates all 7 days', () => {
  const heatmap = generateWeeklyHeatmap();
  assert.equal(heatmap.length, 7);
  const days = heatmap.map((row) => row.day);
  assert.deepEqual(days, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
});

test('heatmap occupancy values are valid percentages', () => {
  const heatmap = generateWeeklyHeatmap();
  const slots = ['6a', '9a', '12p', '3p', '6p', '9p'];
  heatmap.forEach((row) => {
    slots.forEach((slot) => {
      assert.ok(row[slot] >= 0, `${row.day} ${slot} < 0`);
      assert.ok(row[slot] <= 100, `${row.day} ${slot} > 100`);
      assert.ok(typeof row[slot] === 'number');
    });
  });
});

test('heatmap has all required time slots', () => {
  const heatmap = generateWeeklyHeatmap();
  const slots = ['6a', '9a', '12p', '3p', '6p', '9p'];
  heatmap.forEach((row) => {
    slots.forEach((slot) => {
      assert.ok(slot in row, `Missing slot ${slot} in ${row.day}`);
    });
  });
});
