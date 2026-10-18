import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSelfEmploymentTaxForm, runSelfEmploymentTaxCalculator, SE_TAX_DEFAULTS } from '../../src/adapters/self-employment-tax.js';
import { selfEmploymentTaxPage, SE_TAX_SOURCES } from '../../src/pages/self-employment-tax-calculator.js';
import { selfEmploymentTaxForm, SE_TAX_FIELD_IDS } from '../../src/components/self-employment-tax-form.js';
import { findCalculator, liveCalculators, relatedCalculators, CALCULATORS } from '../../src/content/site.js';

test('defaults calculate the $80,000 example', () => {
  const run = runSelfEmploymentTaxCalculator(SE_TAX_DEFAULTS);
  assert.equal(run.ok, true);
  assert.ok(Math.abs(run.view.result.selfEmploymentTax - 11303.64) < 0.005);
});

test('blank W-2 wages mean zero; commas and dollar signs are accepted', () => {
  const run = runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '$150,000', w2Wages: '' });
  assert.equal(run.ok, true);
  assert.equal(run.input.w2Wages, 0);
  assert.equal(run.input.netProfit, 150000);
});

test('a loss is accepted and owes nothing', () => {
  const run = runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '-2500' });
  assert.equal(run.ok, true);
  assert.equal(run.view.result.selfEmploymentTax, 0);
});

test('invalid values give field errors', () => {
  const parsed = parseSelfEmploymentTaxForm({ ...SE_TAX_DEFAULTS, netProfit: 'abc', w2Wages: '-5' });
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.netProfit);
  assert.ok(parsed.errors.w2Wages);
  assert.equal(parseSelfEmploymentTaxForm({ ...SE_TAX_DEFAULTS, netProfit: '' }).ok, false);
});

test('unknown tax year and filing status fall back to safe defaults', () => {
  const parsed = parseSelfEmploymentTaxForm({ ...SE_TAX_DEFAULTS, taxYear: '1999', filingStatus: 'x' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.input.taxYear, 2026);
  assert.equal(parsed.input.filingStatus, 'single');
});

test('filing status changes only the Additional Medicare Tax', () => {
  const base = { ...SE_TAX_DEFAULTS, netProfit: '240000' };
  const single = runSelfEmploymentTaxCalculator({ ...base, filingStatus: 'single' }).view.result;
  const joint = runSelfEmploymentTaxCalculator({ ...base, filingStatus: 'marriedJointly' }).view.result;
  assert.equal(single.selfEmploymentTax, joint.selfEmploymentTax);
  assert.ok(single.additionalMedicareTax > joint.additionalMedicareTax);
});

test('the form exposes every field id with a label', () => {
  const markup = String(selfEmploymentTaxForm());
  for (const id of ['se-net-profit', 'se-w2-wages']) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`));
  for (const id of Object.values(SE_TAX_FIELD_IDS)) assert.ok(markup.includes(id), id);
  assert.match(markup, /id="se-tax-year-2026"[^>]*checked/);
});

test('draft page renders with computed figures and no broken values', () => {
  const page = selfEmploymentTaxPage();
  const body = String(page.body);
  assert.equal(page.path, '/calculators/self-employment-tax-calculator/');
  assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.ok(body.includes('$11,303.64'));
  assert.ok(!/NaN|undefined|Infinity|∞/.test(body));
  for (const source of Object.values(SE_TAX_SOURCES)) assert.ok(body.includes(source.url));
  // The site audit counts the HTML-escaped title (& → &amp;).
  const escapedTitle = page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  assert.ok(escapedTitle.length <= 70, `title ${escapedTitle.length}`);
  assert.ok(page.description.length >= 70 && page.description.length <= 170, `description ${page.description.length}`);
});

test('the calculator stays a draft: not live and never linked from live pages', () => {
  const entry = findCalculator('self-employment-tax-calculator');
  assert.equal(entry.status, 'planned');
  assert.ok(!liveCalculators().some((calc) => calc.slug === entry.slug));
  for (const calc of liveCalculators(CALCULATORS)) {
    assert.ok(!relatedCalculators(calc.slug).some((related) => related.slug === entry.slug));
  }
});
