import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRentVsBuyForm, runRentVsBuyCalculator, RVB_DEFAULTS } from '../../src/adapters/rent-vs-buy.js';
import { rentVsBuyResults, rentVsBuyQuickResult, rentVsBuyAnnouncement } from '../../src/components/rent-vs-buy-results.js';
import { rentVsBuyForm, RVB_FIELD_IDS } from '../../src/components/rent-vs-buy-form.js';

function view(values) {
  const result = runRentVsBuyCalculator({ ...RVB_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('the default example is the engine reference case: renting ahead after 10 years', () => {
  const result = view({});
  // Same inputs as the independent Python reference in tests/rent-vs-buy.test.js.
  assert.ok(Math.abs(result.last.buyerNetWorth - 200118.503727) < 1e-5);
  assert.ok(Math.abs(result.last.renterNetWorth - 217609.880538) < 1e-5);
  assert.equal(result.buyingWins, false);
  assert.equal(result.breakevenYear, null);
  assert.equal(result.rows.length, 10);
});

test('a longer stay or higher rent tips the answer to buying', () => {
  const twenty = view({ years: '20' });
  assert.equal(twenty.buyingWins, true);
  assert.equal(twenty.breakevenYear, 13);
  const markup = String(rentVsBuyResults(twenty));
  assert.match(markup, /Buying comes out ahead/);
  assert.match(markup, /Year 13/);
  assert.match(String(rentVsBuyQuickResult(view({ monthlyRent: '3000' }))), /Break-even in year 4/);
});

test('results name the no-break-even case and announce the gap', () => {
  const result = view({});
  assert.match(String(rentVsBuyResults(result)), /Not within this time/);
  assert.match(rentVsBuyAnnouncement(result), /^Renting comes out ahead after 10 years by about \$17,491\. Buying does not break even/);
  for (const id of ['rvb-years', 'rvb-breakdown']) assert.match(String(rentVsBuyResults(result)), new RegExp(`id="${id}"`));
});

test('validation: required fields, whole years and bounded growth rates', () => {
  const parsed = parseRentVsBuyForm({ ...RVB_DEFAULTS, homePrice: '0', monthlyRent: '', years: '7.5', appreciationPercent: '-60' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['appreciationPercent', 'homePrice', 'monthlyRent', 'years']);
  assert.equal(parseRentVsBuyForm({ ...RVB_DEFAULTS, appreciationPercent: '-2', hoaMonthly: '', rentersInsuranceMonthly: '' }).ok, true);
});

test('form labels every field and marks errors', () => {
  const markup = String(rentVsBuyForm(RVB_DEFAULTS, { monthlyRent: 'Enter the rent.' }));
  for (const id of Object.values(RVB_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Enter the rent\./);
  assert.match(markup, /aria-invalid="true"/);
});
