import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateLoanPayoff, extraNeededForTarget } from '../src/calculators/loan-payoff.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent reference simulation, written without the engines. Extras are
// applied after the scheduled payment and capped at what is owed.
function simulate({ balance, annualRate, payment, extraMonthly = 0, extraYearly = 0, lumpSum = 0, lumpSumMonth = 1 }) {
  const i = annualRate / 1200;
  let owed = balance;
  let interest = 0;
  let months = 0;
  while (owed > 0.005) {
    months += 1;
    const charge = owed * i;
    interest += charge;
    owed = owed + charge - Math.min(payment, owed + charge);
    const extra = extraMonthly + (months % 12 === 0 ? extraYearly : 0) + (months === lumpSumMonth ? lumpSum : 0);
    owed -= Math.min(extra, owed);
    if (months > 2000) throw new Error('runaway');
  }
  return { months, interest };
}

// Closed-form months to pay off with a fixed payment: n = −ln(1 − rB/P) / ln(1 + r).
const closedFormMonths = (balance, annualRate, payment) => {
  const r = annualRate / 1200;
  return Math.ceil(-Math.log(1 - r * balance / payment) / Math.log(1 + r) - 1e-9);
};

const EXAMPLE = { balance: 250000, annualRate: 6.5, payment: 1580.17 };

test('baseline payoff matches the closed form and the reference simulation', () => {
  const result = calculateLoanPayoff(EXAMPLE);
  assert.equal(result.base.months, closedFormMonths(EXAMPLE.balance, EXAMPLE.annualRate, EXAMPLE.payment));
  const ref = simulate(EXAMPLE);
  assert.equal(result.base.months, ref.months);
  close(result.base.totalInterest, ref.interest, 1e-6);
  assert.equal(result.monthsSaved, 0);
});

test('hand-checked plan: $200 a month extra plus $5,000 once in month 12', () => {
  const input = { ...EXAMPLE, extraMonthly: 200, lumpSum: 5000, lumpSumMonth: 12 };
  const result = calculateLoanPayoff(input);
  const ref = simulate(input);
  assert.equal(result.plan.months, ref.months);
  close(result.plan.totalInterest, ref.interest, 1e-6);
  close(result.interestSaved, simulate(EXAMPLE).interest - ref.interest, 1e-6);
  assert.ok(result.monthsSaved > 60);
  close(result.plan.totalPaid, 250000 + result.plan.totalInterest, 1e-6);
});

test('the extra needed for a target date pays off on time, and a cent less does not', () => {
  for (const extras of [{}, { extraYearly: 1000 }, { lumpSum: 10000, lumpSumMonth: 6 }]) {
    const input = { ...EXAMPLE, ...extras };
    for (const targetMonths of [60, 120, 180, 240]) {
      const extra = extraNeededForTarget({ ...input, targetMonths });
      assert.ok(simulate({ ...input, extraMonthly: extra + 1e-7 }).months <= targetMonths, JSON.stringify({ extras, targetMonths }));
      if (extra > 0.01) assert.ok(simulate({ ...input, extraMonthly: extra - 0.01 }).months > targetMonths);
    }
  }
  const result = calculateLoanPayoff({ ...EXAMPLE, targetMonths: 180 });
  assert.equal(result.plan.months, 180);
  assert.equal(result.target.alreadyMet, false);
  assert.equal(calculateLoanPayoff({ ...EXAMPLE, targetMonths: 400 }).target.alreadyMet, true);
});

test('random plans match the reference simulation', () => {
  let seed = 17;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 300; run += 1) {
    const balance = Math.round(1000 + rand() * 600000);
    const annualRate = Math.round(rand() * 1500) / 100;
    // At least the payment that clears the balance in 40 years, so every plan ends.
    const i = annualRate / 1200;
    const floor = i === 0 ? balance / 480 : balance * i / (1 - (1 + i) ** -480);
    const input = {
      balance,
      annualRate,
      payment: Math.round((floor + 1 + rand() * balance / 60) * 100) / 100,
      extraMonthly: rand() < 0.5 ? Math.round(rand() * 500) : 0,
      extraYearly: rand() < 0.3 ? Math.round(rand() * 5000) : 0,
      lumpSum: rand() < 0.3 ? Math.round(rand() * 20000) : 0,
      lumpSumMonth: 1 + Math.floor(rand() * 36)
    };
    const result = calculateLoanPayoff(input);
    const ref = simulate(input);
    assert.equal(result.plan.months, ref.months, JSON.stringify(input));
    close(result.plan.totalInterest, ref.interest, 1e-5);
    close(result.plan.totalPaid, balance + result.plan.totalInterest, 1e-5);
  }
});

test('zero rate, overpaying lump sums and invalid inputs', () => {
  const zero = calculateLoanPayoff({ balance: 12000, annualRate: 0, payment: 500, lumpSum: 50000, lumpSumMonth: 3 });
  assert.equal(zero.plan.months, 3);
  close(zero.plan.totalPaid, 12000);
  assert.throws(() => calculateLoanPayoff({ ...EXAMPLE, payment: 1354.16 }), /interest/);
  assert.throws(() => calculateLoanPayoff({ ...EXAMPLE, balance: 0 }), RangeError);
  assert.throws(() => calculateLoanPayoff({ ...EXAMPLE, extraMonthly: -1 }), RangeError);
  assert.throws(() => calculateLoanPayoff({ ...EXAMPLE, lumpSumMonth: 0 }), RangeError);
  assert.throws(() => calculateLoanPayoff({ ...EXAMPLE, targetMonths: 0 }), RangeError);
});
