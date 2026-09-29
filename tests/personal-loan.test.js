import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePersonalLoan } from '../src/calculators/personal-loan.js';

test('calculates origination fee, net proceeds, and fee-adjusted APR', () => {
  const result = calculatePersonalLoan({
    loanAmount: 10000,
    originationFeeRate: 2,
    annualRate: 10,
    termMonths: 36
  });

  assert.equal(result.originationFee, 200);
  assert.equal(result.amountReceived, 9800);
  assert.ok(Math.abs(result.monthlyPayment - 322.67) < 0.02);
  // The fee is withheld from the proceeds and repaid inside the principal, so the
  // total repaid is the payment stream alone (36 × $322.67), not payments + fee.
  assert.ok(Math.abs(result.totalCost - 11616.19) < 0.05);
  assert.ok(Math.abs(result.costOfBorrowing - 1816.19) < 0.05);
  assert.ok(Math.abs(result.effectiveAPR - 11.39) < 0.02);
});

test('zero-fee personal loan has effective APR equal to note rate', () => {
  const result = calculatePersonalLoan({
    loanAmount: 25000,
    annualRate: 8,
    termMonths: 60
  });

  assert.equal(result.originationFee, 0);
  assert.equal(result.amountReceived, 25000);
  assert.ok(Math.abs(result.totalCost - result.totalRepayment) < 1e-9);
  assert.ok(Math.abs(result.effectiveAPR - 8) < 1e-9);
});

test('zero-rate loan with a fee produces a fee-driven effective APR', () => {
  const result = calculatePersonalLoan({
    loanAmount: 12000,
    originationFeeRate: 5,
    annualRate: 0,
    termMonths: 12
  });

  assert.equal(result.amountReceived, 11400);
  assert.equal(result.monthlyPayment, 1000);
  assert.ok(result.effectiveAPR > 0);
});

test('extra payment reduces interest and payoff time', () => {
  const result = calculatePersonalLoan({
    loanAmount: 25000,
    originationFeeRate: 3,
    annualRate: 12,
    termMonths: 60,
    extraMonthly: 100
  });

  assert.ok(result.accelerated.payments < result.scheduledPayments);
  assert.ok(result.accelerated.totalInterest < result.totalInterest);
  assert.ok(result.accelerated.interestSaved > 0);
});

test('rejects invalid fee and loan inputs', () => {
  assert.throws(() => calculatePersonalLoan({ loanAmount: 0, annualRate: 8, termMonths: 36 }), /loanAmount/);
  assert.throws(() => calculatePersonalLoan({ loanAmount: 10000, originationFeeRate: -1, annualRate: 8, termMonths: 36 }), /originationFeeRate/);
  assert.throws(() => calculatePersonalLoan({ loanAmount: 10000, originationFeeRate: 100, annualRate: 8, termMonths: 36 }), /amount received/);
  assert.throws(() => calculatePersonalLoan({ loanAmount: 10000, annualRate: -1, termMonths: 36 }), /annualRate/);
});

test('cost of borrowing is interest plus fee and the fee is not counted twice', () => {
  const result = calculatePersonalLoan({ loanAmount: 10000, originationFeeRate: 5, annualRate: 12, termMonths: 36 });
  assert.ok(Math.abs(result.totalCost - result.totalRepayment) < 1e-9);
  assert.ok(Math.abs(result.costOfBorrowing - (result.totalInterest + result.originationFee)) < 1e-9);
  assert.ok(Math.abs(result.costOfBorrowing - (result.totalCost - result.amountReceived)) < 1e-9);
  // Independent reference: Newton-solved monthly IRR on net proceeds of $9,500.
  assert.ok(Math.abs(result.effectiveAPR - 15.6052) < 0.0005);
});

test('paying extra early raises the effective rate of a withheld fee', () => {
  const base = calculatePersonalLoan({ loanAmount: 25000, originationFeeRate: 6, annualRate: 11, termMonths: 60 });
  const extra = calculatePersonalLoan({ loanAmount: 25000, originationFeeRate: 6, annualRate: 11, termMonths: 60, extraMonthly: 300 });
  assert.equal(base.accelerated.effectiveAPR, base.effectiveAPR);
  assert.equal(extra.effectiveAPR, base.effectiveAPR);
  assert.ok(extra.accelerated.effectiveAPR > extra.effectiveAPR);
  assert.ok(Math.abs(extra.accelerated.costOfBorrowing - (extra.accelerated.totalInterest + extra.originationFee)) < 1e-9);
});

test('with no fee the effective rate stays at the note rate even when paying extra', () => {
  const result = calculatePersonalLoan({ loanAmount: 8000, annualRate: 9, termMonths: 48, extraMonthly: 150 });
  assert.ok(Math.abs(result.accelerated.effectiveAPR - 9) < 1e-6);
});
