import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePayoffForm, runPayoffCalculator, PAYOFF_DEFAULTS } from '../../src/adapters/loan-payoff.js';
import { loanPayoffResults, loanPayoffQuickResult, loanPayoffAnnouncement } from '../../src/components/loan-payoff-results.js';
import { loanPayoffForm, PAYOFF_FIELD_IDS } from '../../src/components/loan-payoff-form.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runPayoffCalculator({ ...PAYOFF_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: $200 a month extra', () => {
  const result = view({});
  assert.equal(result.base.months, 347);
  assert.equal(result.plan.months, 259);
  close(result.interestSaved, 89760.86);
  close(result.plan.totalExtra, 51600);
  assert.equal(result.plan.yearly.length, 22);
});

test('target mode solves the extra, ignores the monthly extra field and restores dates', () => {
  const result = view({ mode: 'target', targetYears: '15', startMonth: '2026-11' });
  assert.equal(result.plan.months, 180);
  close(result.target.extraMonthly, 577.77);
  assert.deepEqual(result.plan.payoff, { year: 2041, month: 10 });
  assert.match(String(loanPayoffResults(result)), /Extra needed each month/);
  assert.match(String(loanPayoffResults(result)), /October 2041/);
  assert.match(String(loanPayoffResults(view({ mode: 'target', targetYears: '40' }))), /No extra monthly payment is needed/);
});

test('results cover no-extra and lump-sum plans', () => {
  assert.match(String(loanPayoffResults(view({ extraMonthly: '' }))), /Add an extra payment to see what it saves/);
  const lump = view({ extraMonthly: '', lumpSum: '10000', lumpSumMonth: '1' });
  close(lump.interestSaved, 48691.05);
  const markup = String(loanPayoffResults(lump));
  assert.match(markup, /id="payoff-compare"/);
  assert.match(markup, /id="payoff-schedule"/);
  assert.match(String(loanPayoffQuickResult(lump)), /saves \$48,691\.05/);
  assert.match(loanPayoffAnnouncement(view({ mode: 'target' })), /Extra needed each month/);
});

test('invalid inputs return field errors keyed by form field', () => {
  const parsed = parsePayoffForm({ ...PAYOFF_DEFAULTS, balance: '0', extraMonthly: '-5', lumpSumMonth: '0' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['balance', 'extraMonthly', 'lumpSumMonth']);
  assert.match(parsePayoffForm({ ...PAYOFF_DEFAULTS, payment: '1000' }).errors.payment, /does not cover the monthly interest of about \$1354\.17/);
  assert.match(parsePayoffForm({ ...PAYOFF_DEFAULTS, mode: 'target', targetYears: '7.3' }).errors.targetYears, /whole months/);
  assert.equal(parsePayoffForm({ ...PAYOFF_DEFAULTS, mode: 'target', extraMonthly: '-5' }).ok, true);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(loanPayoffForm(PAYOFF_DEFAULTS, { payment: 'Too low.' }));
  for (const id of Object.values(PAYOFF_FIELD_IDS).filter((id) => id !== PAYOFF_FIELD_IDS.mode)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /for="payoff-mode-target"/);
  assert.match(markup, /Too low\./);
  assert.match(markup, /aria-invalid="true"/);
});
