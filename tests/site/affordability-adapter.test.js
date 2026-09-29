import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAffordabilityForm, runAffordabilityCalculator, AFFORDABILITY_DEFAULTS } from '../../src/adapters/mortgage-affordability.js';
import { affordabilityResults, affordabilityQuickResult, affordabilityAnnouncement } from '../../src/components/affordability-results.js';
import { affordabilityForm, AFFORDABILITY_FIELD_IDS } from '../../src/components/affordability-form.js';

const close = (actual, expected, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runAffordabilityCalculator({ ...AFFORDABILITY_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

// Reference prices from an independent Python bisection with the closed-form payment.
test('default example: $100,000 income, $500 debts, $40,000 down at 6.5% for 30 years', () => {
  const result = view({});
  close(result.maxHomePrice, 320462.8771);
  close(result.monthlyHousingCost, 100000 / 12 * 0.28, 1e-6);
  assert.equal(result.binding, 'front');
  assert.equal(result.withoutDebt, null);
  assert.ok(result.pmi > 0);
});

test('higher debts make the total debt limit bind and show the debt-free price', () => {
  const result = view({ monthlyDebt: '1200' });
  close(result.maxHomePrice, 250782.6592);
  assert.equal(result.binding, 'back');
  close(result.withoutDebt.maxHomePrice, 320462.8771);
  const markup = String(affordabilityResults(result));
  assert.match(markup, /total debt limit<\/strong> sets the budget/);
  assert.match(markup, /could rise by about <strong>\$69,680<\/strong>/);
});

test('results show the breakdown, rate table and summaries', () => {
  const result = view({});
  const markup = String(affordabilityResults(result));
  for (const id of ['afford-breakdown', 'afford-rates']) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(markup, /housing limit<\/strong> sets the budget/);
  assert.match(markup, /6\.5% \(yours\)/);
  assert.match(String(affordabilityQuickResult(result)), /\$320,463/);
  assert.match(affordabilityAnnouncement(result), /Home price about \$320,463/);
});

test('limits that leave no room give a clear message instead of a price', () => {
  const result = view({ monthlyDebt: '3000' });
  assert.equal(result.affordable, false);
  assert.match(String(affordabilityResults(result)), /leave no room for a mortgage payment/);
  assert.match(affordabilityAnnouncement(result), /no room/);
});

test('invalid inputs return field errors keyed by form field', () => {
  const parsed = parseAffordabilityForm({ ...AFFORDABILITY_DEFAULTS, annualIncome: '0', termYears: '30.5', frontEndRatio: '0', propertyTaxRate: '11' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['annualIncome', 'frontEndRatio', 'propertyTaxRate', 'termYears']);
  assert.equal(parseAffordabilityForm({ ...AFFORDABILITY_DEFAULTS, monthlyDebt: '', hoaMonthly: '' }).ok, true);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(affordabilityForm(AFFORDABILITY_DEFAULTS, { annualIncome: 'Enter your income.' }));
  for (const id of Object.values(AFFORDABILITY_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Enter your income\./);
  assert.match(markup, /aria-invalid="true"/);
});
