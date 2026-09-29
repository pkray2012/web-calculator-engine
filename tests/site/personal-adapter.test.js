import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePersonalForm, runPersonalCalculator, PERSONAL_DEFAULTS } from '../../src/adapters/personal-loan.js';
import { personalLoanResults } from '../../src/components/personal-loan-results.js';
import { personalLoanForm } from '../../src/components/personal-loan-form.js';
import { formatCurrency } from '../../src/lib/format.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent references, written without the engines.
function payment(principal, apr, months) {
  const r = apr / 1200;
  return r === 0 ? principal / months : principal * r / (1 - (1 + r) ** -months);
}
function levelAnnuityApr(net, pmt, months) {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    const pv = pmt * (1 - (1 + mid) ** -months) / mid;
    if (pv > net) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2 * 1200;
}

function view(values) {
  const result = runPersonalCalculator({ ...PERSONAL_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches independent payment, proceeds, cost and APR', () => {
  const result = view({});
  const pmt = payment(15000, 12, 36);
  close(result.monthlyPayment, pmt);
  close(result.monthlyPayment, 498.21, 0.005);
  close(result.fee.amount, 750);
  close(result.fee.amountReceived, 14250);
  close(result.fee.totalRepaid, pmt * 36, 1e-6);
  close(result.fee.costOfBorrowing, pmt * 36 - 14250, 1e-6);
  close(result.fee.effectiveAPR, levelAnnuityApr(14250, pmt, 36), 1e-4);
});

test('zero fee: cash received is the loan amount and APR equals the rate', () => {
  const result = view({ originationFeeRate: '0' });
  close(result.fee.amountReceived, 15000);
  close(result.fee.effectiveAPR, 12, 1e-6);
  close(result.fee.costOfBorrowing, result.totalInterest, 1e-9);
  assert.match(String(personalLoanResults(result)), /fee-adjusted APR equals the interest rate/);
});

test('blank fee counts as zero; fractional fee percentages work', () => {
  const blank = parsePersonalForm({ ...PERSONAL_DEFAULTS, originationFeeRate: '' });
  assert.equal(blank.ok, true);
  assert.equal(blank.input.originationFeeRate, 0);
  const result = view({ originationFeeRate: '4.75' });
  close(result.fee.amount, 712.5);
});

test('minimum sensible loan and unusual terms calculate', () => {
  const small = view({ loanAmount: '500', termValue: '6', termUnit: 'months' });
  close(small.monthlyPayment, payment(500, 12, 6));
  assert.equal(small.schedule.monthly.length, 6);
  const odd = view({ termValue: '2.5' });
  assert.equal(odd.input.termMonths, 30);
  assert.deepEqual(odd.termComparison.map((row) => row.termMonths), [12, 24, 30, 36, 48, 60, 72, 84]);
});

test('term comparison: fee-adjusted APR falls as the term lengthens', () => {
  const rows = view({}).termComparison;
  for (let i = 1; i < rows.length; i += 1) {
    assert.ok(rows[i].effectiveAPR < rows[i - 1].effectiveAPR);
    assert.ok(rows[i].totalInterest > rows[i - 1].totalInterest);
  }
  const markup = String(personalLoanResults(view({})));
  assert.match(markup, /<th scope="col" class="num">Fee-adjusted APR<\/th>/);
});

test('extra payments save interest but raise the effective rate of the fee', () => {
  const result = view({ extraMonthly: '200' });
  assert.ok(result.extra.interestSaved > 0);
  assert.ok(result.fee.withExtra.effectiveAPR > result.fee.effectiveAPR);
  close(result.fee.withExtra.costOfBorrowing, result.extra.totalInterest + result.fee.amount, 1e-9);
  assert.match(String(personalLoanResults(result)), /fee is not refunded when you pay early/);
});

test('invalid inputs produce field-specific messages', () => {
  const parsed = parsePersonalForm({
    loanAmount: '0', originationFeeRate: '60', annualRate: 'x', termValue: '31', termUnit: 'years', extraMonthly: '-1', startMonth: '2026-00'
  });
  assert.equal(parsed.ok, false);
  assert.deepEqual(parsed.errors, {
    loanAmount: 'Loan amount must be greater than 0.',
    originationFeeRate: 'Origination fee must be 50 or less.',
    annualRate: 'Interest rate must be a number.',
    termValue: 'Loan term must be 30 or less.',
    extraMonthly: 'Extra monthly payment cannot be negative.',
    startMonth: 'First payment month must be a valid month.'
  });
});

test('the largest allowed inputs still calculate with finite results', () => {
  const large = view({ loanAmount: '10000000', annualRate: '36', termValue: '30' });
  assert.ok(Number.isFinite(large.fee.effectiveAPR));
  assert.ok(large.schedule.monthly.at(-1).balance <= 0.005);
  // Every limit at once: $10M, 50% fee, 100% rate, 360 months, extra payment.
  const extreme = view({ loanAmount: '10000000', originationFeeRate: '50', annualRate: '100', termValue: '360', termUnit: 'months', extraMonthly: '1000' });
  for (const value of [extreme.monthlyPayment, extreme.fee.effectiveAPR, extreme.fee.withExtra.effectiveAPR, extreme.fee.costOfBorrowing]) {
    assert.ok(Number.isFinite(value));
  }
  assert.ok(extreme.fee.effectiveAPR > 100);
});

test('rounding: displayed figures are cents of full-precision values', () => {
  const result = view({ loanAmount: '12345.67', originationFeeRate: '3.3', annualRate: '9.99', termValue: '47', termUnit: 'months' });
  const markup = String(personalLoanResults(result));
  for (const value of [result.monthlyPayment, result.fee.amountReceived, result.fee.costOfBorrowing, result.fee.totalRepaid]) {
    assert.ok(markup.includes(formatCurrency(value)), `missing ${formatCurrency(value)}`);
  }
  assert.doesNotMatch(markup, /&quot;|NaN|Infinity/);
});

test('form labels every field and wires the term unit', () => {
  const markup = String(personalLoanForm());
  for (const id of ['loan-amount', 'origination-fee', 'interest-rate', 'term', 'term-unit', 'extra-monthly', 'start-month']) {
    assert.match(markup, new RegExp(`<label[^>]*for="${id}"`));
  }
  assert.match(markup, /<option value="years" selected>/);
});

test('the note rate is never labeled as the APR', () => {
  const markup = String(personalLoanResults(view({})));
  assert.match(markup, /36 payments at 12% interest/);
  assert.doesNotMatch(markup, /payments at 12% APR/);
});
