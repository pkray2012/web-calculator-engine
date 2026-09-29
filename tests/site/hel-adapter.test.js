import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHelForm, runHelCalculator, HEL_DEFAULTS } from '../../src/adapters/home-equity-loan.js';
import { homeEquityLoanResults, homeEquityQuickResult, homeEquityAnnouncement } from '../../src/components/home-equity-loan-results.js';
import { homeEquityLoanForm, HEL_FIELD_IDS } from '../../src/components/home-equity-loan-form.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runHelCalculator({ ...HEL_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: payment, cash received, CLTV and limits', () => {
  const result = view({});
  close(result.monthlyPayment, 485.07);
  close(result.home.cashReceived, 48500);
  close(result.home.newCltv, 72.5);
  assert.deepEqual(result.home.limits.map((row) => row.capacity), [80000, 100000, 120000]);
  close(result.home.costOfBorrowing, result.totalInterest + 1500);
  assert.deepEqual(result.termComparison.map((row) => row.termMonths), [60, 120, 180, 240, 360]);
});

test('results explain the limit for fitting, partial and over-limit loans', () => {
  assert.match(String(homeEquityLoanResults(view({}))), /within all three common limits/);
  assert.match(String(homeEquityLoanResults(view({ loanAmount: '90000' }))), /caps at 80% would lend at most \$80,000\.00/);
  assert.match(String(homeEquityLoanResults(view({ loanAmount: '150000' }))), /above all three common limits/);
  const markup = String(homeEquityLoanResults(view({})));
  for (const id of ['hel-limits', 'hel-flow', 'summary-heading', 'terms-heading', 'schedule-heading']) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(String(homeEquityQuickResult(view({}))), /CLTV 72\.5%/);
  assert.match(homeEquityAnnouncement(view({})), /You receive \$48,500\.00/);
});

test('financed closing costs are repaid, not deducted', () => {
  const result = view({ financeClosingCosts: 'on' });
  close(result.input.principal, 51500);
  close(result.home.cashReceived, 50000);
  assert.match(String(homeEquityLoanResults(result)), /Closing costs, added to the loan/);
});

test('extra payments flow through the shared sections', () => {
  const result = view({ extraMonthly: '100', startMonth: '2026-11' });
  assert.ok(result.extra.interestSaved > 0);
  assert.ok(result.extra.payoff);
});

test('invalid inputs return field errors keyed by form field', () => {
  const parsed = parseHelForm({ ...HEL_DEFAULTS, homeValue: '0', mortgageBalance: '-1', termValue: '31' });
  assert.equal(parsed.ok, false);
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['homeValue', 'mortgageBalance', 'termValue']);
  const costs = parseHelForm({ ...HEL_DEFAULTS, closingCosts: '50000' });
  assert.match(costs.errors.closingCosts, /less than the loan amount/);
  assert.equal(parseHelForm({ ...HEL_DEFAULTS, closingCosts: '50000', financeClosingCosts: 'on' }).ok, true);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(homeEquityLoanForm(HEL_DEFAULTS, { homeValue: 'Check the value.' }));
  for (const id of Object.values(HEL_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Check the value\./);
  assert.match(markup, /aria-invalid="true"/);
});
