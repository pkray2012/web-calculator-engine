import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateHomeEquityLoan, borrowingCapacity } from '../src/calculators/home-equity-loan.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent references, written without the engines.
function payment(principal, rate, n) {
  const i = rate / 1200;
  return i === 0 ? principal / n : principal * i / (1 - (1 + i) ** -n);
}
function simulate(principal, rate, n) {
  const i = rate / 1200;
  const pay = payment(principal, rate, n);
  let balance = principal;
  let interest = 0;
  for (let month = 1; month <= n; month += 1) {
    const charge = balance * i;
    interest += charge;
    balance = balance + charge - Math.min(pay, balance + charge);
  }
  return { pay, interest };
}

const EXAMPLE = { homeValue: 400000, mortgageBalance: 240000, loanAmount: 50000, annualRate: 8.25, termMonths: 180, closingCosts: 1500 };

test('hand-checked example: $400,000 home, $240,000 owed, $50,000 at 8.25% for 15 years', () => {
  const result = calculateHomeEquityLoan(EXAMPLE);
  close(result.equity, 160000);
  close(result.currentCltv, 60);
  close(result.newCltv, 72.5);
  assert.deepEqual(result.limits.map((row) => row.capacity), [80000, 100000, 120000]);
  assert.deepEqual(result.limits.map((row) => row.fits), [true, true, true]);
  close(result.cashReceived, 48500);
  close(result.monthlyPayment, 485.07, 0.005);
  const ref = simulate(50000, 8.25, 180);
  close(result.monthlyPayment, ref.pay, 1e-9);
  close(result.totalInterest, ref.interest, 1e-6);
  close(result.costOfBorrowing, ref.interest + 1500, 1e-6);
});

test('financed closing costs raise the balance and the CLTV but not the cash received', () => {
  const result = calculateHomeEquityLoan({ ...EXAMPLE, financeClosingCosts: true });
  close(result.principal, 51500);
  close(result.cashReceived, 50000);
  close(result.newCltv, 72.875);
  close(result.monthlyPayment, simulate(51500, 8.25, 180).pay, 1e-9);
});

test('a loan above the cap is flagged per CLTV limit, and capacity never goes negative', () => {
  const result = calculateHomeEquityLoan({ ...EXAMPLE, loanAmount: 110000 });
  assert.deepEqual(result.limits.map((row) => row.fits), [false, false, true]);
  assert.equal(borrowingCapacity({ homeValue: 300000, existingDebt: 280000, cltvPercent: 85 }), 0);
});

test('random loans match the independent references', () => {
  let seed = 3;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 300; run += 1) {
    const homeValue = Math.round(100000 + rand() * 1400000);
    const input = {
      homeValue,
      mortgageBalance: Math.round(rand() * homeValue * 0.8),
      otherLiens: rand() < 0.2 ? Math.round(rand() * 20000) : 0,
      loanAmount: Math.round(5000 + rand() * 200000),
      annualRate: Math.round(rand() * 1400) / 100,
      termMonths: [60, 120, 180, 240, 360][Math.floor(rand() * 5)],
      closingCosts: Math.round(rand() * 5000),
      financeClosingCosts: rand() < 0.5
    };
    const result = calculateHomeEquityLoan(input);
    const principal = input.loanAmount + (input.financeClosingCosts ? input.closingCosts : 0);
    const ref = simulate(principal, input.annualRate, input.termMonths);
    close(result.monthlyPayment, ref.pay, 1e-8);
    close(result.totalInterest, ref.interest, 1e-5);
    const debt = input.mortgageBalance + input.otherLiens;
    close(result.newCltv, (debt + principal) / homeValue * 100, 1e-9);
    for (const row of result.limits) {
      close(row.capacity, Math.max(0, homeValue * row.cltvPercent / 100 - debt), 1e-6);
      assert.equal(row.fits, (debt + principal) / homeValue * 100 <= row.cltvPercent + 1e-9);
    }
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateHomeEquityLoan({ ...EXAMPLE, homeValue: 0 }), RangeError);
  assert.throws(() => calculateHomeEquityLoan({ ...EXAMPLE, mortgageBalance: -1 }), RangeError);
  assert.throws(() => calculateHomeEquityLoan({ ...EXAMPLE, closingCosts: Number.NaN }), RangeError);
  assert.throws(() => calculateHomeEquityLoan({ ...EXAMPLE, loanAmount: 0 }), RangeError);
});
