import test from 'node:test';
import assert from 'node:assert/strict';

import { parseConcreteForm, runConcreteCalculator, CONCRETE_DEFAULTS } from '../../src/adapters/concrete.js';
import { concreteResults, concreteQuickResult, concreteAnnouncement } from '../../src/components/concrete-results.js';
import { concreteForm, CONCRETE_FIELD_IDS } from '../../src/components/concrete-form.js';

function view(values) {
  const result = runConcreteCalculator({ ...CONCRETE_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default slab: 1.36 cubic yards, 62 bags of 80 lb (independent reference in tests/concrete.test.js)', () => {
  const result = view({});
  assert.ok(Math.abs(result.cubicYards - 1.358024691358025) < 1e-12);
  assert.equal(result.bag80.count, 62);
  assert.equal(result.comparable, false);
  assert.match(String(concreteQuickResult(result)), /1\.36 cu yd/);
  assert.match(concreteAnnouncement(result), /62 80 pound bags/);
  assert.match(String(concreteResults(result)), /Add a bag price and a ready-mix price/);
});

test('round holes ignore the slab fields; prices enable the comparison', () => {
  assert.equal(parseConcreteForm({ ...CONCRETE_DEFAULTS, shape: 'round', lengthFeet: '' }).ok, true);
  assert.equal(view({ shape: 'round', quantity: '6', wastePercent: '5' }).bag80.count, 23);
  const priced = view({ lengthFeet: '20', widthFeet: '20', bagPrice80: '6.50', readyMixPricePerYard: '180', deliveryFee: '100' });
  assert.equal(priced.comparable, true);
  assert.match(String(concreteResults(priced)), /<strong>ready-mix<\/strong> cost less/);
});

test('validation: sizes must be positive, count whole, yields positive', () => {
  const parsed = parseConcreteForm({ ...CONCRETE_DEFAULTS, lengthFeet: '0', quantity: '1.5', yield80: '0' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['lengthFeet', 'quantity', 'yield80']);
});

test('form labels every field', () => {
  const markup = String(concreteForm(CONCRETE_DEFAULTS, { lengthFeet: 'Enter a length.' }));
  for (const id of Object.values(CONCRETE_FIELD_IDS).filter((id) => id !== 'concrete-shape')) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Enter a length\./);
});
