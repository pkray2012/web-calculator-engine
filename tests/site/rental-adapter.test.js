import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRentalForm, runRentalCalculator, RENTAL_DEFAULTS } from '../../src/adapters/rental-property.js';
import { rentalPropertyPage } from '../../src/pages/rental-property-calculator.js';
import { rentalForm, RENTAL_FIELD_IDS } from '../../src/components/rental-property-form.js';
import { rentalResults } from '../../src/components/rental-property-results.js';
import { findCalculator, liveCalculators, relatedCalculators, CALCULATORS } from '../../src/content/site.js';

test('defaults calculate the illustrative example', () => {
  const run = runRentalCalculator(RENTAL_DEFAULTS);
  assert.equal(run.ok, true);
  assert.ok(Math.abs(run.view.result.netOperatingIncome - 17335.2) < 1e-6);
  assert.ok(Math.abs(run.view.result.annualCashFlow - -627.97) < 0.005);
});

test('blank optional costs count as zero', () => {
  const run = runRentalCalculator({ ...RENTAL_DEFAULTS, hoaMonthly: '', utilitiesMonthly: '', closingCosts: '' });
  assert.equal(run.ok, true);
  assert.equal(run.input.hoaMonthly, 0);
  assert.equal(run.input.closingCosts, 0);
});

test('an all-cash purchase ignores rate and term, even if they are blank', () => {
  const run = runRentalCalculator({ ...RENTAL_DEFAULTS, downPaymentPercent: '100', interestRate: '', termYears: '' });
  assert.equal(run.ok, true);
  assert.equal(run.view.result.dscr, null);
  assert.equal(run.view.result.annualDebtService, 0);
});

test('invalid values give field errors', () => {
  const parsed = parseRentalForm({ ...RENTAL_DEFAULTS, purchasePrice: '0', downPaymentPercent: '150', monthlyRent: '', termYears: '12.5', vacancyPercent: '-3' });
  assert.equal(parsed.ok, false);
  for (const field of ['purchasePrice', 'downPaymentPercent', 'monthlyRent', 'vacancyPercent']) assert.ok(parsed.errors[field], field);
  const term = parseRentalForm({ ...RENTAL_DEFAULTS, termYears: '12.5' });
  assert.ok(term.errors.termYears);
});

test('percentage costs above 100% of rent are rejected', () => {
  const parsed = parseRentalForm({ ...RENTAL_DEFAULTS, maintenancePercent: '60', capexPercent: '30', managementPercent: '20' });
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.managementPercent);
});

test('results show signed cash flow and every cost line', () => {
  const markup = String(rentalResults(runRentalCalculator(RENTAL_DEFAULTS).view));
  assert.ok(markup.includes('−$52.33'));
  for (const label of ['Gross scheduled income', 'Vacancy', 'Net operating income', 'Loan payments', 'Cash flow']) assert.ok(markup.includes(label), label);
  const cash = String(rentalResults(runRentalCalculator({ ...RENTAL_DEFAULTS, downPaymentPercent: '100' }).view));
  assert.ok(cash.includes('No loan'));
});

test('the form labels every field', () => {
  const markup = String(rentalForm());
  for (const id of Object.values(RENTAL_FIELD_IDS)) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`), id);
});

test('draft page renders with computed figures and no broken values', () => {
  const page = rentalPropertyPage();
  const body = String(page.body);
  assert.equal(page.path, '/calculators/rental-property-calculator/');
  assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.ok(body.includes('$17,335.20'));
  assert.ok(!/NaN|undefined|Infinity|∞/.test(body));
  const escapedTitle = page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  assert.ok(escapedTitle.length <= 70, `title ${escapedTitle.length}`);
  assert.ok(page.description.length >= 70 && page.description.length <= 170, `description ${page.description.length}`);
});

test('the calculator stays a draft: not live and never linked from live pages', () => {
  const entry = findCalculator('rental-property-calculator');
  assert.equal(entry.status, 'planned');
  assert.ok(!liveCalculators().some((calc) => calc.slug === entry.slug));
  for (const calc of liveCalculators(CALCULATORS)) {
    assert.ok(!relatedCalculators(calc.slug).some((related) => related.slug === entry.slug));
  }
});
