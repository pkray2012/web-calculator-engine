import test from 'node:test';
import assert from 'node:assert/strict';

import { parseEstimatedTaxForm, runEstimatedTaxCalculator, ESTIMATED_TAX_DEFAULTS } from '../../src/adapters/estimated-tax.js';
import { estimatedTaxPage, ESTIMATED_TAX_SOURCES } from '../../src/pages/estimated-tax-calculator.js';
import { estimatedTaxForm, ESTIMATED_TAX_FIELD_IDS } from '../../src/components/estimated-tax-form.js';
import { estimatedTaxResults, formatDueDate } from '../../src/components/estimated-tax-results.js';
import { findCalculator, liveCalculators, relatedCalculators, CALCULATORS } from '../../src/content/site.js';

test('defaults calculate the example: $3,250 a quarter', () => {
  const run = runEstimatedTaxCalculator(ESTIMATED_TAX_DEFAULTS);
  assert.equal(run.ok, true);
  assert.equal(run.view.result.safeHarborInstallment, 3250);
  assert.equal(run.input.marriedFilingSeparately, false);
});

test('last year’s AGI is required once last year’s tax is entered (review A3-003)', () => {
  const parsed = parseEstimatedTaxForm({ ...ESTIMATED_TAX_DEFAULTS, priorYearAgi: '' });
  assert.equal(parsed.ok, false);
  assert.match(parsed.errors.priorYearAgi, /110%/);
});

test('blank prior-year fields mean "not entered", not zero tax', () => {
  const run = runEstimatedTaxCalculator({ ...ESTIMATED_TAX_DEFAULTS, priorYearTax: '', priorYearAgi: '' });
  assert.equal(run.ok, true);
  assert.equal(run.input.priorYearTax, null);
  assert.equal(run.view.result.noPriorYearTax, false);
  assert.equal(run.view.result.requiredAnnualPayment, 18000);
});

test('the married-filing-separately box lowers the AGI limit', () => {
  const base = { ...ESTIMATED_TAX_DEFAULTS, priorYearAgi: '100000' };
  assert.equal(runEstimatedTaxCalculator(base).view.result.highIncome, false);
  assert.equal(runEstimatedTaxCalculator({ ...base, marriedFilingSeparately: 'on' }).view.result.highIncome, true);
});

test('invalid values give field errors', () => {
  const parsed = parseEstimatedTaxForm({ ...ESTIMATED_TAX_DEFAULTS, currentYearTax: '', withholding: '-1', priorYearAgi: 'x' });
  assert.equal(parsed.ok, false);
  for (const field of ['currentYearTax', 'withholding', 'priorYearAgi']) assert.ok(parsed.errors[field], field);
});

test('results explain each no-payment case', () => {
  const zero = String(estimatedTaxResults(runEstimatedTaxCalculator({ ...ESTIMATED_TAX_DEFAULTS, priorYearTax: '0' }).view));
  assert.ok(zero.includes('no tax last year'));
  const small = String(estimatedTaxResults(runEstimatedTaxCalculator({ ...ESTIMATED_TAX_DEFAULTS, withholding: '19500' }).view));
  assert.ok(small.includes('under $1,000'));
  const covered = String(estimatedTaxResults(runEstimatedTaxCalculator({ ...ESTIMATED_TAX_DEFAULTS, withholding: '16000' }).view));
  assert.ok(covered.includes('already covers the safe-harbor amount'));
});

test('due dates are formatted in full', () => {
  assert.equal(formatDueDate('2027-01-15'), 'January 15, 2027');
  const markup = String(estimatedTaxResults(runEstimatedTaxCalculator(ESTIMATED_TAX_DEFAULTS).view));
  for (const date of ['April 15, 2026', 'June 15, 2026', 'September 15, 2026', 'January 15, 2027']) assert.ok(markup.includes(date), date);
});

test('the form labels every field', () => {
  const markup = String(estimatedTaxForm());
  for (const id of Object.values(ESTIMATED_TAX_FIELD_IDS)) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`), id);
});

test('draft page renders with computed figures and no broken values', () => {
  const page = estimatedTaxPage();
  const body = String(page.body);
  assert.equal(page.path, '/calculators/estimated-tax-calculator/');
  assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.ok(body.includes('$3,250.00'));
  assert.ok(!/NaN|undefined|Infinity|∞/.test(body));
  for (const source of Object.values(ESTIMATED_TAX_SOURCES)) assert.ok(body.includes(source.url));
  const escapedTitle = page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  assert.ok(escapedTitle.length <= 70, `title ${escapedTitle.length}`);
  assert.ok(page.description.length >= 70 && page.description.length <= 170, `description ${page.description.length}`);
});

test('the calculator stays a draft: not live and never linked from live pages', () => {
  const entry = findCalculator('estimated-tax-calculator');
  assert.equal(entry.status, 'planned');
  assert.ok(!liveCalculators().some((calc) => calc.slug === entry.slug));
  for (const calc of liveCalculators(CALCULATORS)) {
    assert.ok(!relatedCalculators(calc.slug).some((related) => related.slug === entry.slug));
  }
});

test('the form reaches the refundable-credit fields (review ZA-006)', () => {
  const run = runEstimatedTaxCalculator({ ...ESTIMATED_TAX_DEFAULTS, currentYearTax: '1200', currentYearRefundableCredits: '400', withholding: '', priorYearTax: '', priorYearAgi: '' });
  assert.equal(run.ok, true);
  assert.equal(run.view.result.paymentsRequired, false);
  assert.equal(run.view.result.safeHarborInstallment, 0);
  assert.match(String(estimatedTaxResults(run.view)), /after withholding and refundable credits, under \$1,000/);
  const bad = parseEstimatedTaxForm({ ...ESTIMATED_TAX_DEFAULTS, currentYearRefundableCredits: '-5', priorYearRefundableCredits: 'x' });
  assert.ok(bad.errors.currentYearRefundableCredits);
  assert.ok(bad.errors.priorYearRefundableCredits);
});
