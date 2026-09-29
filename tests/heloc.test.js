import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHeloc } from '../src/calculators/heloc.js';

test('calculates an interest-only draw and amortizing repayment', () => {
  const result = calculateHeloc({
    balance: 75000,
    annualRate: 9,
    drawMonths: 120,
    repaymentMonths: 240
  });

  assert.ok(Math.abs(result.drawPayment - 562.5) < 1e-9);
  assert.ok(Math.abs(result.repaymentPayment - 674.7944668876) < 1e-9);
  assert.ok(Math.abs(result.paymentShock - (result.repaymentPayment - result.drawPayment)) < 1e-9);
  assert.equal(result.repaymentStartingBalance, 75000);
  assert.equal(result.drawSchedule.length, 120);
  assert.equal(result.repaymentSchedule.length, 240);
});

test('principal-and-interest draw payments carry the same amortizing payment into repayment', () => {
  const result = calculateHeloc({
    balance: 75000,
    annualRate: 9,
    drawMonths: 120,
    repaymentMonths: 240,
    drawPaymentType: 'principalAndInterest'
  });

  assert.ok(result.repaymentStartingBalance < 75000);
  assert.ok(Math.abs(result.repaymentPayment - result.drawPayment) < 1e-9);
});

test('rate scenarios increase payment when rate rises', () => {
  const result = calculateHeloc({
    balance: 50000,
    annualRate: 8,
    drawMonths: 120,
    repaymentMonths: 240,
    rateScenarios: [9, 10]
  });

  assert.equal(result.scenarios.length, 3);
  assert.ok(result.scenarios[1].repaymentPayment > result.scenarios[0].repaymentPayment);
  assert.ok(result.scenarios[2].repaymentPayment > result.scenarios[1].repaymentPayment);
});

test('zero-rate HELOC amortizes without division errors', () => {
  const result = calculateHeloc({
    balance: 12000,
    annualRate: 0,
    drawMonths: 12,
    repaymentMonths: 12
  });

  assert.equal(result.drawPayment, 0);
  assert.equal(result.repaymentPayment, 1000);
  assert.equal(result.paymentShockPercent, null);
  assert.equal(result.repaymentStartingBalance, 12000);
});

test('rejects invalid HELOC inputs', () => {
  assert.throws(() => calculateHeloc({ balance: 0, annualRate: 8, drawMonths: 120, repaymentMonths: 240 }), /balance/);
  assert.throws(() => calculateHeloc({ balance: 10000, annualRate: -1, drawMonths: 120, repaymentMonths: 240 }), /annualRate/);
  assert.throws(() => calculateHeloc({ balance: 10000, annualRate: 8, drawMonths: 0, repaymentMonths: 240 }), /drawMonths/);
  assert.throws(() => calculateHeloc({ balance: 10000, annualRate: 8, drawMonths: 120, repaymentMonths: 0 }), /repaymentMonths/);
  assert.throws(() => calculateHeloc({ balance: 10000, annualRate: 8, drawMonths: 120, repaymentMonths: 240, drawPaymentType: 'fixed' }), /drawPaymentType/);
});
