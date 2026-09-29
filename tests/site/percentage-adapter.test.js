import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePercentForm, runPercentCalculator, PERCENT_DEFAULTS } from '../../src/adapters/percentage.js';
import { percentResults, percentQuickResult, percentAnnouncement } from '../../src/components/percentage-results.js';
import { percentForm, PERCENT_FIELD_IDS } from '../../src/components/percentage-form.js';

function view(values) {
  const result = runPercentCalculator({ ...PERCENT_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default: 15% of 80', () => {
  const result = view({});
  assert.match(String(percentResults(result)), /15% of 80/);
  assert.match(String(percentQuickResult(result)), /15% of 80: <strong>12<\/strong>/);
  assert.equal(percentAnnouncement(result), '15% of 80: 12.');
});

test('what percent, change and off modes', () => {
  assert.match(String(percentQuickResult(view({ mode: 'is' }))), /18 out of 75: <strong>24%<\/strong>/);
  const change = String(percentResults(view({ mode: 'change' })));
  assert.match(change, /Percent increase/);
  assert.match(change, /\+25%/);
  assert.match(change, /-20%/);
  assert.match(change, /22\.2222%/);
  assert.match(String(percentResults(view({ mode: 'change', changeTo: '30' }))), /Percent decrease/);
  const off = String(percentResults(view({ mode: 'off', offExtra: '10' })));
  assert.match(off, /\$81\.00/);
  assert.match(off, /32\.5% off in total, not 35%/);
});

test('large and fractional results are formatted without float noise', () => {
  assert.match(String(percentQuickResult(view({ ofPercent: '0.1', ofValue: '0.3' }))), /<strong>0\.0003<\/strong>/);
  assert.match(String(percentQuickResult(view({ ofPercent: '7', ofValue: '1234567' }))), /<strong>86,419\.69<\/strong>/);
});

test('validation: zero whole or zero start, discounts over 100%', () => {
  assert.equal(parsePercentForm({ ...PERCENT_DEFAULTS, mode: 'is', isWhole: '0' }).errors.isWhole, 'Whole cannot be 0.');
  assert.match(parsePercentForm({ ...PERCENT_DEFAULTS, mode: 'change', changeFrom: '0' }).errors.changeFrom, /cannot be 0/);
  assert.equal(parsePercentForm({ ...PERCENT_DEFAULTS, mode: 'off', offPercent: '120' }).errors.offPercent, 'Discount must be 100 or less.');
  assert.equal(parsePercentForm({ ...PERCENT_DEFAULTS, ofValue: '' }).errors.ofValue, 'Number is required.');
  assert.deepEqual(parsePercentForm({ ...PERCENT_DEFAULTS, isWhole: '0' }).input, { mode: 'of', percent: 15, of: 80 });
});

test('form labels every field', () => {
  const markup = String(percentForm(PERCENT_DEFAULTS, { ofValue: 'Number is required.' }));
  for (const [name, id] of Object.entries(PERCENT_FIELD_IDS)) if (name !== 'mode') assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /id="pct-mode-of"[^>]*checked/);
  assert.match(markup, /aria-invalid="true"/);
});
