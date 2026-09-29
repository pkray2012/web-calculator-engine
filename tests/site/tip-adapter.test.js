import test from 'node:test';
import assert from 'node:assert/strict';

import { parseTipForm, runTipCalculator, TIP_DEFAULTS } from '../../src/adapters/tip.js';
import { tipResults, tipQuickResult, tipAnnouncement } from '../../src/components/tip-results.js';
import { tipForm, TIP_FIELD_IDS } from '../../src/components/tip-form.js';

function view(values) {
  const result = runTipCalculator({ ...TIP_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default: $86.40, 20%, three ways', () => {
  const result = view({});
  const markup = String(tipResults(result));
  assert.match(markup, /Each person pays/);
  assert.match(markup, /\$34\.56/);
  assert.match(markup, /\$17\.28/);
  assert.match(markup, /class="is-selected" aria-current="true">\s*<th scope="row">20%/);
  assert.match(String(tipQuickResult(result)), /<strong>\$34\.56 each<\/strong> \(\$17\.28 tip, \$103\.68 total\)/);
  assert.equal(tipAnnouncement(result), 'Tip $17.28, total $103.68, $34.56 each for 3 people.');
});

test('one person, pre-tax, rounding and uneven splits', () => {
  const solo = String(tipResults(view({ people: '1' })));
  assert.match(solo, /Total with tip/);
  assert.doesNotMatch(solo, /Each person/);
  assert.match(String(tipResults(view({ people: '1', tax: '6.40', tipOnPreTax: 'on' }))), /\$80\.00 before tax/);
  assert.match(String(tipResults(view({ roundUp: 'on' }))), /21\.5% of \$86\.40 after rounding up/);
  assert.match(String(tipResults(view({ bill: '100', tipPercent: '15' }))), /come to \$115\.02, \$0\.02 more than the total/);
});

test('pre-tax box without a tax amount tips on the full bill', () => {
  assert.equal(parseTipForm({ ...TIP_DEFAULTS, tipOnPreTax: 'on' }).input.tipOnPreTax, false);
});

test('validation messages', () => {
  const bad = parseTipForm({ ...TIP_DEFAULTS, bill: '', tipPercent: '120', people: '2.5' });
  assert.equal(bad.errors.bill, 'Bill is required.');
  assert.equal(bad.errors.tipPercent, 'Tip must be 100 or less.');
  assert.equal(bad.errors.people, 'People must be a whole number.');
  assert.equal(parseTipForm({ ...TIP_DEFAULTS, tax: '90' }).errors.tax, 'Tax on the bill cannot be more than the bill.');
});

test('form labels every field', () => {
  const markup = String(tipForm(TIP_DEFAULTS, { bill: 'Bill is required.' }));
  for (const id of Object.values(TIP_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /aria-invalid="true"/);
});
