import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateMortgagePoints } from '../src/calculators/mortgage-points.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent closed forms, written without the engines.
function payment(principal, rate, n) {
  const i = rate / 1200;
  return i === 0 ? principal / n : principal * i / (1 - (1 + i) ** -n);
}
function balanceAfter(principal, rate, n, k) {
  const i = rate / 1200;
  if (i === 0) return principal - (principal / n) * k;
  const m = payment(principal, rate, n);
  return principal * (1 + i) ** k - m * ((1 + i) ** k - 1) / i;
}
// Interest paid through month k = payments made − principal repaid.
const interestThrough = (principal, rate, n, k) => payment(principal, rate, n) * k - (principal - balanceAfter(principal, rate, n, k));

function reference({ loanAmount, termMonths, baseRate, pointsRate, points }) {
  const cost = loanAmount * points / 100;
  const net = (k) => interestThrough(loanAmount, baseRate, termMonths, k) - interestThrough(loanAmount, pointsRate, termMonths, k) - cost;
  let breakEven = null;
  for (let k = 1; k <= termMonths; k += 1) if (net(k) > 0) { breakEven = k; break; }
  return { cost, net, breakEven };
}

const EXAMPLE = { loanAmount: 300000, termMonths: 360, baseRate: 7, pointsRate: 6.75, points: 1 };

test('hand-checked example: $300,000, 30 years, 7% vs 6.75% for one point', () => {
  const result = calculateMortgagePoints(EXAMPLE);
  close(result.pointsCost, 3000);
  close(result.basePayment, 1995.91, 0.005);
  close(result.pointsPayment, 1945.79, 0.005);
  close(result.monthlySavings, 50.11, 0.005);
  close(result.simpleBreakEvenMonths, 59.86, 0.005);
  close(result.rateReductionPerPoint, 0.25);
  const ref = reference(EXAMPLE);
  assert.equal(result.breakEvenMonth, ref.breakEven);
  assert.ok(result.breakEvenMonth < result.simpleBreakEvenMonths, 'counting the lower balance breaks even sooner');
  close(result.netSavingsAt(84), ref.net(84), 1e-6);
  close(result.lifetimeSavings, ref.net(360), 1e-6);
});

test('true break-even equals the first month cumulative interest saved exceeds the points cost', () => {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 300; run += 1) {
    const input = {
      loanAmount: Math.round(50000 + rand() * 950000),
      termMonths: [120, 180, 240, 360][Math.floor(rand() * 4)],
      baseRate: Math.round((2 + rand() * 8) * 1000) / 1000,
      points: Math.round(rand() * 4 * 8) / 8
    };
    input.pointsRate = Math.max(0, Math.round((input.baseRate - rand() * 1) * 1000) / 1000);
    const result = calculateMortgagePoints(input);
    const ref = reference(input);
    assert.equal(result.breakEvenMonth, ref.breakEven, JSON.stringify(input));
    for (const k of [1, 12, 60, input.termMonths]) close(result.netSavingsAt(k), ref.net(k), 1e-5);
    close(result.pointsCost, ref.cost);
  }
});

test('net savings only grow over time, so once ahead the points loan stays ahead', () => {
  const result = calculateMortgagePoints({ ...EXAMPLE, points: 2, pointsRate: 6.6 });
  for (let k = 2; k <= 360; k += 1) assert.ok(result.netSavingsAt(k) > result.netSavingsAt(k - 1));
});

test('points that do not lower the rate never break even', () => {
  const result = calculateMortgagePoints({ ...EXAMPLE, pointsRate: 7 });
  assert.equal(result.breakEvenMonth, null);
  assert.equal(result.simpleBreakEvenMonths, null);
  close(result.lifetimeSavings, -3000);
});

test('zero points with a lower rate is ahead from month one', () => {
  const result = calculateMortgagePoints({ ...EXAMPLE, points: 0 });
  assert.equal(result.breakEvenMonth, 1);
  close(result.simpleBreakEvenMonths, 0);
  assert.equal(result.rateReductionPerPoint, null);
});

test('zero-rate option is handled', () => {
  const input = { loanAmount: 120000, termMonths: 120, baseRate: 1, pointsRate: 0, points: 1 };
  const result = calculateMortgagePoints(input);
  close(result.pointsPayment, 1000);
  assert.equal(result.breakEvenMonth, reference(input).breakEven);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateMortgagePoints({ ...EXAMPLE, pointsRate: 7.25 }), RangeError);
  assert.throws(() => calculateMortgagePoints({ ...EXAMPLE, points: -1 }), RangeError);
  assert.throws(() => calculateMortgagePoints({ ...EXAMPLE, loanAmount: 0 }), RangeError);
  assert.throws(() => calculateMortgagePoints({ ...EXAMPLE, termMonths: 12.5 }), RangeError);
  assert.throws(() => calculateMortgagePoints({ ...EXAMPLE, baseRate: Number.NaN }), RangeError);
});
