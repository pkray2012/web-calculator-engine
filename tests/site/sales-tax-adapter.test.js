import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSalesTaxForm, runSalesTaxCalculator, SALES_TAX_DEFAULTS } from '../../src/adapters/sales-tax.js';
import { salesTaxResults, salesTaxQuickResult, salesTaxAnnouncement } from '../../src/components/sales-tax-results.js';
import { salesTaxForm, SALES_TAX_FIELD_IDS } from '../../src/components/sales-tax-form.js';

function view(values) {
  const result = runSalesTaxCalculator({ ...SALES_TAX_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default: add 7.25% to $250', () => {
  const result = view({});
  const markup = String(salesTaxResults(result));
  assert.match(markup, /Total with tax/);
  assert.match(markup, /\$268\.13/);
  assert.match(markup, /\$18\.13/);
  assert.match(markup, /Tax before rounding: \$18\.1250/);
  assert.match(String(salesTaxQuickResult(result)), /<strong>\$268\.13<\/strong> with \$18\.13 tax/);
  assert.equal(salesTaxAnnouncement(result), 'Total with tax $268.13, including $18.13 sales tax.');
});

test('remove mode', () => {
  const result = view({ mode: 'remove' });
  const markup = String(salesTaxResults(result));
  assert.match(markup, /Price before tax/);
  assert.match(markup, /\$250\.00/);
  assert.match(markup, /\$268\.13 ÷ 1\.0725/);
  assert.equal(salesTaxAnnouncement(result), 'Price before tax $250.00; $18.13 of the total is sales tax.');
});

test('rate mode shows the rate and the range', () => {
  const result = view({ mode: 'rate' });
  const markup = String(salesTaxResults(result));
  assert.match(markup, /Your sales tax rate/);
  assert.match(markup, /7\.252%/);
  assert.match(markup, /any rate from 7\.25% to 7\.254%/);
  assert.match(String(salesTaxQuickResult(result)), /<strong>7\.252%<\/strong>/);
});

test('each mode validates only its own fields', () => {
  assert.deepEqual(parseSalesTaxForm({ ...SALES_TAX_DEFAULTS, total: 'x', ratePrice: '' }), { ok: true, input: { mode: 'add', price: 250, ratePercent: 7.25 } });
  const add = parseSalesTaxForm({ ...SALES_TAX_DEFAULTS, price: '', ratePercent: '101' });
  assert.equal(add.errors.price, 'Price before tax is required.');
  assert.equal(add.errors.ratePercent, 'Sales tax rate must be 100 or less.');
  const rate = parseSalesTaxForm({ ...SALES_TAX_DEFAULTS, mode: 'rate', ratePrice: '100', rateTotal: '90' });
  assert.equal(rate.errors.rateTotal, 'Total with tax cannot be less than the price before tax.');
  assert.equal(parseSalesTaxForm({ ...SALES_TAX_DEFAULTS, mode: 'rate', ratePrice: '0' }).errors.ratePrice, 'Price before tax must be greater than 0.');
  assert.equal(parseSalesTaxForm({ ...SALES_TAX_DEFAULTS, mode: 'bogus' }).input.mode, 'add');
});

test('form labels every field and marks errors', () => {
  const markup = String(salesTaxForm(SALES_TAX_DEFAULTS, { price: 'Price before tax is required.' }));
  for (const [name, id] of Object.entries(SALES_TAX_FIELD_IDS)) if (name !== 'mode') assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /id="tax-mode-add"[^>]*checked/);
  assert.match(markup, /aria-invalid="true"/);
});
