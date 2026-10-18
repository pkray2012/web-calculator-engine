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
  for (const id of ['se-net-profit', 'se-w2-wages', 'se-w2-medicare-wages', 'se-spouse-w2-wages']) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`));
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

test('a spouse’s wages never reduce your Social Security wage base', () => {
  const base = { ...SE_TAX_DEFAULTS, netProfit: '150000', w2Wages: '0', filingStatus: 'marriedJointly' };
  const alone = runSelfEmploymentTaxCalculator(base).view.result;
  const withSpouse = runSelfEmploymentTaxCalculator({ ...base, spouseW2Wages: '180000' }).view.result;
  assert.equal(withSpouse.socialSecurityTax, alone.socialSecurityTax);
  assert.equal(withSpouse.selfEmploymentTax, alone.selfEmploymentTax);
});

test('joint filers: both spouses’ wages use up the $250,000 Additional Medicare threshold', () => {
  const r = runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '100000', w2Wages: '60000', spouseW2Wages: '150000', filingStatus: 'marriedJointly' }).view.result;
  // Threshold left 250,000 − 210,000 = 40,000; NE 92,350 → 52,350 × 0.9%.
  assert.ok(Math.abs(r.additionalMedicareTax - 52350 * 0.009) < 1e-9);
  assert.ok(Math.abs(r.socialSecurityTax - 92350 * 0.124) < 1e-9);
});

test('spouse wages are ignored, and not validated, unless filing jointly', () => {
  const run = runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '250000', spouseW2Wages: 'abc', filingStatus: 'single' });
  assert.equal(run.ok, true);
  assert.equal(run.input.spouseW2Wages, 0);
  const joint = parseSelfEmploymentTaxForm({ ...SE_TAX_DEFAULTS, spouseW2Wages: 'abc', filingStatus: 'marriedJointly' });
  assert.equal(joint.ok, false);
  assert.ok(joint.errors.spouseW2Wages);
});

test('Medicare-only wages do not use up the Social Security wage base (review A2-001)', () => {
  // A job not covered by Social Security: W-2 box 3 is $0, box 5 is $100,000.
  const r = runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '100000', w2Wages: '0', w2MedicareWages: '100000' }).view.result;
  assert.ok(Math.abs(r.socialSecurityTax - 92350 * 0.124) < 1e-9); // $11,451.40, not $10,478.00
  assert.equal(r.additionalMedicareTax, 0); // 92,350 is under the 100,000 of threshold left
});

test('blank Medicare wages default to the Social Security wages', () => {
  const run = runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, w2Wages: '120000', w2MedicareWages: '' });
  assert.equal(run.input.w2MedicareWages, 120000);
});

test('wages above the threshold are called out instead of saying no Additional Medicare Tax applies (review A2-002)', async () => {
  const { selfEmploymentTaxResults } = await import('../../src/components/self-employment-tax-results.js');
  const view = runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '50000', w2Wages: '184500', w2MedicareWages: '300000' }).view;
  const markup = String(selfEmploymentTaxResults(view));
  assert.ok(markup.includes('Form 8959 Part I'));
  assert.ok(markup.includes('$100,000.00 of wages'));
});

test('half-cent amounts round up and under-$400 wording never shows $400.00 (review A2-003, A2-004)', async () => {
  const { selfEmploymentTaxResults } = await import('../../src/components/self-employment-tax-results.js');
  const mixed = String(selfEmploymentTaxResults(runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '150000', w2Wages: '100000' }).view));
  assert.ok(mixed.includes('$346.73'));
  const small = String(selfEmploymentTaxResults(runSelfEmploymentTaxCalculator({ ...SE_TAX_DEFAULTS, netProfit: '433.13' }).view));
  assert.ok(small.includes('Net earnings of $399.99 are under $400'));
});
