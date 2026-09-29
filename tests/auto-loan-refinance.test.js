import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateAutoLoanRefinance } from '../src/calculators/auto-loan-refinance.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent month-by-month simulation, written without the engines.
function payment(principal, rate, n) {
  const i = rate / 1200;
  return i === 0 ? principal / n : principal * i / (1 - (1 + i) ** -n);
}
function simulate(principal, rate, n, horizon) {
  const i = rate / 1200;
  const pay = payment(principal, rate, n);
  let balance = principal;
  let paid = 0;
  const cost = [];
  for (let month = 1; month <= horizon; month += 1) {
    if (month <= n) {
      const due = Math.min(pay, balance * (1 + i));
      balance = balance * (1 + i) - due;
      paid += due;
    }
    cost.push(paid + Math.max(balance, 0));
  }
  return { pay, cost, totalPaid: paid };
}
function reference({ currentBalance, currentRate, currentTermMonths, newRate, newTermMonths, fees = 0, prepaymentPenalty = 0, financeCosts = false }) {
  const costs = fees + prepaymentPenalty;
  const horizon = Math.max(currentTermMonths, newTermMonths);
  const keep = simulate(currentBalance, currentRate, currentTermMonths, horizon);
  const refi = simulate(currentBalance + (financeCosts ? costs : 0), newRate, newTermMonths, horizon);
  const upfront = financeCosts ? 0 : costs;
  const net = keep.cost.map((value, index) => value - refi.cost[index] - upfront);
  const first = net.findIndex((value) => value > 0);
  return { keep, refi, net, firstAhead: first === -1 ? null : first + 1, lifetime: keep.totalPaid - refi.totalPaid - upfront };
}

const EXAMPLE = { currentBalance: 22000, currentRate: 9.5, currentTermMonths: 48, newRate: 6.5, newTermMonths: 48, fees: 300 };

test('hand-checked example: same term, lower rate, cash fees', () => {
  const result = calculateAutoLoanRefinance(EXAMPLE);
  close(result.currentPayment, 552.71, 0.005);
  close(result.newPayment, 521.73, 0.005);
  close(result.monthlySavings, 30.98, 0.005);
  close(result.simpleBreakEvenMonths, 300 / result.monthlySavings);
  const ref = reference(EXAMPLE);
  assert.equal(result.aheadWindow.fromMonth, ref.firstAhead);
  assert.equal(result.aheadWindow.untilMonth, null);
  close(result.lifetimeSavings, ref.lifetime, 1e-6);
});

test('a longer new term lowers the payment but can cost more over the loan', () => {
  const input = { ...EXAMPLE, newRate: 8.5, newTermMonths: 72 };
  const result = calculateAutoLoanRefinance(input);
  assert.ok(result.monthlySavings > 0);
  assert.ok(result.lifetimeSavings < 0);
  assert.equal(result.extraMonths, 24);
  const ref = reference(input);
  close(result.lifetimeSavings, ref.lifetime, 1e-6);
  assert.equal(result.aheadWindow?.fromMonth ?? null, ref.firstAhead);
});

test('prepayment penalty and fees financed into the new loan', () => {
  const input = { ...EXAMPLE, prepaymentPenalty: 200, financeCosts: true };
  const result = calculateAutoLoanRefinance(input);
  close(result.newPrincipal, 22500);
  close(result.cashCosts, 0);
  close(result.refinanceCosts, 500);
  const ref = reference(input);
  close(result.lifetimeSavings, ref.lifetime, 1e-6);
  for (const month of [1, 12, 24, 48]) close(result.netSavingsAt(month), ref.net[month - 1], 1e-6);
});

test('random offers match the independent simulation', () => {
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 300; run += 1) {
    const input = {
      currentBalance: Math.round(3000 + rand() * 60000),
      currentRate: Math.round(rand() * 2000) / 100,
      currentTermMonths: 6 + Math.floor(rand() * 79),
      newRate: Math.round(rand() * 1500) / 100,
      newTermMonths: 12 + Math.floor(rand() * 73),
      fees: Math.round(rand() * 800),
      prepaymentPenalty: rand() < 0.3 ? Math.round(rand() * 400) : 0,
      financeCosts: rand() < 0.5
    };
    const result = calculateAutoLoanRefinance(input);
    const ref = reference(input);
    close(result.currentPayment, ref.keep.pay, 1e-8);
    close(result.newPayment, ref.refi.pay, 1e-8);
    close(result.lifetimeSavings, ref.lifetime, 1e-5);
    assert.equal(result.aheadWindow?.fromMonth ?? null, ref.firstAhead, JSON.stringify(input));
    const probe = Math.min(input.currentTermMonths, input.newTermMonths);
    close(result.netSavingsAt(probe), ref.net[probe - 1], 1e-5);
  }
});

test('invalid costs are rejected; engine validation still applies', () => {
  assert.throws(() => calculateAutoLoanRefinance({ ...EXAMPLE, fees: -1 }), RangeError);
  assert.throws(() => calculateAutoLoanRefinance({ ...EXAMPLE, prepaymentPenalty: Number.NaN }), RangeError);
  assert.throws(() => calculateAutoLoanRefinance({ ...EXAMPLE, currentBalance: 0 }), RangeError);
  assert.throws(() => calculateAutoLoanRefinance({ ...EXAMPLE, newTermMonths: 0 }), RangeError);
});
