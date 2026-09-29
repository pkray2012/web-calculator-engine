import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompoundInterest, monthlyFactor } from '../src/calculators/compound-interest.js';

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

// References from an independent Python calculation (40-digit decimals, closed form).
test('$10,000 plus $200 a month at 7% compounded monthly for 20 years', () => {
  const result = calculateCompoundInterest({ initialDeposit: 10000, monthlyContribution: 200, ratePercent: 7, compounding: 'monthly', years: 20, inflationPercent: 3 });
  close(result.futureValue, 144572.720454924);
  assert.equal(result.totalContributed, 58000);
  close(result.totalInterest, 86572.720454924);
  // Simple interest: interest is paid on deposits only, never on interest.
  close(result.simpleInterestValue, 105460);
  close(result.realValue, 144572.720454924 / 1.03 ** 20);
  assert.equal(result.schedule.length, 20);
  close(result.schedule.at(-1).balance, result.futureValue);
  close(result.doublingYears, 9.93095571466766);
  close(result.ruleOf72Years, 72 / 7);
});

test('a lump sum at 5% compounded daily for 10 years', () => {
  close(calculateCompoundInterest({ initialDeposit: 5000, monthlyContribution: 0, ratePercent: 5, compounding: 'daily', years: 10 }).futureValue, 8243.32406882736);
});

test('start-of-month contributions at 6% compounded quarterly for 30 years', () => {
  close(calculateCompoundInterest({ initialDeposit: 0, monthlyContribution: 500, ratePercent: 6, compounding: 'quarterly', years: 30, contributionTiming: 'start' }).futureValue, 501893.389435700, 1e-5);
});

test('continuous compounding', () => {
  close(calculateCompoundInterest({ initialDeposit: 1000, monthlyContribution: 100, ratePercent: 4, compounding: 'continuously', years: 5 }).futureValue, 7852.42151513273);
  close(monthlyFactor(0.04, 'continuously') ** 12, Math.exp(0.04), 1e-12);
});

test('a zero rate returns the deposits and no doubling time', () => {
  const result = calculateCompoundInterest({ initialDeposit: 1000, monthlyContribution: 50, ratePercent: 0, compounding: 'monthly', years: 2 });
  close(result.futureValue, 2200);
  assert.equal(result.doublingYears, null);
  assert.equal(result.ruleOf72Years, null);
});

test('invalid inputs are rejected', () => {
  const base = { initialDeposit: 1000, monthlyContribution: 0, ratePercent: 5, compounding: 'monthly', years: 5 };
  assert.throws(() => calculateCompoundInterest({ ...base, initialDeposit: 0 }), RangeError);
  assert.throws(() => calculateCompoundInterest({ ...base, years: 2.5 }), RangeError);
  assert.throws(() => calculateCompoundInterest({ ...base, compounding: 'hourly' }), RangeError);
  assert.throws(() => calculateCompoundInterest({ ...base, ratePercent: -1 }), RangeError);
});
