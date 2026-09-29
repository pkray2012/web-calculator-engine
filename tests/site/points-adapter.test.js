import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePointsForm, runPointsCalculator, POINTS_DEFAULTS } from '../../src/adapters/mortgage-points.js';
import { mortgagePointsResults, mortgagePointsQuickResult, mortgagePointsAnnouncement } from '../../src/components/mortgage-points-results.js';
import { mortgagePointsForm, POINTS_FIELD_IDS } from '../../src/components/mortgage-points-form.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runPointsCalculator({ ...POINTS_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: one point on $300,000 breaks even in month 48', () => {
  const result = view({});
  close(result.pointsCost, 3000);
  close(result.monthlySavings, 50.11);
  assert.equal(result.breakEvenMonth, 48);
  close(result.simpleBreakEvenMonths, 59.86);
  close(result.stay.netSavings, 2289.33);
  close(result.lifetimeSavings, 15040.75);
});

test('horizon rows include the planned stay once and stop at the term', () => {
  const result = view({ termYears: '15', stayYears: '6' });
  const months = result.horizon.map((row) => row.month);
  assert.deepEqual(months, [12, 24, 36, 48, 60, 72, 84, 120, 180]);
  assert.equal(result.horizon.filter((row) => row.isStay).length, 1);
  const beyond = view({ termYears: '10', stayYears: '12' });
  assert.equal(beyond.stay.months, 120);
});

test('results render the verdict, both break-evens and the tables', () => {
  const markup = String(mortgagePointsResults(view({})));
  assert.match(markup, /Month 48 \(4 years\)/);
  assert.match(markup, /59\.9 months/);
  assert.match(markup, /12 months sooner/);
  assert.match(markup, /id="points-horizon"/);
  assert.match(markup, /id="points-compare"/);
  assert.match(markup, /7 years \(your plan\)/);
  assert.match(String(mortgagePointsQuickResult(view({}))), /month 48/);
  assert.match(mortgagePointsAnnouncement(view({})), /Points cost \$3,000\.00/);
});

test('a short stay is reported as a loss', () => {
  const markup = String(mortgagePointsResults(view({ stayYears: '3' })));
  assert.match(markup, /the points cost\s+\$739\.95 more than they save/);
});

test('points with no rate reduction never break even', () => {
  const result = view({ pointsRate: '7' });
  assert.equal(result.breakEvenMonth, null);
  assert.match(String(mortgagePointsResults(result)), /never pay for themselves/);
});

test('a rate with points above the base rate is a field error', () => {
  const parsed = parsePointsForm({ ...POINTS_DEFAULTS, pointsRate: '7.25' });
  assert.equal(parsed.ok, false);
  assert.match(parsed.errors.pointsRate, /must not be higher/);
  const bad = parsePointsForm({ ...POINTS_DEFAULTS, loanAmount: '', points: '-1', termYears: '50' });
  assert.deepEqual(Object.keys(bad.errors).sort(), ['loanAmount', 'points', 'termYears']);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(mortgagePointsForm(POINTS_DEFAULTS, { pointsRate: 'Too high.' }));
  for (const id of Object.values(POINTS_FIELD_IDS)) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`));
  assert.match(markup, /Too high\./);
  assert.match(markup, /aria-invalid="true"/);
});
