import test from 'node:test';
import assert from 'node:assert/strict';

import { parseFlooringForm, runFlooringCalculator, FLOORING_DEFAULTS } from '../../src/adapters/flooring.js';
import { flooringResults, flooringQuickResult, flooringAnnouncement } from '../../src/components/flooring-results.js';
import { flooringForm, FLOORING_FIELD_IDS } from '../../src/components/flooring-form.js';

function view(values) {
  const result = runFlooringCalculator({ ...FLOORING_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: two rooms, 290 sq ft, 14 boxes (reference in tests/flooring.test.js)', () => {
  const result = view({});
  assert.equal(result.area, 290);
  assert.equal(result.boxes, 14);
  assert.match(String(flooringQuickResult(result)), /14 boxes/);
  assert.match(flooringAnnouncement(result), /14 boxes of flooring for 290\.0 sq ft/);
  const markup = String(flooringResults(result));
  assert.match(markup, /id="floor-rooms"/);
  assert.match(markup, /Add a price per square foot/);
});

test('blank extra rooms are skipped; a half-filled room is an error', () => {
  assert.equal(view({ room2Length: '', room2Width: '' }).roomAreas.length, 1);
  const parsed = parseFlooringForm({ ...FLOORING_DEFAULTS, room3Length: '9' });
  assert.deepEqual(Object.keys(parsed.errors), ['room3Width']);
});

test('prices by square foot and by box', () => {
  const markup = String(flooringResults(view({ pricePerSquareFoot: '2.99', pricePerBox: '70' })));
  assert.match(markup, /\$1,000\.87/);
  assert.match(markup, /\$980\.00/);
});

test('validation: room 1 and box coverage are required', () => {
  const parsed = parseFlooringForm({ ...FLOORING_DEFAULTS, room1Length: '', boxCoverage: '0' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['boxCoverage', 'room1Length']);
});

test('form labels every field', () => {
  const markup = String(flooringForm(FLOORING_DEFAULTS, {}));
  for (const id of Object.values(FLOORING_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
});
