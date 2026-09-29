import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMortgageForm, runMortgageCalculator, MORTGAGE_DEFAULTS } from '../../src/adapters/mortgage-payment.js';
import { mortgagePaymentResults, mortgageQuickResult, mortgageAnnouncement } from '../../src/components/mortgage-payment-results.js';
import { mortgagePaymentForm, MORTGAGE_FIELD_IDS } from '../../src/components/mortgage-payment-form.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runMortgageCalculator({ ...MORTGAGE_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: $400,000, 10% down, 6.5%, 30 years with taxes, insurance and PMI', () => {
  const result = view({});
  close(result.downPayment, 40000);
  close(result.monthly.principalAndInterest, 2275.44);
  close(result.totalMonthly, 2975.44);
  assert.equal(result.pmi.canRequestMonth, 95);
  assert.equal(result.pmi.autoEndMonth, 109);
  close(result.pmi.total, 16350);
  assert.equal(result.yearly.length, 30);
});

test('down payment in dollars and percent agree; dates follow the first payment month', () => {
  close(view({ downPaymentUnit: 'dollars', downPaymentValue: '40000' }).totalMonthly, view({}).totalMonthly);
  const dated = view({ startMonth: '2026-11' });
  assert.deepEqual(dated.pmi.canRequestDate, { year: 2034, month: 9 });
  assert.deepEqual(dated.pmi.autoEndDate, { year: 2035, month: 11 });
  assert.match(String(mortgagePaymentResults(dated)), /September 2034 \(after 95 payments\)/);
});

test('results explain PMI, its absence, and a missing PMI rate', () => {
  assert.match(String(mortgagePaymentResults(view({}))), /ends automatically at 78%/);
  const twenty = String(mortgagePaymentResults(view({ downPaymentValue: '20' })));
  assert.doesNotMatch(twenty, /ends automatically at 78%/);
  assert.match(twenty, /20% down \(20% or more\)/);
  const missing = String(mortgagePaymentResults(view({ pmiRate: '' })));
  assert.match(missing, /may require PMI/);
  assert.match(missing, /Not included/);
  const markup = String(mortgagePaymentResults(view({})));
  for (const id of ['payment-breakdown', 'mortgage-lifetime', 'mortgage-schedule']) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(String(mortgageQuickResult(view({}))), /\$2,975\.44/);
  assert.match(mortgageAnnouncement(view({})), /PMI \$150\.00 a month until about payment 109/);
});

test('invalid inputs return field errors keyed by form field', () => {
  const parsed = parseMortgageForm({ ...MORTGAGE_DEFAULTS, homePrice: '0', annualRate: '26', pmiRate: '6' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['annualRate', 'homePrice', 'pmiRate']);
  assert.match(parseMortgageForm({ ...MORTGAGE_DEFAULTS, downPaymentUnit: 'dollars', downPaymentValue: '400000' }).errors.downPaymentValue, /less than the home price/);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(mortgagePaymentForm(MORTGAGE_DEFAULTS, { homePrice: 'Enter a price.' }));
  for (const id of Object.values(MORTGAGE_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Enter a price\./);
  assert.match(markup, /aria-invalid="true"/);
});
