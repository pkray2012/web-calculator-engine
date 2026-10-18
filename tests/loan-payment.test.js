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

test('tiny positive rates converge to the zero-rate payment', () => {
  // First-order expansion: P/n × (1 + r(n + 1)/2) for a monthly rate r near zero.
  for (const annualRate of [1e-14, 1e-12, 1e-10, 1e-7]) {
    const r = annualRate / 1200;
    const expected = (25000 / 60) * (1 + r * 61 / 2);
    const payment = monthlyPayment({ principal: 25000, annualRate, termMonths: 60 });
    assert.ok(Number.isFinite(payment), `rate ${annualRate} gave ${payment}`);
    assert.ok(Math.abs(payment - expected) < 1e-9, `rate ${annualRate} gave ${payment}`);
  }
});

test('payment discounts back to the principal (8%, 60 months)', () => {
  const payment = monthlyPayment({ principal: 25000, annualRate: 8, termMonths: 60 });
  const r = 0.08 / 12;
  let presentValue = 0;
  for (let k = 1; k <= 60; k += 1) presentValue += payment / (1 + r) ** k;
  assert.ok(Math.abs(presentValue - 25000) < 1e-7);
});

test('payment is monotonic in the rate near zero', () => {
  const rates = [0, 1e-12, 1e-9, 1e-6, 1e-3, 0.1, 1];
  const payments = rates.map((annualRate) => monthlyPayment({ principal: 25000, annualRate, termMonths: 60 }));
  for (let i = 1; i < payments.length; i += 1) assert.ok(payments[i] >= payments[i - 1]);
});

test('tiny-rate schedule pays off over the full term', () => {
  const schedule = amortizationSchedule({ principal: 25000, annualRate: 1e-14, termMonths: 60 });
  assert.equal(schedule.length, 60);
  assert.ok(schedule.at(-1).balance <= 0.005);
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
