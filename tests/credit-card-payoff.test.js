import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCreditCardPayoff } from '../src/calculators/credit-card-payoff.js';

test('requires a payoff mode', () => {
  assert.throws(() => calculateCreditCardPayoff({ balance: 1000, apr: 20 }), /monthlyPayment or targetMonths is required/);
});

test('calculates fixed payment payoff', () => {
  const result = calculateCreditCardPayoff({ balance: 1000, apr: 24, monthlyPayment: 100 });
  assert.equal(result.schedule[0].interest, 20);
  assert.equal(result.schedule[0].principal, 80);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('calculates target term payoff', () => {
  const result = calculateCreditCardPayoff({ balance: 1200, apr: 18, targetMonths: 12 });
  assert.equal(result.payoffMonths, 12);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('supports zero APR and zero balance', () => {
  const result = calculateCreditCardPayoff({ balance: 1200, apr: 0, targetMonths: 12 });
  assert.equal(result.monthlyPayment, 100);
  assert.equal(result.totalInterest, 0);
  const empty = calculateCreditCardPayoff({ balance: 0, apr: 24 });
  assert.equal(empty.payoffMonths, 0);
});

test('rejects simultaneous fixed-payment and target-term modes', () => {
  assert.throws(
    () => calculateCreditCardPayoff({ balance: 1200, apr: 18, monthlyPayment: 100, targetMonths: 12 }),
    /choose monthlyPayment or targetMonths, not both/
  );
});

test('validates supplied payoff modes even for a zero balance', () => {
  assert.throws(
    () => calculateCreditCardPayoff({ balance: 0, apr: 24, monthlyPayment: 0 }),
    /monthlyPayment must be greater than zero/
  );
  assert.throws(
    () => calculateCreditCardPayoff({ balance: 0, apr: 24, targetMonths: 0 }),
    /targetMonths must be a positive whole number/
  );
});

test('target mode ends exactly on the target month across awkward inputs', () => {
  for (const balance of [7531.27, 1234.56, 99999.99, 50]) {
    for (const apr of [0, 9.99, 21.49, 29.99, 36]) {
      for (const targetMonths of [1, 7, 12, 37, 60, 120]) {
        const result = calculateCreditCardPayoff({ balance, apr, targetMonths });
        assert.equal(result.payoffMonths, targetMonths, `${balance} @ ${apr}% in ${targetMonths}`);
        assert.ok(result.schedule.at(-1).balance <= 1e-8);
      }
    }
  }
});

test('fixed payment matches the closed-form payoff time and an independent simulation', () => {
  const balance = 5000;
  const apr = 22.99;
  const payment = 150;
  const result = calculateCreditCardPayoff({ balance, apr, monthlyPayment: payment });
  const i = apr / 1200;
  assert.equal(result.payoffMonths, Math.ceil(-Math.log(1 - i * balance / payment) / Math.log(1 + i)));
  let remaining = balance;
  let interest = 0;
  while (remaining > 1e-8) {
    const charge = remaining * i;
    remaining = remaining + charge - Math.min(payment, remaining + charge);
    interest += charge;
  }
  assert.ok(Math.abs(result.totalInterest - interest) < 1e-6);
  assert.ok(Math.abs(result.totalInterest - 3045.29) < 0.005);
});

test('a payment that only covers interest never pays off', () => {
  assert.throws(() => calculateCreditCardPayoff({ balance: 5000, apr: 24, monthlyPayment: 100 }), /exceed the first-period interest/);
  // $26 barely beats $25 of monthly interest: payoff would take over 1,200 months.
  assert.throws(() => calculateCreditCardPayoff({ balance: 10000, apr: 3, monthlyPayment: 26 }), /too small to reach payoff/);
});
