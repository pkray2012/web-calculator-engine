import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateMortgagePayment } from '../src/calculators/mortgage-payment.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent references, written without the engines.
const payment = (principal, rate, n) => {
  const i = rate / 1200;
  return i === 0 ? principal / n : principal * i / (1 - (1 + i) ** -n);
};
// Closed-form scheduled balance after k payments.
const balanceAfter = (principal, rate, n, k) => {
  const i = rate / 1200;
  if (i === 0) return principal - principal / n * k;
  return principal * (1 + i) ** k - payment(principal, rate, n) * ((1 + i) ** k - 1) / i;
};
const firstAtOrBelow = (principal, rate, n, target) => {
  for (let k = 1; k <= n; k += 1) if (balanceAfter(principal, rate, n, k) <= target + 1e-6) return k;
  return null;
};

const EXAMPLE = { homePrice: 400000, downPayment: 40000, annualRate: 6.5, termMonths: 360, propertyTaxYearly: 4800, insuranceYearly: 1800, pmiRate: 0.5, hoaMonthly: 0 };

test('hand-checked example: $400,000 home, 10% down, 6.5% for 30 years', () => {
  const result = calculateMortgagePayment(EXAMPLE);
  close(result.loanAmount, 360000);
  close(result.ltv, 90);
  close(result.monthly.principalAndInterest, 2275.44, 0.005);
  close(result.monthly.propertyTax, 400);
  close(result.monthly.insurance, 150);
  close(result.monthly.pmi, 150);
  close(result.totalMonthly, 2975.44, 0.005);
  close(result.totalMonthlyAfterPmi, 2825.44, 0.005);
  assert.equal(result.pmi.canRequestMonth, firstAtOrBelow(360000, 6.5, 360, 320000));
  assert.equal(result.pmi.autoEndMonth, firstAtOrBelow(360000, 6.5, 360, 312000));
  assert.ok(result.pmi.canRequestMonth < result.pmi.autoEndMonth);
  close(result.pmi.total, 150 * result.pmi.autoEndMonth);
});

test('20% or more down means no PMI and no PMI dates', () => {
  const result = calculateMortgagePayment({ ...EXAMPLE, downPayment: 80000 });
  assert.equal(result.pmi.required, false);
  assert.equal(result.monthly.pmi, 0);
  assert.equal(result.pmi.autoEndMonth, null);
  close(result.totalMonthly, result.totalMonthlyAfterPmi);
});

test('random loans: payment, PMI dates and lifetime cost match the references', () => {
  let seed = 23;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 300; run += 1) {
    const homePrice = Math.round(80000 + rand() * 1500000);
    const input = {
      homePrice,
      downPayment: Math.round(homePrice * rand() * 0.4),
      annualRate: Math.round(rand() * 1000) / 100,
      termMonths: [180, 240, 360][Math.floor(rand() * 3)],
      propertyTaxYearly: Math.round(rand() * 20000),
      insuranceYearly: Math.round(rand() * 5000),
      pmiRate: Math.round(rand() * 150) / 100,
      hoaMonthly: rand() < 0.3 ? Math.round(rand() * 500) : 0
    };
    const result = calculateMortgagePayment(input);
    const loan = homePrice - input.downPayment;
    const pi = payment(loan, input.annualRate, input.termMonths);
    close(result.monthly.principalAndInterest, pi, 1e-8);
    const high = loan / homePrice > 0.8;
    const auto = high ? firstAtOrBelow(loan, input.annualRate, input.termMonths, homePrice * 0.78) : null;
    assert.equal(result.pmi.autoEndMonth, auto, JSON.stringify(input));
    assert.equal(result.pmi.canRequestMonth, high ? firstAtOrBelow(loan, input.annualRate, input.termMonths, homePrice * 0.8) : null);
    const pmiMonthly = high && input.pmiRate > 0 ? loan * input.pmiRate / 1200 : 0;
    close(result.totalMonthly, pi + input.propertyTaxYearly / 12 + input.insuranceYearly / 12 + pmiMonthly + input.hoaMonthly, 1e-8);
    const n = result.payments;
    const expectedLifetime = input.downPayment + result.schedule.reduce((sum, row) => sum + row.payment, 0)
      + pmiMonthly * (pmiMonthly ? auto : 0) + (input.propertyTaxYearly / 12 + input.insuranceYearly / 12 + input.hoaMonthly) * n;
    close(result.lifetimeCost, expectedLifetime, 1e-4);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateMortgagePayment({ ...EXAMPLE, downPayment: 400000 }), RangeError);
  assert.throws(() => calculateMortgagePayment({ ...EXAMPLE, homePrice: 0 }), RangeError);
  assert.throws(() => calculateMortgagePayment({ ...EXAMPLE, pmiRate: -1 }), RangeError);
  assert.throws(() => calculateMortgagePayment({ ...EXAMPLE, termMonths: 0 }), RangeError);
});
