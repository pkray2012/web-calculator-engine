import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMarginForm, runMarginCalculator, MARGIN_DEFAULTS } from '../../src/adapters/margin.js';
import { marginResults, marginQuickResult, marginAnnouncement } from '../../src/components/margin-results.js';
import { marginForm, MARGIN_FIELD_IDS } from '../../src/components/margin-form.js';

function view(values) {
  const result = runMarginCalculator({ ...MARGIN_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default: $30 cost, $50 price', () => {
  const result = view({});
  const markup = String(marginResults(result));
  assert.match(markup, /Your margin and markup/);
  assert.match(markup, /40%/);
  assert.match(markup, /66\.67%/);
  assert.match(markup, /\$20\.00 profit on a \$50\.00 sale/);
  assert.doesNotMatch(markup, /Break-even/);
  assert.match(String(marginQuickResult(result)), /<strong>40% margin<\/strong>, 66\.67% markup/);
  assert.equal(marginAnnouncement(result), 'Profit margin 40%, markup 66.67%.');
});

test('target margin and markup modes find the price; fixed costs add break-even', () => {
  const byMargin = String(marginResults(view({ mode: 'margin', fixedCosts: '5000' })));
  assert.match(byMargin, /Your selling price/);
  assert.match(byMargin, /\$50\.00/);
  assert.match(byMargin, /250 units/);
  const byMarkup = view({ mode: 'markup' });
  assert.match(String(marginQuickResult(byMarkup)), /Sell at <strong>\$45\.00<\/strong> for a 33\.33% margin \(50% markup\)/);
});

test('a price below cost is reported as a loss with no break-even', () => {
  const markup = String(marginResults(view({ price: '25', fixedCosts: '100' })));
  assert.match(markup, /Loss per unit/);
  assert.match(markup, /each sale loses money/);
  assert.match(markup, /no break-even point/);
});

test('each mode validates only its own fields', () => {
  assert.deepEqual(parseMarginForm({ ...MARGIN_DEFAULTS, marginPercent: 'x', markupPercent: '' }), { ok: true, input: { mode: 'cp', cost: 30, price: 50, fixedCosts: 0 } });
  const bad = parseMarginForm({ ...MARGIN_DEFAULTS, mode: 'margin', cost: '0', marginPercent: '100' });
  assert.equal(bad.errors.cost, 'Cost must be greater than 0.');
  assert.equal(bad.errors.marginPercent, 'Target margin must be 99.99 or less.');
  assert.equal(parseMarginForm({ ...MARGIN_DEFAULTS, price: '' }).errors.price, 'Selling price is required.');
});

test('form labels every field and marks errors', () => {
  const markup = String(marginForm(MARGIN_DEFAULTS, { cost: 'Cost is required.' }));
  for (const [name, id] of Object.entries(MARGIN_FIELD_IDS)) if (name !== 'mode') assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /id="margin-mode-cp"[^>]*checked/);
  assert.match(markup, /aria-invalid="true"/);
});
