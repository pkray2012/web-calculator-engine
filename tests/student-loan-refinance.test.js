import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateStudentLoanRefinance } from '../src/calculators/student-loan-refinance.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent month-by-month simulation, written without the engines.
function simulate(principal, rate, n) {
  const i = rate / 1200;
  const pay = i === 0 ? principal / n : principal * i / (1 - (1 + i) ** -n);
  let balance = principal;
  let paid = 0;
  for (let month = 1; month <= n; month += 1) {
    const due = Math.min(pay, balance * (1 + i));
    balance = balance * (1 + i) - due;
    paid += due;
  }
  return { pay, paid, interest: paid - principal };
}

const EXAMPLE = { balance: 35000, currentRate: 6.8, currentTermMonths: 120, newRate: 5.5, newTermMonths: 120 };

test('hand-checked example: $35,000 from 6.8% to 5.5% over the same 10 years', () => {
  const result = calculateStudentLoanRefinance(EXAMPLE);
  close(result.current.payment, 402.78, 0.005);
  close(result.refinance.payment, 379.84, 0.005);
  const keep = simulate(35000, 6.8, 120);
  const refi = simulate(35000, 5.5, 120);
  close(result.lifetimeSavings, keep.paid - refi.paid, 1e-6);
  close(result.sameTerm.lifetimeSavings, result.lifetimeSavings, 1e-9);
  assert.equal(result.extraMonths, 0);
});

test('a longer term lowers the payment but can cost more in total', () => {
  const result = calculateStudentLoanRefinance({ ...EXAMPLE, newTermMonths: 240 });
  assert.ok(result.monthlySavings > 0);
  assert.ok(result.lifetimeSavings < 0);
  assert.ok(result.sameTerm.lifetimeSavings > 0);
  const refi = simulate(35000, 5.5, 240);
  close(result.refinance.totalInterest, refi.interest, 1e-6);
  assert.equal(result.extraMonths, 120);
});

test('term options cover common terms plus both chosen terms, and fees count once', () => {
  const result = calculateStudentLoanRefinance({ ...EXAMPLE, currentTermMonths: 100, newTermMonths: 150, fees: 250 });
  assert.deepEqual(result.options.map((row) => row.termMonths), [60, 84, 100, 120, 150, 180, 240]);
  assert.equal(result.options.find((row) => row.selected).termMonths, 150);
  assert.equal(result.options.find((row) => row.current).termMonths, 100);
  const keep = simulate(35000, 6.8, 100);
  for (const row of result.options) {
    const refi = simulate(35000, 5.5, row.termMonths);
    close(row.payment, refi.pay, 1e-9);
    close(row.lifetimeSavings, keep.paid - refi.paid - 250, 1e-6);
  }
});

test('random refinances match the independent simulation', () => {
  let seed = 5;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 300; run += 1) {
    const input = {
      balance: Math.round(2000 + rand() * 250000),
      currentRate: Math.round(rand() * 1400) / 100,
      currentTermMonths: 12 + Math.floor(rand() * 289),
      newRate: Math.round(rand() * 1200) / 100,
      newTermMonths: [60, 84, 120, 180, 240][Math.floor(rand() * 5)],
      fees: rand() < 0.3 ? Math.round(rand() * 1000) : 0
    };
    const result = calculateStudentLoanRefinance(input);
    const keep = simulate(input.balance, input.currentRate, input.currentTermMonths);
    const refi = simulate(input.balance, input.newRate, input.newTermMonths);
    close(result.current.payment, keep.pay, 1e-8);
    close(result.refinance.payment, refi.pay, 1e-8);
    close(result.lifetimeSavings, keep.paid - refi.paid - input.fees, 1e-5);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateStudentLoanRefinance({ ...EXAMPLE, fees: -1 }), RangeError);
  assert.throws(() => calculateStudentLoanRefinance({ ...EXAMPLE, balance: 0 }), RangeError);
  assert.throws(() => calculateStudentLoanRefinance({ ...EXAMPLE, newTermMonths: 0 }), RangeError);
  assert.throws(() => calculateStudentLoanRefinance({ ...EXAMPLE, newRate: -1 }), RangeError);
});
