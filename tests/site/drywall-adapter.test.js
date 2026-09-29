import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDrywallForm, runDrywallCalculator, DRYWALL_DEFAULTS } from '../../src/adapters/drywall.js';
import { drywallResults, drywallQuickResult, drywallAnnouncement } from '../../src/components/drywall-results.js';
import { drywallForm, DRYWALL_FIELD_IDS } from '../../src/components/drywall-form.js';

function view(values) {
  const result = runDrywallCalculator({ ...DRYWALL_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 539 sq ft, 19 sheets of 4 × 8 (reference in tests/drywall.test.js)', () => {
  const result = view({});
  assert.equal(result.area, 539);
  assert.equal(result.sheets, 19);
  assert.match(String(drywallQuickResult(result)), /19 sheets/);
  assert.equal(drywallAnnouncement(result), '19 sheets of 4 × 8 ft drywall for 539.0 sq ft, including 10% extra.');
  const markup = String(drywallResults(result));
  assert.match(markup, /id="drywall-area"/);
  assert.match(markup, /id="drywall-sizes"/);
  assert.match(markup, /Add a price per sheet/);
});

test('unchecked ceiling, another sheet size and a price', () => {
  const result = view({ includeCeiling: '', sheet: '4x12', pricePerSheet: '20' });
  assert.equal(result.sheets, 9);
  assert.equal(result.cost, 180);
  const markup = String(drywallResults(result));
  assert.match(markup, /Not included/);
  assert.match(markup, /\$180\.00/);
});

test('blank openings count as none; unknown sheet sizes fall back to 4 × 8', () => {
  const parsed = parseDrywallForm({ ...DRYWALL_DEFAULTS, doors: '', windows: '', sheet: 'x' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.input.doors, 0);
  assert.equal(parsed.input.sheet, '4x8');
});

test('errors: missing size, fractional door count, openings larger than the walls', () => {
  assert.deepEqual(Object.keys(parseDrywallForm({ ...DRYWALL_DEFAULTS, heightFeet: '' }).errors), ['heightFeet']);
  assert.deepEqual(Object.keys(parseDrywallForm({ ...DRYWALL_DEFAULTS, doors: '1.5' }).errors), ['doors']);
  assert.match(parseDrywallForm({ ...DRYWALL_DEFAULTS, windows: '40', windowArea: '12' }).errors.doors, /more than the wall area/);
});

test('form renders every field id and the sheet-size radios', () => {
  const markup = String(drywallForm());
  for (const id of Object.values(DRYWALL_FIELD_IDS).filter((id) => id !== DRYWALL_FIELD_IDS.sheet)) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(markup, /id="drywall-sheet-4x8" name="sheet" type="radio" value="4x8" checked/);
  assert.match(markup, /id="drywall-ceiling" name="includeCeiling" type="checkbox" checked/);
});
