import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRoofingForm, runRoofingCalculator, ROOFING_DEFAULTS } from '../../src/adapters/roofing.js';
import { roofingResults, roofingQuickResult, roofingAnnouncement } from '../../src/components/roofing-results.js';
import { roofingForm, ROOFING_FIELD_IDS } from '../../src/components/roofing-form.js';

function view(values) {
  const result = runRoofingCalculator({ ...ROOFING_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 13.42 squares, 45 bundles (reference in tests/roofing.test.js)', () => {
  const result = view({});
  assert.equal(result.bundles, 45);
  assert.match(String(roofingQuickResult(result)), /45 bundles/);
  assert.equal(roofingAnnouncement(result), '45 bundles of shingles for 13.42 squares of roof, including 10% extra.');
  const markup = String(roofingResults(result));
  assert.match(markup, /id="roof-area"/);
  assert.match(markup, /1\.1180/);
  assert.match(markup, /Add a price per bundle/);
});

test('a price per bundle adds the cost', () => {
  const result = view({ pricePerBundle: '35' });
  assert.equal(result.cost, 1575);
  assert.match(String(roofingResults(result)), /\$1,575\.00/);
});

test('blank waste counts as none; a flat roof is allowed', () => {
  const parsed = parseRoofingForm({ ...ROOFING_DEFAULTS, wastePercent: '', pitchRise: '0' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.input.wastePercent, 0);
  assert.equal(view({ wastePercent: '', pitchRise: '0' }).bundles, 36);
});

test('errors are keyed by field', () => {
  assert.deepEqual(Object.keys(parseRoofingForm({ ...ROOFING_DEFAULTS, lengthFeet: '' }).errors), ['lengthFeet']);
  assert.deepEqual(Object.keys(parseRoofingForm({ ...ROOFING_DEFAULTS, pitchRise: '30' }).errors), ['pitchRise']);
  assert.deepEqual(Object.keys(parseRoofingForm({ ...ROOFING_DEFAULTS, bundlesPerSquare: '0' }).errors), ['bundlesPerSquare']);
});

test('form renders every field id', () => {
  const markup = String(roofingForm());
  for (const id of Object.values(ROOFING_FIELD_IDS)) assert.match(markup, new RegExp(`id="${id}"`));
});
