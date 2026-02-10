import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveOccupancyLevel,
  generatePredictionData,
codex/build-gympulse-real-time-occupancy-tracker-dyko17
  generateWeeklyHeatmap,
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
  generateWeeklyHeatmap,
  codex/build-gympulse-real-time-occupancy-tracker-6g1grv
  generateWeeklyHeatmap,
 main
  getBestVisitWindow,
  getConfidenceLabel,
  isDataStale,
} from './utils.js';

test('deriveOccupancyLevel returns expected labels', () => {
  assert.equal(deriveOccupancyLevel(20), 'Low');
  assert.equal(deriveOccupancyLevel(55), 'Moderate');
  assert.equal(deriveOccupancyLevel(95), 'High');
});

test('confidence helper returns readable labels', () => {
  assert.equal(getConfidenceLabel(85), 'High confidence');
  assert.equal(getConfidenceLabel(65), 'Medium confidence');
  assert.equal(getConfidenceLabel(42), 'Low confidence');
});

test('isDataStale flags delayed snapshots', () => {
  const staleDate = new Date(Date.now() - 8 * 60 * 1000).toISOString();
  const freshDate = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  assert.equal(isDataStale(staleDate), true);
  assert.equal(isDataStale(freshDate), false);
});

codex/build-gympulse-real-time-occupancy-tracker-dyko17
test('best visit window returns lowest predicted slot range', () => {
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
test('best visit window returns lowest predicted slot range', () => {
codex/build-gympulse-real-time-occupancy-tracker-6g1grv
test('best visit window returns lowest predicted slot range', () => {
test('best visit window returns lowest predicted slot', () => {
main
  const recommendation = getBestVisitWindow([
    { time: '03 PM', predicted: 72 },
    { time: '04 PM', predicted: 30 },
    { time: '05 PM', predicted: 48 },
  ]);
codex/build-gympulse-real-time-occupancy-tracker-dyko17
  assert.equal(recommendation, 'Best time to go: 04 PM–05 PM');
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
  assert.equal(recommendation, 'Best time to go: 04 PM–05 PM');
codex/build-gympulse-real-time-occupancy-tracker-6g1grv
  assert.equal(recommendation, 'Best time to go: 04 PM–05 PM');
  assert.equal(recommendation, 'Best time to go: 04 PM');
main
});

test('prediction generator produces bounded values', () => {
  const data = generatePredictionData();
  assert.equal(data.length, 12);
  data.forEach((row) => {
    assert.ok(row.lowerBound >= 0);
    assert.ok(row.upperBound <= 100);
  });
});
 codex/build-gympulse-real-time-occupancy-tracker-dyko17
 codex/build-gympulse-real-time-occupancy-tracker-r63qxw
 codex/build-gympulse-real-time-occupancy-tracker-6g1grv
main

test('weekly heatmap generator creates all days and occupancy slots', () => {
  const heatmap = generateWeeklyHeatmap();
  assert.equal(heatmap.length, 7);
  assert.ok(heatmap.every((row) => ['6a', '9a', '12p', '3p', '6p', '9p'].every((slot) => row[slot] >= 0 && row[slot] <= 100)));
});
codex/build-gympulse-real-time-occupancy-tracker-dyko17
codex/build-gympulse-real-time-occupancy-tracker-r63qxw
main
