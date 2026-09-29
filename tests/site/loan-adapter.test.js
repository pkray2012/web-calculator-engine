import test from 'node:test';
import assert from 'node:assert/strict';

import { parseLoanForm, buildLoanView, runLoanCalculator, summarizeByYear, LOAN_DEFAULTS } from '../../src/adapters/loan-payment.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const parsed = parseLoanForm({ ...LOAN_DEFAULTS, ...values });
  assert.equal(parsed.ok, true, JSON.stringify(parsed.errors));
  return buildLoanView(parsed.input);
}

// Independent closed-form payment, written without the engine.
function referencePayment(principal, annualRatePct, months) {
  const r = annualRatePct / 1200;
  return r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
}

test('default example matches the closed-form payment', () => {
  const result = view({});
  close(result.monthlyPayment, 506.91);
  close(result.monthlyPayment, referencePayment(25000, 8, 60), 1e-9);
  close(result.totalInterest, 5414.59);
  assert.equal(result.payments, 60);
});

test('matches published reference: $300,000 at 6.5% for 30 years', () => {
  const result = view({ principal: '300000', annualRate: '6.5', termValue: '30' });
  close(result.monthlyPayment, 1896.20);
  assert.equal(result.payments, 360);
});

test('term entered in months and years produce the same loan', () => {
  const years = view({ termValue: '2.5', termUnit: 'years' });
  const months = view({ termValue: '30', termUnit: 'months' });
  assert.equal(years.input.termMonths, 30);
  assert.equal(months.monthlyPayment, years.monthlyPayment);
});

test('accepts formatted input such as "$25,000" and "6.5%"', () => {
  const parsed = parseLoanForm({ ...LOAN_DEFAULTS, principal: '$25,000', annualRate: '6.5%' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.input.principal, 25000);
  assert.equal(parsed.input.annualRate, 6.5);
});

test('zero-interest loan divides evenly with no interest', () => {
  const result = view({ principal: '12000', annualRate: '0', termValue: '12', termUnit: 'months' });
  assert.equal(result.monthlyPayment, 1000);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.principalShare, 1);
});

test('yearly summary sums to the monthly schedule and ends at zero', () => {
  const result = view({ principal: '40000', annualRate: '7.1', termValue: '67', termUnit: 'months' });
  const { monthly, yearly } = result.schedule;
  assert.equal(yearly.length, 6);
  close(yearly.reduce((sum, row) => sum + row.interest, 0), result.totalInterest, 1e-6);
  close(yearly.reduce((sum, row) => sum + row.principal, 0), 40000, 1e-6);
  assert.ok(yearly.at(-1).balance <= 0.005);
  assert.equal(monthly.length, 67);
});

test('summarizeByYear groups payments 1–12, 13–24 and a partial final year', () => {
  const rows = Array.from({ length: 14 }, (_, i) => ({ month: i + 1, payment: 10, principal: 7, interest: 3, balance: 100 - i }));
  const years = summarizeByYear(rows);
  assert.deepEqual(years.map((year) => year.payment), [120, 20]);
  assert.equal(years[1].balance, 87);
});

test('extra payment shortens payoff and is used for the schedule', () => {
  const result = view({ extraMonthly: '150', startMonth: '2027-01' });
  assert.equal(result.schedule.basis, 'with-extra');
  assert.ok(result.extra.payments < result.payments);
  close(result.extra.interestSaved, result.totalInterest - result.extra.totalInterest, 1e-9);
  assert.equal(result.schedule.monthly.length, result.extra.payments);
  assert.deepEqual(result.payoff, { year: 2031, month: 12 });
  assert.equal(result.extra.payoff.year * 12 + result.extra.payoff.month, 2027 * 12 + 1 + result.extra.payments - 1);
});

test('an extra payment larger than the balance pays off in one month', () => {
  const result = view({ principal: '1000', extraMonthly: '5000' });
  assert.equal(result.extra.payments, 1);
  close(result.extra.finalPayment, 1000 + 1000 * 0.08 / 12, 1e-9);
});

test('term comparison brackets the chosen term and marks it', () => {
  const middle = view({ termValue: '5' }).termComparison.map((row) => row.termMonths);
  assert.deepEqual(middle, [36, 48, 60, 72, 84]);
  const shortest = view({ termValue: '12', termUnit: 'months' }).termComparison;
  assert.deepEqual(shortest.map((row) => row.termMonths), [12, 24, 36]);
  assert.equal(shortest.find((row) => row.selected).termMonths, 12);
  const custom = view({ termValue: '50', termUnit: 'months' }).termComparison.map((row) => row.termMonths);
  assert.deepEqual(custom, [36, 48, 50, 60, 72]);
  const longest = view({ termValue: '30' }).termComparison;
  for (let i = 1; i < longest.length; i += 1) {
    assert.ok(longest[i].monthlyPayment < longest[i - 1].monthlyPayment);
    assert.ok(longest[i].totalInterest > longest[i - 1].totalInterest);
  }
});

test('rejects invalid inputs with field-specific messages', () => {
  const parsed = parseLoanForm({
    principal: '', annualRate: 'abc', termValue: '0', termUnit: 'years', extraMonthly: '-5', startMonth: '2026-13'
  });
  assert.equal(parsed.ok, false);
  assert.deepEqual(parsed.errors, {
    principal: 'Loan amount is required.',
    annualRate: 'Interest rate must be a number.',
    termValue: 'Loan term must be greater than 0.',
    extraMonthly: 'Extra monthly payment cannot be negative.',
    startMonth: 'First payment month must be a valid month.'
  });
});

test('rejects out-of-range and fractional-month terms', () => {
  const errors = (values) => parseLoanForm({ ...LOAN_DEFAULTS, ...values }).errors ?? {};
  assert.match(errors({ principal: '0' }).principal, /greater than 0/);
  assert.match(errors({ principal: '100000001' }).principal, /100,000,000 or less/);
  assert.match(errors({ annualRate: '101' }).annualRate, /100 or less/);
  assert.match(errors({ termValue: '51' }).termValue, /50 or less/);
  assert.match(errors({ termValue: '601', termUnit: 'months' }).termValue, /600 or less/);
  assert.match(errors({ termValue: '12.5', termUnit: 'months' }).termValue, /whole number/);
  assert.match(errors({ termValue: '2.51' }).termValue, /whole months/);
  assert.match(errors({ principal: '1e5' }).principal, /must be a number/);
});

test('blank optional fields fall back to defaults', () => {
  const parsed = parseLoanForm({ ...LOAN_DEFAULTS, extraMonthly: '', startMonth: '' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.input.extraMonthly, 0);
  assert.equal(parsed.input.startMonth, null);
});

test('large but realistic loan stays finite and amortizes to zero', () => {
  const result = view({ principal: '100000000', annualRate: '36', termValue: '600', termUnit: 'months' });
  assert.ok(Number.isFinite(result.monthlyPayment));
  assert.ok(result.schedule.monthly.at(-1).balance <= 0.005);
});

test('extreme rate and term combinations become a field error, not a crash', () => {
  const values = { ...LOAN_DEFAULTS, principal: '100000000', annualRate: '100', termValue: '600', termUnit: 'months' };
  assert.throws(() => buildLoanView(parseLoanForm(values).input), RangeError);
  const result = runLoanCalculator(values);
  assert.equal(result.ok, false);
  assert.match(result.errors.annualRate, /too extreme/);
  assert.equal(runLoanCalculator(LOAN_DEFAULTS).ok, true);
});
