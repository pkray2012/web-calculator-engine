import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCdForm, runCdCalculator, CD_DEFAULTS } from '../../src/adapters/certificate-of-deposit.js';
import { cdResults, cdQuickResult, cdAnnouncement } from '../../src/components/cd-results.js';
import { cdForm, CD_FIELD_IDS } from '../../src/components/cd-form.js';

function view(values) {
  const result = runCdCalculator({ ...CD_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: $10,000 at 4.00% APY for 18 months', () => {
  const result = view({});
  // 10,000 × 1.04^1.5, checked against an independent calculation.
  assert.ok(Math.abs(result.maturityValue - 10605.960588272994) < 1e-6);
  assert.equal(result.earlyWithdrawal, null);
  assert.equal(result.maturityMonth, null);
  assert.match(String(cdQuickResult(result)), /\$10,605\.96/);
  assert.equal(cdAnnouncement(result), 'Your CD grows to $10,605.96 after 1 year, 6 months, earning $605.96 of interest.');
  const markup = String(cdResults(result));
  assert.match(markup, /id="cd-growth"/);
  assert.match(markup, /id="cd-compounding"/);
  assert.doesNotMatch(markup, /id="cd-early"/);
});

test('opening month gives the maturity month; years convert to months', () => {
  assert.deepEqual(view({ openMonth: '2026-10' }).maturityMonth, { year: 2028, month: 4 });
  assert.equal(view({ termValue: '2', termUnit: 'years' }).input.termMonths, 24);
});

test('early withdrawal and tax appear when filled in', () => {
  const result = view({ withdrawMonth: '6', taxPercent: '24' });
  assert.equal(result.earlyWithdrawal.month, 6);
  assert.ok(Math.abs(result.afterTaxInterest - result.interest * 0.76) < 1e-9);
  const markup = String(cdResults(result));
  assert.match(markup, /id="cd-early"/);
  assert.match(markup, /after 24% tax/);
});

test('errors: cashing in at or after maturity, bad month, missing deposit', () => {
  assert.match(parseCdForm({ ...CD_DEFAULTS, withdrawMonth: '18' }).errors.withdrawMonth, /before the CD matures/);
  assert.deepEqual(Object.keys(parseCdForm({ ...CD_DEFAULTS, openMonth: '2026-13' }).errors), ['openMonth']);
  assert.deepEqual(Object.keys(parseCdForm({ ...CD_DEFAULTS, deposit: '' }).errors), ['deposit']);
});

test('unknown rate type and compounding fall back to APY and daily', () => {
  const parsed = parseCdForm({ ...CD_DEFAULTS, rateType: 'x', compounding: 'hourly' });
  assert.equal(parsed.input.rateType, 'apy');
  assert.equal(parsed.input.compounding, 'daily');
});

test('form renders every field id', () => {
  const markup = String(cdForm());
  for (const id of Object.values(CD_FIELD_IDS).filter((id) => id !== CD_FIELD_IDS.rateType && id !== CD_FIELD_IDS.compounding)) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(markup, /id="cd-rate-apy" name="rateType" type="radio" value="apy" checked/);
  assert.match(markup, /id="cd-comp-daily" name="compounding" type="radio" value="daily" checked/);
});
