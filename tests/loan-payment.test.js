import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPayment, amortizationSchedule, calculateLoan } from '../src/calculators/loan-payment.js';

test('calculates a standard 30-year 6.5% payment', () => {
  const payment = monthlyPayment({ principal: 300000, annualRate: 6.5, termMonths: 360 });
  assert.ok(Math.abs(payment - 1896.20) < 0.02);
});

test('handles zero-interest loans exactly', () => {
  assert.equal(monthlyPayment({ principal: 12000, annualRate: 0, termMonths: 12 }), 1000);
});

test('amortization reaches zero', () => {
  const schedule = amortizationSchedule({ principal: 25000, annualRate: 10.5, termMonths: 60 });
  assert.equal(schedule.length, 60);
  assert.ok(schedule.at(-1).balance <= 0.005);
  assert.ok(schedule.every((row) => row.payment > 0));
});

test('interest plus principal equals payment', () => {
  const schedule = amortizationSchedule({ principal: 25000, annualRate: 10.5, termMonths: 60 });
  for (const row of schedule) {
    assert.ok(Math.abs((row.principal + row.interest) - row.payment) < 1e-9);
  }
});

test('extra payment reduces time and interest', () => {
  const result = calculateLoan({ principal: 300000, annualRate: 6.5, termMonths: 360, extraMonthly: 200 });
  assert.ok(result.accelerated.payments < result.scheduledPayments);
  assert.ok(result.accelerated.totalInterest < result.totalInterest);
  assert.ok(result.accelerated.interestSaved > 0);
});

test('rejects invalid principal', () => {
  assert.throws(() => monthlyPayment({ principal: 0, annualRate: 6, termMonths: 60 }), /principal/);
  assert.throws(() => monthlyPayment({ principal: -1, annualRate: 6, termMonths: 60 }), /principal/);
});

test('rejects negative rate and invalid term', () => {
  assert.throws(() => monthlyPayment({ principal: 10000, annualRate: -1, termMonths: 60 }), /annualRate/);
  assert.throws(() => monthlyPayment({ principal: 10000, annualRate: 6, termMonths: 0 }), /termMonths/);
  assert.throws(() => monthlyPayment({ principal: 10000, annualRate: 6, termMonths: 12.5 }), /termMonths/);
});

test('rejects negative extra payment', () => {
  assert.throws(() => calculateLoan({ principal: 10000, annualRate: 6, termMonths: 60, extraMonthly: -1 }), /extraMonthly/);
});
