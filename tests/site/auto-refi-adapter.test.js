import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAutoRefiForm, runAutoRefiCalculator, AUTO_REFI_DEFAULTS } from '../../src/adapters/auto-loan-refinance.js';
import { autoRefinanceResults, autoRefinanceQuickResult, autoRefinanceAnnouncement } from '../../src/components/auto-refinance-results.js';
import { autoRefinanceForm, AUTO_REFI_FIELD_IDS } from '../../src/components/auto-refinance-form.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runAutoRefiCalculator({ ...AUTO_REFI_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches the hand-checked figures', () => {
  const result = view({});
  close(result.current.payment, 552.71);
  close(result.refinance.payment, 521.73);
  close(result.lifetimeSavings, 1187.04);
  assert.deepEqual(result.aheadWindow, { fromMonth: 6, untilMonth: null });
  close(result.keep.netSavings, 769.24);
});

test('horizon rows stop at the longer term and include the planned keep once', () => {
  const result = view({ newTermValue: '60', keepMonths: '30' });
  assert.deepEqual(result.horizon.map((row) => row.month), [6, 12, 18, 24, 30, 36, 48, 60]);
  assert.equal(result.horizon.filter((row) => row.isKeep).length, 1);
});

test('results render the verdicts for each case', () => {
  assert.match(String(autoRefinanceResults(view({}))), /comes out ahead from <strong>month 6<\/strong>/);
  assert.match(String(autoRefinanceResults(view({ newTermValue: '72' }))), /Ahead only for a while[\s\S]*2 years of extra payments/);
  assert.match(String(autoRefinanceResults(view({ newRate: '8.5', newTermValue: '72' }))), /never comes out ahead/);
  const markup = String(autoRefinanceResults(view({})));
  assert.match(markup, /id="auto-refi-horizon"/);
  assert.match(markup, /id="auto-refi-compare"/);
  assert.match(markup, /2 years \(your plan\)/);
  assert.match(String(autoRefinanceQuickResult(view({}))), /\$521\.73/);
  assert.match(autoRefinanceAnnouncement(view({})), /True break-even: From month 6/);
});

test('financed costs hide the simple break-even and raise the new principal', () => {
  const result = view({ prepaymentPenalty: '200', financeCosts: 'on' });
  close(result.refinance.principal, 22500);
  close(result.refinance.cashCosts, 0);
  assert.doesNotMatch(String(autoRefinanceResults(result)), /Simple break-even/);
});

test('invalid inputs return field errors keyed by form field', () => {
  const parsed = parseAutoRefiForm({ ...AUTO_REFI_DEFAULTS, currentBalance: '0', fees: '-5', keepMonths: '1.5', newTermValue: '11', newTermUnit: 'years' });
  assert.equal(parsed.ok, false);
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['currentBalance', 'fees', 'keepMonths', 'newTermValue']);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(autoRefinanceForm(AUTO_REFI_DEFAULTS, { newRate: 'Check the rate.' }));
  for (const id of Object.values(AUTO_REFI_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Check the rate\./);
  assert.match(markup, /aria-invalid="true"/);
});
