import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMulchForm, runMulchCalculator, MULCH_DEFAULTS } from '../../src/adapters/mulch.js';
import { mulchResults, mulchQuickResult, mulchAnnouncement } from '../../src/components/mulch-results.js';
import { mulchForm, MULCH_FIELD_IDS } from '../../src/components/mulch-form.js';

function view(values) {
  const result = runMulchCalculator({ ...MULCH_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 0.89 cubic yards, 12 bags of 2 cu ft (reference in tests/mulch.test.js)', () => {
  const result = view({});
  assert.ok(Math.abs(result.cubicYards - 0.8888888888888888) < 1e-12);
  assert.equal(result.bag.count, 12);
  assert.match(String(mulchQuickResult(result)), /0\.89 cu yd/);
  assert.match(mulchAnnouncement(result), /12 bags of 2 cubic feet/);
  assert.match(String(mulchResults(result)), /Add a bag price/);
});

test('prices compare bags with bulk', () => {
  const markup = String(mulchResults(view({ bagPrice: '4.50', pricePerYard: '40', deliveryFee: '60' })));
  assert.match(markup, /<strong>Bags<\/strong> cost less/);
  assert.match(markup, /\$54\.00/);
});

test('round beds ignore rectangle fields; validation catches bad sizes', () => {
  assert.equal(parseMulchForm({ ...MULCH_DEFAULTS, shape: 'round', lengthFeet: '' }).ok, true);
  const parsed = parseMulchForm({ ...MULCH_DEFAULTS, widthFeet: '0', quantity: '1.5', bagSize: '0' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['bagSize', 'quantity', 'widthFeet']);
});

test('form labels every field', () => {
  const markup = String(mulchForm(MULCH_DEFAULTS, {}));
  for (const id of Object.values(MULCH_FIELD_IDS).filter((id) => id !== 'mulch-shape')) assert.match(markup, new RegExp(`for="${id}"`));
});
