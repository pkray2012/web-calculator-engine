import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRentAffordabilityForm, runRentAffordabilityCalculator, RENT_AFFORD_DEFAULTS } from '../../src/adapters/rent-affordability.js';
import { rentAffordabilityPage, RENT_AFFORD_SOURCES } from '../../src/pages/rent-affordability-calculator.js';
import { rentAffordabilityForm, RENT_AFFORD_FIELD_IDS } from '../../src/components/rent-affordability-form.js';
import { rentAffordabilityResults } from '../../src/components/rent-affordability-results.js';
import { findCalculator, liveCalculators, relatedCalculators, CALCULATORS } from '../../src/content/site.js';

test('defaults calculate the example: $1,350 at 30%, $1,500 by 40×, $1,650 by budget', () => {
  const r = runRentAffordabilityCalculator(RENT_AFFORD_DEFAULTS).view.result;
  assert.equal(r.guidelineRent, 1350);
  assert.equal(r.screenRent, 1500);
  assert.equal(r.budget.rent, 1650);
  assert.equal(r.lowestRent, 1350);
});

test('blank take-home skips the budget view; blank rent skips the check', () => {
  const run = runRentAffordabilityCalculator({ ...RENT_AFFORD_DEFAULTS, monthlyTakeHome: '', rentConsidered: '' });
  assert.equal(run.ok, true);
  assert.equal(run.view.result.budget, null);
  assert.equal(run.view.result.considered, null);
});

test('blank rule-of-thumb fields fall back to 30% and 40×', () => {
  const run = runRentAffordabilityCalculator({ ...RENT_AFFORD_DEFAULTS, housingSharePercent: '', incomeMultiple: '' });
  assert.equal(run.input.housingSharePercent, 30);
  assert.equal(run.input.incomeMultiple, 40);
});

test('invalid values give field errors', () => {
  const parsed = parseRentAffordabilityForm({ ...RENT_AFFORD_DEFAULTS, annualGrossIncome: '', monthlyDebts: '-1', housingSharePercent: '120', incomeMultiple: '0' });
  assert.equal(parsed.ok, false);
  for (const field of ['annualGrossIncome', 'monthlyDebts', 'housingSharePercent', 'incomeMultiple']) assert.ok(parsed.errors[field], field);
});

test('checking a rent shows burden, the screen and the budget', () => {
  const markup = String(rentAffordabilityResults(runRentAffordabilityCalculator({ ...RENT_AFFORD_DEFAULTS, rentConsidered: '1700' }).view));
  assert.ok(markup.includes('37.0%'));
  assert.ok(markup.includes('cost-burdened (over 30%)'));
  assert.ok(markup.includes('$8,000.00 short'));
  assert.ok(markup.includes('−$50.00 left'));
});

test('percentages never read as the line when over it (review A4-003)', () => {
  // $1,352 + $150 at $5,000 a month is 30.04%.
  const markup = String(rentAffordabilityResults(runRentAffordabilityCalculator({ ...RENT_AFFORD_DEFAULTS, rentConsidered: '1352' }).view));
  assert.ok(markup.includes('30.04% of gross income'));
  const exact = String(rentAffordabilityResults(runRentAffordabilityCalculator({ ...RENT_AFFORD_DEFAULTS, rentConsidered: '1350' }).view));
  assert.ok(exact.includes('30.0% of gross income: not cost-burdened'));
});

test('zero income and utilities over half of income get plain wording (review A4-006, A4-007)', () => {
  const zero = String(rentAffordabilityResults(runRentAffordabilityCalculator({ ...RENT_AFFORD_DEFAULTS, annualGrossIncome: '0', rentConsidered: '500' }).view));
  assert.ok(zero.includes('With an income of $0'));
  assert.ok(zero.includes('Utilities alone already take half'));
});

test('a 0% housing share is rejected (review A4-008)', () => {
  assert.ok(parseRentAffordabilityForm({ ...RENT_AFFORD_DEFAULTS, housingSharePercent: '0' }).errors.housingSharePercent);
});

test('the page renders without the budget view when take-home is blank (review A4-009)', async () => {
  const { parseRentAffordabilityForm: parse, buildRentAffordabilityView: build } = await import('../../src/adapters/rent-affordability.js');
  const view = build(parse({ ...RENT_AFFORD_DEFAULTS, monthlyTakeHome: '' }).input);
  assert.equal(view.result.budget, null);
  assert.ok(String(rentAffordabilityResults(view)).length > 0);
});

test('the form labels every field', () => {
  const markup = String(rentAffordabilityForm());
  for (const id of Object.values(RENT_AFFORD_FIELD_IDS)) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`), id);
});

test('draft page renders with computed figures and no broken values', () => {
  const page = rentAffordabilityPage();
  const body = String(page.body);
  assert.equal(page.path, '/calculators/rent-affordability-calculator/');
  assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.ok(body.includes('$1,350.00'));
  assert.ok(!/NaN|undefined|Infinity|∞/.test(body));
  for (const source of Object.values(RENT_AFFORD_SOURCES)) assert.ok(body.includes(source.url));
  const escapedTitle = page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  assert.ok(escapedTitle.length <= 70, `title ${escapedTitle.length}`);
  assert.ok(page.description.length >= 70 && page.description.length <= 170, `description ${page.description.length}`);
});

test('the calculator stays a draft: not live and never linked from live pages', () => {
  const entry = findCalculator('rent-affordability-calculator');
  assert.equal(entry.status, 'planned');
  assert.ok(!liveCalculators().some((calc) => calc.slug === entry.slug));
  for (const calc of liveCalculators(CALCULATORS)) {
    assert.ok(!relatedCalculators(calc.slug).some((related) => related.slug === entry.slug));
  }
});
