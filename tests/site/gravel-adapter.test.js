import test from 'node:test';
import assert from 'node:assert/strict';

import { parseGravelForm, runGravelCalculator, GRAVEL_DEFAULTS } from '../../src/adapters/gravel.js';
import { gravelResults, gravelQuickResult, gravelAnnouncement } from '../../src/components/gravel-results.js';
import { gravelForm, GRAVEL_FIELD_IDS } from '../../src/components/gravel-form.js';

function view(values) {
  const result = runGravelCalculator({ ...GRAVEL_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 2.85 tons, 2.04 cubic yards (reference in tests/gravel.test.js)', () => {
  const result = view({});
  assert.ok(Math.abs(result.tons - 2.851851851851852) < 1e-12);
  assert.match(String(gravelQuickResult(result)), /2\.85 tons/);
  assert.match(gravelAnnouncement(result), /2\.04 cu yd/);
  assert.match(String(gravelResults(result)), /Add a price per ton/);
});

test('prices by the ton and by the yard both show, with delivery', () => {
  const markup = String(gravelResults(view({ pricePerTon: '45', pricePerYard: '60', deliveryFee: '75' })));
  assert.match(markup, /id="gravel-cost"/);
  assert.match(markup, /\$203\.33/);
  assert.match(markup, /\$197\.22/);
});

test('a round area ignores the rectangle fields', () => {
  assert.equal(parseGravelForm({ ...GRAVEL_DEFAULTS, shape: 'round', lengthFeet: '' }).ok, true);
  assert.ok(Math.abs(view({ shape: 'round', extraPercent: '0', depthInches: '2' }).tons - 0.4343930582741442) < 1e-12);
});

test('validation: positive sizes and a plausible density', () => {
  const parsed = parseGravelForm({ ...GRAVEL_DEFAULTS, widthFeet: '0', depthInches: '', tonsPerYard: '9' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['depthInches', 'tonsPerYard', 'widthFeet']);
});

test('form labels every field', () => {
  const markup = String(gravelForm(GRAVEL_DEFAULTS, {}));
  for (const id of Object.values(GRAVEL_FIELD_IDS).filter((id) => id !== 'gravel-shape')) assert.match(markup, new RegExp(`for="${id}"`));
});
